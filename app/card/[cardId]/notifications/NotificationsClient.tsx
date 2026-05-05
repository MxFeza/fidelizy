'use client'

import Link from 'next/link'
import { ArrowLeft, Bell01 } from '@untitledui/icons'
import BottomTabBarClient from '@/components/client/BottomTabBarClient'

interface NotificationItem {
  id: string
  title: string
  body: string
  createdAt: string
  read: boolean
  emoji?: string
}

interface Props {
  cardId: string
  notifications: NotificationItem[]
}

export default function NotificationsClient({ cardId, notifications }: Props) {
  const isEmpty = notifications.length === 0

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="max-w-md mx-auto h-14 px-4 flex items-center gap-3">
            <Link
              href={`/card/${cardId}`}
              aria-label="Retour à la carte"
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
            <h1 className="text-base font-semibold text-primary">Notifications</h1>
          </div>
        </header>

        {isEmpty ? (
          <div className="max-w-md mx-auto px-5 pt-16 text-center">
            <div className="size-14 mx-auto mb-5 rounded-full bg-brand-50 flex items-center justify-center">
              <Bell01 className="size-7 text-brand-secondary" aria-hidden="true" />
            </div>
            <p className="text-base font-semibold text-primary mb-2">Aucune notification</p>
            <p className="text-sm text-tertiary leading-relaxed max-w-xs mx-auto">
              Vous serez alerté·e ici lors d&apos;un nouveau tampon, d&apos;une récompense ou d&apos;une
              campagne de votre commerçant.
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto px-5 pt-5">
            <ul className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3.5 ${n.read ? '' : 'bg-brand-50/40'}`}
                >
                  {!n.read && (
                    <span
                      aria-label="Non lu"
                      className="mt-2 size-2 rounded-full bg-brand-solid shrink-0"
                    />
                  )}
                  {n.emoji && (
                    <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">
                      {n.emoji}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary leading-tight">{n.title}</p>
                    <p className="text-sm text-tertiary mt-0.5 leading-snug">{n.body}</p>
                  </div>
                  <span className="text-xs text-quaternary shrink-0 mt-0.5 whitespace-nowrap">
                    {n.createdAt}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <BottomTabBarClient cardId={cardId} />
    </>
  )
}
