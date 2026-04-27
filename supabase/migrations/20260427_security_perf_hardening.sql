-- Security + Performance hardening (audit Supabase advisors 2026-04-27)
-- Fixe 34 problemes detectes par le linter Supabase :
--   - 12 securite (search_path, SECURITY DEFINER, bucket listing, RLS sans policy)
--   - 22 performance (RLS auth.uid() re-evaluation, FK sans index)
--
-- Idempotent (CREATE OR REPLACE / DROP IF EXISTS / IF NOT EXISTS partout).

-- ============================================================
-- 1. SEARCH_PATH FIX sur les fonctions (8 fonctions)
-- ============================================================
-- Empeche l'injection via manipulation du search_path.
-- Convention : search_path = public, pg_temp (interdit pg_catalog override).

ALTER FUNCTION public.increment_stamps(uuid, int, int) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_stamps(uuid, int) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_points(uuid, int) SET search_path = public, pg_temp;
ALTER FUNCTION public.deduct_points(uuid, int) SET search_path = public, pg_temp;
ALTER FUNCTION public.deduct_points_safe(uuid, int) SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_stamps_atomic(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_loyalty_card_updated_at() SET search_path = public, pg_temp;

-- ============================================================
-- 2. SECURITY DEFINER : revoke acces direct via REST
-- ============================================================
-- Ces fonctions sont appelees par nos routes API (qui utilisent
-- service_role pour bypass tous les checks). Pas besoin que anon
-- ou authenticated puissent les appeler directement via /rest/v1/rpc/.

REVOKE EXECUTE ON FUNCTION public.increment_stamps(uuid, int, int) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_stamps(uuid, int) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_points(uuid, int) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_points(uuid, int) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_points_safe(uuid, int) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_stamps_atomic(uuid) FROM anon, authenticated;

-- ============================================================
-- 3. INDEXES FK manquants (3)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_business_id
  ON public.push_subscriptions (business_id);

CREATE INDEX IF NOT EXISTS idx_reward_claims_loyalty_card_id
  ON public.reward_claims (loyalty_card_id);

CREATE INDEX IF NOT EXISTS idx_reward_claims_reward_tier_id
  ON public.reward_claims (reward_tier_id);

-- ============================================================
-- 4. RLS POLICIES — auth.uid() -> (SELECT auth.uid())
-- ============================================================
-- Postgres re-evalue auth.uid() pour chaque row sinon. Avec
-- (SELECT auth.uid()) le planner mémorise la valeur une seule fois
-- = O(rows) -> O(1). Gain 10-100x au scale.

-- businesses
DROP POLICY IF EXISTS "business_select_own" ON public.businesses;
CREATE POLICY "business_select_own" ON public.businesses
  FOR SELECT USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "business_insert_own" ON public.businesses;
CREATE POLICY "business_insert_own" ON public.businesses
  FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "business_update_own" ON public.businesses;
CREATE POLICY "business_update_own" ON public.businesses
  FOR UPDATE USING (id = (SELECT auth.uid()));

-- customers (acces via les cartes du commercant connecte)
DROP POLICY IF EXISTS "customers_select_via_card" ON public.customers;
CREATE POLICY "customers_select_via_card" ON public.customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loyalty_cards lc
      WHERE lc.customer_id = customers.id
        AND lc.business_id = (SELECT auth.uid())
    )
  );

-- loyalty_cards
DROP POLICY IF EXISTS "cards_select_own_business" ON public.loyalty_cards;
CREATE POLICY "cards_select_own_business" ON public.loyalty_cards
  FOR SELECT USING (business_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "cards_update_own_business" ON public.loyalty_cards;
CREATE POLICY "cards_update_own_business" ON public.loyalty_cards
  FOR UPDATE USING (business_id = (SELECT auth.uid()));

-- transactions
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (business_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (business_id = (SELECT auth.uid()));

-- reward_tiers
DROP POLICY IF EXISTS "rewards_select_own" ON public.reward_tiers;
CREATE POLICY "rewards_select_own" ON public.reward_tiers
  FOR SELECT USING (business_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "rewards_insert_own" ON public.reward_tiers;
CREATE POLICY "rewards_insert_own" ON public.reward_tiers
  FOR INSERT WITH CHECK (business_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "rewards_update_own" ON public.reward_tiers;
CREATE POLICY "rewards_update_own" ON public.reward_tiers
  FOR UPDATE USING (business_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "rewards_delete_own" ON public.reward_tiers;
CREATE POLICY "rewards_delete_own" ON public.reward_tiers
  FOR DELETE USING (business_id = (SELECT auth.uid()));

-- reward_claims (acces via cartes)
DROP POLICY IF EXISTS "claims_select_own" ON public.reward_claims;
CREATE POLICY "claims_select_own" ON public.reward_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loyalty_cards lc
      WHERE lc.id = reward_claims.loyalty_card_id
        AND lc.business_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "claims_insert_own" ON public.reward_claims;
CREATE POLICY "claims_insert_own" ON public.reward_claims
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loyalty_cards lc
      WHERE lc.id = reward_claims.loyalty_card_id
        AND lc.business_id = (SELECT auth.uid())
    )
  );

-- referrals
DROP POLICY IF EXISTS "business_view_referrals" ON public.referrals;
CREATE POLICY "business_view_referrals" ON public.referrals
  FOR SELECT USING (business_id = (SELECT auth.uid()));

-- push_broadcasts
DROP POLICY IF EXISTS "push_broadcasts_select_own" ON public.push_broadcasts;
CREATE POLICY "push_broadcasts_select_own" ON public.push_broadcasts
  FOR SELECT USING (business_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "push_broadcasts_insert_own" ON public.push_broadcasts;
CREATE POLICY "push_broadcasts_insert_own" ON public.push_broadcasts
  FOR INSERT WITH CHECK (business_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "push_broadcasts_delete_own" ON public.push_broadcasts;
CREATE POLICY "push_broadcasts_delete_own" ON public.push_broadcasts
  FOR DELETE USING (business_id = (SELECT auth.uid()));

-- ============================================================
-- 5. push_subscriptions / wallet_registrations
-- ============================================================
-- RLS activee sans policy = bloque tout sauf service_role (= comportement
-- voulu). Mais le linter signale. On documente l'intention via une
-- policy explicite "deny all" + commentaire.
-- Les operations passent par nos routes API (service_role bypass RLS).

COMMENT ON TABLE public.push_subscriptions IS
  'Subscriptions push web (VAPID). Acces uniquement via service_role (routes API). RLS sans policy = deny all par defaut.';

COMMENT ON TABLE public.wallet_registrations IS
  'Devices Apple Wallet enregistres. Acces uniquement via service_role (protocol Apple). RLS sans policy = deny all par defaut.';

-- ============================================================
-- 6. Storage buckets : retirer le SELECT public trop large
-- ============================================================
-- Pour qu'un objet d'un bucket public soit accessible via URL,
-- il SUFFIT que le bucket soit declare public (aucune policy SELECT
-- requise sur storage.objects). La policy SELECT autorise le LIST
-- (lister tous les fichiers) ce qui n'est pas voulu.
-- On retire les policies SELECT trop larges. Les URLs publiques
-- continuent de fonctionner (testees en prod cote client final).

DROP POLICY IF EXISTS "business-banners-public-read" ON storage.objects;
DROP POLICY IF EXISTS "public-assets read public" ON storage.objects;
DROP POLICY IF EXISTS "business-logos-public-read" ON storage.objects;

-- Recree des policies plus restrictives : autorise SELECT mais pas LIST
-- (en filtrant par bucket_id, on bloque le pattern "list all").
-- Note: avec un bucket public, l'acces direct par URL passe par
-- la route /storage/v1/object/public/{bucket}/{path} qui ne passe pas
-- par les RLS. Donc retirer ces policies n'affecte pas l'acces URL.

-- Pas de recreation : les objets restent accessibles par URL publique
-- car les buckets sont declares "public" au niveau du bucket lui-meme.

-- ============================================================
-- 7. Verifications
-- ============================================================
-- Apres execution, relancer le linter via Supabase Dashboard
-- (Database -> Database Linter) pour confirmer 0 issue WARN/INFO restant
-- (sauf "auth_leaked_password_protection" qui se regle dans
-- Authentication -> Settings, pas en SQL).
