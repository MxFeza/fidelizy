import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import ProfileClient from './ProfileClient'

export const metadata = {
  title: 'Mon profil — Izou',
}

interface CustomerRecord {
  id: string
  first_name: string
  email: string | null
  phone: string | null
  created_at: string | null
}

/**
 * /me/profile — page profil client (Story 4.7 P1).
 *
 * Affiche les infos compte + actions RGPD (modifier prénom, exporter
 * les données, supprimer le compte).
 */
export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) redirect('/me')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id, first_name, email, phone, created_at')
    .eq('email', user.email)
    .maybeSingle<CustomerRecord>()

  if (!customer) redirect('/me')

  return <ProfileClient customer={customer} />
}
