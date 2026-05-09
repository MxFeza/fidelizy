-- =============================================================================
-- Migration : REVOKE EXECUTE on loyalty RPCs from `authenticated` (TD-001 Option C)
-- Date      : 2026-05-08
-- Reference : docs/TECH-DEBT.md TD-001 + audit Gemini auth-rls G-T1.1
-- =============================================================================
--
-- CONTEXT
--
-- TD-001 Option A (REVOKE FROM anon) appliquée le 2026-05-02. Risque résiduel :
-- un user authenticated (= n'importe quel customer connecté via OTP) peut
-- appeler ces RPCs en direct via REST API Supabase et créditer/déduire des
-- stamps/points sur n'importe quelle carte (connaissance du card_id suffit).
--
-- DÉCISION 2026-05-08 — Option C plutôt que Option B :
--
-- Option B (ownership check via auth.uid() interne) était la reco initiale,
-- mais nécessite une logique conditionnelle complexe car :
--   - service_role n'a pas de auth.uid() défini
--   - merchants et customers ont des auth.uid() différents
--   - matching customer ↔ auth.users se fait via email (pas direct)
--
-- Option C (CHOIX RETENU) : passer 100% des call sites côté API vers
-- service_role. Les 5 endpoints qui appellent les RPCs ont été migrés dans
-- le commit qui accompagne cette migration :
--   - app/api/scan/route.ts
--   - app/api/card/add/route.ts
--   - app/api/card/deduct/route.ts
--   - app/api/card/claim-reward/route.ts
--   - app/api/card/reset/route.ts
--
-- Pattern uniforme : auth merchant via supabase.auth.getUser() (cookie SSR),
-- puis service = createServiceClient() pour les opérations DB / RPC.
--
-- Conséquence : authenticated n'a plus besoin d'EXECUTE sur ces RPCs.
-- Toute tentative directe REST par un user authentifié → 401/403 Postgres.
--
-- =============================================================================

-- Revoke EXECUTE for `authenticated` (cookie SSR clients = customers + merchants logged-in)
REVOKE EXECUTE ON FUNCTION public.increment_stamps(uuid, int, int) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_stamps(uuid, int)      FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_points(uuid, int)      FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_points_safe(uuid, int)    FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_points(uuid, int)         FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_stamps_atomic(uuid)        FROM authenticated;

-- Note : `service_role` keeps EXECUTE — required for the application flow
-- after the API endpoint migration to createServiceClient(). `anon` was
-- already revoked in 20260502_revoke_anon_loyalty_rpcs.sql.
--
-- Verification post-deploy (run manually) :
--   SELECT routine_name, grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_schema = 'public'
--     AND routine_name IN ('increment_stamps','increment_points','deduct_points',
--                          'deduct_points_safe','reset_stamps_atomic')
--   ORDER BY routine_name, grantee;
--
-- Expected : only `service_role` should appear with EXECUTE.
