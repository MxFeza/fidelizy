import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Building02, CreditCard02, ArrowRight } from '@untitledui/icons'
import HeroBalloon from '@/components/client/HeroBalloon'
import IzouBulletLogo from '@/components/client/IzouBulletLogo'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const metadata = {
  title: 'Izou — Cartes de fidélité digitales',
}

/**
 * Home / — 2 espaces : client et commerçant.
 *
 * Bug fix 2026-05-10 : si l'utilisateur a déjà une session valide
 * (cookie Supabase non expiré), on redirige automatiquement vers son
 * espace (/dashboard pour merchant, /me pour customer) au lieu de
 * réafficher la page de sélection. Sinon, sur PWA installée, à chaque
 * réouverture après suspension iOS/Android (~5 min), l'utilisateur
 * tombait sur cette page de sélection et avait l'impression d'être
 * déconnecté alors que son cookie était encore valide.
 *
 * Reprend le pattern visuel des écrans onboarding `/join/[shortCode]`.
 */
export default async function HomePage() {
  // Detection auth + role pour redirect transparent quand session valide.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email) {
    const service = createServiceClient()

    // 1) Merchant ? business.id === user.id (Supabase Auth UID est aussi le PK businesses)
    const { data: business } = await service
      .from('businesses')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (business) redirect('/dashboard')

    // 2) Customer ? lookup par email
    const { data: customer } = await service
      .from('customers')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (customer) redirect('/me')

    // Sinon (cas edge : session sans business ni customer) — on affiche la
    // selection comme fallback, l'utilisateur peut choisir son espace.
  }

  return <HomePageView />
}

function HomePageView() {
  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <header className="px-5 py-4 border-b border-secondary">
        <Image
          src="/izou-logo.svg"
          alt="Izou"
          width={80}
          height={24}
          priority
          className="h-6 w-auto"
        />
      </header>

      <HeroBalloon />

      <main className="flex-1 flex flex-col px-5 py-8">
        <div className="w-full max-w-sm mx-auto space-y-6">
          {/* Bullets logo + heading */}
          <div className="space-y-3 text-center">
            <IzouBulletLogo />
            <div className="space-y-1.5">
              <h1 className="text-display-xs font-bold text-primary">
                Bienvenue sur Izou
              </h1>
              <p className="text-md text-tertiary">
                La fidélité digitale, simple et premium.
              </p>
            </div>
          </div>

          {/* 2 espaces : client + commerçant */}
          <div className="space-y-3">
            <Link
              href="/me"
              className="group flex items-center gap-4 bg-secondary hover:bg-secondary_hover transition-colors rounded-2xl border border-secondary p-5"
            >
              <div className="size-12 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                <CreditCard02 className="size-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-bold text-primary text-base">Je suis client</p>
                <p className="text-sm text-tertiary mt-0.5">
                  Accéder à mes cartes fidélité
                </p>
              </div>
              <ArrowRight className="size-5 text-quaternary shrink-0 group-hover:text-brand-secondary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
            </Link>

            <Link
              href="/dashboard/login"
              className="group flex items-center gap-4 bg-secondary hover:bg-secondary_hover transition-colors rounded-2xl border border-secondary p-5"
            >
              <div className="size-12 rounded-xl bg-brand-solid flex items-center justify-center shrink-0">
                <Building02 className="size-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-bold text-primary text-base">Je suis commerçant</p>
                <p className="text-sm text-tertiary mt-0.5">
                  Gérer mon programme et mes clients
                </p>
              </div>
              <ArrowRight className="size-5 text-quaternary shrink-0 group-hover:text-brand-secondary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-quaternary space-x-2">
        <Link href="/privacy" className="hover:text-tertiary underline">Confidentialité</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-tertiary underline">CGU</Link>
        <span>·</span>
        <Link href="/legal" className="hover:text-tertiary underline">Mentions légales</Link>
      </footer>
    </div>
  )
}
