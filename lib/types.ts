// Manual types — will be replaced by lib/database.types.ts
// Run: npx supabase gen types typescript --project-id XXX > lib/database.types.ts

export type LoyaltyType = 'stamps' | 'points'

export type BusinessType = 'cafe' | 'restaurant' | 'bakery' | 'snack' | 'hair' | 'nails'

export interface Business {
  id: string
  email: string
  business_name: string
  logo_url: string | null
  banner_url: string | null
  card_image_url: string | null
  primary_color: string
  secondary_color: string | null
  loyalty_type: LoyaltyType
  stamps_required: number
  stamps_reward: string
  points_per_euro: number
  is_active: boolean
  short_code: string | null
  business_type: BusinessType | null
  welcome_seen: boolean
  referral_enabled: boolean
  referral_referrer_bonus: number
  referral_referred_bonus: number
  program_name: string | null
  program_description: string | null
  scan_cooldown_hours: number
  reward_tiers: LoyaltyTier[]
  // Mon entreprise (Story 8.1)
  first_name: string | null
  last_name: string | null
  address: string | null
  phone: string | null
  gmb_url: string | null
  gmb_visible: boolean
  website_url: string | null
  booking_url: string | null
  description: string | null
  opening_hours: string | null
  // Onboarding tracking (Story 9.1 + refonte 2026-05-15)
  onboarding_started_at: string | null
  onboarding_completed_at: string | null
  created_at: string
}

/**
 * Palier de recompense (JSONB stocke dans businesses.reward_tiers).
 * Distinct de l'ancienne interface RewardTier (table dediee jamais utilisee).
 */
export interface LoyaltyTier {
  id: string
  emoji: string
  name: string
  /** Seuil = nb tampons (mode stamps) OU nb points (mode points) */
  threshold: number
}

export interface NotificationPrefs {
  push_enabled?: boolean
  stamps_enabled?: boolean
  rewards_enabled?: boolean
  campaigns_enabled?: boolean
  referrals_enabled?: boolean
}

export interface Customer {
  id: string
  first_name: string
  last_name: string | null
  phone: string
  email: string | null
  push_token: string | null
  notification_prefs: NotificationPrefs
  created_at: string
}

export interface LoyaltyCard {
  id: string
  customer_id: string
  business_id: string
  current_stamps: number
  current_points: number
  total_visits: number
  last_visit_at: string | null
  qr_code_id: string
  is_active: boolean
  points_multiplier: number
  created_at: string
}

export interface Transaction {
  id: string
  loyalty_card_id: string
  business_id: string
  type: 'earn' | 'redeem'
  stamps_added: number | null
  points_added: number | null
  description: string | null
  created_at: string
}

export interface RewardTier {
  id: string
  business_id: string
  points_required: number
  reward_name: string
  reward_description: string | null
  sort_order: number
  created_at: string
}

export interface RewardClaim {
  id: string
  loyalty_card_id: string
  reward_tier_id: string
  reward_name: string
  points_spent: number
  created_at: string
}

export interface Referral {
  id: string
  referrer_card_id: string
  referred_card_id: string
  business_id: string
  referrer_points_awarded: number
  referred_points_awarded: number
  created_at: string
}
