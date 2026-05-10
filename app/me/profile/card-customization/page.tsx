import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import CardCustomizationClient from './CardCustomizationClient'
import type { CardColor } from '@/lib/types'

export const metadata = { title: 'Personnaliser ma carte — Izou' }

export default async function CardCustomizationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) redirect('/me')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id, first_name, card_color')
    .eq('email', user.email)
    .maybeSingle<{ id: string; first_name: string; card_color: CardColor | null }>()
  if (!customer) redirect('/me')

  // Bug fix 2026-05-10 : qr_code_id (route segment) au lieu de id (UUID interne).
  const { data: card } = await service
    .from('loyalty_cards')
    .select('qr_code_id, current_stamps, current_points, businesses(stamps_required, loyalty_type, logo_url, card_image_url)')
    .eq('customer_id', customer.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const business = (card?.businesses as { stamps_required?: number; loyalty_type?: 'stamps' | 'points'; logo_url?: string | null; card_image_url?: string | null } | null) ?? null

  return (
    <CardCustomizationClient
      cardId={card?.qr_code_id ?? null}
      customerName={customer.first_name}
      initialColor={customer.card_color}
      preview={{
        loyaltyType: business?.loyalty_type ?? 'stamps',
        currentStamps: card?.current_stamps ?? 0,
        stampsRequired: business?.stamps_required ?? 10,
        currentPoints: Number(card?.current_points ?? 0),
        businessLogoUrl: business?.logo_url ?? null,
        cardImageUrl: business?.card_image_url ?? null,
      }}
    />
  )
}
