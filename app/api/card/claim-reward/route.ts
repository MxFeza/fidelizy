import { createClient } from '@/lib/supabase/server'
import { notifyWalletDevices } from '@/lib/wallet/push'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'
import { NextRequest, NextResponse } from 'next/server'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    const { success } = await cardWriteLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessaie dans quelques secondes.' }, { status: 429 })
    }

    const { card_id, reward_tier_id } = await request.json()

    if (!card_id || !reward_tier_id) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
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
      .select('id')
      .eq('id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('id, current_points, business_id, qr_code_id')
      .eq('id', card_id)
      .eq('business_id', business.id)
      .single()

    if (!card) {
      return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
    }

    const { data: tier } = await supabase
      .from('reward_tiers')
      .select('id, reward_name, points_required')
      .eq('id', reward_tier_id)
      .eq('business_id', business.id)
      .single()

    if (!tier) {
      return NextResponse.json({ error: 'Palier de récompense introuvable' }, { status: 404 })
    }

    if ((card.current_points ?? 0) < tier.points_required) {
      return NextResponse.json(
        { error: `Points insuffisants (${card.current_points ?? 0}/${tier.points_required})` },
        { status: 400 }
      )
    }

    const newPoints = (card.current_points ?? 0) - tier.points_required

    await supabase
      .from('loyalty_cards')
      .update({ current_points: newPoints })
      .eq('id', card.id)

    await supabase.from('reward_claims').insert({
      loyalty_card_id: card.id,
      reward_tier_id: tier.id,
      reward_name: tier.reward_name,
      points_spent: tier.points_required,
    })

    await supabase.from('transactions').insert({
      loyalty_card_id: card.id,
      business_id: business.id,
      type: 'redeem',
      stamps_added: null,
      points_added: null,
      description: `Récompense : ${tier.reward_name} (-${tier.points_required} pts)`,
    })

    setPendingWalletAction(card.qr_code_id, 'claim-reward')

    await notifyWalletDevices(card.qr_code_id).catch((err) =>
      console.error('Wallet push error (claim reward):', err)
    )

    return NextResponse.json({
      success: true,
      message: `${tier.reward_name} accordé ! (-${tier.points_required} pts, reste ${newPoints} pts)`,
      new_points: newPoints,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
