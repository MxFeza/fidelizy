import { SupabaseClient } from '@supabase/supabase-js'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'
import { notifyClient } from './notification.service'
import type { AddToCardInput, DeductFromCardInput, ClaimRewardInput, ResetCardInput } from './loyalty.schemas'

// ── Shared types ──

interface EarnResult {
  success: true
  message: string
  updatedCard: Record<string, unknown>
  customer: Record<string, unknown> | null
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
  params: { qrCodeId: string; business: { id: string; business_name: string; loyalty_type: string; stamps_required: number | null; stamps_reward: string; points_per_euro: number | null } }
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
    throw new ServiceError('Carte introuvable ou ne correspond pas à ce commerce.', 404)
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
    throw new ServiceError('Carte introuvable', 404)
  }

  const business = {
    id: businessId,
    business_name: params.businessName,
    stamps_required: params.stampsRequired,
    stamps_reward: params.stampsReward,
    points_per_euro: params.pointsPerEuro,
  }

  if (type === 'stamps') {
    return earnStampsInternal(supabase, { card, business, amount, incrementVisits: true })
  } else {
    return earnPointsInternal(supabase, { card, business, amount, incrementVisits: true })
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
    throw new ServiceError('Carte introuvable', 404)
  }

  if (type === 'stamps') {
    const newStamps = Math.max(0, (card.current_stamps ?? 0) - amount)
    await supabase
      .from('loyalty_cards')
      .update({ current_stamps: newStamps })
      .eq('id', card.id)

    await supabase.from('transactions').insert({
      loyalty_card_id: card.id,
      business_id: businessId,
      type: 'redeem',
      stamps_added: null,
      points_added: null,
      description: `${amount} tampon${amount > 1 ? 's' : ''} retiré${amount > 1 ? 's' : ''} (correction)`,
    })

    setPendingWalletAction(card.qr_code_id, 'deduct')
    notifyClient(card.id, card.qr_code_id, 'stamp_added', {
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

    await supabase.from('transactions').insert({
      loyalty_card_id: card.id,
      business_id: businessId,
      type: 'redeem',
      stamps_added: null,
      points_added: null,
      description: `${amount} point${amount > 1 ? 's' : ''} retirés (correction)`,
    })

    setPendingWalletAction(card.qr_code_id, 'deduct')
    notifyClient(card.id, card.qr_code_id, 'stamp_added', {
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
    throw new ServiceError('Carte introuvable', 404)
  }

  const { data: tier } = await supabase
    .from('reward_tiers')
    .select('id, reward_name, points_required')
    .eq('id', rewardTierId)
    .eq('business_id', businessId)
    .single()

  if (!tier) {
    throw new ServiceError('Palier de récompense introuvable', 404)
  }

  if ((card.current_points ?? 0) < tier.points_required) {
    throw new ServiceError(`Points insuffisants (${card.current_points ?? 0}/${tier.points_required})`, 400)
  }

  const newPoints = (card.current_points ?? 0) - tier.points_required

  await supabase
    .from('loyalty_cards')
    .update({ current_points: newPoints })
    .eq('id', card.id)

  await supabase.from('reward_claims').insert({
    loyalty_card_id: card.id,
    reward_tier_id: tier.id,
    reward_name: tier.reward_name,
    points_spent: tier.points_required,
  })

  await supabase.from('transactions').insert({
    loyalty_card_id: card.id,
    business_id: businessId,
    type: 'redeem',
    stamps_added: null,
    points_added: null,
    description: `Récompense : ${tier.reward_name} (-${tier.points_required} pts)`,
  })

  setPendingWalletAction(card.qr_code_id, 'claim-reward')
  notifyClient(card.id, card.qr_code_id, 'reward_reached', {
    title: 'Récompense !',
    body: `${tier.reward_name} — montre ta carte au comptoir.`,
  }).catch(() => {})

  return {
    success: true,
    message: `${tier.reward_name} accordé ! (-${tier.points_required} pts, reste ${newPoints} pts)`,
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
    throw new ServiceError('Carte introuvable', 404)
  }

  await supabase
    .from('loyalty_cards')
    .update({ current_stamps: 0 })
    .eq('id', card.id)

  await supabase.from('transactions').insert({
    loyalty_card_id: card.id,
    business_id: businessId,
    type: 'redeem',
    stamps_added: null,
    points_added: null,
    description: 'Récompense accordée — carte réinitialisée',
  })

  setPendingWalletAction(card.qr_code_id, 'reset')
  notifyClient(card.id, card.qr_code_id, 'reward_reached', {
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
  const rawNew = (card.current_stamps ?? 0) + amount
  const isComplete = rawNew >= stampsRequired
  const finalStamps = isComplete ? 0 : rawNew

  const { data: updatedCard } = await supabase
    .from('loyalty_cards')
    .update({
      current_stamps: finalStamps,
      total_visits: (card.total_visits ?? 0) + (params.incrementVisits ? amount : 0),
      last_visit_at: new Date().toISOString(),
    })
    .eq('id', card.id)
    .select()
    .single()

  await supabase.from('transactions').insert({
    loyalty_card_id: card.id,
    business_id: business.id,
    type: 'earn',
    stamps_added: amount,
    points_added: null,
    description: `${amount} tampon${amount > 1 ? 's' : ''} ajouté${amount > 1 ? 's' : ''} (${rawNew}/${stampsRequired})`,
  })

  let message: string

  if (isComplete) {
    await supabase.from('transactions').insert({
      loyalty_card_id: card.id,
      business_id: business.id,
      type: 'redeem',
      stamps_added: null,
      points_added: null,
      description: `Récompense accordée — carte réinitialisée (${stampsRequired}/${stampsRequired})`,
    })
    message = `+${amount} tampon${amount > 1 ? 's' : ''} — Carte complète ! Récompense : ${business.stamps_reward}. Carte remise à 0.`

    setPendingWalletAction(card.qr_code_id, 'add', 0)
    notifyClient(card.id, card.qr_code_id, 'reward_reached', {
      title: business.business_name,
      body: 'Récompense débloquée ! Montre ta carte au comptoir.',
    }).catch(() => {})
  } else {
    const remaining = stampsRequired - finalStamps
    message = `+${amount} tampon${amount > 1 ? 's' : ''} (${finalStamps}/${stampsRequired})`
    setPendingWalletAction(card.qr_code_id, 'add', remaining)
  }

  return { success: true, message, updatedCard: updatedCard ?? {}, customer: null, newValue: finalStamps }
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
  const previousPoints = card.current_points ?? 0
  const newPoints = previousPoints + amount

  const { data: updatedCard } = await supabase
    .from('loyalty_cards')
    .update({
      current_points: newPoints,
      total_visits: (card.total_visits ?? 0) + (params.incrementVisits ? 1 : 0),
      last_visit_at: new Date().toISOString(),
    })
    .eq('id', card.id)
    .select()
    .single()

  await supabase.from('transactions').insert({
    loyalty_card_id: card.id,
    business_id: business.id,
    type: 'earn',
    stamps_added: null,
    points_added: amount,
    description: `${amount} point${amount > 1 ? 's' : ''} ajouté${amount > 1 ? 's' : ''}`,
  })

  const message = `+${amount} point${amount > 1 ? 's' : ''} (total : ${newPoints})`

  // Check if a reward tier threshold was just reached
  const { data: reachedTiers } = await supabase
    .from('reward_tiers')
    .select('points_required')
    .eq('business_id', business.id)
    .gt('points_required', previousPoints)
    .lte('points_required', newPoints)
    .limit(1)

  if (reachedTiers && reachedTiers.length > 0) {
    notifyClient(card.id, card.qr_code_id, 'reward_reached', {
      title: business.business_name,
      body: 'Récompense débloquée ! Montre ta carte au comptoir.',
    }).catch(() => {})
  }

  setPendingWalletAction(card.qr_code_id, 'add')

  return { success: true, message, updatedCard: updatedCard ?? {}, customer: null, newValue: newPoints }
}

// ── Error class ──

export class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}
