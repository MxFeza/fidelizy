export type LoyaltyType = 'stamps' | 'points'

export interface Business {
  id: string
  email: string
  business_name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string | null
  loyalty_type: LoyaltyType
  stamps_required: number
  stamps_reward: string
  points_per_euro: number
  is_active: boolean
  created_at: string
}

export interface Customer {
  id: string
  first_name: string
  phone: string
  email: string | null
  push_token: string | null
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
