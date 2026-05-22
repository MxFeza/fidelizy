import { SupabaseClient } from '@supabase/supabase-js'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'
import { notifyClient } from './notification.service'
import { resolveClientTiers } from './loyalty.tiers'
import { AppError } from '@/lib/errors'
import type { LoyaltyCard, Customer } from '@/lib/types'
import type { AddToCardInput, DeductFromCardInput, ClaimRewardInput, ResetCardInput } from './loyalty.schemas'

// ── Shared types ──

interface EarnResult {
  success: true
  message: string
  updatedCard: Partial<LoyaltyCard>
  customer: Partial<Customer> | null
  newValue: number
}

interface DeductResult {
  success: true
  newValue: number
}

interface ClaimResult {
  success: true
  message: string
  newPoints: number
}

// ── Scan (earn 1 stamp or pointsPerEuro) ──

export async function scanCard(
  supabase: SupabaseClient,
  params: { qrCodeId: string; business: { id: string; business_name: string; loyalty_type: string; stamps_required: number | null; stamps_reward: string; points_per_euro: number | null; scan_cooldown_hours?: number | null } }
): Promise<EarnResult> {
  const { qrCodeId, business } = params

  // Find card by short code (8 chars) or full UUID
  const cleaned = qrCodeId.replace(/-/g, '').replace(/[%_]/g, '')
  const isShortCode = cleaned.length === 8

  let card
  if (isShortCode) {
    const { data } = await supabase
      .from('loyalty_cards')
      .select('*, customers(*)')
      .ilike('qr_code_id', `${cleaned}%`)
      .eq('business_id', business.id)
      .single()
    card = data
  } else {
    const { data } = await supabase
      .from('loyalty_cards')
      .select('*, customers(*)')
      .eq('qr_code_id', qrCodeId)
      .eq('business_id', business.id)
      .single()
    card = data
  }

  if (!card) {
    throw new AppError('Carte introuvable ou ne correspond pas à ce commerce.', 404)
  }

  // Anti-fraude : delai mini entre 2 scans automatiques du meme client.
  // S'applique uniquement au QR comptoir (scanCard), pas aux ajouts manuels (addToCard).
  const cooldownHours = business.scan_cooldown_hours ?? 4
  if (cooldownHours > 0) {
    const cooldownMs = cooldownHours * 60 * 60 * 1000
    const cutoffIso = new Date(Date.now() - cooldownMs).toISOString()

    const { data: recentEarn } = await supabase
      .from('transactions')
      .select('created_at')
      .eq('loyalty_card_id', card.id)
      .eq('business_id', business.id)
      .eq('type', 'earn')
      .gt('created_at', cutoffIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentEarn) {
      const elapsedMs = Date.now() - new Date(recentEarn.created_at).getTime()
      const remainingMin = Math.max(1, Math.ceil((cooldownMs - elapsedMs) / 60_000))
      const wait = remainingMin >= 60
        ? `${Math.ceil(remainingMin / 60)} h`
        : `${remainingMin} min`
      throw new AppError(`Trop tôt — attends encore ${wait} avant le prochain scan.`, 429)
    }
  }

  if (business.loyalty_type === 'stamps') {
    const result = await earnStampsInternal(supabase, {
      card,
      business,
      amount: 1,
      incrementVisits: true,
    })
    return { ...result, customer: card.customers }
  } else {
    const result = await earnPointsInternal(supabase, {
      card,
      business,
      amount: business.points_per_euro ?? 1,
      incrementVisits: true,
    })
    return { ...result, customer: card.customers }
  }
}

// ── Add stamps/points (merchant action, variable amount) ──

export async function addToCard(
  supabase: SupabaseClient,
  params: AddToCardInput & { businessName: string; stampsRequired: number | null; stampsReward: string; pointsPerEuro: number | null }
): Promise<EarnResult> {
  const { cardId, businessId, type, amount } = params

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, current_stamps, current_points, total_visits, business_id, qr_code_id')
    .eq('id', cardId)
    .eq('business_id', businessId)
    .single()

  if (!card) {
    throw new AppError('Carte introuvable', 404)
  }

  const business = {
    id: businessId,
    business_name: params.businessName,
    stamps_required: params.stampsRequired,
    stamps_reward: params.stampsReward,
    points_per_euro: params.pointsPerEuro,
  }

  // Anti-abuse (audit local 2026-05-08, finding T1-3) : clamp business-aware
  // pour empêcher un employé malveillant de créditer 1000 tampons d'un coup.
  // - stamps : max = 1 carte complète (= stamps_required) par opération
  // - points : max = 500 (couvre les gros tickets, bloque les abus extrêmes)
  // Le schéma Zod côté API limite déjà à 1000, ce clamp est une 2e barrière.
  const stampsCap = business.stamps_required ?? 10
  const cappedAmount = type === 'stamps'
    ? Math.min(amount, stampsCap)
    : Math.min(amount, 500)

  if (type === 'stamps') {
    return earnStampsInternal(supabase, { card, business, amount: cappedAmount, incrementVisits: true })
  } else {
    return earnPointsInternal(supabase, { card, business, amount: cappedAmount, incrementVisits: true })
  }
}

// ── Deduct stamps/points (correction) ──

export async function deductFromCard(
  supabase: SupabaseClient,
  params: DeductFromCardInput
): Promise<DeductResult> {
  const { cardId, businessId, type, amount } = params

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, current_stamps, current_points, business_id, qr_code_id')
    .eq('id', cardId)
    .eq('business_id', businessId)
    .single()

  if (!card) {
    throw new AppError('Carte introuvable', 404)
  }

  if (type === 'stamps') {
    const newStamps = Math.max(0, (card.current_stamps ?? 0) - amount)
    await supabase
      .from('loyalty_cards')
      .update({ current_stamps: newStamps })
      .eq('id', card.id)
      .throwOnError()

    await supabase.from('transactions').insert({
      loyalty_card_id: card.id,
      business_id: businessId,
      type: 'redeem',
      stamps_added: null,
      points_added: null,
      description: `${amount} tampon${amount > 1 ? 's' : ''} retiré${amount > 1 ? 's' : ''} (correction)`,
    }).throwOnError()

    setPendingWalletAction(card.qr_code_id, 'deduct')
    notifyClient(card.id, card.qr_code_id, {
      title: 'Correction',
      body: `${amount} tampon${amount > 1 ? 's' : ''} retiré${amount > 1 ? 's' : ''}`,
    }).catch(() => {})

    return { success: true, newValue: newStamps }
  } else {
    const newPoints = Math.max(0, (card.current_points ?? 0) - amount)
    await supabase
      .from('loyalty_cards')
      .update({ current_points: newPoints })
      .eq('id', card.id)
      .throwOnError()

    await supabase.from('transactions').insert({
      loyalty_card_id: card.id,
      business_id: businessId,
      type: 'redeem',
      stamps_added: null,
      points_added: null,
      description: `${amount} point${amount > 1 ? 's' : ''} retirés (correction)`,
    }).throwOnError()

    setPendingWalletAction(card.qr_code_id, 'deduct')
    notifyClient(card.id, card.qr_code_id, {
      title: 'Correction',
      body: `${amount} point${amount > 1 ? 's' : ''} retiré${amount > 1 ? 's' : ''}`,
    }).catch(() => {})

    return { success: true, newValue: newPoints }
  }
}

// ── Claim reward (points) ──

export async function claimReward(
  supabase: SupabaseClient,
  params: ClaimRewardInput
): Promise<ClaimResult> {
  const { cardId, businessId, rewardTierId } = params

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, current_points, business_id, qr_code_id')
    .eq('id', cardId)
    .eq('business_id', businessId)
    .single()

  if (!card) {
    throw new AppError('Carte introuvable', 404)
  }

  // Lit le tier depuis business.reward_tiers JSONB (Story 4.4 — table legacy
  // reward_tiers n'est plus consultee). resolveClientTiers gere aussi le palier
  // virtuel single-tier en mode stamps.
  const { data: business } = await supabase
    .from('businesses')
    .select('loyalty_type, reward_tiers, stamps_required, stamps_reward')
    .eq('id', businessId)
    .single()

  if (!business) {
    throw new AppError('Commerce introuvable', 404)
  }

  const tiers = resolveClientTiers(business)
  const tier = tiers.find((t) => t.id === rewardTierId)

  if (!tier) {
    throw new AppError('Palier de récompense introuvable', 404)
  }

  const pointsRequired = tier.threshold

  // Atomic deduction via RPC — prevents spending more than available
  const { data: deductResult, error: deductError } = await supabase.rpc('deduct_points', {
    p_card_id: card.id,
    p_amount: pointsRequired,
  }).single() as { data: { new_points: number; success: boolean } | null; error: unknown }

  if (deductError || !deductResult) {
    throw new AppError('Erreur lors de la déduction des points', 500)
  }

  if (!deductResult.success) {
    throw new AppError(`Points insuffisants (${card.current_points ?? 0}/${pointsRequired})`, 400)
  }

  const newPoints = deductResult.new_points

  await supabase.from('reward_claims').insert({
    loyalty_card_id: card.id,
    reward_tier_id: tier.id, // UUID JSONB — plus de FK strict depuis Story 4.4
    reward_name: tier.name,
    points_spent: pointsRequired,
  }).throwOnError()

  await supabase.from('transactions').insert({
    loyalty_card_id: card.id,
    business_id: businessId,
    type: 'redeem',
    stamps_added: null,
    points_added: null,
    description: `Récompense : ${tier.name} (-${pointsRequired} pts)`,
  }).throwOnError()

  setPendingWalletAction(card.qr_code_id, 'claim-reward')
  notifyClient(card.id, card.qr_code_id, {
    title: 'Récompense !',
    body: `${tier.name} — montre ta carte au comptoir.`,
  }).catch(() => {})

  return {
    success: true,
    message: `${tier.name} accordé ! (-${pointsRequired} pts, reste ${newPoints} pts)`,
    newPoints,
  }
}

// ── Reset card (stamps to 0) ──

export async function resetCard(
  supabase: SupabaseClient,
  params: ResetCardInput
): Promise<{ success: true }> {
  const { cardId, businessId } = params

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, business_id, current_stamps, qr_code_id')
    .eq('id', cardId)
    .eq('business_id', businessId)
    .single()

  if (!card) {
    throw new AppError('Carte introuvable', 404)
  }

  await supabase
    .from('loyalty_cards')
    .update({ current_stamps: 0 })
    .eq('id', card.id)
    .throwOnError()

  await supabase.from('transactions').insert({
    loyalty_card_id: card.id,
    business_id: businessId,
    type: 'redeem',
    stamps_added: null,
    points_added: null,
    description: 'Récompense accordée — carte réinitialisée',
  }).throwOnError()

  setPendingWalletAction(card.qr_code_id, 'reset')
  notifyClient(card.id, card.qr_code_id, {
    title: 'Carte réinitialisée',
    body: 'Ta carte a été remise à zéro.',
  }).catch(() => {})

  return { success: true }
}

// ── Internal shared logic ──

async function earnStampsInternal(
  supabase: SupabaseClient,
  params: {
    card: { id: string; current_stamps: number | null; total_visits: number | null; qr_code_id: string }
    business: { id: string; business_name: string; stamps_required: number | null; stamps_reward: string }
    amount: number
    incrementVisits: boolean
  }
): Promise<EarnResult> {
  const { card, business, amount } = params
  const stampsRequired = business.stamps_required ?? 10

  // Atomic increment via RPC — prevents race conditions on double-scan
  const { data: rpcResult, error: rpcError } = await supabase.rpc('increment_stamps', {
    p_card_id: card.id,
    p_amount: amount,
    p_stamps_required: stampsRequired,
  }).single() as { data: { new_stamps: number; is_complete: boolean; total_visits: number } | null; error: unknown }

  if (rpcError || !rpcResult) {
    throw new AppError('Erreur lors de la mise à jour des tampons', 500)
  }

  const finalStamps = rpcResult.new_stamps
  const isComplete = rpcResult.is_complete

  // Fetch updated card for response
  const { data: updatedCard } = await supabase
    .from('loyalty_cards')
    .select()
    .eq('id', card.id)
    .single()

  const rawNew = isComplete ? stampsRequired : finalStamps
  await supabase.from('transactions').insert({
    loyalty_card_id: card.id,
    business_id: business.id,
    type: 'earn',
    stamps_added: amount,
    points_added: null,
    description: `${amount} tampon${amount > 1 ? 's' : ''} ajouté${amount > 1 ? 's' : ''} (${rawNew}/${stampsRequired})`,
  }).throwOnError()

  let message: string

  if (isComplete) {
    // Story 9.x.fix 2026-05-10 : on N'INSERT PLUS la transaction redeem ici
    // et on NE RESET PLUS la carte à 0. La RPC `increment_stamps` cap maintenant
    // la carte au seuil. Le claim de récompense se fait explicitement par le
    // client via le flow claim_requests (code 6 chars présenté au merchant
    // qui valide via /api/scan/validate-claim).
    //
    // On notifie juste le client qu'une récompense est disponible.
    message = `+${amount} tampon${amount > 1 ? 's' : ''} — Carte complète ! Récompense ${business.stamps_reward} disponible. Le client peut la réclamer depuis son app.`

    // Wallet : badge à 0 restant, indique au client que c'est claimable.
    setPendingWalletAction(card.qr_code_id, 'add', 0)
    notifyClient(card.id, card.qr_code_id, {
      title: business.business_name,
      body: `Récompense ${business.stamps_reward} débloquée ! Réclame-la depuis ton app.`,
    }).catch(() => {})
  } else {
    const remaining = stampsRequired - finalStamps
    message = `+${amount} tampon${amount > 1 ? 's' : ''} (${finalStamps}/${stampsRequired})`
    setPendingWalletAction(card.qr_code_id, 'add', remaining)
    // Retour user 2026-05-22 : notif systematique a chaque ajout (pas seulement
    // au milestone). S'applique aussi au scan QR comptoir car earnStampsInternal
    // est partagee — choix produit assume.
    notifyClient(card.id, card.qr_code_id, {
      title: business.business_name,
      body: `+${amount} tampon${amount > 1 ? 's' : ''} ajouté${amount > 1 ? 's' : ''} (${finalStamps}/${stampsRequired})`,
    }).catch(() => {})
  }

  return { success: true, message, updatedCard: updatedCard ?? {} as Partial<LoyaltyCard>, customer: null, newValue: finalStamps }
}

async function earnPointsInternal(
  supabase: SupabaseClient,
  params: {
    card: { id: string; current_points: number | null; total_visits: number | null; qr_code_id: string }
    business: { id: string; business_name: string }
    amount: number
    incrementVisits: boolean
  }
): Promise<EarnResult> {
  const { card, business, amount } = params

  // Atomic increment via RPC — prevents race conditions
  const { data: rpcResult, error: rpcError } = await supabase.rpc('increment_points', {
    p_card_id: card.id,
    p_amount: amount,
  }).single() as { data: { new_points: number; previous_points: number; total_visits: number } | null; error: unknown }

  if (rpcError || !rpcResult) {
    throw new AppError('Erreur lors de la mise à jour des points', 500)
  }

  const newPoints = rpcResult.new_points
  const previousPoints = rpcResult.previous_points

  // Fetch updated card for response
  const { data: updatedCard } = await supabase
    .from('loyalty_cards')
    .select()
    .eq('id', card.id)
    .single()

  await supabase.from('transactions').insert({
    loyalty_card_id: card.id,
    business_id: business.id,
    type: 'earn',
    stamps_added: null,
    points_added: amount,
    description: `${amount} point${amount > 1 ? 's' : ''} ajouté${amount > 1 ? 's' : ''}`,
  }).throwOnError()

  const message = `+${amount} point${amount > 1 ? 's' : ''} (total : ${newPoints})`

  // Check if a reward tier threshold was just reached (lit le JSONB businesses.reward_tiers)
  const { data: businessTiers } = await supabase
    .from('businesses')
    .select('reward_tiers')
    .eq('id', business.id)
    .single()

  const tiers: { threshold: number }[] = Array.isArray(businessTiers?.reward_tiers)
    ? businessTiers.reward_tiers
    : []
  const reachedTier = tiers.find(
    (t) => typeof t.threshold === 'number' && t.threshold > previousPoints && t.threshold <= newPoints
  )

  if (reachedTier) {
    notifyClient(card.id, card.qr_code_id, {
      title: business.business_name,
      body: 'Récompense débloquée ! Montre ta carte au comptoir.',
    }).catch(() => {})
  } else {
    // Retour user 2026-05-22 : notif systematique a chaque ajout (pas
    // seulement au palier). S'applique au scan QR comptoir et a l'ajout
    // manuel merchant — choix produit assume.
    notifyClient(card.id, card.qr_code_id, {
      title: business.business_name,
      body: `+${amount} point${amount > 1 ? 's' : ''} ajouté${amount > 1 ? 's' : ''} (total : ${newPoints})`,
    }).catch(() => {})
  }

  setPendingWalletAction(card.qr_code_id, 'add')

  return { success: true, message, updatedCard: updatedCard ?? {} as Partial<LoyaltyCard>, customer: null, newValue: newPoints }
}

