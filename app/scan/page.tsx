import ScanClient from './ScanClient'

export const metadata = {
  title: 'Scanner — Izou',
  description: 'Scannez le QR code d\'un commerce pour rejoindre son programme de fidélité.',
}

/**
 * `/scan` — chemin 3 d'inscription client (Story 4.2.e, Figma A1).
 *
 * Le client arrive ici depuis l'espace `/me` (bouton "Scanner") ou un
 * lien direct. Décode le QR commerçant qui contient l'URL `/join/{shortCode}`,
 * puis redirige vers le formulaire d'onboarding.
 */
export default function ScanPage() {
  return <ScanClient />
}
