'use client'

import Link from 'next/link'
import { ArrowRight } from '@untitledui/icons'
import type { Transaction } from '@/lib/types'

interface RecentActivityProps {
  transactions: Transaction[]
  cardId: string
  /** Nombre max d'items affiches (default: 5) */
  limit?: number
}

/**
 * Carte "Activité récente" affichee dans CardTab — montre les N dernieres
 * transactions avec un lien "Voir tout" vers /card/[id]/history quand il
 * y a plus de transactions que la limite.
 */
export default function RecentActivity({
  transactions,
  cardId,
  limit = 5,
}: RecentActivityProps) {
  const items = transactions.slice(0, limit)
  const hasAny = transactions.length > 0

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-primary">Activité récente</h2>
        {hasAny && (
          <Link
            href={`/card/${cardId}/history`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-secondary hover:underline"
          >
            Voir tout
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-tertiary text-center py-4">
          Aucune activité récente
        </p>
      ) : (
        <ActivityList transactions={items} />
      )}
    </div>
  )
}

/** Liste plate des transactions (sans header). Utilisable dans la page historique. */
export function ActivityList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-tertiary text-center py-8">
        Aucune activité pour le moment
      </p>
    )
  }

  return (
    <ul className="divide-y divide-secondary">
      {transactions.map((t) => (
        <ActivityRow key={t.id} transaction={t} />
      ))}
    </ul>
  )
}

function ActivityRow({ transaction }: { transaction: Transaction }) {
  const { icon, label, accent } = describeTransaction(transaction)

  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div
        className="size-9 shrink-0 rounded-full flex items-center justify-center text-base"
        style={{ backgroundColor: accent.bg }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary line-clamp-2">{label}</p>
        <p className="text-xs text-tertiary mt-0.5">{formatRelative(transaction.created_at)}</p>
      </div>
    </li>
  )
}

function describeTransaction(t: Transaction): {
  icon: string
  label: string
  accent: { bg: string }
} {
  if (t.type === 'redeem') {
    return {
      icon: '🎁',
      label: t.description || 'Récompense utilisée',
      accent: { bg: 'rgb(254 243 226)' },
    }
  }

  if ((t.stamps_added ?? 0) > 0) {
    const n = t.stamps_added ?? 0
    return {
      icon: '🎫',
      label: t.description || `+${n} tampon${n > 1 ? 's' : ''}`,
      accent: { bg: 'rgb(237 233 254)' },
    }
  }

  if ((t.points_added ?? 0) > 0) {
    const n = t.points_added ?? 0
    return {
      icon: '⭐',
      label: t.description || `+${n} point${n > 1 ? 's' : ''}`,
      accent: { bg: 'rgb(254 249 195)' },
    }
  }

  return {
    icon: '•',
    label: t.description || 'Activité',
    accent: { bg: 'rgb(243 244 246)' },
  }
}

function formatRelative(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.round(diffMs / 60_000)
  const diffH = Math.round(diffMs / 3_600_000)
  const diffD = Math.round(diffMs / 86_400_000)

  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  if (diffH < 24) return `il y a ${diffH} h`
  if (diffD === 1) return 'hier'
  if (diffD < 7) return `il y a ${diffD} jours`

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
