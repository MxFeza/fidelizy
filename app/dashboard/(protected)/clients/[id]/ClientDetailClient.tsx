'use client'

/**
 * Fiche client detail (Figma F2 9951:586).
 * Refactor complet 2026-04-26 pour matcher la maquette.
 *
 * Sections :
 *   1. Header        — back link + title + email/inscrite + status badge
 *   2. Loyalty card  — visualisation grande carte (LoyaltyCardVisual)
 *   3. Toolbar       — 5 boutons : Offrir recompense, Retirer tampon, Reinitialiser, Supprimer client, Export
 *   4. Manual adjust — input numerique pour ajouter/retirer un nombre precis (kept du v1)
 *   5. Tabs          — Historique / Recompenses
 *   6. Filters       — search + Mars 2026 + Filtres
 *   7. Transactions  — table avec checkboxes pour bulk select
 *   8. Pagination
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Gift01,
  Plus,
  RefreshCcw01,
  Trash01,
  SearchLg,
  Calendar,
  FilterLines,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  X as XIcon,
} from '@untitledui/icons'
import type { Business, Customer, LoyaltyCard, LoyaltyTier, Transaction } from '@/lib/types'
import { Button } from '@/components/ui/base/buttons/button'
import LoyaltyCardVisual from '@/components/dashboard/LoyaltyCardVisual'
import { cx } from '@/utils/cx'

type ClientCard = LoyaltyCard & { customers: Customer }

interface Props {
  card: ClientCard
  business: Business
  transactions: Transaction[]
  /** Paliers JSONB depuis businesses.reward_tiers (source unique). */
  tiers: LoyaltyTier[]
}

const PAGE_SIZE = 6
const MS_30 = 30 * 24 * 60 * 60 * 1000
const MS_60 = 60 * 24 * 60 * 60 * 1000

function getStatus(card: ClientCard): 'active' | 'inactive' | 'lost' {
  const ref = card.last_visit_at
    ? new Date(card.last_visit_at).getTime()
    : new Date(card.created_at).getTime()
  const diff = Date.now() - ref
  if (diff >= MS_60) return 'lost'
  if (diff >= MS_30) return 'inactive'
  return 'active'
}

function StatusBadge({ status }: { status: ReturnType<typeof getStatus> }) {
  const config = {
    active:   { label: 'Actif',   bg: 'bg-success-secondary',  text: 'text-success-primary',  dot: 'bg-success-primary' },
    inactive: { label: 'Inactif', bg: 'bg-warning-secondary',  text: 'text-warning-primary',  dot: 'bg-warning-primary' },
    lost:     { label: 'Perdu',   bg: 'bg-error-secondary',    text: 'text-error-primary',    dot: 'bg-error-primary' },
  }[status]
  return (
    <span className={cx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', config.bg, config.text)}>
      <span className={cx('size-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}

export default function ClientDetailClient({ card, business, transactions, tiers }: Props) {
  const router = useRouter()
  const isStamps = business.loyalty_type === 'stamps'
  const stampsRequired = business.stamps_required ?? 10

  // Optimistic state — la carte se met a jour visuellement instantanement.
  // Synchronise apres router.refresh() avec les vraies valeurs serveur.
  const [optimisticStamps, setOptimisticStamps] = useState(Math.min(card.current_stamps ?? 0, stampsRequired))
  const [optimisticPoints, setOptimisticPoints] = useState(card.current_points ?? 0)

  // Resync si les props changent (apres router.refresh())
  useEffect(() => {
    setOptimisticStamps(Math.min(card.current_stamps ?? 0, stampsRequired))
    setOptimisticPoints(card.current_points ?? 0)
  }, [card.current_stamps, card.current_points, stampsRequired])

  const currentStamps = optimisticStamps
  const currentPoints = optimisticPoints
  const status = getStatus(card)

  // State
  const [tab, setTab] = useState<'history' | 'rewards'>('history')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState<number | ''>(1)
  const [adjustMode, setAdjustMode] = useState<'add' | 'deduct'>('add')

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [busy, setBusy] = useState<'add' | 'deduct' | 'reset' | 'claim' | 'delete' | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showClaimReward, setShowClaimReward] = useState(false)

  // ── API handlers ────────────────────────────────────────────────────

  async function handleAdd(amount: number) {
    if (amount <= 0) return
    setBusy('add'); setFeedback(null)
    // Optimistic update — la carte monte tout de suite
    if (isStamps) setOptimisticStamps((s) => Math.min(s + amount, stampsRequired))
    else setOptimisticPoints((p) => p + amount)
    try {
      const res = await fetch('/api/card/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id, type: business.loyalty_type, amount }),
      })
      const data = await res.json()
      if (data.success) {
        setFeedback({ type: 'success', message: data.message })
        setAdjustOpen(false)
        router.refresh()
      } else {
        // Rollback
        if (isStamps) setOptimisticStamps((s) => Math.max(s - amount, 0))
        else setOptimisticPoints((p) => Math.max(p - amount, 0))
        setFeedback({ type: 'error', message: data.error ?? 'Erreur.' })
      }
    } catch {
      if (isStamps) setOptimisticStamps((s) => Math.max(s - amount, 0))
      else setOptimisticPoints((p) => Math.max(p - amount, 0))
      setFeedback({ type: 'error', message: 'Erreur de connexion.' })
    } finally {
      setBusy(null)
    }
  }

  async function handleDeduct(amount: number) {
    if (amount <= 0) return
    setBusy('deduct'); setFeedback(null)
    // Optimistic update — la carte descend tout de suite
    if (isStamps) setOptimisticStamps((s) => Math.max(s - amount, 0))
    else setOptimisticPoints((p) => Math.max(p - amount, 0))
    try {
      const res = await fetch('/api/card/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id, type: business.loyalty_type, amount }),
      })
      const data = await res.json()
      if (data.success) {
        setFeedback({ type: 'success', message: `${amount} ${isStamps ? 'tampon' : 'point'}${amount > 1 ? 's' : ''} retiré${amount > 1 ? 's' : ''}.` })
        setAdjustOpen(false)
        router.refresh()
      } else {
        if (isStamps) setOptimisticStamps((s) => Math.min(s + amount, stampsRequired))
        else setOptimisticPoints((p) => p + amount)
        setFeedback({ type: 'error', message: data.error ?? 'Erreur.' })
      }
    } catch {
      if (isStamps) setOptimisticStamps((s) => Math.min(s + amount, stampsRequired))
      else setOptimisticPoints((p) => p + amount)
      setFeedback({ type: 'error', message: 'Erreur de connexion.' })
    } finally {
      setBusy(null)
    }
  }

  async function handleReset() {
    setBusy('reset'); setFeedback(null)
    const prevStamps = optimisticStamps
    const prevPoints = optimisticPoints
    setOptimisticStamps(0); setOptimisticPoints(0)
    try {
      const res = await fetch('/api/card/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id }),
      })
      const data = await res.json()
      if (data.success) {
        setFeedback({ type: 'success', message: 'Carte réinitialisée.' })
        setConfirmReset(false)
        router.refresh()
      } else {
        setOptimisticStamps(prevStamps); setOptimisticPoints(prevPoints)
        setFeedback({ type: 'error', message: data.error ?? 'Erreur.' })
      }
    } catch {
      setOptimisticStamps(prevStamps); setOptimisticPoints(prevPoints)
      setFeedback({ type: 'error', message: 'Erreur de connexion.' })
    } finally {
      setBusy(null)
    }
  }

  async function handleClaimReward(tierId: string) {
    setBusy('claim'); setFeedback(null)
    try {
      const res = await fetch('/api/card/claim-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id, reward_tier_id: tierId }),
      })
      const data = await res.json()
      if (data.success) {
        setFeedback({ type: 'success', message: data.message })
        setShowClaimReward(false)
        router.refresh()
      } else setFeedback({ type: 'error', message: data.error ?? 'Erreur.' })
    } catch {
      setFeedback({ type: 'error', message: 'Erreur de connexion.' })
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete() {
    setBusy('delete'); setFeedback(null)
    try {
      const res = await fetch('/api/card/delete-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id }),
      })
      const data = await res.json()
      if (data.success) router.push('/dashboard/clients')
      else { setFeedback({ type: 'error', message: data.error ?? 'Erreur.' }); setBusy(null) }
    } catch {
      setFeedback({ type: 'error', message: 'Erreur de connexion.' }); setBusy(null)
    }
  }

  // ── Quick actions (toolbar) ─────────────────────────────────────────

  function handleQuickReward() {
    if (tiers.length === 0) {
      setFeedback({ type: 'error', message: 'Aucune récompense configurée. Allez dans Réglages pour en créer.' })
      return
    }
    setShowClaimReward(true)
  }

  // handleQuickDeduct retiré 2026-05-12 — doublon avec l'input adjust
  // ci-dessous qui couvre ajouter ET retirer N unités précises.

  // ── Transactions filtering ──────────────────────────────────────────

  const filteredTransactions = useMemo(() => {
    let result = transactions
    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter((t) =>
        (t.description ?? '').toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      )
    }
    return result
  }, [transactions, search])

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const paginated = filteredTransactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggleAll(checked: boolean) {
    if (checked) setSelected(new Set(paginated.map((t) => t.id)))
    else setSelected(new Set())
  }

  function toggleRow(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allChecked = paginated.length > 0 && paginated.every((t) => selected.has(t.id))

  function statusFor(t: Transaction): { label: string; tone: 'success' | 'warning' | 'error' | 'brand' } {
    if (t.type === 'redeem') return { label: 'Récompense', tone: 'error' }
    return { label: '+1 tampon', tone: 'success' }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/clients')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:text-brand-secondary_hover transition-colors"
      >
        <ArrowLeft className="size-4" />
        Retour aux clients
      </button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-semibold text-primary">
            {card.customers?.first_name ?? 'Client'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-md text-tertiary">
            {card.customers?.email && <span>{card.customers.email}</span>}
            {card.customers?.email && <span>·</span>}
            <span>
              Inscrit{card.customers?.first_name && card.customers.first_name.match(/[aeiou]$/i) ? 'e' : ''} le{' '}
              {new Date(card.customers?.created_at ?? card.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
          <div className="mt-2"><StatusBadge status={status} /></div>
        </div>
      </div>

      {/* Feedback alert */}
      {feedback && (
        <div className={cx(
          'flex items-start gap-3 px-4 py-3 rounded-lg border',
          feedback.type === 'success'
            ? 'bg-success-secondary border-success text-success-primary'
            : 'bg-error-secondary border-error text-error-primary'
        )}>
          {feedback.type === 'success' ? <CheckCircle className="size-5 shrink-0 mt-0.5" /> : <AlertCircle className="size-5 shrink-0 mt-0.5" />}
          <p className="text-sm font-medium flex-1">{feedback.message}</p>
          <button onClick={() => setFeedback(null)} className="text-current opacity-70 hover:opacity-100">
            <XIcon className="size-4" />
          </button>
        </div>
      )}

      {/* Loyalty card visual */}
      <LoyaltyCardVisual
        customerName={card.customers?.first_name ?? 'Client'}
        loyaltyType={business.loyalty_type}
        currentStamps={currentStamps}
        stampsRequired={stampsRequired}
        currentPoints={currentPoints}
        businessName={business.business_name}
        businessLogoUrl={business.logo_url}
        cardImageUrl={business.card_image_url}
      />

      {/* Action toolbar — simplifié 2026-05-12.
          Avant : 5 boutons (Offrir récompense, Retirer tampon, Réinitialiser,
          Supprimer client, Export). Retours user :
            - "Retirer tampon" doublon avec l'input adjust ci-dessous (qui
              gère ajouter ET retirer N unités). Retiré.
            - "Export" n'avait pas d'onClick (bouton mort). Retiré jusqu'à
              implémentation réelle.
            - "Réinitialiser" et "Supprimer" déplacés en bas de page dans
              une zone "Actions sensibles" séparée pour éviter le clic
              accidentel à côté de "Offrir récompense". */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleQuickReward}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-success-secondary border border-success text-success-primary text-sm font-semibold hover:bg-success-secondary_hover disabled:opacity-60 transition-colors"
        >
          <Plus className="size-4" />
          Offrir récompense
        </button>
      </div>

      {/* Manual adjustment (preserve v1 behavior — input numeric for precise amount) */}
      <div className="rounded-xl bg-secondary/40 border border-secondary p-4">
        {!adjustOpen ? (
          <button
            type="button"
            onClick={() => { setAdjustOpen(true); setAdjustMode('add'); setAdjustAmount(1) }}
            className="text-sm font-medium text-brand-secondary hover:text-brand-secondary_hover transition-colors"
          >
            + Ajuster manuellement (quantité spécifique)
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-md p-0.5 bg-primary border border-secondary">
              <button
                type="button"
                onClick={() => setAdjustMode('add')}
                className={cx('px-3 py-1.5 rounded text-sm font-semibold transition-colors',
                  adjustMode === 'add' ? 'bg-brand-solid text-white' : 'text-secondary')}
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => setAdjustMode('deduct')}
                className={cx('px-3 py-1.5 rounded text-sm font-semibold transition-colors',
                  adjustMode === 'deduct' ? 'bg-brand-solid text-white' : 'text-secondary')}
              >
                Retirer
              </button>
            </div>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={1}
              value={adjustAmount === '' ? '' : adjustAmount}
              onChange={(e) => {
                const v = e.target.value
                if (v === '') {
                  setAdjustAmount('')
                  return
                }
                const n = Number(v)
                if (Number.isNaN(n) || n < 0) return
                setAdjustAmount(n)
              }}
              className="w-20 px-3 py-1.5 border border-primary rounded-md text-sm text-center bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <span className="text-sm text-tertiary">
              {isStamps ? `tampon${adjustAmount !== '' && adjustAmount > 1 ? 's' : ''}` : `point${adjustAmount !== '' && adjustAmount > 1 ? 's' : ''}`}
            </span>
            <Button
              color="primary"
              size="sm"
              isDisabled={busy !== null || adjustAmount === '' || adjustAmount === 0}
              onClick={() => {
                if (typeof adjustAmount !== 'number') return
                if (adjustMode === 'add') handleAdd(adjustAmount)
                else handleDeduct(adjustAmount)
              }}
            >
              Valider
            </Button>
            <button
              type="button"
              onClick={() => setAdjustOpen(false)}
              className="text-sm text-tertiary hover:text-secondary"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary">
        <div className="flex gap-6">
          {[
            { key: 'history', label: 'Historique' },
            { key: 'rewards', label: 'Récompenses' },
          ].map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key as 'history' | 'rewards')}
                className={cx(
                  'py-3 -mb-px text-sm font-semibold transition-colors border-b-2',
                  active ? 'text-brand-secondary border-brand' : 'text-tertiary border-transparent hover:text-secondary',
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'history' ? (
        <>
          {/* Filters bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher dans l'historique"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-primary border border-primary text-md text-primary placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
              />
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-primary border border-secondary text-sm font-semibold text-secondary hover:bg-primary_hover transition-colors"
              >
                <Calendar className="size-4" />
                {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-primary border border-secondary text-sm font-semibold text-secondary hover:bg-primary_hover transition-colors"
              >
                <FilterLines className="size-4" />
                Filtres
              </button>
            </div>
          </div>

          {/* Transactions table */}
          <div className="rounded-xl bg-primary border border-secondary overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-secondary">
              <h2 className="text-lg font-semibold text-primary">
                Historique des transactions
                {selected.size > 0 && (
                  <span className="ml-3 text-sm font-normal text-brand-secondary">
                    ({selected.size} sélectionné{selected.size > 1 ? 's' : ''})
                  </span>
                )}
              </h2>
              {selected.size > 0 && (
                <Button color="tertiary" size="sm" iconLeading={Trash01}>
                  Supprimer
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary bg-secondary/30">
                    <th className="w-10 px-6 py-3">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) => toggleAll(e.target.checked)}
                        className="size-4 rounded border-2 border-primary accent-brand-solid cursor-pointer"
                      />
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-tertiary uppercase tracking-wide">Visite</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-tertiary uppercase tracking-wide">{isStamps ? 'Tampons' : 'Points'}</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-tertiary uppercase tracking-wide">
                      <button className="inline-flex items-center gap-1 hover:text-secondary">
                        Date <ArrowDown className="size-3.5" />
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-tertiary uppercase tracking-wide">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center px-6 py-14 text-quaternary text-sm">
                        Aucune transaction.
                      </td>
                    </tr>
                  ) : paginated.map((t, idx) => {
                    const isSelected = selected.has(t.id)
                    const visitNum = transactions.length - transactions.indexOf(t)
                    const stat = statusFor(t)
                    const value = isStamps
                      ? (t.type === 'redeem' ? 'Récompense' : `+${t.stamps_added ?? 0} tampon`)
                      : (t.type === 'redeem' ? 'Récompense' : `+${t.points_added ?? 0} pts`)
                    return (
                      <tr key={t.id} className={cx(
                        'border-b border-secondary last:border-0 transition-colors',
                        isSelected ? 'bg-brand-secondary/40' : 'hover:bg-primary_hover',
                      )}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(t.id)}
                            className="size-4 rounded border-2 border-primary accent-brand-solid cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-primary">Visite #{visitNum}</td>
                        <td className="px-6 py-4 text-tertiary">{value}</td>
                        <td className="px-6 py-4 text-tertiary">
                          {new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cx(
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                            stat.tone === 'success' ? 'bg-success-secondary text-success-primary' :
                            stat.tone === 'error' ? 'bg-error-secondary text-error-primary' :
                            'bg-warning-secondary text-warning-primary'
                          )}>
                            <span className={cx(
                              'size-1.5 rounded-full',
                              stat.tone === 'success' ? 'bg-success-primary' :
                              stat.tone === 'error' ? 'bg-error-primary' :
                              'bg-warning-primary'
                            )} />
                            {stat.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-secondary">
                <Button color="secondary" size="sm" iconLeading={ArrowLeft} isDisabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Précédent
                </Button>
                <p className="text-xs text-tertiary">
                  Page {page + 1} sur {totalPages}
                </p>
                <Button color="secondary" size="sm" isDisabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  Suivant
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        // Rewards tab
        <div className="rounded-xl bg-primary border border-secondary p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Récompenses disponibles</h2>
          {tiers.length === 0 ? (
            <p className="text-sm text-tertiary">
              Aucune récompense configurée. Allez dans <a href="/dashboard/marketing/loyalty" className="text-brand-secondary font-semibold hover:underline">Réglages</a> pour en créer.
            </p>
          ) : (
            <ul className="space-y-3">
              {tiers.map((r) => {
                const reachable = isStamps
                  ? currentStamps >= r.threshold
                  : currentPoints >= r.threshold
                return (
                  <li key={r.id} className={cx(
                    'rounded-lg border p-4 flex items-center justify-between gap-4',
                    reachable ? 'border-success bg-success-secondary' : 'border-secondary bg-primary',
                  )}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl shrink-0" aria-hidden="true">{r.emoji || '🎁'}</span>
                      <div>
                        <p className="font-semibold text-primary">{r.name}</p>
                        <p className="text-xs text-tertiary mt-1">
                          {isStamps ? `À ${r.threshold} tampon${r.threshold > 1 ? 's' : ''}` : `${r.threshold} points`}
                        </p>
                      </div>
                    </div>
                    <Button
                      color={reachable ? 'primary' : 'secondary'}
                      size="sm"
                      isDisabled={!reachable || busy !== null}
                      onClick={() => handleClaimReward(r.id)}
                    >
                      Offrir
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* Zone sensible — actions destructives séparées de la toolbar
          principale pour éviter le clic accidentel (refonte 2026-05-12).
          Visuellement discrète (border subtile, label) mais accessible. */}
      <section className="mt-10 rounded-xl border border-error_subtle bg-error-secondary/40 p-5">
        <h3 className="text-sm font-semibold text-error-primary mb-1">Actions sensibles</h3>
        <p className="text-xs text-tertiary mb-4">
          Ces opérations sont irréversibles. À utiliser avec parcimonie.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg ring-1 ring-secondary bg-primary text-secondary text-sm font-semibold hover:bg-primary_hover disabled:opacity-60 transition-colors"
          >
            <RefreshCcw01 className="size-4" />
            Réinitialiser la carte
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-error-secondary border border-error text-error-primary text-sm font-semibold hover:bg-error-secondary_hover disabled:opacity-60 transition-colors"
          >
            <Trash01 className="size-4" />
            Supprimer les données client
          </button>
        </div>
      </section>

      {/* Confirm reset modal */}
      {confirmReset && (
        <div className="fixed inset-0 bg-overlay/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-primary mb-2">Réinitialiser la carte ?</h3>
            <p className="text-sm text-tertiary mb-6">
              Tous les {isStamps ? 'tampons' : 'points'} actuels seront effacés. Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <Button color="secondary" size="md" onClick={() => setConfirmReset(false)}>Annuler</Button>
              <Button color="primary" size="md" isDisabled={busy === 'reset'} onClick={handleReset}>
                {busy === 'reset' ? 'Réinitialisation...' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-overlay/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-error-primary mb-2">Supprimer les données client ?</h3>
            <p className="text-sm text-tertiary mb-6">
              Toutes les données de <span className="font-semibold text-primary">{card.customers?.first_name}</span> (carte,
              transactions, profil) seront définitivement effacées. Cette action est irréversible (RGPD).
            </p>
            <div className="flex gap-3 justify-end">
              <Button color="secondary" size="md" onClick={() => setConfirmDelete(false)}>Annuler</Button>
              <Button color="primary" size="md" isDisabled={busy === 'delete'} onClick={handleDelete}>
                {busy === 'delete' ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Claim reward modal */}
      {showClaimReward && (
        <div className="fixed inset-0 bg-overlay/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">Choisir une récompense</h3>
              <button onClick={() => setShowClaimReward(false)} className="text-tertiary hover:text-primary">
                <XIcon className="size-5" />
              </button>
            </div>
            <ul className="space-y-2">
              {tiers.map((r) => {
                const reachable = isStamps
                  ? currentStamps >= r.threshold
                  : currentPoints >= r.threshold
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      disabled={!reachable || busy !== null}
                      onClick={() => handleClaimReward(r.id)}
                      className={cx(
                        'w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors',
                        reachable ? 'border-success bg-success-secondary hover:bg-success-secondary_hover' : 'border-secondary opacity-50 cursor-not-allowed',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden="true">{r.emoji || '🎁'}</span>
                        <div>
                          <p className="font-semibold text-primary">{r.name}</p>
                          <p className="text-xs text-tertiary">
                            {isStamps ? `À ${r.threshold} tampon${r.threshold > 1 ? 's' : ''}` : `${r.threshold} points`}
                          </p>
                        </div>
                      </div>
                      {reachable && <Gift01 className="size-5 text-success-primary" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
