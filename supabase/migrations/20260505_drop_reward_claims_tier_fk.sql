-- =============================================================================
-- Migration : Drop reward_claims.reward_tier_id FK to legacy reward_tiers table
-- Date      : 2026-05-05
-- Reference : Story 4.4 — claimReward migration table → JSONB
-- =============================================================================
--
-- CONTEXT
--
-- claimReward() lisait jusqu'ici les paliers depuis la table legacy
-- `reward_tiers` (anciennement source de vérité, remplacée par le JSONB
-- `business.reward_tiers` depuis Story 4.3.b côté client). Pour finaliser
-- la migration et permettre de drop la table legacy à terme, on supprime
-- la contrainte FK reward_claims_reward_tier_id_fkey.
--
-- Les ids des tiers JSONB sont déjà au format UUID (vérifié sur prod :
-- ex `955150d6-801c-4d0c-8a53-c5e76403c677`), donc la colonne UUID
-- reward_claims.reward_tier_id est conservée — elle référence simplement
-- l'id stocké dans le JSONB business.reward_tiers au moment du claim.
--
-- Cette migration a été appliquée en prod via MCP le 2026-05-05.
-- Le fichier reste pour traçabilité et reproductibilité dev/staging.
--
-- =============================================================================

ALTER TABLE public.reward_claims
  DROP CONSTRAINT IF EXISTS reward_claims_reward_tier_id_fkey;

COMMENT ON COLUMN public.reward_claims.reward_tier_id IS
  'UUID du tier — référence l''id stocké dans businesses.reward_tiers (JSONB) depuis Story 4.4. Plus de FK strict vers la table legacy reward_tiers.';
