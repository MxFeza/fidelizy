'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CreditCard02, Clock, Scan, Gift01, User01 } from '@untitledui/icons'
import type { FC, HTMLAttributes } from 'react'
import { cx } from '@/utils/cx'

type LocalTabId = 'card' | 'history' | 'profile'

interface BottomTabBarClientProps {
  cardId: string
  /**
   * Quand fourni : Carte / Historique / Profil sont des boutons qui appellent onLocalChange
   * (utilise sur la page principale /card/[cardId]).
   * Sinon (sur /scan, /referral) : ils sont des Link qui retournent vers la home.
   */
  onLocalChange?: (tab: LocalTabId) => void
  activeLocal?: LocalTabId
}

interface RouteTab {
  id: 'scan' | 'referral'
  href: string
  label: string
  icon: FC<HTMLAttributes<HTMLOrSVGElement>>
}

interface LocalTab {
  id: LocalTabId
  href: string
  label: string
  icon: FC<HTMLAttributes<HTMLOrSVGElement>>
}

export default function BottomTabBarClient({
  cardId,
  onLocalChange,
  activeLocal,
}: BottomTabBarClientProps) {
  const pathname = usePathname()
  const base = `/card/${cardId}`

  const localTabs: LocalTab[] = [
    { id: 'card', href: base, label: 'Carte', icon: CreditCard02 },
    { id: 'history', href: `${base}?tab=history`, label: 'Historique', icon: Clock },
    { id: 'profile', href: `${base}?tab=profile`, label: 'Profil', icon: User01 },
  ]

  const routeTabs: RouteTab[] = [
    { id: 'scan', href: `${base}/scan`, label: 'Scanner', icon: Scan },
    { id: 'referral', href: `${base}/referral`, label: 'Parrainage', icon: Gift01 },
  ]

  // Active states
  const onScan = pathname.startsWith(`${base}/scan`)
  const onReferral = pathname.startsWith(`${base}/referral`)
  const onHome = pathname === base

  const isLocalActive = (id: LocalTabId) => {
    if (!onHome) return false
    if (activeLocal !== undefined) return id === activeLocal
    return id === 'card'
  }

  const renderIcon = (Icon: FC<HTMLAttributes<HTMLOrSVGElement>>, active: boolean) => (
    <Icon
      aria-hidden="true"
      className={cx('size-5 shrink-0', active ? 'text-brand-secondary' : 'text-gray-400')}
    />
  )

  const renderLabel = (label: string, active: boolean) => (
    <span
      className={cx(
        'text-[11px] font-semibold leading-tight',
        active ? 'text-brand-secondary' : 'text-gray-400',
      )}
    >
      {label}
    </span>
  )

  const itemClass = 'flex h-full w-full flex-col items-center justify-center gap-1 transition-colors duration-100'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-100"
      style={{
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="max-w-md mx-auto flex items-stretch h-16">
        {/* Carte */}
        <li className="flex-1">
          {onLocalChange ? (
            <button
              type="button"
              onClick={() => onLocalChange('card')}
              aria-current={isLocalActive('card') ? 'page' : undefined}
              className={itemClass}
            >
              {renderIcon(localTabs[0].icon, isLocalActive('card'))}
              {renderLabel(localTabs[0].label, isLocalActive('card'))}
            </button>
          ) : (
            <Link href={localTabs[0].href} className={itemClass}>
              {renderIcon(localTabs[0].icon, false)}
              {renderLabel(localTabs[0].label, false)}
            </Link>
          )}
        </li>

        {/* Historique */}
        <li className="flex-1">
          {onLocalChange ? (
            <button
              type="button"
              onClick={() => onLocalChange('history')}
              aria-current={isLocalActive('history') ? 'page' : undefined}
              className={itemClass}
            >
              {renderIcon(localTabs[1].icon, isLocalActive('history'))}
              {renderLabel(localTabs[1].label, isLocalActive('history'))}
            </button>
          ) : (
            <Link href={localTabs[1].href} className={itemClass}>
              {renderIcon(localTabs[1].icon, false)}
              {renderLabel(localTabs[1].label, false)}
            </Link>
          )}
        </li>

        {/* Scanner (route) */}
        <li className="flex-1">
          <Link
            href={routeTabs[0].href}
            aria-current={onScan ? 'page' : undefined}
            className={itemClass}
          >
            {renderIcon(routeTabs[0].icon, onScan)}
            {renderLabel(routeTabs[0].label, onScan)}
          </Link>
        </li>

        {/* Parrainage (route) */}
        <li className="flex-1">
          <Link
            href={routeTabs[1].href}
            aria-current={onReferral ? 'page' : undefined}
            className={itemClass}
          >
            {renderIcon(routeTabs[1].icon, onReferral)}
            {renderLabel(routeTabs[1].label, onReferral)}
          </Link>
        </li>

        {/* Profil */}
        <li className="flex-1">
          {onLocalChange ? (
            <button
              type="button"
              onClick={() => onLocalChange('profile')}
              aria-current={isLocalActive('profile') ? 'page' : undefined}
              className={itemClass}
            >
              {renderIcon(localTabs[2].icon, isLocalActive('profile'))}
              {renderLabel(localTabs[2].label, isLocalActive('profile'))}
            </button>
          ) : (
            <Link href={localTabs[2].href} className={itemClass}>
              {renderIcon(localTabs[2].icon, false)}
              {renderLabel(localTabs[2].label, false)}
            </Link>
          )}
        </li>
      </ul>
    </nav>
  )
}
