import Link from 'next/link'
import Image from 'next/image'
import { Building02, CreditCard02, ArrowRight } from '@untitledui/icons'
import HeroBalloon from '@/components/client/HeroBalloon'
import IzouBulletLogo from '@/components/client/IzouBulletLogo'

export const metadata = {
  title: 'Izou — Cartes de fidélité digitales',
}

/**
 * Home / — 2 espaces : client et commerçant.
 *
 * Reprend le pattern visuel des écrans onboarding `/join/[shortCode]` :
 * header logo + hero ballon + IzouBulletLogo central, pour rester
 * cohérent avec l'univers client (Figma A2/A4) et donner du caractère
 * à la page d'arrivée. Décision user 2026-05-05.
 *
 * Le scan QR n'est PAS un point d'entrée landing : un commerçant qui
 * affiche son QR redirige directement vers `/join/{shortCode}` (URL
 * encodée dans le QR), et la fonction `/scan` interne sert depuis
 * l'espace client `/me`.
 */
export default function HomePage() {
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
