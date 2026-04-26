import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoyaltyClient from './LoyaltyClient'
import type { Business } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LoyaltyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.id)
    .single<Business>()

  if (!business) redirect('/dashboard/login')

  return <LoyaltyClient business={business} />
}
