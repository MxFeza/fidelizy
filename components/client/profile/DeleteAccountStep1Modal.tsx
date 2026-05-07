'use client'

/**
 * DeleteAccountStep1Modal — première confirmation suppression compte.
 * Story 4.7 v2.
 */

import { Button } from '@/components/ui/base/buttons/button'
import ProfileModal from './ProfileModal'

interface DeleteAccountStep1ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteAccountStep1Modal({ isOpen, onClose, onConfirm }: DeleteAccountStep1ModalProps) {
  return (
    <ProfileModal
      isOpen={isOpen}
      onClose={onClose}
      icon="danger"
      title="Supprimer mon compte ?"
      description="Cette action est définitive. Votre carte, vos tampons et l'historique de vos récompenses seront supprimés."
      actions={
        <>
          <Button color="primary-destructive" size="md" onClick={onConfirm}>
            Supprimer définitivement
          </Button>
          <Button color="secondary" size="md" onClick={onClose}>
            Annuler
          </Button>
        </>
      }
    />
  )
}
