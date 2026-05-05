'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CreditCard02 } from '@untitledui/icons'
import QrCodeDisplay from '@/app/components/QrCodeDisplay'
import ShortCodeDisplay from '@/app/components/ShortCodeDisplay'
import LoyaltyCardVisual from '@/components/dashboard/LoyaltyCardVisual'
import Toast from '@/components/client/Toast'
import { PUBLIC_ASSETS } from '@/lib/assets'
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
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimResult, setClaimResult] = useState<{
    code: string
    rewardName: string
    expiresAt: string
  } | null>(null)

  async function handleClaimConfirm() {
    setClaiming(true)
    setClaimError(null)
    try {
      const res = await fetch(`/api/card/${card.qr_code_id}/claim-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId: null }),
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
            <button
              onClick={() => setShowQrModal(true)}
              className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: color, color }}
            >
              Agrandir
            </button>
          </div>
        </div>
      </div>

      {/* Loyalty card visual — image carte custom merchant (Story 4.3.f) sinon standard */}
      <LoyaltyCardVisual
        customerName={card.customers?.first_name?.trim() || 'Client'}
        loyaltyType={business.loyalty_type}
        currentStamps={stampsCount}
        stampsRequired={stampsRequired}
        currentPoints={pointsBalance}
        businessLogoUrl={business.logo_url}
        cardImageUrl={business.card_image_url}
      />

      {/* Reward unlocked banner (stamps mode, single-tier) */}
      {business.loyalty_type === 'stamps' && stampsCount >= stampsRequired && business.stamps_reward && (
        <div className="rounded-2xl bg-success-secondary border border-success px-4 py-3 text-center space-y-3">
          <div>
            <p className="text-sm font-semibold text-success-primary">
              🎁 Récompense disponible : {business.stamps_reward}
            </p>
            <p className="text-xs text-success-primary/80 mt-0.5">
              Réclamez-la auprès de votre commerçant
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClaimModal(true)}
            disabled={claiming}
            className="w-full bg-brand-solid hover:bg-brand-solid_hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
          >
            {claiming ? 'Génération du code…' : 'Réclamer ma récompense'}
          </button>
        </div>
      )}

      {/* Tier progress bar (BK-style — paliers JSONB ou palier virtuel single-tier) */}
      {liveTiers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <TierProgressBar
            tiers={liveTiers}
            currentValue={business.loyalty_type === 'stamps' ? stampsCount : pointsBalance}
            loyaltyType={business.loyalty_type}
            color={color}
          />

          {/* Wheel button (points mode only) */}
          {business.loyalty_type === 'points' && wheelStatus?.enabled && (
            <button
              onClick={onShowWheel}
              disabled={!wheelStatus.eligible}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: wheelStatus.eligible ? color : `${color}15`,
                color: wheelStatus.eligible ? 'white' : color,
              }}
            >
              <span className="text-lg">🎡</span>
              {wheelStatus.eligible
                ? `Tourner la roue (${wheelStatus.cost} pts)`
                : `Roue de la fortune (${wheelStatus.cost} pts requis)`}
            </button>
          )}
        </div>
      )}

      {/* Add to Apple Wallet (iOS only — Google Wallet attendu en Epic 6).
          target="_blank" force l'ouverture dans Safari standard meme en mode
          PWA standalone — sinon le webview affiche le .pkpass en plain text
          au lieu de le router vers PassKit (bug client signale 2026-05-04).
          Epic 6 remplacera ce bouton par le badge officiel Apple "Add to Apple
          Wallet" + variante Google Wallet detectee via userAgent. */}
      {walletAvailable && (
        <a
          href={`/api/wallet/${card.qr_code_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-brand-solid hover:bg-brand-solid_hover text-white font-semibold py-3.5 px-4 rounded-2xl text-sm transition-colors shadow-sm"
        >
          <CreditCard02 className="size-5" aria-hidden="true" />
          Ajouter à Apple Wallet
        </a>
      )}

      {/* Activité récente (5 dernières transactions) */}
      <RecentActivity transactions={transactions} cardId={card.qr_code_id} />

      {/* QR code fullscreen modal — Figma image 1 */}
      {showQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Votre code de fidélité"
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] bg-gray-100">
              <Image
                src={business.card_image_url || PUBLIC_ASSETS.cards.loyaltyDefault}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                className="object-cover object-center"
                unoptimized={!!business.card_image_url}
              />
            </div>

            <div className="p-6 text-center">
              <p className="text-base font-bold text-gray-900">Votre code de fidélité</p>
              <p className="text-sm text-gray-500 mt-1">
                {business.loyalty_type === 'stamps'
                  ? 'Scannez au comptoir pour obtenir un tampon'
                  : 'Scannez au comptoir pour cumuler des points'}
              </p>

              <div className="flex justify-center my-5">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <QrCodeDisplay value={card.qr_code_id} size={180} />
                </div>
              </div>

              <p className="text-sm font-mono font-semibold text-gray-700 tracking-wider mb-5">
                {shortCode}
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="w-full bg-brand-solid hover:bg-brand-solid_hover text-white font-semibold py-3 px-4 rounded-2xl text-sm transition-colors"
                >
                  Copier le code
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="w-full bg-white ring-1 ring-gray-200 hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-2xl text-sm transition-colors"
                >
                  Fermer
                </button>
              </div>
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

      {/* Toast erreur réclamation (rate-limit / expired card / etc.) */}
      {claimError && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-md" style={{ top: '4.5rem' }}>
          <Toast variant="error" title="Réclamation impossible" message={claimError} />
        </div>
      )}

      {/* Modal de confirmation Réclamer la récompense — Figma image 2 */}
      <ClaimRewardModal
        isOpen={showClaimModal}
        loyaltyType={business.loyalty_type}
        rewardName={business.stamps_reward}
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
