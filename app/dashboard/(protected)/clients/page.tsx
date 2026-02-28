import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientsClient from './ClientsClient'
import type { Business, Customer, LoyaltyCard } from '@/lib/types'

export type ClientWithCard = LoyaltyCard & { customers: Customer }

export default async function ClientsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!business) redirect('/dashboard/settings')

  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('*, customers(*)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  const clients = (cards ?? []) as ClientWithCard[]

  const now = Date.now()
  const MS_30 = 30 * 24 * 60 * 60 * 1000
  const MS_60 = 60 * 24 * 60 * 60 * 1000

  function refTime(c: ClientWithCard) {
    return c.last_visit_at
      ? new Date(c.last_visit_at).getTime()
      : new Date(c.created_at).getTime()
  }

  const activeCount = clients.filter((c) => now - refTime(c) < MS_30).length
  const inactiveCount = clients.filter((c) => {
    const diff = now - refTime(c)
    return diff >= MS_30 && diff < MS_60
  }).length
  const lostCount = clients.filter((c) => now - refTime(c) >= MS_60).length
  const returnRate =
    clients.length > 0
      ? Math.round((clients.filter((c) => (c.total_visits ?? 0) >= 2).length / clients.length) * 100)
      : 0

  return (
    <ClientsClient
      clients={clients}
      business={business as Business}
      stats={{ active: activeCount, inactive: inactiveCount, lost: lostCount, returnRate }}
    />
  )
}
