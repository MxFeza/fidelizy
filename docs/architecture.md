# Izou — Architecture

> Genere le : 2026-03-23 | Scan exhaustif

## Resume executif

Izou est une application Next.js 16 monolithique deployee sur Vercel. Elle combine frontend React 19 (Server + Client Components) et backend (API Routes) dans un seul codebase. La persistance est assuree par Supabase (PostgreSQL + Auth + RLS), le rate limiting par Upstash Redis, et les notifications par Web Push (VAPID) et Apple Push Notification Service (APNs).

## Pattern architectural

**Type** : Application web full-stack monolithique
**Pattern** : Component-based + API Routes serverless
**Rendering** : Hybrid SSR/CSR (Server Components + Client Components)

```
+-----------------+     +------------------+     +-------------------+
|   Client PWA    |     |  Apple Wallet    |     |  Vercel Cron      |
|  (React 19)     |     |  (APNs)          |     |  (push-inactive)  |
+-------+---------+     +--------+---------+     +---------+---------+
        |                        |                         |
        v                        v                         v
+-------+------------------------+-------------------------+---------+
|                      Next.js App Router                            |
|  +-------------+  +----------------+  +------------------------+   |
|  | Pages (SSR) |  | API Routes     |  | Middleware (auth)      |   |
|  | /card/[id]  |  | /api/scan      |  | /dashboard/* protect   |   |
|  | /dashboard  |  | /api/wallet    |  +------------------------+   |
|  | /join/[id]  |  | /api/push      |                               |
|  +-------------+  +----------------+                               |
+---------+--------------------+-------------------------------------+
          |                    |
          v                    v
+--------------------+  +------------------+
|   Supabase         |  |  Upstash Redis   |
|   PostgreSQL + RLS |  |  Rate Limiting   |
|   Auth (OTP email) |  +------------------+
+--------------------+
```

## Structure des couches

### 1. Couche presentation (Frontend)

| Dossier | Role |
|---------|------|
| `app/page.tsx` | Page d'accueil — authentification client (code commerce + phone + OTP) |
| `app/card/[cardId]/` | Page carte fidelite — tampons/points, QR, historique, missions, roue |
| `app/join/[businessId]/` | Inscription client — formulaire + OTP |
| `app/recover/` | Recuperation de cartes par telephone |
| `app/dashboard/(auth)/` | Login/register commercant |
| `app/dashboard/(protected)/` | Dashboard commercant (KPIs, clients, engagement, notifications, parametres) |
| `app/components/` | Composants partages (OTPInput, QrScanner, QrCodeDisplay, ShortCodeDisplay, RegisterSW) |
| `components/dashboard/` | Composants dashboard (BottomNav, MobileHeader) |

**Patterns frontend** :
- Server Components pour le chargement initial des donnees (SSR)
- Client Components (`'use client'`) pour l'interactivite
- Polling leger (8s) pour mise a jour temps reel des tampons/points
- Pas de state management global (useState local uniquement)
- Responsive design (Tailwind CSS, mobile-first pour le dashboard)

### 2. Couche API (Backend)

45 endpoints organises par domaine fonctionnel :

| Domaine | Endpoints | Auth requise |
|---------|-----------|-------------|
| Authentification (OTP) | 3 | Non (public) |
| Business lookup | 1 | Non |
| Operations carte | 6 | Commercant |
| Carte live / profil | 2 | Non |
| Dashboard KPIs | 4 | Commercant |
| Dashboard gamification | 8 | Commercant |
| Missions client | 3 | Mixte |
| Push notifications | 4 | Mixte |
| Cron jobs | 1 | CRON_SECRET |
| PWA (manifest, visite) | 2 | Non |
| Apple Wallet | 6 | Apple protocol |
| Scanner / Roue | 3 | Mixte |

**Patterns backend** :
- Validation d'input systematique (longueur, type, regex)
- Rate limiting Upstash sur toutes les routes sensibles (15 limiters)
- Service client Supabase (bypass RLS) pour les routes publiques
- Server client Supabase (avec auth) pour les routes dashboard
- Reponses JSON standardisees avec codes HTTP semantiques

### 3. Couche donnees

**Supabase PostgreSQL** avec Row Level Security (RLS).

14 tables :
- `businesses` (1:1 avec auth.users)
- `customers` (pas de compte Supabase Auth)
- `loyalty_cards` (lien customer <-> business)
- `transactions` (earn/redeem)
- `reward_tiers` (paliers de recompenses mode points)
- `reward_claims` (recompenses echangees)
- `wheel_prizes` (segments roue de la fortune)
- `wheel_spins` (historique des tours)
- `missions` (templates de missions par commerce)
- `mission_completions` (progres des clients)
- `referrals` (parrainages)
- `pwa_visits` (visites journalieres PWA)
- `push_subscriptions` (abonnements push VAPID)
- `wallet_registrations` (appareils Apple Wallet)

**Politique RLS** : Les tables metier sont protegees par RLS (`business_id = auth.uid()`). Les operations publiques (inscription client, scan) passent par le service client (bypass RLS).

### 4. Couche utilitaire (`lib/`)

| Module | Fichier(s) | Role |
|--------|-----------|------|
| Supabase | `lib/supabase/client.ts`, `server.ts`, `service.ts` | 3 clients Supabase (browser, server SSR, service role) |
| Rate Limiting | `lib/ratelimit.ts` | 15 rate limiters Upstash (sliding window) |
| Types | `lib/types.ts` | Definitions TypeScript des 14 entites |
| Wallet | `lib/wallet/generatePass.ts` | Generation .pkpass (PKCS7, JSZip) |
| Wallet Push | `lib/wallet/push.ts` | Push APNs HTTP/2 vers appareils Apple |
| Web Push | `lib/push/sendPush.ts` | Push VAPID vers navigateurs |
| Referral | `lib/referral.ts` | Generation/validation codes parrainage |

### 5. Middleware

`middleware.ts` — Protege les routes `/dashboard/*` :
- Verifie la session Supabase via cookies
- Redirige vers `/dashboard/login` si non authentifie
- Redirige vers `/dashboard` si authentifie sur une page auth
- Rafraichit automatiquement la session

## Flux de donnees principaux

### Inscription client
```
Client -> /join/[businessId] -> POST /api/join
  -> Supabase: upsert customer + insert loyalty_card
  -> Si referral: award points aux 2 parties
  -> Si initial_stamps: bonus de bienvenue
  -> Push notification + Wallet update
  -> Redirect vers /card/[cardId]
```

### Scan QR (commercant)
```
Commercant -> Dashboard scanner -> POST /api/scan
  -> Auth check (merchant)
  -> Supabase: update loyalty_card (+1 stamp ou +N points)
  -> Insert transaction
  -> Check surprise bonus (probabilite configurable)
  -> Check goal gradient (notification si proche recompense)
  -> Push web + Push Apple Wallet
  -> Reponse avec nouveau solde + surprise eventuelle
```

### Roue de la fortune
```
Client -> /card/[cardId] -> POST /api/wheel/spin
  -> Verifier eligibilite (assez de points, roue activee)
  -> Selection aleatoire ponderee du segment
  -> Deduire le cout en points
  -> Appliquer la recompense (bonus points/tampons ou custom)
  -> Insert wheel_spin + transaction
  -> Push + Wallet update
```

## Securite

### Headers HTTP (next.config.ts)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(), geolocation=()`

### Authentification
- **Clients** : OTP email via Supabase Auth (pas de mot de passe)
- **Commercants** : Email + mot de passe via Supabase Auth
- **Apple Wallet** : HMAC-SHA256 tokens avec `timingSafeEqual`
- **Cron** : Bearer token (`CRON_SECRET`)

### Rate limiting
15 limiters Upstash couvrant toutes les routes sensibles (voir [api-contracts.md](./api-contracts.md)).

### Variables d'environnement
17 variables dont 2 publiques (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Les cles sensibles ne sont jamais exposees cote client. Voir [Audit de securite](../SECURITY_AUDIT.md).

## Limites et dette technique connues

- **Pas de tests** (aucun test unitaire ou E2E)
- **Duplication `src/lib/supabase/`** : Copie identique de `lib/supabase/` (legacy)
- **Pas de state management global** : Tout est en `useState` local
- **Pas de i18n** : Application en francais uniquement
- **Pas de Google Wallet** : Seul Apple Wallet est supporte
- **Page Insights desactivee** : Presente dans la nav mais non implementee
- **Pas de suppression de compte** (GDPR)
- **Pas de CI/CD** au-dela du auto-deploy Vercel
