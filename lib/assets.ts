/**
 * Helpers pour resoudre les URLs des assets stockes dans Supabase Storage.
 *
 * Convention de buckets :
 *   - public-assets    : marketing/branding (lecture publique, upload admin).
 *                        Ex : auth/balloons-landscape.webp, branding/izou-logo-noir.svg
 *   - business-logos   : logos uploades par les commercants. INSERT/UPDATE/DELETE
 *                        RLS sur owner (premier segment = auth.uid()), SELECT public
 *                        pour permettre l'affichage cote client (cartes, Apple Wallet).
 *                        Ex : {business_id}/logo.{ext}
 *   - business-banners : bannieres uploadees par les commercants. Memes regles que
 *                        business-logos. Ex : {business_id}/banner.{ext}
 *   - qr-codes         : cache PNG des QR codes generes (RLS sur owner).
 *                        Ex : {business_id}/qr.png
 *
 * Voir docs/architecture/assets-strategy.md pour la strategie complete.
 */

// Strip trailing slash si l'env var Vercel en a un (sinon URL devient
// supabase.co//storage avec double slash -> Next/image refuse parfois)
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');

/** URL publique d'un asset marketing/branding. */
export function getPublicAsset(path: string): string {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${SUPABASE_URL}/storage/v1/object/public/public-assets/${clean}`;
}

/** Path Storage pour un logo de commercant. */
export function getBusinessLogoPath(businessId: string, filename: string): string {
  return `${businessId}/${filename}`;
}

/** Path Storage pour une banniere de commercant. */
export function getBusinessBannerPath(businessId: string, filename: string): string {
  return `${businessId}/${filename}`;
}

/** URL publique pour un asset commercant (bucket public-read mais owner-only write). */
export function getBusinessAssetUrl(bucket: 'business-logos' | 'business-banners', path: string): string {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${clean}`;
}

/** Path Storage pour un QR code cache. */
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
    /** Hero ballon onboarding (Figma A2/A3/A4/A5) — single balloon + sky background. */
    onboardingBalloon: getPublicAsset('branding/loyalty-card-balloon.webp'),
  },
  cards: {
    /** Image par defaut pour le cote droit de la carte fidelite (montgolfiere + paysage).
     * Sera remplacee par un upload propre au commerce quand la feature sera implementee. */
    loyaltyDefault: getPublicAsset('cards/loyalty-card-default.webp'),
  },
} as const;
