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

  return (
    <ClientsClient
      clients={clients}
      business={business as Business}
    />
  )
}
