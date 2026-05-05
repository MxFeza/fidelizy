'use client'

import Link from 'next/link'
import { ArrowLeft } from '@untitledui/icons'
import TopBarClient from '@/components/client/TopBarClient'
import BottomTabBarClient from '@/components/client/BottomTabBarClient'
import { ActivityList } from '../components/RecentActivity'
import type { Transaction } from '@/lib/types'

interface Props {
  cardId: string
  businessName: string
  transactions: Transaction[]
}

export default function HistoryClient({ cardId, businessName, transactions }: Props) {
  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">
        <TopBarClient
          rightSlot={
            <Link
              href={`/card/${cardId}`}
              aria-label="Retour à la carte"
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
          }
        />

        <div className="bg-white border-b border-gray-100">
          <div className="max-w-md mx-auto px-5 py-5">
            <h1 className="text-2xl font-bold text-primary leading-tight">Historique</h1>
            {businessName && (
              <p className="text-sm text-tertiary mt-1">Toutes vos activités chez {businessName}</p>
            )}
          </div>
        </div>

        <div className="max-w-md mx-auto px-5 pt-5">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <ActivityList transactions={transactions} />
          </div>
        </div>
      </div>

      <BottomTabBarClient cardId={cardId} />
    </>
  )
}
