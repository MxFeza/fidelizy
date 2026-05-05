'use client'

/**
 * /me/profile/ProfileClient — page profil + actions RGPD.
 *
 * Story 4.7 P1. Permet au client de :
 *  - Voir et modifier son prénom
 *  - Voir (lecture seule) son téléphone et email
 *  - Exporter ses données (RGPD art. 20)
 *  - Supprimer son compte (RGPD art. 17)
 *  - Se déconnecter
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download01, Trash01, LogOut01 } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import { createClient } from '@/lib/supabase/client'

interface CustomerRecord {
  id: string
  first_name: string
  email: string | null
  phone: string | null
  created_at: string | null
}

interface ProfileClientProps {
  customer: CustomerRecord
}

export default function ProfileClient({ customer }: ProfileClientProps) {
  const router = useRouter()
  const [firstName, setFirstName] = useState(customer.first_name)
  const [editingName, setEditingName] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState('')
  const [nameSuccess, setNameSuccess] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    setNameError('')
    setNameSuccess(false)
    if (!firstName.trim()) {
      setNameError('Prénom requis.')
      return
    }
    if (firstName.trim() === customer.first_name) {
      setEditingName(false)
      return
    }
    setSavingName(true)
    try {
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setNameError(data?.error || 'Erreur lors de la mise à jour.')
        return
      }
      setNameSuccess(true)
      setEditingName(false)
      router.refresh()
    } catch {
      setNameError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setSavingName(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/me/export')
      if (!res.ok) {
        alert('Erreur lors de la génération de l\'export.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().slice(0, 10)
      const slug = customer.first_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      a.download = `izou-${slug}-${date}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    setDeleteError('')
    setDeleting(true)
    try {
      const res = await fetch('/api/me/delete', { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteError(data?.error || 'Erreur lors de la suppression.')
        return
      }
      // Compte supprimé : signOut + redirect home
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch {
      setDeleteError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/me')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <header className="sticky top-0 z-30 bg-primary border-b border-secondary">
        <div className="max-w-md mx-auto h-14 px-4 flex items-center gap-2">
          <Link
            href="/me"
            aria-label="Retour"
            className="size-10 -ml-2 rounded-full flex items-center justify-center text-secondary hover:bg-primary_hover transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <Image
            src="/izou-logo.svg"
            alt="Izou"
            width={64}
            height={20}
            priority
            className="h-5 w-auto"
          />
          <h1 className="ml-2 text-md font-semibold text-primary">Mon profil</h1>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-5 py-6 space-y-6">
        {/* Section infos */}
        <section className="bg-primary rounded-2xl border border-secondary p-5 space-y-4">
          <h2 className="text-md font-semibold text-primary">Mes informations</h2>

          {/* Prénom (éditable) */}
          {editingName ? (
            <form onSubmit={handleSaveName} noValidate className="space-y-3">
              <Input
                label="Prénom"
                placeholder="Votre prénom"
                value={firstName}
                onChange={(value) => { setFirstName(value); setNameError('') }}
                isInvalid={!!nameError}
                hint={nameError || undefined}
                autoFocus
                size="md"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  color="tertiary"
                  size="md"
                  className="flex-1"
                  isDisabled={savingName}
                  onClick={() => {
                    setFirstName(customer.first_name)
                    setNameError('')
                    setEditingName(false)
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  size="md"
                  className="flex-1"
                  isLoading={savingName}
                >
                  Enregistrer
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tertiary">Prénom</p>
                <p className="text-md font-medium text-primary">{customer.first_name}</p>
              </div>
              <Button
                type="button"
                color="tertiary"
                size="sm"
                onClick={() => { setEditingName(true); setNameSuccess(false) }}
              >
                Modifier
              </Button>
            </div>
          )}

          {nameSuccess && (
            <p className="text-sm text-success-primary">Prénom mis à jour.</p>
          )}

          {/* Téléphone (lecture seule) */}
          <div>
            <p className="text-sm text-tertiary">Téléphone</p>
            <p className="text-md font-medium text-primary">{customer.phone || '—'}</p>
          </div>

          {/* Email (lecture seule) */}
          <div>
            <p className="text-sm text-tertiary">Email</p>
            <p className="text-md font-medium text-primary break-all">
              {customer.email || '—'}
            </p>
          </div>
        </section>

        {/* Section confidentialité (RGPD) */}
        <section className="bg-primary rounded-2xl border border-secondary p-5 space-y-3">
          <h2 className="text-md font-semibold text-primary">Confidentialité</h2>
          <p className="text-sm text-tertiary">
            Vous pouvez exporter ou supprimer vos données à tout moment, conformément
            au RGPD.
          </p>

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              color="secondary"
              size="md"
              iconLeading={Download01}
              isLoading={exporting}
              className="w-full"
              onClick={handleExport}
            >
              Exporter mes données
            </Button>
            <Button
              type="button"
              color="primary-destructive"
              size="md"
              iconLeading={Trash01}
              className="w-full"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Supprimer mon compte
            </Button>
          </div>

          <p className="text-xs text-quaternary pt-2">
            <Link href="/privacy" className="underline hover:text-tertiary">
              Politique de confidentialité
            </Link>
          </p>
        </section>

        {/* Section session */}
        <section className="bg-primary rounded-2xl border border-secondary p-5">
          <Button
            type="button"
            color="tertiary"
            size="md"
            iconLeading={LogOut01}
            className="w-full"
            onClick={handleLogout}
          >
            Se déconnecter
          </Button>
        </section>
      </main>

      <footer className="py-6 text-center text-xs text-quaternary space-x-2">
        <Link href="/privacy" className="hover:text-tertiary underline">Confidentialité</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-tertiary underline">CGU</Link>
        <span>·</span>
        <Link href="/legal" className="hover:text-tertiary underline">Mentions légales</Link>
      </footer>

      {/* Modal confirmation suppression */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
        >
          <div
            className="w-full md:max-w-md bg-primary rounded-t-2xl md:rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            <div>
              <h3 className="text-lg font-bold text-primary">
                Supprimer définitivement votre compte ?
              </h3>
              <p className="text-sm text-tertiary mt-2">
                Cette action est <strong>irréversible</strong>. Toutes vos cartes de
                fidélité, votre historique et vos données personnelles seront supprimés.
                Les commerces que vous avez visités ne pourront plus vous identifier.
              </p>
            </div>

            {deleteError && (
              <p className="text-sm font-medium text-error-primary">{deleteError}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                color="tertiary"
                size="md"
                className="flex-1"
                isDisabled={deleting}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                color="primary-destructive"
                size="md"
                className="flex-1"
                isLoading={deleting}
                onClick={handleDelete}
              >
                Supprimer définitivement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
