'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Heart, Star01, Sun, Lightning01, Scissors01, Stars02 } from '@untitledui/icons'
import type { FC, HTMLAttributes } from 'react'
import AuthLayout from '../AuthLayout'
import { Button } from '@/components/ui/base/buttons/button'
import { cx } from '@/utils/cx'
import { PUBLIC_ASSETS } from '@/lib/assets'

type BusinessType = 'cafe' | 'restaurant' | 'bakery' | 'snack' | 'hair' | 'nails'

interface TypeOption {
  id: BusinessType
  icon: FC<HTMLAttributes<HTMLOrSVGElement>>
  title: string
  subtitle: string
  defaultReward: string
}

const options: TypeOption[] = [
  {
    id: 'cafe',
    icon: Heart,
    title: 'Café',
    subtitle: 'Coffee shop, salon de thé, bar à jus...',
    defaultReward: 'Boisson offerte',
  },
  {
    id: 'restaurant',
    icon: Star01,
    title: 'Restaurant',
    subtitle: 'Restaurant, brasserie, pizzeria, traiteur...',
    defaultReward: 'Dessert offert',
  },
  {
    id: 'bakery',
    icon: Sun,
    title: 'Boulangerie',
    subtitle: 'Boulangerie, pâtisserie, viennoiserie...',
    defaultReward: 'Pain offert',
  },
  {
    id: 'snack',
    icon: Lightning01,
    title: 'Snack & Fast-food',
    subtitle: 'Burger, tacos, kebab, poké bowl...',
    defaultReward: 'Menu offert',
  },
  {
    id: 'hair',
    icon: Scissors01,
    title: 'Coiffure',
    subtitle: 'Salon de coiffure, barbier...',
    defaultReward: 'Shampoing offert',
  },
  {
    id: 'nails',
    icon: Stars02,
    title: 'Onglerie & Beauté',
    subtitle: 'Prothésiste ongulaire, esthétique, soins...',
    defaultReward: 'Pose offerte',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<BusinessType>('cafe')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleContinue() {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/dashboard/login')
      return
    }

    const option = options.find((o) => o.id === selected)!

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        business_type: option.id,
        stamps_reward: option.defaultReward,
      })
      .eq('id', user.id)

    if (updateError) {
      setError('Impossible de sauvegarder. Réessayez.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <AuthLayout
      rightPanel={{
        src: PUBLIC_ASSETS.auth.cardPocket,
        alt: 'Carte de fidélité dans une poche',
      }}
      hideFooter
    >
      <div className="space-y-3 mb-8">
        <h1 className="text-display-sm sm:text-display-md font-semibold text-primary tracking-tight">
          Quel est votre commerce&nbsp;?
        </h1>
        <p className="text-md text-tertiary">
          Votre choix nous permet de pré-configurer vos templates marketing, votre récompense par défaut
          et l&apos;apparence de votre carte de fidélité — vous pourrez tout personnaliser plus tard.
        </p>
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const isActive = selected === option.id
          const Icon = option.icon

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelected(option.id)}
              className={cx(
                'w-full flex items-start gap-3 rounded-lg border p-4 text-left transition-colors duration-100 ease-linear outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2',
                isActive
                  ? 'border-brand bg-brand-secondary'
                  : 'border-secondary bg-primary hover:bg-primary_hover',
              )}
            >
              <div className={cx(
                'shrink-0 flex items-center justify-center size-10 rounded-full',
                isActive ? 'bg-brand-primary' : 'bg-brand-primary',
              )}>
                <Icon className="size-5 text-fg-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cx(
                  'text-sm font-semibold',
                  isActive ? 'text-brand-secondary' : 'text-primary',
                )}>
                  {option.title}
                </p>
                <p className={cx(
                  'text-sm mt-0.5',
                  isActive ? 'text-brand-secondary' : 'text-tertiary',
                )}>
                  {option.subtitle}
                </p>
              </div>
              <div className={cx(
                'shrink-0 flex items-center justify-center size-5 rounded-full border-2 transition-colors',
                isActive ? 'bg-brand-solid border-brand-solid' : 'border-secondary bg-primary',
              )}>
                {isActive && (
                  <svg className="size-3 text-white" viewBox="0 0 14 14" fill="none">
                    <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-error-secondary border border-error text-error-primary px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="mt-8">
        <Button
          size="lg"
          color="primary"
          isDisabled={loading}
          onClick={handleContinue}
        >
          {loading ? 'Enregistrement...' : 'Continuer'}
        </Button>
      </div>
    </AuthLayout>
  )
}
