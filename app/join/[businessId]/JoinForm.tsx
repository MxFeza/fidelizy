'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OTPInput from '@/app/components/OTPInput'

interface Business {
  id: string
  business_name: string
  primary_color: string
  loyalty_type: string
}

interface JoinFormProps {
  business: Business
  initialReferralCode?: string
}

type Step = 'form' | 'otp'

export default function JoinForm({ business, initialReferralCode }: JoinFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [firstName, setFirstName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [referralCode, setReferralCode] = useState(initialReferralCode ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Veuillez entrer un email valide.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: business.id, firstName, phone, email: trimmedEmail, referral_code: referralCode.trim() || undefined }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erreur lors de la création de la carte. Veuillez réessayer.')
      setLoading(false)
      return
    }

    // Send OTP to the email
    const otpRes = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim() }),
    })

    const otpData = await otpRes.json()

    if (otpData.status === 'otp_sent') {
      setStep('otp')
    } else {
      // Fallback: redirect directly (OTP sending failed but card was created)
      router.push(`/card/${data.qrCodeId}`)
    }

    setLoading(false)
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
      router.push(`/card/${data.cards[0].qr_code_id}`)
      return
    }

    // Fallback
    setError('Erreur de vérification. Veuillez réessayer.')
    setLoading(false)
  }

  if (step === 'otp') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-5">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: `${business.primary_color}20` }}
        >
          <svg
            className="w-6 h-6"
            style={{ color: business.primary_color }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">Vérifiez votre email</h2>
          <p className="text-gray-500 text-sm mt-1">
            Entrez le code reçu à {email.trim().toLowerCase()}
          </p>
        </div>

        <OTPInput onComplete={handleOTP} disabled={loading} />

        {error && (
          <p className="text-red-500 text-xs font-medium">{error}</p>
        )}
        {loading && (
          <p className="text-indigo-600 text-xs font-medium">Vérification…</p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
      <h2 className="font-semibold text-gray-900 text-center">Rejoindre le programme</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          placeholder="Votre prénom"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': business.primary_color } as React.CSSProperties}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Numéro de téléphone
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="06 00 00 00 00"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': business.primary_color } as React.CSSProperties}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Adresse email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="votre@email.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': business.primary_color } as React.CSSProperties}
        />
        <p className="text-xs text-gray-400 mt-1">Utilisé pour sécuriser votre compte</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Code parrain <span className="text-gray-400 font-normal">(optionnel)</span>
        </label>
        <input
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          placeholder="XXXX-0000"
          maxLength={9}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent uppercase"
          style={{ '--tw-ring-color': business.primary_color } as React.CSSProperties}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full font-semibold py-3 px-4 rounded-xl transition-colors text-white text-sm disabled:opacity-60"
        style={{ backgroundColor: business.primary_color }}
      >
        {loading ? 'Création en cours...' : "Obtenir ma carte de fidélité"}
      </button>

      <p className="text-center text-xs text-gray-400">
        Un code de vérification sera envoyé à votre email.
      </p>
    </form>
  )
}
