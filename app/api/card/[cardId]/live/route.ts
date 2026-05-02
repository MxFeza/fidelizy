import { createServiceClient } from '@/lib/supabase/service'
import { resolveClientTiers } from '@/lib/services/loyalty.tiers'
import { NextRequest, NextResponse } from 'next/server'
import type { LoyaltyTier } from '@/lib/types'

// Lightweight polling endpoint — returns mutable fields + tiers (JSONB).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params
  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, current_stamps, current_points, business_id')
    .eq('qr_code_id', cardId)
    .single()

  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: business } = await supabase
    .from('businesses')
    .select('loyalty_type, reward_tiers, stamps_required, stamps_reward')
    .eq('id', card.business_id)
    .single()

  const tiers: LoyaltyTier[] = business ? resolveClientTiers(business) : []

  return NextResponse.json(
    {
      stamps: card.current_stamps ?? 0,
      points: card.current_points ?? 0,
      tiers,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
