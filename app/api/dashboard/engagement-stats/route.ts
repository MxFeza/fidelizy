import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { gamificationLimiter, getIP } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  const { success } = await gamificationLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
  }

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const businessId = user.id

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // Run all counts in parallel
  const [surprisesRes, wheelRes, missionsRes, referralsRes] = await Promise.all([
    // Surprise transactions this month
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .like('description', 'Surprise%')
      .gte('created_at', monthStart),

    // Wheel spins this month
    supabase
      .from('wheel_spins')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('created_at', monthStart),

    // Mission completions this month
    supabase
      .from('mission_completions')
      .select('id, missions!inner(business_id)', { count: 'exact', head: true })
      .eq('missions.business_id', businessId)
      .eq('status', 'completed')
      .gte('created_at', monthStart),

    // Referrals total
    supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId),
  ])

  return NextResponse.json({
    surprises_month: surprisesRes.count ?? 0,
    wheel_spins_month: wheelRes.count ?? 0,
    missions_completed_month: missionsRes.count ?? 0,
    referrals_total: referralsRes.count ?? 0,
  })
}
