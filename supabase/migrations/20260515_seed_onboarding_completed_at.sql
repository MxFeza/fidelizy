-- Refonte onboarding merchant 5 etapes (2026-05-15).
--
-- Le layout protected redirige desormais vers /dashboard/onboarding tant que
-- `onboarding_completed_at` est NULL (au lieu d'utiliser uniquement
-- business_type comme proxy). Pour ne pas bloquer les commerces legacy qui
-- ont deja passe l'ancien onboarding simplifie (selection metier
-- uniquement), on backfill onboarding_completed_at = NOW() pour tous ceux
-- qui ont deja un business_type configure.
--
-- Effet collateral attendu : ces commerces ne verront pas le nouveau
-- wizard 5 etapes (et c'est volontaire — ils ont deja configure leur
-- programme manuellement). Ils pourront le refaire via "Refaire la visite"
-- depuis Profil > Aide & support (mode reset existant dans
-- /api/business/onboarding/complete).

UPDATE businesses
SET onboarding_completed_at = COALESCE(onboarding_completed_at, NOW())
WHERE business_type IS NOT NULL
  AND onboarding_completed_at IS NULL;

COMMENT ON COLUMN businesses.onboarding_completed_at IS
  'Timestamp de fin de l onboarding initial 5 etapes (Intro / Metier / Carte / Paliers / Apercu). Tant que NULL le layout protected redirige vers /dashboard/onboarding.';
