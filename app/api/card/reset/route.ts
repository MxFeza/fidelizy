import { createClient } from '@/lib/supabase/server'
import { notifyWalletDevices } from '@/lib/wallet/push'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { card_id } = await request.json()
    if (!card_id) {
      return NextResponse.json({ error: 'card_id requis' }, { status: 400 })
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

    // Verify the card belongs to this merchant
    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('id, business_id, current_stamps, qr_code_id')
      .eq('id', card_id)
      .eq('business_id', business.id)
      .single()

    if (!card) {
      return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
    }

    await supabase
      .from('loyalty_cards')
      .update({ current_stamps: 0 })
      .eq('id', card.id)

    await supabase.from('transactions').insert({
      loyalty_card_id: card.id,
      business_id: business.id,
      type: 'redeem',
      stamps_added: null,
      points_added: null,
      description: 'Récompense accordée — carte réinitialisée',
    })

    await notifyWalletDevices(card.qr_code_id).catch((err) =>
      console.error('Wallet push error (reset):', err)
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
