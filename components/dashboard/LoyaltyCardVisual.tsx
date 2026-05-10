'use client'

/**
 * Visualisation de la carte fidelite (Figma F2 9951:586).
 *
 * Regle v1 (decision user 2026-04-26 — "on va revenir a la regle de base") :
 *   - Toutes les cartes sont **noires** (zero personnalisation couleur en v1)
 *   - Cote droit : meme image standard pour tous les commerces (landscape montgolfiere)
 *   - Logo du commerce en bas a droite, **sur transparent** (pas de pill blanche)
 *   - Logo se met automatiquement sur toutes les cartes des clients du commerce
 *
 * Update 2026-04-26 (retour user) :
 *   - Wrapper gradient optionnel (purple→orange→rose) autour de la carte, comme F2/F3
 *   - Nom client agrandi (text-2xl) pour plus de presence
 *   - Logo fixe en aspect-ratio carre avec object-contain (evite l'etirement
 *     pour les logos non-carres uploades par les commercants)
 *
 * Update 2026-05-05 (retour user — feedback "tampons visuels") :
 *   - Mode stamps : grille de cercles (rappel des cartes de fidelite physique)
 *     a la place du simple texte "X/Y". Layout adaptatif via flex-wrap pour
 *     s'adapter aux differents stamps_required (5, 8, 10, 12...).
 *
 * Personnalisation v2 (deferred) :
 *   - Banniere personnalisable (image au-dessus de la carte ou variante de design)
 */

import Image from 'next/image'
import { PUBLIC_ASSETS } from '@/lib/assets'
import { cx } from '@/utils/cx'
import type { CardColor } from '@/lib/types'

/**
 * Mapping cardColor -> hex (Story 4.7 v2). Override le noir default #0F172A
 * uniquement sur le côté gauche, en respectant le format prod (gauche coloré
 * uni / droite image standard ou business.card_image_url).
 */
const CARD_COLOR_MAP: Record<CardColor, string> = {
  violet: '#7F56D9',
  orange: '#F79009',
  jaune: '#FAC515',
  corail: '#F97066',
  vert: '#17B26A',
}

const DEFAULT_COLOR = '#0F172A'

/** Yellow #FAC515 demande un texte sombre pour le contraste (les autres -> blanc). */
const DARK_TEXT_COLORS = new Set<CardColor>(['jaune'])

interface LoyaltyCardVisualProps {
  customerName: string
  loyaltyType: 'stamps' | 'points'
  currentStamps?: number
  stampsRequired?: number
  currentPoints?: number
  /** Logo du commerce (depuis business.logo_url). Affiche en bas a droite, sans fond. */
  businessLogoUrl?: string | null
  /** Image custom cote droit (depuis business.card_image_url). Remplace la montgolfiere standard si fournie. */
  cardImageUrl?: string | null
  /**
   * Couleur du fond gauche (Story 4.7 v2 — depuis customer.card_color).
   * undefined / null = noir default #0F172A. Format prod préservé (image
   * standard à droite, logo commerce bottom-right).
   */
  cardColor?: CardColor | null
  /** Affiche un fond gradient (purple→orange→rose) autour de la carte, comme dans Figma F2/F3. Default: true. */
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
  cardColor,
  withGradientBackground = true,
  className,
}: LoyaltyCardVisualProps) {
  const pointsLabel = loyaltyType === 'points'
    ? `${currentPoints} pts`
    : `${currentStamps}/${stampsRequired}`

  const bgColor = cardColor ? CARD_COLOR_MAP[cardColor] : DEFAULT_COLOR
  const useDarkText = cardColor && DARK_TEXT_COLORS.has(cardColor)
  const textColor = useDarkText ? 'text-gray-900' : 'text-white'
  const textColorMuted = useDarkText ? 'text-gray-900/85' : 'text-white/85'

  const card = (
    <div
      className={cx(
        'relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl flex',
        'aspect-[1.585/1]',
        !withGradientBackground && className,
      )}
      style={{ backgroundColor: bgColor }}
    >
      {/* Cote gauche — fond coloré + nom + grille tampons (mode stamps) ou compteur points */}
      <div className="relative flex-[0.62] flex flex-col justify-between p-4 sm:p-5 lg:p-6">
        <p className={cx('text-lg sm:text-2xl lg:text-[26px] font-semibold tracking-tight truncate leading-tight', textColor)}>
          {customerName}
        </p>

        {/* Grille tampons : visualisation type carte fidelite physique.
            Story 9.2 v2 fix : grid avec colonnes adaptatives pour stacker en
            2 rangées équilibrées (5+5 pour 10, 4+4 pour 8, etc.) au lieu de
            squeezer en 1 longue ligne sur mobile. Cf retour user 2026-05-10. */}
        {loyaltyType === 'stamps' && (() => {
          const cols = stampsRequired <= 5 ? stampsRequired : Math.ceil(stampsRequired / 2)
          return (
            <div
              className="grid gap-1.5 sm:gap-2 my-1 sm:my-2 justify-items-start"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, max-content))` }}
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
                      'size-5 sm:size-6 lg:size-7 rounded-full transition-all duration-300 flex items-center justify-center shrink-0',
                      filled
                        ? useDarkText
                          ? 'bg-gray-900 shadow-sm'
                          : 'bg-white shadow-sm'
                        : useDarkText
                        ? 'border border-gray-900/25'
                        : 'border border-white/25',
                    )}
                    aria-hidden="true"
                  >
                    {filled && (
                      <svg
                        className={cx(
                          'size-3 sm:size-3.5 lg:size-4',
                          useDarkText ? 'text-yellow-400' : 'text-gray-900',
                        )}
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

        <p className={cx('text-xs sm:text-sm lg:text-base font-medium transition-all duration-300', textColorMuted)}>
          {loyaltyType === 'stamps'
            ? `${currentStamps}/${stampsRequired} tampons`
            : `${currentPoints} pts cumulés`}
        </p>
      </div>

      {/* Cote droit — image custom du commerce si presente, sinon image standard (paysage montgolfiere) */}
      <div className="relative flex-[0.38] overflow-hidden">
        <Image
          src={cardImageUrl || PUBLIC_ASSETS.cards.loyaltyDefault}
          alt=""
          fill
          sizes="(min-width: 1024px) 200px, 40vw"
          className={cardImageUrl ? 'object-cover object-center' : 'object-cover object-top'}
          priority
          unoptimized={!!cardImageUrl}
        />

        {/* Badge points/tampons (flottant, toujours visible) */}
        <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900/90 text-white text-[11px] font-semibold shadow-lg backdrop-blur-sm transition-all duration-300">
          {pointsLabel}
          <svg className="size-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 3l1.5 4.5H16l-3.5 2.5L14 14l-4-3-4 3 1.5-4-3.5-2.5h4.5z" />
          </svg>
        </div>

        {/* Logo commerce — container carre fixe pour eviter l'etirement quand le logo n'est pas carre */}
        <div className="absolute bottom-2.5 right-2.5 size-9 flex items-center justify-center">
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
