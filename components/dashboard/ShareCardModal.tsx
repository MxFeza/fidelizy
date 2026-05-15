'use client'

import { useEffect, useState } from 'react'
import { Share04, Download01, Copy01, CheckDone01, X as XIcon } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { joinUrl } from '@/lib/config'

interface ShareCardModalProps {
  open: boolean
  onClose: () => void
  businessName: string
  shortCode: string | null
  businessId: string
}

export default function ShareCardModal({
  open,
  onClose,
  businessName,
  shortCode,
  businessId,
}: ShareCardModalProps) {
  const [copied, setCopied] = useState(false)
  const [bust, setBust] = useState(0)

  useEffect(() => {
    if (open) setBust(Date.now())
  }, [open])

  if (!open) return null

  const target = shortCode || businessId
  const shareCardUrl = `/api/share-card/${target}?v=${bust}`

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl(target))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard refuse */
    }
  }

  async function handleDownload() {
    try {
      const res = await fetch(`/api/share-card/${target}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('share-card fetch failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-izou.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1500)
    } catch (e) {
      console.error('[share] download failed', e)
    }
  }

  async function handleShareFile() {
    try {
      const res = await fetch(`/api/share-card/${target}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('share-card fetch failed')
      const blob = await res.blob()
      const file = new File([blob], `${businessName}.png`, { type: 'image/png' })
      const shareData: ShareData = {
        title: businessName,
        text: `Rejoignez le programme fidélité de ${businessName} sur Izou.`,
        url: joinUrl(target),
      }
      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        shareData.files = [file]
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await handleDownload()
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('[share] file failed', e)
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Partager ma fiche commerce"
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-primary rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-primary">Partager mon commerce</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="size-8 rounded-full flex items-center justify-center text-tertiary hover:bg-secondary"
          >
            <XIcon className="size-5" aria-hidden="true" />
          </button>
        </div>

        <p className="px-5 text-sm text-tertiary mb-4">
          Image prête à partager en story ou message. Le QR code intégré redirige vers la page d&apos;inscription de votre commerce.
        </p>

        <div className="mx-5 mb-4 rounded-2xl overflow-hidden ring-1 ring-secondary bg-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shareCardUrl}
            alt="Aperçu fiche partage"
            className="w-full h-auto block"
          />
        </div>

        <div className="px-5 pb-5 space-y-2.5">
          <Button
            type="button"
            size="md"
            color="primary"
            iconLeading={Share04}
            className="w-full"
            onClick={handleShareFile}
          >
            Partager l&apos;image
          </Button>
          <Button
            type="button"
            size="md"
            color="secondary"
            iconLeading={Download01}
            className="w-full"
            onClick={handleDownload}
          >
            Télécharger l&apos;image
          </Button>
          <Button
            type="button"
            size="md"
            color="tertiary"
            iconLeading={copied ? CheckDone01 : Copy01}
            className="w-full"
            onClick={handleCopyLink}
          >
            {copied ? 'Lien copié' : 'Copier le lien'}
          </Button>
        </div>
      </div>
    </div>
  )
}
