'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Clock } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'

interface ClaimCodeModalProps {
  isOpen: boolean
  code: string
  rewardName: string
  expiresAt: string
  onClose: () => void
}

function formatRemaining(secondsLeft: number): string {
  if (secondsLeft <= 0) return '00:00'
  const m = Math.floor(secondsLeft / 60)
  const s = secondsLeft % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function ClaimCodeModal({
  isOpen,
  code,
  rewardName,
  expiresAt,
  onClose,
}: ClaimCodeModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const ms = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.floor(ms / 1000))
  })

  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      const ms = new Date(expiresAt).getTime() - Date.now()
      setSecondsLeft(Math.max(0, Math.floor(ms / 1000)))
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen, expiresAt])

  if (!isOpen) return null

  const expired = secondsLeft <= 0
  // Format code en blocs de 3 pour la lisibilité (ex: ABC-XYZ)
  const codeFormatted = code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-code-title"
      className="fixed inset-0 bg-overlay/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-primary rounded-3xl max-w-sm w-full p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="size-14 rounded-full bg-success-secondary flex items-center justify-center ring-8 ring-success-secondary/30">
            <CheckCircle className="size-7 text-success-primary" aria-hidden="true" />
          </div>
        </div>

        <h2 id="claim-code-title" className="text-lg font-bold text-gray-900 text-center mb-1">
          Demande envoyée !
        </h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed mb-5">
          Présentez ce code à votre commerçant pour valider <strong className="font-semibold text-gray-700">{rewardName}</strong>.
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 mb-4 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Votre code</p>
          <p
            className="text-4xl font-bold tracking-[0.25em] text-gray-900 font-mono"
            aria-label={`Code de réclamation : ${code.split('').join(' ')}`}
          >
            {codeFormatted}
          </p>
        </div>

        <div
          className={`flex items-center justify-center gap-1.5 text-sm font-medium mb-5 ${
            expired ? 'text-error-primary' : 'text-gray-500'
          }`}
        >
          <Clock className="size-4" aria-hidden="true" />
          <span>{expired ? 'Code expiré — réessayez' : `Expire dans ${formatRemaining(secondsLeft)}`}</span>
        </div>

        <Button
          type="button"
          color="secondary"
          size="md"
          className="w-full"
          onClick={onClose}
        >
          Retour à ma carte
        </Button>
      </div>
    </div>
  )
}
