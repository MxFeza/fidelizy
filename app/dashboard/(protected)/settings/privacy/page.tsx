import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PrivacyClient from './PrivacyClient'

export default async function PrivacyPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('business_name')
    .eq('id', user.id)
    .single()

  return <PrivacyClient businessName={business?.business_name ?? 'Mon commerce'} />
}
