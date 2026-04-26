import { redirect } from 'next/navigation'

/**
 * Route depreciee — la logique a ete migree vers /dashboard/settings/security
 * (Story 8.1 — Restructurer Reglages). Le composant ProfileClient.tsx est
 * conserve temporairement pour reference, mais n'est plus reference.
 */
export default function ProfilePage() {
  redirect('/dashboard/settings/security')
}
