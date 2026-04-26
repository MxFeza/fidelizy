'use client'

/**
 * Inbox commercant — notifications RECUES par le commercant.
 * Differente de /dashboard/marketing/push qui sert a EMETTRE des notifications aux clients.
 *
 * Decision user 2026-04-26 : cette page est une PURE INBOX. Pas d'action d'envoi
 * affichee ici (le bouton "Envoyer une notification a mes clients" a ete retire) —
 * pour rester coherent avec le pattern des notifications d'autres apps.
 */

import { Bell01 } from '@untitledui/icons'

export default function NotificationsInboxPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-display-xs sm:text-display-sm font-semibold text-primary">
          Notifications
        </h1>
        <p className="text-md text-tertiary mt-1">
          Vos alertes et rappels — nouveaux clients, récompenses réclamées, mises à jour.
        </p>
      </div>

      {/* Empty state */}
      <div className="rounded-xl bg-primary border border-secondary p-10 text-center">
        <div className="size-14 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
          <Bell01 className="size-7 text-fg-quaternary" />
        </div>
        <p className="text-primary font-semibold mb-1">Aucune notification</p>
        <p className="text-sm text-tertiary max-w-sm mx-auto">
          Quand vos clients gagneront une récompense ou que vous recevrez un nouvel inscrit, les alertes apparaîtront ici.
        </p>
      </div>
    </div>
  )
}
