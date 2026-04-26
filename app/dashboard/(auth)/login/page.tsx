'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthLayout from '../AuthLayout'
import { Input } from '@/components/ui/base/input/input'
import { PasswordInput } from '@/components/ui/base/input/password-input'
import { Button } from '@/components/ui/base/buttons/button'
import { Checkbox } from '@/components/ui/base/checkbox/checkbox'
import { PUBLIC_ASSETS } from '@/lib/assets'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (signInError) {
      setError("Email ou mot de passe incorrect.")
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthLayout
      rightPanel={{
        src: PUBLIC_ASSETS.auth.balloons,
        alt: 'Illustration Izou',
      }}
    >
      <div className="space-y-2 mb-8">
        <h1 className="text-display-xs font-semibold text-primary">Connexion</h1>
        <p className="text-md text-tertiary">
          Content de vous revoir ! Connectez-vous à votre espace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-md bg-error-secondary border border-error text-error-primary px-4 py-3 text-sm">
            {error}
          </div>
        )}

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
          placeholder="••••••••"
          size="md"
          value={password}
          onChange={setPassword}
          isRequired
        />

        <div className="flex items-center justify-between">
          <Checkbox
            size="sm"
            label="Se souvenir de moi"
            isSelected={rememberMe}
            onChange={setRememberMe}
          />
          <Link
            href="/dashboard/forgot-password"
            className="text-sm font-semibold text-brand-secondary hover:text-brand-secondary_hover transition-colors"
          >
            Mot de passe oublié
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          color="primary"
          isDisabled={loading}
          className="w-full"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </Button>

        <p className="text-center text-sm text-tertiary">
          Pas encore de compte ?{' '}
          <Link
            href="/dashboard/register"
            className="font-semibold text-brand-secondary hover:text-brand-secondary_hover transition-colors"
          >
            S&apos;inscrire
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
