import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'

/**
 * Suppression compte client (Story 4.7 P1, RGPD art. 17 — droit à l'oubli).
 *
 * Cascade explicite (independante des FK ON DELETE) :
 *   wallet_registrations → push_subscriptions → reward_claims → referrals
 *   (par customer) → transactions (par card) → loyalty_cards → customer
 *   → auth user.
 *
 * Note : les commerces NE SONT PAS supprimes. Les cartes du client chez chaque
 * commerce sont retirees (le commercant ne verra plus ce client dans son
 * dashboard, mais ses propres données restent intactes).
 */
export const DELETE = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const service = createServiceClient()

  const { data: customer } = await service
    .from('customers')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  if (!customer) throw AppError.notFound('Profil introuvable')

  const customerId = customer.id as string

  // Lister les cartes pour pouvoir cascader sur les enfants par card_id
  const { data: cards } = await service
    .from('loyalty_cards')
    .select('id, qr_code_id')
    .eq('customer_id', customerId)

  const cardIds = (cards ?? []).map((c) => c.id)
  const serialNumbers = (cards ?? []).map((c) => c.qr_code_id)

  // 1. Wallet registrations (par serial_number Apple Wallet)
  if (serialNumbers.length > 0) {
    await service
      .from('wallet_registrations')
      .delete()
      .in('serial_number', serialNumbers)
      .throwOnError()
  }

  // 2. Push subscriptions liees aux cartes
  if (cardIds.length > 0) {
    await service.from('push_subscriptions').delete().in('card_id', cardIds).throwOnError()
  }

  // 3. Reward claims (par card)
  if (cardIds.length > 0) {
    await service.from('reward_claims').delete().in('loyalty_card_id', cardIds).throwOnError()
  }

  // 4. Referrals où le client est référent (côté referrer)
  await service.from('referrals').delete().eq('referrer_customer_id', customerId).throwOnError()

  // 5. Transactions (par card)
  if (cardIds.length > 0) {
    await service.from('transactions').delete().in('loyalty_card_id', cardIds).throwOnError()
  }

  // 6. Loyalty cards
  await service.from('loyalty_cards').delete().eq('customer_id', customerId).throwOnError()

  // 7. Customer
  await service.from('customers').delete().eq('id', customerId).throwOnError()

  // 8. Auth user
  const { error: authDeleteError } = await service.auth.admin.deleteUser(user.id)
  if (authDeleteError) {
    console.error('Auth delete error:', authDeleteError.message)
  }

  return NextResponse.json({ success: true })
})
