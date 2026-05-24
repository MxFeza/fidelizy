'use client'

/**
 * Story 9.1 — Widget checklist d'onboarding commerçant ancré en sidebar.
 *
 * Affiche :
 *  - Header "🚀 Démarrage Izou" + ratio "X/7" + barre de progression
 *  - 7 TaskItem cliquables (cf TaskItem.tsx)
 *  - Bouton "Réduire" (collapse) pour ne garder que la barre
 *
 * Visibilité conditionnelle :
 *  - Hidden si `onboarding_completed_at IS NOT NULL` (=100% atteint)
 *  - Hidden si `onboarding_started_at IS NULL` (modal welcome pas encore validé)
 *
 * Performance :
 *  - 1 fetch initial au montage + cache 30s côté front (cf spec §14 risque perf).
 *  - Refresh forcé via `version` prop (incrémenté par le parent quand une tâche
 *    a été complétée par l'utilisateur — ex : QR imprimé, notif activées).
 */

import { useEffect, useState, useCallback } from 'react'
import { Rocket01, ChevronDown, ChevronUp } from '@untitledui/icons'
import TaskItem from './TaskItem'
import type {
  MerchantOnboardingStatus,
  MerchantOnboardingTaskId,
} from '@/lib/onboarding/getMerchantTaskStatus'

interface OnboardingChecklistProps {
  /** Incrémenter pour forcer un refresh du status (ex : après action user). */
  version?: number
  /** Callback : la tâche `taskId` a été cliquée (non-cochée) et doit déclencher un tour. */
  onTriggerTour?: (taskId: MerchantOnboardingTaskId) => void
  /** Callback : 100% atteint à l'instant — déclenche la célébration côté parent. */
  onComplete?: () => void
}

const CACHE_TTL_MS = 30_000

export default function OnboardingChecklist({
  version = 0,
  onTriggerTour,
  onComplete,
}: OnboardingChecklistProps) {
  const [status, setStatus] = useState<MerchantOnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [lastFetchedAt, setLastFetchedAt] = useState(0)

  const fetchStatus = useCallback(async (force = false) => {
    const now = Date.now()
    if (!force && status && now - lastFetchedAt < CACHE_TTL_MS) {
      return // Cache hit (30 s)
    }
    try {
      const res = await fetch('/api/business/onboarding/status', { cache: 'no-store' })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data: MerchantOnboardingStatus = await res.json()
      setStatus(data)
      setLastFetchedAt(now)

      // Si 100% atteint à l'instant et pas encore marqué complete, on prévient le parent.
      if (data.percent === 100 && !data.completed && onComplete) {
        onComplete()
      }
    } catch {
      // Silencieux : le widget ne doit pas bloquer le dashboard si l'API tombe.
    } finally {
      setLoading(false)
    }
  }, [status, lastFetchedAt, onComplete])

  // Initial load
  useEffect(() => {
    void fetchStatus(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch, fetchStatus capture via closure
  }, [])

  // Force refresh quand version change (parent indique qu'une action user vient
  // de se produire et qu'il faut re-checker les tâches).
  useEffect(() => {
    if (version > 0) void fetchStatus(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on ne veut re-trigger QUE quand version change, pas quand fetchStatus identity change
  }, [version])

  // Loading initial → on n'affiche rien (évite un flash entre login et fetch).
  if (loading || !status) return null

  // Pas encore démarré (welcome modal pas validé) → caché.
  if (!status.started) return null

  // Déjà 100% complété → caché (transition gérée par le parent via ConfettiEffect).
  if (status.completed) return null

  return (
    <div
      data-onboarding-checklist
      className="rounded-xl bg-secondary border border-secondary p-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Rocket01 className="size-4 shrink-0 text-fg-brand-primary" />
          <p className="text-sm font-semibold text-primary truncate">Démarrage Izou</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-semibold text-tertiary tabular-nums">
            {status.doneCount}/{status.totalCount}
          </span>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Déplier la checklist' : 'Réduire la checklist'}
            className="size-5 inline-flex items-center justify-center rounded text-quaternary hover:text-primary hover:bg-primary_hover transition-colors"
          >
            {collapsed ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronUp className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={status.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression de l'onboarding"
        className="h-1.5 rounded-full bg-primary overflow-hidden mb-2"
      >
        <div
          className="h-full bg-brand-solid transition-all duration-500 ease-out"
          style={{ width: `${status.percent}%` }}
        />
      </div>

      {/* Tasks list */}
      {!collapsed && (
        <ul className="flex flex-col gap-0.5 mt-1">
          {status.tasks.map((task) => (
            <li key={task.id}>
              <TaskItem
                id={task.id}
                label={task.label}
                done={task.done}
                href={task.href}
                onTriggerTour={onTriggerTour ? (id) => onTriggerTour(id as MerchantOnboardingTaskId) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
