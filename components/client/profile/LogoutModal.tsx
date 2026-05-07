'use client'

/**
 * LogoutModal — modal "Se déconnecter ?". Story 4.7 v2.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/base/buttons/button'
import ProfileModal from './ProfileModal'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  const [signingOut, setSigningOut] = useState(false)

  async function handleConfirm() {
    setSigningOut(true)
    try {
      await onConfirm()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <ProfileModal
      isOpen={isOpen}
      onClose={onClose}
      icon="warning"
      title="Se déconnecter ?"
      description="Vous devrez vous reconnecter pour retrouver votre carte et vos tampons."
      isBlocking={signingOut}
      actions={
        <>
          <Button color="primary" size="md" onClick={handleConfirm} isLoading={signingOut} isDisabled={signingOut}>
            Se déconnecter
          </Button>
          <Button color="secondary" size="md" onClick={onClose} isDisabled={signingOut}>
            Annuler
          </Button>
        </>
      }
    />
  )
}
