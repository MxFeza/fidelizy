'use client'

/**
 * /me/MeLoginClient — Login + register direct client (Story 4.10.a).
 *
 * 3 modes :
 *  - 'login'    (default) : entrer phone → reçoit OTP par email → /me cards
 *  - 'register' : creer un nouveau compte (first_name + phone + email)
 *  - 'needs_customer' : auth.users existe mais pas de customer en DB
 *                       (bascule en register pour combler)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OTPInput from '@/app/components/OTPInput'
import Link from 'next/link'

interface MeLoginClientProps {
  mode?: 'login' | 'needs_customer'
  initialEmail?: string
}

type Step = 'login' | 'register' | 'otp'

export default function MeLoginClient({ mode = 'login', initialEmail }: MeLoginClientProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(mode === 'needs_customer' ? 'register' : 'login')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(initialEmail ?? '')
  const [firstName, setFirstName] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (phone.trim().length < 6) {
      setError('Veuillez entrer un numéro de téléphone valide.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Erreur. Veuillez réessayer.')
        return
      }
      if (data.status === 'not_found') {
        setError('Aucun compte trouvé avec ce numéro. Inscrivez-vous ci-dessous.')
        return
      }
      if (data.status === 'needs_email') {
        setError('Un email est requis pour ce compte. Contactez le support.')
        return
      }
      if (data.status === 'otp_sent') {
        setMaskedEmail(data.maskedEmail ?? '')
        setStep('otp')
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!firstName.trim()) { setError('Prénom requis.'); return }
    if (phone.trim().length < 6) { setError('Numéro de téléphone valide requis.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Email valide requis.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName.trim(), phone: phone.trim(), email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Erreur lors de la création du compte.')
        return
      }
      if (data.status === 'already_exists' || data.status === 'otp_sent') {
        setMaskedEmail(data.maskedEmail ?? '')
        if (data.phone) setPhone(data.phone)
        setStep('otp')
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOTP(token: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Erreur de vérification.')
        return
      }
      if (data.status === 'verified') {
        router.push('/me')
        router.refresh()
        return
      }
      setError('Code invalide. Veuillez réessayer.')
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Logo + tagline */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-solid rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Izou</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {step === 'register' ? 'Créez votre compte client' : step === 'otp' ? 'Vérification' : 'Accédez à toutes vos cartes fidélité'}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-7">
          {step === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError('') }}
                  placeholder="06 00 00 00 00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-solid focus:border-transparent"
                />
                {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading || phone.trim().length < 6}
                className="w-full bg-brand-solid hover:bg-brand-solid_hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl transition-colors text-sm"
              >
                {loading ? 'Recherche...' : 'Recevoir le code →'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('register'); setError('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors mt-2"
              >
                Pas encore de compte ? <span className="text-brand-secondary font-semibold">Créer mon compte</span>
              </button>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setError('') }}
                  placeholder="Votre prénom"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-solid focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError('') }}
                  placeholder="06 00 00 00 00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-solid focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-solid focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">Le code de vérification y sera envoyé.</p>
              </div>
              {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-solid hover:bg-brand-solid_hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl transition-colors text-sm"
              >
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('login'); setError('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors mt-2"
              >
                ← J&apos;ai déjà un compte
              </button>
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Entrez le code reçu par email{maskedEmail ? ` (${maskedEmail})` : ''}
              </p>
              <OTPInput onComplete={handleOTP} disabled={loading} />
              {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
              {loading && <p className="text-brand-secondary text-xs text-center font-medium">Vérification…</p>}
              <button
                type="button"
                onClick={() => { setStep('login'); setError('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Retour
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/dashboard/login" className="text-brand-secondary font-medium hover:underline">
            Vous êtes commerçant ? →
          </Link>
        </p>
      </div>
    </div>
  )
}
