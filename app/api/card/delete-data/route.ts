import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'

export async function DELETE(request: NextRequest) {
  const { success } = await cardWriteLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { card_id } = await request.json()

  if (!card_id) {
    return NextResponse.json({ error: 'card_id requis' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // Vérifier que la carte appartient à ce commerce
  const { data: card } = await serviceClient
    .from('loyalty_cards')
    .select('id, customer_id, qr_code_id, business_id')
    .eq('id', card_id)
    .eq('business_id', user.id)
    .single()

  if (!card) {
    return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
  }

  // Supprimer les wallet registrations
  await serviceClient
    .from('wallet_registrations')
    .delete()
    .eq('serial_number', card.qr_code_id)

  // Supprimer la carte (cascade : transactions, claims, spins,
  // mission_completions, push_subscriptions, referrals, pwa_visits)
  await serviceClient.from('loyalty_cards').delete().eq('id', card.id)

  // Vérifier si le customer a d'autres cartes
  const { data: otherCards } = await serviceClient
    .from('loyalty_cards')
    .select('id')
    .eq('customer_id', card.customer_id)
    .limit(1)

  // Si le client n'a plus aucune carte, supprimer le profil customer
  if (!otherCards || otherCards.length === 0) {
    await serviceClient.from('customers').delete().eq('id', card.customer_id)
  }

  return NextResponse.json({ success: true })
}
