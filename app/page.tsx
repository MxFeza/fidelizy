import { redirect } from 'next/navigation'

/**
 * Page racine — redirect temporaire vers la connexion commerçant.
 *
 * Decision user 2026-04-30 : l'ancien ecran client "Entrez le code du
 * commerce" est trop confus pour les utilisateurs finaux. En attendant
 * qu'Epic 4 livre l'onboarding client (Story 4.2 — Figma A1-A6), la
 * racine redirige directement vers /dashboard/login (page commercant).
 *
 * Le code de l'ancien ecran client reste dans l'historique git
 * (commit prec. : 5bcfdd6) si besoin de reference avant Epic 4.
 *
 * TODO Epic 4 Story 4.2 : remplacer ce redirect par le nouvel onboarding
 * client conforme Figma A1-A6 (file PVqIzNHJH5AH3aujECItxR, node 10899:621).
 */
export default function HomePage() {
  redirect('/dashboard/login')
}
