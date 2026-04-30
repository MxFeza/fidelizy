'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell01 } from '@untitledui/icons'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { Business, LoyaltyCard, Customer, Transaction, RewardTier } from '@/lib/types'
import { type Tab, isIOS, isInStandaloneMode, type BeforeInstallPromptEvent } from './components/utils'
import ConfettiEffect from './components/ConfettiEffect'
import CardTab from './components/CardTab'
import HistoryTab from './components/HistoryTab'
import WheelModal from './components/WheelModal'
import PushBanner from './components/PushBanner'
import ProfileTab from './components/ProfileTab'
import TopBarClient from '@/components/client/TopBarClient'
import BottomTabBarClient from '@/components/client/BottomTabBarClient'

interface Props {
  card: LoyaltyCard & { customers: Customer | null }
  business: Business
  transactions: Transaction[]
  rewardTiers: RewardTier[]
  cardToken: string
}

export default function CardPageClient({ card, business, transactions, rewardTiers, cardToken }: Props) {
  const searchParams = useSearchParams()
  const initialTab = (() => {
    const t = searchParams.get('tab')
    if (t === 'history' || t === 'profile') return t
    return 'card' as const
  })()
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
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

  const color = business.primary_color || '#7F56D9'
  const stampsRequired = business.stamps_required ?? 10
  const [stampsCount, setStampsCount] = useState(Math.min(card.current_stamps ?? 0, stampsRequired))
  const [pointsBalance, setPointsBalance] = useState(card.current_points ?? 0)
  const stampsRef = useRef(stampsCount)
  const shortCode = `${card.qr_code_id.slice(0, 4).toUpperCase()}-${card.qr_code_id.slice(4, 8).toUpperCase()}`
  const stampCols = stampsRequired <= 5 ? stampsRequired : stampsRequired % 4 === 0 ? 4 : 5

  const firstName = card.customers?.first_name?.trim() || 'Client'
  const statusLine = (() => {
    if (business.loyalty_type === 'stamps') {
      if (stampsCount >= stampsRequired) return 'Récompense débloquée — présentez votre code 🎉'
      if (stampsCount === 0) return 'Scannez votre premier QR pour démarrer'
      return `Encore ${stampsRequired - stampsCount} tampon${stampsRequired - stampsCount > 1 ? 's' : ''} pour débloquer votre récompense`
    }
    if (pointsBalance === 0) return 'Scannez votre premier QR pour démarrer'
    return `${pointsBalance} pts cumulés chez ${business.business_name}`
  })()

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

  // Track PWA visit (fire-and-forget)
  useEffect(() => {
    fetch(`/api/pwa-visit/${card.qr_code_id}`, { method: 'POST' }).catch(() => {})
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
            top: '4.5rem',
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
      <PushBanner
        cardId={card.id}
        showPushBanner={showPushBanner}
        onDismiss={() => setShowPushBanner(false)}
        color={color}
      />

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

      <div className="min-h-screen bg-gray-50 pb-24">
        <TopBarClient
          rightSlot={
            <Link
              href={`/card/${card.qr_code_id}/notifications`}
              aria-label="Notifications"
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Bell01 className="size-5" aria-hidden="true" />
            </Link>
          }
        />

        {/* Greeting header (Figma B2) */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-md mx-auto px-5 py-5">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Bienvenue {firstName} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">{statusLine}</p>
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
          {activeTab === 'card' && (
            <CardTab
              card={card}
              business={business}
              stampsCount={stampsCount}
              pointsBalance={pointsBalance}
              liveTiers={liveTiers}
              wheelStatus={wheelStatus}
              color={color}
              shortCode={shortCode}
              stampCols={stampCols}
              stampsRequired={stampsRequired}
              walletAvailable={walletAvailable}
              onShowWheel={() => setShowWheel(true)}
              onShowConfetti={() => {
                setShowConfetti(true)
                setTimeout(() => setShowConfetti(false), 3500)
              }}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              transactions={transactions}
              business={business}
              color={color}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              card={card}
              business={business}
              cardToken={cardToken}
              color={color}
            />
          )}
        </div>

        <footer className="max-w-md mx-auto px-5 pt-8 pb-4 text-center text-[11px] text-gray-400 space-x-2">
          <a href="/privacy" target="_blank" className="hover:text-gray-600 underline">Confidentialité</a>
          <span>·</span>
          <a href="/terms" target="_blank" className="hover:text-gray-600 underline">CGU</a>
          <span>·</span>
          <a href="/legal" target="_blank" className="hover:text-gray-600 underline">Mentions légales</a>
        </footer>
      </div>

      {/* Wheel modal */}
      {showWheel && (
        <WheelModal
          cardId={card.id}
          qrCodeId={card.qr_code_id}
          businessId={business.id}
          color={color}
          cardToken={cardToken}
          onClose={() => setShowWheel(false)}
          onResult={(newPoints) => {
            setPointsBalance(newPoints)
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 3500)
          }}
        />
      )}

      <BottomTabBarClient
        cardId={card.qr_code_id}
        activeLocal={activeTab}
        onLocalChange={(tab) => setActiveTab(tab)}
      />
    </>
  )
}
