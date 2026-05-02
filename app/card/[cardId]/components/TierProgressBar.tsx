'use client'

import type { LoyaltyTier } from '@/lib/types'

interface TierProgressBarProps {
  tiers: LoyaltyTier[]
  currentValue: number
  loyaltyType: 'stamps' | 'points'
  /** Couleur brand du commerce (fallback : brand-secondary du DS) */
  color: string
}

/**
 * Barre de progression lineaire avec paliers (style Burger King "Mon Kingdom").
 *
 * - Track horizontal continue avec progression jusqu'au currentValue
 * - 1 cercle par palier : emoji du palier (debloque) ou cadenas (verrouille)
 * - Threshold affiche au-dessus, nom du palier en dessous (truncate)
 * - Texte d'aide en bas : "Plus que X pour deverrouiller {prochain palier}"
 *
 * Fonctionne en mode tampons OU points (threshold du palier =
 * nb tampons OU nb points selon business.loyalty_type).
 */
export default function TierProgressBar({
  tiers,
  currentValue,
  loyaltyType,
  color,
}: TierProgressBarProps) {
  if (tiers.length === 0) return null

  const unit = loyaltyType === 'stamps' ? 'tampon' : 'point'
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold)
  const maxThreshold = sorted[sorted.length - 1].threshold || 1
  const progressPct = Math.min(100, (currentValue / maxThreshold) * 100)
  const nextTier = sorted.find((t) => t.threshold > currentValue)
  const allReached = !nextTier && currentValue >= maxThreshold

  return (
    <div className="space-y-3">
      {/* Track + milestones */}
      <div className="relative px-5 pt-7 pb-12">
        {/* Track */}
        <div className="h-1.5 bg-secondary rounded-full relative">
          {/* Progress fill */}
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%`, backgroundColor: color }}
          />
        </div>

        {/* Milestones */}
        {sorted.map((tier) => {
          const pos = (tier.threshold / maxThreshold) * 100
          const reached = currentValue >= tier.threshold
          return (
            <div
              key={tier.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `${pos}%`,
                top: 0,
                transform: 'translateX(-50%)',
                width: '64px',
              }}
            >
              {/* Threshold above */}
              <span
                className="text-xs font-bold mb-1 tabular-nums"
                style={{ color: reached ? color : 'var(--color-text-tertiary)' }}
              >
                {tier.threshold}
              </span>

              {/* Circle */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base shadow-sm transition-all"
                style={
                  reached
                    ? { backgroundColor: color, color: 'white' }
                    : { backgroundColor: 'white', border: '2px solid var(--color-border-secondary)' }
                }
                aria-label={reached ? `${tier.name} debloque` : `${tier.name} verrouille a ${tier.threshold} ${unit}s`}
              >
                <span aria-hidden="true">
                  {reached ? tier.emoji || '⭐' : '🔒'}
                </span>
              </div>

              {/* Name below */}
              <span
                className="text-[10px] font-medium mt-1 text-center leading-tight line-clamp-2 max-w-[64px]"
                style={{ color: reached ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
                title={tier.name}
              >
                {tier.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* Hint text */}
      {nextTier && (
        <p className="text-center text-sm text-tertiary">
          Plus que{' '}
          <span className="font-bold" style={{ color }}>
            {nextTier.threshold - currentValue} {unit}
            {nextTier.threshold - currentValue > 1 ? 's' : ''}
          </span>{' '}
          pour débloquer <span className="font-semibold text-primary">{nextTier.name}</span>
        </p>
      )}
      {allReached && (
        <p className="text-center text-sm font-semibold text-success-primary">
          🎉 Tous les paliers débloqués !
        </p>
      )}
    </div>
  )
}
