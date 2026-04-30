import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlanClient from './PlanClient'

/**
 * Server wrapper : auth check + passe l'email au PlanClient.
 *
 * Refactor 2026-05-01 (B4 fix) : la page etait directement un server
 * component qui rendait <SettingsSection> (client component) en passant
 * un Icon component en prop. Next 16 refuse cette serialization
 * server -> client : "Functions cannot be passed directly to Client
 * Components unless you explicitly expose it by marking it with use server".
 * Solution : separer en server wrapper (auth) + client (rendering).
 */
export default async function PlanPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  return <PlanClient userEmail={user.email ?? null} />
}
