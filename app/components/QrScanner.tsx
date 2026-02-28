'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface ScanResult {
  success: boolean
  message: string
  customerName?: string
}

interface QrScannerProps {
  onClose: () => void
  onSuccess: () => void
}

export default function QrScanner({ onClose, onSuccess }: QrScannerProps) {
  const [status, setStatus] = useState<'scanning' | 'processing' | 'done' | 'error'>('scanning')
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const scannerRef = useRef<{ isScanning: boolean; stop: () => Promise<void> } | null>(null)
  const scannedRef = useRef(false)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {})
    }
  }, [])

  const handleScan = useCallback(
    async (qrCodeId: string) => {
      if (scannedRef.current) return
      scannedRef.current = true
      await stopScanner()
      setStatus('processing')

      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_code_id: qrCodeId }),
        })
        const data = await res.json()

        if (data.success) {
          setStatus('done')
          setMessage(data.message)
          onSuccess()
        } else {
          setStatus('error')
          setErrorMsg(data.error || 'Erreur lors du scan')
        }
      } catch {
        setStatus('error')
        setErrorMsg('Erreur de connexion. Veuillez réessayer.')
      }
    },
    [stopScanner, onSuccess]
  )

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      scanner = new Html5Qrcode('qr-reader-container')
      scannerRef.current = scanner

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleScan,
          undefined
        )
        .catch(() => {
          setErrorMsg("Impossible d'accéder à la caméra. Vérifiez les permissions du navigateur.")
          setStatus('error')
        })
    })

    return () => {
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {})
      }
    }
  }, [handleScan])

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Scanner un client</h2>
          <button
            onClick={async () => {
              await stopScanner()
              onClose()
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Scanning state */}
          {status === 'scanning' && (
            <div>
              <div id="qr-reader-container" className="w-full rounded-xl overflow-hidden" />
              <p className="text-center text-sm text-gray-400 mt-3">
                Pointez la caméra vers le QR code du client
              </p>
            </div>
          )}

          {/* Processing state */}
          {status === 'processing' && (
            <div className="py-10 text-center">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Traitement en cours...</p>
            </div>
          )}

          {/* Success state */}
          {status === 'done' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-900 font-semibold text-lg">{message}</p>
              <button
                onClick={onClose}
                className="mt-5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">{errorMsg}</p>
              <button
                onClick={onClose}
                className="mt-5 px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
