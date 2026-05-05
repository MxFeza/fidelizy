'use client'

import { useState } from 'react'
import { CreditCard02 } from '@untitledui/icons'
import QrCodeDisplay from '@/app/components/QrCodeDisplay'
import ShortCodeDisplay from '@/app/components/ShortCodeDisplay'
import LoyaltyCardVisual from '@/components/dashboard/LoyaltyCardVisual'
import TierProgressBar from './TierProgressBar'
import RecentActivity from './RecentActivity'
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

      {/* Loyalty card visual (Figma B4 — carte v1 noire + image standard + logo transparent) */}
      <LoyaltyCardVisual
        customerName={card.customers?.first_name?.trim() || 'Client'}
        loyaltyType={business.loyalty_type}
        currentStamps={stampsCount}
        stampsRequired={stampsRequired}
        currentPoints={pointsBalance}
        businessLogoUrl={business.logo_url}
      />

      {/* Reward unlocked banner (stamps mode, single-tier) */}
      {business.loyalty_type === 'stamps' && stampsCount >= stampsRequired && business.stamps_reward && (
        <div className="rounded-2xl bg-success-secondary border border-success px-4 py-3 text-center">
          <p className="text-sm font-semibold text-success-primary">
            🎁 Récompense disponible : {business.stamps_reward}
          </p>
          <p className="text-xs text-success-primary/80 mt-0.5">
            Présentez votre carte au commerçant pour en profiter
          </p>
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

      {/* QR code fullscreen modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 text-center max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Mon QR code
            </p>
            <div className="flex justify-center">
              <div className="p-4 bg-gray-50 rounded-xl inline-block">
                <QrCodeDisplay value={card.qr_code_id} size={220} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
              Présentez ce code au commerçant à chaque visite
            </p>
            <button
              onClick={() => setShowQrModal(false)}
              className="mt-4 text-sm font-semibold px-6 py-2.5 rounded-xl text-white"
              style={{ backgroundColor: color }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  )
}
