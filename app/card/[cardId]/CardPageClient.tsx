'use client'

import { useState, useEffect, useRef } from 'react'
import QrCodeDisplay from '@/app/components/QrCodeDisplay'
import ShortCodeDisplay from '@/app/components/ShortCodeDisplay'
import type { Business, LoyaltyCard, Customer, Transaction, RewardTier } from '@/lib/types'

type Tab = 'card' | 'missions' | 'history'

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

function MissionsTabIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
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

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export default function CardPageClient({ card, business, transactions, rewardTiers }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('card')
  const [installEvent, setInstallEvent] = useState<Event | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showIOSBanner, setShowIOSBanner] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [walletAvailable, setWalletAvailable] = useState(false)
  const [showPushBanner, setShowPushBanner] = useState(false)
  const [liveTiers, setLiveTiers] = useState(rewardTiers)
  const [wheelStatus, setWheelStatus] = useState<{ enabled: boolean; cost: number; eligible: boolean } | null>(null)
  const [showWheel, setShowWheel] = useState(false)

  // Missions state
  type MissionData = {
    id: string
    template_key: string
    reward_points: number
    config: Record<string, unknown>
    completed: boolean
    pending?: boolean
    profile_complete?: boolean
    progress?: { current: number; target: number }
    referral_count?: number
  }
  const [missions, setMissions] = useState<MissionData[]>([])
  const [referralCode, setReferralCode] = useState('')
  const [missionsLoading, setMissionsLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewUrl, setReviewUrl] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [profileEmail, setProfileEmail] = useState(card.customers?.email || '')
  const [profileBirthday, setProfileBirthday] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const color = business.primary_color || '#4f46e5'
  const stampsRequired = business.stamps_required ?? 10
  const [stampsCount, setStampsCount] = useState(Math.min(card.current_stamps ?? 0, stampsRequired))
  const [pointsBalance, setPointsBalance] = useState(card.current_points ?? 0)
  const stampsRef = useRef(stampsCount)
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

  // Push notification permission
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('PushManager' in window)) return
    if (!('serviceWorker' in navigator)) return
    if (Notification.permission === 'granted') return
    if (Notification.permission === 'denied') return
    if (localStorage.getItem('fidelizy_push_dismissed')) return
    setShowPushBanner(true)
  }, [])

  async function handleEnablePush() {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setShowPushBanner(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('VAPID public key not configured')
        setShowPushBanner(false)
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          subscription: subscription.toJSON(),
        }),
      })

      setShowPushBanner(false)
    } catch (err) {
      console.error('Push subscription error:', err)
      setShowPushBanner(false)
    }
  }

  function handleDismissPush() {
    localStorage.setItem('fidelizy_push_dismissed', '1')
    setShowPushBanner(false)
  }

  // Track PWA visit (fire-and-forget)
  useEffect(() => {
    fetch(`/api/pwa-visit/${card.qr_code_id}`, { method: 'POST' }).catch(() => {})
  }, [card.qr_code_id])

  // Fetch missions
  useEffect(() => {
    fetch(`/api/missions/${card.qr_code_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.missions) setMissions(data.missions)
        if (data.referral_code) setReferralCode(data.referral_code)
        setMissionsLoading(false)
      })
      .catch(() => setMissionsLoading(false))
  }, [card.qr_code_id])

  // Fetch live data immediately on mount (for wheel status) then poll every 8s
  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch(`/api/card/${card.qr_code_id}/live`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (data.rewards) setLiveTiers(data.rewards as RewardTier[])
        if (data.wheel !== undefined) setWheelStatus(data.wheel)
        setPointsBalance(data.points)
      } catch { /* ignore */ }
    }
    fetchLive()
  }, [card.qr_code_id])

  // Live polling — fetch stamp/points every 8s and update state when they change
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/card/${card.qr_code_id}/live`, { cache: 'no-store' })
        if (!res.ok) return
        const data: {
          stamps: number
          points: number
          rewards?: { id: string; reward_name: string; points_required: number }[]
          wheel?: { enabled: boolean; cost: number; eligible: boolean } | null
        } = await res.json()

        const prev = stampsRef.current
        const capped = Math.min(data.stamps, stampsRequired)

        if (data.stamps > prev) {
          const diff = data.stamps - prev
          setNotification(`+${diff} tampon${diff > 1 ? 's' : ''} ajouté${diff > 1 ? 's' : ''} ! 🎫`)
          setTimeout(() => setNotification(null), 4000)
          if (data.stamps >= stampsRequired && prev < stampsRequired) {
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 3500)
          }
          localStorage.setItem(`fidelizy_stamps_${card.id}`, String(capped))
        } else if (data.stamps === 0 && prev > 0) {
          // Auto-reset after reward — show celebration
          setNotification('🎉 Récompense obtenue ! Carte remise à zéro.')
          setTimeout(() => setNotification(null), 5000)
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3500)
          localStorage.setItem(`fidelizy_stamps_${card.id}`, '0')
        }

        stampsRef.current = data.stamps
        setStampsCount(capped)
        setPointsBalance(data.points)

        if (data.rewards) setLiveTiers(data.rewards as RewardTier[])
        if (data.wheel !== undefined) setWheelStatus(data.wheel)
      } catch {
        // ignore transient network errors
      }
    }, 8000)
    return () => clearInterval(interval)
  }, [card.qr_code_id, card.id, stampsRequired])

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

  const [showQrModal, setShowQrModal] = useState(false)

  const tabs = [
    { id: 'card' as Tab, label: 'Ma carte', icon: <CardTabIcon /> },
    { id: 'missions' as Tab, label: 'Missions', icon: <MissionsTabIcon /> },
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

      {/* Push notification banner */}
      {showPushBanner && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 flex items-start gap-3">
          <span className="text-2xl shrink-0">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Notifications</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Recevez des notifications pour vos récompenses
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDismissPush}
              className="text-xs text-gray-400 hover:text-gray-600 font-medium px-2 py-1.5"
            >
              Plus tard
            </button>
            <button
              onClick={handleEnablePush}
              className="text-xs text-white font-semibold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: color }}
            >
              Activer
            </button>
          </div>
        </div>
      )}

      {/* iOS install banner */}
      {showIOSBanner && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3">
          <span className="text-2xl shrink-0">📱</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-0.5">Installer l&apos;application</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              Appuyez sur{' '}
              <span className="inline-flex items-center align-middle mx-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12M8 7l4-4 4 4" />
                  <path d="M20 16v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3" />
                </svg>
              </span>{' '}
              en bas, puis{' '}
              <span className="font-bold">Ajouter à l&apos;écran d&apos;accueil</span>
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
            <p className="text-sm font-semibold">Installer Izou</p>
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
                        {/* Horizontal progress bar */}
                        <div className="relative pt-2 pb-8">
                          {/* Track */}
                          <div className="h-2 bg-gray-100 rounded-full relative">
                            {/* Fill */}
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${progressPct}%`, backgroundColor: color }}
                            />
                          </div>

                          {/* Tier markers */}
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

                        {/* Next tier text */}
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
                      onClick={() => setShowWheel(true)}
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
            </>
          )}

          {/* ── Missions ── */}
          {activeTab === 'missions' && (
            <>
              {missionsLoading ? (
                <div className="flex items-center justify-center py-12 -mt-4">
                  <div className="w-7 h-7 border-3 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: color }} />
                </div>
              ) : missions.length === 0 ? (
                <div className="-mt-4 bg-white rounded-2xl shadow-sm p-6 text-center">
                  <p className="text-gray-400 text-sm">Aucune mission disponible pour le moment</p>
                </div>
              ) : (
                <div className="-mt-4 bg-white rounded-2xl shadow-sm p-5 space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Missions
                  </p>

                  <div className="space-y-3">
                    {missions.map((m) => {
                      const isCompleted = m.completed
                      const isPending = m.pending

                      return (
                        <div key={m.id} className="flex items-start gap-3">
                          <span className="text-base mt-0.5 shrink-0">
                            {isCompleted ? '\u2705' : isPending ? '\u23F3' : m.template_key === 'monthly_visits' && m.progress ? '\u25D0' : '\u2610'}
                          </span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-medium ${isCompleted ? 'text-green-700' : 'text-gray-800'}`}>
                                {m.template_key === 'google_review' && 'Laisser un avis Google'}
                                {m.template_key === 'complete_profile' && 'Compléter votre profil'}
                                {m.template_key === 'referral' && 'Parrainer un ami'}
                                {m.template_key === 'monthly_visits' && `${(m.config?.target as number) ?? 5} visites ce mois`}
                              </p>
                              <span className="text-xs font-semibold shrink-0" style={{ color }}>
                                +{m.reward_points} pt{m.reward_points > 1 ? 's' : ''}
                              </span>
                            </div>

                            {m.template_key === 'monthly_visits' && m.progress && !isCompleted && (
                              <div className="mt-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${Math.min(100, (m.progress.current / m.progress.target) * 100)}%`,
                                        backgroundColor: color,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[11px] text-gray-400 font-medium shrink-0">
                                    {m.progress.current}/{m.progress.target}
                                  </span>
                                </div>
                              </div>
                            )}

                            {m.template_key === 'google_review' && !isCompleted && !isPending && (
                              <div className="mt-2">
                                {!showReviewForm ? (
                                  <button
                                    onClick={() => setShowReviewForm(true)}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                                    style={{ backgroundColor: color }}
                                  >
                                    Soumettre
                                  </button>
                                ) : (
                                  <div className="flex gap-2">
                                    <input
                                      type="url"
                                      placeholder="Lien de votre avis Google"
                                      value={reviewUrl}
                                      onChange={(e) => setReviewUrl(e.target.value)}
                                      className="flex-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                      onClick={async () => {
                                        if (!reviewUrl.trim()) return
                                        setReviewSubmitting(true)
                                        try {
                                          const res = await fetch('/api/missions/complete', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ cardId: card.id, templateKey: 'google_review', proofUrl: reviewUrl }),
                                          })
                                          if (res.ok) {
                                            setMissions(missions.map((mi) =>
                                              mi.id === m.id ? { ...mi, pending: true } : mi
                                            ))
                                            setShowReviewForm(false)
                                            setReviewUrl('')
                                          }
                                        } catch { /* ignore */ }
                                        setReviewSubmitting(false)
                                      }}
                                      disabled={reviewSubmitting}
                                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white shrink-0"
                                      style={{ backgroundColor: color }}
                                    >
                                      {reviewSubmitting ? '...' : 'Valider'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            {m.template_key === 'google_review' && isPending && (
                              <p className="text-xs text-amber-600 mt-1">En attente de validation</p>
                            )}
                            {m.template_key === 'google_review' && isCompleted && (
                              <p className="text-xs text-green-600 mt-1">Fait !</p>
                            )}

                            {m.template_key === 'complete_profile' && !isCompleted && (
                              <div className="mt-2">
                                {!showProfileForm ? (
                                  <button
                                    onClick={() => setShowProfileForm(true)}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                                    style={{ backgroundColor: color }}
                                  >
                                    Compléter
                                  </button>
                                ) : (
                                  <div className="space-y-2 mt-1">
                                    <input
                                      type="email"
                                      placeholder="Email"
                                      value={profileEmail}
                                      onChange={(e) => setProfileEmail(e.target.value)}
                                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <input
                                      type="date"
                                      placeholder="Date d'anniversaire"
                                      value={profileBirthday}
                                      onChange={(e) => setProfileBirthday(e.target.value)}
                                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                      onClick={async () => {
                                        setProfileSaving(true)
                                        try {
                                          const res = await fetch('/api/card/update-profile', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              cardId: card.id,
                                              email: profileEmail || undefined,
                                              birthday: profileBirthday || undefined,
                                            }),
                                          })
                                          const data = await res.json()
                                          if (data.mission_completed) {
                                            setMissions(missions.map((mi) =>
                                              mi.id === m.id ? { ...mi, completed: true } : mi
                                            ))
                                            setPointsBalance((prev) => prev + (data.points_awarded ?? 0))
                                          }
                                          setShowProfileForm(false)
                                        } catch { /* ignore */ }
                                        setProfileSaving(false)
                                      }}
                                      disabled={profileSaving}
                                      className="text-xs font-semibold px-4 py-2 rounded-lg text-white"
                                      style={{ backgroundColor: color }}
                                    >
                                      {profileSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            {m.template_key === 'complete_profile' && isCompleted && (
                              <p className="text-xs text-green-600 mt-1">Fait !</p>
                            )}

                            {m.template_key === 'referral' && (
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(referralCode).catch(() => {})
                                    setCodeCopied(true)
                                    setTimeout(() => setCodeCopied(false), 2000)
                                  }}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                                  style={{ borderColor: color, color }}
                                >
                                  {codeCopied ? 'Copié !' : `Mon code : ${referralCode}`}
                                </button>
                                {typeof navigator !== 'undefined' && 'share' in navigator && (
                                  <button
                                    onClick={() => {
                                      const joinUrl = business.short_code
                                        ? `${window.location.origin}/join/${business.short_code}`
                                        : window.location.origin
                                      navigator.share({
                                        title: `Rejoins ${business.business_name}`,
                                        text: `Rejoins ${business.business_name} sur Izou et gagne des points ! 🎁\nUtilise mon code parrain ${referralCode} à l'inscription.\n👉 ${joinUrl}`,
                                      }).catch(() => {})
                                    }}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                                    style={{ backgroundColor: color }}
                                  >
                                    Partager
                                  </button>
                                )}
                              </div>
                            )}

                            {m.template_key === 'monthly_visits' && isCompleted && (
                              <p className="text-xs text-green-600 mt-1">Fait !</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Referral code section (always visible if code exists) */}
              {referralCode && (
                <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Mon code parrain
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex-1 text-center text-lg font-bold tracking-wider py-2 rounded-xl"
                      style={{ backgroundColor: `${color}10`, color }}
                    >
                      {referralCode}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(referralCode).catch(() => {})
                        setCodeCopied(true)
                        setTimeout(() => setCodeCopied(false), 2000)
                      }}
                      className="shrink-0 p-2.5 rounded-xl border transition-colors"
                      style={{ borderColor: color, color }}
                    >
                      {codeCopied ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                      )}
                    </button>
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                      <button
                        onClick={() => {
                          const joinUrl = business.short_code
                            ? `${window.location.origin}/join/${business.short_code}`
                            : window.location.origin
                          navigator.share({
                            title: `Rejoins ${business.business_name}`,
                            text: `Rejoins ${business.business_name} sur Izou et gagne des points ! 🎁\nUtilise mon code parrain ${referralCode} à l'inscription.\n👉 ${joinUrl}`,
                          }).catch(() => {})
                        }}
                        className="shrink-0 p-2.5 rounded-xl text-white"
                        style={{ backgroundColor: color }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
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

      {/* Wheel modal */}
      {showWheel && (
        <WheelModal
          cardId={card.id}
          qrCodeId={card.qr_code_id}
          businessId={business.id}
          color={color}
          onClose={() => setShowWheel(false)}
          onResult={(newPoints) => {
            setPointsBalance(newPoints)
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 3500)
          }}
        />
      )}

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

/* ─── Wheel Modal Component ─── */

interface WheelSegment {
  id: string
  label: string
  emoji: string
  probability: number
}

interface WheelModalProps {
  cardId: string
  qrCodeId: string
  businessId: string
  color: string
  onClose: () => void
  onResult: (newPoints: number) => void
}

const WHEEL_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
]

function WheelModal({ cardId, qrCodeId, businessId, color, onClose, onResult }: WheelModalProps) {
  const [segments, setSegments] = useState<WheelSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<{ label: string; emoji: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/wheel/${qrCodeId}`)
      .then(r => r.json())
      .then(data => {
        if (data.segments) setSegments(data.segments)
        else setError(data.error || 'Roue indisponible')
        setLoading(false)
      })
      .catch(() => {
        setError('Erreur de chargement')
        setLoading(false)
      })
  }, [qrCodeId])

  async function handleSpin() {
    if (spinning || segments.length < 2) return
    setSpinning(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, businessId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur')
        setSpinning(false)
        return
      }

      const winnerIdx = data.winner_index ?? 0
      const segAngle = 360 / segments.length
      // Target angle: land in the middle of the winning segment
      // Top of wheel = 0°, segments go clockwise from top
      const targetAngle = 360 - (winnerIdx * segAngle + segAngle / 2)
      const totalRotation = rotation + 360 * 5 + targetAngle
      setRotation(totalRotation)

      // Wait for animation to finish (4s ease-out)
      setTimeout(() => {
        setResult({ label: data.prize.label, emoji: data.prize.emoji })
        onResult(data.new_points)
        setSpinning(false)
      }, 4200)
    } catch {
      setError('Erreur réseau')
      setSpinning(false)
    }
  }

  const segAngle = segments.length > 0 ? 360 / segments.length : 360

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(var(--wheel-rotation)); }
        }
      `}</style>
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
        <h2 className="text-lg font-bold text-center mb-4">🎡 Roue de la fortune</h2>

        {loading && <p className="text-center text-gray-400 py-8">Chargement...</p>}

        {error && !loading && (
          <p className="text-center text-red-500 text-sm py-4">{error}</p>
        )}

        {!loading && segments.length >= 2 && (
          <div className="flex flex-col items-center gap-4">
            {/* Pointer */}
            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 text-2xl">▼</div>
              {/* Wheel SVG */}
              <svg
                width="280"
                height="280"
                viewBox="0 0 280 280"
                className="drop-shadow-lg"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}
              >
                {segments.map((seg, i) => {
                  const startAngle = (i * segAngle - 90) * (Math.PI / 180)
                  const endAngle = ((i + 1) * segAngle - 90) * (Math.PI / 180)
                  const cx = 140, cy = 140, r = 130
                  const x1 = cx + r * Math.cos(startAngle)
                  const y1 = cy + r * Math.sin(startAngle)
                  const x2 = cx + r * Math.cos(endAngle)
                  const y2 = cy + r * Math.sin(endAngle)
                  const largeArc = segAngle > 180 ? 1 : 0
                  const midAngle = ((i + 0.5) * segAngle - 90) * (Math.PI / 180)
                  const textR = r * 0.65
                  const tx = cx + textR * Math.cos(midAngle)
                  const ty = cy + textR * Math.sin(midAngle)
                  const textAngle = (i + 0.5) * segAngle

                  return (
                    <g key={seg.id}>
                      <path
                        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
                        fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x={tx}
                        y={ty}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                        transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                      >
                        {seg.emoji} {seg.label.length > 10 ? seg.label.slice(0, 9) + '…' : seg.label}
                      </text>
                    </g>
                  )
                })}
                <circle cx="140" cy="140" r="18" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                <text x="140" y="140" textAnchor="middle" dominantBaseline="central" fontSize="16">🎡</text>
              </svg>
            </div>

            {/* Result */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                <p className="text-lg font-bold text-green-700">{result.emoji} {result.label}</p>
                <p className="text-xs text-green-600 mt-1">Félicitations !</p>
              </div>
            )}

            {/* Spin button */}
            {!result && (
              <button
                onClick={handleSpin}
                disabled={spinning}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60"
                style={{ backgroundColor: color }}
              >
                {spinning ? 'La roue tourne...' : 'Tourner !'}
              </button>
            )}

            {result && (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                style={{ borderColor: color, color }}
              >
                Fermer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Augment the BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
