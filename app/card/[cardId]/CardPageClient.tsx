'use client'

import { useState, useEffect } from 'react'
import QrCodeDisplay from '@/app/components/QrCodeDisplay'
import ShortCodeDisplay from '@/app/components/ShortCodeDisplay'
import type { Business, LoyaltyCard, Customer, Transaction, RewardTier } from '@/lib/types'

type Tab = 'card' | 'qrcode' | 'history'

interface Props {
  card: LoyaltyCard & { customers: Customer | null }
  business: Business
  transactions: Transaction[]
  rewardTiers: RewardTier[]
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ConfettiEffect({ color }: { color: string }) {
  const PIECES = 32
  const palette = [color, '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']
  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotateZ(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotateZ(720deg); opacity: 0; }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
        {Array.from({ length: PIECES }).map((_, i) => {
          const left = `${((i / PIECES) * 95 + (i % 5)).toFixed(1)}%`
          const duration = `${(2.2 + (i % 5) * 0.28).toFixed(2)}s`
          const delay = `${(i * 0.08).toFixed(2)}s`
          const size = 6 + (i % 7)
          const bg = palette[i % palette.length]
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 0,
                left,
                width: size,
                height: size,
                backgroundColor: bg,
                borderRadius: i % 3 === 0 ? '50%' : '2px',
                animationName: 'confettiFall',
                animationDuration: duration,
                animationDelay: delay,
                animationFillMode: 'forwards',
                animationTimingFunction: 'ease-in',
              }}
            />
          )
        })}
      </div>
    </>
  )
}

function CardTabIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  )
}

function QrTabIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 18.75h.75v.75h-.75v-.75zM18.75 13.5h.75v.75h-.75v-.75zM18.75 18.75h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
    </svg>
  )
}

function HistoryTabIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function CardPageClient({ card, business, transactions, rewardTiers }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('card')
  const [installEvent, setInstallEvent] = useState<Event | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showIOSBanner, setShowIOSBanner] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [walletAvailable, setWalletAvailable] = useState(false)

  const color = business.primary_color || '#4f46e5'
  const stampsRequired = business.stamps_required ?? 10
  const stampsCount = card.current_stamps ?? 0
  const pointsBalance = card.current_points ?? 0
  const shortCode = `${card.qr_code_id.slice(0, 4).toUpperCase()}-${card.qr_code_id.slice(4, 8).toUpperCase()}`
  const stampCols = stampsRequired <= 5 ? stampsRequired : stampsRequired % 4 === 0 ? 4 : 5

  // Android/Chrome install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e)
      if (!isInStandaloneMode()) setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // iOS install suggestion + wallet availability
  useEffect(() => {
    if (isIOS()) {
      setWalletAvailable(true)
      if (!isInStandaloneMode() && !sessionStorage.getItem('ios_install_dismissed')) {
        setShowIOSBanner(true)
      }
    }
  }, [])

  // Stamp notification + confetti on reward unlock
  useEffect(() => {
    const storageKey = `fidelizy_stamps_${card.id}`
    const lastStr = localStorage.getItem(storageKey)
    const lastStamps = lastStr !== null ? parseInt(lastStr, 10) : null

    if (lastStamps !== null && stampsCount > lastStamps) {
      const diff = stampsCount - lastStamps
      setNotification(`+${diff} tampon${diff > 1 ? 's' : ''} ajouté${diff > 1 ? 's' : ''} ! 🎫`)
      setTimeout(() => setNotification(null), 4000)
    }

    if (
      business.loyalty_type === 'stamps' &&
      stampsCount >= stampsRequired &&
      (lastStamps === null || lastStamps < stampsRequired)
    ) {
      setTimeout(() => {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3500)
      }, 400)
    }

    localStorage.setItem(storageKey, String(stampsCount))
  }, [card.id, stampsCount, stampsRequired, business.loyalty_type])

  async function handleInstall() {
    if (!installEvent) return
    ;(installEvent as BeforeInstallPromptEvent).prompt()
    const { outcome } = await (installEvent as BeforeInstallPromptEvent).userChoice
    if (outcome === 'accepted') setShowInstallBanner(false)
    setInstallEvent(null)
  }

  const tabs = [
    { id: 'card' as Tab, label: 'Ma carte', icon: <CardTabIcon /> },
    { id: 'qrcode' as Tab, label: 'QR Code', icon: <QrTabIcon /> },
    { id: 'history' as Tab, label: 'Historique', icon: <HistoryTabIcon /> },
  ]

  return (
    <>
      <style>{`
        @keyframes slideDownNotif {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-16px); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          80%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-16px); }
        }
      `}</style>

      {showConfetti && <ConfettiEffect color={color} />}

      {/* Stamp notification toast */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            left: '50%',
            zIndex: 60,
            animation: 'slideDownNotif 4s ease-in-out forwards',
            whiteSpace: 'nowrap',
          }}
          className="bg-green-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold"
        >
          {notification}
        </div>
      )}

      {/* iOS install banner */}
      {showIOSBanner && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3">
          <span className="text-2xl shrink-0">📱</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-0.5">Installer l&apos;application</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              Appuyez sur <span className="font-bold">⎙</span> puis{' '}
              <span className="font-bold">Sur l&apos;écran d&apos;accueil</span>
            </p>
          </div>
          <button
            onClick={() => {
              sessionStorage.setItem('ios_install_dismissed', '1')
              setShowIOSBanner(false)
            }}
            className="text-gray-400 hover:text-white text-xl leading-none shrink-0 mt-0.5"
          >
            ×
          </button>
        </div>
      )}

      {/* Android install banner */}
      {showInstallBanner && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
          <span className="text-2xl shrink-0">📲</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Installer Fidelizy</p>
            <p className="text-xs text-gray-400">Accédez à votre carte en un tap</p>
          </div>
          <button
            onClick={handleInstall}
            className="shrink-0 text-white text-sm font-semibold px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: color }}
          >
            Installer
          </button>
          <button
            onClick={() => setShowInstallBanner(false)}
            className="text-gray-400 hover:text-white text-xl leading-none shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="text-white px-5 pt-12 pb-8" style={{ backgroundColor: color }}>
          <div className="max-w-sm mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">Carte de fidélité</p>
                <p className="font-bold text-lg leading-tight">{business.business_name}</p>
              </div>
            </div>
            <p className="text-white/80 text-sm">
              Bonjour,{' '}
              <span className="font-semibold text-white">
                {card.customers?.first_name ?? 'Client'}
              </span>{' '}
              👋
            </p>
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-sm mx-auto px-5 space-y-5">

          {/* ── Ma carte ── */}
          {activeTab === 'card' && (
            <>
              {/* Stamps card */}
              {business.loyalty_type === 'stamps' && (
                <div className="-mt-4">
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
                </div>
              )}

              {/* Points card */}
              {business.loyalty_type === 'points' && (
                <div className="-mt-4 bg-white rounded-2xl shadow-sm p-6 space-y-5">
                  <div className="text-center">
                    <p className="text-4xl font-bold" style={{ color }}>
                      {pointsBalance}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">points cumulés</p>
                  </div>
                  {rewardTiers.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Paliers de récompenses
                      </p>
                      {rewardTiers.map((tier) => {
                        const progress = Math.min(
                          100,
                          (pointsBalance / tier.points_required) * 100
                        )
                        const reached = pointsBalance >= tier.points_required
                        return (
                          <div key={tier.id} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {reached && <span className="text-sm">✅</span>}
                                <p
                                  className={`text-sm font-medium ${
                                    reached ? 'text-green-700' : 'text-gray-700'
                                  }`}
                                >
                                  {tier.reward_name}
                                </p>
                              </div>
                              <span className="text-xs text-gray-400">
                                {tier.points_required} pts
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{ width: `${progress}%`, backgroundColor: color }}
                              />
                            </div>
                            {tier.reward_description && (
                              <p className="text-xs text-gray-400">{tier.reward_description}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
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
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                    </svg>
                    Ajouter au Wallet Apple
                  </a>
                ) : (
                  <button
                    disabled
                    title="Disponible sur iOS uniquement"
                    className="w-full flex items-center justify-center gap-2.5 bg-gray-50 text-gray-400 font-medium py-3 px-4 rounded-xl cursor-not-allowed text-sm border border-gray-100"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V9M3 9V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v3"
                      />
                    </svg>
                    Wallet Apple — iOS uniquement
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── QR Code ── */}
          {activeTab === 'qrcode' && (
            <>
              <div className="bg-white rounded-2xl shadow-sm p-6 text-center -mt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Mon QR code
                </p>
                <div className="flex justify-center">
                  <div className="p-3 bg-gray-50 rounded-xl inline-block">
                    <QrCodeDisplay value={card.qr_code_id} size={180} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                  Présentez ce code au commerçant à chaque visite
                </p>
              </div>
              <ShortCodeDisplay code={shortCode} />
            </>
          )}

          {/* ── Historique ── */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden -mt-4">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-900">
                  Historique ({transactions.length} opération
                  {transactions.length !== 1 ? 's' : ''})
                </p>
              </div>
              {transactions.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-gray-400 text-sm">Aucune opération pour l&apos;instant</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {transactions.map((tx) => {
                    const isStamp = tx.stamps_added != null && tx.stamps_added > 0
                    const isRedeem = tx.type === 'redeem'
                    const value = isStamp ? tx.stamps_added : tx.points_added
                    return (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">
                            {isRedeem ? '🎁' : isStamp ? '🎫' : '⭐'}
                          </span>
                          <p className="text-sm text-gray-600">
                            {tx.description ??
                              (isStamp ? 'Tampon ajouté' : 'Points gagnés')}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          {value != null && value > 0 && (
                            <p className="text-sm font-semibold" style={{ color }}>
                              +{value} {isStamp ? '🎫' : 'pts'}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 z-30">
        <div className="max-w-sm mx-auto flex">
          {tabs.map(({ id, label, icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
                style={{ color: isActive ? color : '#9ca3af' }}
              >
                <span
                  style={{
                    display: 'block',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {icon}
                </span>
                <span className="text-[11px] font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}

// Augment the BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
