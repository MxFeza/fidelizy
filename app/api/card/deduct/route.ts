import { createClient } from '@/lib/supabase/server'
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
      .select('id')
      .eq('id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('id, current_stamps, current_points, business_id')
      .eq('id', card_id)
      .eq('business_id', business.id)
      .single()

    if (!card) {
      return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
    }

    if (type === 'stamps') {
      const newStamps = Math.max(0, (card.current_stamps ?? 0) - amount)
      await supabase
        .from('loyalty_cards')
        .update({ current_stamps: newStamps })
        .eq('id', card.id)

      await supabase.from('transactions').insert({
        loyalty_card_id: card.id,
        business_id: business.id,
        type: 'redeem',
        stamps_added: null,
        points_added: null,
        description: `${amount} tampon${amount > 1 ? 's' : ''} retiré${amount > 1 ? 's' : ''} (correction)`,
      })

      return NextResponse.json({ success: true, new_value: newStamps })
    } else {
      const newPoints = Math.max(0, (card.current_points ?? 0) - amount)
      await supabase
        .from('loyalty_cards')
        .update({ current_points: newPoints })
        .eq('id', card.id)

      await supabase.from('transactions').insert({
        loyalty_card_id: card.id,
        business_id: business.id,
        type: 'redeem',
        stamps_added: null,
        points_added: null,
        description: `${amount} point${amount > 1 ? 's' : ''} retirés (correction)`,
      })

      return NextResponse.json({ success: true, new_value: newPoints })
    }
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
