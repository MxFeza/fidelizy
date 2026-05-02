# Registre Dette Technique — Izou

Document vivant. Une entrée = une dette identifiée. Triée par sévérité, datée à l'identification.

**Convention** :
- 🔴 **P0** : sécurité exploitable, data leak, paiement → fix < 1 semaine
- 🟠 **P1** : sécurité à risque, dépendance CVE high/critical, regression user-facing → sprint en cours
- 🟡 **P2** : qualité, UX, dépendance moderate, cleanup légère → sprint suivant
- 🟢 **P3** : optimisation, refactor opportuniste → backlog

---

## 🔴 P0 — Sécurité exploitable

### TD-001 — RPC SECURITY DEFINER sans check d'ownership
**Identifié** : 2026-05-02 (audit advisors Supabase)
**Statut** : PARTIAL 2026-05-02
**Détail** : voir [SECURITY-ADVISORS-2026-05-01.md](./SECURITY-ADVISORS-2026-05-01.md) section CRITIQUE
**Option A (anon revoke)** : RESOLVED 2026-05-02 par migration `20260502_revoke_anon_loyalty_rpcs.sql` (commit `44e402a`). À pousser en prod via `supabase db push`.
**Option B (ownership check)** : OPEN — nécessite `/ultrareview` Loyalty pour valider l'approche avant écriture
**Impact résiduel post-Option A** : un user authenticated qui devine un card_id peut toujours appeler la RPC en direct. Mitigation app : `business_id` filter dans `lib/services/loyalty.service.ts`.

---

## 🟠 P1 — Sécurité à risque + dépendances

### TD-002 — jsPDF v < 3.0.4 — CRITICAL CVE (PDF Object Injection + HTML Injection)
**Identifié** : 2026-05-02 (npm audit)
**Statut** : RESOLVED 2026-05-02 (commit `f2787b0` chore(deps): npm audit fix)
**CVE** : [GHSA-7x6v-j9x4-qf24](https://github.com/advisories/GHSA-7x6v-j9x4-qf24), [GHSA-wfv2-pwc8-crg5](https://github.com/advisories/GHSA-wfv2-pwc8-crg5)
**Validation** : typecheck ✓, tests ✓, build ✓

### TD-003 — node-forge HIGH CVE
**Identifié** : 2026-05-02 (npm audit)
**Statut** : RESOLVED 2026-05-02 (commit `f2787b0`)
**Caller** : `lib/wallet/generatePass.ts` (signature Apple Wallet certs)
**Validation** : typecheck ✓, tests ✓, build ✓

### TD-004 — flatted HIGH CVE (DoS unbounded recursion)
**Identifié** : 2026-05-02
**Statut** : RESOLVED 2026-05-02 (commit `f2787b0`)

### TD-005 — picomatch HIGH CVE (ReDoS)
**Identifié** : 2026-05-02
**Statut** : RESOLVED 2026-05-02 (commit `f2787b0`)

### TD-006 — Leaked Password Protection désactivé
**Identifié** : 2026-05-02 (advisors Supabase)
**Statut** : OPEN
**Fix** : Supabase Dashboard > Authentication > Enable HaveIBeenPwned check (5 min)

### TD-007 — Migration `20260427_security_perf_hardening.sql` non appliquée
**Identifié** : 2026-05-02
**Statut** : SUPERSEDED 2026-05-02 par migration `20260502_revoke_anon_loyalty_rpcs.sql` (commit `44e402a`)
**Détail** : la migration locale `20260427` n'a pas été appliquée. Plutôt que de la pousser (cassait `authenticated`), elle est remplacée par Option A safe.
**Action** : la migration `20260427_security_perf_hardening.sql` peut être supprimée du repo (ou laissée comme référence). Décision user.

### TD-008 — Sentry pas branché — zéro observabilité prod
**Identifié** : 2026-05-01
**Statut** : OPEN — user action required
**Détail** : voir [CODE-REVIEW-PROCESS.md § 5](./CODE-REVIEW-PROCESS.md#5-observabilité-à-brancher)
**Impact** : bugs prod actuels (OTP, logos, montgolfière, etc.) auraient été visibles avant que le user les rencontre

---

## 🟡 P2 — Qualité

### TD-009 — Tables RLS-locked sans documentation explicite
**Identifié** : 2026-05-02
**Statut** : OPEN
**Tables** : `push_subscriptions`, `wallet_registrations`
**Détail** : RLS activé sans policies = accès via service-role uniquement, mais ce design intent n'est pas documenté en SQL
**Fix** : `COMMENT ON TABLE ... IS 'RLS-locked: ...'` (10 min)

### TD-010 — Lint en CI non-bloquant (`continue-on-error: true`)
**Identifié** : 2026-05-01
**Statut** : OPEN
**Fichier** : `.github/workflows/ci.yml`
**Détail** : laissé non-bloquant pour cause de legacy debt. À durcir post-Epic 7 quand le codebase sera stabilisé.
**Fix** : retirer `continue-on-error` après cleanup ESLint warnings

### TD-011 — DOMPurify v ≤ 3.3.3 (moderate CVE)
**Identifié** : 2026-05-02
**Statut** : RESOLVED 2026-05-02 (commit `f2787b0`)

### TD-012 — brace-expansion moderate CVE (DoS)
**Identifié** : 2026-05-02
**Statut** : RESOLVED 2026-05-02 (commit `f2787b0`)

### TD-013 — postcss < 8.5.10 moderate CVE (XSS via CSS Stringify)
**Identifié** : 2026-05-02
**Statut** : OPEN — pas de fix dispo upstream
**Détail** : transitive via `next` et `@untitledui/react`. Surveiller release.
**Fix** : attendre release Next ou patch upstream

### TD-014 — `scan_cooldown` partiel
**Identifié** : 2026-04-30 (memory `project_izou_loyalty_program_gaps`)
**Statut** : PARTIEL — branché dans scanCard ✅ vu code, à vérifier en E2E
**Détail** : la valeur est lue depuis `business.scan_cooldown_hours` et le check est implémenté. Reste à valider que la migration Supabase a bien le champ.

### TD-015 — Husky pre-commit en mode dormant
**Identifié** : 2026-05-01
**Statut** : OPEN — décision user
**Détail** : squelette installé, activation = `npm i -D husky lint-staged && npm pkg set scripts.prepare="husky" && npm run prepare`
**Fix** : 2 min user

---

## 🟢 P3 — Optimisation

### TD-016 — Unused indexes Supabase (3)
**Identifié** : 2026-05-02
**Statut** : DEFER
**Indexes** : `idx_push_subscriptions_business_id`, `idx_reward_claims_loyalty_card_id`, `idx_reward_claims_reward_tier_id`
**Décision** : ne pas drop avant 3 mois d'usage. Recheck 2026-08.

### TD-017 — Couverture de tests faible
**Identifié** : 2026-05-01
**Statut** : OPEN — continu
**Détail** : 9 fichiers de tests (6 unit `lib/services/__tests__/*` + 3 E2E). Pas de tests sur les API routes.
**Fix** : ajout au fil des stories Epic 4-7 — pas de catch-up batch.

### TD-018 — CSP en mode Report-Only
**Identifié** : 2026-05-01
**Statut** : OBSERVATION
**Détail** : CSP ajouté en Report-Only le 2026-05-01. Switcher en mode enforce après ~2 semaines sans violation observée.
**Fix** : remplacer `Content-Security-Policy-Report-Only` par `Content-Security-Policy` dans `next.config.ts`

---

## Workflow

- Chaque entrée = ID + date d'identification + statut (OPEN, IN_PROGRESS, RESOLVED, DEFER)
- Quand fix mergé : marquer `RESOLVED` + ajouter date + référence commit/PR
- Revue mensuelle (1er du mois) : check des items OPEN, possible promotion P2→P1

## Liens

- [SECURITY-ADVISORS-2026-05-01.md](./SECURITY-ADVISORS-2026-05-01.md) — détail findings Supabase
- [CODE-REVIEW-PROCESS.md](./CODE-REVIEW-PROCESS.md) — workflow review/audit
- [../SECURITY_AUDIT.md](../SECURITY_AUDIT.md) — audit historique mars 2026
