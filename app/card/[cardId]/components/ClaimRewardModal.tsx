'use client'

/**
 * Modal de confirmation/selection avant reclamation d'une recompense.
 *
 * - 1 seul palier atteint → ecran de confirmation simple (style retour user)
 * - >1 palier atteints   → liste de paliers selectionnables (refonte 2026-05-13 :
 *                          avant le service prenait toujours le plus grand
 *                          automatiquement, ce qui empechait le client de
 *                          reclamer un palier plus bas).
 */

import { useState } from 'react'
import { AlertTriangle, CheckCircle } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Emoji } from '@/lib/emojis'
import type { LoyaltyTier } from '@/lib/types'
import { cx } from '@/utils/cx'

interface ClaimRewardModalProps {
  isOpen: boolean
  loyaltyType: 'stamps' | 'points'
  /** Nom de la recompense (mode stamps single-tier). Ignore en mode multi-paliers. */
  rewardName?: string | null
  pointsCost?: number | null
  /** Liste des paliers ATTEINTS et reclamables. Si fournie et length > 1,
   *  active le mode selection. Si length === 1 ou undefined, mode confirmation. */
  reachedTiers?: LoyaltyTier[]
  /** Couleur brand commerce pour highlight de la selection. */
  color?: string
  /** Confirme la reclamation. tierId = id du palier choisi (mode multi),
   *  null = mode stamps single-tier (le service choisit). */
  onConfirm: (tierId: string | null) => void
  onCancel: () => void
}

export default function ClaimRewardModal({
  isOpen,
  loyaltyType,
  rewardName,
  pointsCost,
  reachedTiers,
  color = '#7F56D9',
  onConfirm,
  onCancel,
}: ClaimRewardModalProps) {
  const multiTier = (reachedTiers?.length ?? 0) > 1
  // Selection user pour le mode multi-paliers. Single-tier : handleConfirm
  // envoie directement reachedTiers[0].id sans avoir besoin de state.
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)

  if (!isOpen) return null

  const description = loyaltyType === 'stamps'
    ? 'Votre carte sera réinitialisée à 0 tampon. Présentez le code généré à votre commerçant.'
    : pointsCost
      ? `${pointsCost} pts seront déduits de votre solde. Présentez le code généré à votre commerçant.`
      : 'Présentez le code généré à votre commerçant pour valider votre récompense.'

  const handleConfirm = () => {
    if (multiTier && !selectedTierId) return
    onConfirm(multiTier ? selectedTierId : (reachedTiers?.[0]?.id ?? null))
  }

  const sortedTiers = reachedTiers ? [...reachedTiers].sort((a, b) => b.threshold - a.threshold) : []

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-reward-title"
      className="fixed inset-0 bg-overlay/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {multiTier ? (
          <>
            {/* Multi-paliers : selection */}
            <h2 id="claim-reward-title" className="text-lg font-bold text-gray-900 text-center mb-2">
              Quelle récompense souhaitez-vous&nbsp;?
            </h2>
            <p className="text-sm text-gray-500 text-center leading-relaxed mb-5">
              Vous avez débloqué plusieurs paliers. Choisissez celui que vous voulez réclamer maintenant.
            </p>

            <div className="space-y-2.5 mb-5">
              {sortedTiers.map((tier) => {
                const selected = selectedTierId === tier.id
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTierId(tier.id)}
                    className={cx(
                      'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all',
                      selected
                        ? 'border-transparent shadow-sm'
                        : 'border-secondary hover:border-gray-300'
                    )}
                    style={selected ? { borderColor: color, backgroundColor: `${color}10` } : undefined}
                    aria-pressed={selected}
                  >
                    <div
                      className={cx(
                        'size-11 rounded-full flex items-center justify-center shrink-0',
                        selected ? 'bg-white shadow-sm' : 'bg-secondary'
                      )}
                    >
                      {tier.emoji ? <Emoji unicode={tier.emoji} size={28} /> : <Emoji name="gift" size={28} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{tier.name}</p>
                      <p className="text-xs text-gray-500">
                        Palier {tier.threshold} {loyaltyType === 'stamps' ? 'tampons' : 'pts'}
                      </p>
                    </div>
                    {selected && (
                      <CheckCircle className="size-5 shrink-0" style={{ color }} aria-hidden="true" />
                    )}
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-gray-500 text-center leading-relaxed mb-5">
              {description}
            </p>

            <div className="space-y-2.5">
              <Button
                type="button"
                color="primary"
                size="md"
                className="w-full"
                isDisabled={!selectedTierId}
                onClick={handleConfirm}
              >
                Réclamer maintenant
              </Button>
              <Button type="button" color="secondary" size="md" className="w-full" onClick={onCancel}>
                Annuler
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Single-palier : confirmation classique */}
            <div className="flex justify-center mb-4">
              <div className="size-14 rounded-full bg-warning-secondary flex items-center justify-center ring-8 ring-warning-secondary/30">
                <AlertTriangle className="size-7 text-warning-primary" aria-hidden="true" />
              </div>
            </div>

            <h2 id="claim-reward-title" className="text-lg font-bold text-gray-900 text-center mb-2">
              {reachedTiers?.[0]?.name
                ? `Réclamer ${reachedTiers[0].name} ?`
                : rewardName
                  ? `Réclamer ${rewardName} ?`
                  : 'Réclamer votre récompense ?'}
            </h2>
            <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
              {description}
            </p>

            <div className="space-y-2.5">
              <Button type="button" color="primary" size="md" className="w-full" onClick={handleConfirm}>
                Réclamer maintenant
              </Button>
              <Button type="button" color="secondary" size="md" className="w-full" onClick={onCancel}>
                Annuler
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
