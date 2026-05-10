'use client'

/**
 * Sheet bottom modal "Welcome" affichee au 1er acces /card/[cardId].
 *
 * 3 slides scrollables horizontalement (facon stories Instagram) :
 *  1. Bienvenue {firstName}
 *  2. Pourquoi installer Izou sur ton telephone (PWA)
 *  3. Wallet (optionnel, skip-able)
 *
 * Marque customers.onboarding_started_at = now() au 1er swipe ou clic
 * (via POST /api/me/onboarding/start, idempotent).
 *
 * Ne se reaffiche jamais une fois started_at non NULL.
 *
 * Story 9.2 §4.
 */

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { X as XIcon, ArrowRight, ArrowLeft, BellRinging01, CreditCard02, Stars02 } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'

interface Props {
  firstName: string
  businessName: string
  /**
   * Callback declenche quand l'utilisateur clique "Installer maintenant".
   * Le parent gere le flow d'install (iOS tutorial vs Android prompt).
   */
  onInstallClick: () => void
  /**
   * Callback declenche quand l'utilisateur clique "Ajouter au Wallet".
   * Le parent declenche le download .pkpass + tracking.
   */
  onWalletClick: () => void
  /**
   * Callback declenche a la fermeture (skip ou completion des 3 slides).
   * Le parent fait disparaitre le sheet (etat local).
   */
  onClose: () => void
}

const SLIDES = ['welcome', 'pwa', 'wallet'] as const
type SlideId = (typeof SLIDES)[number]

export default function OnboardingWelcomeSheet({
  firstName,
  businessName,
  onInstallClick,
  onWalletClick,
  onClose,
}: Props) {
  const [slideIndex, setSlideIndex] = useState(0)
  const startedRef = useRef(false)

  // Marquer onboarding_started_at au 1er render (idempotent cote API).
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    fetch('/api/me/onboarding/start', { method: 'POST' }).catch(() => {})
  }, [])

  function handleSkip() {
    onClose()
  }

  function handleNext() {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex((i) => i + 1)
    } else {
      onClose()
    }
  }

  function handlePrev() {
    if (slideIndex > 0) setSlideIndex((i) => i - 1)
  }

  const currentSlide: SlideId = SLIDES[slideIndex]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenue sur Izou"
      className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center md:justify-center"
      onClick={handleSkip}
    >
      <div
        className="w-full md:max-w-md max-h-[85vh] md:max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header — close + slide indicators */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex gap-1.5" aria-hidden="true">
            {SLIDES.map((id, i) => (
              <span
                key={id}
                className={`h-1 rounded-full transition-all ${
                  i === slideIndex ? 'w-6 bg-gray-900' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Fermer"
            className="size-8 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-500"
          >
            <XIcon className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Slide content */}
        <div className="px-6 pb-6 pt-4 min-h-[360px]">
          {currentSlide === 'welcome' && (
            <SlideLayout
              icon={<Stars02 className="size-7 text-violet-600" aria-hidden="true" />}
              title={
                <>
                  Bonjour {firstName} <span className="ml-1">🎉</span>
                </>
              }
              body={
                <>
                  Votre carte fidélité chez <strong className="font-semibold text-gray-900">{businessName}</strong> est prête.
                  <br />
                  En 2 minutes on configure tout pour ne plus rater une récompense.
                </>
              }
            />
          )}

          {currentSlide === 'pwa' && (
            <SlideLayout
              icon={<BellRinging01 className="size-7 text-violet-600" aria-hidden="true" />}
              title="Recevez vos récompenses en temps réel"
              body={
                <>
                  Installez Izou sur votre téléphone pour&nbsp;:
                  <ul className="mt-3 space-y-1.5 text-left">
                    <li className="flex gap-2">
                      <span aria-hidden="true">🔔</span>
                      <span>Une notif quand votre récompense est débloquée</span>
                    </li>
                    <li className="flex gap-2">
                      <span aria-hidden="true">🎁</span>
                      <span>
                        Les offres exclusives de <strong className="font-semibold text-gray-900">{businessName}</strong>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span aria-hidden="true">⚡</span>
                      <span>Accès direct à votre carte sans ouvrir le navigateur</span>
                    </li>
                  </ul>
                </>
              }
            />
          )}

          {currentSlide === 'wallet' && (
            <SlideLayout
              icon={<CreditCard02 className="size-7 text-violet-600" aria-hidden="true" />}
              title="Votre carte dans votre Wallet"
              body={
                <>
                  Ajoutez la carte à Apple Wallet pour la retrouver d&apos;un swipe, sans déverrouiller le téléphone.
                  <span className="block mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                    💬 Une question ou un retour ? Touchez la bulle violette en bas à droite à tout moment.
                  </span>
                </>
              }
            />
          )}
        </div>

        {/* Footer — actions */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          {currentSlide === 'welcome' && (
            <Button type="button" size="lg" color="primary" className="w-full" onClick={handleNext}>
              C&apos;est parti
              <ArrowRight aria-hidden="true" />
            </Button>
          )}

          {currentSlide === 'pwa' && (
            <>
              <Button
                type="button"
                size="lg"
                color="primary"
                className="w-full"
                onClick={() => {
                  onInstallClick()
                  handleNext()
                }}
              >
                Installer maintenant
              </Button>
              <Button type="button" size="md" color="link-gray" className="w-full" onClick={handleNext}>
                Plus tard
              </Button>
            </>
          )}

          {currentSlide === 'wallet' && (
            <>
              <Button
                type="button"
                size="lg"
                color="primary"
                className="w-full"
                onClick={() => {
                  onWalletClick()
                  onClose()
                }}
              >
                Ajouter au Wallet
              </Button>
              <Button type="button" size="md" color="link-gray" className="w-full" onClick={onClose}>
                Plus tard
              </Button>
            </>
          )}

          {slideIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Slide precedent"
              className="self-start mt-1 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Précédent
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SlideLayout({
  icon,
  title,
  body,
}: {
  icon: ReactNode
  title: ReactNode
  body: ReactNode
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="size-14 rounded-2xl bg-violet-50 flex items-center justify-center">{icon}</div>
      <h2 className="text-xl font-bold text-gray-900 leading-tight">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed max-w-sm">{body}</div>
    </div>
  )
}
