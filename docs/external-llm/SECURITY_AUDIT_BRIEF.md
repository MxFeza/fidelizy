# Brief — Audit sécurité approfondi

> **Objectif :** Audit complet sécurité du repo Izou, livrable : rapport priorisé Tier 1 / 2 / 3 avec recos précises et exécutables.
> **Format de retour attendu :** Rapport markdown structuré, citations de paths + line numbers, pas de réécriture massive demandée (le user décidera ensuite).

## Contexte

Le projet est en **pré-pilote** (~95% Epic 4 livré). L'audit architecture du 2026-05-05 a confirmé que la base est saine (RLS sur claim_requests, AppError factory consistant, atomic RPCs, secrets pas hardcodés). Cet audit doit aller **plus en profondeur** :

- Auditer chaque table Supabase pour la rigueur des RLS policies
- Vérifier headers HTTP de sécurité au niveau Next.js
- Identifier des cas de validation Zod manquants sur des routes sensibles
- Trouver les routes write sans rate-limit
- Détecter des leaks subtils (logs verbeux, error messages exposant des UUIDs internes, etc.)
- Anti-fraude scan (cooldown 2-4h selon PRD FR anti-fraude)

---

## Périmètre détaillé

### 1. RLS Supabase — audit policy par table

Pour chaque table, vérifier que les policies bloquent bien les accès cross-tenant :

| Table | Test attendu |
|-------|--------------|
| `businesses` | Un merchant peut SELECT son propre row, pas ceux d'autres businesses. UPDATE/DELETE owner only. |
| `customers` | Pas de Supabase Auth user → accès uniquement via service_role. RLS doit bloquer client direct. |
| `loyalty_cards` | Service_role pour mutations (scan), SELECT possible via qr_code_id depuis route public mais pas list-all. |
| `transactions` | Idem cards. SELECT par card.owner only. |
| `reward_claims` | RLS via card → business + customer. Pas de SELECT cross-tenant. |
| `claim_requests` | RLS verrouillée déjà confirmée — `accès uniquement via API (service_role)`. |
| `referrals` | RLS via business_id. |
| `wallet_registrations` | Apple Wallet — accès par device_library_id (auth Apple). |
| `push_subscriptions` | RLS via card → owner. |
| `pwa_visits` | Métriques — service_role only ? Ou public ? |
| `customer_feedback` (si existe) | Idem. |

**Format réponse pour chaque table :**
```
### Table: businesses
**Policies actives :**
- SELECT: [détail]
- INSERT: [détail]
- UPDATE: [détail]
- DELETE: [détail]

**Verdict :** OK / À renforcer / FAILLE

**Recommandation :** [si applicable]
```

**Méthode :** lister les policies via `supabase/migrations/*.sql` (où elles sont créées) + cross-checker avec usage dans `app/api/**/route.ts` + `lib/services/*.ts`.

### 2. Secrets management

- **Grep tout le repo** pour patterns suspects :
  - `supabase.co`, `eyJ...` (JWT prefix), `sb_secret_`, `sk_`, `pk_`, `whsec_`, `xoxb-`
  - URL contenant un token query param
  - Fichiers `.env*` accidentellement committed
- **Vérifier `.env.example`** :
  - Liste exhaustive des variables (cf. `docs/PROJET_STATE.md`)
  - Pas de valeur réelle (que des placeholders)
- **Vérifier `.gitignore`** :
  - `.env.local` couvert
  - `.env*` couvert
  - `.tmp/` couvert (LLM bundle)

### 3. Headers HTTP sécurité

Vérifier `next.config.ts` ou `middleware.ts` pour :
- **CSP** (Content Security Policy) : présent ? Restrictif ? Permet bien les CDN nécessaires (Supabase Storage, Sentry, Vercel Analytics) ?
- **HSTS** (Strict-Transport-Security) : `max-age=31536000; includeSubDomains; preload`
- **X-Frame-Options** : `DENY` ou `SAMEORIGIN`
- **X-Content-Type-Options** : `nosniff`
- **Referrer-Policy** : `strict-origin-when-cross-origin`
- **Permissions-Policy** : restreindre camera/microphone/geolocation aux pages qui en ont besoin (`/scan`, `/card/[id]/scan` si existe)

Pour Next.js 16, ces headers se configurent via :
```typescript
// next.config.ts
async headers() {
  return [{ source: '/(.*)', headers: [{ key: '...', value: '...' }] }]
}
```

### 4. Validation Zod sur les routes API

Pour chaque route handler `app/api/**/route.ts`, vérifier :
- Les inputs (body, query, params) sont parsed via un schema Zod `lib/services/*.schemas.ts` ?
- Si non, est-ce que les inputs sont quand même validés (typeof, length checks, regex) ?
- Routes critiques à auditer en priorité :
  - `/api/scan` (scan QR — critique, peut éarn des points)
  - `/api/card/[cardId]/claim-request` (créer code éphémère)
  - `/api/scan/validate-claim` (merchant valide claim)
  - `/api/auth/send-otp`, `/api/auth/verify-otp`
  - `/api/me/profile` (PATCH name)
  - `/api/me/delete`, `/api/me/export`
  - `/api/business/upload-asset` (upload logo/banner/card image)
  - `/api/recover/*` (récupération carte)

Output attendu :
```
| Route | Body validé Zod ? | Notes |
|-------|------------------|-------|
| POST /api/scan | ✅ scanCardSchema | OK |
| POST /api/me/profile | ❌ ad-hoc | Recommandation : créer me.profile.schemas.ts |
```

### 5. Rate-limiting exhaustif

`lib/ratelimit.ts` exporte 9 limiters (scanLimiter, joinLimiter, recoverLimiter, otpLimiter, cardWriteLimiter, pushLimiter, broadcastLimiter, profileUpdateLimiter, merchantOtpLimiter).

**Audit attendu :**
- Pour chaque route POST/PATCH/DELETE, vérifier qu'un limiter est bien appelé via `await xxxLimiter.limit(getIP(request))`.
- Identifier les routes write **sans** rate-limit.
- Évaluer la pertinence des thresholds (10/60s pour scan, 3/600s pour OTP, etc.) face aux patterns d'usage attendus en pilote (5-10 commerçants × 50-100 clients/jour).

**Risque particulier :** `gracefulLimit` fail-open en dev mais fail-closed en prod. Vérifier que `NODE_ENV !== 'production'` est bien évalué côté Vercel (et pas en mode preview qui pourrait être considéré dev).

### 6. Auth boundaries

Pour chaque page/route, qui doit avoir accès :

| Path | Auth attendu | Pattern actuel |
|------|--------------|----------------|
| `/dashboard/(protected)/**` | Merchant logged in | `redirect('/dashboard/login')` SSR |
| `/me/**` | Customer auth (cookie OTP) | À vérifier |
| `/api/me/**` | Customer auth | `auth.getUser()` |
| `/api/business/**` | Merchant auth | `auth.getUser()` + check business |
| `/api/card/**` | Public via qr_code_id | Pas d'auth user |
| `/api/scan/**` | Merchant | `auth.getUser()` + check business |
| `/api/wallet/[qrCodeId]` | Public (signed URL) | HMAC token check |

**Risques à chercher :**
- Page `(protected)` qui ne redirige pas si pas de user
- Route `/api/me/*` qui ne vérifie pas que `user.id === customer.id`
- IDOR (Insecure Direct Object Reference) : route accept un ID en query/body sans vérifier ownership

### 7. SQL injection / RPC safety

- Usage de `.eq('field', value)`, `.update({...})`, `.insert({...})` Supabase JS = **paramétré, safe**.
- Usage de `.rpc('function_name', { args })` : vérifier que les args ne contiennent pas de raw SQL concaténé.
- Migrations SQL : `EXECUTE 'SELECT...'` ou `format('...')` détecter les usages dynamiques non parameterised.

### 8. Anti-fraude scan (cooldown)

PRD mentionne un cooldown 2-4h entre scans (FR anti-fraude). Vérifier dans `lib/services/loyalty.service.ts:scanCard` :
- Existe-t-il un check `last_visit_at + cooldown > now` ?
- Cooldown est-il configurable par business (`businesses.scan_cooldown_hours`) ?
- Behavior attendu : si cooldown actif, ne pas earn de stamp/point + retourner un message clair (pas une 500).

### 9. Sentry & logging

- Vérifier `instrumentation.ts` + `sentry.{client,edge,server}.config.ts` : DSN pas hardcodé, environment correct.
- Logs `console.log` / `console.error` dans le code prod : combien ? Lesquels exposent des données sensibles (UUIDs, emails, phones) ?
- Erreurs Sentry envoient-elles des données client (cookies, body) ? Vérifier `beforeSend` filter pour scrubber.

### 10. Apple Wallet pkpass

- `WALLET_AUTH_SECRET` (HMAC) : taille suffisante (256 bits min) ?
- Génération de pkpass : `node-forge` correctement configuré ?
- pkpass leak prevention : URL signed + token expiry ?
- Vérifier `lib/wallet/*.ts` pour ces points.

---

## Format de retour attendu

```markdown
# Audit sécurité Izou — [Date]

## TL;DR
[3-4 lignes : verdict global, top 3 préoccupations]

## Tier 1 — Critique (fix immédiat avant pilote)

| # | Item | Path | CVSS estimé | Recommandation |
|---|------|------|-------------|----------------|
| T1.1 | [titre] | [path:line] | High/Critical | [action précise] |

## Tier 2 — Important (planifier sous 2 semaines)

[idem]

## Tier 3 — Hardening (backlog)

[liste courte avec rationale]

## Détail par section

### 1. RLS Supabase
[table par table avec verdict]

### 2. Secrets management
[findings + recos]

[... etc pour les 10 sections]

## Checklist actionnable

- [ ] [Item Tier 1.1 actionable précis]
- [ ] [Item Tier 1.2 ...]
- ...

## Questions ouvertes pour Francis (humain)

- [Si certains points exigent une décision business / produit]
```

---

## Notes méthodologiques

- **Lecture only** : ne PAS proposer de PR. Juste audit + recos. Le user décidera quoi traiter.
- **Citer les paths précis** avec line numbers (le bundle repomix les inclut).
- **Rester pragmatique** : ne pas suggérer de surengineering. Ce projet est pour un pilote 5-10 commerçants, pas une infra Fortune 500.
- **Prioriser** : un finding qui prend 2h mais ferme une faille critique > un refactor qui prend 2 semaines pour gain marginal.
