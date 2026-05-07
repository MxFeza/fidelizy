'use client'

/**
 * useToast — hook minimal pour afficher des toasts sur les écrans client.
 * Rend un container fixed en haut, auto-dismiss 3s. Story 4.7 v2.
 */

import { useCallback, useEffect, useState } from 'react'
import Toast, { type ToastVariant } from './Toast'

export interface ToastOptions {
  variant: ToastVariant
  title: string
  message?: string
  /** Durée en ms. Default 3000. 0 = persistant (dismiss manuel). */
  duration?: number
}

interface ToastState extends ToastOptions {
  id: number
}

let nextId = 0

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((opts: ToastOptions) => {
    setToast({ ...opts, id: ++nextId })
  }, [])

  const clearToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!toast) return
    const duration = toast.duration ?? 3000
    if (duration <= 0) return
    const t = window.setTimeout(() => {
      setToast((cur) => (cur && cur.id === toast.id ? null : cur))
    }, duration)
    return () => window.clearTimeout(t)
  }, [toast])

  const node = toast ? (
    <div
      className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="pointer-events-auto w-full max-w-md">
        <Toast
          variant={toast.variant}
          title={toast.title}
          message={toast.message}
          onDismiss={clearToast}
        />
      </div>
    </div>
  ) : null

  return { toast: node, showToast, clearToast }
}
