'use client'

import { useState, useEffect } from 'react'
import { Bell, Send } from 'lucide-react'

export default function NotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch('/api/push/broadcast')
      .then((res) => res.json())
      .then((data) => setSubscriberCount(data.count ?? 0))
      .catch(() => setSubscriberCount(0))
  }, [])

  async function handleSend() {
    setShowConfirm(false)
    setSending(true)

    try {
      const res = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setToast({ message: data.error || 'Erreur lors de l\'envoi', type: 'error' })
      } else {
        setToast({ message: `Notification envoyée à ${data.sent} client${data.sent > 1 ? 's' : ''} ✓`, type: 'success' })
        setTitle('')
        setBody('')
      }
    } catch {
      setToast({ message: 'Erreur réseau', type: 'error' })
    } finally {
      setSending(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0 && (subscriberCount ?? 0) > 0

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Envoyer une notification</h1>
          <p className="text-sm text-gray-500">
            {subscriberCount === null
              ? 'Chargement...'
              : `${subscriberCount} client${subscriberCount > 1 ? 's' : ''} abonné${subscriberCount > 1 ? 's' : ''} aux notifications`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="push-title" className="text-sm font-medium text-gray-700">
              Titre
            </label>
            <span className={`text-xs ${title.length > 50 ? 'text-red-500' : 'text-gray-400'}`}>
              {title.length}/50
            </span>
          </div>
          <input
            id="push-title"
            type="text"
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Offre spéciale du week-end"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="push-body" className="text-sm font-medium text-gray-700">
              Message
            </label>
            <span className={`text-xs ${body.length > 100 ? 'text-red-500' : 'text-gray-400'}`}>
              {body.length}/100
            </span>
          </div>
          <textarea
            id="push-body"
            maxLength={100}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ex: -20% sur tous les menus ce samedi !"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Preview */}
        {(title.trim() || body.trim()) && (
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Aperçu</p>
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {title.trim() || 'Titre'}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {body.trim() || 'Message'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Send button */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!canSend || sending}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Envoi en cours...' : 'Envoyer à tous mes clients'}
        </button>

        {subscriberCount === 0 && (
          <p className="text-xs text-center text-gray-400">
            Aucun client n&apos;a encore activé les notifications.
          </p>
        )}

        <p className="text-xs text-center text-gray-400">
          Limite : 5 envois par heure
        </p>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Confirmer l&apos;envoi</h2>
            <p className="text-sm text-gray-600">
              Vous allez notifier <span className="font-semibold">{subscriberCount}</span> client
              {(subscriberCount ?? 0) > 1 ? 's' : ''}. Confirmer ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
