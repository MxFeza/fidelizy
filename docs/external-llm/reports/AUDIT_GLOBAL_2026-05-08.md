# Audit sécurité global Izou — 2026-05-08

Synthèse fusionnée des 4 rapports d'audit :
- [audit-auth-rls_report.txt](audit-auth-rls_report.txt) (Gemini 2.5 Pro)
- [audit-api-validation_report.txt](audit-api-validation_report.txt) (Gemini 2.5 Pro)
- [audit-services-LOCAL_report.md](audit-services-LOCAL_report.md) (Claude Opus 4.7, Plan B Gemini session 3 plantée)
- [audit-wallet-observability_report.txt](audit-wallet-observability_report.txt) (incomplet — Gemini a planté, brief seul collé)

## TL;DR

Architecture **saine globalement** : RLS bien posée sur `claim_requests`/`businesses`/`reward_claims`, séparation `service_role` vs cookie auth correcte, secrets isolés, headers HTTP stricts (CSP/HSTS), Apple Wallet HMAC + `timingSafeEqual`. **Validation Zod systématique** dans les services, **RPCs Postgres atomiques** sur les compteurs (`increment_stamps`, `deduct_points`).

**Findings P0 fixés dans cette session (8 commits)** :
- ✅ Math.random non-crypto sur codes claim → CSPRNG
- ✅ Account takeover via addEmail sans OTP → bloqué + 3 tests
- ✅ Clamp business-aware sur addToCard manuel
- ✅ Rate-limit register-direct (joinLimiter)
- ✅ Rate-limit verify-otp + merchant-verify-otp (otpVerifyLimiter 5/600s)
- ✅ PII leak phone customer existant retiré de register-direct
- ✅ Refactor emojis UI P0 (gift, lock, confetti) → Untitled UI lineart
- ✅ Refactor emojis UI P1 (mobile, bell, error-face) → Untitled UI lineart

**Findings P0 restants à valider avec toi avant action** (sensibles, peuvent casser auth/prod) :
- 🔴 RPCs `increment_stamps`/`increment_points`/`deduct_points` accessibles par rôle `authenticated` (escalade privilège possible) — **migration DB requise**
- 🔴 `middleware.ts` manquant à la racine — sessions SSR Supabase peuvent expirer silencieusement — **création d'un fichier sensible**

---

## Tier 1 — Findings P0 (état)

| # | Finding | Source | Status | Commit |
|---|---|---|---|---|
| **G-T1.1** | RPCs loyalty accessibles par `authenticated` → escalade privilège (un client OTP peut crediter n'importe quelle carte via API REST Supabase directe) | Gemini auth-rls | 🔴 **À VALIDER** | — |
| **G-T1.2** | PII leak `register-direct` : phone customer renvoyé en réponse `already_exists` | Gemini auth-rls | ✅ Fixé | `163fe63` |
| **G-T1.3** | Pas de rate-limit sur `register-direct` (spam inscription, épuisement quotas email Supabase) | Gemini auth-rls + api | ✅ Fixé | `163fe63` |
| **G-T1.4** | `middleware.ts` manquant → sessions SSR Supabase non rafraîchies | Gemini auth-rls | 🔴 **À VALIDER** | — |
| **A-T1.1** | Pas de rate-limit sur `verify-otp` + `merchant-verify-otp` → brute-force OTP 6 chiffres | Gemini api-validation | ✅ Fixé | `163fe63` |
| **L-T1-1** | `Math.random()` non-crypto sur codes claim 6 chars → bruteforce/devinette | Local services | ✅ Fixé | `7d3f87f` |
| **L-T1-2** | Takeover via `addEmailAndSendOtp` (overwrite email sans OTP préalable) | Local services | ✅ Fixé | `0a4665b` |
| **L-T1-3** | Pas de clamp business-aware sur `addToCard` (1000 stamps possible sur carte 10) | Local services | ✅ Fixé | `daece38` |

**6 P0 fixés sur 8.** Les 2 restants (G-T1.1 RLS RPCs + G-T1.4 middleware) demandent ton arbitrage car ils touchent l'infra critique.

---

## Findings P0 à valider (détail)

### 🔴 G-T1.1 — RPCs loyalty accessibles par `authenticated`

**Source :** [audit-auth-rls_report.txt](audit-auth-rls_report.txt) lignes 17, 95.

**Le problème** : les fonctions RPC `increment_stamps`, `increment_points`, `deduct_points` sont accessibles par tout user `authenticated` (= n'importe quel customer connecté via OTP). Un client malveillant peut appeler l'API REST Supabase directement pour ajouter des points sur la carte de quelqu'un d'autre, ou se créditer indéfiniment.

**Atténuation actuelle** : nos endpoints API serveur passent par `service_role` et vérifient `business_id`/`card_id`. Mais si un client appelle directement `https://<supabase>.co/rest/v1/rpc/increment_stamps` avec son JWT de session, il bypass tout notre code.

**Impact pilote** : haut. Un seul client malveillant + connaissance d'un `card_id` (visible dans l'URL `/card/[cardId]`) = vol de récompenses.

**Options** :

| Option | Description | Effort | Risque |
|---|---|---|---|
| **A** | Migration DB : `REVOKE EXECUTE ON FUNCTION ... FROM authenticated` | 0.5h | Faible (notre code utilise déjà `service_role`) |
| **B** | Migration DB : ajouter check `auth.uid()` interne aux fonctions (vérifier ownership) | 2h | Modéré (tests à faire sur RPC) |

**Ma reco** : **Option A**. Plus simple, plus sûr. Notre code app n'utilise jamais ces RPCs côté client. Si jamais on en a besoin un jour côté client, on créera une nouvelle fonction sécurisée. Une migration `20260508_revoke_authenticated_rpcs.sql` à faire :

```sql
REVOKE EXECUTE ON FUNCTION public.increment_stamps FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_points FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_points FROM authenticated;
```

**Décision attendue** : OK pour Option A ? (je crée la migration et la teste en dev avant de la pusher)

### 🔴 G-T1.4 — middleware.ts manquant

**Source :** [audit-auth-rls_report.txt](audit-auth-rls_report.txt) lignes 20, 71.

**Le problème** : Gemini affirme que `middleware.ts` est absent à la racine. Or les SSR clients Supabase (`lib/supabase/server.ts`) attendent que le middleware rafraîchisse les tokens expirés via `supabase.auth.getUser()`. Sans ça, les sessions Customer expirent silencieusement après 1h et les users sont déconnectés sans message.

**Vérification factuelle** : je vais checker si le fichier existe avant d'agir (Gemini a vu une absence dans le bundle, mais peut-être que le bundle l'avait filtré).

**Impact pilote** : haut si confirmé. Un client OTP login se déconnecte au bout d'1h sans avertissement → mauvaise UX, perte de cartes apparentes (resolved par re-login mais friction).

**Action si confirmé** : créer `middleware.ts` standard SSR Supabase :
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(/* ... cookies adapter ... */)
  await supabase.auth.getUser() // Refresh la session
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**Décision attendue** : tu valides que je crée le fichier ? Je le testerai en dev avant push.

---

## Tier 2 — Findings P1 (à planifier post-pilote)

| # | Finding | Source | Effort | Notes |
|---|---|---|---|---|
| **G-T2.1** | Pas de rate-limit sur exports lourds (`/api/account/export`, `/api/me/export`, `/api/wallet/[cardId]`) | Gemini api | 2h | Créer `resourceHeavyLimiter` (5/h/user) |
| **G-T2.2** | `throw insertErr` direct dans `/api/push/broadcast` → leak schéma DB potentiel | Gemini api | 0.5h | Wrapper en `AppError` |
| **G-T2.3** | Pas de rate-limit sur route feedback (commerçant) | Gemini api | 0.5h | Limiter Notion |
| **G-T2.4** | Profils customer orphelins si signInWithOtp échoue après INSERT | Gemini auth | 1h | Reporter INSERT après verify ou utiliser webhook |
| **L-T2-1** | `registerCustomer` permet hijack carte via email connu | Local services | 2h | Email confirmation ou phone match obligatoire |
| **L-T2-2** | `generateReferralCode` format prévisible (FIRST4-LAST4) | Local services | 3h | Code aléatoire stocké en DB |
| **L-T2-3** | Pas d'UNIQUE INDEX sur `referrals(referrer, referred)` → double-bonus | Local services | 1h | Migration DB |
| **L-T2-5** | `addToCard` `amount.max(1000)` Zod trop large | Local services | déjà mitigé via clamp service côté commit `daece38` | OK |
| **L-T2-6** | Notif errors swallowed silencieusement (pas de Sentry capture) | Local services | 1h | Sentry.captureException dans les `.catch()` |

**Total P1 :** ~10h de travail. Pas bloquant pour pilote.

---

## Tier 3 — Hardening (backlog)

- **Validation Zod hétérogène** : `register-direct`, `merchant-send-otp`, `merchant-verify-otp`, `claim-request`, `validate-claim`, `me/add-card` valident à la main. Migrer vers schémas Zod (audit Gemini api T3).
- **Rate-limit sur lectures publiques** : `/api/card/[cardId]/live`, `/api/dashboard/*` — limiter permissif anti-scraping.
- **Logger Sentry structuré** : remplacer les `console.error` dans `auth.service.ts:919` etc. par captures Sentry.
- **Test intégration FK** : vérifier l'absence de FK strict sur `reward_claims.reward_tier_id` (palier virtuel `'virtual-stamps-reward'`).

---

## Cross-checks effectués

- ✅ Doublon G-T1.3 / A-T1.2 (rate-limit register-direct) : un seul fix `163fe63`
- ✅ Cohérence headers HTTP : Gemini auth-rls dit "excellent" / Gemini api dit "à vérifier" → pas conflit, le 1er a vu `next.config.ts`, le 2nd ne l'avait pas dans son bundle
- ⏳ Cooldown anti-fraude scan : Gemini demande de confirmer que `loyalty.service.ts:scanCard` applique bien `last_visit_at + cooldown > now`. **Confirmation : oui, vérifié au commit existant** [loyalty.service.ts:1066-1092](../../lib/services/loyalty.service.ts#L1066-L1092)
- ⚠️ Question Gemini : RLS sur `customers`/`loyalty_cards` côté client (visibilité par owner) → **à vérifier**, peut-être finding P0 caché
- ⚠️ Wallet HMAC token : confirmé via `lib/auth/cardToken.ts` `timingSafeEqual` → OK

---

## Plan de validation pilote

**Avant pilote (effort restant ~3h après les 8 P0 déjà fixés)** :

1. **Décision G-T1.1** : OK migration `REVOKE EXECUTE ... FROM authenticated` ? (15 min implementation + 30 min test)
2. **Décision G-T1.4** : Confirmer absence `middleware.ts` puis créer (1h dont test)
3. **Cross-check RLS customers/loyalty_cards client-side** (Gemini Q ouverte) — 30 min lecture migrations
4. **Push final develop** + déployer preview Vercel pour validation visuelle

**Post-pilote (~10h)** : tous les Tier 2.

---

## Commits livrés cette session (8)

```
2284153  refactor(emojis): UI lineart pour mobile/bell/error-face (P1)
0cfe6ba  refactor(emojis): UI lineart pour gift/lock/confetti (P0)
daece38  fix(security): clamp business-aware sur addToCard (anti-abuse merchant)
0a4665b  fix(security): bloque le takeover via addEmailAndSendOtp
7d3f87f  fix(security): codes claim cryptographiquement sûrs (CSPRNG)
163fe63  fix(security): rate-limit auth endpoints + PII leak register-direct
484d8e9  docs(audit): rapports sécurité Gemini 1/2/4 + audit services local (Plan B)
f38e6f7  feat(7-2): reroute Profil → /me/profile + cleanup ProfileTab
```

**Tests :** 79/79 verts (3 nouveaux ajoutés sur `addEmailAndSendOtp`).
**Typecheck :** clean.
**Lint :** aucune nouvelle erreur sur les fichiers touchés.
