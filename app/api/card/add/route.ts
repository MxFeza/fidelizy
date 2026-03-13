import { createClient } from '@/lib/supabase/server'
import { notifyWalletDevices } from '@/lib/wallet/push'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'
import { NextRequest, NextResponse } from 'next/server'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'
import { sendPushToCard } from '@/lib/push/sendPush'
import { atomicIncrementPoints, atomicIncrementStamps } from '@/lib/db/atomic'

export async function POST(request: NextRequest) {
  try {
    const { success } = await cardWriteLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessaie dans quelques secondes.' }, { status: 429 })
    }

    const { card_id, type, amount } = await request.json()

    if (!card_id || !type || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    if (type !== 'stamps' && type !== 'points') {
      return NextResponse.json({ error: 'Type invalide (stamps ou points)' }, { status: 400 })
    }

    if (!Number.isInteger(amount) || amount > 1000) {
      return NextResponse.json({ error: 'Montant invalide (entier entre 1 et 1000)' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id, business_name, stamps_required, stamps_reward, loyalty_type, points_per_euro, gamification')
      .eq('id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('id, current_stamps, current_points, total_visits, business_id, qr_code_id, points_multiplier')
      .eq('id', card_id)
      .eq('business_id', business.id)
      .single()

    if (!card) {
      return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
    }

    const gamification = business.gamification ?? {}
    let message = ''
    let surprise: { triggered: boolean; message?: string } = { triggered: false }

    if (type === 'stamps') {
      const stampsRequired = business.stamps_required ?? 10

      // Atomic stamp increment
      let rawNew = await atomicIncrementStamps(supabase, card.id, amount)

      // — Surprise bonus (stamps) —
      if (
        rawNew < stampsRequired &&
        gamification.surprise_enabled &&
        gamification.surprise_reward_type === 'bonus_stamp'
      ) {
        const prob = gamification.surprise_probability ?? 0.2
        const bonusValue = gamification.surprise_reward_value ?? 1
        if (Math.random() < prob) {
          rawNew = await atomicIncrementStamps(supabase, card.id, bonusValue)

          await supabase.from('transactions').insert({
            loyalty_card_id: card.id,
            business_id: business.id,
            type: 'earn',
            stamps_added: bonusValue,
            points_added: null,
            description: `Surprise ! +${bonusValue} tampon${bonusValue > 1 ? 's' : ''} bonus`,
          })

          const surpriseMsg = `Surprise ! +${bonusValue} tampon${bonusValue > 1 ? 's' : ''} bonus aujourd'hui 🎉`
          surprise = { triggered: true, message: surpriseMsg }

          sendPushToCard(card.id, {
            title: 'Izou',
            body: surpriseMsg,
            url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
          }).catch((err) => console.error('Surprise push error:', err))
        }
      }

      const isComplete = rawNew >= stampsRequired
      const finalStamps = isComplete ? 0 : rawNew

      if (isComplete) {
        await supabase
          .from('loyalty_cards')
          .update({ current_stamps: 0 })
          .eq('id', card.id)
      }

      // Update visits (non-critical)
      await supabase
        .from('loyalty_cards')
        .update({
          total_visits: (card.total_visits ?? 0) + amount,
          last_visit_at: new Date().toISOString(),
        })
        .eq('id', card.id)

      await supabase.from('transactions').insert({
        loyalty_card_id: card.id,
        business_id: business.id,
        type: 'earn',
        stamps_added: amount,
        points_added: null,
        description: `${amount} tampon${amount > 1 ? 's' : ''} ajouté${amount > 1 ? 's' : ''} (${rawNew}/${stampsRequired})`,
      })

      if (isComplete) {
        await supabase.from('transactions').insert({
          loyalty_card_id: card.id,
          business_id: business.id,
          type: 'redeem',
          stamps_added: null,
          points_added: null,
          description: `Récompense accordée — carte réinitialisée (${stampsRequired}/${stampsRequired})`,
        })
        message = `+${amount} tampon${amount > 1 ? 's' : ''} — Carte complète ! Récompense : ${business.stamps_reward}. Carte remise à 0.`
      } else {
        message = `+${amount} tampon${amount > 1 ? 's' : ''} (${finalStamps}/${stampsRequired})`
      }

      if (isComplete) {
        setPendingWalletAction(card.qr_code_id, 'add', 0)
        sendPushToCard(card.id, {
          title: 'Izou',
          body: '🎉 Récompense débloquée ! Montre ta carte au comptoir.',
          url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
        }).catch((err) => console.error('Reward push error:', err))
      } else {
        const remaining = stampsRequired - finalStamps
        setPendingWalletAction(card.qr_code_id, 'add', remaining)

        // — Goal gradient notification (stamps) —
        if (remaining === 1 && gamification.goal_gradient_notification !== false) {
          sendPushToCard(card.id, {
            title: 'Izou',
            body: 'Plus qu\'un passage et votre récompense est à vous ! 🎁',
            url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
          }).catch((err) => console.error('Goal gradient push error:', err))
        }
      }

      await notifyWalletDevices(card.qr_code_id).catch((err) =>
        console.error('Wallet push error (add stamps):', err)
      )

      return NextResponse.json({
        success: true,
        message,
        new_value: finalStamps,
        ...(surprise.triggered && { surprise }),
      })
    } else {
      const multiplier = card.points_multiplier ?? 1
      const effectiveAmount = amount * multiplier
      const previousPoints = card.current_points ?? 0

      // Atomic point increment
      let newPoints = await atomicIncrementPoints(supabase, card.id, effectiveAmount)

      // — Surprise bonus (points) —
      if (
        gamification.surprise_enabled &&
        gamification.surprise_reward_type === 'bonus_points'
      ) {
        const prob = gamification.surprise_probability ?? 0.2
        const bonusValue = gamification.surprise_reward_value ?? 1
        if (Math.random() < prob) {
          newPoints = await atomicIncrementPoints(supabase, card.id, bonusValue)

          await supabase.from('transactions').insert({
            loyalty_card_id: card.id,
            business_id: business.id,
            type: 'earn',
            stamps_added: null,
            points_added: bonusValue,
            description: `Surprise ! +${bonusValue} point${bonusValue > 1 ? 's' : ''} bonus`,
          })

          const surpriseMsg = `Surprise ! +${bonusValue} point${bonusValue > 1 ? 's' : ''} bonus aujourd'hui 🎉`
          surprise = { triggered: true, message: surpriseMsg }

          sendPushToCard(card.id, {
            title: 'Izou',
            body: surpriseMsg,
            url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
          }).catch((err) => console.error('Surprise push error:', err))
        }
      }

      // Update visits and consume multiplier (non-critical)
      const visitPayload: Record<string, unknown> = {
        total_visits: (card.total_visits ?? 0) + 1,
        last_visit_at: new Date().toISOString(),
      }
      if (multiplier > 1) {
        visitPayload.points_multiplier = 1
      }

      await supabase
        .from('loyalty_cards')
        .update(visitPayload)
        .eq('id', card.id)

      const bonusNote = multiplier > 1 ? ` (x${multiplier} bonus appliqué !)` : ''
      await supabase.from('transactions').insert({
        loyalty_card_id: card.id,
        business_id: business.id,
        type: 'earn',
        stamps_added: null,
        points_added: effectiveAmount,
        description: `${effectiveAmount} point${effectiveAmount > 1 ? 's' : ''} ajouté${effectiveAmount > 1 ? 's' : ''}${bonusNote}`,
      })

      message = `+${effectiveAmount} point${effectiveAmount > 1 ? 's' : ''} (total : ${newPoints})`
      if (multiplier > 1) {
        message += ` — bonus x${multiplier} appliqué !`

        sendPushToCard(card.id, {
          title: 'Izou',
          body: `Bonus x${multiplier} appliqué ! +${effectiveAmount} points au lieu de ${amount} 🎯`,
          url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
        }).catch((err) => console.error('Multiplier push error:', err))
      }

      // Check if a reward tier threshold was just reached
      const { data: reachedTiers } = await supabase
        .from('reward_tiers')
        .select('points_required')
        .eq('business_id', business.id)
        .gt('points_required', previousPoints)
        .lte('points_required', newPoints)
        .limit(1)

      if (reachedTiers && reachedTiers.length > 0) {
        sendPushToCard(card.id, {
          title: 'Izou',
          body: '🎉 Récompense débloquée ! Montre ta carte au comptoir.',
          url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
        }).catch((err) => console.error('Reward push error:', err))
      } else if (gamification.goal_gradient_notification !== false) {
        // — Goal gradient notification (points) —
        const { data: nextTier } = await supabase
          .from('reward_tiers')
          .select('points_required')
          .eq('business_id', business.id)
          .gt('points_required', newPoints)
          .order('points_required', { ascending: true })
          .limit(1)

        if (nextTier && nextTier.length > 0) {
          const distance = nextTier[0].points_required - newPoints
          if (distance <= 2) {
            sendPushToCard(card.id, {
              title: 'Izou',
              body: `Plus que ${distance} point${distance > 1 ? 's' : ''} et votre récompense est à vous ! 🎁`,
              url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
            }).catch((err) => console.error('Goal gradient push error:', err))
          }
        }
      }

      setPendingWalletAction(card.qr_code_id, 'add')

      await notifyWalletDevices(card.qr_code_id).catch((err) =>
        console.error('Wallet push error (add points):', err)
      )

      return NextResponse.json({
        success: true,
        message,
        new_value: newPoints,
        ...(surprise.triggered && { surprise }),
      })
    }
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
