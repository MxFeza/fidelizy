'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Business, Customer, LoyaltyCard } from '@/lib/types'

type ClientWithCard = LoyaltyCard & { customers: Customer }
type SortKey = 'name' | 'loyalty' | 'visits' | 'last_visit' | 'status'
type SortDir = 'asc' | 'desc'

interface Stats {
  active: number
  inactive: number
  lost: number
  returnRate: number
}

interface Props {
  clients: ClientWithCard[]
  business: Business
  stats: Stats
}

const MS_30 = 30 * 24 * 60 * 60 * 1000
const MS_60 = 60 * 24 * 60 * 60 * 1000
const PAGE_SIZE = 20

function getStatus(c: ClientWithCard): 'active' | 'inactive' | 'lost' {
  const ref = c.last_visit_at
    ? new Date(c.last_visit_at).getTime()
    : new Date(c.created_at).getTime()
  const diff = Date.now() - ref
  if (diff < MS_30) return 'active'
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

const STATUS_CONFIG = {
  active: { label: 'Actif', cls: 'bg-green-100 text-green-700' },
  inactive: { label: 'Inactif', cls: 'bg-amber-100 text-amber-700' },
  lost: { label: 'Perdu', cls: 'bg-red-100 text-red-700' },
}

export default function ClientsClient({ clients, business, stats }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('last_visit')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return clients
    return clients.filter((c) => {
      const name = (c.customers?.first_name ?? '').toLowerCase()
      const phone = (c.customers?.phone ?? '').toLowerCase()
      return name.includes(q) || phone.includes(q)
    })
  }, [clients, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let diff = 0
      switch (sortKey) {
        case 'name':
          diff = (a.customers?.first_name ?? '').localeCompare(b.customers?.first_name ?? '', 'fr')
          break
        case 'loyalty':
          diff =
            business.loyalty_type === 'stamps'
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
          const order = { active: 0, inactive: 1, lost: 2 }
          diff = order[getStatus(a)] - order[getStatus(b)]
          break
        }
      }
      return sortDir === 'asc' ? diff : -diff
    })
  }, [filtered, sortKey, sortDir, business.loyalty_type])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Mes clients</h1>
          <span className="text-gray-400 text-sm font-normal">{clients.length} client{clients.length !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-gray-400 text-sm mt-0.5 hidden sm:block">Base de données de votre programme de fidélité</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard label="Actifs" value={stats.active} hint="< 30 jours" color="green" />
        <StatCard label="Inactifs" value={stats.inactive} hint="30–60 jours" color="amber" />
        <StatCard label="Perdus" value={stats.lost} hint="> 60 jours" color="red" />
        <StatCard label="Taux de retour" value={`${stats.returnRate}%`} hint="2+ visites" color="indigo" />
      </div>

      {/* Search */}
      <div className="mb-5 sticky top-0 z-10 bg-gray-50 py-2 -mt-2 md:static md:bg-transparent md:py-0 md:mt-0">
        <div className="relative max-w-full sm:max-w-sm">
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par nom ou téléphone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <SortTh label="Nom" sortKey="name" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Téléphone
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                Email
              </th>
              <SortTh
                label={business.loyalty_type === 'stamps' ? 'Tampons' : 'Points'}
                sortKey="loyalty"
                current={sortKey}
                dir={sortDir}
                onSort={toggleSort}
              />
              <SortTh label="Visites" sortKey="visits" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortTh label="Dernière visite" sortKey="last_visit" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortTh label="Statut" sortKey="status" current={sortKey} dir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center px-5 py-14 text-gray-400 text-sm">
                  {search ? 'Aucun client trouvé pour cette recherche.' : "Aucun client pour l'instant."}
                </td>
              </tr>
            ) : (
              paginated.map((c) => {
                const status = getStatus(c)
                const sc = STATUS_CONFIG[status]
                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-indigo-700 font-semibold text-xs">
                            {c.customers?.first_name?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{c.customers?.first_name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{c.customers?.phone ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-400 hidden lg:table-cell">{c.customers?.email ?? '—'}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {business.loyalty_type === 'stamps'
                        ? `${c.current_stamps ?? 0}/${business.stamps_required}`
                        : `${c.current_points ?? 0} pts`}
                    </td>
                    <td className="px-5 py-4 text-gray-500">{c.total_visits ?? 0}</td>
                    <td className="px-5 py-4 text-gray-400 text-sm">{relativeDate(c.last_visit_at)}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.cls}`}>
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {paginated.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-gray-100">
            {search ? 'Aucun client trouvé.' : "Aucun client pour l'instant."}
          </div>
        ) : (
          paginated.map((c) => {
            const status = getStatus(c)
            const sc = STATUS_CONFIG[status]
            return (
              <div
                key={c.id}
                onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-indigo-200 transition-colors active:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-indigo-700 font-semibold text-sm">
                        {c.customers?.first_name?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{c.customers?.first_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{c.customers?.phone ?? ''}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.cls}`}>
                    {sc.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                  <span>
                    {business.loyalty_type === 'stamps'
                      ? `${c.current_stamps ?? 0}/${business.stamps_required} tampons`
                      : `${c.current_points ?? 0} pts`}
                  </span>
                  <span>{c.total_visits ?? 0} visite{(c.total_visits ?? 0) !== 1 ? 's' : ''}</span>
                  <span>{relativeDate(c.last_visit_at)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-xs text-gray-400">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} sur {sorted.length}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Précédent
            </button>
            <button
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  hint,
  color,
}: {
  label: string
  value: string | number
  hint: string
  color: 'green' | 'amber' | 'red' | 'indigo'
}) {
  const styles = {
    green: 'text-green-700 bg-green-50 border-green-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
    red: 'text-red-700 bg-red-50 border-red-100',
    indigo: 'text-indigo-700 bg-indigo-50 border-indigo-100',
  }
  return (
    <div className={`rounded-2xl p-5 border ${styles[color]}`}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-sm font-semibold mt-1.5">{label}</p>
      <p className="text-xs opacity-60 mt-0.5">{hint}</p>
    </div>
  )
}

function SortTh({
  label,
  sortKey: key,
  current,
  dir,
  onSort,
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
      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none"
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={active ? 'text-indigo-500' : 'text-gray-200'}>
          {active && dir === 'asc' ? '↑' : '↓'}
        </span>
      </div>
    </th>
  )
}
