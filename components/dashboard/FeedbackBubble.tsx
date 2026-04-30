'use client'

/**
 * Bulle flottante "Proposer une amelioration" pour mobile commercant.
 *
 * Ajoutee 2026-05-01 (decision user) : sur desktop, le lien est dans la
 * Sidebar. Sur mobile, la sidebar est cachee, il faut donc une bulle
 * persistante visible sur toutes les pages.
 *
 * Position : fixed bottom-20 right-4 (au-dessus de la BottomNav h-16).
 * Visibilite : md:hidden (mobile uniquement).
 */

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageChatCircle, X as XIcon, CheckDone01 } from '@untitledui/icons'

export default function FeedbackBubble() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit() {
    if (!text.trim()) return
    setSending(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), page: pathname }),
      })
      setSent(true)
      setText('')
      setTimeout(() => {
        setSent(false)
        setOpen(false)
      }, 1800)
    } catch {
      // Non-critical, silent fail
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
        aria-label="Proposer une amélioration"
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
                <h2 className="text-lg font-semibold text-primary">Proposer une amélioration</h2>
                <p className="text-sm text-tertiary mt-0.5">
                  Bug, idée, retour — votre feedback compte.
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
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Décrivez votre idée, ce qui ne fonctionne pas, ou ce qui pourrait être amélioré…"
                  rows={5}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-lg ring-1 ring-secondary bg-primary text-md text-primary placeholder:text-placeholder shadow-xs focus:outline-2 focus:outline-brand resize-none"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => { setText(''); setOpen(false) }}
                    disabled={sending}
                    className="flex-1 rounded-lg ring-1 ring-secondary bg-primary px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={sending || !text.trim()}
                    className="flex-1 rounded-lg bg-brand-solid hover:bg-brand-solid_hover px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Envoi…' : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
