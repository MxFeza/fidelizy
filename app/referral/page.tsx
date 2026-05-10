import { redirect } from 'next/navigation'

/**
 * Story 9.2 v2 — fallback redirect pour /referral root.
 *
 * La page parrainage native est par carte (/card/[id]/referral) parce que le
 * code de parrainage dépend de la carte du commerçant courant. Si l'utilisateur
 * arrive sur /referral sans préfixe (typage direct, historique navigateur, lien
 * externe obsolète), on le redirige vers /me qui liste ses cartes — il peut
 * choisir le commerce dont il veut partager le parrainage.
 */
export default function ReferralRedirect(): never {
  redirect('/me')
}
