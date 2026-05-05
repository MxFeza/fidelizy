'use client'

/**
 * /me/MeLoginClient — Login + register direct client (Story 4.10.a).
 *
 * 3 modes :
 *  - 'login'    (default) : entrer phone → reçoit OTP par email → /me cards
 *  - 'register' : creer un nouveau compte (first_name + phone + email)
 *  - 'needs_customer' : auth.users existe mais pas de customer en DB
 *                       (bascule en register pour combler)
 *
 * Refonte 4.2.f : suppression gradient legacy, Untitled UI Button/Input,
 * tokens semantiques, cohérence visuelle avec /join.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { QrCode02 } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import OTPInput from '@/app/components/OTPInput'

interface MeLoginClientProps {
  mode?: 'login' | 'needs_customer'
  initialEmail?: string
}

type Step = 'login' | 'register' | 'otp'

export default function MeLoginClient({ mode = 'login', initialEmail }: MeLoginClientProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(mode === 'needs_customer' ? 'register' : 'login')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(initialEmail ?? '')
  const [firstName, setFirstName] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (phone.trim().length < 6) {
      setError('Veuillez entrer un numéro de téléphone valide.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Erreur. Veuillez réessayer.')
        return
      }
      if (data.status === 'not_found') {
        setError('Aucun compte trouvé avec ce numéro. Inscrivez-vous ci-dessous.')
        return
      }
      if (data.status === 'needs_email') {
        setError('Un email est requis pour ce compte. Contactez le support.')
        return
      }
      if (data.status === 'otp_sent') {
        setMaskedEmail(data.maskedEmail ?? '')
        setStep('otp')
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!firstName.trim()) { setError('Prénom requis.'); return }
    if (phone.trim().length < 6) { setError('Numéro de téléphone valide requis.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Email valide requis.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName.trim(), phone: phone.trim(), email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Erreur lors de la création du compte.')
        return
      }
      if (data.status === 'already_exists' || data.status === 'otp_sent') {
        setMaskedEmail(data.maskedEmail ?? '')
        if (data.phone) setPhone(data.phone)
        setStep('otp')
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOTP(token: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Erreur de vérification.')
        return
      }
      if (data.status === 'verified') {
        router.push('/me')
        router.refresh()
        return
      }
      setError('Code invalide. Veuillez réessayer.')
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <header className="px-5 py-4 border-b border-secondary">
        <Image
          src="/izou-logo.svg"
          alt="Izou"
          width={80}
          height={24}
          priority
          className="h-6 w-auto"
        />
      </header>

      <main className="flex-1 flex flex-col px-5 py-8">
        <div className="w-full max-w-sm mx-auto">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-display-xs font-bold text-primary">
              {step === 'register'
                ? 'Créer mon compte'
                : step === 'otp'
                  ? 'Vérification'
                  : 'Mes cartes fidélité'}
            </h1>
            <p className="text-md text-tertiary mt-1.5">
              {step === 'register'
                ? 'Pour gérer toutes vos cartes au même endroit.'
                : step === 'otp'
                  ? `Entrez le code reçu par email${maskedEmail ? ` (${maskedEmail})` : ''}`
                  : 'Connectez-vous pour accéder à toutes vos cartes.'}
            </p>
          </div>

          {step === 'login' && (
            <form onSubmit={handleLoginSubmit} noValidate className="space-y-6">
              <Input
                type="tel"
                inputMode="tel"
                placeholder="06 00 00 00 00"
                value={phone}
                onChange={(value) => { setPhone(value); setError('') }}
                isInvalid={!!error}
                hint={error || undefined}
                autoFocus
                size="md"
              />

              <div className="space-y-2">
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  isLoading={loading}
                  isDisabled={phone.trim().length < 6}
                  className="w-full"
                >
                  Recevoir le code
                </Button>
                <Button
                  type="button"
                  color="tertiary"
                  size="lg"
                  className="w-full"
                  isDisabled={loading}
                  onClick={() => { setStep('register'); setError('') }}
                >
                  Pas encore de compte ? Créer mon compte
                </Button>
              </div>

              {/* Entry point /scan — chemin 3 d'inscription */}
              <div className="pt-4 border-t border-secondary">
                <Link
                  href="/scan"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-brand-secondary hover:bg-primary_hover transition-colors"
                >
                  <QrCode02 className="size-5" aria-hidden="true" />
                  Scanner un QR code commerçant
                </Link>
              </div>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
              <Input
                placeholder="Votre prénom"
                value={firstName}
                onChange={(value) => { setFirstName(value); setError('') }}
                autoFocus
                size="md"
              />

              <Input
                type="tel"
                inputMode="tel"
                placeholder="06 00 00 00 00"
                value={phone}
                onChange={(value) => { setPhone(value); setError('') }}
                size="md"
              />

              <Input
                type="email"
                placeholder="vous@email.fr"
                value={email}
                onChange={(value) => { setEmail(value); setError('') }}
                hint={error || 'Le code de vérification y sera envoyé.'}
                isInvalid={!!error}
                size="md"
              />

              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  isLoading={loading}
                  className="w-full"
                >
                  Créer mon compte
                </Button>
                <Button
                  type="button"
                  color="tertiary"
                  size="lg"
                  className="w-full"
                  isDisabled={loading}
                  onClick={() => { setStep('login'); setError('') }}
                >
                  ← J&apos;ai déjà un compte
                </Button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-6">
              <OTPInput onComplete={handleOTP} disabled={loading} />
              {error && (
                <p className="text-sm text-error-primary text-center font-medium">{error}</p>
              )}
              {loading && !error && (
                <p className="text-sm text-tertiary text-center">Vérification…</p>
              )}
              <Button
                type="button"
                color="tertiary"
                size="lg"
                className="w-full"
                isDisabled={loading}
                onClick={() => { setStep('login'); setError('') }}
              >
                ← Retour
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-quaternary mt-8">
            <Link href="/dashboard/login" className="text-brand-secondary font-medium hover:underline">
              Vous êtes commerçant ? →
            </Link>
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-quaternary space-x-2">
        <Link href="/privacy" className="hover:text-tertiary underline">Confidentialité</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-tertiary underline">CGU</Link>
        <span>·</span>
        <Link href="/legal" className="hover:text-tertiary underline">Mentions légales</Link>
      </footer>
    </div>
  )
}
