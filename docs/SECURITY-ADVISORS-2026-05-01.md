# Audit Supabase Advisors — 2026-05-01

Snapshot des findings remontés par `mcp__claude_ai_Supabase__get_advisors` (project `ggzgffwykthufieeikzb` / fidelizy).

Source de référence pour la migration de durcissement déjà appliquée : `supabase/migrations/20260427_security_perf_hardening.sql` (avril 2026). Les findings ci-dessous **persistent** malgré cette migration — à investiguer dans le sprint Couche 2.

---

## 🔴 CRITIQUE — SECURITY DEFINER exposées à `anon` (3 fonctions)

Ces 3 RPC sont les fonctions cœur du loyalty, et elles sont **callable sans auth** via `/rest/v1/rpc/*`. Risque : un attaquant connaissant un `card_id` peut ajouter ou retirer des points/stamps sans authentification.

| Fonction | Signature | Endpoint exposé | Roles concernés |
|---|---|---|---|
| `public.deduct_points_safe` | `(p_card_id uuid, p_amount integer)` | `/rest/v1/rpc/deduct_points_safe` | `anon` + `authenticated` |
| `public.increment_stamps` | `(p_card_id uuid, p_amount integer)` | `/rest/v1/rpc/increment_stamps` | `anon` + `authenticated` |
| `public.reset_stamps_atomic` | `(p_card_id uuid)` | `/rest/v1/rpc/reset_stamps_atomic` | `anon` + `authenticated` |

**Remédiation** (à appliquer en migration dédiée, sprint Couche 2) :

```sql
-- Option A : revoke EXECUTE pour anon + authenticated, garder service_role
REVOKE EXECUTE ON FUNCTION public.deduct_points_safe(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_stamps(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_stamps_atomic(uuid) FROM anon, authenticated;

-- Option B : SECURITY INVOKER + RLS plutot que SECURITY DEFINER
-- (a faire si une part du flux passe via authenticated et qu'on veut RLS)
```

**Vérifier d'abord** : est-ce que `lib/supabase/service.ts` (service-role) est le seul appelant côté app ? Si oui, Option A est safe. Si l'app appelle en mode authenticated, il faut Option B.

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
| 1 | Audit caller des 3 RPC SECURITY DEFINER (service-role only ?) | 🔴 P0 | 30 min | **Cette semaine** |
| 2 | Migration de revoke EXECUTE sur les 3 RPC | 🔴 P0 | 30 min | **Cette semaine** |
| 3 | Activer Leaked Password Protection | 🟠 P1 | 5 min | **Cette semaine** |
| 4 | Commentaires RLS-locked sur push_subscriptions + wallet_registrations | 🟡 P2 | 10 min | Sprint Couche 2 |
| 5 | Re-check unused indexes après 3 mois usage | 🟡 P3 | 15 min | 2026-08 |

---

## Comment relancer cet audit

```bash
# Via MCP dans une session Claude Code
# Use mcp__claude_ai_Supabase__get_advisors with project_id=ggzgffwykthufieeikzb
```

Programmé hebdo via `/schedule` (à mettre en place — voir `docs/CODE-REVIEW-PROCESS.md`).
