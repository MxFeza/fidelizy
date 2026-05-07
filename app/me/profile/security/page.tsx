import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import SecurityClient from './SecurityClient'

export const metadata = { title: 'Sécurité — Izou' }

export default async function SecurityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) redirect('/me')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id, email')
    .eq('email', user.email)
    .maybeSingle<{ id: string; email: string | null }>()
  if (!customer) redirect('/me')

  const { data: card } = await service
    .from('loyalty_cards')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  // Date dernière modif password depuis Supabase Auth user metadata (best-effort)
  const passwordUpdatedAt = (user.user_metadata?.password_updated_at as string | undefined) ?? null

  return (
    <SecurityClient
      currentEmail={customer.email ?? user.email}
      passwordUpdatedAt={passwordUpdatedAt}
      cardId={card?.id ?? null}
    />
  )
}
