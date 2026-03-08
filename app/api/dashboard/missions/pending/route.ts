import { createServiceClient } from '@/lib/supabase/service'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { gamificationLimiter, getIP } from '@/lib/ratelimit'

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

  // Get pending completions for this business
  const { data: completions } = await supabase
    .from('mission_completions')
    .select('id, proof_url, points_awarded, created_at, card_id, missions!inner(business_id, template_key)')
    .eq('status', 'pending_review')
    .eq('missions.business_id', user.id)

  if (!completions?.length) {
    return NextResponse.json({ pending: [] })
  }

  // Get customer names for each card
  const cardIds = [...new Set(completions.map((c) => c.card_id))]
  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('id, customers!inner(first_name)')
    .in('id', cardIds)

  const cardNameMap = new Map<string, string>()
  if (cards) {
    for (const c of cards) {
      const customer = c.customers as unknown as { first_name: string }
      cardNameMap.set(c.id, customer?.first_name ?? 'Client')
    }
  }

  const result = completions.map((c) => ({
    id: c.id,
    customer_name: cardNameMap.get(c.card_id) ?? 'Client',
    proof_url: c.proof_url,
    points_awarded: c.points_awarded,
    template_key: (c.missions as unknown as { template_key: string }).template_key,
    created_at: c.created_at,
  }))

  return NextResponse.json({ pending: result })
}
