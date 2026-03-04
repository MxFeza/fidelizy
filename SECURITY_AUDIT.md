# Audit de sécurité — Fidelizy

**Date** : 4 mars 2026

---

## 1. En-têtes de sécurité HTTP

**Statut** : Corrigé

`next.config.ts` n'avait aucun en-tête de sécurité. Ajout de :

| En-tête | Valeur |
|---------|--------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(self), microphone=(), geolocation=()` |
| `X-DNS-Prefetch-Control` | `on` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |

---

## 2. Variables d'environnement

**Statut** : OK (aucune fuite)

- `SUPABASE_SERVICE_ROLE_KEY` : utilisé uniquement dans `lib/supabase/service.ts` (serveur)
- `WALLET_AUTH_SECRET` : utilisé uniquement dans `lib/wallet/generatePass.ts` (serveur)
- Aucun composant `'use client'` n'importe `@/lib/supabase/service`
- `.env*` est dans `.gitignore`
- Seule variable publique : `NEXT_PUBLIC_SUPABASE_URL` (safe)

---

## 3. Validation des entrées API

**Statut** : Corrigé

### Corrections appliquées :

| Route | Problème | Correction |
|-------|----------|------------|
| `/api/scan` | `qr_code_id` passé à `ilike` sans nettoyage des wildcards SQL (`%`, `_`) | Suppression de `%` et `_` du code nettoyé + validation type/longueur |
| `/api/join` | Aucune validation de longueur pour `firstName` et `phone` | Ajout : `firstName` 1-100 chars, `phone` 6-20 chars, `businessId` max 100 |
| `/api/card/add` | `amount` acceptait des flottants et des valeurs illimitées | Ajout : `Number.isInteger(amount)` + plafond à 1000 |
| `/api/card/deduct` | Même problème que `add` | Même correction |
| `/api/card/reset` | Pas de rate limiting | Ajout de `cardWriteLimiter` |
| `/api/card/claim-reward` | Pas de rate limiting | Ajout de `cardWriteLimiter` |

### Déjà en place :

- `/api/scan` : `scanLimiter` (10 req/60s) + auth merchant
- `/api/join` : `joinLimiter` (5 req/60s)
- `/api/recover` : `recoverLimiter` (5 req/60s) + validation phone >= 6 chars
- `/api/card/add` : `cardWriteLimiter` (20 req/60s) + auth merchant
- `/api/card/deduct` : `cardWriteLimiter` + auth merchant

---

## 4. Authentification Wallet v1

**Statut** : OK

| Route | Auth | Détail |
|-------|------|--------|
| `POST /v1/devices/.../registrations/.../[serial]` | `ApplePass <token>` | `verifyAuthToken` avec `timingSafeEqual` |
| `DELETE /v1/devices/.../registrations/.../[serial]` | `ApplePass <token>` | Idem |
| `GET /v1/passes/[passType]/[serial]` | `ApplePass <token>` | Idem |
| `GET /v1/devices/.../registrations/[passType]` | Aucune | Conforme au protocole Apple (pas d'auth requise) |
| `POST /v1/log` | Aucune | Conforme au protocole Apple (endpoint debug) |

---

## 5. Résumé

| Catégorie | Avant | Après |
|-----------|-------|-------|
| En-têtes HTTP | Aucun | 6 en-têtes de sécurité |
| Fuite env vars | Aucune | Aucune |
| Validation inputs | Partielle | Complète |
| Rate limiting | 5/7 routes | 7/7 routes sensibles |
| Auth Wallet | OK | OK |
