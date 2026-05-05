-- =============================================================================
-- Migration : Revoke EXECUTE on loyalty RPCs from `anon` (Option A — safe quick win)
-- Date      : 2026-05-02
-- Reference : docs/SECURITY-ADVISORS-2026-05-01.md (TD-001)
-- =============================================================================
--
-- CONTEXT
--
-- Supabase advisors flag 3 SECURITY DEFINER functions as exposed via REST RPC
-- to the `anon` role (callable WITHOUT authentication) :
--   - public.deduct_points_safe(uuid, integer)
--   - public.increment_stamps(uuid, int, int)
--   - public.reset_stamps_atomic(uuid)
--
-- Risk : a non-authenticated caller knowing a card_id (UUID, present in public
-- QR codes) could drain or inflate any loyalty card via direct REST calls.
--
-- The previous local-only migration `20260427_security_perf_hardening.sql`
-- attempted REVOKE EXECUTE FROM anon, authenticated — but the app calls these
-- RPCs in `authenticated` mode (cookie SSR client), so revoking from
-- `authenticated` would break /api/scan, /api/card/* in production.
--
-- This migration applies ONLY the safe portion : REVOKE FROM anon.
-- The full fix (ownership check via auth.uid() inside the function) is
-- tracked as TD-001 Option B and requires /ultrareview validation before
-- being applied (see docs/TECH-DEBT.md).
--
-- =============================================================================

-- Revoke EXECUTE for `anon` (non-authenticated REST callers)
REVOKE EXECUTE ON FUNCTION public.increment_stamps(uuid, int, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_stamps(uuid, int)      FROM anon;
REVOKE EXECUTE ON FUNCTION public.deduct_points_safe(uuid, int)    FROM anon;
REVOKE EXECUTE ON FUNCTION public.reset_stamps_atomic(uuid)        FROM anon;

-- Also revoke `anon` access to other atomic loyalty RPCs to be consistent
REVOKE EXECUTE ON FUNCTION public.increment_points(uuid, int)      FROM anon;
REVOKE EXECUTE ON FUNCTION public.deduct_points(uuid, int)         FROM anon;

-- Note : `authenticated` and `service_role` keep EXECUTE — required for the
-- application flow. The remaining authenticated-side risk (any logged-in user
-- can call the RPC on any card_id) is mitigated by application-level checks
-- in lib/services/loyalty.service.ts (business_id filter) and is the subject
-- of TD-001 Option B (in-function auth.uid() ownership check).
