'use client'

/**
 * Page Abonnement (Figma G1e — restauration 2026-05-01).
 *
 * Pendant le pilote, tous les commercants sont sur le plan "Starter — Gratuit".
 * L'ecran sert de structure officielle pour l'integration future Stripe.
 *
 * Design : layout flat avec champs en grid, boutons d'action en bas
 * (Annuler / Modifier mon abonnement). Pas de SettingsLayout ici car
 * la maquette Figma G1e a sa propre hierarchie visuelle plus simple
 * (validee par le user 2026-05-01).
 */

import { useState } from 'react'
import { Mail01, Clock, X as XIcon, CheckCircle, Lightning01 } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'

interface PlanClientProps {
  userEmail: string | null
}

export default function PlanClient({ userEmail }: PlanClientProps) {
  const [showFutureModal, setShowFutureModal] = useState(false)

  return (
    <div className="bg-primary min-h-full">
      <header className="border-b border-secondary">
        <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1080px] mx-auto">
          <h1 className="text-display-xs md:text-display-sm font-semibold text-primary">
            Abonnement
          </h1>
          <p className="text-sm md:text-md text-tertiary mt-1">
            Gérez facilement votre abonnement Izou.
          </p>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 md:py-12 max-w-[1080px] w-full mx-auto">
        <div className="flex flex-col gap-6 md:gap-8">
          {/* Bandeau pilote */}
          <div className="flex items-start gap-3 rounded-xl bg-brand-secondary ring-1 ring-brand px-4 md:px-5 py-4">
            <div className="size-9 rounded-lg bg-brand-solid flex items-center justify-center shrink-0">
              <CheckCircle className="size-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-secondary">Pilote — accès complet gratuit</p>
              <p className="text-sm text-tertiary mt-0.5">
                Vous bénéficiez de toutes les fonctionnalités d&apos;Izou sans engagement
                ni moyen de paiement requis. Vous serez prévenu·e bien à l&apos;avance lorsque
                les plans payants seront disponibles.
              </p>
            </div>
          </div>

          {/* Champs en grid flat (style Figma G1e) */}
          <div className="rounded-xl bg-primary ring-1 ring-secondary shadow-xs">
            <div className="p-4 md:p-6 flex flex-col gap-5">
              <FieldRow label="Abonnement actuel">
                <div className="grid grid-cols-2 gap-3">
                  <ReadOnlyInput value="Starter" />
                  <ReadOnlyInput value="Gratuit" />
                </div>
              </FieldRow>

              <FieldRow label="Email de facturation">
                <ReadOnlyInput value={userEmail ?? '—'} icon={Mail01} />
                <p className="text-xs text-tertiary mt-1.5">
                  Pour modifier cet email, allez dans <strong className="font-medium">Sécurité</strong>.
                </p>
              </FieldRow>

              <FieldRow label="Prochain renouvellement">
                <ReadOnlyInput
                  value="Aucun renouvellement prévu — plan gratuit"
                  icon={Clock}
                />
              </FieldRow>
            </div>
          </div>

          {/* Save bar : boutons d'action en bas (static, pas sticky — feedback user) */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
              size="md"
              color="secondary"
              isDisabled
            >
              Annuler
            </Button>
            <Button
              size="md"
              color="primary"
              onClick={() => setShowFutureModal(true)}
            >
              Modifier mon abonnement
            </Button>
          </div>
        </div>
      </main>

      {/* Modale "Plans payants bientôt" */}
      {showFutureModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setShowFutureModal(false)}
        >
          <div
            className="w-full md:max-w-md bg-primary rounded-t-2xl md:rounded-2xl p-5 md:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-brand-secondary flex items-center justify-center shrink-0">
                  <Lightning01 className="size-5 text-fg-brand-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-primary">Plans payants bientôt disponibles</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFutureModal(false)}
                aria-label="Fermer"
                className="size-9 rounded-full hover:bg-secondary transition-colors flex items-center justify-center text-fg-quaternary"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            <p className="text-sm text-tertiary leading-relaxed mb-4">
              Pendant le pilote, votre accès reste 100% gratuit avec toutes les fonctionnalités.
              Quand les plans payants arriveront, vous serez prévenu·e :
            </p>

            <ul className="space-y-2 text-sm text-secondary">
              <li className="flex items-start gap-2">
                <CheckCircle className="size-4 text-fg-brand-primary shrink-0 mt-0.5" />
                <span>Au moins <strong>30 jours à l&apos;avance</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="size-4 text-fg-brand-primary shrink-0 mt-0.5" />
                <span>Avec une <strong>tarification adaptée</strong> aux pilote</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="size-4 text-fg-brand-primary shrink-0 mt-0.5" />
                <span>Sans interruption de service</span>
              </li>
            </ul>

            <Button
              color="primary"
              size="md"
              className="w-full mt-5"
              onClick={() => setShowFutureModal(false)}
            >
              Compris
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6 items-start">
      <label className="text-sm font-semibold text-secondary md:pt-2.5">{label}</label>
      <div>{children}</div>
    </div>
  )
}

function ReadOnlyInput({
  value,
  icon: Icon,
}: {
  value: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg ring-1 ring-secondary bg-primary">
      {Icon && <Icon className="size-4 text-fg-quaternary shrink-0" />}
      <span className="text-md text-primary truncate">{value}</span>
    </div>
  )
}
