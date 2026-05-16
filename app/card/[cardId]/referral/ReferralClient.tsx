'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Gift01, Users01, AlertCircle } from '@untitledui/icons'
import TopBarClient from '@/components/client/TopBarClient'
import BottomTabBarClient from '@/components/client/BottomTabBarClient'
import Toast from '@/components/client/Toast'

interface ReferralListItem {
  id: string
  referredFirstName: string | null
  status: 'inscrit' | 'en_attente'
  bonusPoints: number
  createdAt: string
}

interface ReferralClientProps {
  cardId: string
  businessName: string
  shortCode: string | null
  primaryColor: string
  loyaltyType: 'stamps' | 'points'
  referralEnabled: boolean
  referrerBonus: number
  referredBonus: number
  referralCode: string | null
  referrals: ReferralListItem[]
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

export default function ReferralClient({
  cardId,
  businessName,
  shortCode,
  loyaltyType,
  referralEnabled,
  referrerBonus,
  referredBonus,
  referralCode,
  referrals,
}: ReferralClientProps) {
  const [copyToast, setCopyToast] = useState(false)

  const unitLabel = loyaltyType === 'stamps' ? (referrerBonus > 1 ? 'tampons' : 'tampon') : 'points'
  const referredUnitLabel = loyaltyType === 'stamps' ? (referredBonus > 1 ? 'tampons' : 'tampon') : 'points'

  const shareUrl = referralCode && shortCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${shortCode}?ref=${encodeURIComponent(referralCode)}`
    : null

  async function handleShare() {
    if (!shareUrl || !referralCode) return
    const shareData = {
      title: `Rejoignez ${businessName} sur Izou`,
      text: `Inscrivez-vous chez ${businessName} avec mon code ${referralCode} et gagnez ${referredBonus} ${referredUnitLabel} bonus !`,
      url: shareUrl,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setCopyToast(true)
        setTimeout(() => setCopyToast(false), 3000)
      }
    } catch {
      // user dismissed share sheet — ignore
    }
  }

  async function handleCopyCode() {
    if (!referralCode) return
    try {
      await navigator.clipboard.writeText(referralCode)
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 3000)
    } catch {
      /* ignore — clipboard refusé */
    }
  }

  const blocked = !referralEnabled || !referralCode

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBarClient
        rightSlot={
          <Link
            href={`/card/${cardId}`}
            aria-label="Retour à la carte"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        }
      />

      <div className="max-w-md mx-auto px-5 py-6 space-y-5">
        {/* Hero card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="size-14 mx-auto rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
            <Gift01 className="size-7 text-brand-secondary" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Invitez vos amis !</h1>
          {referralEnabled ? (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Parrainez un ami chez <strong className="font-semibold">{businessName}</strong> et gagnez
              {' '}<strong className="text-brand-secondary">{referrerBonus} {unitLabel} bonus</strong>.
              Votre filleul reçoit <strong>{referredBonus} {referredUnitLabel} de bienvenue</strong>.
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              {businessName} n&apos;a pas encore activé le parrainage.
            </p>
          )}
        </div>

        {/* Code + share */}
        {!blocked && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mon code parrainage</p>
            <button
              type="button"
              onClick={handleCopyCode}
              className="w-full bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl py-4 text-2xl font-mono font-bold tracking-wider text-gray-900"
              aria-label={`Copier le code ${referralCode}`}
            >
              {referralCode}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="size-4" aria-hidden="true" />
              Partager mon lien
            </button>
          </div>
        )}

        {/* Si blocked par phone manquant côté customer */}
        {referralEnabled && !referralCode && (
          <div className="bg-warning-secondary/40 rounded-2xl p-4 flex items-start gap-2.5">
            <AlertCircle className="size-5 text-warning-primary shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-warning-primary leading-relaxed">
              Ajoutez votre numéro de téléphone dans votre profil pour pouvoir parrainer vos amis.
            </p>
          </div>
        )}

        {/* Liste filleuls */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users01 className="size-4 text-gray-400" aria-hidden="true" />
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mes filleuls</h2>
            {referrals.length > 0 && (
              <span className="ml-auto text-xs font-semibold text-gray-700">{referrals.length}</span>
            )}
          </div>

          {referrals.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-tertiary leading-relaxed">
                Aucun filleul pour le moment. Partagez votre code pour gagner vos premiers bonus !
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {referrals.map((r) => (
                <li key={r.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-brand-50 flex items-center justify-center text-sm font-semibold text-brand-secondary shrink-0">
                    {r.referredFirstName?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {r.referredFirstName ?? 'Filleul anonyme'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(r.createdAt)} · +{r.bonusPoints} {unitLabel}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-success-secondary text-success-primary">
                    Inscrit
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Toast confirmation copie / share fallback */}
      {copyToast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-md" style={{ top: '4.5rem' }}>
          <Toast variant="info" title="Copié" message="Le lien a été copié dans le presse-papier" />
        </div>
      )}

      <BottomTabBarClient cardId={cardId} />
    </div>
  )
}
