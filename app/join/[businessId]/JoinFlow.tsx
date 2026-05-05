'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import LoyaltyCardVisual from '@/components/dashboard/LoyaltyCardVisual'
import OnboardingShell from './components/OnboardingShell'
import IzouBulletLogo from './components/IzouBulletLogo'
import OTPCodeInput, { type OTPStatus } from './components/OTPCodeInput'

interface Business {
  id: string
  business_name: string
  loyalty_type: 'stamps' | 'points' | string
  stamps_required: number | null
  stamps_reward: string | null
  points_per_euro: number | null
  logo_url: string | null
  gamification: Record<string, unknown> | null
}

interface JoinFlowProps {
  business: Business
  initialReferralCode?: string
}

type Step = 'name' | 'phone' | 'email' | 'otp' | 'success'

/** Sous-états de l'écran OTP, conforme Figma A5.0→A5.5. */
type OTPSub = 'idle' | 'wrong' | 'expired' | 'resent' | 'success'

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
  const [otpValue, setOtpValue] = useState('')
  const [otpSub, setOtpSub] = useState<OTPSub>('idle')

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
    setOtpValue('')
    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      setOtpSub('resent')
    } catch {
      // ignore — user peut re-cliquer
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitOTP() {
    if (otpValue.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), token: otpValue }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = String(data?.error || '').toLowerCase()
        if (msg.includes('expir') || msg.includes('expire')) {
          setOtpSub('expired')
        } else {
          setOtpSub('wrong')
        }
        return
      }
      if (data.status === 'verified') {
        if (!qrCodeId && Array.isArray(data.cards) && data.cards.length > 0) {
          setQrCodeId(data.cards[0].qr_code_id)
        }
        setOtpSub('success')
        // Laisse le temps de voir l'état "Code vérifié" avant de basculer
        setTimeout(() => setStep('success'), 1000)
        return
      }
      setOtpSub('wrong')
    } catch {
      setOtpSub('wrong')
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
        <form onSubmit={handleNameSubmit} noValidate className="space-y-6">
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
        <form onSubmit={handlePhoneSubmit} noValidate className="space-y-6">
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
        <form onSubmit={handleEmailSubmit} noValidate className="space-y-6">
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

      {step === 'otp' && (() => {
        const titleByState: Record<OTPSub, string> = {
          idle: 'Entrez le code reçu',
          resent: 'Entrez le code reçu',
          wrong: 'Code incorrect',
          expired: 'Code expiré',
          success: 'Code vérifié ✓',
        }
        const subtitleByState: Record<OTPSub, string> = {
          idle: `Code envoyé à ${email.toLowerCase()}`,
          resent: `Nouveau code envoyé à ${email.toLowerCase()}`,
          wrong: 'Vérifiez les 6 chiffres et réessayez',
          expired: 'Votre code est expiré. Demandez-en un nouveau.',
          success: 'Redirection en cours...',
        }
        const subtitleColor =
          otpSub === 'success'
            ? 'text-success-primary'
            : otpSub === 'wrong' || otpSub === 'expired'
              ? 'text-error-primary'
              : 'text-tertiary'
        const inputStatus: OTPStatus =
          otpSub === 'success' ? 'success' : otpSub === 'wrong' ? 'invalid' : 'idle'
        const isSuccess = otpSub === 'success'

        return (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <IzouBulletLogo />
              <div className="space-y-1.5">
                <h1 className="text-display-xs font-bold text-primary">
                  {titleByState[otpSub]}
                </h1>
                <p className={`text-md ${subtitleColor}`}>
                  {subtitleByState[otpSub]}
                </p>
              </div>
            </div>

            <OTPCodeInput
              value={otpValue}
              onChange={(v) => {
                setOtpValue(v)
                if (otpSub !== 'idle' && otpSub !== 'success') setOtpSub('idle')
              }}
              disabled={loading || isSuccess}
              status={inputStatus}
            />

            <div className="space-y-2">
              <Button
                type="button"
                color="primary"
                size="lg"
                isLoading={loading}
                isDisabled={otpValue.length !== 6 || isSuccess}
                className="w-full"
                onClick={handleSubmitOTP}
              >
                Valider
              </Button>
              <Button
                type="button"
                color="tertiary"
                size="lg"
                className="w-full"
                isDisabled={loading || isSuccess}
                onClick={handleResendOTP}
              >
                Renvoyer le code
              </Button>
            </div>
          </div>
        )
      })()}

      {step === 'success' && (() => {
        const initialStamps =
          business.loyalty_type === 'stamps' &&
          typeof business.gamification?.initial_stamps === 'number'
            ? (business.gamification.initial_stamps as number)
            : 0
        const stampsRequired = business.stamps_required ?? 10
        const isStamps = business.loyalty_type === 'stamps'

        return (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-display-xs font-bold text-primary">
                Félicitations {firstName} !{' '}
                <span aria-hidden="true">🎉</span>
              </h1>
              <p className="text-md text-tertiary">
                Votre carte fidélité chez {business.business_name} a été créée !
              </p>
            </div>

            <LoyaltyCardVisual
              customerName={firstName}
              loyaltyType={isStamps ? 'stamps' : 'points'}
              currentStamps={initialStamps}
              stampsRequired={stampsRequired}
              currentPoints={0}
              businessLogoUrl={business.logo_url}
            />

            {isStamps && initialStamps > 0 && (
              <div className="rounded-xl bg-brand-primary px-4 py-3 text-center">
                <p className="text-sm font-semibold text-brand-secondary">
                  <span aria-hidden="true">🏆</span> {initialStamps} tampon
                  {initialStamps > 1 ? 's' : ''} offert
                  {initialStamps > 1 ? 's' : ''}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {qrCodeId && (
                <a
                  href={`/api/wallet/${qrCodeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold py-3.5 px-4 rounded-xl text-sm transition-colors hover:bg-gray-800 shadow-xs-skeumorphic"
                >
                   Ajouter à Apple Wallet
                </a>
              )}

              <Button
                type="button"
                color="tertiary"
                size="lg"
                className="w-full"
                onClick={handleViewCard}
              >
                Plus tard
              </Button>
            </div>
          </div>
        )
      })()}
    </OnboardingShell>
  )
}
