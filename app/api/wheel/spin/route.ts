import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { wheelSpinLimiter, getIP } from '@/lib/ratelimit'
import { sendPushToCard } from '@/lib/push/sendPush'
import { notifyWalletDevices } from '@/lib/wallet/push'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'
import { atomicDeductPointsSafe, atomicIncrementPoints, atomicIncrementStamps } from '@/lib/db/atomic'
import { verifyCardToken } from '@/lib/auth/cardToken'
import { cardUrl } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const { success } = await wheelSpinLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
    }

    const { cardId, businessId } = await request.json()

    if (!cardId || !businessId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: business } = await supabase
      .from('businesses')
      .select('id, business_name, gamification, loyalty_type')
      .eq('id', businessId)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    const gamification = business.gamification ?? {}

    if (!gamification.wheel_enabled || business.loyalty_type !== 'points') {
      return NextResponse.json({ error: 'Roue désactivée' }, { status: 400 })
    }

    const cost = gamification.wheel_cost_points ?? 10

    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('id, current_points, qr_code_id')
      .eq('id', cardId)
      .eq('business_id', businessId)
      .single()

    if (!card) {
      return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
    }

    const token = request.headers.get('x-card-token')
    if (!token || !verifyCardToken(token, card.qr_code_id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    if ((card.current_points ?? 0) < cost) {
      return NextResponse.json({ error: `Points insuffisants (${card.current_points ?? 0}/${cost})` }, { status: 400 })
    }

    // Fetch prizes
    const { data: prizes } = await supabase
      .from('wheel_prizes')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })

    if (!prizes || prizes.length < 2) {
      return NextResponse.json({ error: 'Roue non configurée' }, { status: 400 })
    }

    // Weighted random selection
    const totalWeight = prizes.reduce((sum, p) => sum + p.probability, 0)
    let random = Math.random() * totalWeight
    let winner = prizes[0]
    for (const prize of prizes) {
      random -= prize.probability
      if (random <= 0) {
        winner = prize
        break
      }
    }

    // Atomic deduct points for spin cost
    const { success: deductOk, newBalance } = await atomicDeductPointsSafe(supabase, card.id, cost)

    if (!deductOk) {
      return NextResponse.json({ error: `Points insuffisants` }, { status: 400 })
    }

    let newPoints = newBalance

    // Apply reward
    let bonusPoints = 0
    let bonusStamps = 0
    let multiplierApplied = false

    if (winner.reward_type === 'double_points') {
      // Store x2 multiplier on card — applied on next scan, no immediate points
      await supabase
        .from('loyalty_cards')
        .update({ points_multiplier: 2 })
        .eq('id', card.id)
      multiplierApplied = true
    } else if (winner.reward_type === 'bonus_points') {
      bonusPoints = winner.reward_value ?? 0
      if (bonusPoints > 0) {
        newPoints = await atomicIncrementPoints(supabase, card.id, bonusPoints)
      }
    } else if (winner.reward_type === 'bonus_stamps') {
      bonusStamps = winner.reward_value ?? 0
      if (bonusStamps > 0) {
        await atomicIncrementStamps(supabase, card.id, bonusStamps)
      }
    }

    // Log spin
    await supabase.from('wheel_spins').insert({
      card_id: card.id,
      business_id: businessId,
      points_spent: cost,
      prize_id: winner.id,
      prize_label: winner.label,
    })

    // Log transaction
    const rewardDesc = winner.reward_type === 'double_points'
      ? 'Double points (prochain scan)'
      : winner.reward_type === 'bonus_points'
        ? `+${bonusPoints} point${bonusPoints > 1 ? 's' : ''}`
        : winner.reward_type === 'bonus_stamps'
          ? `+${bonusStamps} tampon${bonusStamps > 1 ? 's' : ''}`
          : winner.reward_description || winner.label

    await supabase.from('transactions').insert({
      loyalty_card_id: card.id,
      business_id: businessId,
      type: 'redeem',
      stamps_added: bonusStamps > 0 ? bonusStamps : null,
      points_added: bonusPoints > 0 ? bonusPoints : null,
      description: `Roue de la fortune : ${winner.label} (${rewardDesc}) — ${cost} pts dépensés`,
    })

    // Push notification
    const pushBody = winner.reward_type === 'double_points'
      ? 'Votre prochain scan vous rapportera le double de points ! 🎯'
      : `🎡 Vous avez gagné : ${winner.label} !`
    sendPushToCard(card.id, {
      title: 'Izou',
      body: pushBody,
      url: cardUrl(card.qr_code_id),
    }).catch((err) => console.error('Wheel push error:', err))

    // Update wallet
    setPendingWalletAction(card.qr_code_id, 'add')
    await notifyWalletDevices(card.qr_code_id).catch((err) =>
      console.error('Wallet push error (wheel spin):', err)
    )

    // Return winning segment index for animation
    const winnerIndex = prizes.findIndex(p => p.id === winner.id)

    return NextResponse.json({
      success: true,
      prize: {
        id: winner.id,
        label: winner.label,
        emoji: winner.emoji,
        reward_type: winner.reward_type,
        reward_value: winner.reward_value,
        reward_description: winner.reward_type === 'double_points'
          ? 'Votre prochain scan vous rapportera le double de points ! 🎯'
          : winner.reward_description,
      },
      winner_index: winnerIndex,
      new_points: multiplierApplied ? newPoints : newPoints + bonusPoints,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
