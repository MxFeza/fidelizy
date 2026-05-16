import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import JoinFlow from './JoinFlow'
import { joinUrl } from '@/lib/config'

interface PageProps {
  params: Promise<{ businessId: string }>
  searchParams: Promise<{ ref?: string }>
}

const SELECT_COLUMNS =
  'id, business_name, primary_color, loyalty_type, stamps_required, stamps_reward, points_per_euro, logo_url, banner_url, gamification, short_code, description'

async function fetchBusiness(businessId: string) {
  const supabase = createServiceClient()
  const { data: byId } = await supabase
    .from('businesses')
    .select(SELECT_COLUMNS)
    .eq('id', businessId)
    .maybeSingle()
  if (byId) return byId
  const { data: byShortCode } = await supabase
    .from('businesses')
    .select(SELECT_COLUMNS)
    .eq('short_code', businessId)
    .maybeSingle()
  return byShortCode
}

/**
 * Open Graph metadata dynamique par commerce.
 *
 * Lien partagé → preview riche avec banner/logo du commerce au lieu du
 * fallback root Izou "montgolfière". Boost l'acquisition virale en rendant
 * le partage WhatsApp/SMS/Instagram immédiatement reconnaissable comme
 * la marque du commerce, pas Izou.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { businessId } = await params
  const business = await fetchBusiness(businessId)

  if (!business) {
    return {
      title: 'Carte de fidélité — Izou',
      description: 'Rejoignez le programme de fidélité de votre commerce.',
    }
  }

  const title = `Rejoignez le programme fidélité de ${business.business_name}`
  const description =
    business.description?.trim() ||
    `Recevez vos ${business.loyalty_type === 'stamps' ? 'tampons' : 'points'} et débloquez vos récompenses chez ${business.business_name}.`

  // Préférence : banner_url (1584×396 LinkedIn-style) > logo_url > rien
  const ogImage = business.banner_url || business.logo_url || undefined
  const canonical = joinUrl(business.short_code || business.id)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Izou',
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default async function JoinPage({ params, searchParams }: PageProps) {
  const { businessId } = await params
  const { ref: referralCode } = await searchParams
  const business = await fetchBusiness(businessId)

  if (!business) notFound()

  return <JoinFlow business={business} initialReferralCode={referralCode} />
}
