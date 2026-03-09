import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { missionsLimiter, getIP } from '@/lib/ratelimit'
import { generateReferralCode } from '@/lib/referral'

interface RouteParams {
  params: Promise<{ cardId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { success } = await missionsLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
  }

  const { cardId } = await params
  const supabase = createServiceClient()

  // Get card + customer info
  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, business_id, birthday, customers!inner(first_name, phone, email)')
    .eq('qr_code_id', cardId)
    .single()

  if (!card) {
    return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
  }

  const customer = card.customers as unknown as { first_name: string; phone: string; email: string | null }

  // Get active missions for this business
  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .eq('business_id', card.business_id)
    .eq('is_active', true)

  if (!missions?.length) {
    return NextResponse.json({
      missions: [],
      referral_code: generateReferralCode(customer.first_name, customer.phone),
    })
  }

  // Get completions for this card
  const missionIds = missions.map((m) => m.id)
  const { data: completions } = await supabase
    .from('mission_completions')
    .select('*')
    .eq('card_id', card.id)
    .in('mission_id', missionIds)

  // Get referral count for this card
  const { count: referralCount } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_card_id', card.id)

  // Get pwa visits this month
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const { count: visitCount } = await supabase
    .from('pwa_visits')
    .select('card_id', { count: 'exact', head: true })
    .eq('card_id', card.id)
    .gte('visit_date', monthStart)

  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const result = missions.map((mission) => {
    const missionCompletions = (completions ?? []).filter((c) => c.mission_id === mission.id)

    switch (mission.template_key) {
      case 'google_review': {
        const pending = missionCompletions.find((c) => c.status === 'pending_review')
        const done = missionCompletions.find((c) => c.status === 'completed')
        return {
          ...mission,
          completed: !!done,
          pending: !!pending,
        }
      }
      case 'complete_profile': {
        const done = missionCompletions.find((c) => c.status === 'completed')
        const hasEmail = !!customer.email
        const hasBirthday = !!(card as unknown as { birthday: string | null }).birthday
        return {
          ...mission,
          completed: !!done,
          profile_complete: hasEmail && hasBirthday,
        }
      }
      case 'monthly_visits': {
        const target = (mission.config as Record<string, unknown>)?.target as number ?? 5
        const current = visitCount ?? 0
        const doneThisMonth = missionCompletions.find(
          (c) => c.status === 'completed' && c.period === currentPeriod
        )
        return {
          ...mission,
          completed: !!doneThisMonth,
          progress: { current, target },
        }
      }
      case 'referral': {
        const done = missionCompletions.find((c) => c.status === 'completed')
        return {
          ...mission,
          completed: !!done || (referralCount ?? 0) > 0,
          referral_count: referralCount ?? 0,
        }
      }
      default:
        return { ...mission, completed: false }
    }
  })

  return NextResponse.json({
    missions: result,
    referral_code: generateReferralCode(customer.first_name, customer.phone),
  })
}
