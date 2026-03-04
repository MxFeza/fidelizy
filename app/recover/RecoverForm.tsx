'use client'

import { useState } from 'react'
import Link from 'next/link'
import OTPInput from '@/app/components/OTPInput'

interface Card {
  qr_code_id: string
  current_stamps: number
  current_points: number
  businesses: {
    business_name: string
    loyalty_type: string
    stamps_required: number
    primary_color: string
  }
}

type Step = 'phone' | 'email' | 'otp' | 'cards'

export default function RecoverForm() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [error, setError] = useState('')

  async function handlePhone(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = phone.trim()
    if (trimmed.length < 6) {
      setError('Veuillez entrer un numéro de téléphone valide.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur. Veuillez réessayer.')
        setLoading(false)
        return
      }

      if (data.status === 'not_found') {
        setError('Aucun compte trouvé avec ce numéro.')
        setLoading(false)
        return
      }

      if (data.status === 'needs_email') {
        setStep('email')
        setLoading(false)
        return
      }

      if (data.status === 'otp_sent') {
        setEmail(data.email)
        setMaskedEmail(data.maskedEmail)
        setStep('otp')
        setLoading(false)
        return
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    }
    setLoading(false)
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Veuillez entrer un email valide.')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/add-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim(), email: trimmed }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erreur. Veuillez réessayer.')
      setLoading(false)
      return
    }

    if (data.status === 'otp_sent') {
      setStep('otp')
      setLoading(false)
    }
  }

  async function handleOTP(token: string) {
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), token }),
    })

    const data = await res.json()

    if (data.status === 'invalid') {
      setError('Code invalide. Veuillez réessayer.')
      setLoading(false)
      return
    }

    if (data.status === 'verified') {
      setCards(data.cards ?? [])
      setStep('cards')
      setLoading(false)
      return
    }
  }

  function renderStep() {
    switch (step) {
      case 'phone':
        return (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Votre numéro de téléphone</h2>
            <p className="text-sm text-gray-400 mb-6">
              Le numéro utilisé lors de votre inscription
            </p>

            <form onSubmit={handlePhone} className="space-y-4">
              <div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setError('')
                  }}
                  placeholder="06 00 00 00 00"
                  className="w-full text-center text-lg font-medium tracking-wider px-4 py-4 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-400"
                />
                {error && (
                  <p className="text-red-500 text-xs mt-2 text-center font-medium">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || phone.trim().length < 6}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl transition-colors text-sm shadow-sm shadow-indigo-200"
              >
                {loading ? 'Recherche...' : 'Continuer →'}
              </button>
            </form>
          </>
        )

      case 'email':
        return (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Ajoutez votre email</h2>
            <p className="text-sm text-gray-400 mb-6">
              Pour sécuriser votre compte, nous avons besoin de votre adresse email
            </p>

            <form onSubmit={handleEmail} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="votre@email.com"
                  autoFocus
                  className="w-full text-center text-lg font-medium px-4 py-4 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-400"
                />
                {error && (
                  <p className="text-red-500 text-xs mt-2 text-center font-medium">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl transition-colors text-sm shadow-sm shadow-indigo-200"
              >
                {loading ? 'Envoi…' : 'Recevoir le code →'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setError('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Retour
              </button>
            </form>
          </>
        )

      case 'otp':
        return (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Vérification</h2>
            <p className="text-sm text-gray-400 mb-6">
              Entrez le code reçu par email{maskedEmail ? ` (${maskedEmail})` : ''}
            </p>

            <div className="space-y-4">
              <OTPInput onComplete={handleOTP} disabled={loading} />
              {error && (
                <p className="text-red-500 text-xs text-center font-medium">{error}</p>
              )}
              {loading && (
                <p className="text-indigo-600 text-xs text-center font-medium">Vérification…</p>
              )}

              <button
                type="button"
                onClick={() => { setStep('phone'); setError('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Retour
              </button>
            </div>
          </>
        )

      case 'cards':
        return (
          <>
            {cards.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">Aucune carte trouvée.</p>
                <p className="text-gray-400 text-xs mt-1">
                  Inscrivez-vous chez votre commerçant pour obtenir une carte.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-600">
                  {cards.length === 1 ? 'Votre carte :' : `Vos ${cards.length} cartes :`}
                </p>
                {cards.map((card) => {
                  const biz = card.businesses
                  const color = biz.primary_color || '#4f46e5'
                  const isStamps = biz.loyalty_type === 'stamps'
                  const progress = isStamps
                    ? `${Math.min(card.current_stamps, biz.stamps_required)}/${biz.stamps_required} tampons`
                    : `${card.current_points} points`

                  return (
                    <Link
                      key={card.qr_code_id}
                      href={`/card/${card.qr_code_id}`}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <svg
                          className="w-5 h-5"
                          style={{ color }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {biz.business_name}
                        </p>
                        <p className="text-xs text-gray-400">{progress}</p>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-300 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
          <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-gray-900">Fidelizy</h1>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          Retrouvez votre carte de fidélité
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
        {renderStep()}
      </div>

      {/* Back link */}
      <p className="text-center text-xs text-gray-400 mt-6">
        <Link href="/" className="text-indigo-600 font-medium hover:underline">
          ← Retour à l&apos;accueil
        </Link>
      </p>
    </div>
  )
}
