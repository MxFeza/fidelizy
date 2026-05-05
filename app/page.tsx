import Link from 'next/link'
import Image from 'next/image'
import { Building02, CreditCard02, ArrowRight } from '@untitledui/icons'

export const metadata = {
  title: 'Izou — Cartes de fidélité digitales',
}

/**
 * Home / — Page d'accueil avec 2 espaces : commercant et client.
 *
 * En production future, les 2 espaces seront sur des subdomains
 * differents. Pendant les phases de dev/test, cette home sert de
 * point d'entree unique vers /dashboard/login (commercant) et /me
 * (client).
 *
 * Decision user 2026-05-01.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          {/* Logo + tagline */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-brand-solid rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h1 className="text-4xl font-black text-gray-900">Izou</h1>
            <p className="text-gray-500 mt-2 text-sm">
              La fidélité digitale, simple et premium.
            </p>
          </div>

          {/* 2 cards : commerçant + client */}
          <div className="space-y-3">
            <Link
              href="/dashboard/login"
              className="group flex items-center gap-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-brand-secondary/40 p-5"
            >
              <div className="size-12 rounded-xl bg-brand-solid flex items-center justify-center shrink-0">
                <Building02 className="size-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base">Je suis commerçant</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gérer mon programme et mes clients
                </p>
              </div>
              <ArrowRight className="size-5 text-gray-400 shrink-0 group-hover:text-brand-secondary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
            </Link>

            <Link
              href="/me"
              className="group flex items-center gap-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-brand-secondary/40 p-5"
            >
              <div className="size-12 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                <CreditCard02 className="size-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base">Je suis client</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Accéder à mes cartes fidélité
                </p>
              </div>
              <ArrowRight className="size-5 text-gray-400 shrink-0 group-hover:text-brand-secondary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
            </Link>
          </div>

          {/* Helper text */}
          <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
            En phase de test, les deux espaces sont accessibles depuis cette page.
            <br />
            Une fois en production, ils auront des points d&apos;entrée distincts.
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-[11px] text-gray-400 space-x-2">
        <Link href="/privacy" className="hover:text-gray-600 underline">Confidentialité</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-gray-600 underline">CGU</Link>
        <span>·</span>
        <Link href="/legal" className="hover:text-gray-600 underline">Mentions légales</Link>
      </footer>
    </div>
  )
}
