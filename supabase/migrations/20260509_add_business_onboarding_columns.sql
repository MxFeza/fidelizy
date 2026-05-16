-- Story 9.1 — Activation coach commerçant (2026-05-09)
-- Ajoute 4 colonnes timestamptz nullable à businesses pour piloter le widget
-- OnboardingChecklist + modal Welcome.
--
-- Toutes les colonnes sont nullable (= NULL signifie "pas encore fait").
-- IF NOT EXISTS pour idempotence (safe à re-jouer).

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS onboarding_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS qr_printed_at timestamptz,
  ADD COLUMN IF NOT EXISTS notif_setup_at timestamptz;

COMMENT ON COLUMN public.businesses.onboarding_started_at IS
  'Story 9.1 — Timestamp click sur Welcome modal (Commencer ou Plus tard). NULL = modal jamais vu, sera affiché au prochain login. Empêche le re-affichage.';

COMMENT ON COLUMN public.businesses.onboarding_completed_at IS
  'Story 9.1 — 100% checklist done (toutes les 7 tâches). Masque le widget OnboardingChecklist en sidebar. Reset à NULL via "Refaire la visite".';

COMMENT ON COLUMN public.businesses.qr_printed_at IS
  'Story 9.1 — Timestamp click sur "J''ai imprimé mon QR" dans la checklist (tâche 4). Idempotent : pas de re-écriture si déjà set.';

COMMENT ON COLUMN public.businesses.notif_setup_at IS
  'Story 9.1 — Timestamp activation des notifications push (tâche 6 checklist). Idempotent.';
