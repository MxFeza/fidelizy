'use client'

import type { Transaction } from '@/lib/types'
import { formatDate } from './utils'

interface HistoryTabProps {
  transactions: Transaction[]
  business: { loyalty_type: string }
  color: string
}

export default function HistoryTab({ transactions, color }: HistoryTabProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden -mt-4">
      <div className="px-5 py-4 border-b border-gray-50">
        <p className="text-sm font-semibold text-gray-900">
          Historique ({transactions.length} opération
          {transactions.length !== 1 ? 's' : ''})
        </p>
      </div>
      {transactions.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-gray-400 text-sm">Aucune opération pour l&apos;instant</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {transactions.map((tx) => {
            const isStamp = tx.stamps_added != null && tx.stamps_added > 0
            const isRedeem = tx.type === 'redeem'
            const value = isStamp ? tx.stamps_added : tx.points_added
            return (
              <li
                key={tx.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {isRedeem ? '🎁' : isStamp ? '🎫' : '⭐'}
                  </span>
                  <p className="text-sm text-gray-600">
                    {tx.description ??
                      (isStamp ? 'Tampon ajouté' : 'Points gagnés')}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  {value != null && value > 0 && (
                    <p className="text-sm font-semibold" style={{ color }}>
                      +{value} {isStamp ? '🎫' : 'pts'}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
