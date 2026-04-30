import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CoinsStacked01, Mail01, Clock, CheckCircle, InfoCircle } from '@untitledui/icons'
import {
  SettingsPage, SettingsHeader, SettingsBody, SettingsSection,
} from '@/components/dashboard/SettingsLayout'

/**
 * Abonnement (Story 8.1) — implementation conforme Figma G1e (10241:980).
 *
 * Pendant le pilote, tous les commercants sont sur le plan "Pilote — Gratuit".
 * Aucun moyen de paiement n'est demande. Les plans payants seront introduits
 * post-pilote ; cet ecran sert deja de structure officielle pour faciliter
 * l'integration future (Stripe, etc.).
 *
 * Refonte 2026-04-27 : sur layout partage SettingsLayout pour uniformite.
 */
export default async function PlanPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  return (
    <SettingsPage>
      <SettingsHeader
        title="Abonnement"
        subtitle="Gérez facilement votre abonnement Izou."
      />

      <SettingsBody>
        {/* Banniere : pilote gratuit */}
        <div className="flex items-start gap-3 rounded-xl bg-brand-secondary ring-1 ring-brand px-5 py-4">
          <div className="size-9 rounded-lg bg-brand-solid flex items-center justify-center shrink-0">
            <CheckCircle className="size-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-secondary">Pilote — Gratuit</p>
            <p className="text-sm text-tertiary mt-0.5">
              Vous bénéficiez de toutes les fonctionnalités d&apos;Izou pendant le pilote, sans engagement
              ni moyen de paiement requis. Vous serez prévenu·e bien à l&apos;avance lorsque les plans
              payants seront disponibles.
            </p>
          </div>
        </div>

        {/* Section : Abonnement actuel */}
        <SettingsSection
          icon={CoinsStacked01}
          title="Abonnement actuel"
          subtitle="Votre plan en cours et son statut."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField label="Plan" value="Pilote" />
            <ReadOnlyField label="Type" value="Gratuit" />
          </div>
        </SettingsSection>

        {/* Section : Email de facturation */}
        <SettingsSection
          icon={Mail01}
          title="Email de facturation"
          subtitle="Cet email sera utilisé pour les futures factures."
        >
          <ReadOnlyField label="Email" value={user.email ?? '—'} icon={Mail01} />
          <p className="text-xs text-tertiary">
            Pour modifier cet email, allez dans <strong className="font-medium">Sécurité</strong>.
          </p>
        </SettingsSection>

        {/* Section : Prochain renouvellement */}
        <SettingsSection
          icon={Clock}
          title="Prochain renouvellement"
          subtitle="Date de renouvellement de votre abonnement."
        >
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-lg ring-1 ring-secondary bg-secondary">
            <InfoCircle className="size-5 text-fg-quaternary shrink-0" />
            <p className="text-sm text-tertiary">
              Aucun renouvellement prévu — vous êtes sur le plan gratuit du pilote.
            </p>
          </div>
        </SettingsSection>
      </SettingsBody>
    </SettingsPage>
  )
}

function ReadOnlyField({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-secondary mb-1.5">{label}</label>
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg ring-1 ring-secondary bg-secondary">
        {Icon && <Icon className="size-4 text-fg-quaternary shrink-0" />}
        <span className="text-md text-primary truncate">{value}</span>
      </div>
    </div>
  )
}
