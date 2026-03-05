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

    return NextResponse.json({
      visitsToday: visitsToday ?? 0,
      newClientsMonth: newClientsMonth ?? 0,
      distributedMonth,
      loyaltyType: business.loyalty_type,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
