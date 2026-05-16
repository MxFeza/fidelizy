import { Suspense, cache } from 'react'
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

/**
 * Cache au niveau React/Next per-request : `generateMetadata` et la page
 * principale partageaient avant deux fetches identiques (card + business).
 * `cache()` dédup le travail dans un même render, ce qui fait économiser
 * un round-trip Supabase complet à chaque ouverture de carte.
 */
const fetchCardAndBusiness = cache(async (qrCodeId: string) => {
  const supabase = createServiceClient()
  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('*, customers(*)')
    .eq('qr_code_id', qrCodeId)
    .single()
  if (!card) return null

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', card.business_id)
    .single()
  if (!business) return null

  return { card, business }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cardId } = await params
  const data = await fetchCardAndBusiness(cardId)

  const title = data ? `Carte ${data.business.business_name}` : 'Ma carte de fidélité'
  const themeColor = data?.business.primary_color || '#1E1E1E'

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
  const data = await fetchCardAndBusiness(cardId)

  if (!data) notFound()

  const { card, business } = data
  const supabase = createServiceClient()
  const cardToken = generateCardToken(card.qr_code_id)
  const tiers = resolveClientTiers(business)

  // Run independent queries in parallel : transactions + auth lookup +
  // onboarding status are all gated by `card` but otherwise unrelated.
  // Avant ce changement : 4 round-trips séquentiels (card → business →
  // transactions → onboarding). Maintenant : 1 + max(rest) — visiblement
  // plus fluide sur 4G mobile.
  const transactionsP = supabase
    .from('transactions')
    .select('*')
    .eq('loyalty_card_id', card.id)
    .order('created_at', { ascending: false })

  // SSR fetch onboarding status pour éviter le flash banner client-side.
  // L'auth client est faite via cookie SSR (createClient) — null si pas connecté
  // ou si la carte ne correspond pas (parcours QR direct sans login).
  const onboardingP: Promise<OnboardingStatus | null> = (async () => {
    try {
      const userClient = await createClient()
      const { data: { user } } = await userClient.auth.getUser()
      if (user?.email && card.customers?.email === user.email && card.customer_id) {
        return await getCustomerTaskStatus(card.customer_id)
      }
    } catch {
      // pas de session = pas d'onboarding banner — silencieux.
    }
    return null
  })()

  const [{ data: transactions }, onboardingStatus] = await Promise.all([
    transactionsP,
    onboardingP,
  ])

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
