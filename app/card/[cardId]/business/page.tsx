import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MarkerPin01, Phone, Mail01, Clock, ArrowUpRight, Building02, Globe01, Calendar } from '@untitledui/icons'
import TopBarClient from '@/components/client/TopBarClient'
import BottomTabBarClient from '@/components/client/BottomTabBarClient'

interface PageProps {
  params: Promise<{ cardId: string }>
}

export const metadata = {
  title: 'Entreprise — Izou',
}

/**
 * Espace entreprise (fiche commerce cote client) — Story 4.8 stub.
 *
 * Affiche les infos pratiques du commerce associe a la carte courante :
 * logo, nom, description, adresse, telephone, email, horaires, lien GMB.
 *
 * Sera enrichi en Story 4.8 complete (banniere, photos, Maps embed, etc.)
 */
export default async function BusinessPage({ params }: PageProps) {
  const { cardId } = await params
  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, qr_code_id, business_id')
    .eq('qr_code_id', cardId)
    .single()

  if (!card) notFound()

  const { data: business } = await supabase
    .from('businesses')
    .select('business_name, logo_url, banner_url, description, address, phone, email, opening_hours, gmb_url, gmb_visible, primary_color, website_url, booking_url')
    .eq('id', card.business_id)
    .single()

  if (!business) notFound()

  const mapsEmbedUrl = business.address
    ? `https://www.google.com/maps?q=${encodeURIComponent(business.address)}&output=embed`
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBarClient
        rightSlot={
          <Link
            href={`/card/${cardId}`}
            aria-label="Retour à ma carte"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        }
      />

      <div className="max-w-md mx-auto px-5 py-6 space-y-5">
        {/* Hero : banner + logo + name */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {business.banner_url ? (
            <div className="relative w-full aspect-[3/1] bg-gray-100">
              <Image
                src={business.banner_url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div
              className="w-full aspect-[3/1] flex items-center justify-center"
              style={{
                background: business.primary_color
                  ? `linear-gradient(135deg, ${business.primary_color} 0%, ${business.primary_color}aa 100%)`
                  : 'linear-gradient(135deg, #7F56D9 0%, #6941C6 100%)',
              }}
            >
              <Building02 className="size-12 text-white/40" aria-hidden="true" />
            </div>
          )}

          <div className="px-5 pt-4 pb-5 -mt-10 relative">
            <div className="size-20 rounded-2xl bg-white shadow-md ring-4 ring-white flex items-center justify-center overflow-hidden mb-3">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 object-contain"
                />
              ) : (
                <Building02 className="size-8 text-gray-400" aria-hidden="true" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{business.business_name}</h1>
            {business.description && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line">{business.description}</p>
            )}
          </div>
        </div>

        {/* Coordonnées */}
        {(business.address || business.phone || business.email) && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Coordonnées</h2>
            </div>
            <ul className="divide-y divide-gray-50">
              {business.address && (
                <li className="px-5 py-4 flex items-start gap-3">
                  <MarkerPin01 className="size-5 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Adresse</p>
                    <p className="text-sm text-gray-600 mt-0.5">{business.address}</p>
                  </div>
                </li>
              )}
              {business.phone && (
                <li className="px-5 py-4 flex items-start gap-3">
                  <Phone className="size-5 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Téléphone</p>
                    <a href={`tel:${business.phone}`} className="text-sm text-brand-secondary mt-0.5 inline-block hover:underline">
                      {business.phone}
                    </a>
                  </div>
                </li>
              )}
              {business.email && (
                <li className="px-5 py-4 flex items-start gap-3">
                  <Mail01 className="size-5 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Email</p>
                    <a href={`mailto:${business.email}`} className="text-sm text-brand-secondary mt-0.5 inline-block hover:underline break-all">
                      {business.email}
                    </a>
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Horaires */}
        {business.opening_hours && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Clock className="size-4 text-gray-400" aria-hidden="true" />
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Horaires d&apos;ouverture</h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{business.opening_hours}</p>
            </div>
          </div>
        )}

        {/* Maps embed */}
        {mapsEmbedUrl && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Localisation</h2>
            </div>
            <iframe
              src={mapsEmbedUrl}
              title={`Carte : ${business.business_name}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full aspect-[16/10] border-0"
            />
          </div>
        )}

        {/* Lien réservation — CTA primary visible (priorité haute pour les
            prestataires service qui veulent générer du booking) */}
        {business.booking_url && (
          <a
            href={business.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl shadow-sm font-semibold text-sm transition-colors"
          >
            <Calendar className="size-5" aria-hidden="true" />
            Réserver en ligne
          </a>
        )}

        {/* Liens externes secondaires (site web, GMB) */}
        {(business.website_url || (business.gmb_visible && business.gmb_url)) && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {business.website_url && (
              <a
                href={business.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <Globe01 className="size-5 text-gray-600" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Site internet</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{business.website_url.replace(/^https?:\/\//, '')}</p>
                  </div>
                </div>
                <ArrowUpRight className="size-5 text-gray-400 shrink-0" aria-hidden="true" />
              </a>
            )}
            {business.gmb_visible && business.gmb_url && (
              <a
                href={business.gmb_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <Building02 className="size-5 text-gray-600" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Voir sur Google</p>
                    <p className="text-xs text-gray-500 mt-0.5">Avis, photos et plus</p>
                  </div>
                </div>
                <ArrowUpRight className="size-5 text-gray-400 shrink-0" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>

      <BottomTabBarClient cardId={cardId} />
    </div>
  )
}
