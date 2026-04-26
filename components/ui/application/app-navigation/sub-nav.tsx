'use client'

/**
 * SubNav — sous-navigation horizontale mobile-only.
 * Pattern Figma H2 : container brand-solid pleine largeur, colle au header.
 * Tab actif = pill blanc (texte brand), inactif = transparent (texte blanc).
 *
 * Comportement mobile :
 *  - Container plein ecran en arriere-plan violet
 *  - Tabs a largeur naturelle (pas de flex-1)
 *  - Single line (whitespace-nowrap)
 *  - Scroll horizontal avec snap → effet slider pour onglets > nb visibles
 *
 * Desktop : cache (md:hidden). La sidebar fait le travail.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cx } from '@/utils/cx'

export interface SubNavItem {
  label: string
  href: string
  /**
   * Si true, l'item est actif uniquement quand pathname === href (pas de match prefix).
   * Sert pour un item parent dont l'URL est aussi le prefix des sous-pages.
   */
  exact?: boolean
}

interface SubNavProps {
  items: SubNavItem[]
  className?: string
}

export function SubNav({ items, className }: SubNavProps) {
  const pathname = usePathname()

  return (
    <nav
      role="tablist"
      aria-label="Sous-navigation"
      className={cx(
        // px-4 + scroll-pl-4 : pour que le 1er tab garde sa respiration meme lors du snap-x au scroll start
        'flex w-full items-center gap-2 overflow-x-auto bg-brand-solid px-4 py-2.5 scroll-pl-4 scroll-pr-4 scrollbar-hide snap-x md:hidden',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? 'page' : undefined}
            className={cx(
              'shrink-0 snap-start whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold outline-focus-ring transition-colors duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2',
              isActive
                ? 'bg-primary text-brand-secondary'
                : 'bg-transparent text-white hover:bg-brand-solid_hover',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
