-- B2 Fix : rendre le bucket business-logos accessible publiquement (lecture)
--   - Avant : public=false + policy SELECT owner-only authentifie
--     -> Les clients (non-auth en tant qu'owner) ne pouvaient pas lire le
--        logo affiche sur leur carte fidelite
--   - Apres : public=true (memes regles que business-banners)
--   - INSERT/UPDATE/DELETE restent owner-only via les policies existantes
--
-- Cleanup additionnel : URLs en DB avec double-slash (legacy avant
-- commit 3406bbe qui strip le trailing slash de NEXT_PUBLIC_SUPABASE_URL)

UPDATE storage.buckets SET public = true WHERE id = 'business-logos';

UPDATE businesses
SET logo_url = REPLACE(logo_url, '.co//storage', '.co/storage')
WHERE logo_url LIKE '%.co//storage%';

UPDATE businesses
SET banner_url = REPLACE(banner_url, '.co//storage', '.co/storage')
WHERE banner_url LIKE '%.co//storage%';

-- Drop la policy SELECT owner-only (devenue redondante avec public=true)
DROP POLICY IF EXISTS "business-logos owner read" ON storage.objects;
