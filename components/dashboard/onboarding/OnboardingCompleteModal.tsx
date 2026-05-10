'use client'

/**
 * Story 9.1 — Modal de célébration 100% onboarding commerçant.
 *
 * Affichage : confetti plein écran + modal félicitations enthousiaste.
 * Réutilise `app/card/[cardId]/components/ConfettiEffect.tsx` (déjà existant
 * dans le repo, partagé entre côté client carte et coach merchant).
 *
 * Wording fidèle au leitmotiv user "dopamine + flatter + rassurer" (cf spec §5
 * et §11 critère 7).
 */

import { Dialog, Modal, ModalOverlay } from '@/components/ui/application/modals/modal'
import { Button } from '@/components/ui/base/buttons/button'
import ConfettiEffect from '@/app/card/[cardId]/components/ConfettiEffect'

interface OnboardingCompleteModalProps {
  firstName: string
  onClose: () => void
}

export default function OnboardingCompleteModal({ firstName, onClose }: OnboardingCompleteModalProps) {
  return (
    <>
      {/* Confetti plein écran (z-50, pointer-events-none, auto-fade ~3 s) */}
      <ConfettiEffect color="#7F56D9" />

      <ModalOverlay isOpen onOpenChange={(open) => { if (!open) onClose() }} isDismissable>
        <Modal>
          <Dialog>
            {({ close }) => (
              <div className="relative w-full max-w-md mx-auto rounded-2xl bg-primary p-6 sm:p-8 shadow-2xl text-center">
                <div className="mx-auto mb-5 size-16 rounded-full bg-success-secondary flex items-center justify-center text-3xl">
                  <span aria-hidden="true">🎉</span>
                </div>

                <h2 className="text-display-xs font-semibold text-primary mb-3">
                  Bravo{firstName ? ` ${firstName}` : ''} !
                </h2>

                <p className="text-md text-secondary mb-2 leading-relaxed">
                  Votre programme tourne.
                </p>
                <p className="text-md text-tertiary mb-6 leading-relaxed">
                  Izou devient maintenant invisible — c&apos;est exactement ce qu&apos;on voulait.
                  Continuez à gérer votre commerce, on s&apos;occupe du reste.
                </p>

                <Button
                  size="lg"
                  color="primary"
                  onClick={() => {
                    close()
                    onClose()
                  }}
                  className="w-full"
                >
                  Allez, on accueille les clients
                </Button>
              </div>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  )
}
