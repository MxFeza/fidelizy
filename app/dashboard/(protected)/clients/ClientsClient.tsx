'use client'

/**
 * Liste des clients commercants — Figma F1.
 * Refactor 2026-04-25 : tokens Untitled UI, layout F1, pas de raw gray-*.
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell01,
  Download01,
  QrCode01,
  SearchLg,
  FilterLines,
  Calendar,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Loading01,
  Trash01,
  DotsHorizontal,
} from '@untitledui/icons'
import type { Business, Customer, LoyaltyCard } from '@/lib/types'
import { Button } from '@/components/ui/base/buttons/button'
import { cx } from '@/utils/cx'

type ClientWithCard = LoyaltyCard & { customers: Customer }
type SortKey = 'name' | 'loyalty' | 'visits' | 'last_visit' | 'status'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'at_risk' | 'inactive' | 'lost'

interface Props {
  clients: ClientWithCard[]
  business: Business
}

const MS_20 = 20 * 24 * 60 * 60 * 1000
const MS_30 = 30 * 24 * 60 * 60 * 1000
const MS_60 = 60 * 24 * 60 * 60 * 1000
const PAGE_SIZE = 20

function getStatus(c: ClientWithCard): 'active' | 'at_risk' | 'inactive' | 'lost' {
  const ref = c.last_visit_at
    ? new Date(c.last_visit_at).getTime()
    : new Date(c.created_at).getTime()
  const diff = Date.now() - ref
  if (diff < MS_20) return 'active'
  if (diff < MS_30) return 'at_risk'
  if (diff < MS_60) return 'inactive'
  return 'lost'
}

function relativeDate(dateString: string | null): string {
  if (!dateString) return 'Jamais'
  const days = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} j`
  if (days < 14) return 'Il y a 1 sem.'
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`
  if (days < 60) return 'Il y a 1 mois'
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`
  return `Il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? 's' : ''}`
}

function StatusBadge({ status }: { status: ReturnType<typeof getStatus> }) {
  const config = {
    active:   { label: 'Actif',    bg: 'bg-success-secondary',  text: 'text-success-primary',  dot: 'bg-success-primary' },
    at_risk:  { label: 'À risque', bg: 'bg-warning-secondary',  text: 'text-warning-primary',  dot: 'bg-warning-primary' },
    inactive: { label: 'Inactif',  bg: 'bg-warning-secondary',  text: 'text-warning-primary',  dot: 'bg-warning-primary' },
    lost:     { label: 'Perdu',    bg: 'bg-error-secondary',    text: 'text-error-primary',    dot: 'bg-error-primary' },
  }[status]
  return (
    <span className={cx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', config.bg, config.text)}>
      <span className={cx('size-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}

export default function ClientsClient({ clients, business }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('last_visit')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
    setPage(0)
  }

  async function handleExportCsv() {
    setExporting(true)
    try {
      const res = await fetch('/api/dashboard/export-clients')
      if (!res.ok) throw new Error('Erreur API')
      const data = await res.json()
      const biz = data.business
      const isStamps = biz.loyalty_type === 'stamps'

      const rows: string[][] = [[
        'Prenom', 'Telephone', 'Email',
        isStamps ? 'Tampons actuels' : 'Points actuels',
        isStamps ? 'Tampons requis' : 'Max',
        'Date inscription', 'Derniere visite', 'Nombre visites', 'Statut',
      ]]
      const now = Date.now()
      for (const c of data.clients) {
        const cust = c.customers
        const ref = c.last_visit_at ? new Date(c.last_visit_at).getTime() : new Date(c.created_at).getTime()
        const diff = now - ref
        let statut = 'actif'
        if (diff >= MS_60) statut = 'perdu'
        else if (diff >= MS_20) statut = 'a risque'
        rows.push([
          cust?.first_name ?? '',
          cust?.phone ?? '',
          cust?.email ?? '',
          isStamps ? String(c.current_stamps ?? 0) : String(c.current_points ?? 0),
          isStamps ? String(biz.stamps_required) : '',
          new Date(c.created_at).toLocaleDateString('fr-FR'),
          c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString('fr-FR') : 'Jamais',
          String(c.total_visits ?? 0),
          statut,
        ])
      }

      const csvContent = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';')).join('\n')
      const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clients-${biz.business_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const filtered = useMemo(() => {
    let result = clients
    if (statusFilter !== 'all') result = result.filter((c) => getStatus(c) === statusFilter)
    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter((c) => {
        const name = (c.customers?.first_name ?? '').toLowerCase()
        const phone = (c.customers?.phone ?? '').toLowerCase()
        return name.includes(q) || phone.includes(q)
      })
    }
    return result
  }, [clients, search, statusFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let diff = 0
      switch (sortKey) {
        case 'name':
          diff = (a.customers?.first_name ?? '').localeCompare(b.customers?.first_name ?? '', 'fr')
          break
        case 'loyalty':
          diff = business.loyalty_type === 'stamps'
            ? (a.current_stamps ?? 0) - (b.current_stamps ?? 0)
            : (a.current_points ?? 0) - (b.current_points ?? 0)
          break
        case 'visits':
          diff = (a.total_visits ?? 0) - (b.total_visits ?? 0)
          break
        case 'last_visit': {
          const at = a.last_visit_at ? new Date(a.last_visit_at).getTime() : 0
          const bt = b.last_visit_at ? new Date(b.last_visit_at).getTime() : 0
          diff = at - bt
          break
        }
        case 'status': {
          const order = { active: 0, at_risk: 1, inactive: 2, lost: 3 }
          diff = order[getStatus(a)] - order[getStatus(b)]
          break
        }
      }
      return sortDir === 'asc' ? diff : -diff
    })
  }, [filtered, sortKey, sortDir, business.loyalty_type])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const filters = [
    { key: 'all', label: 'Tous' },
    { key: 'active', label: 'Actifs' },
    { key: 'inactive', label: 'Inactifs' },
    { key: 'lost', label: 'Perdus' },
    { key: 'at_risk', label: 'À risque' },
  ] as const

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-semibold text-primary">Clients</h1>
          <p className="text-md text-tertiary mt-1">
            Gérez et consultez tous vos clients fidélité.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="size-10 inline-flex items-center justify-center rounded-lg bg-primary border border-secondary text-fg-secondary hover:bg-primary_hover transition-colors"
            onClick={() => router.push('/dashboard/notifications')}
          >
            <Bell01 className="size-5" />
          </button>
          <Button
            color="secondary"
            size="md"
            iconLeading={exporting ? Loading01 : Download01}
            isDisabled={exporting || clients.length === 0}
            onClick={handleExportCsv}
          >
            {exporting ? 'Export...' : 'Exporter CSV'}
          </Button>
          <Button
            data-tour="invite-cta"
            color="primary"
            size="md"
            iconLeading={QrCode01}
            onClick={() => router.push('/dashboard?action=scan')}
          >
            <span className="hidden sm:inline">Scanner client</span>
            <span className="sm:hidden">Scanner</span>
          </Button>
        </div>
      </div>

      {/* Search + filters bar */}
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

      {/* Status tab chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = statusFilter === f.key
          return (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(0) }}
              className={cx(
                'px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors',
                active
                  ? 'bg-brand-solid text-white'
                  : 'bg-primary border border-secondary text-secondary hover:bg-primary_hover',
              )}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Table card */}
      <div className="rounded-xl bg-primary border border-secondary overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary">
          <h2 className="text-lg font-semibold text-primary">
            Fichier client
            {selected.size > 0 ? (
              <span className="ml-3 text-sm font-normal text-brand-secondary">
                ({selected.size} sélectionné{selected.size > 1 ? 's' : ''})
              </span>
            ) : (
              <span className="ml-3 text-sm font-normal text-tertiary">({sorted.length})</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setConfirmBulkDelete(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-error-secondary border border-error text-error-primary text-sm font-semibold hover:bg-error-secondary_hover transition-colors"
              >
                <Trash01 className="size-4" />
                Supprimer
              </button>
            )}
            <button type="button" className="text-tertiary hover:text-primary p-1.5 rounded-md hover:bg-secondary transition-colors">
              <DotsHorizontal className="size-5" />
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary bg-secondary/30">
                <th className="w-10 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && paginated.every((c) => selected.has(c.id))}
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(paginated.map((c) => c.id)))
                      else setSelected(new Set())
                    }}
                    className="size-4 rounded border-2 border-primary accent-brand-solid cursor-pointer"
                  />
                </th>
                <SortTh label="Nom" sortKey="name" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="text-left px-6 py-3 text-xs font-medium text-tertiary uppercase tracking-wide">
                  Téléphone
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-tertiary uppercase tracking-wide hidden xl:table-cell">
                  Email
                </th>
                <SortTh
                  label={business.loyalty_type === 'stamps' ? 'Tampons' : 'Points'}
                  sortKey="loyalty" current={sortKey} dir={sortDir} onSort={toggleSort}
                />
                <SortTh label="Dernière visite" sortKey="last_visit" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Statut" sortKey="status" current={sortKey} dir={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center px-6 py-14 text-quaternary text-sm">
                    {search ? 'Aucun client trouvé pour cette recherche.' : "Aucun client pour l'instant."}
                  </td>
                </tr>
              ) : paginated.map((c) => {
                const isSelected = selected.has(c.id)
                return (
                  <tr
                    key={c.id}
                    className={cx(
                      'border-b border-secondary last:border-0 transition-colors',
                      isSelected ? 'bg-brand-secondary/40' : 'hover:bg-primary_hover',
                    )}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelected((s) => {
                            const next = new Set(s)
                            if (next.has(c.id)) next.delete(c.id)
                            else next.add(c.id)
                            return next
                          })
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="size-4 rounded border-2 border-primary accent-brand-solid cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => router.push(`/dashboard/clients/${c.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-fg-brand-primary">
                            {c.customers?.first_name?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <span className="font-medium text-primary">{c.customers?.first_name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-tertiary cursor-pointer" onClick={() => router.push(`/dashboard/clients/${c.id}`)}>{c.customers?.phone ?? '—'}</td>
                    <td className="px-6 py-4 text-tertiary hidden xl:table-cell cursor-pointer" onClick={() => router.push(`/dashboard/clients/${c.id}`)}>{c.customers?.email ?? '—'}</td>
                    <td className="px-6 py-4 font-semibold text-primary cursor-pointer" onClick={() => router.push(`/dashboard/clients/${c.id}`)}>
                      {business.loyalty_type === 'stamps'
                        ? `${c.current_stamps ?? 0}/${business.stamps_required}`
                        : `${c.current_points ?? 0} pts`}
                    </td>
                    <td className="px-6 py-4 text-tertiary text-sm cursor-pointer" onClick={() => router.push(`/dashboard/clients/${c.id}`)}>{relativeDate(c.last_visit_at)}</td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => router.push(`/dashboard/clients/${c.id}`)}><StatusBadge status={getStatus(c)} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-secondary">
          {paginated.length === 0 ? (
            <div className="px-6 py-14 text-center text-quaternary text-sm">
              {search ? 'Aucun client trouvé.' : "Aucun client pour l'instant."}
            </div>
          ) : paginated.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => router.push(`/dashboard/clients/${c.id}`)}
              className="w-full text-left px-4 py-4 hover:bg-primary_hover transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-fg-brand-primary">
                      {c.customers?.first_name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-primary text-sm">{c.customers?.first_name ?? '—'}</p>
                    <p className="text-xs text-tertiary">{c.customers?.phone ?? ''}</p>
                  </div>
                </div>
                <StatusBadge status={getStatus(c)} />
              </div>
              <div className="flex items-center justify-between text-xs text-tertiary pt-2 border-t border-secondary">
                <span>
                  {business.loyalty_type === 'stamps'
                    ? `${c.current_stamps ?? 0}/${business.stamps_required} tampons`
                    : `${c.current_points ?? 0} pts`}
                </span>
                <span>{c.total_visits ?? 0} visite{(c.total_visits ?? 0) !== 1 ? 's' : ''}</span>
                <span>{relativeDate(c.last_visit_at)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-secondary">
            <p className="text-xs text-tertiary">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} sur {sorted.length}
            </p>
            <div className="flex gap-2">
              <Button
                color="secondary" size="sm"
                iconLeading={ArrowLeft}
                isDisabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Précédent
              </Button>
              <Button
                color="secondary" size="sm"
                iconTrailing={ArrowRight}
                isDisabled={page === totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm bulk delete modal */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 bg-overlay/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-error-primary mb-2">
              Supprimer {selected.size} client{selected.size > 1 ? 's' : ''} ?
            </h3>
            <p className="text-sm text-tertiary mb-6">
              Toutes les donnees (cartes, transactions, profils) des clients selectionnes seront definitivement effacees. Action irreversible (RGPD).
            </p>
            <div className="flex gap-3 justify-end">
              <Button color="secondary" size="md" onClick={() => setConfirmBulkDelete(false)}>Annuler</Button>
              <Button
                color="primary"
                size="md"
                isDisabled={bulkDeleting}
                onClick={async () => {
                  setBulkDeleting(true)
                  for (const cardId of Array.from(selected)) {
                    try {
                      await fetch('/api/card/delete-data', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ card_id: cardId }),
                      })
                    } catch {
                      // continue on error
                    }
                  }
                  setSelected(new Set())
                  setConfirmBulkDelete(false)
                  setBulkDeleting(false)
                  router.refresh()
                }}
              >
                {bulkDeleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────

function SortTh({
  label, sortKey: key, current, dir, onSort,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = current === key
  return (
    <th
      onClick={() => onSort(key)}
      className="text-left px-6 py-3 text-xs font-medium text-tertiary uppercase tracking-wide cursor-pointer hover:text-secondary select-none transition-colors"
    >
      <div className="flex items-center gap-1.5">
        {label}
        {active ? (
          dir === 'asc' ? <ArrowUp className="size-3.5 text-brand-secondary" /> : <ArrowDown className="size-3.5 text-brand-secondary" />
        ) : (
          <ArrowDown className="size-3.5 text-fg-quinary" />
        )}
      </div>
    </th>
  )
}
