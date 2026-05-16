'use client'

/**
 * Widget "Demandes de récompenses" affiché sur le dashboard merchant et
 * la page /dashboard/notifications.
 *
 * Refonte visuelle 2026-05-13 (user retour) : le widget précédent passait
 * inaperçu (fond bg-primary identique au reste du dashboard). Maintenant on
 * utilise un FeaturedIcon brand + bandeau d'en-tête contrasté + bordure
 * brand pour qu'il se démarque vraiment des cards génériques.
 *
 * Flow demandé : remplacer "scanner QR client puis taper code 6 chars" par
 * une notification simple avec bouton "Accepter" qui valide en 1 clic. Le
 * code 6 chars reste actif comme fallback (cf. claim.service.ts validateClaim
 * qui accepte code OU claimId).
 */

import { useCallback, useEffect, useState } from 'react'
import { Gift01, Clock, CheckCircle, X as XIcon, Bell01 } from '@untitledui/icons'
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

interface PendingClaimRequestsProps {
  /**
   * Si true (default false), affiche le widget même quand aucune demande est
   * pending — utile sur la page Notifications dédiée qui doit toujours
   * montrer un état (empty state inclus). Sur le dashboard home le widget
   * disparaît pour ne pas encombrer.
   */
  showEmptyState?: boolean
}

export default function PendingClaimRequests({ showEmptyState = false }: PendingClaimRequestsProps) {
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

  useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchRequests])

  // Re-render chaque seconde pour MAJ le compte à rebours "expire dans X"
  useEffect(() => {
    if (requests.length === 0) return
    const tick = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(tick)
  }, [requests.length])

  async function handleValidate(claimId: string, rewardName: string) {
    setValidating(claimId)
    setError(null)
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
      fetchRequests()
    } catch {
      setRequests(prev)
      setError('Erreur de connexion. Réessayez.')
      setTimeout(() => setError(null), 5000)
    } finally {
      setValidating(null)
    }
  }

  // Empty state pour la page notifications dédiée
  if (loading) {
    return showEmptyState ? <SkeletonWidget /> : null
  }

  if (requests.length === 0) {
    if (!showEmptyState) return null
    return (
      <div className="rounded-2xl bg-primary border border-secondary p-10 text-center">
        <div className="size-14 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
          <Bell01 className="size-7 text-fg-quaternary" aria-hidden="true" />
        </div>
        <p className="text-primary font-semibold mb-1">Aucune demande en attente</p>
        <p className="text-sm text-tertiary max-w-sm mx-auto">
          Vous serez notifié ici dès qu&apos;un client réclamera sa récompense depuis son espace.
        </p>
      </div>
    )
  }

  return (
    <section
      role="region"
      aria-label="Demandes de récompenses en attente"
      // Style prominent : bordure brand + fond brand-secondary subtil pour
      // se démarquer des cards génériques du dashboard (retour user 2026-05-13).
      className="rounded-2xl border-2 border-brand bg-brand-secondary/60 shadow-md overflow-hidden"
    >
      <header className="px-5 py-4 flex items-center gap-3 bg-brand-solid">
        {/* FeaturedIcon brand circle pour donner le ton "ça vient d'arriver" */}
        <div className="size-10 rounded-full bg-white/15 ring-2 ring-white/30 flex items-center justify-center shrink-0">
          <Gift01 className="size-5 text-white" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-md font-semibold text-white">
            {requests.length} demande{requests.length > 1 ? 's' : ''} de récompense à valider
          </h2>
          <p className="text-xs text-white/85 mt-0.5">
            Cliquez sur Accepter pour valider en 1 clic — pas besoin de scanner.
          </p>
        </div>
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

      <ul className="divide-y divide-brand/15 bg-primary">
        {requests.map((req) => {
          const isValidating = validating === req.id
          const remaining = timeUntilExpiry(req.expiresAt)
          return (
            <li key={req.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">
                  {req.customerName} — <span className="text-brand-secondary">{req.rewardName}</span>
                </p>
                <p className="text-xs text-tertiary mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" aria-hidden="true" />
                    Expire dans {remaining}
                  </span>
                  {req.pointsCost !== null && (
                    <span>−{req.pointsCost} pts</span>
                  )}
                  <span className="font-mono text-fg-quaternary">code {req.code}</span>
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

function SkeletonWidget() {
  return (
    <div className="rounded-2xl border-2 border-brand bg-brand-secondary/60 shadow-md overflow-hidden">
      <header className="px-5 py-4 flex items-center gap-3 bg-brand-solid">
        <div className="size-10 rounded-full bg-white/15 ring-2 ring-white/30 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 rounded bg-white/30 animate-pulse" />
          <div className="h-3 w-72 rounded bg-white/20 animate-pulse" />
        </div>
      </header>
      <div className="px-5 py-4 bg-primary">
        <div className="h-4 w-2/3 rounded bg-secondary animate-pulse" />
      </div>
    </div>
  )
}
