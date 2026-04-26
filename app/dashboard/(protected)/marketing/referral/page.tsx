import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import ReferralClient from './ReferralClient'
import type { Business } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ReferralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.id)
    .single<Business>()

  if (!business) redirect('/dashboard/login')

  const service = createServiceClient()
  const [{ count: totalReferrals }, { count: thisMonthReferrals }] = await Promise.all([
    service.from('referrals').select('id', { count: 'exact', head: true }).eq('business_id', business.id),
    service
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ])

  return (
    <ReferralClient
      business={business}
      stats={{
        total: totalReferrals ?? 0,
        thisMonth: thisMonthReferrals ?? 0,
      }}
    />
  )
}
