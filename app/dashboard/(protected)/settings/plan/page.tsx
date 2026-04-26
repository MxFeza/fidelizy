import { Star01 } from '@untitledui/icons'

/**
 * Abonnement (Story 8.1) — sous-page de Reglages.
 * Placeholder v1 : pas d'abonnement en pilote (acces gratuit).
 * Sera active quand le plan tarifaire sera defini.
 */
export default function PlanPage() {
  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-display-xs font-semibold text-primary">Abonnement</h1>
        <p className="text-sm text-tertiary mt-1">Plan et facturation de votre commerce.</p>
      </div>

      <section className="bg-primary rounded-xl ring-1 ring-secondary shadow-xs p-8 text-center">
        <div className="mx-auto size-12 rounded-full bg-brand-secondary flex items-center justify-center mb-4">
          <Star01 className="size-6 text-fg-brand-primary" />
        </div>
        <p className="text-lg font-semibold text-primary mb-2">Bientôt disponible</p>
        <p className="text-sm text-tertiary max-w-md mx-auto">
          Pendant la phase pilote, l&apos;accès à Izou est gratuit. Vous serez prévenu·e
          dès que le plan tarifaire sera disponible.
        </p>
      </section>
    </div>
  )
}
