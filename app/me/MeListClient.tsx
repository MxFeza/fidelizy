'use client'

/**
 * /me/MeListClient — Liste cartes Netflix-style (Story 4.10.a).
 *
 * Affiche toutes les cartes du client connecte. Tap → ouvre la carte dediee.
 * Bouton "+ Ajouter une carte" → /me/add (Story 4.10.b a venir).
 */

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus, LogOut01, Building02, CreditCard02, X as XIcon, AlertCircle, CheckDone01, QrCode02, User01 } from '@untitledui/icons'
import { Emoji } from '@/lib/emojis'
import { createClient } from '@/lib/supabase/client'
import FeedbackBubbleClient from '@/components/client/FeedbackBubbleClient'

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
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [shortCode, setShortCode] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addInfo, setAddInfo] = useState('')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/me')
    router.refresh()
  }

  function openAddSheet() {
    setShowAddSheet(true)
    setShortCode('')
    setAddError('')
    setAddInfo('')
  }

  function closeAddSheet() {
    if (adding) return
    setShowAddSheet(false)
  }

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setAddInfo('')
    const trimmed = shortCode.trim().toUpperCase()
    if (trimmed.length < 4) {
      setAddError('Code commerçant invalide.')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/me/add-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_code: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAddError(data?.error || 'Erreur lors de l\'ajout de la carte.')
        return
      }
      if (data.status === 'created') {
        router.push(`/card/${data.qr_code_id}`)
        return
      }
      if (data.status === 'already_exists' && data.qr_code_id) {
        setAddInfo(data.message || 'Carte déjà existante. Redirection…')
        setTimeout(() => router.push(`/card/${data.qr_code_id}`), 1200)
        return
      }
      setAddError('Réponse inattendue du serveur.')
    } catch {
      setAddError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto h-14 px-4 flex items-center justify-between">
          <Image src="/izou-logo.svg" alt="Izou" width={84} height={20} priority />
          <div className="flex items-center gap-1">
            <Link
              href="/me/profile"
              aria-label="Mon profil"
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <User01 className="size-5" aria-hidden="true" />
            </Link>
            <button
              onClick={handleLogout}
              aria-label="Se déconnecter"
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <LogOut01 className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
            <span>Bonjour {customer.first_name}</span>
            <Emoji name="wave" size={26} />
          </h1>
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
              const color = biz.primary_color || '#1E1E1E'
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

        {/* CTAs — Scanner (primaire) + Ajouter via code court (secondaire) */}
        <div className="mt-4 space-y-2">
          <Link
            href="/scan"
            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-brand-solid hover:bg-brand-solid_hover text-white transition-colors text-sm font-semibold"
          >
            <QrCode02 className="size-5" aria-hidden="true" />
            Scanner un QR code
          </Link>
          <button
            type="button"
            onClick={openAddSheet}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border-2 border-dashed border-gray-300 text-brand-secondary hover:border-brand-secondary hover:bg-brand-secondary/5 transition-colors text-sm font-semibold"
          >
            <Plus className="size-5" aria-hidden="true" />
            Ajouter via un code commerçant
          </button>
        </div>

        <footer className="mt-8 text-center text-[11px] text-gray-400 space-x-2">
          <Link href="/privacy" className="hover:text-gray-600 underline">Confidentialité</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-gray-600 underline">CGU</Link>
          <span>·</span>
          <Link href="/legal" className="hover:text-gray-600 underline">Mentions légales</Link>
        </footer>
      </main>

      {/* Bottom-sheet : ajouter une carte par code court commerçant */}
      {showAddSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={closeAddSheet}
        >
          <div
            className="w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Ajouter une carte</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Entrez le code à 6 caractères affiché chez votre commerçant.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddSheet}
                aria-label="Fermer"
                disabled={adding}
                className="size-9 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-400 disabled:opacity-50"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label htmlFor="shortCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Code commerçant
                </label>
                <input
                  id="shortCode"
                  type="text"
                  value={shortCode}
                  onChange={(e) => { setShortCode(e.target.value.toUpperCase()); setAddError('') }}
                  placeholder="XXXXXX"
                  maxLength={8}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-lg font-mono tracking-[0.4em] text-center bg-white text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-brand-solid uppercase"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-center">
                  Demandez le code à votre commerçant ou trouvez-le sur l&apos;affiche en magasin.
                </p>
              </div>

              {addError && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 text-red-700 text-sm">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="font-medium">{addError}</p>
                </div>
              )}

              {addInfo && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-green-50 text-green-700 text-sm">
                  <CheckDone01 className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="font-medium">{addInfo}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeAddSheet}
                  disabled={adding}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={adding || shortCode.trim().length < 4}
                  className="flex-1 rounded-xl bg-brand-solid hover:bg-brand-solid_hover px-4 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'Ajout en cours…' : 'Ajouter ma carte'}
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-400 mt-4 text-center">
              Vous pouvez aussi <Link href="/scan" className="text-brand-secondary font-semibold underline">scanner directement le QR code</Link> du commerçant.
            </p>
          </div>
        </div>
      )}

      <FeedbackBubbleClient />
    </div>
  )
}
