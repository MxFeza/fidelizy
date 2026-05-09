'use client'

/**
 * Story 9.1 — Modal de célébration 100% complétion onboarding commerçant.
 *
 * Phase 3 (placeholder) : affichage minimal. Le confetti + le wording final
 * dopamine sont câblés en Phase 5.
 */

import { Dialog, Modal, ModalOverlay } from '@/components/ui/application/modals/modal'
import { Button } from '@/components/ui/base/buttons/button'

interface OnboardingCompleteModalProps {
  firstName: string
  onClose: () => void
}

export default function OnboardingCompleteModal({ firstName, onClose }: OnboardingCompleteModalProps) {
  return (
    <ModalOverlay isOpen onOpenChange={(open) => { if (!open) onClose() }} isDismissable>
      <Modal>
        <Dialog>
          {({ close }) => (
            <div className="relative w-full max-w-md mx-auto rounded-2xl bg-primary p-6 sm:p-8 shadow-2xl text-center">
              <h2 className="text-display-xs font-semibold text-primary mb-3">
                Bravo {firstName} !
              </h2>
              <p className="text-md text-tertiary mb-6">
                Votre programme tourne. Continuez à gérer votre commerce, on s&apos;occupe du reste.
              </p>
              <Button
                size="lg"
                color="primary"
                onClick={() => { close(); onClose() }}
                className="w-full"
              >
                Merci !
              </Button>
            </div>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
