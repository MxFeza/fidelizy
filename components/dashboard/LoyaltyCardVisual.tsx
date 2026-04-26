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
 * Personnalisation v2 (deferred) :
 *   - Banniere personnalisable (image au-dessus de la carte ou variante de design)
 */

import Image from 'next/image'
import { PUBLIC_ASSETS } from '@/lib/assets'
import { cx } from '@/utils/cx'

interface LoyaltyCardVisualProps {
  customerName: string
  loyaltyType: 'stamps' | 'points'
  currentStamps?: number
  stampsRequired?: number
  currentPoints?: number
  /** Logo du commerce (depuis business.logo_url). Affiche en bas a droite, sans fond. */
  businessLogoUrl?: string | null
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
  withGradientBackground = true,
  className,
}: LoyaltyCardVisualProps) {
  const pointsLabel = loyaltyType === 'points'
    ? `${currentPoints} pts`
    : `${currentStamps}/${stampsRequired}`

  const card = (
    <div
      className={cx(
        'relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl flex',
        'aspect-[1.585/1]',
        !withGradientBackground && className,
      )}
      style={{ backgroundColor: '#0F172A' }}
    >
      {/* Cote gauche — fond noir + nom + points */}
      <div className="relative flex-[0.62] flex flex-col justify-between p-4 sm:p-5 lg:p-6">
        <p className="text-lg sm:text-2xl lg:text-[26px] font-semibold tracking-tight text-white truncate leading-tight">
          {customerName}
        </p>
        <p className="text-xs sm:text-sm lg:text-base font-medium text-white/85 transition-all duration-300">
          {loyaltyType === 'stamps'
            ? `Tampons : ${currentStamps}/${stampsRequired}`
            : `${currentPoints} pts cumulés`}
        </p>
      </div>

      {/* Cote droit — image standard (paysage montgolfiere) */}
      <div className="relative flex-[0.38] overflow-hidden">
        <Image
          src={PUBLIC_ASSETS.cards.loyaltyDefault}
          alt=""
          fill
          sizes="(min-width: 1024px) 200px, 40vw"
          className="object-cover object-top"
          priority
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
