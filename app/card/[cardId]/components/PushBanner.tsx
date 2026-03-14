'use client'

import { urlBase64ToUint8Array } from './utils'

interface PushBannerProps {
  cardId: string
  showPushBanner: boolean
  onDismiss: () => void
  color: string
}

export default function PushBanner({ cardId, showPushBanner, onDismiss, color }: PushBannerProps) {
  if (!showPushBanner) return null

  async function handleEnablePush() {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        onDismiss()
        return
      }

      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('VAPID public key not configured')
        onDismiss()
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          subscription: subscription.toJSON(),
        }),
      })

      onDismiss()
    } catch (err) {
      console.error('Push subscription error:', err)
      onDismiss()
    }
  }

  function handleDismissPush() {
    localStorage.setItem('fidelizy_push_dismissed', '1')
    onDismiss()
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 flex items-start gap-3">
      <span className="text-2xl shrink-0">🔔</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Notifications</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Recevez des notifications pour vos récompenses
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDismissPush}
          className="text-xs text-gray-400 hover:text-gray-600 font-medium px-2 py-1.5"
        >
          Plus tard
        </button>
        <button
          onClick={handleEnablePush}
          className="text-xs text-white font-semibold px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: color }}
        >
          Activer
        </button>
      </div>
    </div>
  )
}
