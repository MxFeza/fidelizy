'use client'

/**
 * /dashboard/settings/help — Aide & support commerçant.
 *
 * Pattern miroir de /me/profile/help (côté client) — same UX building blocks :
 *  - FAQ accordéon (questions commerçant adaptées)
 *  - Nous contacter (mailto + lien feedback)
 *  - Refaire la visite (déplacé depuis security/SecurityClient.tsx)
 *
 * Story 9.1 v3 : refactor sur retour user 2026-05-10 — l'Aide & support
 * n'avait rien à faire dans Sécurité, devait être une page dédiée comme côté
 * client. Ergonomie consolidée.
 */

import { useState } from 'react'
import {
  ChevronDown,
  Mail01,
  MessageCircle01,
  RefreshCw01,
  AlertCircle,
  CheckDone01,
  LifeBuoy01,
  Rocket01,
  Compass01,
} from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import {
  SettingsPage,
  SettingsHeader,
  SettingsBody,
  SettingsSection,
} from '@/components/dashboard/SettingsLayout'
import { cx } from '@/utils/cx'

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'Comment fonctionne mon programme de fidélité ?',
    answer:
      'Vous choisissez entre tampons (1 visite = 1 tampon) ou points (X points par euro dépensé). Vous définissez ensuite des paliers de récompense (ex : 10 visites = 1 boisson offerte). Le client scanne son QR à chaque passage, vous validez via votre tableau de bord.',
  },
  {
    question: 'Comment imprimer mon QR code ?',
    answer:
      'Sur le tableau de bord, dans la carte "Code commerce", cliquez sur "PDF". Le QR est généré au bon format pour être affiché en boutique. Imprimez-le, placez-le près de la caisse — vos clients pourront s\'inscrire en 5 secondes.',
  },
  {
    question: 'Comment ajouter un client manuellement ?',
    answer:
      'Si un client n\'arrive pas à scanner ou n\'a pas son téléphone, allez sur le dashboard > "Saisie manuelle". Vous pouvez ajouter ses informations (prénom, téléphone) et créer sa carte directement.',
  },
  {
    question: 'Comment modifier ou désactiver mon programme ?',
    answer:
      'Marketing > Fidélité : modifiez le type, les paliers, ou désactivez le programme. Vos clients existants conservent leur progression.',
  },
  {
    question: 'Pourquoi mon client n\'arrive pas à scanner ?',
    answer:
      'Vérifiez que votre QR code est bien affiché et lisible. Si le client a déjà une carte chez vous, demandez-lui de l\'ouvrir directement depuis Izou plutôt que de re-scanner. En cas de doute, utilisez la "Saisie manuelle" ou contactez-nous.',
  },
  {
    question: 'Puis-je voir l\'historique de mes campagnes push ?',
    answer:
      'Oui : Marketing > Push. Toutes vos campagnes envoyées sont listées avec le nombre de destinataires et la date d\'envoi. Vous pouvez aussi en réutiliser une comme modèle pour gagner du temps.',
  },
]

export default function HelpClient() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [resetLoading, setResetLoading] = useState<'onboarding' | 'tour' | null>(null)
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  /**
   * Reset complet onboarding (wizard 5 etapes) + redirect.
   * Refonte 2026-05-15 : POST { reset: true } reset onboarding_completed_at →
   * le layout protected redirige automatiquement vers /dashboard/onboarding au
   * mount, ce qui relance le wizard.
   */
  async function handleReplayOnboarding() {
    setResetLoading('onboarding')
    setResetMsg(null)
    setResetMsg({ type: 'success', text: 'Redirection vers l\'onboarding…' })
    try {
      const res = await fetch('/api/business/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      })
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Erreur ${res.status}`)
      }
      // Hard navigation : layout protected redirige vers /dashboard/onboarding.
      window.location.href = '/dashboard'
    } catch (err) {
      setResetMsg({
        type: 'error',
        text: err instanceof Error ? err.message : "Impossible de relancer l'onboarding. Réessayez plus tard.",
      })
      setResetLoading(null)
    }
  }

  /**
   * Relance uniquement la mini-tour post-onboarding (5 coachmarks) sans
   * refaire le wizard. Set le sessionStorage trigger + hard navigation.
   */
  function handleReplayTour() {
    setResetLoading('tour')
    setResetMsg({ type: 'success', text: 'Lancement de la visite guidée…' })
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('izou.post-onboarding-tour', '1')
      window.location.href = '/dashboard?tour=welcome'
    }
  }

  return (
    <SettingsPage>
      <SettingsHeader
        title="Aide & support"
        subtitle="Questions fréquentes, contact direct, et relancement de la visite guidée."
      />

      <SettingsBody>
        {/* 1. FAQ — accordéon */}
        <SettingsSection
          icon={LifeBuoy01}
          title="Questions fréquentes"
          subtitle="Les réponses aux questions les plus posées par les commerçants."
        >
          <ul className="rounded-xl border border-secondary bg-primary divide-y divide-secondary overflow-hidden">
            {FAQ.map((item, i) => {
              const open = openIndex === i
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    aria-expanded={open}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-primary_hover transition-colors"
                  >
                    <span className="flex-1 text-md font-medium text-primary">{item.question}</span>
                    <ChevronDown
                      className={cx('size-4 text-quaternary shrink-0 transition-transform', open && 'rotate-180')}
                      aria-hidden="true"
                    />
                  </button>
                  {open ? (
                    <div className="px-4 pb-4 -mt-1">
                      <p className="text-sm text-tertiary leading-relaxed">{item.answer}</p>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </SettingsSection>

        {/* 2. Nous contacter */}
        <SettingsSection
          icon={MessageCircle01}
          title="Nous contacter"
          subtitle="Vous ne trouvez pas la réponse ? Écrivez-nous."
        >
          <ul className="rounded-xl border border-secondary bg-primary divide-y divide-secondary overflow-hidden">
            <li>
              <a
                href="mailto:contact@izou.fr"
                className="flex items-center gap-3 px-4 py-4 hover:bg-primary_hover transition-colors"
              >
                <Mail01 className="size-5 text-quaternary shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-md font-medium text-primary">Envoyer un e-mail à l&apos;équipe</p>
                  <p className="text-xs text-tertiary mt-0.5">contact@izou.fr</p>
                </div>
              </a>
            </li>
          </ul>
        </SettingsSection>

        {/* 3. Refaire l'onboarding ou la mini-tour */}
        <SettingsSection
          icon={Rocket01}
          title="Refaire l'onboarding ou la visite"
          subtitle="Refaites l'onboarding complet pour reconfigurer ta carte, ou relance juste la mini-tour du dashboard."
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                color="secondary"
                iconLeading={RefreshCw01}
                onClick={handleReplayOnboarding}
                isDisabled={resetLoading !== null}
                isLoading={resetLoading === 'onboarding'}
              >
                Refaire l&apos;onboarding (5 étapes)
              </Button>
              <Button
                size="sm"
                color="tertiary"
                iconLeading={Compass01}
                onClick={handleReplayTour}
                isDisabled={resetLoading !== null}
                isLoading={resetLoading === 'tour'}
              >
                Relancer la mini-tour
              </Button>
            </div>
            <p className="text-xs text-tertiary">
              L&apos;onboarding complet te re-fait passer par les 5 étapes (Intro → Métier → Carte → Paliers → Aperçu).
              La mini-tour affiche juste les 5 coachmarks d&apos;orientation sur ton dashboard.
            </p>
            {resetMsg && (
              <p
                className={cx(
                  'flex items-center gap-2 text-sm font-medium',
                  resetMsg.type === 'success' ? 'text-success-primary' : 'text-error-primary',
                )}
              >
                {resetMsg.type === 'success' ? (
                  <CheckDone01 className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                <span>{resetMsg.text}</span>
              </p>
            )}
          </div>
        </SettingsSection>
      </SettingsBody>
    </SettingsPage>
  )
}
