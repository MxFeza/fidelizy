'use client'

/**
 * AvatarUploadModal — modal "Changer ma photo".
 * Story 4.7 v2 — 2 inputs distincts pour camera vs galerie.
 *
 * Fix 2026-05-08 : l'input unique avec `capture="user"` forçait la caméra
 * sur mobile et empêchait d'importer une photo existante. On a maintenant
 * 2 boutons + 2 inputs (un avec capture pour la caméra direct, un sans
 * pour ouvrir la sélection fichier/galerie native).
 */

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/base/buttons/button'
import ProfileModal from './ProfileModal'

interface AvatarUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploaded: (url: string) => void
  onError: (message: string) => void
}

export default function AvatarUploadModal({ isOpen, onClose, onUploaded, onError }: AvatarUploadModalProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  function openCamera() {
    cameraInputRef.current?.click()
  }
  function openGallery() {
    galleryInputRef.current?.click()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/me/avatar', { method: 'POST', body: fd })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        onError(body?.error || 'Erreur lors de l\'upload.')
        return
      }
      onUploaded(body.url)
      onClose()
    } catch {
      onError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <ProfileModal
      isOpen={isOpen}
      onClose={onClose}
      icon="success"
      title="Changer ma photo"
      description="Importez une photo depuis votre appareil ou prenez-en une nouvelle."
      isBlocking={uploading}
      actions={
        <>
          {/* Input caché : caméra direct (mobile) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            capture="user"
            onChange={handleFile}
            className="sr-only"
            aria-label="Prendre une photo"
          />
          {/* Input caché : galerie / fichiers */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            className="sr-only"
            aria-label="Choisir une photo"
          />
          <Button color="primary" size="md" onClick={openGallery} isLoading={uploading} isDisabled={uploading}>
            Choisir une photo
          </Button>
          <Button color="secondary" size="md" onClick={openCamera} isDisabled={uploading}>
            Prendre une photo
          </Button>
          <Button color="tertiary" size="md" onClick={onClose} isDisabled={uploading}>
            Annuler
          </Button>
        </>
      }
    />
  )
}
