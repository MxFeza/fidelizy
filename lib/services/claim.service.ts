import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveClientTiers } from './loyalty.tiers'
import { resetCard, claimReward } from './loyalty.service'
import { AppError } from '@/lib/errors'

/**
 * Story 4.4 — Service de réclamation via code éphémère.
 *
 * Flow :
 *  1. Client clique "Réclamer ma récompense" → createClaimRequest()
 *     génère un code 6 chars + insère pending + retourne le code à afficher
 *  2. Client présente le code au merchant
 *  3. Merchant scanne/tape le code → validateClaim() vérifie + exécute
 *     reset (stamps) ou claimReward (points) + marque validated
 *
 * Codes expirent après 5 minutes. RLS verrouillée — passage obligatoire
 * par ces helpers avec service_role.
 */

const CLAIM_TTL_MINUTES = 5

// Charset sans ambiguïté visuelle (exclut 0/O, 1/I/L)
const CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

/**
 * Génère un code aléatoire 6 chars avec charset non-ambigu.
 *
 * Utilise crypto.getRandomValues (CSPRNG) plutôt que Math.random pour
 * empêcher la prédiction/bruteforce statistique sur les codes éphémères
 * de réclamation (audit local 2026-05-08, finding T1-1).
 *
 * Le biais modulo (256 % 31 ≠ 0) est négligeable : ratio max/min des
 * probabilités < 1.04 sur ce charset, exploitabilité quasi-nulle.
 */
function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARSET[bytes[i] % CODE_CHARSET.length]
  }
  return code
}

interface CreateClaimRequestInput {
  cardId: string
  /** Optionnel — null/undefined = mode stamps single-tier (palier virtuel via stamps_reward) */
  tierId?: string | null
}

interface CreateClaimRequestResult {
  id: string
  code: string
  rewardName: string
  pointsCost: number | null
  loyaltyType: 'stamps' | 'points'
  expiresAt: string
}

export async function createClaimRequest(
  supabase: SupabaseClient,
  { cardId, tierId }: CreateClaimRequestInput,
): Promise<CreateClaimRequestResult> {
  // Charge la carte + le business
  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, business_id, current_stamps, current_points')
    .eq('qr_code_id', cardId)
    .single()

  if (!card) throw new AppError('Carte introuvable', 404)

  const { data: business } = await supabase
    .from('businesses')
    .select('id, loyalty_type, reward_tiers, stamps_required, stamps_reward')
    .eq('id', card.business_id)
    .single()

  if (!business) throw new AppError('Commerce introuvable', 404)

  // Résout le tier — soit explicit (tierId fourni), soit virtuel single-tier
  const tiers = resolveClientTiers(business)
  const tier = tierId
    ? tiers.find((t) => t.id === tierId)
    : tiers[0] // single-tier stamps : on prend le seul palier (virtuel ou JSONB)

  if (!tier) throw new AppError('Aucun palier configuré pour ce commerce', 400)

  // Vérifie l'éligibilité (le client a assez de stamps/points)
  const currentValue = business.loyalty_type === 'stamps'
    ? card.current_stamps ?? 0
    : card.current_points ?? 0

  if (currentValue < tier.threshold) {
    throw new AppError(
      `Récompense pas encore débloquée (${currentValue}/${tier.threshold}).`,
      400,
    )
  }

  // Annule les claims pending précédents pour cette carte (un seul code actif)
  await supabase
    .from('claim_requests')
    .update({ status: 'cancelled' })
    .eq('loyalty_card_id', card.id)
    .eq('status', 'pending')
    .throwOnError()

  // Génère un code unique parmi les pending. Retry sur collision (très rare).
  let code = ''
  let attempts = 0
  for (attempts = 0; attempts < 5; attempts++) {
    code = generateCode()
    const { data: existing } = await supabase
      .from('claim_requests')
      .select('id')
      .eq('code', code)
      .eq('status', 'pending')
      .maybeSingle()
    if (!existing) break
  }
  if (attempts >= 5) throw new AppError('Impossible de générer un code unique, réessayez', 500)

  const expiresAt = new Date(Date.now() + CLAIM_TTL_MINUTES * 60_000).toISOString()
  const pointsCost = business.loyalty_type === 'points' ? tier.threshold : null

  const { data: request, error } = await supabase
    .from('claim_requests')
    .insert({
      loyalty_card_id: card.id,
      business_id: business.id,
      tier_id: tier.id.startsWith('virtual-') ? null : tier.id,
      reward_name: tier.name,
      points_cost: pointsCost,
      loyalty_type: business.loyalty_type,
      code,
      expires_at: expiresAt,
    })
    .select('id, code, reward_name, points_cost, loyalty_type, expires_at')
    .single()

  if (error || !request) throw new AppError('Erreur lors de la création du code', 500)

  return {
    id: request.id,
    code: request.code,
    rewardName: request.reward_name,
    pointsCost: request.points_cost,
    loyaltyType: request.loyalty_type,
    expiresAt: request.expires_at,
  }
}

interface ValidateClaimInput {
  /** Soit le code 6 chars (flow scan/saisie comptoir), soit le claim_id direct
   *  (flow 1-clic depuis le centre notifications merchant — 2026-05-13). */
  code?: string
  claimId?: string
  merchantId: string
}

interface ValidateClaimResult {
  success: true
  rewardName: string
  loyaltyType: 'stamps' | 'points'
  pointsCost: number | null
  cardId: string
  customerName?: string
}

/**
 * Côté merchant : valide un code de réclamation, exécute le claim (reset stamps
 * ou deduct points), marque validated.
 *
 * Idempotent : un code déjà validé renvoie une 409.
 * Race-condition safe : check status='pending' dans le UPDATE pour éviter double-claim.
 */
export async function validateClaim(
  supabase: SupabaseClient,
  { code, claimId, merchantId }: ValidateClaimInput,
): Promise<ValidateClaimResult> {
  if (!code && !claimId) {
    throw new AppError('Code ou identifiant de demande requis', 400)
  }

  // Charge le claim + verrouille le scope merchant. On accepte deux points
  // d'entrée : par code 6 chars (scan/saisie) OU par id direct (notification
  // dashboard 1-clic). Dans les deux cas la propriété business_id = merchantId
  // garantit qu'on ne valide pas un claim d'un autre commerce.
  let query = supabase
    .from('claim_requests')
    .select(`
      id, loyalty_card_id, business_id, tier_id, reward_name, points_cost,
      loyalty_type, status, expires_at,
      loyalty_cards!inner(qr_code_id, customers(first_name))
    `)
    .eq('business_id', merchantId)

  if (claimId) {
    query = query.eq('id', claimId)
  } else {
    query = query.eq('code', code!.toUpperCase())
  }

  const { data: request } = await query.maybeSingle()

  if (!request) throw new AppError('Code introuvable ou non lié à votre commerce', 404)

  if (request.status === 'validated') {
    throw new AppError('Code déjà utilisé', 409)
  }
  if (request.status !== 'pending') {
    throw new AppError(`Code ${request.status === 'expired' ? 'expiré' : 'annulé'}`, 410)
  }
  if (new Date(request.expires_at) < new Date()) {
    // Marque expired pour cohérence puis erreur
    await supabase.from('claim_requests').update({ status: 'expired' }).eq('id', request.id)
    throw new AppError('Code expiré', 410)
  }

  // Atomic update — empêche double-validation en cas de concurrence
  const { data: updated, error: updateError } = await supabase
    .from('claim_requests')
    .update({ status: 'validated', validated_at: new Date().toISOString(), validated_by: merchantId })
    .eq('id', request.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (updateError || !updated) {
    throw new AppError('Code déjà utilisé (concurrence)', 409)
  }

  // Exécute l'action métier
  if (request.loyalty_type === 'stamps') {
    await resetCard(supabase, { cardId: request.loyalty_card_id, businessId: merchantId })
  } else if (request.tier_id) {
    await claimReward(supabase, {
      cardId: request.loyalty_card_id,
      businessId: merchantId,
      rewardTierId: request.tier_id,
    })
  }

  // Type narrowing — le inner join renvoie un objet, pas un array
  const cardJoin = request.loyalty_cards as unknown as {
    qr_code_id: string
    customers: { first_name: string | null } | null
  }

  return {
    success: true,
    rewardName: request.reward_name,
    loyaltyType: request.loyalty_type,
    pointsCost: request.points_cost,
    cardId: cardJoin.qr_code_id,
    customerName: cardJoin.customers?.first_name ?? undefined,
  }
}
