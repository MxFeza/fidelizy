'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import OTPInput from '@/app/components/OTPInput'
import OnboardingShell from './components/OnboardingShell'
import IzouBulletLogo from './components/IzouBulletLogo'

interface Business {
  id: string
  business_name: string
  loyalty_type: 'stamps' | 'points' | string
  stamps_required: number | null
  stamps_reward: string | null
  points_per_euro: number | null
}

interface JoinFlowProps {
  business: Business
  initialReferralCode?: string
}

type Step = 'name' | 'phone' | 'email' | 'otp' | 'success'

interface ErrorState {
  title?: string
  message: string
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function JoinFlow({ business, initialReferralCode }: JoinFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('name')
  const [firstName, setFirstName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const referralCode = initialReferralCode ?? ''
  const [qrCodeId, setQrCodeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)

  function clearError() {
    if (error) setError(null)
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim()) {
      setError({
        title: 'Champ requis',
        message: 'Votre prénom est nécessaire pour personnaliser votre carte.',
      })
      return
    }
    setError(null)
    setStep('phone')
  }

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (phone.trim().length < 6) {
      setError({
        title: 'Numéro invalide',
        message: 'Entrez un numéro de téléphone valide.',
      })
      return
    }
    setError(null)
    setStep('email')
  }

  /**
   * Crée la carte côté serveur. Si `withEmail` = false, la carte est créée
   * sans email (l'utilisateur clique "Plus tard") et on saute l'OTP.
   */
  async function createCard(withEmail: boolean) {
    setLoading(true)
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          firstName: firstName.trim(),
          phone: phone.trim(),
          email: withEmail ? email.trim().toLowerCase() : undefined,
          referral_code: referralCode || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError({ message: data?.error || 'Erreur lors de la création du compte.' })
        return false
      }
      setQrCodeId(data.qrCodeId)
      return true
    } catch {
      setError({ message: 'Erreur de connexion. Veuillez réessayer.' })
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!isValidEmail(trimmed)) {
      setError({
        title: 'Format invalide',
        message: trimmed || 'Adresse email invalide.',
      })
      return
    }
    setError(null)
    const created = await createCard(true)
    if (!created) return

    setLoading(true)
    try {
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      const otpData = await otpRes.json().catch(() => ({}))
      if (otpData.status === 'otp_sent') {
        setStep('otp')
      } else {
        // Carte créée mais OTP indisponible — on bascule sur le succès
        setStep('success')
      }
    } catch {
      // Carte créée mais réseau OTP a échoué — on amène quand même au succès
      setStep('success')
    } finally {
      setLoading(false)
    }
  }

  async function handleSkipEmail() {
    setError(null)
    const created = await createCard(false)
    if (created) setStep('success')
  }

  async function handleResendOTP() {
    setError(null)
    setLoading(true)
    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleOTP(token: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError({ message: data?.error || 'Code invalide. Veuillez réessayer.' })
        return
      }
      if (data.status === 'verified') {
        if (!qrCodeId && Array.isArray(data.cards) && data.cards.length > 0) {
          setQrCodeId(data.cards[0].qr_code_id)
        }
        setStep('success')
        return
      }
      setError({ message: 'Code invalide. Veuillez réessayer.' })
    } catch {
      setError({ message: 'Erreur de connexion. Veuillez réessayer.' })
    } finally {
      setLoading(false)
    }
  }

  function handleViewCard() {
    router.push(qrCodeId ? `/card/${qrCodeId}` : '/me')
  }

  const withHero = step !== 'success'

  return (
    <OnboardingShell withHero={withHero}>
      {step === 'name' && (
        <form onSubmit={handleNameSubmit} className="space-y-6">
          <div className="space-y-3 text-center">
            <IzouBulletLogo />
            <div className="space-y-1.5">
              <h1 className="text-display-xs font-bold text-primary">
                {error
                  ? error.title ?? 'Champ requis'
                  : `Bienvenue chez ${business.business_name}`}
              </h1>
              <p className="text-md text-tertiary">
                {error
                  ? error.message
                  : 'Créez votre carte fidélité en 30 secondes.'}
              </p>
            </div>
          </div>

          <Input
            placeholder="Votre prénom"
            value={firstName}
            onChange={(value) => {
              setFirstName(value)
              clearError()
            }}
            isInvalid={!!error}
            autoFocus
            size="md"
            isRequired
          />

          <Button type="submit" color="primary" size="lg" className="w-full">
            Continuer
          </Button>
        </form>
      )}

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <div className="space-y-3 text-center">
            <IzouBulletLogo />
            <div className="space-y-1.5">
              <h1 className="text-display-xs font-bold text-primary">
                {error?.title ?? 'Votre téléphone'}
              </h1>
              <p className="text-md text-tertiary">
                {error
                  ? error.message
                  : `Pour identifier votre carte chez ${business.business_name}.`}
              </p>
            </div>
          </div>

          <Input
            type="tel"
            inputMode="tel"
            placeholder="06 00 00 00 00"
            value={phone}
            onChange={(value) => {
              setPhone(value)
              clearError()
            }}
            isInvalid={!!error}
            autoFocus
            size="md"
            isRequired
          />

          <div className="space-y-3">
            <Button type="submit" color="primary" size="lg" className="w-full">
              Continuer
            </Button>
            <Button
              type="button"
              color="tertiary"
              size="lg"
              className="w-full"
              onClick={() => {
                setError(null)
                setStep('name')
              }}
            >
              ← Retour
            </Button>
          </div>
        </form>
      )}

      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div className="space-y-3 text-center">
            <IzouBulletLogo />
            <div className="space-y-1.5">
              <h1 className="text-display-xs font-bold text-primary">
                {error?.title ?? 'Sécurisez votre compte'}
              </h1>
              <p
                className={
                  error
                    ? 'text-md text-error-primary'
                    : 'text-md text-tertiary'
                }
              >
                {error
                  ? error.message
                  : 'Pour retrouver votre carte si vous changez de téléphone.'}
              </p>
            </div>
          </div>

          <Input
            type="email"
            placeholder="marie@email.fr"
            value={email}
            onChange={(value) => {
              setEmail(value)
              clearError()
            }}
            isInvalid={!!error}
            autoFocus
            size="md"
          />

          <div className="space-y-2">
            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={loading}
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
              onClick={handleSkipEmail}
            >
              Plus tard
            </Button>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <div className="space-y-6">
          <div className="space-y-3 text-center">
            <IzouBulletLogo />
            <div className="space-y-1.5">
              <h1 className="text-display-xs font-bold text-primary">
                Entrez le code reçu
              </h1>
              <p className="text-md text-tertiary">
                Code envoyé à {email.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <OTPInput onComplete={handleOTP} disabled={loading} />
            {error && (
              <p className="text-sm font-medium text-error-primary text-center">
                {error.message}
              </p>
            )}
          </div>

          <Button
            type="button"
            color="tertiary"
            size="lg"
            className="w-full"
            isDisabled={loading}
            onClick={handleResendOTP}
          >
            Renvoyer le code
          </Button>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-display-xs font-bold text-primary">
              Félicitations {firstName} !
            </h1>
            <p className="text-md text-tertiary">
              Votre carte fidélité chez {business.business_name} a été créée.
            </p>
          </div>

          <Button
            type="button"
            color="primary"
            size="lg"
            className="w-full"
            onClick={handleViewCard}
          >
            Voir ma carte
          </Button>
        </div>
      )}
    </OnboardingShell>
  )
}
