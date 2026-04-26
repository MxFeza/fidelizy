'use client'

/**
 * AssetUploader — upload de logo ou banniere commercant.
 *
 * Logo : preview cercle, object-contain (preserve le ratio uploade — carre,
 * rectangle, ovale, etc.). Le ratio uploade est conserve PARTOUT dans l'app
 * (sidebar, cartes loyalty, Apple Wallet) pour eviter toute deformation.
 *
 * Banniere : preview ratio 3:1 paysage, object-cover (cadree au centre).
 */

import { useRef, useState } from 'react'
import { UploadCloud01, Trash01, AlertCircle, Image01, Loading01 } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { cx } from '@/utils/cx'

type Kind = 'logo' | 'banner'

interface AssetUploaderProps {
  kind: Kind
  currentUrl?: string | null
  /** Callback apres upload reussi avec l'URL publique. */
  onUploaded?: (url: string) => void
  /** Callback apres suppression reussie. */
  onDeleted?: () => void
  className?: string
}

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml'

const HINT: Record<Kind, { title: string; specs: string[]; help: string }> = {
  logo: {
    title: 'Logo de votre commerce',
    specs: [
      'PNG ou SVG avec fond transparent (recommandé)',
      'Taille minimum : 512×512 pixels',
      'Forme libre — carrée, ovale, asymétrique : votre logo s\'inscrira partout sans déformation',
    ],
    help: 'Sera affiché sur les cartes de fidélité, dans le menu de navigation et sur les pass Apple/Google Wallet.',
  },
  banner: {
    title: 'Bannière de profil',
    specs: [
      'JPG, PNG ou WebP',
      'Taille recommandée : 1500×500 pixels (ratio 3:1)',
      'Image cadrée au centre',
    ],
    help: 'Visible en haut de votre page entreprise.',
  },
}

export function AssetUploader({ kind, currentUrl, onUploaded, onDeleted, className }: AssetUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const hint = HINT[kind]

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('kind', kind)
      const res = await fetch('/api/business/upload-asset', { method: 'POST', body: fd })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? `Upload échoué (${res.status})`)
      onUploaded?.(body.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'upload.')
    } finally {
      setUploading(false)
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
      : 'aspect-[3/1] w-full rounded-lg bg-secondary flex items-center justify-center overflow-hidden ring-1 ring-secondary'

  const objectFit = kind === 'logo' ? 'object-contain p-3' : 'object-cover'

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

      <div className={kind === 'logo' ? 'flex items-start gap-4 sm:gap-6' : 'flex flex-col gap-3'}>
        <div className={previewBox}>
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt={hint.title}
              className={cx('w-full h-full', objectFit)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-tertiary">
              <Image01 className="size-6" />
              <span className="text-xs">Aucun {kind === 'logo' ? 'logo' : 'aperçu'}</span>
            </div>
          )}
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={cx(
            'flex-1 min-w-0',
            kind === 'banner' && 'min-w-full',
          )}
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
            <Button
              size="sm"
              color="link-destructive"
              iconLeading={Trash01}
              onClick={handleDelete}
              isDisabled={deleting}
              isLoading={deleting}
              className="mt-2"
            >
              Supprimer
            </Button>
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
    </div>
  )
}
