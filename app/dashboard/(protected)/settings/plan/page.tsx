import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CoinsStacked01, Mail01, Clock, CheckCircle, InfoCircle } from '@untitledui/icons'

/**
 * Abonnement (Story 8.1) — implementation conforme Figma G1e (10241:980).
 *
 * Pendant le pilote, tous les commercants sont sur le plan "Pilote — Gratuit".
 * Aucun moyen de paiement n'est demande. Les plans payants seront introduits
 * post-pilote ; cet ecran sert deja de structure officielle pour faciliter
 * l'integration future (Stripe, etc.).
 */
export default async function PlanPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  return (
    <div className="px-4 md:px-8 py-6 md:py-12 flex flex-col gap-8 md:gap-12 max-w-[1080px] w-full mx-auto bg-secondary min-h-full">
      <div>
        <h1 className="text-display-xs md:text-display-sm font-semibold text-primary">Abonnement</h1>
        <p className="text-sm md:text-md text-tertiary mt-1">Gérez facilement votre abonnement Izou.</p>
      </div>

      {/* Banniere : pilote gratuit */}
      <div className="flex items-start gap-3 rounded-xl bg-brand-secondary ring-1 ring-brand_subtle px-5 py-4">
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
      <PlanSection
        title="Abonnement actuel"
        icon={CoinsStacked01}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyField label="Plan" value="Pilote" />
          <ReadOnlyField label="Type" value="Gratuit" />
        </div>
      </PlanSection>

      <Divider />

      {/* Section : Email de facturation */}
      <PlanSection
        title="Email de facturation"
        icon={Mail01}
      >
        <ReadOnlyField label="Email" value={user.email ?? '—'} icon={Mail01} />
        <p className="text-xs text-tertiary">
          Cet email sera utilisé pour les futures factures. Vous pouvez le modifier dans <strong className="font-medium">Sécurité</strong>.
        </p>
      </PlanSection>

      <Divider />

      {/* Section : Prochain renouvellement */}
      <PlanSection
        title="Prochain renouvellement"
        icon={Clock}
      >
        <div className="flex items-center gap-3 px-3.5 py-3 rounded-lg ring-1 ring-secondary bg-secondary">
          <InfoCircle className="size-5 text-fg-quaternary shrink-0" />
          <p className="text-sm text-tertiary">
            Aucun renouvellement prévu — vous êtes sur le plan gratuit du pilote.
          </p>
        </div>
      </PlanSection>
    </div>
  )
}

function PlanSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 md:gap-8">
      <div className="flex md:flex-col items-start gap-3">
        <div className="size-9 rounded-lg bg-brand-secondary flex items-center justify-center shrink-0">
          <Icon className="size-4 text-fg-brand-primary" />
        </div>
        <h2 className="text-sm font-semibold text-secondary">{title}</h2>
      </div>
      <div className="bg-primary rounded-xl ring-1 ring-secondary shadow-xs p-4 md:p-6 flex flex-col gap-4">
        {children}
      </div>
    </section>
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

function Divider() {
  return <div className="h-px bg-secondary -my-2" />
}
