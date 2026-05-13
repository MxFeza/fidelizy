'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CreditCard02, Share04 } from '@untitledui/icons'
import QrCodeDisplay from '@/app/components/QrCodeDisplay'
import ShortCodeDisplay from '@/app/components/ShortCodeDisplay'
import LoyaltyCardVisual from '@/components/dashboard/LoyaltyCardVisual'
import Toast from '@/components/client/Toast'
import { Button } from '@/components/ui/base/buttons/button'
import { Emoji } from '@/lib/emojis'
import { PUBLIC_ASSETS } from '@/lib/assets'
import { joinUrl } from '@/lib/config'
import TierProgressBar from './TierProgressBar'
import RecentActivity from './RecentActivity'
import ClaimRewardModal from './ClaimRewardModal'
import ClaimCodeModal from './ClaimCodeModal'
import type { Business, LoyaltyCard, Customer, LoyaltyTier, Transaction } from '@/lib/types'

interface CardTabProps {
  card: LoyaltyCard & { customers: Customer | null }
  business: Business
  transactions: Transaction[]
  stampsCount: number
  pointsBalance: number
  liveTiers: LoyaltyTier[]
  wheelStatus: { enabled: boolean; cost: number; eligible: boolean } | null
  color: string
  shortCode: string
  stampsRequired: number
  walletAvailable: boolean
  onShowWheel: () => void
  onShowConfetti: () => void
}

export default function CardTab({
  card,
  business,
  transactions,
  stampsCount,
  pointsBalance,
  liveTiers,
  wheelStatus,
  color,
  shortCode,
  stampsRequired,
  walletAvailable,
  onShowWheel,
}: CardTabProps) {
  const [showQrModal, setShowQrModal] = useState(false)
  const [showCopyToast, setShowCopyToast] = useState(false)
  const [showShareCopiedToast, setShowShareCopiedToast] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimResult, setClaimResult] = useState<{
    code: string
    rewardName: string
    expiresAt: string
  } | null>(null)

  async function handleClaimConfirm(tierId: string | null) {
    setClaiming(true)
    setClaimError(null)
    try {
      const res = await fetch(`/api/card/${card.qr_code_id}/claim-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? `Erreur (${res.status})`)
      setClaimResult({
        code: data.code,
        rewardName: data.rewardName,
        expiresAt: data.expiresAt,
      })
      setShowClaimModal(false)
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : 'Erreur lors de la réclamation.')
      setTimeout(() => setClaimError(null), 5000)
    } finally {
      setClaiming(false)
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(shortCode)
      setShowCopyToast(true)
      setTimeout(() => setShowCopyToast(false), 3000)
    } catch {
      /* ignore — clipboard refusé (Safari sans HTTPS, perms) */
    }
  }

  async function handleAddToWallet() {
    // Telechargement programmatique via blob : evite target="_blank" qui
    // sortait le user de la PWA et causait une "page blanche" au retour
    // (signale 2026-05-13). iOS intercepte le MIME application/vnd.apple.pkpass
    // et propose "Ajouter au Wallet" sans naviguer hors de la PWA.
    try {
      const res = await fetch(`/api/wallet/${card.qr_code_id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`wallet fetch failed (${res.status})`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'izou-card.pkpass'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1500)
    } catch (e) {
      console.error('[wallet] add to wallet failed', e)
    }
  }

  async function handleShare() {
    // L'URL partagée pointe vers la page d'inscription du commerce, pas
    // vers le compte client : le destinataire qui clique doit pouvoir créer
    // sa propre carte, pas se retrouver sur la carte de quelqu'un d'autre.
    //
    // Refonte 2026-05-13 : on inclut le code de parrainage dans l'URL
    // (format FIRST4-LAST4 derive du prenom + telephone — cf.
    // lib/services/referral.service.ts generateReferralCode). Le destinataire
    // qui s'inscrit via ce lien declenche un parrainage automatique a la fin
    // de l'onboarding (cf. app/api/join et processReferral).
    const target = business.short_code || business.id
    const firstName = card.customers?.first_name
    const phone = card.customers?.phone
    const referralCode = firstName && phone
      ? `${firstName.substring(0, 4).toUpperCase().padEnd(4, 'X')}-${phone.slice(-4)}`
      : null
    const baseUrl = joinUrl(target)
    const url = referralCode ? `${baseUrl}?ref=${encodeURIComponent(referralCode)}` : baseUrl
    const title = `Carte de fidélité ${business.business_name}`
    const text = referralCode
      ? `Rejoignez le programme fidélité de ${business.business_name} avec mon code ${referralCode} et recevez un bonus de bienvenue !`
      : `Rejoignez le programme fidélité de ${business.business_name} sur Izou.`
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, text, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShowShareCopiedToast(true)
      setTimeout(() => setShowShareCopiedToast(false), 3000)
    } catch {
      /* user dismissed share sheet — silent */
    }
  }

  return (
    <>
      {/* QR Code compact */}
      <div className="-mt-4 bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gray-50 rounded-xl shrink-0">
            <QrCodeDisplay value={card.qr_code_id} size={80} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Mon QR code</p>
            <ShortCodeDisplay code={shortCode} />
            <Button
              size="sm"
              color="secondary"
              className="mt-2"
              onClick={() => setShowQrModal(true)}
            >
              Agrandir
            </Button>
          </div>
        </div>
      </div>

      {/* Loyalty card visual — image carte custom merchant (Story 4.3.f) sinon standard.
          Charte couleur = business.primary_color (décision 2026-05-11 : retrait
          de la personnalisation couleur client, fixe côté merchant). */}
      <LoyaltyCardVisual
        customerName={card.customers?.first_name?.trim() || 'Client'}
        loyaltyType={business.loyalty_type}
        currentStamps={stampsCount}
        stampsRequired={stampsRequired}
        currentPoints={pointsBalance}
        businessName={business.business_name}
        businessLogoUrl={business.logo_url}
        cardImageUrl={business.card_image_url}
        businessPrimaryColor={business.primary_color}
      />

      {/* Tier progress bar (BK-style — paliers JSONB ou palier virtuel single-tier)
          Le bouton "Réclamer ma récompense" est désormais INLINE dans ce
          composant (sous les paliers) pour la continuité visuelle. L'ancien
          banner externe "Récompense disponible" a été retiré 2026-05-13. */}
      {liveTiers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <TierProgressBar
            tiers={liveTiers}
            currentValue={business.loyalty_type === 'stamps' ? stampsCount : pointsBalance}
            loyaltyType={business.loyalty_type}
            color={color}
            onClaim={() => setShowClaimModal(true)}
            isClaiming={claiming}
          />

          {/* Wheel button (points mode only). Eligible -> Button primary
              violet, sinon Button secondary (gris) pour indiquer "pas encore". */}
          {business.loyalty_type === 'points' && wheelStatus?.enabled && (
            <Button
              size="md"
              color={wheelStatus.eligible ? 'primary' : 'secondary'}
              isDisabled={!wheelStatus.eligible}
              className="w-full mt-4"
              iconLeading={<Emoji name="wheel" size={18} />}
              onClick={onShowWheel}
            >
              {wheelStatus.eligible
                ? `Tourner la roue (${wheelStatus.cost} pts)`
                : `Roue de la fortune (${wheelStatus.cost} pts requis)`}
            </Button>
          )}
        </div>
      )}

      {/* Add to Apple Wallet — telechargement programmatique en blob plutot
          que <a target="_blank"> (refonte 2026-05-13). Le precedent flow
          ouvrait Safari standard et au retour le user voyait une page blanche
          dans la PWA. Avec blob + download programmatique, iOS intercepte le
          MIME application/vnd.apple.pkpass et propose "Ajouter au Wallet"
          sans navigation, la PWA reste en place. */}
      {walletAvailable && (
        <button
          type="button"
          data-tour="wallet-add"
          onClick={handleAddToWallet}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 px-4 rounded-xl text-sm transition-colors shadow-xs-skeumorphic"
        >
          <CreditCard02 className="size-5" aria-hidden="true" />
          Ajouter à Apple Wallet
        </button>
      )}

      {/* Activité récente (5 dernières transactions) */}
      <RecentActivity transactions={transactions} cardId={card.qr_code_id} />

      {/* QR code fullscreen modal — style pass Apple Wallet Carrefour Club :
          header Bonjour + bandeau image edge-to-edge + nom commerce + QR code.
          Aligne visuellement avec LoyaltyCardVisual (4 bandes) mais en blanc
          car la modal est un container distinct de la carte loyalty. */}
      {showQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Votre code de fidélité"
          className="fixed inset-0 bg-overlay/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Header — Logo Izou + BONJOUR PRENOM (caps) */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
              <Image
                src={PUBLIC_ASSETS.branding.logoNoir}
                alt="Izou"
                width={56}
                height={24}
                className="h-6 w-auto shrink-0"
              />
              <div className="text-right min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-gray-500 leading-tight">
                  BONJOUR
                </p>
                <p className="text-xs font-bold tracking-wide text-gray-900 leading-tight uppercase truncate">
                  {(card.customers?.first_name?.trim() || 'Client').toUpperCase()}
                </p>
              </div>
            </div>

            {/* 2. Image bandeau EDGE-TO-EDGE (clip uniquement par le rounded-3xl
                parent qui a overflow-hidden) */}
            <div className="relative w-full aspect-[2/1]">
              <Image
                src={business.card_image_url || PUBLIC_ASSETS.cards.loyaltyDefault}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                className="object-cover object-center"
                unoptimized={!!business.card_image_url}
              />
            </div>

            {/* 3. Nom du commerce (centre, sous l'image) */}
            <p className="px-4 pt-3 text-center text-base font-bold text-gray-900 truncate">
              {business.business_name}
            </p>

            {/* 4. Titre + sous-titre */}
            <div className="px-6 pt-2 text-center">
              <p className="text-sm font-semibold text-gray-700">Votre code de fidélité</p>
              <p className="text-xs text-gray-500 mt-1">
                {business.loyalty_type === 'stamps'
                  ? 'Scannez au comptoir pour obtenir un tampon'
                  : 'Scannez au comptoir pour cumuler des points'}
              </p>
            </div>

            {/* 5. QR code centre */}
            <div className="flex justify-center my-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <QrCodeDisplay value={card.qr_code_id} size={180} />
              </div>
            </div>

            {/* 6. Code court */}
            <p className="text-sm font-mono font-semibold text-gray-700 tracking-wider text-center mb-5">
              {shortCode}
            </p>

            {/* 7. Boutons */}
            <div className="px-6 pb-6 space-y-2.5">
              <Button
                type="button"
                color="primary"
                size="md"
                iconLeading={Share04}
                className="w-full"
                onClick={handleShare}
              >
                Partager
              </Button>
              <Button
                type="button"
                color="secondary"
                size="md"
                className="w-full"
                onClick={handleCopyCode}
              >
                Copier le code
              </Button>
              <Button
                type="button"
                color="tertiary"
                size="md"
                className="w-full"
                onClick={() => setShowQrModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast "Code copié" — confirme l'action clipboard */}
      {showCopyToast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-md" style={{ top: '4.5rem' }}>
          <Toast
            variant="info"
            title="Code copié"
            message={`${shortCode} · dans le presse-papier`}
          />
        </div>
      )}

      {/* Toast "Lien copié" — fallback si Web Share API indisponible (desktop). */}
      {showShareCopiedToast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-md" style={{ top: '4.5rem' }}>
          <Toast
            variant="info"
            title="Lien copié"
            message="Le lien d'inscription est dans votre presse-papier."
          />
        </div>
      )}

      {/* Toast erreur réclamation (rate-limit / expired card / etc.) */}
      {claimError && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-md" style={{ top: '4.5rem' }}>
          <Toast variant="error" title="Réclamation impossible" message={claimError} />
        </div>
      )}

      {/* Modal de confirmation/selection Reclamer recompense.
          reachedTiers : liste des paliers ATTEINTS (debloquables maintenant)
          que le client peut choisir. Si > 1, mode selection ; sinon mode
          confirmation simple (refonte 2026-05-13 — avant : prenait toujours
          le plus grand palier automatiquement). */}
      <ClaimRewardModal
        isOpen={showClaimModal}
        loyaltyType={business.loyalty_type}
        rewardName={business.stamps_reward}
        reachedTiers={liveTiers.filter((t) =>
          (business.loyalty_type === 'stamps' ? stampsCount : pointsBalance) >= t.threshold,
        )}
        color={color}
        onConfirm={handleClaimConfirm}
        onCancel={() => setShowClaimModal(false)}
      />

      {/* Modal "Demande envoyée" avec le code à présenter au merchant — C3 */}
      <ClaimCodeModal
        isOpen={!!claimResult}
        code={claimResult?.code ?? ''}
        rewardName={claimResult?.rewardName ?? ''}
        expiresAt={claimResult?.expiresAt ?? new Date().toISOString()}
        onClose={() => setClaimResult(null)}
      />
    </>
  )
}
