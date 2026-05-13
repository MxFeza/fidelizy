'use client'

/**
 * Visualisation de la carte fidelite (Figma F2 9951:586).
 *
 * Refonte 2026-05-13 (user retour) :
 *   - Format vertical (ratio storeCard ~2:3) au lieu de horizontal carte
 *     bancaire. Raison : aligne la carte affichée dans l'app sur le format
 *     imposé par Apple Wallet et Google Wallet (pass `storeCard` vertical
 *     exclusivement, impossible d'avoir horizontal sur les wallets car réservé
 *     à Apple Pay/PAN tokenisation bancaire).
 *   - DA Izou uniformisée : la charte violet brand #7F56D9 prime sur tous
 *     les commerces. Pas de personnalisation couleur côté merchant pour le
 *     pilote (`businessPrimaryColor` reste accepté pour back-compat avec
 *     l'historique, mais la DB est forcée sur #7F56D9 pour tous).
 *
 * Layout vertical :
 *   - Top  : image carte custom merchant (banner-style) ou montgolfière par défaut
 *   - Mid  : nom client + grille tampons + compteur
 *   - Bot  : logo merchant en bas-droite (sur transparent)
 */

import Image from 'next/image'
import { PUBLIC_ASSETS } from '@/lib/assets'
import { cx } from '@/utils/cx'

const DEFAULT_COLOR = '#7F56D9' // Brand Izou — DA imposée sur tous les commerces

interface LoyaltyCardVisualProps {
  customerName: string
  loyaltyType: 'stamps' | 'points'
  currentStamps?: number
  stampsRequired?: number
  currentPoints?: number
  /** Logo du commerce (depuis business.logo_url). Affiche en bas a droite, sans fond. */
  businessLogoUrl?: string | null
  /** Image custom haut de carte (depuis business.card_image_url). Remplace la montgolfiere par défaut. */
  cardImageUrl?: string | null
  /**
   * Couleur principale du commerce (depuis business.primary_color). Maintenue
   * pour back-compat mais en pratique uniformément #7F56D9 depuis le forçage
   * DA Izou (migration 20260513). Fallback brand si absente.
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
  businessLogoUrl,
  cardImageUrl,
  businessPrimaryColor,
  withGradientBackground = true,
  className,
}: LoyaltyCardVisualProps) {
  const pointsLabel = loyaltyType === 'points'
    ? `${currentPoints} pts`
    : `${currentStamps}/${stampsRequired}`

  const bgColor = businessPrimaryColor || DEFAULT_COLOR

  const card = (
    <div
      className={cx(
        // Format vertical type storeCard wallet : ratio ~2:3 = portrait,
        // proche du rendu Apple Wallet pour limiter la surprise visuelle
        // entre l'app et le wallet. max-w volontairement plus étroit que
        // l'ancien horizontal.
        'relative w-full max-w-[280px] sm:max-w-[320px] mx-auto rounded-2xl overflow-hidden shadow-2xl flex flex-col',
        'aspect-[2/3]',
        !withGradientBackground && className,
      )}
      style={{ backgroundColor: bgColor }}
    >
      {/* Haut — image custom commerce (banner-style) ou montgolfière par défaut */}
      <div className="relative w-full flex-[0.42] overflow-hidden">
        <Image
          src={cardImageUrl || PUBLIC_ASSETS.cards.loyaltyDefault}
          alt=""
          fill
          sizes="(min-width: 1024px) 320px, 280px"
          className="object-cover object-center"
          priority
          unoptimized={!!cardImageUrl}
        />

        {/* Badge points/tampons (flottant top-right) */}
        <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900/90 text-white text-[11px] font-semibold shadow-lg backdrop-blur-sm">
          {pointsLabel}
          <svg className="size-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 3l1.5 4.5H16l-3.5 2.5L14 14l-4-3-4 3 1.5-4-3.5-2.5h4.5z" />
          </svg>
        </div>
      </div>

      {/* Milieu — nom + grille tampons / compteur */}
      <div className="relative flex-[0.58] flex flex-col justify-between p-4 sm:p-5">
        <p className="text-lg sm:text-xl font-semibold tracking-tight truncate leading-tight text-white">
          {customerName}
        </p>

        {/* Grille tampons (mode stamps) — 5 colonnes max, wrap automatique en
            2 rangées pour 8/10/12 tampons. `1fr` + justify-items-center répartit
            uniformément dans la largeur (refonte 2026-05-12). */}
        {loyaltyType === 'stamps' && (() => {
          const cols = stampsRequired <= 5 ? stampsRequired : Math.ceil(stampsRequired / 2)
          return (
            <div
              className="grid gap-1.5 sm:gap-2 my-2 justify-items-center w-full"
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
                      'size-6 sm:size-7 rounded-full transition-all duration-300 flex items-center justify-center shrink-0',
                      filled ? 'bg-white shadow-sm' : 'border border-white/25',
                    )}
                    aria-hidden="true"
                  >
                    {filled && (
                      <svg
                        className="size-3.5 sm:size-4 text-gray-900"
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
        })()}

        {/* Bottom : compteur texte + logo commerce bottom-right */}
        <div className="flex items-end justify-between gap-3">
          <p className="text-xs sm:text-sm font-medium text-white/85">
            {loyaltyType === 'stamps'
              ? `${currentStamps}/${stampsRequired} tampons`
              : `${currentPoints} pts cumulés`}
          </p>

          {/* Logo commerce — container carre fixe pour eviter l'etirement */}
          <div className="size-9 flex items-center justify-center shrink-0">
            {businessLogoUrl ? (
              <Image
                src={businessLogoUrl}
                alt="Logo commerce"
                width={36}
                height={36}
                className="size-9 object-contain"
              />
            ) : (
              <Image
                src="/izou-logomark.svg"
                alt=""
                width={28}
                height={28}
                className="size-7 opacity-90"
              />
            )}
          </div>
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
