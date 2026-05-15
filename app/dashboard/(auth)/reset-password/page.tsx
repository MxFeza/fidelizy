'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthLayout from '../AuthLayout'
import { PasswordInput } from '@/components/ui/base/input/password-input'
import { Button } from '@/components/ui/base/buttons/button'
import { PUBLIC_ASSETS } from '@/lib/assets'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // null = en cours de check, true = session active (PKCE echange OK), false = aucune session
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // Verifie qu'on a bien une session active a l'arrivee sur la page.
  // /auth/callback est cense avoir fait l'exchangeCodeForSession et set
  // le cookie de session avant de rediriger ici. Si la session manque,
  // c'est que le lien etait invalide ou que /auth/callback a echoue.
  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data, error: getErr }) => {
      if (cancelled) return
       
      setHasSession(!!data.user && !getErr)
    })
    return () => { cancelled = true }
  }, [supabase])

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
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError("Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré — demandez-en un nouveau.")
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  // Etat "session manquante" : lien expire ou jamais valide. On affiche un
  // message clair et un lien direct vers /forgot-password (au lieu d'afficher
  // le form qui echouerait silencieusement au submit).
  if (hasSession === false) {
    return (
      <AuthLayout
        rightPanel={{
          src: PUBLIC_ASSETS.auth.balloons,
          alt: 'Illustration Izou',
        }}
      >
        <div className="space-y-3 mb-8">
          <h1 className="text-display-xs font-semibold text-primary">Lien invalide ou expiré</h1>
          <p className="text-md text-tertiary">
            Ce lien de réinitialisation n&apos;est plus valide (il a expiré, a déjà été utilisé, ou
            est incorrect). Demandez-en un nouveau pour continuer.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard/forgot-password"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 bg-brand-solid hover:bg-brand-solid_hover text-white text-sm font-semibold transition-colors"
          >
            Demander un nouveau lien
          </Link>
          <Link
            href="/dashboard/login"
            className="text-center text-sm font-semibold text-tertiary hover:text-secondary transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </AuthLayout>
    )
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
