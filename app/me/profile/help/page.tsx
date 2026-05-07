import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import HelpClient from './HelpClient'

export const metadata = { title: 'Aide & support — Izou' }

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) redirect('/me')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id')
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

  return <HelpClient cardId={card?.id ?? null} />
}
