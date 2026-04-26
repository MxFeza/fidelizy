'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeLine, Users01, Send03, User01 } from '@untitledui/icons'
import type { FC, HTMLAttributes } from 'react'
import { cx } from '@/utils/cx'

interface Tab {
  href: string
  label: string
  icon: FC<HTMLAttributes<HTMLOrSVGElement>>
  isActive: (pathname: string) => boolean
}

const tabs: Tab[] = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: HomeLine,
    isActive: (p) => p === '/dashboard',
  },
  {
    href: '/dashboard/clients',
    label: 'Clients',
    icon: Users01,
    isActive: (p) => p === '/dashboard/clients' || p.startsWith('/dashboard/clients/'),
  },
  {
    href: '/dashboard/marketing',
    label: 'Marketing',
    icon: Send03,
    isActive: (p) => p === '/dashboard/marketing' || p.startsWith('/dashboard/marketing/'),
  },
  {
    href: '/dashboard/settings',
    label: 'Mon espace',
    icon: User01,
    isActive: (p) =>
      p === '/dashboard/settings' ||
      p.startsWith('/dashboard/settings/') ||
      p.startsWith('/dashboard/profile'),
  },
]

interface BottomNavProps {
  businessName?: string
}

export default function BottomNav(_props: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-secondary md:hidden">
      <ul className="flex items-stretch h-16 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname)
          const Icon = tab.icon

          return (
            <li key={tab.href} className="flex-1 p-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'group/tab flex h-full flex-col items-center justify-center gap-1 rounded-md px-0.5 py-2 transition-colors duration-100 ease-linear outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2',
                  active ? 'bg-brand-solid' : 'hover:bg-primary_hover',
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cx(
                    'size-5 shrink-0',
                    active ? 'text-white' : 'text-fg-quaternary',
                  )}
                />
                <span
                  className={cx(
                    'text-[11px] font-semibold leading-tight text-center whitespace-nowrap',
                    active ? 'text-white' : 'text-secondary',
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
