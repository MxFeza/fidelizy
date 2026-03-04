'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OTPInput from '@/app/components/OTPInput'

type Step = 'code' | 'phone' | 'email' | 'otp'

export default function HomePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCode(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) {
      setError('Le code doit contenir 6 caractères.')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch(`/api/business?short_code=${trimmed}`)

    if (!res.ok) {
      setError('Code invalide. Vérifiez le code auprès du commerçant.')
      setLoading(false)
      return
    }

    const { id } = await res.json()
    setBusinessId(id)
    setStep('phone')
    setLoading(false)
  }

  async function handlePhone(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = phone.trim()
    if (trimmed.length < 6) {
      setError('Veuillez entrer un numéro de téléphone valide.')
      return
    }

    setLoading(true)
    setError('')

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
      router.push(`/join/${businessId}`)
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

    if (data.status === 'verified' && data.cards?.length > 0) {
      const card = data.cards[0]
      router.push(`/card/${card.qr_code_id}`)
      return
    }

    // Verified but no cards — redirect to join
    router.push(`/join/${businessId}`)
  }

  function renderStep() {
    switch (step) {
      case 'code':
        return (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Entrez le code du commerce</h2>
            <p className="text-sm text-gray-400 mb-6">
              6 caractères, disponible auprès du commerçant
            </p>

            <form onSubmit={handleCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().slice(0, 6))
                    setError('')
                  }}
                  placeholder="Ex: CAF3X9"
                  maxLength={6}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full text-center font-mono text-3xl font-bold tracking-[0.3em] uppercase px-4 py-4 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal placeholder:text-lg"
                />
                {error && (
                  <p className="text-red-500 text-xs mt-2 text-center font-medium">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || code.trim().length !== 6}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl transition-colors text-sm shadow-sm shadow-indigo-200"
              >
                {loading ? 'Recherche…' : 'Continuer →'}
              </button>
            </form>
          </>
        )

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
                  autoFocus
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
                {loading ? 'Vérification…' : 'Continuer →'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('code'); setError('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Retour
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
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-5">
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
            Rejoignez le programme de fidélité<br />de votre commerçant préféré
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          {renderStep()}
        </div>

        {/* Recover link */}
        <p className="text-center text-sm text-gray-500 mt-5">
          Déjà inscrit ?{' '}
          <a href="/recover" className="text-indigo-600 font-semibold hover:underline">
            Retrouvez votre carte
          </a>
        </p>

        {/* Merchant link */}
        <p className="text-center text-xs text-gray-400 mt-3">
          Vous êtes commerçant ?{' '}
          <a href="/dashboard" className="text-indigo-600 font-medium hover:underline">
            Accéder au tableau de bord
          </a>
        </p>
      </div>
    </div>
  )
}
