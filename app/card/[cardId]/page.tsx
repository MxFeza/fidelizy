import { Suspense } from 'react'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { generateCardToken } from '@/lib/auth/cardToken'
import { resolveClientTiers } from '@/lib/services/loyalty.tiers'
import { getCustomerTaskStatus, type OnboardingStatus } from '@/lib/onboarding/getCustomerTaskStatus'
import CardPageClient from './CardPageClient'

interface PageProps {
  params: Promise<{ cardId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cardId } = await params
  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('business_id')
    .eq('qr_code_id', cardId)
    .single()

  let title = 'Ma carte de fidélité'
  let themeColor = '#4f46e5'

  if (card) {
    const { data: business } = await supabase
      .from('businesses')
      .select('business_name, primary_color')
      .eq('id', card.business_id)
      .single()
    if (business) {
      title = `Carte ${business.business_name}`
      themeColor = business.primary_color || '#4f46e5'
    }
  }

  return {
    title,
    manifest: `/api/manifest/${cardId}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title,
    },
    other: {
      'theme-color': themeColor,
    },
  }
}

export default async function CardPage({ params }: PageProps) {
  const { cardId } = await params
  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('*, customers(*)')
    .eq('qr_code_id', cardId)
    .single()

  if (!card) notFound()

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', card.business_id)
    .single()

  if (!business) notFound()

  const cardToken = generateCardToken(card.qr_code_id)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('loyalty_card_id', card.id)
    .order('created_at', { ascending: false })

  const tiers = resolveClientTiers(business)

  // SSR fetch onboarding status pour éviter le flash banner client-side.
  // L'auth client est faite via cookie SSR (createClient) — null si pas connecté
  // ou si la carte ne correspond pas (parcours QR direct sans login).
  let onboardingStatus: OnboardingStatus | null = null
  try {
    const userClient = await createClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (user?.email && card.customers?.email === user.email && card.customer_id) {
      onboardingStatus = await getCustomerTaskStatus(card.customer_id)
    }
  } catch {
    // pas de session = pas d'onboarding banner — silencieux.
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <CardPageClient
        card={card}
        business={business}
        transactions={transactions ?? []}
        tiers={tiers}
        cardToken={cardToken}
        initialOnboardingStatus={onboardingStatus}
      />
    </Suspense>
  )
}
