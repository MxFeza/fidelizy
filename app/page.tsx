import Link from 'next/link'
import Image from 'next/image'
import { Building02, CreditCard02, ArrowRight, QrCode02 } from '@untitledui/icons'

export const metadata = {
  title: 'Izou — Cartes de fidélité digitales',
}

/**
 * Home / — Page d'accueil avec 3 entrées : scanner direct, espace client,
 * espace commerçant.
 *
 * En production future, les espaces commerçant et client seront sur des
 * subdomains differents. Pendant les phases de dev/test, cette home sert
 * de point d'entree unique.
 *
 * Decision user 2026-05-01 + ajout entry point /scan en 4.2.f.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          {/* Logo + tagline */}
          <div className="text-center mb-10">
            <Image
              src="/izou-logo.svg"
              alt="Izou"
              width={120}
              height={36}
              priority
              className="h-9 w-auto mx-auto mb-4"
            />
            <p className="text-md text-tertiary">
              La fidélité digitale, simple et premium.
            </p>
          </div>

          {/* CTA principal — scanner direct */}
          <Link
            href="/scan"
            className="group flex items-center gap-4 bg-brand-solid hover:bg-brand-solid_hover transition-colors rounded-2xl shadow-sm p-5 mb-3"
          >
            <div className="size-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <QrCode02 className="size-6 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-base">Scanner un QR code</p>
              <p className="text-sm text-white/80 mt-0.5">
                Rejoignez un commerce en un instant
              </p>
            </div>
            <ArrowRight className="size-5 text-white shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>

          {/* CTAs secondaires — espaces dédiés */}
          <div className="space-y-3">
            <Link
              href="/me"
              className="group flex items-center gap-4 bg-secondary hover:bg-secondary_hover transition-colors rounded-2xl border border-secondary p-5"
            >
              <div className="size-12 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                <CreditCard02 className="size-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
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
              <div className="flex-1 min-w-0">
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
