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

  // Bug fix 2026-05-10 : qr_code_id (route segment) au lieu de id (UUID interne)
  // — sinon BottomTabBar liens vers /card/<faux-id>/... → 404.
  const { data: card } = await service
    .from('loyalty_cards')
    .select('qr_code_id')
    .eq('customer_id', customer.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return <HelpClient cardId={card?.qr_code_id ?? null} />
}
