# Process Code Review & Qualité — Izou

Document vivant. Référence pour :
- Workflow d'ouverture de PR
- Quand utiliser `/ultrareview` vs `/review`
- Activation des garde-fous (Husky, Sentry)
- Audits récurrents (Supabase advisors, Dependabot)

---

## 1. Workflow PR par défaut

```
feature branch
    ├─ PR vers `develop` (squash merge)
    │   └─ CI obligatoire : typecheck + tests (bloquant)
    │   └─ /ultrareview optionnel sur stories non-critiques
    │
    └─ Auto-PR `develop` → `main` (via .github/workflows/auto-pr-to-main.yml)
        └─ CI typecheck + tests (bloquant)
        └─ /ultrareview OBLIGATOIRE pour stories critiques (voir tableau)
        └─ Preview Vercel validation user
        └─ Merge squash manuel (auto-merge OFF)
```

---

## 2. Quand utiliser `/ultrareview` (Anthropic Cloud)

`/ultrareview` lance un fleet de reviewer agents en remote sandbox. Findings vérifiés indépendamment, ~5-10 min, billed extra usage (~$5-20 après les 3 runs gratuits Pro/Max valables jusqu'au 2026-05-05).

### Obligatoire avant merge `main`
| Type de change | Justification |
|---|---|
| Auth (login, OTP, signup, reset) | Compromission = takeover |
| Paiement / Stripe | Risque financier direct |
| Migrations Supabase / RLS / SECURITY DEFINER | Risque data leak |
| API publiques exposées sans auth | Surface d'attaque |
| Webhooks (Apple Pass, Stripe, Notion) | Validation signature |
| Refactor cross-domaine (>10 fichiers, >500 lignes) | Risque régression silencieuse |

### Optionnel
| Type de change | Pourquoi pas systématique |
|---|---|
| UI cosmétique, copy, traduction | Faible surface d'impact |
| Doc, README, comment-only | Pas de runtime |
| Refactor isolé dans un seul fichier <100 lignes | Diff évident à l'œil |
| Bump dependabot patch/minor (CI verte) | Déjà testé en CI |

### Comment lancer
```bash
# Sur branche locale (bundle l'état non-committé inclus)
/ultrareview

# Sur PR GitHub (clone direct)
/ultrareview <PR-number>

# Non-interactif (CI / script)
claude ultrareview <PR-number>
claude ultrareview --json <PR-number>
```

### Que faire des findings
- **CRITICAL / HIGH** → fix avant merge, ou hotfix immédiat si déjà mergé
- **MEDIUM** → ticket BMAD dans le sprint suivant
- **LOW** → entrée dans `docs/TECH-DEBT.md`, pas bloquant

---

## 3. Quand utiliser `/review` (local)

Single-pass review en local, rapide, gratuit (compte normal usage).

Usage : feedback rapide pendant qu'on code, avant même d'ouvrir la PR. **Ne remplace pas** `/ultrareview` pour les stories critiques.

---

## 4. Garde-fous installés

### CI (`.github/workflows/ci.yml`)
- Typecheck (`tsc --noEmit`) : **bloquant**
- Tests Vitest : **bloquant**
- Lint : non-bloquant (legacy debt, à durcir post-Epic 7)

### Security headers (`next.config.ts`)
- HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy
- **CSP en mode Report-Only** depuis 2026-05-01 — surveiller la console pour les violations avant de switcher en enforce
- Pour activer en mode enforce : remplacer la clé `Content-Security-Policy-Report-Only` par `Content-Security-Policy` après ~2 semaines sans violation observée

### Dependabot (`.github/dependabot.yml`)
- Schedule : lundi 9h Europe/Paris
- Groupé : minor/patch en un seul PR
- Majors ignorés sur Next/React/Tailwind/Supabase (planning manuel)
- Target branch : `develop`

### CODEOWNERS (`.github/CODEOWNERS`)
- Owner par défaut : `@ebellafrancis`
- Reminders auto sur zones critiques (auth, wallet, migrations, middleware, .github)

### Husky + lint-staged (DORMANT — à activer)
Squelette en place dans `.husky/pre-commit` et `lint-staged.config.js`, mais pas installé dans `package.json` pour ne pas perturber le workflow actuel.

**Pour activer** :
```bash
npm install -D husky lint-staged
npm pkg set scripts.prepare="husky"
npm run prepare
```

À ce moment, le hook lance `lint-staged` qui exécute `eslint --fix` sur les fichiers TS/TSX staged. Le typecheck full reste en CI (trop lent en pre-commit).

---

## 5. Observabilité (à brancher)

### Sentry (PRIORITÉ #1 — pas encore branché au 2026-05-01)

**Procédure user** :

```bash
# 1. Créer compte gratuit sur sentry.io (plan free = 5K errors/mois)
# 2. Créer project Next.js, récupérer le DSN
# 3. Lancer le wizard :
npx @sentry/wizard@latest -i nextjs

# 4. Ajouter dans Vercel (Environment Variables) :
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=...
SENTRY_PROJECT=fidelizy

# 5. Push une erreur de test pour valider :
throw new Error("sentry-smoke-test") // dans un endpoint test
```

**Pourquoi c'est priorité** : les bugs prod actuels (OTP login, logos commerçants, image montgolfière, page abonnement, save bar mobile) auraient été visibles dans Sentry avant que tu les rencontres en personne.

**Une fois branché** : MCP `mcp__claude_ai_Sentry__*` disponible pour analyser les issues directement (`analyze_issue_with_seer`, `search_issues`).

---

## 6. Audits récurrents

### Supabase Advisors (hebdo)
Run manuel actuel via MCP :
```
mcp__claude_ai_Supabase__get_advisors with project_id=ggzgffwykthufieeikzb, type=security
mcp__claude_ai_Supabase__get_advisors with project_id=ggzgffwykthufieeikzb, type=performance
```

Snapshot daté à archiver dans `docs/SECURITY-ADVISORS-YYYY-MM-DD.md`. Voir [SECURITY-ADVISORS-2026-05-01.md](./SECURITY-ADVISORS-2026-05-01.md) pour le baseline.

À automatiser via `/schedule` (recurring agent hebdo qui post le diff dans Notion).

### Dependabot (hebdo, auto)
PRs créées chaque lundi sur `develop`. Review manuel + merge si CI verte.

### Revue mensuelle (1er du mois, ~1h)
- [ ] Sentry : top 10 erreurs, error rate, regressions
- [ ] Supabase advisors : nouvelles régressions ?
- [ ] Dependabot : PRs en attente
- [ ] `npm audit --audit-level=moderate` : nouvelles CVE ?
- [ ] `TECH-DEBT.md` : diff closed vs new
- [ ] Décision : ouvrir story BMAD si dette > seuil critique

### Pre-Epic close
À la fin de chaque Epic (avant `gsd:complete-milestone`) :
- `/ultrareview` final sur le diff cumulé Epic
- Update `SECURITY-ADVISORS-*.md`
- Décision go/no-go Epic suivant

---

## 7. Fichiers de référence

| Fichier | Rôle |
|---|---|
| `.env.example` | Template variables d'env (jamais .env.local committé) |
| `.github/dependabot.yml` | Config bumps deps |
| `.github/CODEOWNERS` | Reviewers auto |
| `.github/workflows/ci.yml` | Pipeline typecheck/tests |
| `.github/workflows/auto-pr-to-main.yml` | Auto-PR develop→main |
| `next.config.ts` | Security headers + CSP |
| `middleware.ts` | Auth check + route protection |
| `lint-staged.config.js` | Config pre-commit (dormant) |
| `.husky/pre-commit` | Hook pre-commit (dormant) |
| `docs/SECURITY-ADVISORS-2026-05-01.md` | Snapshot baseline findings Supabase |
| `SECURITY_AUDIT.md` (root) | Audit historique mars 2026 |

---

## 8. Échelle de sévérité (référence interne)

| Sévérité | Critères | SLA fix |
|---|---|---|
| 🔴 CRITICAL | Compromission auth, data leak, RCE, paiement | < 24h, hotfix direct main |
| 🟠 HIGH | XSS stocké, CSRF, RLS bypass, info disclosure | Story P0, sprint en cours |
| 🟡 MEDIUM | Validation input partielle, dependency CVE moderate | Sprint suivant |
| 🟢 LOW | Code smell, unused index, cosmetic | TECH-DEBT.md |

---

## 9. Historique des audits

| Date | Type | Doc | Findings critiques |
|---|---|---|---|
| 2026-03-04 | Manuel (mars) | `SECURITY_AUDIT.md` | Headers HTTP, validation inputs, rate limiting — corrigés |
| 2026-04-27 | Migration durcissement | `supabase/migrations/20260427_security_perf_hardening.sql` | 34 issues (12 sec + 22 perf) |
| 2026-05-01 | Advisors Supabase | `docs/SECURITY-ADVISORS-2026-05-01.md` | 3 SECURITY DEFINER exposées anon (P0) |
