'use client'

/**
 * Confidentialite (Story 8.1+8.2+8.3) — sous-page de Reglages.
 *
 * - Liens documents legaux (CGU, politique, mentions)
 * - Export RGPD via /api/account/export (ZIP de CSVs)
 * - Suppression compte via /api/account/delete (cascade FK Supabase)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download01, Trash01, AlertTriangle, FileShield02, ArrowUpRight, Loading01 } from '@untitledui/icons'
import { Dialog, Modal, ModalOverlay } from '@/components/ui/application/modals/modal'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import { createClient } from '@/lib/supabase/client'

type DeleteStep = 'closed' | 'confirm' | 'typing'

interface PrivacyClientProps {
  businessName: string
}

export default function PrivacyClient({ businessName }: PrivacyClientProps) {
  const router = useRouter()

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const [deleteStep, setDeleteStep] = useState<DeleteStep>('closed')
  const [confirmText, setConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleExport() {
    setExporting(true)
    setExportError(null)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Export impossible (${res.status})`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Extraire le filename depuis Content-Disposition si dispo
      const cd = res.headers.get('Content-Disposition') ?? ''
      const match = cd.match(/filename="?([^"]+)"?/)
      a.download = match ? match[1] : `izou-export-${new Date().toISOString().slice(0, 10)}.zip`

      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Erreur lors de l\'export.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (confirmText !== 'SUPPRIMER') return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Erreur lors de la suppression.')

      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/dashboard/login')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erreur de connexion.')
      setDeleteLoading(false)
    }
  }

  function closeDelete() {
    setDeleteStep('closed')
    setConfirmText('')
    setDeleteError(null)
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-display-xs font-semibold text-primary">Confidentialité</h1>
        <p className="text-sm text-tertiary mt-1">Vos données et vos droits RGPD.</p>
      </div>

      <div className="space-y-4">
        {/* Documents legaux */}
        <section className="bg-primary rounded-xl ring-1 ring-secondary shadow-xs p-5 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-9 rounded-lg bg-brand-secondary flex items-center justify-center">
              <FileShield02 className="size-4 text-fg-brand-primary" />
            </div>
            <p className="text-sm font-semibold text-primary">Documents légaux</p>
          </div>
          <ul className="space-y-2">
            {[
              { href: '/privacy', label: 'Politique de confidentialité' },
              { href: '/terms', label: 'Conditions d\'utilisation' },
              { href: '/legal', label: 'Mentions légales' },
            ].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-secondary hover:text-brand-secondary_hover underline-offset-2 hover:underline"
                >
                  {item.label}
                  <ArrowUpRight className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Export RGPD */}
        <section className="bg-primary rounded-xl ring-1 ring-secondary shadow-xs p-5 md:p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-lg bg-brand-secondary flex items-center justify-center">
              <Download01 className="size-4 text-fg-brand-primary" />
            </div>
            <p className="text-sm font-semibold text-primary">Exporter mes données</p>
          </div>
          <p className="text-sm text-tertiary mb-4">
            Téléchargez l&apos;ensemble des données de <strong className="font-medium text-secondary">{businessName}</strong> :
            informations du commerce, clients, transactions, paliers et parrainages, au format CSV (ZIP).
          </p>
          {exportError && (
            <p className="text-sm text-error-primary mb-3">{exportError}</p>
          )}
          <Button
            size="sm"
            color="secondary"
            iconLeading={exporting ? Loading01 : Download01}
            onClick={handleExport}
            isDisabled={exporting}
          >
            {exporting ? 'Préparation…' : 'Télécharger l\'archive'}
          </Button>
        </section>

        {/* Suppression compte (zone danger) */}
        <section className="bg-primary rounded-xl ring-1 ring-error_subtle shadow-xs p-5 md:p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-lg bg-error-primary flex items-center justify-center">
              <Trash01 className="size-4 text-fg-error-primary" />
            </div>
            <p className="text-sm font-semibold text-primary">Supprimer mon compte</p>
          </div>
          <p className="text-sm text-tertiary mb-4">
            Cette action est <strong className="font-medium text-secondary">irréversible</strong>.
            Toutes les données du commerce, clients, cartes, transactions et récompenses
            seront définitivement supprimées.
          </p>
          <Button
            size="sm"
            color="primary-destructive"
            iconLeading={Trash01}
            onClick={() => setDeleteStep('confirm')}
          >
            Supprimer mon compte
          </Button>
        </section>
      </div>

      {/* Modale suppression — Step 1 (consequences) */}
      <ModalOverlay isOpen={deleteStep === 'confirm'} onOpenChange={(o) => !o && closeDelete()}>
        <Modal>
          <Dialog>
            <div className="bg-primary rounded-xl shadow-xl ring-1 ring-secondary max-w-md w-full p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="size-10 rounded-full bg-error-primary flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-5 text-fg-error-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-primary mb-1">Supprimer définitivement ce compte ?</h2>
                  <p className="text-sm text-tertiary">
                    Vous perdrez l&apos;accès à <strong className="font-medium text-secondary">{businessName}</strong> et
                    toutes les données associées seront supprimées :
                  </p>
                </div>
              </div>

              <ul className="text-sm text-tertiary space-y-1.5 mb-5 ml-14 list-disc">
                <li>Vos clients et leurs cartes de fidélité</li>
                <li>L&apos;historique des transactions et récompenses</li>
                <li>Les parrainages et leurs bonus</li>
                <li>La configuration du programme</li>
              </ul>

              <p className="text-sm text-tertiary mb-5">
                Avant de continuer, pensez à <Button color="link-color" size="sm" onClick={() => { closeDelete(); handleExport() }}>exporter vos données</Button>.
              </p>

              <div className="flex gap-3 justify-end">
                <Button size="sm" color="secondary" onClick={closeDelete}>
                  Annuler
                </Button>
                <Button size="sm" color="primary-destructive" onClick={() => setDeleteStep('typing')}>
                  Continuer
                </Button>
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>

      {/* Modale suppression — Step 2 (taper SUPPRIMER) */}
      <ModalOverlay isOpen={deleteStep === 'typing'} onOpenChange={(o) => !o && closeDelete()}>
        <Modal>
          <Dialog>
            <div className="bg-primary rounded-xl shadow-xl ring-1 ring-secondary max-w-md w-full p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="size-10 rounded-full bg-error-primary flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-5 text-fg-error-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-primary mb-1">Confirmation finale</h2>
                  <p className="text-sm text-tertiary">
                    Tapez <strong className="font-mono font-semibold text-error-primary">SUPPRIMER</strong> ci-dessous pour confirmer.
                  </p>
                </div>
              </div>

              <div className="ml-14 space-y-3">
                <Input
                  value={confirmText}
                  onChange={(v) => setConfirmText(v.toUpperCase())}
                  placeholder="SUPPRIMER"
                  isDisabled={deleteLoading}
                />
                {deleteError && (
                  <p className="text-sm text-error-primary">{deleteError}</p>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-5">
                <Button size="sm" color="secondary" onClick={closeDelete} isDisabled={deleteLoading}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  color="primary-destructive"
                  iconLeading={Trash01}
                  isDisabled={confirmText !== 'SUPPRIMER' || deleteLoading}
                  isLoading={deleteLoading}
                  onClick={handleDelete}
                >
                  Supprimer définitivement
                </Button>
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  )
}
