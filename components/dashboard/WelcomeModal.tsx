'use client'

/**
 * Modal de bienvenue post-inscription.
 * Apparait au-dessus du dashboard apres l'onboarding tant que `businesses.welcome_seen` est false.
 * Persiste le dismiss en DB pour que la modal n'apparaisse jamais 2 fois (cross-device).
 */

import { useState } from 'react'
import { Dialog, Modal, ModalOverlay } from '@/components/ui/application/modals/modal'
import { Lightning01, X as XIcon } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Emoji } from '@/lib/emojis'
import { downloadQRCode } from '@/lib/qr-download'
import { createClient } from '@/lib/supabase/client'

interface WelcomeModalProps {
  businessId: string
  businessName: string
  shortCode: string | null
  /** True si la modal doit s'ouvrir au montage. */
  open: boolean
}

export default function WelcomeModal({ businessId, businessName, shortCode, open }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(open)
  const [downloading, setDownloading] = useState(false)

  const firstName = businessName.split(/\s+/)[0] ?? ''

  async function markSeen() {
    const supabase = createClient()
    await supabase.from('businesses').update({ welcome_seen: true }).eq('id', businessId)
  }

  function handleOpenChange(next: boolean) {
    setIsOpen(next)
    if (!next) void markSeen()
  }

  async function handleDownload() {
    if (!shortCode) return
    setDownloading(true)
    try {
      await downloadQRCode({
        shortCode,
        businessName: businessName || 'commerce',
        origin: window.location.origin,
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={handleOpenChange} isDismissable>
      <Modal>
        <Dialog>
          {({ close }) => (
            <div className="relative w-full max-w-md mx-auto rounded-2xl bg-primary p-6 sm:p-8 shadow-2xl">
              <button
                type="button"
                aria-label="Fermer"
                onClick={close}
                className="absolute right-4 top-4 size-8 rounded-md flex items-center justify-center text-tertiary hover:text-primary hover:bg-secondary transition-colors"
              >
                <XIcon className="size-5" />
              </button>

              <div className="text-center">
                <div className="mx-auto mb-5 size-14 rounded-full bg-brand-secondary flex items-center justify-center">
                  <Lightning01 className="size-7 text-fg-brand-primary" />
                </div>

                <h2 className="text-display-xs font-semibold text-primary mb-2 inline-flex items-center justify-center gap-2 w-full">
                  <span>Bienvenue chez Izou{firstName && `, ${firstName}`} !</span>
                  <Emoji name="confetti" size={26} />
                </h2>
                <p className="text-md text-tertiary mb-6">
                  Votre programme de fidélité est configuré. Vous pouvez dès maintenant accueillir vos premiers clients
                  et leur faire scanner votre QR code au comptoir.
                </p>

                <div className="rounded-lg bg-secondary p-4 text-left mb-6">
                  <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-3">
                    Prochaines étapes
                  </p>
                  <ul className="space-y-2 text-sm text-primary">
                    <li className="flex items-start gap-2">
                      <Emoji name="printer" size={18} className="mt-0.5 shrink-0" />
                      <span>Téléchargez et imprimez votre QR code</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Emoji name="home" size={18} className="mt-0.5 shrink-0" />
                      <span>Collez-le à côté de votre caisse</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Emoji name="handshake" size={18} className="mt-0.5 shrink-0" />
                      <span>Présentez le programme à vos premiers clients</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    color="secondary"
                    isDisabled={downloading || !shortCode}
                    onClick={handleDownload}
                    className="flex-1"
                  >
                    {downloading ? 'Préparation...' : 'Télécharger mon QR'}
                  </Button>
                  <Button
                    size="lg"
                    color="primary"
                    onClick={close}
                    className="flex-1"
                  >
                    Commencer
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
