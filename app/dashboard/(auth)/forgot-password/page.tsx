'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail01, ArrowLeft, AlertCircle } from '@untitledui/icons'
import AuthLayout from '../AuthLayout'
import { Input } from '@/components/ui/base/input/input'
import { Button } from '@/components/ui/base/buttons/button'
import { PUBLIC_ASSETS } from '@/lib/assets'

const CALLBACK_ERRORS: Record<string, string> = {
  invalid_link: 'Le lien de réinitialisation est invalide. Demandez-en un nouveau ci-dessous.',
  expired_link: 'Le lien de réinitialisation a expiré ou a déjà été utilisé. Demandez-en un nouveau ci-dessous.',
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [callbackError, setCallbackError] = useState<string | null>(null)

  // Lit le ?error=... renvoye par /auth/callback en cas d'echec PKCE exchange
  // (lien expire/invalide). Affiche un message clair au-dessus du form.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err && CALLBACK_ERRORS[err]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read URL query post-hydration
      setCallbackError(CALLBACK_ERRORS[err])
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const cleaned = email.trim().toLowerCase()
    if (!cleaned || !cleaned.includes('@')) {
      setError("Saisissez une adresse email valide.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    // Fix bug 2026-05-15 : PKCE flow Supabase requiert un handler intermediaire
    // qui appelle exchangeCodeForSession avant d'arriver sur reset-password.
    // Sans /auth/callback, la session n'etait jamais etablie et updateUser
    // echouait silencieusement.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleaned, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/reset-password`,
    })

    if (resetError) {
      // Limite de taux ou autre — surface message Supabase quand utile
      const msg = resetError.message?.toLowerCase() ?? ''
      if (msg.includes('rate') || msg.includes('limit')) {
        setError('Trop de tentatives. Réessayez dans quelques minutes.')
      } else {
        setError("Impossible d'envoyer l'email. Vérifiez l'adresse et réessayez.")
      }
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <AuthLayout
      rightPanel={{
        src: PUBLIC_ASSETS.auth.balloons,
        alt: 'Illustration Izou',
      }}
    >
      {sent ? (
        <div className="text-center">
          <div className="mx-auto mb-6 size-14 rounded-full bg-brand-secondary flex items-center justify-center">
            <Mail01 className="size-7 text-fg-brand-primary" />
          </div>
          <h1 className="text-display-xs font-semibold text-primary mb-3">
            Vérifiez vos emails
          </h1>
          <p className="text-md text-tertiary mb-3">
            Nous avons envoyé un lien de réinitialisation à{' '}
            <span className="font-semibold text-primary">{email.trim().toLowerCase()}</span>.
          </p>
          <p className="text-sm text-tertiary mb-8">
            Cliquez sur le lien dans l&apos;email pour définir un nouveau mot de passe. Le lien expire dans 1 heure.
            <br />
            <span className="text-xs">Pensez à vérifier vos spams si vous ne le voyez pas.</span>
          </p>
          <div className="flex flex-col gap-2 items-center">
            <button
              type="button"
              onClick={() => { setSent(false); setError('') }}
              className="text-sm font-semibold text-brand-secondary hover:text-brand-secondary_hover transition-colors"
            >
              Renvoyer le lien
            </button>
            <Link
              href="/dashboard/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-tertiary hover:text-secondary transition-colors"
            >
              <ArrowLeft className="size-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-8">
            <h1 className="text-display-xs font-semibold text-primary">Mot de passe oublié</h1>
            <p className="text-md text-tertiary">
              Saisissez votre email pour recevoir un lien de réinitialisation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {callbackError && (
              <div className="rounded-md bg-warning-secondary border border-warning text-warning-primary px-4 py-3 text-sm flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{callbackError}</span>
              </div>
            )}
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

            <Button
              type="submit"
              size="lg"
              color="primary"
              isDisabled={loading}
              className="w-full"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </Button>

            <p className="text-center">
              <Link
                href="/dashboard/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary hover:text-brand-secondary_hover transition-colors"
              >
                <ArrowLeft className="size-4" />
                Retour à la connexion
              </Link>
            </p>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
