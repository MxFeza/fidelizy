-- Story 9.2 — Activation coach client (PWA + Wallet en priorité)
-- Date : 2026-05-09
--
-- Ajoute 4 colonnes timestamptz à customers pour tracker la progression
-- de l'onboarding (sheet welcome + 3 tâches : carte créée / install PWA / Wallet).

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS onboarding_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS pwa_installed_at timestamptz,
  ADD COLUMN IF NOT EXISTS wallet_added_at timestamptz;

COMMENT ON COLUMN public.customers.onboarding_started_at IS
  'Timestamp 1er affichage du sheet Welcome (skip ou swipe). NULL = jamais affiche.';

COMMENT ON COLUMN public.customers.onboarding_completed_at IS
  'Timestamp completion 3/3 taches onboarding. Banner masque apres cette date.';

COMMENT ON COLUMN public.customers.pwa_installed_at IS
  'Timestamp install PWA detecte cote client (display-mode standalone) ou via prompt natif Android.';

COMMENT ON COLUMN public.customers.wallet_added_at IS
  'Timestamp ajout pkpass au Wallet. Set au telechargement reussi du .pkpass.';
