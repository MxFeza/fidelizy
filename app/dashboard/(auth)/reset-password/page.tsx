'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthLayout from '../AuthLayout'
import { PasswordInput } from '@/components/ui/base/input/password-input'
import { Button } from '@/components/ui/base/buttons/button'
import { PUBLIC_ASSETS } from '@/lib/assets'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError("Impossible de mettre a jour le mot de passe. Le lien a peut-être expiré.")
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
        <h1 className="text-display-xs font-semibold text-primary">Nouveau mot de passe</h1>
        <p className="text-md text-tertiary">
          Choisissez un nouveau mot de passe sécurisé pour votre compte.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-md bg-error-secondary border border-error text-error-primary px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <PasswordInput
          label="Nouveau mot de passe"
          placeholder="••••••••"
          hint="8 caractères minimum."
          size="md"
          value={password}
          onChange={setPassword}
          isRequired
        />

        <PasswordInput
          label="Confirmer le mot de passe"
          placeholder="••••••••"
          size="md"
          value={confirm}
          onChange={setConfirm}
          isRequired
        />

        <Button
          type="submit"
          size="lg"
          color="primary"
          isDisabled={loading}
          className="w-full"
        >
          {loading ? 'Mise à jour...' : 'Mettre à jour'}
        </Button>

        <p className="text-center text-sm text-tertiary">
          <Link
            href="/dashboard/login"
            className="font-semibold text-brand-secondary hover:text-brand-secondary_hover"
          >
            Retour à la connexion
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
