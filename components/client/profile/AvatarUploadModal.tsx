'use client'

/**
 * AvatarUploadModal — modal "Changer ma photo".
 * Story 4.7 v2 — upload direct via input file capture="user".
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
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  function pickFile() {
    inputRef.current?.click()
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
      description="Choisissez comment mettre à jour votre photo de profil."
      isBlocking={uploading}
      actions={
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            capture="user"
            onChange={handleFile}
            className="sr-only"
            aria-label="Photo de profil"
          />
          <Button color="primary" size="md" onClick={pickFile} isLoading={uploading} isDisabled={uploading}>
            Prendre une photo
          </Button>
          <Button color="secondary" size="md" onClick={onClose} isDisabled={uploading}>
            Annuler
          </Button>
        </>
      }
    />
  )
}
