'use client'

/**
 * ExportDataModal — modal "Exporter mes données" (RGPD art. 20).
 * Story 4.7 v2 — appelle GET /api/me/export, download direct du ZIP.
 * Le titre Figma indique "Envoyer par e-mail" mais l'infra email transactionnel
 * n'est pas en place pour le pilote — on télécharge le ZIP localement à la place.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/base/buttons/button'
import ProfileModal from './ProfileModal'

interface ExportDataModalProps {
  isOpen: boolean
  onClose: () => void
  customerFirstName: string
  onSuccess: () => void
  onError: (message: string) => void
}

export default function ExportDataModal({ isOpen, onClose, customerFirstName, onSuccess, onError }: ExportDataModalProps) {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/me/export')
      if (!res.ok) {
        onError('Erreur lors de la génération de l\'export.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().slice(0, 10)
      const slug = (customerFirstName || 'export').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      a.download = `izou-${slug}-${date}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      onSuccess()
      onClose()
    } catch {
      onError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <ProfileModal
      isOpen={isOpen}
      onClose={onClose}
      icon="success"
      title="Exporter mes données"
      description="Téléchargez une archive ZIP contenant votre profil, vos cartes, votre historique et vos parrainages."
      isBlocking={exporting}
      actions={
        <>
          <Button color="primary" size="md" onClick={handleExport} isLoading={exporting} isDisabled={exporting}>
            Télécharger l&apos;archive
          </Button>
          <Button color="secondary" size="md" onClick={onClose} isDisabled={exporting}>
            Annuler
          </Button>
        </>
      }
    />
  )
}
