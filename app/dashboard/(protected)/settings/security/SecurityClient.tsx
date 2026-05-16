'use client'

/**
 * Securite (Story 8.1) — sous-page de Reglages.
 * Permet au commercant de changer son email, son mot de passe et de se deconnecter.
 *
 * Refonte 2026-04-27 : sur layout partage SettingsLayout pour uniformite
 * visuelle avec Mon entreprise / Abonnement / Confidentialite.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail01, Lock01, LogOut01, AlertCircle, CheckDone01, ShieldTick } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import { PasswordInput } from '@/components/ui/base/input/password-input'
import {
  SettingsPage, SettingsHeader, SettingsBody, SettingsSection,
} from '@/components/dashboard/SettingsLayout'
import { createClient } from '@/lib/supabase/client'

interface Msg {
  type: 'success' | 'error'
  text: string
}

interface SecurityClientProps {
  email: string
}

export default function SecurityClient({ email }: SecurityClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [emailOpen, setEmailOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMsg, setEmailMsg] = useState<Msg | null>(null)

  const [pwOpen, setPwOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<Msg | null>(null)

  const [logoutLoading, setLogoutLoading] = useState(false)

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    setEmailLoading(true)
    setEmailMsg(null)

    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) {
      setEmailMsg({ type: 'error', text: translateError(error.message) })
    } else {
      setEmailMsg({ type: 'success', text: 'Un email de confirmation a été envoyé à votre nouvelle adresse.' })
      setNewEmail('')
    }
    setEmailLoading(false)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)

    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
      return
    }

    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPwMsg({ type: 'error', text: translateError(error.message) })
    } else {
      setPwMsg({ type: 'success', text: 'Mot de passe mis à jour.' })
      setNewPassword('')
      setConfirmPassword('')
      setPwOpen(false)
    }
    setPwLoading(false)
  }

  async function handleLogout() {
    setLogoutLoading(true)
    await supabase.auth.signOut()
    router.push('/dashboard/login')
  }

  return (
    <SettingsPage>
      <SettingsHeader
        title="Sécurité"
        subtitle="Gérez votre email, mot de passe et session."
      />

      <SettingsBody>
        {/* Email */}
        <SettingsSection
          icon={Mail01}
          title="Adresse email"
          subtitle="Votre email sert pour la connexion et les communications administratives."
        >
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Email actuel</label>
            <div className="px-3.5 py-2.5 rounded-lg ring-1 ring-secondary bg-secondary text-md text-tertiary">
              {email}
            </div>
          </div>

          {!emailOpen ? (
            <div>
              <Button
                size="sm"
                color="secondary"
                onClick={() => { setEmailOpen(true); setEmailMsg(null) }}
              >
                Changer d&apos;email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEmailChange} className="flex flex-col gap-3">
              <Input
                label="Nouvel email"
                type="email"
                isRequired
                value={newEmail}
                onChange={setNewEmail}
                placeholder="nouveau@email.com"
              />
              {emailMsg && <FlashMessage msg={emailMsg} />}
              <div className="flex gap-3">
                <Button
                  size="sm"
                  color="secondary"
                  onClick={() => { setEmailOpen(false); setEmailMsg(null); setNewEmail('') }}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  type="submit"
                  isDisabled={emailLoading || !newEmail.trim()}
                  isLoading={emailLoading}
                >
                  Confirmer
                </Button>
              </div>
            </form>
          )}
        </SettingsSection>

        {/* Password */}
        <SettingsSection
          icon={Lock01}
          title="Mot de passe"
          subtitle="Choisissez un mot de passe d’au moins 8 caractères."
        >
          {!pwOpen ? (
            <div>
              <Button
                size="sm"
                color="secondary"
                onClick={() => { setPwOpen(true); setPwMsg(null) }}
              >
                Changer le mot de passe
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
              <PasswordInput
                label="Nouveau mot de passe"
                isRequired
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Min. 8 caractères"
              />
              <PasswordInput
                label="Confirmer le mot de passe"
                isRequired
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Retapez le mot de passe"
              />
              {pwMsg && <FlashMessage msg={pwMsg} />}
              <div className="flex gap-3">
                <Button
                  size="sm"
                  color="secondary"
                  onClick={() => { setPwOpen(false); setPwMsg(null); setNewPassword(''); setConfirmPassword('') }}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  type="submit"
                  isDisabled={pwLoading || !newPassword || !confirmPassword}
                  isLoading={pwLoading}
                >
                  Confirmer
                </Button>
              </div>
            </form>
          )}
        </SettingsSection>

        {/* Session */}
        <SettingsSection
          icon={ShieldTick}
          title="Session"
          subtitle="Vous serez redirigé vers la page de connexion."
        >
          <div>
            <Button
              size="sm"
              color="secondary-destructive"
              iconLeading={LogOut01}
              onClick={handleLogout}
              isDisabled={logoutLoading}
              isLoading={logoutLoading}
            >
              Se déconnecter
            </Button>
          </div>
        </SettingsSection>

      </SettingsBody>
    </SettingsPage>
  )
}

function FlashMessage({ msg }: { msg: Msg }) {
  const isOk = msg.type === 'success'
  const Icon = isOk ? CheckDone01 : AlertCircle
  return (
    <p className={`flex items-center gap-2 text-sm font-medium ${isOk ? 'text-success-primary' : 'text-error-primary'}`}>
      <Icon className="size-4 shrink-0" />
      <span>{msg.text}</span>
    </p>
  )
}

function translateError(msg: string): string {
  if (msg.includes('email')) return 'Adresse email invalide ou déjà utilisée.'
  if (msg.includes('password')) return 'Le mot de passe ne respecte pas les critères requis.'
  if (msg.includes('rate')) return 'Trop de tentatives. Réessayez dans quelques minutes.'
  return `Erreur : ${msg}`
}
