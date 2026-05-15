'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthLayout from '../AuthLayout'
import { Input } from '@/components/ui/base/input/input'
import { PasswordInput } from '@/components/ui/base/input/password-input'
import { Button } from '@/components/ui/base/buttons/button'
import { PUBLIC_ASSETS } from '@/lib/assets'

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function RegisterPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Inscription reçue. Vérifiez votre email pour confirmer votre compte.')
      setLoading(false)
      return
    }

    const { error: businessError } = await supabase.from('businesses').insert({
      id: data.user.id,
      email: email.trim().toLowerCase(),
      business_name: businessName.trim(),
      primary_color: '#1E1E1E', // Noir DS Izou (uniforme sur tous les commerces — cf. feedback_da_izou_uniforme)
      loyalty_type: 'stamps',
      stamps_required: 10,
      stamps_reward: 'Cadeau au choix',
      points_per_euro: 1,
      short_code: generateShortCode(),
    })

    if (businessError) {
      setError('Erreur création du commerce : ' + businessError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/onboarding')
  }

  return (
    <AuthLayout
      rightPanel={{
        src: PUBLIC_ASSETS.auth.marieCap,
        alt: 'Marie Dupont, commercante utilisant Izou',
        testimonial: {
          quote: "Izou m'a permis de fidéliser mes clients en quelques jours. C'est simple, rapide, et mes clients adorent.",
          author: 'Marie Dupont',
          role: 'Gérante, Boulangerie du Marché — Villefranche-Sur-Saône',
        },
      }}
    >
      <div className="space-y-2 mb-8">
        <h1 className="text-display-xs font-semibold text-primary">Créer un compte</h1>
        <p className="text-md text-tertiary">
          Lancez votre programme de fidélité en 5 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-md bg-error-secondary border border-error text-error-primary px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Nom du commerce"
          placeholder="Ex: Café Parisien"
          size="md"
          value={businessName}
          onChange={setBusinessName}
          isRequired
        />

        <Input
          type="email"
          label="Email"
          placeholder="votre@email.com"
          size="md"
          value={email}
          onChange={setEmail}
          isRequired
        />

        <PasswordInput
          label="Mot de passe"
          placeholder="Créer un mot de passe"
          hint="8 caractères minimum."
          size="md"
          value={password}
          onChange={setPassword}
          isRequired
        />

        <Button
          type="submit"
          size="lg"
          color="primary"
          isDisabled={loading}
          className="w-full"
        >
          {loading ? 'Création en cours...' : 'Créer mon compte'}
        </Button>

        <p className="text-center text-sm text-tertiary">
          Déjà un compte ?{' '}
          <Link
            href="/dashboard/login"
            className="font-semibold text-brand-secondary hover:text-brand-secondary_hover transition-colors"
          >
            Se connecter
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
