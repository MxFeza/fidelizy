'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Business } from '@/lib/types'

const QrScanner = dynamic(() => import('@/app/components/QrScanner'), { ssr: false })

type RecentScan = {
  id: string
  type: string
  stamps_added: number | null
  points_added: number | null
  created_at: string
  loyalty_cards: {
    current_stamps: number
    current_points: number
    customers: { first_name: string; phone: string } | null
  } | null
}

interface DashboardClientProps {
  business: Business
  totalCustomers: number
  visitsToday: number
  recentScans: RecentScan[]
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateFull(dateString: string) {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return `Aujourd'hui à ${formatDate(dateString)}`
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Hier à ${formatDate(dateString)}`
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' à ' + formatDate(dateString)
}

type ManualModalState =
  | { status: 'idle' }
  | { status: 'processing' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export default function DashboardClient({
  business,
  totalCustomers,
  visitsToday,
  recentScans,
}: DashboardClientProps) {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [manualState, setManualState] = useState<ManualModalState>({ status: 'idle' })
  const [codeCopied, setCodeCopied] = useState(false)
  const router = useRouter()

  function copyShortCode() {
    navigator.clipboard.writeText(business.short_code ?? '')
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleScanSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  function openManual() {
    setManualInput('')
    setManualState({ status: 'idle' })
    setManualOpen(true)
  }

  function closeManual() {
    setManualOpen(false)
    if (manualState.status === 'success') router.refresh()
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qrCodeId = manualInput.trim()
    if (!qrCodeId) return
    setManualState({ status: 'processing' })
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code_id: qrCodeId }),
      })
      const data = await res.json()
      if (data.success) {
        setManualState({ status: 'success', message: data.message })
      } else {
        setManualState({ status: 'error', message: data.error ?? 'Erreur lors du traitement.' })
      }
    } catch {
      setManualState({ status: 'error', message: 'Erreur de connexion. Veuillez réessayer.' })
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
          <button
            onClick={openManual}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden sm:inline">Saisie manuelle</span>
            <span className="sm:hidden">Manuel</span>
          </button>
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-indigo-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0zM6 7h2v2H6V7zm10 0h2v2h-2V7zM6 15h2v2H6v-2z" />
            </svg>
            Scanner
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-8">
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 md:mb-2">Clients total</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{totalCustomers}</p>
          <p className="text-xs text-gray-400 mt-1 hidden sm:block">inscrits sur cette carte</p>
        </div>
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 md:mb-2">Visites aujourd&apos;hui</p>
          <p className="text-2xl md:text-3xl font-bold text-indigo-600">{visitsToday}</p>
          <p className="text-xs text-gray-400 mt-1 hidden sm:block">passages enregistrés</p>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 md:mb-2">Type de fidélité</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 capitalize">
            {business.loyalty_type === 'stamps' ? '🎫 Tampons' : '⭐ Points'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {business.loyalty_type === 'stamps'
              ? `${business.stamps_required} tampons requis`
              : `${business.points_per_euro} pts / €`}
          </p>
        </div>
      </div>

      {/* Short code + join link */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        {/* Short code */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Code commerce
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-3xl font-black text-gray-900 tracking-widest">
              {business.short_code ?? '—'}
            </span>
            <button
              onClick={copyShortCode}
              className="shrink-0 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              {codeCopied ? '✓ Copié' : 'Copier'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Vos clients entrent ce code sur{' '}
            <span className="font-medium text-gray-600">fidelizy.vercel.app</span>
          </p>
        </div>

        {/* Join link */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-indigo-900">Lien d&apos;inscription direct</p>
            <p className="text-xs text-indigo-500 mt-0.5 break-all">
              {typeof window !== 'undefined'
                ? `${window.location.origin}/join/${business.id}`
                : `/join/${business.id}`}
            </p>
          </div>
          <button
            onClick={() =>
              navigator.clipboard.writeText(`${window.location.origin}/join/${business.id}`)
            }
            className="self-start text-xs font-medium text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Copier le lien
          </button>
        </div>
      </div>

      {/* Recent scans */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm md:text-base">Derniers clients scannés</h2>
        </div>
        {recentScans.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">Aucun scan pour l'instant.</p>
            <p className="text-gray-300 text-xs mt-1">Les passages de vos clients apparaîtront ici.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recentScans.map((scan) => {
              const displayValue = business.loyalty_type === 'stamps'
                ? `+${scan.stamps_added ?? 0} tampon`
                : `+${scan.points_added ?? 0} pts`
              return (
                <li key={scan.id} className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-indigo-700 font-semibold text-sm">
                        {scan.loyalty_cards?.customers?.first_name?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {scan.loyalty_cards?.customers?.first_name ?? 'Client inconnu'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {scan.loyalty_cards?.customers?.phone ?? ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-600">{displayValue}</p>
                    <p className="text-xs text-gray-400">{formatDateFull(scan.created_at)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Scanner modal */}
      {scannerOpen && (
        <QrScanner
          onClose={() => setScannerOpen(false)}
          onSuccess={handleScanSuccess}
        />
      )}

      {/* Saisie manuelle modal */}
      {manualOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Saisie manuelle</h2>
              <button
                onClick={closeManual}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Idle / form state */}
              {manualState.status === 'idle' && (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Saisissez le code court du client (ex&nbsp;: <span className="font-mono font-semibold">A1B2-C3D4</span>) ou collez son identifiant QR complet.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Code fidélité
                    </label>
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      autoFocus
                      required
                      placeholder="Code court (ex: A1B2-C3D4) ou ID complet…"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeManual}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={!manualInput.trim()}
                      className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      Valider
                    </button>
                  </div>
                </form>
              )}

              {/* Processing state */}
              {manualState.status === 'processing' && (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Traitement en cours...</p>
                </div>
              )}

              {/* Success state */}
              {manualState.status === 'success' && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-semibold text-base">{manualState.message}</p>
                  <button
                    onClick={closeManual}
                    className="mt-5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              )}

              {/* Error state */}
              {manualState.status === 'error' && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium text-sm">{manualState.message}</p>
                  <div className="flex gap-3 mt-5 justify-center">
                    <button
                      onClick={() => setManualState({ status: 'idle' })}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Réessayer
                    </button>
                    <button
                      onClick={closeManual}
                      className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
