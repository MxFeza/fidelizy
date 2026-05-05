'use client'

import { AlertTriangle } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'

interface ClaimRewardModalProps {
  isOpen: boolean
  loyaltyType: 'stamps' | 'points'
  rewardName?: string | null
  pointsCost?: number | null
  onConfirm: () => void
  onCancel: () => void
}

export default function ClaimRewardModal({
  isOpen,
  loyaltyType,
  rewardName,
  pointsCost,
  onConfirm,
  onCancel,
}: ClaimRewardModalProps) {
  if (!isOpen) return null

  const description = loyaltyType === 'stamps'
    ? 'Votre carte sera réinitialisée à 0 tampon. Présentez le code généré à votre commerçant.'
    : pointsCost
      ? `${pointsCost} pts seront déduits de votre solde. Présentez le code généré à votre commerçant.`
      : 'Présentez le code généré à votre commerçant pour valider votre récompense.'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-reward-title"
      className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="size-14 rounded-full bg-warning-secondary flex items-center justify-center ring-8 ring-warning-secondary/30">
            <AlertTriangle className="size-7 text-warning-primary" aria-hidden="true" />
          </div>
        </div>

        <h2 id="claim-reward-title" className="text-lg font-bold text-gray-900 text-center mb-2">
          {rewardName ? `Réclamer ${rewardName} ?` : 'Réclamer votre récompense ?'}
        </h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
          {description}
        </p>

        <div className="space-y-2.5">
          <Button
            type="button"
            color="primary"
            size="md"
            className="w-full"
            onClick={onConfirm}
          >
            Réclamer maintenant
          </Button>
          <Button
            type="button"
            color="secondary"
            size="md"
            className="w-full"
            onClick={onCancel}
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  )
}
