'use client'

/**
 * /recover/RecoverForm — Récupération de carte par téléphone (Story 4.6).
 *
 * Cas d'usage : le client a perdu son téléphone ou changé d'appareil et n'a
 * plus accès à `/me` directement. Il rentre son numéro, reçoit un OTP par
 * email, et est redirigé vers `/me` une fois authentifié.
 *
 * 3 steps :
 *  - 'phone' : numéro de téléphone
 *  - 'email' : edge case — customer existant SANS email en base. On lui
 *              demande de l'ajouter pour pouvoir lui envoyer l'OTP.
 *  - 'otp'   : code 6 chiffres reçu par email
 *
 * Refonte 4.6 : suppression gradient + Tailwind brut legacy, Untitled UI
 * Button/Input, tokens semantiques, cohérence visuelle avec /join et /me.
 * Apres verify-otp : redirect /me (qui affichera la liste des cartes —
 * pas de duplication d'UI cards ici).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import OTPInput from '@/app/components/OTPInput'

type Step = 'phone' | 'email' | 'otp'

export default function RecoverForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [inputEmail, setInputEmail] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePhone(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = phone.trim()
    if (trimmed.length < 6) {
      setError('Veuillez entrer un numéro de téléphone valide.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Erreur. Veuillez réessayer.')
        return
      }
      if (data.status === 'not_found') {
        setError('Aucun compte trouvé avec ce numéro.')
        return
      }
      if (data.status === 'needs_email') {
        setStep('email')
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

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputEmail.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Veuillez entrer un email valide.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/add-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), email: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Erreur. Veuillez réessayer.')
        return
      }
      if (data.status === 'otp_sent') {
        setMaskedEmail(trimmed)
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
        // Session auth créée par verify-otp -> /me affichera les cartes
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
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-display-xs font-bold text-primary">
          {step === 'email'
            ? 'Ajoutez votre email'
            : step === 'otp'
              ? 'Vérification'
              : 'Retrouver votre carte'}
        </h1>
        <p className="text-md text-tertiary mt-1.5">
          {step === 'email'
            ? 'Pour sécuriser votre compte, ajoutez votre adresse email.'
            : step === 'otp'
              ? `Entrez le code reçu par email${maskedEmail ? ` (${maskedEmail})` : ''}.`
              : 'Entrez le numéro utilisé lors de votre inscription.'}
        </p>
      </div>

      {step === 'phone' && (
        <form onSubmit={handlePhone} noValidate className="space-y-6">
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

          <Button
            type="submit"
            color="primary"
            size="lg"
            isLoading={loading}
            isDisabled={phone.trim().length < 6}
            className="w-full"
          >
            Continuer
          </Button>
        </form>
      )}

      {step === 'email' && (
        <form onSubmit={handleEmail} noValidate className="space-y-6">
          <Input
            type="email"
            placeholder="vous@email.fr"
            value={inputEmail}
            onChange={(value) => { setInputEmail(value); setError('') }}
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
              isDisabled={!inputEmail.trim()}
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
              onClick={() => { setStep('phone'); setError('') }}
            >
              ← Retour
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
            onClick={() => { setStep('phone'); setError('') }}
          >
            ← Retour
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-quaternary mt-8">
        <Link href="/" className="text-brand-secondary font-medium hover:underline">
          ← Retour à l&apos;accueil
        </Link>
      </p>
    </div>
  )
}
