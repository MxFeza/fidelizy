import { SupabaseClient } from '@supabase/supabase-js'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'
import { notifyClient } from './notification.service'
import type { ProcessReferralInput } from './referral.schemas'

/**
 * Generate a referral code from customer name and phone.
 * Format: FIRST4-LAST4 (e.g., "JEAN-1234")
 */
export function generateReferralCode(firstName: string, phone: string): string {
  const prefix = firstName.substring(0, 4).toUpperCase().padEnd(4, 'X')
  const suffix = phone.slice(-4)
  return `${prefix}-${suffix}`
}

/**
 * Find a loyalty card by referral code within a business.
 */
export async function findCardByReferralCode(
  code: string,
  businessId: string,
  supabase: SupabaseClient
): Promise<{ id: string; customer_id: string } | null> {
  const parts = code.split('-')
  if (parts.length !== 2 || parts[0].length < 1 || parts[1].length !== 4) {
    return null
  }

  const namePrefix = parts[0]
  const phoneSuffix = parts[1]

  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('id, customer_id, customers!inner(first_name, phone)')
    .eq('business_id', businessId)
    .eq('is_active', true)

  if (!cards?.length) return null

  for (const card of cards) {
    const customer = card.customers as unknown as { first_name: string; phone: string }
    if (!customer) continue

    const expectedPrefix = customer.first_name.substring(0, 4).toUpperCase().padEnd(4, 'X')
    const expectedSuffix = customer.phone.slice(-4)

    if (expectedPrefix === namePrefix && expectedSuffix === phoneSuffix) {
      return { id: card.id, customer_id: card.customer_id }
    }
  }

  return null
}

/**
 * Process a referral: create referral record, credit both parties, notify.
 * Defaults: 5 points parrain, 2 points filleul.
 */
export async function processReferral(
  supabase: SupabaseClient,
  params: ProcessReferralInput
): Promise<void> {
  const { referralCode, referredCardId, businessId, referredFirstName } = params

  const referrerCard = await findCardByReferralCode(referralCode, businessId, supabase)
  if (!referrerCard) return

  const referrerPoints = 5
  const referredPoints = 2

  // Create referral entry
  await supabase.from('referrals').insert({
    referrer_card_id: referrerCard.id,
    referred_card_id: referredCardId,
    business_id: businessId,
    referrer_points_awarded: referrerPoints,
    referred_points_awarded: referredPoints,
  }).throwOnError()

  // Update referrer card points
  const { data: refCard } = await supabase
    .from('loyalty_cards')
    .select('current_points, qr_code_id')
    .eq('id', referrerCard.id)
    .single()

  if (refCard) {
    await supabase
      .from('loyalty_cards')
      .update({ current_points: (refCard.current_points ?? 0) + referrerPoints })
      .eq('id', referrerCard.id)
      .throwOnError()

    await supabase.from('transactions').insert({
      loyalty_card_id: referrerCard.id,
      business_id: businessId,
      type: 'earn',
      stamps_added: null,
      points_added: referrerPoints,
      description: `Parrainage : ${referredFirstName} vous a rapporté ${referrerPoints} points`,
    }).throwOnError()

    // Notify referrer
    setPendingWalletAction(refCard.qr_code_id, 'add')
    notifyClient(referrerCard.id, refCard.qr_code_id, {
      title: 'Parrainage réussi !',
      body: `Votre ami ${referredFirstName} vous a rapporté ${referrerPoints} points !`,
    }).catch(() => {})
  }

  // Credit referred (new card)
  const { data: newCard } = await supabase
    .from('loyalty_cards')
    .select('qr_code_id')
    .eq('id', referredCardId)
    .single()

  await supabase
    .from('loyalty_cards')
    .update({ current_points: referredPoints })
    .eq('id', referredCardId)
    .throwOnError()

  await supabase.from('transactions').insert({
    loyalty_card_id: referredCardId,
    business_id: businessId,
    type: 'earn',
    stamps_added: null,
    points_added: referredPoints,
    description: `Bonus de parrainage : +${referredPoints} points`,
  }).throwOnError()

  // Notify referred
  if (newCard) {
    setPendingWalletAction(newCard.qr_code_id, 'add')
    notifyClient(referredCardId, newCard.qr_code_id, {
      title: 'Bienvenue !',
      body: `${referredPoints} points offerts grâce au parrainage !`,
    }).catch(() => {})
  }
}
