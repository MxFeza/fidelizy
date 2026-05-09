'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell01, Grid01 } from '@untitledui/icons'
import Link from 'next/link'
import type { Business, LoyaltyCard, Customer, Transaction, LoyaltyTier } from '@/lib/types'
import { isIOS } from './components/utils'
import ConfettiEffect from './components/ConfettiEffect'
import CardTab from './components/CardTab'
import WheelModal from './components/WheelModal'
import PushBanner from './components/PushBanner'
import TopBarClient from '@/components/client/TopBarClient'
import BottomTabBarClient from '@/components/client/BottomTabBarClient'
import Toast from '@/components/client/Toast'
import { Emoji } from '@/lib/emojis'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import OnboardingWelcomeSheet from '@/components/client/onboarding/OnboardingWelcomeSheet'
import OnboardingProgressBanner from '@/components/client/onboarding/OnboardingProgressBanner'
import PwaInstallPrompt from '@/components/client/onboarding/PwaInstallPrompt'
import type { OnboardingStatus } from '@/lib/onboarding/getCustomerTaskStatus'

interface Props {
  card: LoyaltyCard & { customers: Customer | null }
  business: Business
  transactions: Transaction[]
  tiers: LoyaltyTier[]
  cardToken: string
  /**
   * Status d'onboarding fourni en SSR pour eviter le flash auth client-side.
   * null = utilisateur non-connecte ou carte != customer connecte (mode preview).
   */
  initialOnboardingStatus: OnboardingStatus | null
}

export default function CardPageClient({
  card,
  business,
  transactions,
  tiers,
  cardToken,
  initialOnboardingStatus,
}: Props) {
  const [notification, setNotification] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [walletAvailable, setWalletAvailable] = useState(false)
  const [showPushBanner, setShowPushBanner] = useState(false)
  const [liveTiers, setLiveTiers] = useState(tiers)
  const [wheelStatus, setWheelStatus] = useState<{ enabled: boolean; cost: number; eligible: boolean } | null>(null)
  const [showWheel, setShowWheel] = useState(false)
  const isOnline = useOnlineStatus()

  // Onboarding state — initialise depuis SSR, refresh via /status au mount.
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(initialOnboardingStatus)
  const [showWelcomeSheet, setShowWelcomeSheet] = useState(
    initialOnboardingStatus ? !initialOnboardingStatus.started : false,
  )
  const [showInstallModal, setShowInstallModal] = useState(false)
  const completeSentRef = useRef(false)

  const color = business.primary_color || '#7F56D9'
  const stampsRequired = business.stamps_required ?? 10
  const [stampsCount, setStampsCount] = useState(Math.min(card.current_stamps ?? 0, stampsRequired))
  const [pointsBalance, setPointsBalance] = useState(card.current_points ?? 0)
  const stampsRef = useRef(stampsCount)
  const shortCode = `${card.qr_code_id.slice(0, 4).toUpperCase()}-${card.qr_code_id.slice(4, 8).toUpperCase()}`

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

  // Wallet availability — iOS uniquement (Android = Epic 6 a venir)
  // SSR-safe init via effect.
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWalletAvailable(true)
    }
    if (isIOS()) {
       
      setWalletAvailable(true)
    }
  }, [])

  // Push notification permission — SSR-safe init via effect
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('PushManager' in window)) return
    if (!('serviceWorker' in navigator)) return
    if (Notification.permission === 'granted') return
    if (Notification.permission === 'denied') return
    if (localStorage.getItem('fidelizy_push_dismissed')) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowPushBanner(true)
  }, [])

  // Track PWA visit (fire-and-forget)
  useEffect(() => {
    fetch(`/api/pwa-visit/${card.qr_code_id}`, { method: 'POST' }).catch(() => {})
  }, [card.qr_code_id])

  // Fetch live data immediately on mount then poll every 8s
  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch(`/api/card/${card.qr_code_id}/live`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data.tiers)) setLiveTiers(data.tiers as LoyaltyTier[])
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
          tiers?: LoyaltyTier[]
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

        if (Array.isArray(data.tiers)) setLiveTiers(data.tiers)
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Refresh onboarding status au mount client (pour capter changements depuis SSR).
  useEffect(() => {
    if (!initialOnboardingStatus) return
    let cancelled = false
    fetch('/api/me/onboarding/status', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (cancelled || !s) return
        setOnboardingStatus(s as OnboardingStatus)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [initialOnboardingStatus])

  // Refresh onboarding status (utilise apres une action qui change l'etat — ex: wallet ajoute).
  const refreshOnboarding = useCallback(async () => {
    try {
      const res = await fetch('/api/me/onboarding/status', { cache: 'no-store' })
      if (!res.ok) return
      const s = (await res.json()) as OnboardingStatus
      setOnboardingStatus(s)
    } catch {
      // silent
    }
  }, [])

  // Si 3/3 atteint, marque completed_at (idempotent) + toast + masquage banner.
  useEffect(() => {
    if (!onboardingStatus) return
    const allDone = onboardingStatus.tasks.every((t) => t.done)
    if (!allDone) return
    if (onboardingStatus.completed) return
    if (completeSentRef.current) return
    completeSentRef.current = true
    fetch('/api/me/onboarding/complete', { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then(() => {
         
        setOnboardingStatus((prev) => (prev ? { ...prev, completed: true } : prev))
         
        setNotification('Bravo, vous êtes prêt à fidéliser ! 🎉')
        setTimeout(() => setNotification(null), 4000)
      })
      .catch(() => {})
  }, [onboardingStatus])

  // Mark wallet ajoute (idempotent) + refresh status.
  const handleWalletClick = useCallback(() => {
    // Le download du .pkpass se fait via le href du <CardTab> bouton existant.
    // Ici on declenche aussi le download programmatique (depuis le sheet welcome
    // ou le banner progress) + tracking.
    if (typeof window !== 'undefined') {
      window.open(`/api/wallet/${card.qr_code_id}`, '_blank', 'noopener,noreferrer')
    }
    fetch('/api/me/onboarding/wallet-added', { method: 'POST' })
      .then(() => refreshOnboarding())
      .catch(() => {})
  }, [card.qr_code_id, refreshOnboarding])

  // PWA install — declenche depuis sheet ou banner progress.
  const handleInstallClick = useCallback(() => {
    setShowInstallModal(true)
  }, [])

  // Quand l'install PWA est confirme (display-mode standalone ou Android prompt accepted),
  // refresh le banner progress.
  const handlePwaInstalled = useCallback(() => {
    refreshOnboarding()
  }, [refreshOnboarding])

  // Quand le sheet welcome se ferme, on refresh status (started_at vient d'etre marque).
  const handleWelcomeClose = useCallback(() => {
    setShowWelcomeSheet(false)
    refreshOnboarding()
  }, [refreshOnboarding])

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
          }}
        >
          <Toast variant="success" title={notification} />
        </div>
      )}

      {/* Offline status — toast persistant tant que navigator.onLine === false */}
      {!isOnline && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md"
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
        >
          <Toast
            variant="error"
            title="Hors ligne"
            message="Vos tampons se synchroniseront à la reconnexion"
          />
        </div>
      )}

      {/* Push notification banner */}
      <PushBanner
        cardId={card.id}
        showPushBanner={showPushBanner}
        onDismiss={() => setShowPushBanner(false)}
        color={color}
      />

      {/* PWA install prompt (banner sticky-bottom auto-display + modal IOS tutorial)
          Story 9.2 §10 — remplace les anciens banners iOS/Android (cf. critere §11.8). */}
      <PwaInstallPrompt color={color} onInstalled={handlePwaInstalled} />

      {/* Modal install declenche depuis le sheet welcome ou le banner progress */}
      <PwaInstallPrompt
        mode="modal"
        open={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        color={color}
        onInstalled={handlePwaInstalled}
      />

      {/* Onboarding welcome sheet (1er acces uniquement) — Story 9.2 §4 */}
      {showWelcomeSheet && (
        <OnboardingWelcomeSheet
          firstName={firstName}
          businessName={business.business_name}
          onInstallClick={handleInstallClick}
          onWalletClick={handleWalletClick}
          onClose={handleWelcomeClose}
        />
      )}

      <div className="min-h-screen bg-gray-50 pb-24">
        <TopBarClient
          rightSlot={
            <div className="flex items-center gap-1">
              <Link
                href="/me"
                aria-label="Mes cartes"
                title="Mes cartes"
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Grid01 className="size-5" aria-hidden="true" />
              </Link>
              <Link
                href={`/card/${card.qr_code_id}/notifications`}
                aria-label="Notifications"
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Bell01 className="size-5" aria-hidden="true" />
              </Link>
            </div>
          }
        />

        {/* Greeting header (Figma B2) */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-md mx-auto px-5 py-5">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight inline-flex items-center gap-2">
              <span>Bienvenue {firstName}</span>
              <Emoji name="wave" size={26} />
            </h1>
            <p className="text-sm text-gray-500 mt-1">{statusLine}</p>
          </div>
        </div>

        {/* Onboarding progress banner — mobile only, masque a 3/3 (cf. spec §5 + §11.7) */}
        {onboardingStatus && !onboardingStatus.completed && (
          <div className="max-w-md mx-auto">
            <OnboardingProgressBanner
              status={onboardingStatus}
              color={color}
              onInstallClick={handleInstallClick}
              onWalletClick={handleWalletClick}
            />
          </div>
        )}

        {/* Tab content */}
        <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
          <CardTab
            card={card}
            business={business}
            transactions={transactions}
            stampsCount={stampsCount}
            pointsBalance={pointsBalance}
            liveTiers={liveTiers}
            wheelStatus={wheelStatus}
            color={color}
            shortCode={shortCode}
            stampsRequired={stampsRequired}
            walletAvailable={walletAvailable}
            onShowWheel={() => setShowWheel(true)}
            onShowConfetti={() => {
              setShowConfetti(true)
              setTimeout(() => setShowConfetti(false), 3500)
            }}
          />
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

      <BottomTabBarClient cardId={card.qr_code_id} />
    </>
  )
}
