'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CreditCard02, Clock, ScanQrCode01, Gift01, User01 } from '@untitledui/icons'
import type { FC, HTMLAttributes } from 'react'
import { cx } from '@/utils/cx'

interface Tab {
  href: string
  label: string
  icon: FC<HTMLAttributes<HTMLOrSVGElement>>
  match: (pathname: string, base: string) => boolean
}

const buildTabs = (base: string): Tab[] => [
  {
    href: base,
    label: 'Carte',
    icon: CreditCard02,
    match: (p, b) => p === b,
  },
  {
    href: `${base}/history`,
    label: 'Historique',
    icon: Clock,
    match: (p, b) => p.startsWith(`${b}/history`),
  },
  {
    href: `${base}/scan`,
    label: 'Scanner',
    icon: ScanQrCode01,
    match: (p, b) => p.startsWith(`${b}/scan`),
  },
  {
    href: `${base}/referral`,
    label: 'Parrainage',
    icon: Gift01,
    match: (p, b) => p.startsWith(`${b}/referral`),
  },
  {
    href: `${base}/profile`,
    label: 'Profil',
    icon: User01,
    match: (p, b) => p.startsWith(`${b}/profile`),
  },
]

interface BottomTabBarClientProps {
  cardId: string
  /** Optionnel : surchage le mode actif pour les onglets gerees en local-state (pas via routes) */
  activeOverride?: 'card' | 'history' | 'profile'
}

export default function BottomTabBarClient({ cardId, activeOverride }: BottomTabBarClientProps) {
  const pathname = usePathname()
  const base = `/card/${cardId}`
  const tabs = buildTabs(base)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-100">
      <ul className="max-w-md mx-auto flex items-stretch h-16 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const overrideActive =
            activeOverride === 'card' && tab.label === 'Carte' ||
            activeOverride === 'history' && tab.label === 'Historique' ||
            activeOverride === 'profile' && tab.label === 'Profil'
          const active = activeOverride
            ? overrideActive
            : tab.match(pathname, base)
          const Icon = tab.icon

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex h-full flex-col items-center justify-center gap-1 transition-colors duration-100',
                  active ? 'text-brand-secondary' : 'text-gray-400 hover:text-gray-600',
                )}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                <span className="text-[11px] font-semibold leading-tight">{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
