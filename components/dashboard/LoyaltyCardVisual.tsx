'use client'

/**
 * Visualisation de la carte fidelite — refonte 2026-05-14 (user retour) :
 * inspiree du pass Apple Wallet Carrefour Club.
 *
 * Layout vertical 4 bandes empilees :
 *   1. Header clair : logo Izou (gauche) + "BONJOUR\n{PRENOM NOM}" (droite, caps bold)
 *   2. Visuel commerce : image bandeau (business.card_image_url) + nom du commerce dessous
 *   3. Body noir Izou : grille tampons centree (majeure partie)
 *   4. Footer : compteur texte + logo commerce en bas a droite
 *
 * Couleur fond : NOIR Izou (#0F172A) sur tous les commerces. Le violet brand
 * #7F56D9 reste pour les CTAs/banners/etats (DA Izou globale) mais la carte
 * elle-meme est noire — alignement avec le pass Apple Wallet.
 *
 * Pas de personnalisation couleur cote merchant (cf. feedback_da_izou_uniforme).
 */

import Image from 'next/image'
import { PUBLIC_ASSETS } from '@/lib/assets'
import { cx } from '@/utils/cx'

const DEFAULT_COLOR = '#0F172A' // Noir Izou — DA imposee sur tous les commerces

interface LoyaltyCardVisualProps {
  customerName: string
  loyaltyType: 'stamps' | 'points'
  currentStamps?: number
  stampsRequired?: number
  currentPoints?: number
  /** Nom du commerce (business.business_name). Affiche sous l'image, centre. */
  businessName?: string | null
  /** Logo du commerce (business.logo_url). Affiche en bas a droite, sans fond. */
  businessLogoUrl?: string | null
  /** Image custom haut de carte (business.card_image_url). Fallback montgolfiere si absent. */
  cardImageUrl?: string | null
  /**
   * Couleur principale du commerce (business.primary_color). Maintenue pour
   * back-compat mais en pratique uniformement #0F172A depuis la migration
   * 20260514. Fallback noir Izou si absente.
   */
  businessPrimaryColor?: string | null
  /** Affiche un fond gradient brand autour de la carte, comme dans Figma F2/F3. Default: true. */
  withGradientBackground?: boolean
  className?: string
}

export default function LoyaltyCardVisual({
  customerName,
  loyaltyType,
  currentStamps = 0,
  stampsRequired = 10,
  currentPoints = 0,
  businessName,
  businessLogoUrl,
  cardImageUrl,
  businessPrimaryColor,
  withGradientBackground = true,
  className,
}: LoyaltyCardVisualProps) {
  const bgColor = businessPrimaryColor || DEFAULT_COLOR
  const greetingName = (customerName || 'Client').toUpperCase()

  const card = (
    <div
      className={cx(
        // Format vertical type storeCard wallet (~2:3) pour aligner avec
        // Apple/Google Wallet (storeCard portrait exclusif).
        'relative w-full max-w-[280px] sm:max-w-[320px] mx-auto rounded-2xl overflow-hidden shadow-2xl flex flex-col',
        'aspect-[2/3]',
        !withGradientBackground && className,
      )}
      style={{ backgroundColor: bgColor }}
    >
      {/* 1. Header clair — logo Izou + Bonjour {NOM} caps */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white shrink-0">
        <Image
          src={PUBLIC_ASSETS.branding.logoNoir}
          alt="Izou"
          width={48}
          height={20}
          className="h-5 w-auto shrink-0"
          priority
        />
        <div className="text-right min-w-0">
          <p className="text-[9px] font-semibold tracking-[0.12em] text-gray-500 leading-tight">
            BONJOUR
          </p>
          <p className="text-[11px] sm:text-xs font-bold tracking-wide text-gray-900 leading-tight truncate uppercase">
            {greetingName}
          </p>
        </div>
      </div>

      {/* 2. Visuel commerce — image bandeau + nom commerce dessous */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden bg-white/5">
          <Image
            src={cardImageUrl || PUBLIC_ASSETS.cards.loyaltyDefault}
            alt=""
            fill
            sizes="(min-width: 1024px) 320px, 280px"
            className="object-cover object-center"
            priority
            unoptimized={!!cardImageUrl}
          />
        </div>
        {businessName && (
          <p className="mt-2 text-center text-sm font-semibold tracking-tight text-white truncate">
            {businessName}
          </p>
        )}
      </div>

      {/* 3. Body — grille tampons centree (occupe l'espace restant) */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-5">
        {loyaltyType === 'stamps' ? (() => {
          const cols = stampsRequired <= 5 ? stampsRequired : Math.ceil(stampsRequired / 2)
          return (
            <div
              className="grid gap-2 sm:gap-2.5 justify-items-center w-full"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              role="meter"
              aria-valuenow={currentStamps}
              aria-valuemin={0}
              aria-valuemax={stampsRequired}
              aria-label={`${currentStamps} tampons sur ${stampsRequired}`}
            >
              {Array.from({ length: stampsRequired }).map((_, i) => {
                const filled = i < currentStamps
                return (
                  <div
                    key={i}
                    className={cx(
                      'size-7 sm:size-8 rounded-full transition-all duration-300 flex items-center justify-center shrink-0',
                      filled ? 'bg-white shadow-sm' : 'border border-white/25',
                    )}
                    aria-hidden="true"
                  >
                    {filled && (
                      <svg
                        className="size-4 sm:size-[18px] text-gray-900"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.29a1 1 0 010 1.42l-7.99 7.99a1 1 0 01-1.42 0l-3.99-3.99a1 1 0 011.42-1.42l3.28 3.28 7.28-7.28a1 1 0 011.42 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })() : (
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {currentPoints}
            <span className="ml-1 text-base sm:text-lg font-medium text-white/70">pts</span>
          </p>
        )}
      </div>

      {/* 4. Footer — compteur texte + logo merchant bas-droite */}
      <div className="shrink-0 flex items-end justify-between gap-3 px-4 pb-3 sm:px-5 sm:pb-4">
        <p className="text-xs sm:text-sm font-medium text-white/85">
          {loyaltyType === 'stamps'
            ? `${currentStamps}/${stampsRequired} tampons`
            : `${currentPoints} pts cumules`}
        </p>

        <div className="size-10 flex items-center justify-center shrink-0">
          {businessLogoUrl ? (
            <Image
              src={businessLogoUrl}
              alt="Logo commerce"
              width={40}
              height={40}
              className="size-10 object-contain"
              unoptimized
            />
          ) : (
            <Image
              src="/izou-logomark.svg"
              alt=""
              width={32}
              height={32}
              className="size-8 opacity-90"
            />
          )}
        </div>
      </div>
    </div>
  )

  if (!withGradientBackground) return card

  return (
    <div
      className={cx('relative p-4 sm:p-6 lg:p-8 overflow-hidden', className)}
      style={{
        background:
          'radial-gradient(circle at 20% 30%, #B6C3FF 0%, transparent 45%), radial-gradient(circle at 75% 75%, #F8BFA1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #C49AE6 0%, transparent 55%), linear-gradient(135deg, #DBC4F2 0%, #E8B0BC 100%)',
      }}
    >
      {card}
    </div>
  )
}
