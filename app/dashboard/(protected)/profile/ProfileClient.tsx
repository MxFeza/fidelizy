'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, LogOut } from 'lucide-react'

interface ProfileClientProps {
  email: string
  businessName: string
}

export default function ProfileClient({ email, businessName }: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // Email change
  const [emailOpen, setEmailOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password change
  const [pwOpen, setPwOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Logout
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-400 text-sm mt-0.5">{businessName}</p>
      </div>

      {/* Section 1 — Email */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Mail className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Adresse email</p>
            <p className="text-xs text-gray-400">{email}</p>
          </div>
        </div>

        {!emailOpen ? (
          <button
            onClick={() => { setEmailOpen(true); setEmailMsg(null) }}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Changer d&apos;email
          </button>
        ) : (
          <form onSubmit={handleEmailChange} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouvel email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nouveau@email.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            {emailMsg && (
              <p className={`text-sm font-medium ${emailMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {emailMsg.text}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setEmailOpen(false); setEmailMsg(null) }}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={emailLoading || !newEmail.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors"
              >
                {emailLoading ? 'Envoi...' : 'Confirmer'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Section 2 — Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Mot de passe</p>
        </div>

        {!pwOpen ? (
          <button
            onClick={() => { setPwOpen(true); setPwMsg(null) }}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Changer le mot de passe
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 caractères"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            {pwMsg && (
              <p className={`text-sm font-medium ${pwMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {pwMsg.text}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setPwOpen(false); setPwMsg(null) }}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={pwLoading || !newPassword || !confirmPassword}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors"
              >
                {pwLoading ? 'Mise à jour...' : 'Confirmer'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Section 3 — Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 md:p-6">
        <p className="text-sm font-semibold text-gray-900 mb-1">Déconnexion</p>
        <p className="text-xs text-gray-400 mb-4">Vous serez redirigé vers la page de connexion.</p>
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {logoutLoading ? 'Déconnexion...' : 'Se déconnecter'}
        </button>
      </div>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('email')) return "Adresse email invalide ou déjà utilisée."
  if (msg.includes('password')) return "Le mot de passe ne respecte pas les critères requis."
  if (msg.includes('rate')) return "Trop de tentatives. Réessayez dans quelques minutes."
  return `Erreur : ${msg}`
}
