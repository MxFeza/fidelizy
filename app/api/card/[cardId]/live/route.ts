import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// Lightweight polling endpoint — returns mutable fields + rewards & wheel status.
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
    .select('loyalty_type, gamification')
    .eq('id', card.business_id)
    .single()

  // Reward tiers (for points-based businesses)
  let rewards: { id: string; reward_name: string; points_required: number }[] = []
  if (business?.loyalty_type === 'points') {
    const { data: tiers } = await supabase
      .from('reward_tiers')
      .select('id, reward_name, points_required')
      .eq('business_id', card.business_id)
      .order('points_required', { ascending: true })

    rewards = tiers ?? []
  }

  // Wheel status
  const gamification = business?.gamification ?? {}
  let wheel = null
  if (gamification.wheel_enabled && business?.loyalty_type === 'points') {
    const cost = gamification.wheel_cost_points ?? 10
    wheel = {
      enabled: true,
      cost,
      eligible: (card.current_points ?? 0) >= cost,
    }
  }

  return NextResponse.json(
    {
      stamps: card.current_stamps ?? 0,
      points: card.current_points ?? 0,
      rewards,
      wheel,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
