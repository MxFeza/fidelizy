import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import MeLoginClient from './MeLoginClient'
import MeListClient from './MeListClient'

export const metadata = {
  title: 'Mes cartes — Izou',
}

interface CustomerRecord {
  id: string
  first_name: string
  email: string | null
  phone: string | null
}

interface BusinessRecord {
  business_name: string
  logo_url: string | null
  primary_color: string | null
  loyalty_type: string
  stamps_required: number | null
}

interface CardRecord {
  id: string
  qr_code_id: string
  current_stamps: number | null
  current_points: number | null
  businesses: BusinessRecord | null
}

/**
 * /me — Espace client centralise (Story 4.10.a).
 *
 * Gere 3 etats :
 *  1. Pas connecte → MeLoginClient (login + register direct)
 *  2. Connecte mais aucun customer en DB → MeLoginClient mode="needs_customer"
 *     (rare — auth.users existe mais pas de customer row)
 *  3. Connecte + cartes → MeListClient (Netflix-style selecteur)
 */
export default async function MePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return <MeLoginClient />
  }

  // Logged in : lookup customer by email
  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id, first_name, email, phone')
    .eq('email', user.email)
    .maybeSingle<CustomerRecord>()

  if (!customer) {
    // Edge case : auth user exists but no customer record. Force re-creation.
    return <MeLoginClient initialEmail={user.email} mode="needs_customer" />
  }

  const { data: cards } = await service
    .from('loyalty_cards')
    .select('id, qr_code_id, current_stamps, current_points, businesses(business_name, logo_url, primary_color, loyalty_type, stamps_required)')
    .eq('customer_id', customer.id)
    .returns<CardRecord[]>()

  return <MeListClient customer={customer} cards={cards ?? []} />
}
