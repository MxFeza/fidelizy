'use client'

/**
 * Securite (Story 8.1) — sous-page de Reglages.
 * Permet au commercant de changer son email, son mot de passe et de se deconnecter.
 * Logique extraite de l'ancien /dashboard/profile (deprecie).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail01, Lock01, LogOut01, AlertCircle, CheckDone01 } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import { PasswordInput } from '@/components/ui/base/input/password-input'
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
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-display-xs font-semibold text-primary">Sécurité</h1>
        <p className="text-sm text-tertiary mt-1">Gérez votre email, mot de passe et session.</p>
      </div>

      <div className="space-y-4">
        {/* Email */}
        <section className="bg-primary rounded-xl ring-1 ring-secondary shadow-xs p-5 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-9 rounded-lg bg-brand-secondary flex items-center justify-center">
              <Mail01 className="size-4 text-fg-brand-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">Adresse email</p>
              <p className="text-xs text-tertiary truncate">{email}</p>
            </div>
          </div>

          {!emailOpen ? (
            <Button
              size="sm"
              color="link-color"
              onClick={() => { setEmailOpen(true); setEmailMsg(null) }}
            >
              Changer d&apos;email
            </Button>
          ) : (
            <form onSubmit={handleEmailChange} className="space-y-3">
              <Input
                label="Nouvel email"
                type="email"
                isRequired
                value={newEmail}
                onChange={setNewEmail}
                placeholder="nouveau@email.com"
              />
              {emailMsg && (
                <FlashMessage msg={emailMsg} />
              )}
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
        </section>

        {/* Password */}
        <section className="bg-primary rounded-xl ring-1 ring-secondary shadow-xs p-5 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-9 rounded-lg bg-brand-secondary flex items-center justify-center">
              <Lock01 className="size-4 text-fg-brand-primary" />
            </div>
            <p className="text-sm font-semibold text-primary">Mot de passe</p>
          </div>

          {!pwOpen ? (
            <Button
              size="sm"
              color="link-color"
              onClick={() => { setPwOpen(true); setPwMsg(null) }}
            >
              Changer le mot de passe
            </Button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-3">
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
        </section>

        {/* Session */}
        <section className="bg-primary rounded-xl ring-1 ring-secondary shadow-xs p-5 md:p-6">
          <p className="text-sm font-semibold text-primary mb-1">Déconnexion</p>
          <p className="text-xs text-tertiary mb-4">Vous serez redirigé vers la page de connexion.</p>
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
        </section>
      </div>
    </div>
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
