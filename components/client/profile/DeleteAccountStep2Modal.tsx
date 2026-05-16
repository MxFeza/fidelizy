'use client'

/**
 * DeleteAccountStep2Modal — confirmation finale avec input "SUPPRIMER" strict.
 * Story 4.7 v2 — bouton actif uniquement si input === 'SUPPRIMER' (case-sensitive).
 */

import { useState } from 'react'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import ProfileModal from './ProfileModal'

const CONFIRM_PHRASE = 'SUPPRIMER'

interface DeleteAccountStep2ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

export default function DeleteAccountStep2Modal({ isOpen, onClose, onConfirm }: DeleteAccountStep2ModalProps) {
  const [confirmInput, setConfirmInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const canConfirm = confirmInput === CONFIRM_PHRASE && !deleting

  async function handleConfirm() {
    if (!canConfirm) return
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  function handleClose() {
    if (deleting) return
    setConfirmInput('')
    onClose()
  }

  return (
    <ProfileModal
      isOpen={isOpen}
      onClose={handleClose}
      icon="danger"
      title="Confirmation finale"
      description={
        <>
          Tapez «&nbsp;<strong>{CONFIRM_PHRASE}</strong>&nbsp;» ci-dessous pour confirmer la
          suppression définitive. Cette action ne peut pas être annulée.
        </>
      }
      isBlocking={deleting}
      actions={
        <>
          <Button color="primary-destructive" size="md" onClick={handleConfirm} isLoading={deleting} isDisabled={!canConfirm}>
            Supprimer définitivement
          </Button>
          <Button color="secondary" size="md" onClick={handleClose} isDisabled={deleting}>
            Annuler
          </Button>
        </>
      }
    >
      <Input
        value={confirmInput}
        onChange={setConfirmInput}
        placeholder={`Tapez ${CONFIRM_PHRASE}`}
        size="md"
        isDisabled={deleting}
        aria-label="Confirmation suppression"
      />
    </ProfileModal>
  )
}
