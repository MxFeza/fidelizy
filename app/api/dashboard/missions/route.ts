import { createServiceClient } from '@/lib/supabase/service'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { gamificationLimiter, getIP } from '@/lib/ratelimit'

const DEFAULT_MISSIONS = [
  { template_key: 'google_review', reward_points: 3, is_active: false, config: {} },
  { template_key: 'referral', reward_points: 5, is_active: false, config: { referred_bonus: 2 } },
  { template_key: 'complete_profile', reward_points: 2, is_active: false, config: {} },
  { template_key: 'monthly_visits', reward_points: 1, is_active: false, config: { target: 5 } },
]

export async function GET(request: NextRequest) {
  const { success } = await gamificationLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
  }

  const supabaseAuth = await createServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .eq('business_id', user.id)

  // If no missions exist, return defaults
  if (!missions?.length) {
    return NextResponse.json({
      missions: DEFAULT_MISSIONS.map((m) => ({ ...m, id: null, business_id: user.id })),
    })
  }

  // Merge with defaults (for any missing templates)
  const result = DEFAULT_MISSIONS.map((def) => {
    const existing = missions.find((m) => m.template_key === def.template_key)
    if (existing) return existing
    return { ...def, id: null, business_id: user.id }
  })

  return NextResponse.json({ missions: result })
}

export async function PUT(request: NextRequest) {
  const { success } = await gamificationLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
  }

  const supabaseAuth = await createServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { missions } = await request.json()

  if (!Array.isArray(missions)) {
    return NextResponse.json({ error: 'Format invalide' }, { status: 400 })
  }

  const supabase = createServiceClient()

  for (const m of missions) {
    if (!m.template_key) continue

    await supabase
      .from('missions')
      .upsert(
        {
          business_id: user.id,
          template_key: m.template_key,
          reward_points: m.reward_points ?? 3,
          is_active: m.is_active ?? false,
          config: m.config ?? {},
        },
        { onConflict: 'business_id,template_key' }
      )
  }

  return NextResponse.json({ ok: true })
}
