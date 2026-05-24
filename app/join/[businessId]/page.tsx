import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import JoinFlow from './JoinFlow'
import { joinUrl } from '@/lib/config'
import { scanCard } from '@/lib/services/loyalty.service'
import { ensureCustomerAndCard } from '@/lib/services/customer.service'
import { AppError } from '@/lib/errors'

interface PageProps {
  params: Promise<{ businessId: string }>
  searchParams: Promise<{ ref?: string }>
}

const SELECT_COLUMNS =
  'id, business_name, primary_color, loyalty_type, stamps_required, stamps_reward, points_per_euro, scan_cooldown_hours, logo_url, banner_url, gamification, short_code, description'

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

    // Auto-provisioning : si auth sans customer record (compte commercant
    // qui scanne en client, ou auth orpheline) -> on cree le customer.
    // Si pas de carte chez ce commerce -> on cree la carte. Logique
    // extraite en service testable (cf. lib/services/__tests__/customer.service.test.ts).
    const card = await ensureCustomerAndCard(service, {
      user: {
        email: user.email,
        phone: user.phone,
        user_metadata: user.user_metadata as {
          first_name?: string
          name?: string
          full_name?: string
        } | null,
      },
      business: {
        id: business.id,
        loyalty_type: business.loyalty_type,
        gamification: business.gamification as Record<string, unknown> | null,
      },
    })

    if (card) {
      // Cooldown anti-fraude (4h par defaut) gere par scanCard. Au lieu de
      // swallow silencieusement (UX confuse : client atterit sur sa carte
      // sans aucun feedback), on extrait le message de l'AppError pour le
      // passer en search param a /card. Le CardPageClient affiche un Toast
      // info pour expliquer pourquoi aucun tampon n'a ete ajoute.
      let scanErrorMessage: string | null = null
      try {
        await scanCard(service, {
          qrCodeId: card.qr_code_id,
          business: {
            id: business.id,
            business_name: business.business_name,
            loyalty_type: business.loyalty_type,
            stamps_required: business.stamps_required,
            stamps_reward: business.stamps_reward ?? '',
            points_per_euro: business.points_per_euro,
            scan_cooldown_hours: business.scan_cooldown_hours,
          },
        })
      } catch (e) {
        if (e instanceof AppError) {
          scanErrorMessage = e.message
        }
        // Sinon (erreur infra inattendue) : on swallow et on redirige quand
        // meme. Le client voit sa carte ; l'erreur est trackee server-side.
      }
      const target = scanErrorMessage
        ? `/card/${card.qr_code_id}?scanned=1&scan_error=${encodeURIComponent(scanErrorMessage)}`
        : `/card/${card.qr_code_id}?scanned=1`
      redirect(target)
    }
  }

  return <JoinFlow business={business} initialReferralCode={referralCode} />
}
