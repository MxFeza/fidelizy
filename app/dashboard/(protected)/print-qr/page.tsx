import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PrintQrClient from './PrintQrClient'

export default async function PrintQrPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('business_name, short_code')
    .eq('id', user.id)
    .single()

  if (!business) redirect('/dashboard/settings')

  return (
    <PrintQrClient
      businessName={business.business_name}
      shortCode={business.short_code}
    />
  )
}
