'use client'

import { Lock01, Stars02 } from '@untitledui/icons'
import { Emoji } from '@/lib/emojis'
import type { LoyaltyTier } from '@/lib/types'
import { cx } from '@/utils/cx'

interface TierProgressBarProps {
  tiers: LoyaltyTier[]
  currentValue: number
  loyaltyType: 'stamps' | 'points'
  /** Couleur brand du commerce */
  color: string
}

/**
 * Carrousel horizontal scroll-snap des paliers + barre de progression continue.
 *
 * - 1 card par palier (scroll-snap-mandatory) avec emoji en grand
 * - Etat debloque : fond brand-color soft, emoji couleur, badge "Debloque"
 * - Etat verrouille : fond gris, emoji desature, badge "X restants"
 * - Barre de progression fine sous le carousel
 * - Hint "Plus que X pour {prochain palier}"
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
    <div className="space-y-4">
      {/* Header label */}
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-primary">Mes récompenses</h3>
        <span className="text-xs font-medium text-tertiary tabular-nums">
          {currentValue} / {maxThreshold} {unit}
          {maxThreshold > 1 ? 's' : ''}
        </span>
      </div>

      {/* Tier cards carousel */}
      <div
        className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sorted.map((tier) => {
          const reached = currentValue >= tier.threshold
          const remaining = Math.max(0, tier.threshold - currentValue)

          return (
            <div
              key={tier.id}
              className={cx(
                'shrink-0 w-32 snap-center rounded-2xl border p-3 flex flex-col items-center text-center transition-all',
                reached
                  ? 'border-transparent shadow-sm'
                  : 'bg-secondary border-secondary'
              )}
              style={
                reached
                  ? { backgroundColor: `${color}14`, borderColor: `${color}33` }
                  : undefined
              }
              aria-label={
                reached
                  ? `${tier.name} debloque a ${tier.threshold} ${unit}s`
                  : `${tier.name} verrouille, ${remaining} ${unit}${remaining > 1 ? 's' : ''} restants`
              }
            >
              {/* Emoji */}
              <div
                className={cx(
                  'size-14 rounded-full flex items-center justify-center mb-2 transition-all',
                  reached ? 'bg-white shadow-sm' : 'bg-white/60 grayscale opacity-60'
                )}
              >
                {tier.emoji ? <Emoji unicode={tier.emoji} size={36} /> : <Emoji name="gift" size={36} />}
              </div>

              {/* Name */}
              <p
                className={cx(
                  'text-xs font-semibold leading-tight line-clamp-2 mb-1 min-h-[2rem] flex items-center',
                  reached ? 'text-primary' : 'text-tertiary'
                )}
                title={tier.name}
              >
                {tier.name}
              </p>

              {/* Status badge */}
              {reached ? (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: color, color: 'white' }}
                >
                  ✓ Débloqué
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-tertiary">
                  <Lock01 className="size-3" aria-hidden="true" /> {remaining} {unit}
                  {remaining > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%`, backgroundColor: color }}
            role="progressbar"
            aria-valuenow={currentValue}
            aria-valuemin={0}
            aria-valuemax={maxThreshold}
          />
        </div>

        {nextTier && (
          <p className="text-center text-sm text-tertiary">
            Plus que{' '}
            <span className="font-bold" style={{ color }}>
              {nextTier.threshold - currentValue} {unit}
              {nextTier.threshold - currentValue > 1 ? 's' : ''}
            </span>{' '}
            pour <span className="font-semibold text-primary">{nextTier.name}</span>
          </p>
        )}
        {allReached && (
          <p className="text-center text-sm font-semibold text-success-primary inline-flex items-center justify-center gap-1.5 w-full">
            <Stars02 className="size-4" aria-hidden="true" />
            <span>Tous les paliers débloqués !</span>
          </p>
        )}
      </div>
    </div>
  )
}
