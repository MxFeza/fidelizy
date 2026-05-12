'use client'

/**
 * /me/profile — ProfileClient refondu (Figma 2026-05-07).
 *
 * Form Prénom + Nom + Email (avec validation email)
 * + menu Réglages (5 items)
 * + logout (modal warning) + delete compte (2-step strict avec input "SUPPRIMER")
 * + toasts unifiés (success/info/error) via useToast.
 *
 * BottomTabBarClient nécessite un cardId — passé null si le client n'a pas
 * encore de carte active (cas edge : compte créé mais pas encore de scan).
 *
 * 2026-05-11 : retrait avatar + entrée card-customization (décision pré-pilote).
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail01,
  Bell01,
  Shield01,
  HelpCircle,
  MessageCircle01,
  Lock01,
  ChevronRight,
} from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import TopBarClient from '@/components/client/TopBarClient'
import BottomTabBarClient from '@/components/client/BottomTabBarClient'
import { useToast } from '@/components/client/ToastContainer'
import { createClient } from '@/lib/supabase/client'
import FeedbackModal from '@/components/client/profile/FeedbackModal'
import LogoutModal from '@/components/client/profile/LogoutModal'
import DeleteAccountStep1Modal from '@/components/client/profile/DeleteAccountStep1Modal'
import DeleteAccountStep2Modal from '@/components/client/profile/DeleteAccountStep2Modal'
import { cx } from '@/utils/cx'
import type { ProfileCustomer } from './page'

const APP_VERSION = '1.0.0'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type DeleteStep = 0 | 1 | 2

interface ProfileClientProps {
  customer: ProfileCustomer
  cardId: string | null
}

export default function ProfileClient({ customer, cardId }: ProfileClientProps) {
  const router = useRouter()
  const { toast, showToast } = useToast()

  const [firstName, setFirstName] = useState(customer.first_name)
  const [lastName, setLastName] = useState(customer.last_name ?? '')
  const [email, setEmail] = useState(customer.email ?? '')
  const [saving, setSaving] = useState(false)

  const [feedbackModal, setFeedbackModal] = useState(false)
  const [logoutModal, setLogoutModal] = useState(false)
  const [deleteStep, setDeleteStep] = useState<DeleteStep>(0)

  const dirty = useMemo(() => {
    return (
      firstName.trim() !== customer.first_name ||
      (lastName.trim() || null) !== (customer.last_name ?? null) ||
      (email.trim() || null) !== (customer.email ?? null)
    )
  }, [firstName, lastName, email, customer])

  const emailInvalid = email.trim().length > 0 && !EMAIL_REGEX.test(email.trim())

  function handleReset() {
    setFirstName(customer.first_name)
    setLastName(customer.last_name ?? '')
    setEmail(customer.email ?? '')
  }

  async function handleSave() {
    if (!firstName.trim()) {
      showToast({ variant: 'error', title: 'Prénom requis', message: 'Veuillez renseigner votre prénom.' })
      return
    }
    if (emailInvalid) {
      showToast({ variant: 'error', title: 'Email invalide', message: 'Veuillez vérifier le format.' })
      return
    }

    setSaving(true)
    try {
      // 1. Update profile (first_name + last_name)
      const profileChanged =
        firstName.trim() !== customer.first_name ||
        (lastName.trim() || null) !== (customer.last_name ?? null)
      if (profileChanged) {
        const res = await fetch('/api/me/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: firstName.trim(),
            last_name: lastName.trim() || null,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          showToast({ variant: 'error', title: 'Erreur', message: body?.error || 'Mise à jour impossible.' })
          return
        }
      }

      // 2. Update email (déclenche email confirmation Supabase)
      const emailChanged = (email.trim() || null) !== (customer.email ?? null)
      if (emailChanged && email.trim()) {
        const res = await fetch('/api/me/email-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ new_email: email.trim() }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) {
          showToast({ variant: 'error', title: 'Erreur', message: body?.error || 'Changement d\'email impossible.' })
          return
        }
        showToast({
          variant: 'info',
          title: 'Vérifiez votre boîte mail',
          message: 'Un lien de confirmation a été envoyé à la nouvelle adresse.',
          duration: 5000,
        })
      } else {
        showToast({
          variant: 'success',
          title: 'Profil enregistré',
          message: 'Vos informations ont été mises à jour.',
        })
      }

      router.refresh()
    } catch {
      showToast({ variant: 'error', title: 'Une erreur est survenue', message: 'Veuillez réessayer.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    showToast({ variant: 'info', title: 'Déconnecté', message: 'À bientôt sur Izou.' })
    router.push('/')
    router.refresh()
  }

  async function handleDelete() {
    try {
      const res = await fetch('/api/me/delete', { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        showToast({ variant: 'error', title: 'Erreur', message: body?.error || 'Suppression impossible.' })
        return
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch {
      showToast({ variant: 'error', title: 'Une erreur est survenue', message: 'Veuillez réessayer.' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {toast}
      <TopBarClient />

      <main className={cx('flex-1 max-w-md w-full mx-auto px-5 py-6 space-y-6', cardId && 'pb-24')}>
        {/* Header */}
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
          <p className="mt-1 text-sm text-gray-500">Gérez vos informations personnelles.</p>
        </header>

        {/* Form card */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <Input
            label="Prénom"
            value={firstName}
            onChange={setFirstName}
            placeholder="Votre prénom"
            size="md"
            isDisabled={saving}
          />
          <Input
            label="Nom"
            value={lastName}
            onChange={setLastName}
            placeholder="Votre nom (optionnel)"
            size="md"
            isDisabled={saving}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="vous@email.com"
            icon={Mail01}
            size="md"
            isDisabled={saving}
            isInvalid={emailInvalid}
            hint={emailInvalid ? 'Format d\'email invalide' : undefined}
          />

          {/* Form footer */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              color="secondary"
              size="md"
              onClick={handleReset}
              isDisabled={saving || !dirty}
            >
              Annuler
            </Button>
            <Button
              type="button"
              color="primary"
              size="md"
              onClick={handleSave}
              isLoading={saving}
              isDisabled={saving || !dirty || emailInvalid}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </section>

        {/* Section RÉGLAGES */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 tracking-wider uppercase px-1 mb-2">
            Réglages
          </h2>
          <ul className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            <MenuItemLink href="/me/profile/notifications" icon={Bell01} label="Notifications" />
            <MenuItemLink href="/me/profile/privacy" icon={Shield01} label="Confidentialité & données" />
            <MenuItemLink href="/me/profile/help" icon={HelpCircle} label="Aide & support" />
            <MenuItemButton onClick={() => setFeedbackModal(true)} icon={MessageCircle01} label="Envoyer un feedback" />
            <MenuItemLink href="/me/profile/security" icon={Lock01} label="Sécurité" />
          </ul>
        </section>

        {/* Logout + Delete + Version */}
        <div className="space-y-4 pt-2 text-center">
          <button
            type="button"
            onClick={() => setLogoutModal(true)}
            className="w-full text-md font-semibold text-gray-900 hover:text-gray-600 transition-colors py-1"
          >
            Se déconnecter
          </button>
          <button
            type="button"
            onClick={() => setDeleteStep(1)}
            className="w-full text-md font-semibold text-red-600 hover:text-red-700 transition-colors py-1"
          >
            Supprimer mon compte
          </button>
          <p className="text-xs text-gray-400 pt-2">Version {APP_VERSION} — Pilote</p>
          <div className="text-[11px] text-gray-400 space-x-2">
            <Link href="/privacy" className="hover:text-gray-500 underline">Confidentialité</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-gray-500 underline">CGU</Link>
            <span>·</span>
            <Link href="/legal" className="hover:text-gray-500 underline">Mentions légales</Link>
          </div>
        </div>
      </main>

      {cardId ? <BottomTabBarClient cardId={cardId} /> : null}

      {/* Modals */}
      <FeedbackModal
        isOpen={feedbackModal}
        onClose={() => setFeedbackModal(false)}
        onSent={() =>
          showToast({
            variant: 'success',
            title: 'Merci pour votre feedback !',
            message: 'Nous l\'avons bien reçu.',
          })
        }
        onError={(message) => showToast({ variant: 'error', title: 'Erreur', message })}
      />
      <LogoutModal
        isOpen={logoutModal}
        onClose={() => setLogoutModal(false)}
        onConfirm={handleLogout}
      />
      <DeleteAccountStep1Modal
        isOpen={deleteStep === 1}
        onClose={() => setDeleteStep(0)}
        onConfirm={() => setDeleteStep(2)}
      />
      <DeleteAccountStep2Modal
        isOpen={deleteStep === 2}
        onClose={() => setDeleteStep(0)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

interface MenuItemBaseProps {
  icon: React.ComponentType<React.HTMLAttributes<HTMLOrSVGElement>>
  label: string
}

function MenuItemContent({ icon: Icon, label }: MenuItemBaseProps) {
  return (
    <>
      <Icon className="size-5 text-gray-500 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-md font-medium text-gray-900 text-left">{label}</span>
      <ChevronRight className="size-4 text-gray-400 shrink-0" aria-hidden="true" />
    </>
  )
}

function MenuItemLink({ href, icon, label }: MenuItemBaseProps & { href: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors">
        <MenuItemContent icon={icon} label={label} />
      </Link>
    </li>
  )
}

function MenuItemButton({ onClick, icon, label }: MenuItemBaseProps & { onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
      >
        <MenuItemContent icon={icon} label={label} />
      </button>
    </li>
  )
}
