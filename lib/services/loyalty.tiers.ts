import type { Business, LoyaltyTier } from '@/lib/types'

type TierSourceBusiness = Pick<
  Business,
  'loyalty_type' | 'reward_tiers' | 'stamps_required' | 'stamps_reward'
>

/**
 * Source unique pour les paliers cote client (lecture).
 *
 * Lit `business.reward_tiers` (JSONB) ecrit par /dashboard/marketing/loyalty.
 * Si vide en mode tampons, retourne un palier virtuel base sur `stamps_reward`
 * pour ne pas casser les commerces single-tier (4NLS, Smoothies & Co).
 *
 * Note : la table legacy `reward_tiers` n'est plus lue cote client depuis
 * Story 4.3.b. La migration cote merchant (ClientDetailClient) reste a faire.
 */
export function resolveClientTiers(business: TierSourceBusiness): LoyaltyTier[] {
  const tiers = Array.isArray(business.reward_tiers) ? business.reward_tiers : []

  if (tiers.length > 0) {
    return [...tiers].sort((a, b) => a.threshold - b.threshold)
  }

  if (business.loyalty_type === 'stamps' && business.stamps_reward?.trim()) {
    return [
      {
        id: 'virtual-stamps-reward',
        emoji: '🎁',
        name: business.stamps_reward.trim(),
        threshold: business.stamps_required ?? 10,
      },
    ]
  }

  return []
}
