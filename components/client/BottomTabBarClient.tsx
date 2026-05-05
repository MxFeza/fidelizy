'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CreditCard02, Building02, Scan, Gift01, User01 } from '@untitledui/icons'
import type { FC, HTMLAttributes } from 'react'
import { cx } from '@/utils/cx'

type LocalTabId = 'card' | 'profile'

interface BottomTabBarClientProps {
  cardId: string
  /**
   * Quand fourni : Carte / Profil sont des boutons qui appellent onLocalChange
   * (utilise sur la page principale /card/[cardId]).
   * Sinon (sur /business, /scan, /referral) : ils sont des Link qui retournent vers la home.
   */
  onLocalChange?: (tab: LocalTabId) => void
  activeLocal?: LocalTabId
}

interface RouteTab {
  id: 'business' | 'scan' | 'referral'
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

  const cardTab: LocalTab = { id: 'card', href: base, label: 'Carte', icon: CreditCard02 }
  const profileTab: LocalTab = { id: 'profile', href: `${base}?tab=profile`, label: 'Profil', icon: User01 }

  const businessTab: RouteTab = { id: 'business', href: `${base}/business`, label: 'Entreprise', icon: Building02 }
  // Story 4.2.e (Agent #2) : la page /scan racine gère le scan QR pour
  // ajouter une carte d'un autre commerce. Pas de page dédiée par carte.
  const scanTab: RouteTab = { id: 'scan', href: '/scan', label: 'Scanner', icon: Scan }
  const referralTab: RouteTab = { id: 'referral', href: `${base}/referral`, label: 'Parrainage', icon: Gift01 }

  // Active states
  const onBusiness = pathname.startsWith(`${base}/business`)
  const onScan = pathname.startsWith('/scan')
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
        {/* Carte (local) */}
        <li className="flex-1">
          {onLocalChange ? (
            <button
              type="button"
              onClick={() => onLocalChange('card')}
              aria-current={isLocalActive('card') ? 'page' : undefined}
              className={itemClass}
            >
              {renderIcon(cardTab.icon, isLocalActive('card'))}
              {renderLabel(cardTab.label, isLocalActive('card'))}
            </button>
          ) : (
            <Link href={cardTab.href} className={itemClass}>
              {renderIcon(cardTab.icon, false)}
              {renderLabel(cardTab.label, false)}
            </Link>
          )}
        </li>

        {/* Entreprise (route) */}
        <li className="flex-1">
          <Link
            href={businessTab.href}
            aria-current={onBusiness ? 'page' : undefined}
            className={itemClass}
          >
            {renderIcon(businessTab.icon, onBusiness)}
            {renderLabel(businessTab.label, onBusiness)}
          </Link>
        </li>

        {/* Scanner (route) */}
        <li className="flex-1">
          <Link
            href={scanTab.href}
            aria-current={onScan ? 'page' : undefined}
            className={itemClass}
          >
            {renderIcon(scanTab.icon, onScan)}
            {renderLabel(scanTab.label, onScan)}
          </Link>
        </li>

        {/* Parrainage (route) */}
        <li className="flex-1">
          <Link
            href={referralTab.href}
            aria-current={onReferral ? 'page' : undefined}
            className={itemClass}
          >
            {renderIcon(referralTab.icon, onReferral)}
            {renderLabel(referralTab.label, onReferral)}
          </Link>
        </li>

        {/* Profil (local) */}
        <li className="flex-1">
          {onLocalChange ? (
            <button
              type="button"
              onClick={() => onLocalChange('profile')}
              aria-current={isLocalActive('profile') ? 'page' : undefined}
              className={itemClass}
            >
              {renderIcon(profileTab.icon, isLocalActive('profile'))}
              {renderLabel(profileTab.label, isLocalActive('profile'))}
            </button>
          ) : (
            <Link href={profileTab.href} className={itemClass}>
              {renderIcon(profileTab.icon, false)}
              {renderLabel(profileTab.label, false)}
            </Link>
          )}
        </li>
      </ul>
    </nav>
  )
}
