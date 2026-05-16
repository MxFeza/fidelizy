'use client'

/**
 * AssetUploader — upload de logo, bannière ou image carte commerçant.
 *
 * Logo : preview cercle, object-contain (préserve le ratio uploadé). Pas de crop.
 * Banniere : preview ratio 3:1, crop forcé 3:1 via react-easy-crop.
 * Card : preview carrée, crop forcé 1:1 (sera affichée côté droit de la carte
 *        loyalty client via object-cover, ratio adapté automatiquement).
 */

import type { ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { UploadCloud01, Trash01, AlertCircle, Image01, Loading01, Crop01, Edit05, Camera01 } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { cx } from '@/utils/cx'

type Kind = 'logo' | 'banner' | 'card'
/**
 * Variant 'block' (defaut) : preview + zone d'upload textuelle + bloc HINT.
 * Variant 'overlay' (pattern LinkedIn) : preview seule, icône crayon flottante
 *   sur la preview pour éditer. Le bloc HINT est supprimé — les specs
 *   restent dans l'attribut `title` du bouton.
 */
type Variant = 'block' | 'overlay'

interface AssetUploaderProps {
  kind: Kind
  currentUrl?: string | null
  onUploaded?: (url: string) => void
  onDeleted?: () => void
  /** Override le preview par defaut (utilise pour montrer une vraie carte loyalty pour kind='card'). */
  cardPreview?: ReactNode
  className?: string
  /** Default 'block'. Use 'overlay' for LinkedIn-style hero (banner + logo). */
  variant?: Variant
}

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml'

const HINT: Record<Kind, { title: string; specs: string[]; help: string }> = {
  logo: {
    title: 'Logo de votre commerce',
    specs: [
      'PNG ou SVG avec fond transparent (recommandé)',
      'Taille minimum : 512×512 pixels',
      'Forme libre — votre logo s\'inscrira partout sans déformation',
    ],
    help: 'Affiché sur les cartes de fidélité, le menu de navigation et les pass Wallet.',
  },
  banner: {
    title: 'Bannière de profil',
    specs: [
      'JPG, PNG ou WebP',
      'Recadrage 3:1 — recommandé : 1500×500 pixels',
      'Recadrez votre image après l\'avoir importée',
    ],
    help: 'Visible en haut de votre fiche entreprise côté client.',
  },
  card: {
    title: 'Image de carte',
    specs: [
      'JPG, PNG ou WebP',
      'Recadrage paysage 2:1 — recommandé : 1200×600 pixels',
      'Une photo de votre commerce ou produit phare fonctionne bien',
    ],
    help: 'Affichée en bandeau sur la carte de fidélité de vos clients.',
  },
}

const CROP_RATIO: Partial<Record<Kind, number>> = {
  banner: 3 / 1,
  // Aligne sur la zone d'affichage `aspect-[2/1]` de LoyaltyCardVisual
  // (refonte carte 2026-05-13). Avant : 1, ce qui causait un crop centre
  // imprevisible quand l'image carree etait stretch en 2:1 via object-cover.
  card: 2 / 1,
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Impossible de lire l\'image'))
    img.src = src
  })
}

async function cropImageToBlob(src: string, area: Area): Promise<Blob> {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = area.width
  canvas.height = area.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponible')
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encodage de l\'image échoué'))),
      'image/jpeg',
      0.92,
    )
  })
}

export function AssetUploader({ kind, currentUrl, onUploaded, onDeleted, cardPreview, className, variant = 'block' }: AssetUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Crop state
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingSrc, setPendingSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)

  // DataURL de la photo originale (avant crop) gardée en mémoire pour
  // permettre le re-crop fidèle. Persiste tant que le composant est monté
  // (perdu au refresh — le user devra réuploader pour recadrer après).
  const [originalSrc, setOriginalSrc] = useState<string | null>(null)
  const [originalFileName, setOriginalFileName] = useState<string | null>(null)

  const hint = HINT[kind]
  const cropRatio = CROP_RATIO[kind]

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels)
  }, [])

  function resetCrop() {
    setPendingFile(null)
    setPendingSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedArea(null)
  }

  async function uploadBlob(blob: Blob, originalName: string) {
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', new File([blob], originalName, { type: blob.type || 'image/jpeg' }))
      fd.append('kind', kind)
      const res = await fetch('/api/business/upload-asset', { method: 'POST', body: fd })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? `Upload échoué (${res.status})`)
      onUploaded?.(body.url)
      resetCrop()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'upload.')
    } finally {
      setUploading(false)
    }
  }

  async function handleFile(file: File) {
    setError(null)
    if (cropRatio) {
      // Open crop modal — actual upload happens after user confirms
      try {
        const dataUrl = await fileToDataUrl(file)
        setPendingFile(file)
        setPendingSrc(dataUrl)
        // Mémorise l'original pour le re-crop fidèle plus tard
        setOriginalSrc(dataUrl)
        setOriginalFileName(file.name)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lecture du fichier impossible.')
      }
      return
    }
    // No crop required (logo) — upload direct
    await uploadBlob(file, file.name)
  }

  /** Réouvre le crop modal sur la photo ORIGINALE encore en mémoire. */
  function handleRecrop() {
    if (!originalSrc || !cropRatio) return
    setError(null)
    // Reset position/zoom pour repartir d'un crop neutre
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setPendingFile(new File([], originalFileName ?? 'recrop.jpg'))
    setPendingSrc(originalSrc)
  }

  async function handleConfirmCrop() {
    if (!pendingSrc || !croppedArea || !pendingFile) return
    try {
      const blob = await cropImageToBlob(pendingSrc, croppedArea)
      await uploadBlob(blob, pendingFile.name.replace(/\.[^.]+$/, '.jpg'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recadrage échoué.')
    }
  }

  async function handleDelete() {
    setError(null)
    setDeleting(true)
    try {
      const res = await fetch('/api/business/upload-asset', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? `Suppression échouée (${res.status})`)
      onDeleted?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression.')
    } finally {
      setDeleting(false)
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const previewBox =
    kind === 'logo'
      ? 'aspect-square w-32 sm:w-40 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-1 ring-secondary'
      : kind === 'banner'
      ? 'aspect-[3/1] w-full rounded-lg bg-secondary flex items-center justify-center overflow-hidden ring-1 ring-secondary'
      : 'aspect-square w-32 sm:w-40 rounded-lg bg-secondary flex items-center justify-center overflow-hidden ring-1 ring-secondary'

  const objectFit = kind === 'logo' ? 'object-contain p-3' : 'object-cover'

  // Crop modal partagé entre les 2 variants — extrait dans une variable pour éviter la duplication.
  const cropModal = pendingSrc && cropRatio && (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recadrer l'image"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="bg-white rounded-2xl p-5 w-full max-w-lg">
        <p className="text-sm font-semibold text-primary mb-1">Recadrez votre image</p>
        <p className="text-xs text-tertiary mb-3">Glissez pour repositionner, utilisez le slider pour zoomer.</p>
        <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden"
             style={{ aspectRatio: kind === 'card' ? '2 / 1' : '3 / 1' }}>
          <Cropper
            image={pendingSrc}
            crop={crop}
            zoom={zoom}
            aspect={cropRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid
            objectFit="cover"
          />
        </div>
        <label className="block mt-4">
          <span className="text-xs font-semibold text-secondary">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full mt-1 accent-brand"
            aria-label="Zoom"
          />
        </label>
        <div className="flex gap-2 mt-4">
          <Button color="secondary" onClick={resetCrop} isDisabled={uploading} className="flex-1">
            Annuler
          </Button>
          <Button color="primary" onClick={handleConfirmCrop} isLoading={uploading} className="flex-1">
            Recadrer et importer
          </Button>
        </div>
      </div>
    </div>
  )

  // ── Variant 'overlay' — pattern LinkedIn (bannière + logo en hero) ──
  if (variant === 'overlay') {
    const isLogo = kind === 'logo'
    return (
      <div className={cx('relative', isLogo ? 'inline-block' : 'w-full', className)}>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onInputChange}
          className="sr-only"
          aria-label={hint.title}
        />

        <div className={previewBox}>
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt={hint.title} className={cx('w-full h-full', objectFit)} />
          ) : (
            <div className="flex flex-col items-center gap-1 text-tertiary">
              {isLogo ? <Camera01 className="size-6" /> : <Image01 className="size-6" />}
              {!isLogo && <span className="text-xs">Aucune bannière</span>}
            </div>
          )}
        </div>

        {/* Boutons flottants en haut-droite — taille adaptée au logo (plus petit) */}
        <div className={cx(
          'absolute flex gap-1.5',
          isLogo ? 'bottom-1 right-1' : 'top-3 right-3',
        )}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            title={`${hint.title} — ${hint.specs.join(' · ')}`}
            aria-label={`Modifier ${hint.title.toLowerCase()}`}
            disabled={uploading || deleting}
            className={cx(
              'rounded-full bg-white shadow-md ring-1 ring-secondary flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50',
              isLogo ? 'size-7' : 'size-9',
            )}
          >
            {uploading ? (
              <Loading01 className={cx('animate-spin text-fg-quaternary', isLogo ? 'size-3.5' : 'size-4')} />
            ) : (
              <Edit05 className={cx('text-fg-quaternary', isLogo ? 'size-3.5' : 'size-4')} />
            )}
          </button>
          {currentUrl && !isLogo && (
            <button
              type="button"
              onClick={handleDelete}
              title="Supprimer la bannière"
              aria-label="Supprimer"
              disabled={uploading || deleting}
              className="size-9 rounded-full bg-white shadow-md ring-1 ring-secondary flex items-center justify-center hover:bg-error-primary hover:text-white text-error-primary transition-colors disabled:opacity-50"
            >
              {deleting ? <Loading01 className="size-4 animate-spin" /> : <Trash01 className="size-4" />}
            </button>
          )}
        </div>

        {error && (
          <p className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 text-xs font-medium text-white bg-error-primary/90 backdrop-blur rounded-md px-2 py-1.5">
            <AlertCircle className="size-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </p>
        )}

        {cropModal}
      </div>
    )
  }

  // ── Variant 'block' (default) — comportement historique ──
  return (
    <div className={cx('flex flex-col gap-3', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onInputChange}
        className="sr-only"
        aria-label={hint.title}
      />

      <div
        className={
          cardPreview
            ? 'flex flex-col gap-3'
            : kind === 'banner'
            ? 'flex flex-col gap-3'
            : 'flex items-start gap-4 sm:gap-6'
        }
      >
        {cardPreview ? (
          <div className="w-full">{cardPreview}</div>
        ) : (
          <div className={previewBox}>
            {currentUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUrl} alt={hint.title} className={cx('w-full h-full', objectFit)} />
            ) : (
              <div className="flex flex-col items-center gap-1 text-tertiary">
                <Image01 className="size-6" />
                <span className="text-xs">Aucun aperçu</span>
              </div>
            )}
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={cx('flex-1 min-w-0', kind === 'banner' && 'min-w-full')}
        >
          <div
            className={cx(
              'rounded-lg ring-1 px-4 py-4 transition-colors cursor-pointer',
              dragActive
                ? 'ring-2 ring-brand bg-brand-secondary'
                : 'ring-secondary bg-primary hover:bg-secondary',
            )}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
            aria-label={`Importer ${hint.title}`}
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-brand-secondary flex items-center justify-center shrink-0">
                {uploading ? (
                  <Loading01 className="size-4 text-fg-brand-primary animate-spin" />
                ) : (
                  <UploadCloud01 className="size-4 text-fg-brand-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary">
                  <span className="text-brand-secondary">Cliquer pour importer</span> ou glisser-déposer
                </p>
                <p className="text-xs text-tertiary mt-0.5">PNG, JPG, WebP{kind === 'logo' ? ' ou SVG' : ''}</p>
              </div>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-error-primary mt-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {currentUrl && (
            <div className="flex flex-wrap gap-3 mt-2">
              {originalSrc && cropRatio ? (
                <Button
                  size="sm"
                  color="tertiary"
                  iconLeading={Crop01}
                  onClick={handleRecrop}
                  isDisabled={uploading}
                >
                  Recadrer
                </Button>
              ) : null}
              <Button
                size="sm"
                color="link-destructive"
                iconLeading={Trash01}
                onClick={handleDelete}
                isDisabled={deleting}
                isLoading={deleting}
              >
                Supprimer
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-secondary px-4 py-3">
        <p className="text-xs font-semibold text-secondary mb-1">{hint.title}</p>
        <ul className="text-xs text-tertiary space-y-0.5">
          {hint.specs.map((s) => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
        <p className="text-xs text-tertiary mt-2 italic">{hint.help}</p>
      </div>

      {cropModal}
    </div>
  )
}
