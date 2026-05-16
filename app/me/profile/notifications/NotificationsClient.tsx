'use client'

import { useState } from 'react'
import { Toggle } from '@/components/ui/base/toggle/toggle'
import SubScreenLayout, { Section } from '@/components/client/profile/SubScreenLayout'
import { useToast } from '@/components/client/ToastContainer'
import type { NotificationPrefs } from '@/lib/types'

const TYPE_PREFS: Array<{ key: keyof NotificationPrefs; label: string; hint?: string }> = [
  { key: 'stamps_enabled', label: 'Nouveau tampon ajouté' },
  { key: 'rewards_enabled', label: 'Récompense disponible' },
  { key: 'campaigns_enabled', label: 'Campagnes du commerçant' },
  { key: 'referrals_enabled', label: 'Parrainage (nouveau filleul)' },
]

interface NotificationsClientProps {
  initialPrefs: NotificationPrefs
  cardId: string | null
}

export default function NotificationsClient({ initialPrefs, cardId }: NotificationsClientProps) {
  const { toast, showToast } = useToast()
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs)
  const [savingKey, setSavingKey] = useState<keyof NotificationPrefs | null>(null)

  async function updatePref(key: keyof NotificationPrefs, value: boolean) {
    const previous = prefs[key]
    setPrefs((p) => ({ ...p, [key]: value }))
    setSavingKey(key)
    try {
      const res = await fetch('/api/me/notification-prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      if (!res.ok) {
        setPrefs((p) => ({ ...p, [key]: previous }))
        const body = await res.json().catch(() => null)
        showToast({ variant: 'error', title: 'Erreur', message: body?.error || 'Mise à jour impossible.' })
        return
      }
      showToast({ variant: 'success', title: 'Préférences enregistrées' })
    } catch {
      setPrefs((p) => ({ ...p, [key]: previous }))
      showToast({ variant: 'error', title: 'Une erreur est survenue', message: 'Veuillez réessayer.' })
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <SubScreenLayout title="Notifications" cardId={cardId} toast={toast}>
      <Section title="Général">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <Toggle
            label="Recevoir les notifications push"
            isSelected={prefs.push_enabled ?? true}
            isDisabled={savingKey === 'push_enabled'}
            onChange={(v) => updatePref('push_enabled', v)}
            size="md"
          />
        </div>
      </Section>

      <Section title="Types de notifications">
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {TYPE_PREFS.map(({ key, label }) => (
            <div key={key} className="px-4 py-4">
              <Toggle
                label={label}
                isSelected={prefs[key] ?? true}
                isDisabled={savingKey === key || prefs.push_enabled === false}
                onChange={(v) => updatePref(key, v)}
                size="md"
              />
            </div>
          ))}
        </div>
      </Section>
    </SubScreenLayout>
  )
}
