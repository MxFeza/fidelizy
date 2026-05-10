import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import NotificationsClient from './NotificationsClient'
import type { NotificationPrefs } from '@/lib/types'

export const metadata = { title: 'Notifications — Izou' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) redirect('/me')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id, notification_prefs')
    .eq('email', user.email)
    .maybeSingle<{ id: string; notification_prefs: NotificationPrefs }>()

  if (!customer) redirect('/me')

  // Bug fix 2026-05-10 : qr_code_id (route segment) au lieu de id (UUID interne).
  const { data: card } = await service
    .from('loyalty_cards')
    .select('qr_code_id')
    .eq('customer_id', customer.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return (
    <NotificationsClient
      initialPrefs={customer.notification_prefs ?? {}}
      cardId={card?.qr_code_id ?? null}
    />
  )
}
