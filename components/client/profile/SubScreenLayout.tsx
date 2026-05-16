'use client'

/**
 * SubScreenLayout — layout commun pour les sub-screens du profil client
 * (Story 4.7 v2 — notifications, privacy, help, security, card-customization).
 *
 * Header : ArrowLeft retour SMART (router.back si historique, sinon /me/profile)
 *          + titre. Story 9.x.fix 2026-05-10 : avant le bouton allait toujours
 *          sur /me/profile, ce qui obligeait l'utilisateur à plusieurs clicks
 *          pour revenir sur sa carte d'origine.
 * Main : container max-w-md.
 * Footer : BottomTabBarClient si cardId fourni.
 */

import { useRouter } from 'next/navigation'
import { ArrowLeft } from '@untitledui/icons'
import BottomTabBarClient from '@/components/client/BottomTabBarClient'
import { cx } from '@/utils/cx'

interface SubScreenLayoutProps {
  title: string
  cardId: string | null
  /** Slot pour les toasts. */
  toast?: React.ReactNode
  /** Action additionnelle à droite du header. */
  rightSlot?: React.ReactNode
  children: React.ReactNode
}

export default function SubScreenLayout({ title, cardId, toast, rightSlot, children }: SubScreenLayoutProps) {
  const router = useRouter()

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/me/profile')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {toast}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto h-14 px-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Retour"
            className="size-10 -ml-2 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <h1 className="flex-1 text-md font-semibold text-gray-900 text-center pr-10">{title}</h1>
          {rightSlot}
        </div>
      </header>

      <main className={cx('flex-1 max-w-md w-full mx-auto px-5 py-6 space-y-6', cardId && 'pb-24')}>
        {children}
      </main>

      {cardId ? <BottomTabBarClient cardId={cardId} /> : null}
    </div>
  )
}

/** Section avec titre uppercase. */
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-400 tracking-wider uppercase px-1 mb-2">{title}</h2>
      {children}
    </section>
  )
}

/** Liste card-style — wrap les MenuItem dans un container blanc avec divider. */
export function MenuList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
      {children}
    </ul>
  )
}
