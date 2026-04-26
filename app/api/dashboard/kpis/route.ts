export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'

export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw AppError.auth('Non authentifié')

  const businessId = user.id

  const { data: business } = await supabase
    .from('businesses')
    .select('id, loyalty_type')
    .eq('id', businessId)
    .single()

  if (!business) throw AppError.notFound('Commerce introuvable')

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count: visitsToday } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('type', 'earn')
    .gte('created_at', todayStart.toISOString())

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { count: newClientsMonth } = await supabase
    .from('loyalty_cards')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', monthStart.toISOString())

  const { count: visitsMonth } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('type', 'earn')
    .gte('created_at', monthStart.toISOString())

  const { data: monthTransactions } = await supabase
    .from('transactions')
    .select('stamps_added, points_added')
    .eq('business_id', businessId)
    .eq('type', 'earn')
    .gte('created_at', monthStart.toISOString())

  let distributedMonth = 0
  if (monthTransactions) {
    if (business.loyalty_type === 'stamps') {
      distributedMonth = monthTransactions.reduce((sum, t) => sum + (t.stamps_added ?? 0), 0)
    } else {
      distributedMonth = monthTransactions.reduce((sum, t) => sum + (t.points_added ?? 0), 0)
    }
  }

  const { data: allCards } = await supabase
    .from('loyalty_cards')
    .select('total_visits, last_visit_at')
    .eq('business_id', businessId)

  const totalCards = allCards?.length ?? 0
  const returning = allCards?.filter((c) => (c.total_visits ?? 0) >= 2).length ?? 0
  const tauxRetour = totalCards > 0 ? Math.round((returning / totalCards) * 100) : 0

  const cardsWithVisits = allCards?.filter((c) => (c.total_visits ?? 0) > 0) ?? []
  const totalVisitsAll = cardsWithVisits.reduce((sum, c) => sum + (c.total_visits ?? 0), 0)
  const frequenceMoyenne = cardsWithVisits.length > 0
    ? Math.round((totalVisitsAll / cardsWithVisits.length) * 10) / 10
    : 0

  const now = Date.now()
  const MS_20 = 20 * 24 * 60 * 60 * 1000
  const MS_60 = 60 * 24 * 60 * 60 * 1000
  const clientsARisque = allCards?.filter((c) => {
    if (!c.last_visit_at) return false
    const diff = now - new Date(c.last_visit_at).getTime()
    return diff >= MS_20 && diff < MS_60
  }).length ?? 0

  const clientsPerdus = allCards?.filter((c) => {
    if (!c.last_visit_at) return true
    const diff = now - new Date(c.last_visit_at).getTime()
    return diff >= MS_60
  }).length ?? 0

  const clientsInactifs = clientsARisque
  const clientsActifs = Math.max(0, totalCards - clientsInactifs - clientsPerdus)

  return NextResponse.json({
    visitsToday: visitsToday ?? 0,
    visitsMonth: visitsMonth ?? 0,
    newClientsMonth: newClientsMonth ?? 0,
    distributedMonth,
    loyaltyType: business.loyalty_type,
    tauxRetour,
    frequenceMoyenne,
    clientsTotal: totalCards,
    clientsActifs,
    clientsInactifs,
    clientsARisque,
    clientsPerdus,
  })
})
