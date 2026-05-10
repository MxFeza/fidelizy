import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import ProfileClient from './ProfileClient'
import type { CardColor, NotificationPrefs } from '@/lib/types'

export const metadata = {
  title: 'Mon profil — Izou',
}

export interface ProfileCustomer {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  notification_prefs: NotificationPrefs
  card_color: CardColor | null
  created_at: string | null
}

/**
 * /me/profile — page profil client (Story 4.7 v2).
 *
 * Refonte 2026-05-07 : form Prénom+Nom+Email + avatar + menu Réglages
 * (notifications, privacy, help, feedback, security, card-customization)
 * + logout + delete (2-step strict).
 */
export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) redirect('/me')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id, first_name, last_name, email, phone, avatar_url, notification_prefs, card_color, created_at')
    .eq('email', user.email)
    .maybeSingle<ProfileCustomer>()

  if (!customer) redirect('/me')

  // BottomTabBarClient nécessite un cardId — on prend la 1ère carte active.
  // /!\ BUG FIX 2026-05-10 : on prend `qr_code_id` (le segment de route
  // /card/[cardId]) et NON `id` (UUID interne loyalty_cards). Avant ce fix,
  // BottomTabBar construisait des URLs `/card/<uuid-interne>/...` qui ne
  // matchaient aucune carte dans `/card/[cardId]/page.tsx` qui query par
  // `qr_code_id` → 404 systématique en navigation profil → carte/parrainage.
  const { data: card } = await service
    .from('loyalty_cards')
    .select('qr_code_id')
    .eq('customer_id', customer.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return <ProfileClient customer={customer} cardId={card?.qr_code_id ?? null} />
}
