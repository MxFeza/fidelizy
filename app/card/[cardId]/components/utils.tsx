/**
 * Onglets locaux geres par CardPageClient (state-based, sans changement de route).
 * Les onglets Entreprise / Scanner / Parrainage sont des routes separees.
 *
 * 2026-05-01 : Onglet 'history' retire de la nav (decision user — peu utile).
 *              L'activite recente est integree dans le CardTab. L'onglet
 *              'Entreprise' (route /business) prend sa place dans la nav v4.
 */
export type Tab = 'card' | 'profile'

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}
