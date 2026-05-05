-- =============================================================================
-- Migration : Add business.website_url + business.booking_url
-- Date      : 2026-05-05
-- Reference : Retour user 2026-05-05 — permettre aux commerçants d'ajouter
--             d'autres liens externes que GMB sur la page Entreprise client
--             (notamment lien de réservation pour les coiffeurs, restos, etc.)
-- =============================================================================
--
-- CONTEXT
--
-- Jusqu'ici la page Entreprise client n'expose que le lien GMB (`gmb_url`).
-- Les prestataires service ont souvent un site internet et/ou un outil de
-- réservation tiers (Treatwell, Resamania, TheFork, Calendly...) qu'ils
-- veulent partager avec leurs clients. Plutôt que d'implémenter nativement
-- la prise de rendez-vous (out of scope v1), on permet de coller un lien
-- vers leur outil externe.
--
-- Migration appliquée en prod via MCP le 2026-05-05.
--
-- =============================================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS booking_url text;

COMMENT ON COLUMN public.businesses.website_url IS
  'URL du site internet du commerce (optionnel). Affichée sur la page Entreprise client si présente.';
COMMENT ON COLUMN public.businesses.booking_url IS
  'URL externe de réservation (Resamania, Treatwell, TheFork, Calendly...). Affichée comme CTA "Réserver" sur la page Entreprise client si présente.';
