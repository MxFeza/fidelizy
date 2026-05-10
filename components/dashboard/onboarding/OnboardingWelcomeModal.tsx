'use client'

/**
 * Story 9.1 — Modal "Welcome" 1ᵉʳ login commerçant.
 *
 * S'affiche au-dessus du dashboard tant que `businesses.onboarding_started_at`
 * est NULL. Le clic sur "Commencer la visite" OU "Plus tard" appelle
 * `/api/business/onboarding/start` (idempotent → set `onboarding_started_at`),
 * ce qui empêche le re-affichage à vie.
 *
 * Distinction avec `WelcomeModal.tsx` (Story 7.2 / Epic 7) qui couvre
 * l'inscription : ce modal-ci est un nouveau coach onboarding J3 enthousiaste
 * (pas un onboarding générique).
 *
 * Wording obligatoire — leitmotiv user "enthousiasme + dopamine + flatter".
 * Pas de neutralité corporate.
 */

import { useState } from 'react'
import { Dialog, Modal, ModalOverlay } from '@/components/ui/application/modals/modal'
import { Rocket01, X as XIcon } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'

interface OnboardingWelcomeModalProps {
  /** Prénom du gérant (fallback : 1er mot du nom du commerce). */
  firstName: string
  /** True si la modal doit s'ouvrir au montage. */
  open: boolean
  /** Callback : "Commencer la visite" — déclenche le tour driver.js. */
  onStartTour: () => void
  /** Callback : "Plus tard" — ferme le modal sans tour. */
  onSkip: () => void
}

export default function OnboardingWelcomeModal({
  firstName,
  open,
  onStartTour,
  onSkip,
}: OnboardingWelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(open)
  const [busy, setBusy] = useState(false)

  async function markStartedAndClose(action: 'tour' | 'skip') {
    if (busy) return
    setBusy(true)
    try {
      // Idempotent côté serveur : 1ʳᵉ écriture seule réussit.
      await fetch('/api/business/onboarding/start', { method: 'POST' })
    } catch {
      // Non-bloquant : si l'API échoue, le modal réapparaîtra au prochain login.
      // C'est OK — pas de risque de perte de données.
    } finally {
      setIsOpen(false)
      setBusy(false)
      if (action === 'tour') onStartTour()
      else onSkip()
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next && !busy) {
      // Fermeture par Escape / clic outside → comportement "Plus tard"
      void markStartedAndClose('skip')
    } else {
      setIsOpen(next)
    }
  }

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={handleOpenChange} isDismissable>
      <Modal>
        <Dialog>
          {({ close }) => (
            <div className="relative w-full max-w-lg mx-auto rounded-2xl bg-primary p-6 sm:p-8 shadow-2xl">
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => {
                  close()
                  void markStartedAndClose('skip')
                }}
                disabled={busy}
                className="absolute right-4 top-4 size-8 rounded-md flex items-center justify-center text-tertiary hover:text-primary hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <XIcon className="size-5" />
              </button>

              <div className="text-center">
                <div className="mx-auto mb-5 size-14 rounded-full bg-brand-secondary flex items-center justify-center">
                  <Rocket01 className="size-7 text-fg-brand-primary" />
                </div>

                <h2 className="text-display-xs font-semibold text-primary mb-3">
                  <span aria-hidden="true">🎉 </span>
                  Bienvenue{firstName ? `, ${firstName}` : ''}, vous y êtes !
                </h2>

                <p className="text-md text-tertiary mb-5 leading-relaxed">
                  Vous venez de rejoindre la communauté des commerçants qui transforment leurs
                  clients occasionnels en habitués fidèles.{' '}
                  <strong className="text-primary font-semibold">
                    Votre programme va décoller en moins de 5 minutes.
                  </strong>
                </p>

                <div className="rounded-xl bg-secondary p-4 sm:p-5 text-left mb-6">
                  <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-3">
                    On vous guide pas à pas pour repartir avec
                  </p>
                  <ul className="space-y-2.5 text-sm text-primary">
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success-secondary text-fg-success-primary text-xs font-bold">
                        ✓
                      </span>
                      <span>Votre programme de fidélité configuré</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success-secondary text-fg-success-primary text-xs font-bold">
                        ✓
                      </span>
                      <span>Vos premières récompenses paramétrées</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success-secondary text-fg-success-primary text-xs font-bold">
                        ✓
                      </span>
                      <span>Votre QR code prêt à être affiché en boutique</span>
                    </li>
                  </ul>
                </div>

                <p className="text-md font-semibold text-primary mb-4">C&apos;est parti.</p>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <Button
                    size="lg"
                    color="tertiary"
                    onClick={() => {
                      close()
                      void markStartedAndClose('skip')
                    }}
                    isDisabled={busy}
                    className="flex-1"
                  >
                    Plus tard
                  </Button>
                  <Button
                    size="lg"
                    color="primary"
                    onClick={() => {
                      close()
                      void markStartedAndClose('tour')
                    }}
                    isDisabled={busy}
                    isLoading={busy}
                    className="flex-1"
                  >
                    Commencer la visite
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
