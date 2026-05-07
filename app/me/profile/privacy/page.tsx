import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import PrivacyClient from './PrivacyClient'

export const metadata = { title: 'Confidentialité — Izou' }

export default async function PrivacyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) redirect('/me')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id, first_name')
    .eq('email', user.email)
    .maybeSingle()

  if (!customer) redirect('/me')

  const { data: card } = await service
    .from('loyalty_cards')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return <PrivacyClient firstName={customer.first_name as string} cardId={card?.id ?? null} />
}
