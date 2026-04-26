import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BusinessClient from './BusinessClient'

export default async function MyBusinessPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, business_name, primary_color, business_type, short_code, logo_url')
    .eq('id', user.id)
    .single()

  if (!business) redirect('/dashboard/login')

  return <BusinessClient business={business} />
}
