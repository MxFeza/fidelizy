import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function DELETE() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // Vérifier que c'est bien un commerçant
  const { data: business } = await serviceClient
    .from('businesses')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
  }

  // Supprimer les wallet_registrations liées aux cartes du commerce
  const { data: cards } = await serviceClient
    .from('loyalty_cards')
    .select('qr_code_id')
    .eq('business_id', user.id)

  if (cards && cards.length > 0) {
    const serialNumbers = cards.map((c) => c.qr_code_id)
    await serviceClient
      .from('wallet_registrations')
      .delete()
      .in('serial_number', serialNumbers)
  }

  // Supprimer le commerce (cascade supprime loyalty_cards, transactions,
  // reward_claims, wheel_spins, mission_completions, push_subscriptions,
  // referrals, pwa_visits, missions, wheel_prizes, reward_tiers)
  const { error: deleteError } = await serviceClient
    .from('businesses')
    .delete()
    .eq('id', user.id)

  if (deleteError) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression. Contactez le support.' },
      { status: 500 }
    )
  }

  // Supprimer le compte Auth
  const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(user.id)

  if (authDeleteError) {
    console.error('Auth delete error:', authDeleteError.message)
  }

  return NextResponse.json({ success: true })
}
