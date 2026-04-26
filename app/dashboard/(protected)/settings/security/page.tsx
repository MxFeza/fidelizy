import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SecurityClient from './SecurityClient'

export default async function SecurityPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  return <SecurityClient email={user.email ?? ''} />
}
