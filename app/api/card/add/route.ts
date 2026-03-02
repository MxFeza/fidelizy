import { createClient } from '@/lib/supabase/server'
import { notifyWalletDevices } from '@/lib/wallet/push'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { card_id, type, amount } = await request.json()

    if (!card_id || !type || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    if (type !== 'stamps' && type !== 'points') {
      return NextResponse.json({ error: 'Type invalide (stamps ou points)' }, { status: 400 })
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
      .select('id, stamps_required, stamps_reward, loyalty_type')
      .eq('id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('id, current_stamps, current_points, total_visits, business_id, qr_code_id')
      .eq('id', card_id)
      .eq('business_id', business.id)
      .single()

    if (!card) {
      return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
    }

    let message = ''

    if (type === 'stamps') {
      const stampsRequired = business.stamps_required ?? 10
      const rawNew = (card.current_stamps ?? 0) + amount
      const isComplete = rawNew >= stampsRequired
      const finalStamps = isComplete ? 0 : rawNew

      await supabase
        .from('loyalty_cards')
        .update({
          current_stamps: finalStamps,
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

      await notifyWalletDevices(card.qr_code_id).catch((err) =>
        console.error('Wallet push error (add stamps):', err)
      )

      return NextResponse.json({ success: true, message, new_value: finalStamps })
    } else {
      const newPoints = (card.current_points ?? 0) + amount

      await supabase
        .from('loyalty_cards')
        .update({
          current_points: newPoints,
          total_visits: (card.total_visits ?? 0) + 1,
          last_visit_at: new Date().toISOString(),
        })
        .eq('id', card.id)

      await supabase.from('transactions').insert({
        loyalty_card_id: card.id,
        business_id: business.id,
        type: 'earn',
        stamps_added: null,
        points_added: amount,
        description: `${amount} point${amount > 1 ? 's' : ''} ajouté${amount > 1 ? 's' : ''}`,
      })

      message = `+${amount} point${amount > 1 ? 's' : ''} (total : ${newPoints})`

      await notifyWalletDevices(card.qr_code_id).catch((err) =>
        console.error('Wallet push error (add points):', err)
      )

      return NextResponse.json({ success: true, message, new_value: newPoints })
    }
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
