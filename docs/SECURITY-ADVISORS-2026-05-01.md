# Audit Supabase Advisors — 2026-05-01

Snapshot des findings remontés par `mcp__claude_ai_Supabase__get_advisors` (project `ggzgffwykthufieeikzb` / fidelizy).

Source de référence pour la migration de durcissement déjà appliquée : `supabase/migrations/20260427_security_perf_hardening.sql` (avril 2026). Les findings ci-dessous **persistent** malgré cette migration — à investiguer dans le sprint Couche 2.

---

## 🔴 CRITIQUE — SECURITY DEFINER exposées sans check d'ownership (3 fonctions)

Ces 3 RPC sont les fonctions cœur du loyalty, **callable directement via REST** (`/rest/v1/rpc/*`) en bypassant l'API Next.js et donc en bypassant tous les checks d'ownership applicatifs.

| Fonction | Signature | Endpoint exposé | Roles concernés |
|---|---|---|---|
| `public.deduct_points_safe` | `(p_card_id uuid, p_amount integer)` | `/rest/v1/rpc/deduct_points_safe` | `anon` + `authenticated` |
| `public.increment_stamps` | `(p_card_id uuid, p_amount int, p_stamps_required int)` | `/rest/v1/rpc/increment_stamps` | `anon` + `authenticated` |
| `public.reset_stamps_atomic` | `(p_card_id uuid)` | `/rest/v1/rpc/reset_stamps_atomic` | `anon` + `authenticated` |

### Audit caller (effectué 2026-05-02)

| Caller | Fichier | Client utilisé | Notes |
|---|---|---|---|
| `scanCard()` | `lib/services/loyalty.service.ts` | `createClient` SSR (cookie auth, **authenticated**) | Check `business_id` côté JS avant RPC |
| `addToCard()` | idem | idem | Check `business_id` côté JS avant RPC |
| `deductFromCard()` | idem | idem | idem |
| `claimReward()` | idem | idem | idem |
| `resetCard()` | idem | idem | idem |
| Routes API | `app/api/scan`, `app/api/card/{add,deduct,reset,claim-reward}` | Toutes en `createClient()` SSR + `getUser()` | Auth merchant + rate limit |

**Conclusion** : l'app utilise le client `authenticated` pour appeler ces RPC, **pas service-role**. Donc :
- ❌ `REVOKE EXECUTE FROM authenticated` casserait toute l'app (tous les scans)
- ✅ `REVOKE EXECUTE FROM anon` est safe et bloque les calls non-auth
- ⚠️ Mais `authenticated` reste exposé : un utilisateur final connecté qui connaît un `card_id` peut appeler la RPC en direct depuis curl/Postman et drainer/inflater n'importe quelle carte

### Migration `20260427_security_perf_hardening.sql`

Cette migration locale **n'est PAS appliquée en prod** (vérifié via `mcp__claude_ai_Supabase__list_migrations` le 2026-05-02 : dernière migration appliquée = `20260430121409_fix_business_logos_public_and_url_cleanup`).

Elle contient `REVOKE EXECUTE ... FROM anon, authenticated;` — la pousser **telle quelle casserait la prod**.

### Remédiation correcte (à valider via /ultrareview Loyalty)

**Option A — Quick win (sécurise contre anon non-auth, ne ferme pas la fenêtre authenticated)**
```sql
REVOKE EXECUTE ON FUNCTION public.deduct_points_safe(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_stamps(uuid, int, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reset_stamps_atomic(uuid) FROM anon;
-- Keep authenticated grant
```
Effort : 15 min. Réduit la surface de 50% (anon = curl public). Ne protège pas contre un client final connecté.

**Option B — Fix complet (recommandé)** : Ajouter check d'ownership dans la fonction SQL elle-même
```sql
CREATE OR REPLACE FUNCTION increment_stamps(...) ... AS $$
DECLARE
  v_caller uuid;
BEGIN
  v_caller := auth.uid();
  IF NOT EXISTS (
    SELECT 1 FROM loyalty_cards
    WHERE id = p_card_id AND business_id = v_caller
  ) THEN
    RAISE EXCEPTION 'Unauthorized: card does not belong to caller';
  END IF;
  -- ... existing logic
END;
$$;
```
Effort : 1h + tests. Couvre tous les cas (anon ET authenticated non-owner).

**Option C — Refactor backend (architecturalement le plus propre)** : passer les API routes en service-role pour ces opérations puis Option A.
Effort : 2-3h. Le bon design long terme mais touche 5 routes API en plein milieu d'Epic 4.

### Recommandation

Pour cette semaine : Option A (15 min, déploiement immédiat, ferme la porte anon).
Pour le sprint Couche 2 / Epic 4 close : Option B après validation /ultrareview.

Doc Supabase : https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

---

## 🟠 WARN — Leaked Password Protection désactivé

Supabase Auth peut bloquer les mots de passe compromis (check HaveIBeenPwned). Désactivé actuellement.

**Remédiation** : Supabase Dashboard > Authentication > Policies > Enable "Leaked Password Protection".

Doc : https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

## 🟡 INFO — RLS activé sans policies (2 tables)

| Table | Statut |
|---|---|
| `public.push_subscriptions` | RLS ON, 0 policies |
| `public.wallet_registrations` | RLS ON, 0 policies |

**Analyse** : RLS sans policies = inaccessible pour anon/authenticated. Si l'app accède uniquement via service-role (bypass RLS), c'est intentionnel mais il faut le documenter explicitement par une migration de commentaire.

**Remédiation suggérée** :

```sql
COMMENT ON TABLE public.push_subscriptions IS
  'RLS-locked: writes/reads via service-role only (server-side only, see lib/push/sendPush.ts)';
COMMENT ON TABLE public.wallet_registrations IS
  'RLS-locked: writes/reads via service-role only (Apple Wallet protocol, see lib/wallet/)';
```

Vérifier qu'aucun composant `'use client'` ou route auth=anon ne tente de lire ces tables.

Doc : https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

---

## 🟡 INFO — Unused Indexes (perf, 3)

Indexes jamais utilisés depuis création :
- `idx_push_subscriptions_business_id` sur `push_subscriptions`
- `idx_reward_claims_loyalty_card_id` sur `reward_claims`
- `idx_reward_claims_reward_tier_id` sur `reward_claims`

**Décision** : ne pas drop tout de suite. Volume de données encore faible (early launch), les query patterns vont évoluer. Re-checker dans 3 mois ou après 1000+ users actifs.

Doc : https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

---

## Plan d'action

| # | Action | Priorité | Effort | Quand |
|---|---|---|---|---|
| 1 | Audit caller des 3 RPC ✅ effectué 2026-05-02 | 🔴 P0 | done | done |
| 2 | Migration **Option A** (REVOKE FROM anon uniquement, NOT authenticated) | 🔴 P0 | 15 min | **Cette semaine** |
| 3 | `/ultrareview` Loyalty pour valider Option B (ownership check interne) | 🔴 P0 | 5-10 min remote | **Cette semaine** (avant 2026-05-05 = expiration runs gratuits) |
| 4 | Migration **Option B** post-/ultrareview | 🟠 P1 | 1h + tests | Sprint Couche 2 |
| 5 | Activer Leaked Password Protection (Supabase Dashboard) | 🟠 P1 | 5 min | **Cette semaine** |
| 6 | Commentaires RLS-locked sur push_subscriptions + wallet_registrations | 🟡 P2 | 10 min | Sprint Couche 2 |
| 7 | Re-check unused indexes après 3 mois usage | 🟡 P3 | 15 min | 2026-08 |

---

## Comment relancer cet audit

```bash
# Via MCP dans une session Claude Code
# Use mcp__claude_ai_Supabase__get_advisors with project_id=ggzgffwykthufieeikzb
```

Programmé hebdo via `/schedule` (à mettre en place — voir `docs/CODE-REVIEW-PROCESS.md`).
