-- Rattrapage : colonnes ajoutees en DB Supabase mais sans migration versionnee.
-- IF NOT EXISTS partout pour idempotence (safe a re-jouer).

-- Onboarding & marketing
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS welcome_seen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_type text CHECK (business_type IN ('cafe','restaurant','bakery','snack','hair','nails')),
  ADD COLUMN IF NOT EXISTS program_name text,
  ADD COLUMN IF NOT EXISTS program_description text;

-- Parrainage commercant (Epic 5.4)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS referral_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_referrer_bonus integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS referral_referred_bonus integer NOT NULL DEFAULT 50;

-- Anti-fraude scan : delai mini entre 2 scans du meme client (heures)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS scan_cooldown_hours integer NOT NULL DEFAULT 4;

-- Paliers de recompense (JSONB, source unique de verite Epic 5.3)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS reward_tiers jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Index pour requetes parrainage actif
CREATE INDEX IF NOT EXISTS businesses_referral_enabled_idx
  ON businesses (referral_enabled)
  WHERE referral_enabled = true;
