'use client'

import { useState } from 'react'
import type { Business, LoyaltyCard, Customer } from '@/lib/types'
import { urlBase64ToUint8Array } from './utils'

interface ProfileTabProps {
  card: LoyaltyCard & { customers: Customer | null }
  business: Business
  cardToken: string
  color: string
}

export default function ProfileTab({ card, business, cardToken, color }: ProfileTabProps) {
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState(card.customers?.email || '')
  const [birthday, setBirthday] = useState((card as unknown as { birthday?: string }).birthday || '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const phone = card.customers?.phone || ''
  const firstName = card.customers?.first_name || ''

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/card/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Card-Token': cardToken },
        body: JSON.stringify({ cardId: card.id, email, birthday }),
      })
      if (res.ok) {
        setToast('Informations mises à jour')
        setEditing(false)
        setTimeout(() => setToast(null), 3000)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  async function handleEnablePush() {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, subscription: subscription.toJSON() }),
      })

      // Force re-render by triggering state
      setToast('Notifications activées')
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      console.error('Push subscription error:', err)
    }
  }

  function handleLogout() {
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/'
  }

  const notificationStatus = typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'default'

  const mailtoHref = `mailto:ebellafrancis@gmail.com?subject=Demande%20de%20suppression%20RGPD&body=Bonjour,%0A%0AJe%20souhaite%20la%20suppression%20de%20mes%20donn%C3%A9es%20personnelles.%0A%0AMon%20t%C3%A9l%C3%A9phone%20:%20${encodeURIComponent(phone)}%0AMon%20pr%C3%A9nom%20:%20${encodeURIComponent(firstName)}`

  return (
    <div className="-mt-4 space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-60 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold"
        >
          {toast}
        </div>
      )}

      {/* Section 1: Mes informations */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Mes informations</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Prénom</span>
            <span className="text-gray-900 font-medium">{firstName || 'Non renseigné'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Téléphone</span>
            <span className="text-gray-900 font-medium">{phone || 'Non renseigné'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900 font-medium">{card.customers?.email || 'Non renseigné'}</span>
          </div>
        </div>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="mt-4 text-sm font-semibold px-4 py-2 rounded-xl text-white"
            style={{ backgroundColor: color }}
          >
            Modifier
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{ focusRingColor: color } as React.CSSProperties}
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date d&apos;anniversaire</label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm font-semibold px-4 py-2 rounded-xl text-white disabled:opacity-50"
                style={{ backgroundColor: color }}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm font-medium px-4 py-2 rounded-xl text-gray-500 border border-gray-200"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Notifications */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>

        {notificationStatus === 'granted' && (
          <p className="text-sm text-green-600 font-medium">Notifications activées &#x2705;</p>
        )}
        {notificationStatus === 'denied' && (
          <p className="text-sm text-gray-500">
            Notifications bloquées. Pour les réactiver, modifiez les permissions dans les paramètres de votre navigateur.
          </p>
        )}
        {notificationStatus === 'default' && (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Recevez des notifications pour vos récompenses et offres spéciales.
            </p>
            <button
              onClick={handleEnablePush}
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
              style={{ backgroundColor: color }}
            >
              Activer les notifications
            </button>
          </div>
        )}
      </div>

      {/* Section 3: Informations légales */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Informations légales</h3>
        <div className="space-y-2 text-sm">
          <a href="/privacy" target="_blank" className="block text-gray-600 hover:underline" style={{ color }}>
            Politique de confidentialité
          </a>
          <a href="/terms" target="_blank" className="block text-gray-600 hover:underline" style={{ color }}>
            Conditions d&apos;utilisation
          </a>
          <a href="/legal" target="_blank" className="block text-gray-600 hover:underline" style={{ color }}>
            Mentions légales
          </a>
        </div>
      </div>

      {/* Section 4: Mon compte (zone danger) */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-5">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Se déconnecter</h3>
          <p className="text-sm text-gray-500 mb-3">
            Vous pourrez retrouver votre carte avec votre numéro de téléphone.
          </p>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Se déconnecter
          </button>
        </div>

        <div className="border-t border-red-100 pt-5">
          <h3 className="font-semibold text-gray-900 mb-2">Supprimer mes données</h3>
          <p className="text-sm text-gray-500 mb-3">
            Pour demander la suppression de vos données personnelles conformément au RGPD,
            contactez-nous à ebellafrancis@gmail.com ou demandez au commerçant de supprimer
            votre carte depuis son tableau de bord.
          </p>
          <a
            href={mailtoHref}
            className="inline-block text-sm font-semibold px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-100 transition-colors"
          >
            Envoyer un email
          </a>
        </div>
      </div>
    </div>
  )
}
