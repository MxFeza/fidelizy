'use client'

import { Button } from '@/components/ui/base/buttons/button'
import { Emoji } from '@/lib/emojis'
import { urlBase64ToUint8Array } from './utils'

interface PushBannerProps {
  cardId: string
  showPushBanner: boolean
  onDismiss: () => void
  /** @deprecated couleur business, plus utilisée depuis l'audit CTA. */
  color?: string
}

export default function PushBanner({ cardId, showPushBanner, onDismiss }: PushBannerProps) {
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
      <Emoji name="bell" size={28} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Notifications</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Recevez des notifications pour vos récompenses
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" color="link-gray" onClick={handleDismissPush}>
          Plus tard
        </Button>
        <Button size="sm" color="primary" onClick={handleEnablePush}>
          Activer
        </Button>
      </div>
    </div>
  )
}
