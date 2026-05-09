'use client'

/**
 * Bulle flottante "Envoyer un feedback" pour mobile client.
 *
 * Story 7.3 (2026-05-08) — clone du pattern merchant
 * components/dashboard/FeedbackBubble.tsx adapté au customer.
 *
 * Position : fixed bottom-20 right-4 (au-dessus de BottomTabBarClient h-16).
 * Visibilité : md:hidden (mobile uniquement).
 * Endpoint : POST /api/me/feedback (auth cookie SSR, rate-limit 3/h).
 *
 * Pour aider au debug, on préfixe le message avec [pathname] côté client.
 */

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageChatCircle, X as XIcon, CheckDone01 } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'

const MIN_LENGTH = 10
const MAX_LENGTH = 1000

export default function FeedbackBubbleClient() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = text.trim()
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_LENGTH

  async function handleSubmit() {
    if (trimmed.length < MIN_LENGTH) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/me/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `[${pathname}] ${trimmed}` }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error || 'Une erreur est survenue, réessayez.')
        return
      }
      setSent(true)
      setText('')
      setTimeout(() => {
        setSent(false)
        setOpen(false)
      }, 1800)
    } catch {
      setError('Erreur de connexion. Réessayez.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* FAB bubble — mobile only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Envoyer un feedback"
        className="md:hidden fixed bottom-20 right-4 z-40 size-12 rounded-full bg-brand-solid text-white shadow-lg flex items-center justify-center hover:bg-brand-solid_hover active:scale-95 transition-all"
        style={{
          marginBottom: 'env(safe-area-inset-bottom)',
          marginRight: 'env(safe-area-inset-right)',
        }}
      >
        <MessageChatCircle className="size-5" aria-hidden="true" />
      </button>

      {/* Bottom sheet modal */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 flex items-end"
          onClick={() => !sending && setOpen(false)}
        >
          <div
            className="w-full bg-primary rounded-t-2xl p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-primary">Une suggestion ? Un bug ?</h2>
                <p className="text-sm text-tertiary mt-0.5">
                  Aidez-nous à améliorer Izou.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !sending && setOpen(false)}
                aria-label="Fermer"
                className="size-9 rounded-full hover:bg-secondary transition-colors flex items-center justify-center text-fg-quaternary"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            {sent ? (
              <div className="py-8 flex flex-col items-center gap-2 text-center">
                <div className="size-12 rounded-full bg-success-secondary flex items-center justify-center">
                  <CheckDone01 className="size-6 text-success-primary" />
                </div>
                <p className="text-md font-semibold text-primary">Merci !</p>
                <p className="text-sm text-tertiary">Votre retour a bien été envoyé.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="Décrivez votre retour, votre idée ou le bug rencontré…"
                  rows={5}
                  maxLength={MAX_LENGTH}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-lg ring-1 ring-secondary bg-primary text-md text-primary placeholder:text-placeholder shadow-xs focus:outline-2 focus:outline-brand resize-none"
                />
                {(tooShort || error) && (
                  <p className="text-xs text-error-primary mt-1.5">
                    {error ?? `Encore ${MIN_LENGTH - trimmed.length} caractère${MIN_LENGTH - trimmed.length > 1 ? 's' : ''}.`}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    type="button"
                    size="md"
                    color="secondary"
                    isDisabled={sending}
                    className="flex-1"
                    onClick={() => { setText(''); setError(null); setOpen(false) }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    size="md"
                    color="primary"
                    isLoading={sending}
                    isDisabled={trimmed.length < MIN_LENGTH}
                    className="flex-1"
                    onClick={handleSubmit}
                  >
                    Envoyer
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
