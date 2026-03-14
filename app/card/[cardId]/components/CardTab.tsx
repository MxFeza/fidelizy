'use client'

import { useState } from 'react'
import QrCodeDisplay from '@/app/components/QrCodeDisplay'
import ShortCodeDisplay from '@/app/components/ShortCodeDisplay'
import type { Business, LoyaltyCard, Customer, RewardTier } from '@/lib/types'

interface CardTabProps {
  card: LoyaltyCard & { customers: Customer | null }
  business: Business
  stampsCount: number
  pointsBalance: number
  liveTiers: RewardTier[]
  wheelStatus: { enabled: boolean; cost: number; eligible: boolean } | null
  color: string
  shortCode: string
  stampCols: number
  stampsRequired: number
  walletAvailable: boolean
  onShowWheel: () => void
  onShowConfetti: () => void
}

export default function CardTab({
  card,
  business,
  stampsCount,
  pointsBalance,
  liveTiers,
  wheelStatus,
  color,
  shortCode,
  stampCols,
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

      {/* Stamps card */}
      {business.loyalty_type === 'stamps' && (
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)' }}
        >
          <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  Carte à tampons
                </p>
                {stampsCount >= stampsRequired ? (
                  <p className="text-sm font-bold text-green-700">🎉 Récompense débloquée !</p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Encore{' '}
                    <span className="font-bold" style={{ color }}>
                      {stampsRequired - stampsCount} tampon
                      {stampsRequired - stampsCount > 1 ? 's' : ''}
                    </span>{' '}
                    pour votre récompense
                  </p>
                )}
              </div>
              <div
                className="w-12 h-12 rounded-full flex flex-col items-center justify-center text-white shrink-0"
                style={{ backgroundColor: stampsCount >= stampsRequired ? '#16a34a' : color }}
              >
                <span className="text-lg font-black leading-none">{stampsCount}</span>
                <span className="text-[9px] font-semibold leading-none opacity-75">
                  /{stampsRequired}
                </span>
              </div>
            </div>

            <div
              className="grid gap-2.5"
              style={{ gridTemplateColumns: `repeat(${stampCols}, 1fr)` }}
            >
              {Array.from({ length: stampsRequired }).map((_, i) => {
                const filled = i < stampsCount
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-full flex items-center justify-center transition-all duration-200"
                    style={
                      filled
                        ? { backgroundColor: color, boxShadow: `0 2px 6px ${color}55` }
                        : { backgroundColor: '#f9fafb', border: '2px dashed #e5e7eb' }
                    }
                  >
                    {filled ? (
                      <svg
                        className="text-white"
                        style={{ width: '52%', height: '52%' }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs text-gray-300 font-medium select-none">
                        {i + 1}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {business.stamps_reward && (
              <div
                className="text-sm font-semibold text-center py-2.5 px-4 rounded-xl"
                style={
                  stampsCount >= stampsRequired
                    ? {
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                      }
                    : {
                        backgroundColor: `${color}12`,
                        color,
                        border: `1px solid ${color}28`,
                      }
                }
              >
                {stampsCount >= stampsRequired ? '🎁 Récompense disponible : ' : '🎯 '}
                {business.stamps_reward}
              </div>
            )}

            {stampsCount >= stampsRequired && (
              <p className="text-center text-xs text-green-600 font-medium -mt-2">
                Présentez cette carte au commerçant pour en profiter
              </p>
            )}
          </div>
        </div>
      )}

      {/* Points card — Horizontal Tier Bar */}
      {business.loyalty_type === 'points' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="text-center">
            <p className="text-4xl font-bold" style={{ color }}>
              {pointsBalance}
            </p>
            <p className="text-gray-400 text-sm mt-1">points cumulés</p>
          </div>

          {liveTiers.length > 0 && (() => {
            const maxPts = liveTiers[liveTiers.length - 1]?.points_required ?? 1
            const progressPct = Math.min(100, (pointsBalance / maxPts) * 100)
            const nextTier = liveTiers.find((t) => t.points_required > pointsBalance)
            const remaining = nextTier ? nextTier.points_required - pointsBalance : 0

            return (
              <div className="space-y-3">
                <div className="relative pt-2 pb-8">
                  <div className="h-2 bg-gray-100 rounded-full relative">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progressPct}%`, backgroundColor: color }}
                    />
                  </div>

                  {liveTiers.map((tier) => {
                    const pos = (tier.points_required / maxPts) * 100
                    const reached = pointsBalance >= tier.points_required
                    return (
                      <div
                        key={tier.id}
                        className="absolute flex flex-col items-center"
                        style={{ left: `${pos}%`, top: '-2px', transform: 'translateX(-50%)' }}
                      >
                        <div
                          className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] bg-white z-10"
                          style={{
                            borderColor: reached ? '#16a34a' : '#d1d5db',
                            backgroundColor: reached ? '#16a34a' : 'white',
                            color: reached ? 'white' : '#9ca3af',
                          }}
                        >
                          {reached ? '✓' : '🔒'}
                        </div>
                        <span className="text-[10px] font-semibold mt-1 whitespace-nowrap" style={{ color: reached ? '#16a34a' : '#9ca3af' }}>
                          {tier.points_required}
                        </span>
                        <span className="text-[9px] text-gray-400 mt-0.5 max-w-[60px] truncate text-center" title={tier.reward_name}>
                          {tier.reward_name}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {nextTier && (
                  <p className="text-center text-xs text-gray-500">
                    Plus que <span className="font-bold" style={{ color }}>{remaining} point{remaining > 1 ? 's' : ''}</span> pour{' '}
                    <span className="font-semibold">{nextTier.reward_name}</span>
                  </p>
                )}
                {!nextTier && liveTiers.length > 0 && (
                  <p className="text-center text-xs text-green-600 font-medium">
                    Tous les paliers atteints !
                  </p>
                )}
              </div>
            )
          })()}

          {/* Wheel button */}
          {wheelStatus?.enabled && (
            <button
              onClick={onShowWheel}
              disabled={!wheelStatus.eligible}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Add to Wallet */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        {walletAvailable ? (
          <a
            href={`/api/wallet/${card.qr_code_id}`}
            className="w-full flex items-center justify-center gap-2.5 bg-black text-white font-semibold py-3 px-4 rounded-xl text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.125A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.125zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H5.25zm10.5 6.75a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" />
            </svg>
            Ajouter au Wallet Apple
          </a>
        ) : (
          <button
            disabled
            title="Disponible sur iOS uniquement"
            className="w-full flex items-center justify-center gap-2.5 bg-gray-50 text-gray-400 font-medium py-3 px-4 rounded-xl cursor-not-allowed text-sm border border-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V9M3 9V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v3" />
            </svg>
            Wallet Apple — iOS uniquement
          </button>
        )}
      </div>

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
