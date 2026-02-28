import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import type { Business } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  // businesses.id = auth.users.id (relation 1:1)
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!business) redirect('/dashboard/settings')

  // Total clients
  const { count: totalCustomers } = await supabase
    .from('loyalty_cards')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)

  // Visites aujourd'hui
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count: visitsToday } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('type', 'earn')
    .gte('created_at', todayStart.toISOString())

  // 10 derniers scans
  const { data: recentScans } = await supabase
    .from('transactions')
    .select(`
      id,
      type,
      stamps_added,
      points_added,
      created_at,
      loyalty_cards (
        current_stamps,
        current_points,
        customers (first_name, phone)
      )
    `)
    .eq('business_id', business.id)
    .eq('type', 'earn')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <DashboardClient
      business={business as Business}
      totalCustomers={totalCustomers ?? 0}
      visitsToday={visitsToday ?? 0}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentScans={(recentScans ?? []) as any}
    />
  )
}
