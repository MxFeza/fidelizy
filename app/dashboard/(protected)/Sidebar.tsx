'use client'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  HomeLine, Users01, Send03, Settings01,
  Gift01, Rocket01, Heart,
  Building07, ShieldTick, CoinsStacked01, FileShield02,
  LogOut01,
} from '@untitledui/icons'
import { NavList } from '@/components/ui/application/app-navigation/nav-list'
import type { NavItemType } from '@/components/ui/application/app-navigation/config'
import { Avatar } from '@/components/ui/base/avatar/avatar'
import { PUBLIC_ASSETS } from '@/lib/assets'

interface SidebarProps {
  businessName: string
  businessEmail?: string
}

const navItems: NavItemType[] = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: HomeLine,
  },
  {
    href: '/dashboard/clients',
    label: 'Clients',
    icon: Users01,
  },
  {
    href: '/dashboard/marketing',
    label: 'Marketing',
    icon: Send03,
    items: [
      { href: '/dashboard/marketing/loyalty', label: 'Programme de fidélité', icon: Gift01 },
      { href: '/dashboard/marketing/referral', label: 'Parrainage', icon: Heart },
      { href: '/dashboard/marketing/push', label: 'Push notifications', icon: Rocket01 },
    ],
  },
  {
    href: '/dashboard/settings',
    label: 'Réglages',
    icon: Settings01,
    items: [
      { href: '/dashboard/settings', label: 'Mon entreprise', icon: Building07 },
      { href: '/dashboard/settings/security', label: 'Sécurité', icon: ShieldTick },
      { href: '/dashboard/settings/plan', label: 'Abonnement', icon: CoinsStacked01 },
      { href: '/dashboard/settings/privacy', label: 'Confidentialité', icon: FileShield02 },
    ],
  },
]

export default function Sidebar({ businessName, businessEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)

  function getActiveUrl(): string {
    if (pathname === '/dashboard') return '/dashboard'
    if (pathname === '/dashboard/settings') return '/dashboard/settings'
    if (pathname.startsWith('/dashboard/settings/')) return pathname
    if (pathname.startsWith('/dashboard/marketing/')) return pathname
    if (pathname.startsWith('/dashboard/clients')) return '/dashboard/clients'
    return pathname
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/dashboard/login')
  }

  async function handleFeedbackSubmit() {
    if (!feedbackText.trim()) return
    setFeedbackSending(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: feedbackText,
          page: pathname,
        }),
      })
      setFeedbackSent(true)
      setFeedbackText('')
      setTimeout(() => {
        setFeedbackSent(false)
        setFeedbackOpen(false)
      }, 2000)
    } catch {
      // Silently fail — feedback is non-critical
    } finally {
      setFeedbackSending(false)
    }
  }

  return (
    <aside className="hidden md:flex w-[280px] bg-primary border-r border-secondary flex-col h-full">
      {/* Header — Logo (Figma: pt-32px pl-24px, logo 139x32) */}
      <div className="flex flex-col gap-5 px-4 pt-4 lg:px-5 lg:pt-5">
        <Image
          src={PUBLIC_ASSETS.branding.logoNoir}
          alt="Izou"
          width={139}
          height={32}
          className="h-6"
          unoptimized
        />
      </div>

      {/* Navigation — @untitledui/react NavList */}
      <nav className="flex-1 overflow-auto">
        <NavList activeUrl={getActiveUrl()} items={navItems} />
      </nav>

      {/* Footer */}
      <div className="mt-auto flex flex-col gap-3 px-4 py-4 lg:py-5">
        {/* Feedback CTA — simple lien violet. Version complete dans le profil utilisateur (v2). */}
        {!feedbackOpen ? (
          <button
            onClick={() => setFeedbackOpen(true)}
            className="self-start px-2 text-sm font-semibold text-brand-secondary hover:text-brand-secondary_hover transition duration-100 ease-linear"
          >
            Proposer une amelioration
          </button>
        ) : (
          <div className="space-y-2 px-2">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Decrivez votre idee..."
              rows={3}
              autoFocus
              className="w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleFeedbackSubmit}
                disabled={feedbackSending || !feedbackText.trim()}
                className="flex-1 rounded-md bg-brand-solid px-3 py-2 text-sm font-semibold text-white hover:bg-brand-solid_hover transition duration-100 ease-linear disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {feedbackSent ? 'Merci !' : feedbackSending ? 'Envoi...' : 'Envoyer'}
              </button>
              <button
                onClick={() => { setFeedbackOpen(false); setFeedbackText('') }}
                className="rounded-md px-3 py-2 text-sm font-semibold text-secondary hover:text-secondary_hover hover:bg-primary_hover transition duration-100 ease-linear"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Account card — pattern NavAccountCard @untitledui/react */}
        <div className="relative flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary ring-inset">
          <Avatar
            size="md"
            initials={businessName.charAt(0).toUpperCase()}
            alt={businessName}
          />
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary truncate">
              {businessName}
            </p>
            {businessEmail && (
              <p className="text-sm text-tertiary truncate">
                {businessEmail}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 flex items-center justify-center rounded-md p-1.5 text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover"
            title="Se deconnecter"
            aria-label="Se deconnecter"
          >
            <LogOut01 className="size-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
