'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bell01 } from '@untitledui/icons'
import { PUBLIC_ASSETS } from '@/lib/assets'

interface MobileHeaderProps {
  /** Si true, affiche un dot rouge sur la bell. */
  hasUnread?: boolean
}

/**
 * Header mobile : logo Izou a gauche + bell (inbox notifications) a droite.
 * La bell pointe vers /dashboard/notifications qui est l'inbox des notifications
 * RECUES par le commercant (pas l'emission push qui est sur /dashboard/marketing/push).
 */
export default function MobileHeader({ hasUnread = false }: MobileHeaderProps) {
  return (
    <header className="flex md:hidden items-center justify-between px-4 py-3 bg-primary border-b border-secondary">
      <Link href="/dashboard" aria-label="Tableau de bord" className="flex items-center">
        <Image
          src={PUBLIC_ASSETS.branding.logoNoir}
          alt="Izou"
          width={72}
          height={20}
          className="h-5 w-auto"
          priority
        />
      </Link>

      <Link
        href="/dashboard/notifications"
        aria-label="Notifications reçues"
        className="relative shrink-0 flex items-center justify-center rounded-md p-1.5 text-fg-quaternary transition-colors duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Bell01 aria-hidden="true" className="size-5" />
        {hasUnread && (
          <span
            aria-label="Notifications non lues"
            className="absolute top-1 right-1 size-2 rounded-full bg-error-solid ring-2 ring-primary"
          />
        )}
      </Link>
    </header>
  )
}
