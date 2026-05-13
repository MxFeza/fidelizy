'use client'

/**
 * Widget "Demandes de récompenses" affiché en haut du dashboard merchant.
 *
 * Demandé par le user 2026-05-13 : remplacer le flow "scanner le QR client
 * puis taper le code 6 chars" par une notification simple dans l'espace
 * merchant avec un bouton "Accepter" qui valide en 1 clic.
 *
 * Le widget poll /api/business/claim-requests toutes les 15s pour récupérer
 * les demandes en attente du commerce, et permet de les valider sans quitter
 * la page. Si aucune demande pending, le widget est masqué (rendu null).
 *
 * Le code 6 chars reste disponible comme fallback (scan ou saisie classique
 * sur le DashboardClient input). Cf. claim.service.ts validateClaim qui
 * accepte maintenant code OU claimId.
 */

import { useCallback, useEffect, useState } from 'react'
import { Gift01, Clock, CheckCircle, X as XIcon } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { cx } from '@/utils/cx'

interface PendingClaimRequest {
  id: string
  code: string
  rewardName: string
  pointsCost: number | null
  loyaltyType: 'stamps' | 'points'
  cardId: string
  customerName: string
  createdAt: string
  expiresAt: string
}

const POLL_INTERVAL_MS = 15_000

function timeUntilExpiry(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'expire'
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.floor((ms % 60_000) / 1000)
  if (minutes >= 1) return `${minutes} min`
  return `${seconds}s`
}

export default function PendingClaimRequests() {
  const [requests, setRequests] = useState<PendingClaimRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, forceTick] = useState(0)

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/business/claim-requests', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setRequests(data.requests ?? [])
    } catch {
      // silent — le poll suivant retentera
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch + polling 15s
  useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchRequests])

  // Re-render every second pour MAJ le compte à rebours "expire dans X"
  useEffect(() => {
    if (requests.length === 0) return
    const tick = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(tick)
  }, [requests.length])

  async function handleValidate(claimId: string, rewardName: string) {
    setValidating(claimId)
    setError(null)
    // Optimistic remove
    const prev = requests
    setRequests((r) => r.filter((req) => req.id !== claimId))
    try {
      const res = await fetch('/api/scan/validate-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setRequests(prev)
        setError(data?.error ?? `Erreur lors de la validation de "${rewardName}"`)
        setTimeout(() => setError(null), 5000)
        return
      }
      // Validation OK — la liste est déjà à jour côté optimistic. On refetch
      // pour capter d'autres claims arrivés pendant ce temps.
      fetchRequests()
    } catch {
      setRequests(prev)
      setError('Erreur de connexion. Réessayez.')
      setTimeout(() => setError(null), 5000)
    } finally {
      setValidating(null)
    }
  }

  if (loading || requests.length === 0) return null

  return (
    <section
      role="region"
      aria-label="Demandes de récompenses en attente"
      className="rounded-2xl bg-primary border border-secondary shadow-xs overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-secondary flex items-center gap-2">
        <Gift01 className="size-5 text-brand-secondary" aria-hidden="true" />
        <h2 className="text-md font-semibold text-primary flex-1">
          {requests.length} demande{requests.length > 1 ? 's' : ''} de récompense en attente
        </h2>
      </header>

      {error && (
        <div className="px-5 py-3 bg-error-secondary border-b border-error_subtle flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-error-primary">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Fermer"
            className="text-error-primary hover:opacity-80"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <ul className="divide-y divide-secondary">
        {requests.map((req) => {
          const isValidating = validating === req.id
          const remaining = timeUntilExpiry(req.expiresAt)
          return (
            <li key={req.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">
                  {req.customerName} — {req.rewardName}
                </p>
                <p className="text-xs text-tertiary mt-0.5 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" aria-hidden="true" />
                    Expire dans {remaining}
                  </span>
                  {req.pointsCost !== null && (
                    <span>−{req.pointsCost} pts</span>
                  )}
                  <span className="font-mono text-fg-quaternary">{req.code}</span>
                </p>
              </div>
              <Button
                size="sm"
                color="primary"
                iconLeading={CheckCircle}
                isLoading={isValidating}
                isDisabled={isValidating || validating !== null}
                onClick={() => handleValidate(req.id, req.rewardName)}
                className={cx('shrink-0', isValidating && 'opacity-80')}
              >
                Accepter
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
