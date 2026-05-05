import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { generateReferralCode } from '@/lib/services/referral.service'
import ReferralClient from './ReferralClient'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ cardId: string }>
}

export const metadata: Metadata = {
  title: 'Parrainage — Izou',
}

interface ReferralListItem {
  id: string
  referredFirstName: string | null
  status: 'inscrit' | 'en_attente'
  bonusPoints: number
  createdAt: string
}

export default async function ReferralPage({ params }: PageProps) {
  const { cardId } = await params
  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, qr_code_id, business_id, customer_id, customers(first_name, phone)')
    .eq('qr_code_id', cardId)
    .single()

  if (!card) notFound()

  const { data: business } = await supabase
    .from('businesses')
    .select('id, business_name, short_code, primary_color, referral_enabled, referral_referrer_bonus, referral_referred_bonus, loyalty_type')
    .eq('id', card.business_id)
    .single()

  if (!business) notFound()

  const customer = card.customers as unknown as { first_name: string | null; phone: string | null } | null

  // Code parrainage calculé from first_name + phone (Story 4.5)
  // Si pas de phone (cas onboarding sans tel) → on retourne null et on bloque le partage côté UI
  const referralCode =
    customer?.first_name && customer?.phone
      ? generateReferralCode(customer.first_name, customer.phone)
      : null

  // Charge les filleuls du parrain courant
  const { data: referralsRaw } = await supabase
    .from('referrals')
    .select(`
      id, referrer_points_awarded, created_at,
      referred_card:referred_card_id (
        customers:customer_id (first_name)
      )
    `)
    .eq('referrer_card_id', card.id)
    .order('created_at', { ascending: false })

  const referrals: ReferralListItem[] = (referralsRaw ?? []).map((r) => {
    const refCard = r.referred_card as unknown as { customers: { first_name: string | null } | null } | null
    return {
      id: r.id,
      referredFirstName: refCard?.customers?.first_name ?? null,
      status: 'inscrit',
      bonusPoints: r.referrer_points_awarded ?? 0,
      createdAt: r.created_at,
    }
  })

  return (
    <ReferralClient
      cardId={card.qr_code_id}
      businessName={business.business_name}
      shortCode={business.short_code}
      primaryColor={business.primary_color}
      loyaltyType={business.loyalty_type}
      referralEnabled={business.referral_enabled}
      referrerBonus={business.referral_referrer_bonus ?? 0}
      referredBonus={business.referral_referred_bonus ?? 0}
      referralCode={referralCode}
      referrals={referrals}
    />
  )
}
