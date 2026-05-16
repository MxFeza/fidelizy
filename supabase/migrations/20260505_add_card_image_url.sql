-- =============================================================================
-- Migration : Add card_image_url to businesses
-- Date      : 2026-05-05
-- Reference : Story 4.3.f — image carte custom (côté droit de la carte loyalty)
-- =============================================================================
--
-- CONTEXT
--
-- En v1, le côté droit de la carte loyalty affiche une image standard
-- (montgolfière) identique pour tous les commerces. Décision user 2026-05-05 :
-- promouvoir l'upload d'une image carte custom de v2 à v1, pour permettre
-- au commerçant de personnaliser l'identité visuelle de la carte présentée
-- à ses clients.
--
-- Le fichier sera stocké dans le bucket `business-banners` au path
-- `{user_id}/card.{ext}` (cohabite avec banner.{ext} sans collision puisque
-- le filename diffère). Ratio crop : 1:1 (carré), affiché côté droit de la
-- carte avec object-cover.
--
-- =============================================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS card_image_url text;

COMMENT ON COLUMN public.businesses.card_image_url IS
  'URL publique de l''image custom affichée côté droit de la carte loyalty client. Fallback : public-assets/cards/loyalty-card-default.webp (montgolfière) si null.';
