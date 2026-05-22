import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import JoinFlow from './JoinFlow'
import { joinUrl } from '@/lib/config'
import { scanCard } from '@/lib/services/loyalty.service'

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

  // Retour user 2026-05-22 : si le client a deja une session active ET deja
  // une carte chez ce commerce, on declenche un scan auto (+1 tampon/point
  // si pas en cooldown) au lieu de re-derouler le flow d'inscription. Sans
  // ce shortcut, le client doit refaire toute l'inscription pour le meme
  // commerce — friction inacceptable sur le flow core "scan QR du commercant".
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email) {
    const service = createServiceClient()
    const { data: customer } = await service
      .from('customers')
      .select('id')
      .eq('email', user.email)
      .maybeSingle<{ id: string }>()

    if (customer) {
      const { data: existingCard } = await service
        .from('loyalty_cards')
        .select('id, qr_code_id')
        .eq('customer_id', customer.id)
        .eq('business_id', business.id)
        .maybeSingle<{ id: string; qr_code_id: string }>()

      if (existingCard) {
        // Cooldown anti-fraude (4h par defaut) gere par scanCard ; on swallow
        // l'erreur pour que le client soit toujours redirige vers sa carte
        // meme si pas de nouveau tampon credite.
        try {
          await scanCard(service, {
            qrCodeId: existingCard.qr_code_id,
            business: {
              id: business.id,
              business_name: business.business_name,
              loyalty_type: business.loyalty_type,
              stamps_required: business.stamps_required,
              stamps_reward: business.stamps_reward ?? '',
              points_per_euro: business.points_per_euro,
            },
          })
        } catch {
          // cooldown actif ou autre erreur metier : on redirige quand meme
        }
        redirect(`/card/${existingCard.id}?scanned=1`)
      }
    }
  }

  return <JoinFlow business={business} initialReferralCode={referralCode} />
}
