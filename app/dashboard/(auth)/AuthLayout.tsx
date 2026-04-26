'use client'

/**
 * AuthLayout — layout partage pour toutes les pages auth (login, register, forgot, onboarding, welcome).
 * Desktop : split 50/50 logo+form a gauche, image a droite (ou pleine largeur si rightPanel absent).
 * Mobile : hero image en haut (si rightPanel), puis form.
 */

import Image from 'next/image'
import type { ReactNode } from 'react'
import { cx } from '@/utils/cx'
import { PUBLIC_ASSETS } from '@/lib/assets'

interface AuthLayoutProps {
  children: ReactNode
  /** Image a afficher sur le panel droit desktop et en hero mobile. */
  rightPanel?: {
    src: string
    alt: string
    /** Masque le panel droit sur desktop et le hero mobile. */
    hidden?: boolean
    /** Overlay de testimonial a afficher en bas de l'image (desktop only). */
    testimonial?: {
      quote: string
      author: string
      role: string
    }
  }
  /** Masque le footer. */
  hideFooter?: boolean
}

export default function AuthLayout({ children, rightPanel, hideFooter = false }: AuthLayoutProps) {
  const hasPanel = rightPanel && !rightPanel.hidden

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-primary">
      {/* Hero mobile (image en haut) — uniquement si rightPanel present */}
      {hasPanel && (
        <div className="relative w-full h-48 lg:hidden overflow-hidden">
          <Image
            src={rightPanel.src}
            alt={rightPanel.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
          {/* Fondu image -> fond pour transition propre vers le formulaire */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-primary to-transparent pointer-events-none" />
        </div>
      )}

      {/* Panneau gauche : logo + contenu + footer */}
      <div className={cx(
        'flex flex-col flex-1 relative',
        hasPanel ? 'lg:w-1/2' : 'lg:w-full',
      )}>
        {/* Logo (top-left, 32px de hauteur) */}
        <div className="px-6 pt-6 lg:px-10 lg:pt-8">
          <Image
            src={PUBLIC_ASSETS.branding.logoNoir}
            alt="Izou"
            width={139}
            height={32}
            className="h-8 w-auto"
            priority
            unoptimized
          />
        </div>

        {/* Contenu centre */}
        <main className="flex-1 flex items-center justify-center px-6 py-10 lg:px-10">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </main>

        {/* Footer */}
        {!hideFooter && (
          <footer className="flex items-center justify-between gap-4 px-6 pb-6 text-xs text-tertiary lg:px-10 lg:pb-8">
            <span>© Izou 2026</span>
            <a href="mailto:contact@izou.app" className="hover:text-secondary transition-colors">
              ✉ contact@izou.app
            </a>
          </footer>
        )}
      </div>

      {/* Panneau droit desktop — image */}
      {hasPanel && (
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <Image
            src={rightPanel.src}
            alt={rightPanel.alt}
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
          {rightPanel.testimonial && (
            <div className="absolute inset-x-0 bottom-0 p-10 bg-black/35 text-white">
              <blockquote className="text-xl font-semibold leading-snug mb-6 max-w-md">
                &ldquo;{rightPanel.testimonial.quote}&rdquo;
              </blockquote>
              <p className="text-lg font-semibold">{rightPanel.testimonial.author}</p>
              <p className="text-sm opacity-90">{rightPanel.testimonial.role}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
