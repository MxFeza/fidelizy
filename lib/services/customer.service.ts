import { SupabaseClient } from '@supabase/supabase-js'
import { processReferral } from './referral.service'
import { ServiceError } from './loyalty.service'
import type { RegisterCustomerInput, RecoverCardsInput } from './customer.schemas'

interface RegisterResult {
  qrCodeId: string
  cardId: string
}

/**
 * Register a customer for a business loyalty program.
 * Idempotent: returns existing card if customer already enrolled.
 */
export async function registerCustomer(
  supabase: SupabaseClient,
  params: RegisterCustomerInput
): Promise<RegisterResult> {
  const { businessId, firstName, phone, email, referralCode } = params

  // Load business to check gamification config
  const { data: business } = await supabase
    .from('businesses')
    .select('id, loyalty_type, gamification')
    .eq('id', businessId)
    .single()

  if (!business) {
    throw new ServiceError('Commerce introuvable', 404)
  }

  // Check if customer with this phone already exists
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  let customerId: string

  if (existingCustomer) {
    customerId = existingCustomer.id

    // Check if they already have a card for this business
    const { data: existingCard } = await supabase
      .from('loyalty_cards')
      .select('id, qr_code_id')
      .eq('customer_id', customerId)
      .eq('business_id', businessId)
      .maybeSingle()

    if (existingCard) {
      return { qrCodeId: existingCard.qr_code_id, cardId: existingCard.id }
    }
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({ first_name: firstName, phone, email })
      .select('id')
      .single()

    if (customerError || !newCustomer) {
      throw new ServiceError('Erreur lors de la création du profil', 500)
    }

    customerId = newCustomer.id
  }

  const initialStamps = (business.loyalty_type === 'stamps' && (business.gamification as Record<string, unknown>)?.initial_stamps as number) || 0

  const qrCodeId = crypto.randomUUID()
  const { data: newCard, error: cardError } = await supabase
    .from('loyalty_cards')
    .insert({
      customer_id: customerId,
      business_id: businessId,
      current_stamps: initialStamps,
      current_points: 0,
      total_visits: 0,
      qr_code_id: qrCodeId,
    })
    .select('id, qr_code_id')
    .single()

  if (cardError || !newCard) {
    throw new ServiceError('Erreur lors de la création de la carte', 500)
  }

  // Log initial bonus stamps as a transaction
  if (initialStamps > 0) {
    await supabase.from('transactions').insert({
      loyalty_card_id: newCard.id,
      business_id: businessId,
      type: 'earn',
      stamps_added: initialStamps,
      points_added: null,
      description: `Bonus de bienvenue : ${initialStamps} tampon${initialStamps > 1 ? 's' : ''}`,
    })
  }

  // Handle referral
  if (referralCode) {
    try {
      await processReferral(supabase, {
        referralCode,
        referredCardId: newCard.id,
        businessId,
        referredFirstName: firstName,
      })
    } catch {
      // Ignore referral errors — don't block registration
    }
  }

  return { qrCodeId: newCard.qr_code_id, cardId: newCard.id }
}

/**
 * Find all loyalty cards for a customer by phone number.
 */
export async function findCustomerCards(
  supabase: SupabaseClient,
  params: RecoverCardsInput
): Promise<{ cards: Record<string, unknown>[] }> {
  const { phone } = params

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', phone.trim())
    .maybeSingle()

  if (!customer) {
    return { cards: [] }
  }

  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('qr_code_id, current_stamps, current_points, businesses(business_name, loyalty_type, stamps_required, primary_color)')
    .eq('customer_id', customer.id)

  return { cards: cards ?? [] }
}
