import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const businessId = user.id

    // Vérifier que le commerce existe
    const { data: business } = await supabase
      .from('businesses')
      .select('id, loyalty_type')
      .eq('id', businessId)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    // KPI 1 — Visites aujourd'hui
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count: visitsToday } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('type', 'earn')
      .gte('created_at', todayStart.toISOString())

    // KPI 2 — Nouveaux clients ce mois
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { count: newClientsMonth } = await supabase
      .from('loyalty_cards')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('created_at', monthStart.toISOString())

    // KPI 3 — Points/tampons distribués ce mois
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

    // KPI 4 — Taux de retour (clients avec 2+ visites)
    const { data: allCards } = await supabase
      .from('loyalty_cards')
      .select('total_visits, last_visit_at')
      .eq('business_id', businessId)

    const totalCards = allCards?.length ?? 0
    const returning = allCards?.filter((c) => (c.total_visits ?? 0) >= 2).length ?? 0
    const tauxRetour = totalCards > 0 ? Math.round((returning / totalCards) * 100) : 0

    // KPI 5 — Fréquence moyenne (visites / clients ayant au moins 1 visite)
    const cardsWithVisits = allCards?.filter((c) => (c.total_visits ?? 0) > 0) ?? []
    const totalVisitsAll = cardsWithVisits.reduce((sum, c) => sum + (c.total_visits ?? 0), 0)
    const frequenceMoyenne = cardsWithVisits.length > 0
      ? Math.round((totalVisitsAll / cardsWithVisits.length) * 10) / 10
      : 0

    // KPI 6 — Clients à risque (dernière visite entre 20 et 60 jours)
    const now = Date.now()
    const MS_20 = 20 * 24 * 60 * 60 * 1000
    const MS_60 = 60 * 24 * 60 * 60 * 1000
    const clientsARisque = allCards?.filter((c) => {
      if (!c.last_visit_at) return false
      const diff = now - new Date(c.last_visit_at).getTime()
      return diff >= MS_20 && diff < MS_60
    }).length ?? 0

    // KPI 7 — Clients perdus (dernière visite > 60 jours)
    const clientsPerdus = allCards?.filter((c) => {
      if (!c.last_visit_at) return true
      const diff = now - new Date(c.last_visit_at).getTime()
      return diff >= MS_60
    }).length ?? 0

    return NextResponse.json({
      visitsToday: visitsToday ?? 0,
      newClientsMonth: newClientsMonth ?? 0,
      distributedMonth,
      loyaltyType: business.loyalty_type,
      tauxRetour,
      frequenceMoyenne,
      clientsARisque,
      clientsPerdus,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
