-- Story 8.1 — Mon entreprise (Figma G1b)
-- Ajout des colonnes manquantes pour le profil commercant complet.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS gmb_url text,
  ADD COLUMN IF NOT EXISTS gmb_visible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS opening_hours text,
  ADD COLUMN IF NOT EXISTS banner_url text;

-- Note : logo_url existe deja (deja utilise par cartes loyalty + Apple Wallet).
