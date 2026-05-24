import { SupabaseClient } from '@supabase/supabase-js'
import { processReferral } from './referral.service'
import { AppError } from '@/lib/errors'
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
    throw new AppError('Commerce introuvable', 404)
  }

  // Lookup priority : email d'abord (4.2.b' Netflix multi-cartes), puis phone.
  //
  // Si l'email fourni correspond a un compte existant -> on attache la nouvelle
  // carte a ce compte (peu importe le phone tape sur le formulaire). Le user
  // verra toutes ses cartes consolidees dans son /me apres login.
  //
  // Sinon, fallback sur le lookup par phone (comportement historique : un
  // meme numero recoit toutes les cartes du meme appareil).
  let existingCustomer: { id: string } | null = null

  if (email) {
    const { data } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    if (data) existingCustomer = data
  }

  if (!existingCustomer) {
    const { data } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()
    if (data) existingCustomer = data
  }

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
      throw new AppError('Erreur lors de la création du profil', 500)
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
    throw new AppError('Erreur lors de la création de la carte', 500)
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

// ── Auto-provisioning customer + carte pour un user authentifie ──

/**
 * Shape minimal d'un Supabase auth user (cf. supabase.auth.getUser()).
 * Reproduit ici pour eviter d'importer le type complet de @supabase/supabase-js
 * dans les tests (le type est defini comme `User` avec ~30 champs).
 */
export interface AuthUserLike {
  email: string
  phone?: string | null
  user_metadata?: {
    first_name?: string
    name?: string
    full_name?: string
  } | null
}

/**
 * Shape minimal du business pour ensureCustomerAndCard. On extrait juste
 * ce qu'il faut pour l'auto-create de carte (gamification.initial_stamps
 * en mode stamps).
 */
export interface BusinessForProvisioning {
  id: string
  loyalty_type: string
  gamification?: Record<string, unknown> | null
}

/**
 * Garantit qu'un user authentifie a un customer record + une loyalty_card
 * chez le business cible. Cree ce qui manque (idempotent).
 *
 * Cas pilote 2026-05-23 :
 *  - User cree un compte commercant (auth.users) puis scanne en client avec
 *    le meme email → aucun profil customer associe → sans auto-create on
 *    re-deroule JoinFlow d'inscription, friction inacceptable.
 *  - User authentifie sur Izou (autre commerce) qui scanne le QR d'un
 *    nouveau commerce → customer existe, mais pas de carte → on auto-cree
 *    la carte avec initial_stamps (gamification) pour que le scanCard qui
 *    suit credite immediatement +1.
 *
 * Retourne :
 *  - { id, qr_code_id } : carte prete a recevoir scanCard / redirect /card
 *  - null : auto-create echoue (RLS, contrainte, schema drift). L'appelant
 *    doit alors fallback sur JoinFlow d'inscription.
 *
 * Logs des erreurs en console.error pour Vercel debugging mais ne throw
 * pas — la page parent doit pouvoir continuer son rendu sans crasher.
 */
export async function ensureCustomerAndCard(
  supabase: SupabaseClient,
  params: { user: AuthUserLike; business: BusinessForProvisioning },
): Promise<{ id: string; qr_code_id: string } | null> {
  const { user, business } = params

  // 1. Lookup customer par email
  let customer = (
    await supabase
      .from('customers')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()
  ).data as { id: string } | null

  // 2. Auto-create customer si manquant (auth orpheline)
  if (!customer) {
    const meta = user.user_metadata ?? {}
    const firstName =
      meta.first_name?.trim() ||
      meta.name?.trim() ||
      meta.full_name?.trim().split(' ')[0] ||
      user.email.split('@')[0]

    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        first_name: firstName,
        email: user.email,
        phone: user.phone || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[ensureCustomerAndCard] auto-create customer failed:', error.message)
      return null
    }
    customer = newCustomer as { id: string }
  }

  // 3. Lookup loyalty_card pour ce customer + business
  let card = (
    await supabase
      .from('loyalty_cards')
      .select('id, qr_code_id')
      .eq('customer_id', customer.id)
      .eq('business_id', business.id)
      .maybeSingle()
  ).data as { id: string; qr_code_id: string } | null

  // 4. Auto-create carte si manquante. initial_stamps tire de la
  // gamification merchant uniquement en mode stamps.
  if (!card) {
    const initialStamps =
      business.loyalty_type === 'stamps'
        ? Number(business.gamification?.initial_stamps ?? 0) || 0
        : 0

    const { data: newCard, error } = await supabase
      .from('loyalty_cards')
      .insert({
        customer_id: customer.id,
        business_id: business.id,
        current_stamps: initialStamps,
        current_points: 0,
        total_visits: 0,
      })
      .select('id, qr_code_id')
      .single()

    if (error) {
      console.error('[ensureCustomerAndCard] auto-create card failed:', error.message)
      return null
    }
    card = newCard as { id: string; qr_code_id: string }
  }

  return card
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
