/**
 * Helpers pour resoudre les URLs des assets stockes dans Supabase Storage.
 *
 * Convention de buckets :
 *   - public-assets   : marketing/branding (lecture publique, upload admin via dashboard).
 *                       Ex : auth/balloons-landscape.webp, branding/izou-logo-noir.svg
 *   - business-logos  : logos uploades par les commercants (RLS sur owner).
 *                       Ex : {business_id}/logo.png
 *   - qr-codes        : cache PNG des QR codes generes (RLS sur owner).
 *                       Ex : {business_id}/qr.png
 *
 * Voir docs/architecture/assets-strategy.md pour la strategie complete.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/** URL publique d'un asset marketing/branding. */
export function getPublicAsset(path: string): string {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${SUPABASE_URL}/storage/v1/object/public/public-assets/${clean}`;
}

/** URL signee a generer cote serveur pour un logo de commercant (private bucket). */
export function getBusinessLogoPath(businessId: string, filename: string): string {
  return `${businessId}/${filename}`;
}

/** URL signee a generer cote serveur pour un QR code cache (private bucket). */
export function getQRCodePath(businessId: string): string {
  return `${businessId}/qr.png`;
}

/**
 * Catalogue des assets publics utilises dans l'app.
 * Centraliser ici evite de coder en dur les chemins partout.
 */
export const PUBLIC_ASSETS = {
  auth: {
    balloons: getPublicAsset('auth/balloons-landscape.webp'),
    marieCap: getPublicAsset('auth/marie-cap.jpg'),
    cardPocket: getPublicAsset('auth/card-pocket.png'),
  },
  branding: {
    logoNoir: getPublicAsset('branding/izou-logo-noir.svg'),
    logoBlanc: getPublicAsset('branding/izou-logo-blanc.svg'),
  },
  cards: {
    /** Image par defaut pour le cote droit de la carte fidelite (montgolfiere + paysage).
     * Sera remplacee par un upload propre au commerce quand la feature sera implementee. */
    loyaltyDefault: getPublicAsset('cards/loyalty-card-default.webp'),
  },
} as const;
