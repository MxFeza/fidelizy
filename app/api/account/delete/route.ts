import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'

/**
 * Suppression compte commercant (RGPD - Story 8.2, FR46).
 *
 * Cascade explicite (independante des FK ON DELETE) :
 *   wallet_registrations → push_subscriptions → reward_claims → referrals
 *   → transactions → loyalty_cards → reward_tiers → businesses → auth user
 *
 * Les enfants sont supprimes en premier pour ne dependre d'aucune contrainte
 * implicite : ainsi le test de pilote ne peut pas se planter sur des FK
 * mal configurees.
 */
export const DELETE = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const service = createServiceClient()

  const { data: business } = await service
    .from('businesses')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!business) throw AppError.notFound('Commerce introuvable')

  const { data: cards } = await service
    .from('loyalty_cards')
    .select('id, qr_code_id, customer_id')
    .eq('business_id', user.id)

  const cardIds = (cards ?? []).map((c) => c.id)
  const serialNumbers = (cards ?? []).map((c) => c.qr_code_id)
  const customerIds = Array.from(new Set((cards ?? []).map((c) => c.customer_id).filter(Boolean)))

  // 1. Wallet registrations (par serial_number Apple Wallet)
  if (serialNumbers.length > 0) {
    await service.from('wallet_registrations').delete().in('serial_number', serialNumbers).throwOnError()
  }

  // 2. Push subscriptions liees aux cartes du commerce
  if (cardIds.length > 0) {
    await service.from('push_subscriptions').delete().in('card_id', cardIds).throwOnError()
  }

  // 3. Reward claims (lies aux cartes)
  if (cardIds.length > 0) {
    await service.from('reward_claims').delete().in('loyalty_card_id', cardIds).throwOnError()
  }

  // 4. Referrals du commerce
  await service.from('referrals').delete().eq('business_id', user.id).throwOnError()

  // 5. Transactions du commerce
  await service.from('transactions').delete().eq('business_id', user.id).throwOnError()

  // 6. Reward tiers du commerce
  await service.from('reward_tiers').delete().eq('business_id', user.id).throwOnError()

  // 7. Loyalty cards du commerce
  await service.from('loyalty_cards').delete().eq('business_id', user.id).throwOnError()

  // 8. Customers orphelins (n'ont plus aucune carte)
  if (customerIds.length > 0) {
    const { data: remaining } = await service
      .from('loyalty_cards')
      .select('customer_id')
      .in('customer_id', customerIds)

    const stillReferenced = new Set((remaining ?? []).map((r) => r.customer_id))
    const toDelete = customerIds.filter((id) => !stillReferenced.has(id))
    if (toDelete.length > 0) {
      await service.from('customers').delete().in('id', toDelete).throwOnError()
    }
  }

  // 9. Business (puis auth user)
  await service.from('businesses').delete().eq('id', user.id).throwOnError()

  const { error: authDeleteError } = await service.auth.admin.deleteUser(user.id)
  if (authDeleteError) {
    console.error('Auth delete error:', authDeleteError.message)
  }

  return NextResponse.json({ success: true })
})
