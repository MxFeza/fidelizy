'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import LoyaltyCardVisual from '@/components/dashboard/LoyaltyCardVisual'
import SubScreenLayout from '@/components/client/profile/SubScreenLayout'
import { useToast } from '@/components/client/ToastContainer'
import type { CardColor } from '@/lib/types'
import { cx } from '@/utils/cx'

const COLOR_OPTIONS: Array<{ value: CardColor | null; label: string; hex: string }> = [
  { value: null, label: 'Noir', hex: '#0F172A' },
  { value: 'violet', label: 'Violet', hex: '#7F56D9' },
  { value: 'orange', label: 'Orange', hex: '#F79009' },
  { value: 'jaune', label: 'Jaune', hex: '#FAC515' },
  { value: 'corail', label: 'Corail', hex: '#F97066' },
  { value: 'vert', label: 'Vert', hex: '#17B26A' },
]

interface CardCustomizationClientProps {
  cardId: string | null
  customerName: string
  initialColor: CardColor | null
  preview: {
    loyaltyType: 'stamps' | 'points'
    currentStamps: number
    stampsRequired: number
    currentPoints: number
    businessLogoUrl: string | null
    cardImageUrl: string | null
  }
}

export default function CardCustomizationClient({
  cardId,
  customerName,
  initialColor,
  preview,
}: CardCustomizationClientProps) {
  const router = useRouter()
  const { toast, showToast } = useToast()
  const [selected, setSelected] = useState<CardColor | null>(initialColor)
  const [saving, setSaving] = useState(false)

  const dirty = selected !== initialColor

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/me/card-color', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: selected }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        showToast({ variant: 'error', title: 'Erreur', message: body?.error || 'Mise à jour impossible.' })
        return
      }
      showToast({ variant: 'success', title: 'Couleur enregistrée', message: 'Votre carte a été mise à jour.' })
      router.refresh()
    } catch {
      showToast({ variant: 'error', title: 'Une erreur est survenue', message: 'Veuillez réessayer.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SubScreenLayout title="Personnaliser ma carte" cardId={cardId} toast={toast}>
      <p className="text-sm text-gray-600 leading-relaxed">
        Choisissez la couleur de votre carte fidélité. Elle apparaîtra partout où votre carte est visible.
      </p>

      <div>
        <LoyaltyCardVisual
          customerName={customerName}
          loyaltyType={preview.loyaltyType}
          currentStamps={preview.currentStamps}
          stampsRequired={preview.stampsRequired}
          currentPoints={preview.currentPoints}
          businessLogoUrl={preview.businessLogoUrl}
          cardImageUrl={preview.cardImageUrl}
          cardColor={selected ?? undefined}
          withGradientBackground={false}
        />
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-3">Couleurs</p>
        <ul className="flex flex-wrap gap-3" role="radiogroup" aria-label="Couleur de la carte">
          {COLOR_OPTIONS.map(({ value, label, hex }) => {
            const active = selected === value
            return (
              <li key={value ?? 'noir'}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={label}
                  onClick={() => setSelected(value)}
                  disabled={saving}
                  className={cx(
                    'relative size-12 rounded-full transition-all ring-offset-2 ring-offset-white',
                    active ? 'ring-2 ring-gray-900' : 'ring-1 ring-gray-200 hover:ring-gray-300',
                    saving && 'opacity-50 cursor-not-allowed',
                  )}
                  style={{ backgroundColor: hex }}
                >
                  {active ? (
                    <Check
                      className={cx(
                        'absolute inset-0 m-auto size-5',
                        value === 'jaune' ? 'text-gray-900' : 'text-white',
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="flex justify-end pt-2">
        <Button
          color="primary"
          size="md"
          onClick={handleSave}
          isLoading={saving}
          isDisabled={saving || !dirty}
        >
          Enregistrer
        </Button>
      </div>
    </SubScreenLayout>
  )
}
