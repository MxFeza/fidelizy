import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/dashboard/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('business_name')
    .eq('id', user.id)
    .single()

  return (
    <ProfileClient
      email={user.email ?? ''}
      businessName={business?.business_name ?? 'Mon Commerce'}
    />
  )
}
