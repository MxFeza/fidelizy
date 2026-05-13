'use client'

/**
 * Inbox commerçant — notifications RECUES par le commercant.
 * Différente de /dashboard/marketing/push qui sert à EMETTRE des notifications
 * aux clients.
 *
 * Decision user 2026-04-26 : cette page est une PURE INBOX. Pas d'action
 * d'envoi affichee ici (le bouton "Envoyer une notification a mes clients"
 * a ete retire) — pour rester coherent avec le pattern des notifications
 * d'autres apps.
 *
 * 2026-05-13 : le widget PendingClaimRequests est désormais aussi affiché ici
 * (en plus du dashboard home) pour que le merchant retrouve les demandes
 * de récompense à valider depuis l'onglet Notifications attendu.
 */

import PendingClaimRequests from '@/components/dashboard/PendingClaimRequests'

export default function NotificationsInboxPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-display-xs sm:text-display-sm font-semibold text-primary">
          Notifications
        </h1>
        <p className="text-md text-tertiary mt-1">
          Vos alertes et rappels — nouveaux clients, récompenses réclamées, mises à jour.
        </p>
      </div>

      {/* Toujours affiché ici (showEmptyState=true) : la page notifications
          dédiée doit avoir un état même quand zéro demande, contrairement au
          dashboard home qui masque le widget pour ne pas encombrer. */}
      <PendingClaimRequests showEmptyState />
    </div>
  )
}
