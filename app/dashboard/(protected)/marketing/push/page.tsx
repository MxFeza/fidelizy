import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PushClient from './PushClient'
import type { Business } from '@/lib/types'

export const dynamic = 'force-dynamic'

export interface PushBroadcast {
  id: string
  title: string
  body: string
  recipient_count: number
  status: string
  scheduled_at: string | null
  sent_at: string
}

export default async function PushPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.id)
    .single<Business>()

  if (!business) redirect('/dashboard/login')

  const { data: broadcasts } = await supabase
    .from('push_broadcasts')
    .select('id, title, body, recipient_count, status, scheduled_at, sent_at')
    .eq('business_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(50)

  return <PushClient business={business} initialBroadcasts={(broadcasts ?? []) as PushBroadcast[]} />
}
