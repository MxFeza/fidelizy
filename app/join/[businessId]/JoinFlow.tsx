'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import OTPInput from '@/app/components/OTPInput'

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

export default function JoinFlow({ business, initialReferralCode }: JoinFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('name')
  const [firstName, setFirstName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const referralCode = initialReferralCode ?? ''
  const [qrCodeId, setQrCodeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function clearError() {
    if (error) setError('')
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim()) {
      setError('Prénom requis.')
      return
    }
    setError('')
    setStep('phone')
  }

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (phone.trim().length < 6) {
      setError('Numéro de téléphone invalide.')
      return
    }
    setError('')
    setStep('email')
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Adresse email invalide.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          firstName: firstName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          referral_code: referralCode || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Erreur lors de la création du compte.')
        return
      }
      setQrCodeId(data.qrCodeId)

      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      const otpData = await otpRes.json().catch(() => ({}))
      if (otpData.status === 'otp_sent') {
        setStep('otp')
      } else {
        // Carte créée mais OTP indisponible — on bascule directement sur le succès
        setStep('success')
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
        if (Array.isArray(data.cards) && data.cards.length > 0 && !qrCodeId) {
          setQrCodeId(data.cards[0].qr_code_id)
        }
        setStep('success')
        return
      }
      setError('Code invalide. Veuillez réessayer.')
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  function handleViewCard() {
    if (qrCodeId) {
      router.push(`/card/${qrCodeId}`)
    } else {
      router.push('/me')
    }
  }

  if (step === 'name') {
    return (
      <form onSubmit={handleNameSubmit} className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-display-xs font-bold text-primary">
            Bienvenue chez {business.business_name}
          </h1>
          <p className="text-md text-tertiary">
            Créons votre carte de fidélité.
          </p>
        </div>

        <Input
          label="Comment vous appelez-vous ?"
          placeholder="Votre prénom"
          value={firstName}
          onChange={(value) => {
            setFirstName(value)
            clearError()
          }}
          isInvalid={!!error}
          hint={error || undefined}
          autoFocus
          size="md"
          isRequired
        />

        <Button
          type="submit"
          color="primary"
          size="lg"
          className="w-full"
        >
          Continuer
        </Button>
      </form>
    )
  }

  if (step === 'phone') {
    return (
      <form onSubmit={handlePhoneSubmit} className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-display-xs font-bold text-primary">
            Votre téléphone
          </h1>
          <p className="text-md text-tertiary">
            Pour identifier votre carte chez {business.business_name}.
          </p>
        </div>

        <Input
          type="tel"
          inputMode="tel"
          label="Numéro de téléphone"
          placeholder="06 00 00 00 00"
          value={phone}
          onChange={(value) => {
            setPhone(value)
            clearError()
          }}
          isInvalid={!!error}
          hint={error || undefined}
          autoFocus
          size="md"
          isRequired
        />

        <div className="space-y-3">
          <Button
            type="submit"
            color="primary"
            size="lg"
            className="w-full"
          >
            Continuer
          </Button>
          <Button
            type="button"
            color="tertiary"
            size="lg"
            className="w-full"
            onClick={() => {
              setError('')
              setStep('name')
            }}
          >
            ← Retour
          </Button>
        </div>
      </form>
    )
  }

  if (step === 'email') {
    return (
      <form onSubmit={handleEmailSubmit} className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-display-xs font-bold text-primary">
            Sécurisez votre compte
          </h1>
          <p className="text-md text-tertiary">
            Pour retrouver votre carte si vous changez de téléphone.
          </p>
        </div>

        <Input
          type="email"
          label="Adresse email"
          placeholder="vous@email.fr"
          value={email}
          onChange={(value) => {
            setEmail(value)
            clearError()
          }}
          isInvalid={!!error}
          hint={error || 'Un code de vérification y sera envoyé.'}
          autoFocus
          size="md"
          isRequired
        />

        <div className="space-y-3">
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
            onClick={() => {
              setError('')
              setStep('phone')
            }}
          >
            ← Retour
          </Button>
        </div>
      </form>
    )
  }

  if (step === 'otp') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-display-xs font-bold text-primary">
            Vérification
          </h1>
          <p className="text-md text-tertiary">
            Entrez le code reçu sur {email.toLowerCase()}.
          </p>
        </div>

        <div className="space-y-3">
          <OTPInput onComplete={handleOTP} disabled={loading} />
          {error && (
            <p className="text-sm font-medium text-error-primary text-center">
              {error}
            </p>
          )}
          {loading && !error && (
            <p className="text-sm text-tertiary text-center">Vérification…</p>
          )}
        </div>

        <Button
          type="button"
          color="tertiary"
          size="lg"
          className="w-full"
          isDisabled={loading}
          onClick={() => {
            setError('')
            setStep('email')
          }}
        >
          ← Modifier l&apos;email
        </Button>
      </div>
    )
  }

  // step === 'success'
  return (
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
  )
}
