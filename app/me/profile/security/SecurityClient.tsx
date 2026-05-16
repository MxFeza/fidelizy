'use client'

import { useState } from 'react'
import { Mail01, Lock01, Monitor01, ChevronRight } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import SubScreenLayout, { Section, MenuList } from '@/components/client/profile/SubScreenLayout'
import ProfileModal from '@/components/client/profile/ProfileModal'
import { useToast } from '@/components/client/ToastContainer'

interface SecurityClientProps {
  currentEmail: string
  passwordUpdatedAt: string | null
  cardId: string | null
}

type ActiveModal = 'email' | 'password' | 'sessions' | null

export default function SecurityClient({ currentEmail, passwordUpdatedAt, cardId }: SecurityClientProps) {
  const { toast, showToast } = useToast()
  const [modal, setModal] = useState<ActiveModal>(null)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)

  function close() {
    if (busy) return
    setNewEmail('')
    setNewPassword('')
    setModal(null)
  }

  async function submitEmail() {
    if (!newEmail.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/me/email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_email: newEmail.trim() }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        showToast({ variant: 'error', title: 'Erreur', message: body?.error || 'Changement impossible.' })
        return
      }
      close()
      showToast({
        variant: 'info',
        title: 'Vérifiez votre boîte mail',
        message: 'Un lien de confirmation a été envoyé à la nouvelle adresse.',
        duration: 5000,
      })
    } catch {
      showToast({ variant: 'error', title: 'Une erreur est survenue', message: 'Veuillez réessayer.' })
    } finally {
      setBusy(false)
    }
  }

  async function submitPassword() {
    if (newPassword.length < 8) {
      showToast({ variant: 'error', title: 'Mot de passe trop court', message: 'Minimum 8 caractères.' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/me/password-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        showToast({ variant: 'error', title: 'Erreur', message: body?.error || 'Changement impossible.' })
        return
      }
      close()
      showToast({ variant: 'success', title: 'Mot de passe mis à jour' })
    } catch {
      showToast({ variant: 'error', title: 'Une erreur est survenue', message: 'Veuillez réessayer.' })
    } finally {
      setBusy(false)
    }
  }

  async function submitSessionsRevoke() {
    setBusy(true)
    try {
      const res = await fetch('/api/me/sessions/revoke', { method: 'POST' })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        showToast({ variant: 'error', title: 'Erreur', message: body?.error || 'Révocation impossible.' })
        return
      }
      close()
      showToast({ variant: 'success', title: 'Sessions révoquées', message: 'Les autres appareils ont été déconnectés.' })
    } catch {
      showToast({ variant: 'error', title: 'Une erreur est survenue', message: 'Veuillez réessayer.' })
    } finally {
      setBusy(false)
    }
  }

  const formattedPasswordDate = passwordUpdatedAt
    ? new Date(passwordUpdatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <SubScreenLayout title="Sécurité" cardId={cardId} toast={toast}>
      <Section title="Authentification">
        <MenuList>
          <li>
            <button
              type="button"
              onClick={() => setModal('email')}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <Mail01 className="size-5 text-gray-500 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-md font-medium text-gray-900">Changer mon e-mail</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{currentEmail}</p>
              </div>
              <ChevronRight className="size-4 text-gray-400 shrink-0" aria-hidden="true" />
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setModal('password')}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <Lock01 className="size-5 text-gray-500 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-md font-medium text-gray-900">Changer mon mot de passe</p>
                {formattedPasswordDate ? (
                  <p className="text-xs text-gray-500 mt-0.5">Dernière modification : {formattedPasswordDate}</p>
                ) : null}
              </div>
              <ChevronRight className="size-4 text-gray-400 shrink-0" aria-hidden="true" />
            </button>
          </li>
        </MenuList>
      </Section>

      <Section title="Appareils connectés">
        <MenuList>
          <li>
            <button
              type="button"
              onClick={() => setModal('sessions')}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <Monitor01 className="size-5 text-gray-500 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-md font-medium text-gray-900">Sessions actives</p>
                <p className="text-xs text-gray-500 mt-0.5">Gérer les appareils connectés</p>
              </div>
              <ChevronRight className="size-4 text-gray-400 shrink-0" aria-hidden="true" />
            </button>
          </li>
        </MenuList>
      </Section>

      {/* Email change modal */}
      <ProfileModal
        isOpen={modal === 'email'}
        onClose={close}
        icon="success"
        title="Changer mon e-mail"
        description="Vous recevrez un lien de confirmation sur la nouvelle adresse."
        isBlocking={busy}
        actions={
          <>
            <Button color="primary" size="md" onClick={submitEmail} isLoading={busy} isDisabled={busy || !newEmail.trim()}>
              Envoyer le lien
            </Button>
            <Button color="secondary" size="md" onClick={close} isDisabled={busy}>
              Annuler
            </Button>
          </>
        }
      >
        <Input
          label="Nouvel e-mail"
          type="email"
          value={newEmail}
          onChange={setNewEmail}
          placeholder="vous@email.com"
          icon={Mail01}
          size="md"
          isDisabled={busy}
        />
      </ProfileModal>

      {/* Password change modal */}
      <ProfileModal
        isOpen={modal === 'password'}
        onClose={close}
        icon="success"
        title="Changer mon mot de passe"
        description="Choisissez un nouveau mot de passe d'au moins 8 caractères."
        isBlocking={busy}
        actions={
          <>
            <Button color="primary" size="md" onClick={submitPassword} isLoading={busy} isDisabled={busy || newPassword.length < 8}>
              Mettre à jour
            </Button>
            <Button color="secondary" size="md" onClick={close} isDisabled={busy}>
              Annuler
            </Button>
          </>
        }
      >
        <Input
          label="Nouveau mot de passe"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="••••••••"
          icon={Lock01}
          size="md"
          isDisabled={busy}
        />
      </ProfileModal>

      {/* Sessions revoke modal */}
      <ProfileModal
        isOpen={modal === 'sessions'}
        onClose={close}
        icon="warning"
        title="Déconnecter les autres appareils ?"
        description="Toutes les sessions ouvertes sur d'autres appareils seront fermées. Vous resterez connecté sur celui-ci."
        isBlocking={busy}
        actions={
          <>
            <Button color="primary" size="md" onClick={submitSessionsRevoke} isLoading={busy} isDisabled={busy}>
              Déconnecter les autres appareils
            </Button>
            <Button color="secondary" size="md" onClick={close} isDisabled={busy}>
              Annuler
            </Button>
          </>
        }
      />
    </SubScreenLayout>
  )
}
