'use client'

/**
 * FeedbackModal — modal "Envoyer un feedback".
 * Story 4.7 v2 — POST /api/me/feedback. Textarea 10-1000 chars.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/base/buttons/button'
import ProfileModal from './ProfileModal'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSent: () => void
  onError: (message: string) => void
}

export default function FeedbackModal({ isOpen, onClose, onSent, onError }: FeedbackModalProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    const trimmed = message.trim()
    if (trimmed.length < 10) {
      onError('Le message doit faire au moins 10 caractères.')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/me/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        onError(body?.error || 'Erreur lors de l\'envoi.')
        return
      }
      setMessage('')
      onSent()
      onClose()
    } catch {
      onError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setSending(false)
    }
  }

  function handleClose() {
    if (sending) return
    setMessage('')
    onClose()
  }

  return (
    <ProfileModal
      isOpen={isOpen}
      onClose={handleClose}
      icon="success"
      title="Envoyer un feedback"
      description="Aidez-nous à améliorer Izou. Votre avis est précieux."
      isBlocking={sending}
      actions={
        <>
          <Button color="primary" size="md" onClick={handleSend} isLoading={sending} isDisabled={sending || message.trim().length < 10}>
            Envoyer
          </Button>
          <Button color="secondary" size="md" onClick={handleClose} isDisabled={sending}>
            Annuler
          </Button>
        </>
      }
    >
      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Dites-nous ce que vous pensez d'Izou..."
          rows={4}
          maxLength={1000}
          disabled={sending}
          aria-label="Message de feedback"
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-md text-gray-900 placeholder:text-gray-400 outline-none ring-0 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-gray-50 resize-none"
        />
        <p className="mt-1 text-xs text-gray-400 text-right">{message.length}/1000</p>
      </div>
    </ProfileModal>
  )
}
