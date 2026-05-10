'use client'

/**
 * Composant unifie pour proposer l'install PWA.
 *
 * Gere les 3 modes :
 *  - Android/Desktop Chromium : event `beforeinstallprompt` capte, prompt natif via .prompt()
 *  - iOS Safari : pas d'API, tutoriel visuel (icone Partager > Ajouter a l'ecran d'accueil)
 *  - Deja installee (display-mode standalone) : ne rend rien + persiste pwa_installed_at
 *
 * Le composant peut etre rendu dans deux contextes :
 *  - mode="banner" (default) : banner sticky-bottom auto-displayed
 *  - mode="modal" : controle via prop `open` (declenche depuis le banner progression)
 *
 * Critere d'acceptation §11.4 et §11.8 (remplace les anciens banners iOS/Android).
 *
 * Story 9.2 §6 + §10.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Download01, X as XIcon } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

interface PwaInstallPromptProps {
  /**
   * "banner" : banner persistant auto-affiche tant que non-dismiss et non-installe.
   * "modal"  : modal controle, ouvert via `open` prop.
   */
  mode?: 'banner' | 'modal'
  /**
   * Pour mode="modal" : controle d'ouverture par le parent.
   */
  open?: boolean
  /**
   * Pour mode="modal" : appele quand le user ferme.
   */
  onClose?: () => void
  /**
   * Couleur primaire merchant (CTA install Android).
   */
  color?: string
  /**
   * Notifie le parent quand l'install est confirme (Android prompt accepted ou
   * detection display-mode standalone). Le parent peut alors marquer
   * pwa_installed_at + masquer la tache du banner progression.
   */
  onInstalled?: () => void
}

/**
 * Hook qui expose l'etat install PWA partage entre tous les composants
 * qui veulent en savoir plus (banner et tache du progress banner par ex.).
 */
export function usePwaInstallState() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(isInStandaloneMode())
     
    setIsIOS(isIOSDevice())
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Detect app installed (Android event)
  useEffect(() => {
    const handler = () => setInstallEvent(null)
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  return { installEvent, isStandalone, isIOS, setInstallEvent }
}

export default function PwaInstallPrompt({
  mode = 'banner',
  open,
  onClose,
  color = '#7F56D9',
  onInstalled,
}: PwaInstallPromptProps) {
  const { installEvent, isStandalone, isIOS, setInstallEvent } = usePwaInstallState()
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [showIOSTutorial, setShowIOSTutorial] = useState(false)
  const installedSentRef = useRef(false)

  // Persist pwa_installed_at quand on detecte standalone, idempotent.
  useEffect(() => {
    if (!isStandalone || installedSentRef.current) return
    installedSentRef.current = true
    fetch('/api/me/onboarding/pwa-installed', { method: 'POST' }).catch(() => {})
    onInstalled?.()
  }, [isStandalone, onInstalled])

  // Banner mode : sessionStorage dismiss persistance.
  useEffect(() => {
    if (mode !== 'banner') return
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('pwa_install_dismissed') === '1') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBannerDismissed(true)
    }
  }, [mode])

  const handleAndroidInstall = useCallback(async () => {
    if (!installEvent) return
    try {
      await installEvent.prompt()
      const { outcome } = await installEvent.userChoice
      if (outcome === 'accepted') {
        setInstallEvent(null)
        if (!installedSentRef.current) {
          installedSentRef.current = true
          fetch('/api/me/onboarding/pwa-installed', { method: 'POST' }).catch(() => {})
          onInstalled?.()
        }
      }
    } catch {
      // user cancelled — silent
    }
  }, [installEvent, onInstalled, setInstallEvent])

  const handleIOSCTA = useCallback(() => {
    setShowIOSTutorial(true)
  }, [])

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa_install_dismissed', '1')
    }
  }, [])

  // Si on est en standalone, on ne montre plus le prompt (deja installe).
  if (isStandalone) return null

  // Modal mode
  if (mode === 'modal') {
    if (!open) return null
    return (
      <ModalShell onClose={() => onClose?.()}>
        {isIOS ? (
          <IOSTutorial onClose={() => onClose?.()} />
        ) : installEvent ? (
          <AndroidPrompt
            color={color}
            onInstall={async () => {
              await handleAndroidInstall()
              onClose?.()
            }}
            onClose={() => onClose?.()}
          />
        ) : (
          <DesktopFallback onClose={() => onClose?.()} />
        )}
      </ModalShell>
    )
  }

  // Banner mode — auto display
  if (bannerDismissed) return null

  // Modal IOS tutorial declenchee depuis le banner CTA
  if (showIOSTutorial) {
    return (
      <ModalShell onClose={() => setShowIOSTutorial(false)}>
        <IOSTutorial onClose={() => setShowIOSTutorial(false)} />
      </ModalShell>
    )
  }

  if (isIOS) {
    return (
      <BannerShell onDismiss={dismissBanner}>
        <BannerContent
          title="Installer l'application"
          body={
            <>
              Tapez sur{' '}
              <ShareIcon />
              {' '}en bas, puis <strong className="font-semibold">Ajouter à l’écran d’accueil</strong>
            </>
          }
          ctaLabel="Comment faire ?"
          color={color}
          onCTA={handleIOSCTA}
        />
      </BannerShell>
    )
  }

  if (installEvent) {
    return (
      <BannerShell onDismiss={dismissBanner}>
        <BannerContent
          title="Installer Izou"
          body="Accédez à votre carte en un tap"
          ctaLabel="Installer"
          color={color}
          onCTA={handleAndroidInstall}
        />
      </BannerShell>
    )
  }

  // Desktop / Firefox sans support — pas de banner intrusif.
  return null
}

/* ---------- Sub-components ---------- */

function BannerShell({ children, onDismiss }: { children: React.ReactNode; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3">
      {children}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer"
        className="text-gray-400 hover:text-white text-xl leading-none shrink-0 mt-0.5"
      >
        ×
      </button>
    </div>
  )
}

function BannerContent({
  title,
  body,
  ctaLabel,
  color,
  onCTA,
}: {
  title: string
  body: React.ReactNode
  ctaLabel: string
  color: string
  onCTA: () => void
}) {
  return (
    <>
      <Download01 className="size-7 shrink-0 text-white" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-0.5">{title}</p>
        <p className="text-xs text-gray-300 leading-relaxed">{body}</p>
      </div>
      <button
        type="button"
        onClick={onCTA}
        className="shrink-0 text-white text-xs font-semibold px-3 py-1.5 rounded-xl"
        style={{ backgroundColor: color }}
      >
        {ctaLabel}
      </button>
    </>
  )
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center md:justify-center"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {children}
      </div>
    </div>
  )
}

function IOSTutorial({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Installer Izou sur l’écran d’accueil</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="size-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 -mt-1 -mr-1"
        >
          <XIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
      <ol className="space-y-4">
        <Step
          number={1}
          body={
            <>
              Tapez sur le bouton <strong>Partager</strong> <ShareIcon />en bas de Safari
            </>
          }
        />
        <Step number={2} body={<>Faites défiler et choisissez <strong>Ajouter à l’écran d’accueil</strong></>} />
        <Step number={3} body={<>Confirmez en tapant <strong>Ajouter</strong></>} />
      </ol>
      <Button type="button" size="lg" color="primary" className="w-full mt-6" onClick={onClose}>
        J&apos;ai compris
      </Button>
    </div>
  )
}

function AndroidPrompt({
  color,
  onInstall,
  onClose,
}: {
  color: string
  onInstall: () => void
  onClose: () => void
}) {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Installer Izou</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="size-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 -mt-1 -mr-1"
        >
          <XIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">
        Accédez à votre carte en un tap depuis l&apos;écran d&apos;accueil et activez les notifications.
      </p>
      <div className="flex flex-col gap-2 mt-6">
        <button
          type="button"
          onClick={onInstall}
          className="w-full text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors"
          style={{ backgroundColor: color }}
        >
          Installer maintenant
        </button>
        <Button type="button" size="md" color="link-gray" className="w-full" onClick={onClose}>
          Plus tard
        </Button>
      </div>
    </div>
  )
}

function DesktopFallback({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Ouvrez Izou sur votre mobile</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="size-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 -mt-1 -mr-1"
        >
          <XIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">
        L&apos;installation comme application est disponible sur iPhone et Android. Ouvrez la carte sur votre téléphone pour l&apos;ajouter à l&apos;écran d&apos;accueil.
      </p>
      <Button type="button" size="lg" color="primary" className="w-full mt-6" onClick={onClose}>
        D&apos;accord
      </Button>
    </div>
  )
}

function Step({ number, body }: { number: number; body: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="size-6 shrink-0 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center mt-0.5">
        {number}
      </span>
      <p className="text-sm text-gray-700 leading-relaxed">{body}</p>
    </li>
  )
}

function ShareIcon() {
  return (
    <span className="inline-flex items-center align-middle mx-0.5">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3v12M8 7l4-4 4 4" />
        <path d="M20 16v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3" />
      </svg>
    </span>
  )
}
