'use client'

import { useState } from 'react'
import QrCodeDisplay from '@/app/components/QrCodeDisplay'

interface Business {
  id: string
  business_name: string
  primary_color: string
  loyalty_type: string
}

interface JoinFormProps {
  business: Business
}

export default function JoinForm({ business }: JoinFormProps) {
  const [firstName, setFirstName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrCodeId, setQrCodeId] = useState<string | null>(null)
  const [cardId, setCardId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: business.id, firstName, phone }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erreur lors de la création de la carte. Veuillez réessayer.')
      setLoading(false)
      return
    }

    setQrCodeId(data.qrCodeId)
    setCardId(data.cardId)
    setLoading(false)
  }

  // Success state — show QR code
  if (qrCodeId && cardId) {
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">Votre carte est prête !</h2>
          <p className="text-gray-500 text-sm mt-1">
            Présentez ce QR code à chaque visite chez {business.business_name}
          </p>
        </div>

        <div className="flex justify-center py-2">
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <QrCodeDisplay value={qrCodeId} size={200} />
          </div>
        </div>

        <a
          href={`/card/${qrCodeId}`}
          className="block w-full text-center text-sm font-medium py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Voir ma carte de fidélité →
        </a>
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
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
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
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
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
        Votre numéro est utilisé uniquement pour identifier votre carte.
      </p>
    </form>
  )
}
