'use client'

/**
 * /me/MeListClient — Liste cartes Netflix-style (Story 4.10.a).
 *
 * Affiche toutes les cartes du client connecte. Tap → ouvre la carte dediee.
 * Bouton "+ Ajouter une carte" → /me/add (Story 4.10.b a venir).
 */

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus, LogOut01, Building02, CreditCard02 } from '@untitledui/icons'
import { createClient } from '@/lib/supabase/client'

interface Customer {
  id: string
  first_name: string
  email: string | null
  phone: string | null
}

interface Business {
  business_name: string
  logo_url: string | null
  primary_color: string | null
  loyalty_type: string
  stamps_required: number | null
}

interface Card {
  id: string
  qr_code_id: string
  current_stamps: number | null
  current_points: number | null
  businesses: Business | null
}

interface MeListClientProps {
  customer: Customer
  cards: Card[]
}

export default function MeListClient({ customer, cards }: MeListClientProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/me')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto h-14 px-4 flex items-center justify-between">
          <Image src="/izou-logo.svg" alt="Izou" width={84} height={20} priority />
          <button
            onClick={handleLogout}
            aria-label="Se déconnecter"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut01 className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bonjour {customer.first_name} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">
            {cards.length === 0
              ? 'Aucune carte pour l\'instant. Ajoutez votre première carte fidélité.'
              : cards.length === 1
                ? 'Voici votre carte de fidélité.'
                : `Vous avez ${cards.length} cartes de fidélité.`}
          </p>
        </div>

        {/* Cards list */}
        {cards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-brand-secondary/10 flex items-center justify-center mb-4">
              <CreditCard02 className="size-7 text-brand-secondary" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Aucune carte fidélité</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Scannez le QR code d&apos;un commerçant Izou ou ajoutez une carte avec son code commerçant
              pour commencer à cumuler des récompenses.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {cards.map((card) => {
              const biz = card.businesses
              if (!biz) return null
              const color = biz.primary_color || '#7F56D9'
              const isStamps = biz.loyalty_type === 'stamps'
              const stampsRequired = biz.stamps_required ?? 10
              const progress = isStamps
                ? `${Math.min(card.current_stamps ?? 0, stampsRequired)}/${stampsRequired} tampons`
                : `${card.current_points ?? 0} points`

              return (
                <li key={card.id}>
                  <Link
                    href={`/card/${card.qr_code_id}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
                  >
                    <div
                      className="size-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      {biz.logo_url ? (
                        <Image
                          src={biz.logo_url}
                          alt=""
                          width={48}
                          height={48}
                          className="size-12 object-contain"
                        />
                      ) : (
                        <Building02 className="size-6" style={{ color }} aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-base truncate">{biz.business_name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{progress}</p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-300 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {/* Add card CTA — Story 4.10.b a venir */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Ajout via code commerçant : disponible très bientôt"
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors text-sm font-semibold cursor-not-allowed opacity-60"
        >
          <Plus className="size-5" aria-hidden="true" />
          Ajouter une carte (bientôt — code commerçant ou scan QR)
        </button>

        <footer className="mt-8 text-center text-[11px] text-gray-400 space-x-2">
          <Link href="/privacy" className="hover:text-gray-600 underline">Confidentialité</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-gray-600 underline">CGU</Link>
          <span>·</span>
          <Link href="/legal" className="hover:text-gray-600 underline">Mentions légales</Link>
        </footer>
      </main>
    </div>
  )
}
