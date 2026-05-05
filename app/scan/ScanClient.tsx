'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from '@untitledui/icons'
import { PUBLIC_ASSETS } from '@/lib/assets'

type Status = 'starting' | 'scanning' | 'redirecting' | 'error'

/**
 * Extrait le shortCode d'un QR décodé. Le QR commerçant contient l'URL
 * complète `${BASE_URL}/join/{shortCode}` (cf. `lib/config.joinUrl`). On
 * accepte aussi un shortCode brut au cas où le QR aurait été imprimé
 * autrement.
 */
function extractShortCode(decoded: string): string | null {
  const trimmed = decoded.trim()
  if (!trimmed) return null

  const match = trimmed.match(/\/join\/([^/?#\s]+)/)
  if (match?.[1]) return decodeURIComponent(match[1])

  // Fallback : QR contenant juste le shortCode (alphanum + tirets/underscores)
  if (/^[A-Za-z0-9=_-]{4,32}$/.test(trimmed)) return trimmed

  return null
}

export default function ScanClient() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('starting')
  const [errorMessage, setErrorMessage] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null)
  const scannedRef = useRef(false)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {})
    }
  }, [])

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (scannedRef.current) return
      scannedRef.current = true
      await stopScanner()

      const shortCode = extractShortCode(decodedText)
      if (!shortCode) {
        setErrorMessage('QR code non reconnu. Demandez au commerçant de vous présenter son code.')
        setStatus('error')
        scannedRef.current = false
        return
      }

      setStatus('redirecting')
      router.push(`/join/${shortCode}`)
    },
    [router, stopScanner]
  )

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null

    import('html5-qrcode')
      .then(({ Html5Qrcode }) => {
        scanner = new Html5Qrcode('qr-scan-area')
        scannerRef.current = scanner

        scanner
          .start(
            { facingMode: 'environment' },
            {
              fps: 15,
              // qrbox responsive : prend la majorité du viewport vidéo pour
              // maximiser la chance de détection. La zone visuelle blanche
              // (border) couvre tout le container, mais la zone de scan
              // active utilise la taille effective de la vidéo.
              qrbox: (viewW: number, viewH: number) => {
                const minEdge = Math.min(viewW, viewH)
                const size = Math.floor(minEdge * 0.85)
                return { width: size, height: size }
              },
              aspectRatio: 1,
            },
            handleScan,
            undefined
          )
          .then(() => setStatus('scanning'))
          .catch(() => {
            setErrorMessage(
              "Impossible d'accéder à la caméra. Vérifiez les permissions du navigateur."
            )
            setStatus('error')
          })
      })
      .catch(() => {
        setErrorMessage('Erreur de chargement du scanner.')
        setStatus('error')
      })

    return () => {
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {})
      }
    }
  }, [handleScan])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="relative px-5 py-4 flex items-center justify-center">
        <Link
          href="/me"
          aria-label="Retour"
          className="absolute left-4 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Image
          src={PUBLIC_ASSETS.branding.logoBlanc}
          alt="Izou"
          width={80}
          height={24}
          priority
          className="h-6 w-auto"
        />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-6 gap-8">
        <div className="text-center space-y-1.5 max-w-xs">
          <h1 className="text-2xl font-bold">Scannez le QR code du commerce</h1>
        </div>

        {/* Scan area : video container + border overlay.
            html5-qrcode injecte un <video> element dans #qr-scan-area dont
            l'aspect-ratio est celui de la caméra (souvent 4:3). Sans
            object-cover, la vidéo apparaît letterboxée dans notre container
            carré (zone noire en bas) et le QR sort de la zone visible.
            On force la <video> à remplir le carré. */}
        <div className="relative size-[280px] sm:size-[300px]">
          <div
            id="qr-scan-area"
            className="absolute inset-0 size-full bg-black rounded-2xl overflow-hidden [&_video]:!size-full [&_video]:!object-cover"
          />
          <div
            className="absolute inset-0 size-full rounded-2xl border-2 border-white pointer-events-none"
            aria-hidden="true"
          />
        </div>

        <div className="text-center space-y-2 max-w-xs min-h-[60px]">
          {status === 'starting' && (
            <p className="text-sm text-gray-400">Initialisation de la caméra…</p>
          )}
          {status === 'scanning' && (
            <p className="text-sm text-gray-400">Placez le QR code dans le cadre</p>
          )}
          {status === 'redirecting' && (
            <p className="text-sm text-gray-400">Redirection…</p>
          )}
          {status === 'error' && (
            <>
              <p className="text-sm font-medium text-error-primary">
                {errorMessage}
              </p>
              <Link
                href="/me"
                className="inline-block mt-2 text-sm text-white underline hover:opacity-80"
              >
                Retour à mes cartes
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
