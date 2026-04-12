# Izou — Arbre source annote

> Genere le : 2026-03-23 | Scan exhaustif

## Structure du projet

```
fidelizy/                          # Racine du projet Next.js
|
|-- app/                           # Next.js App Router (pages + API)
|   |-- layout.tsx                 # Layout racine (fonts Geist, PWA meta, RegisterSW)
|   |-- page.tsx                   # Page d'accueil (auth client : code + phone + OTP)
|   |-- globals.css                # Styles globaux Tailwind CSS 4
|   |-- favicon.ico
|   |
|   |-- api/                       # ** 45 API Routes **
|   |   |-- auth/
|   |   |   |-- send-otp/route.ts      # POST - Envoyer OTP par email
|   |   |   |-- verify-otp/route.ts    # POST - Verifier code OTP
|   |   |   |-- add-email/route.ts     # POST - Ajouter email a un client
|   |   |
|   |   |-- business/route.ts          # GET - Lookup business par short_code
|   |   |
|   |   |-- card/
|   |   |   |-- add/route.ts           # POST - Ajouter tampons/points
|   |   |   |-- claim-reward/route.ts  # POST - Echanger points contre recompense
|   |   |   |-- deduct/route.ts        # POST - Retirer tampons/points
|   |   |   |-- reset/route.ts         # POST - Remettre tampons a zero
|   |   |   |-- update-profile/route.ts # POST - Mettre a jour profil client
|   |   |   |-- [cardId]/
|   |   |       |-- live/route.ts      # GET - Polling leger (stamps/points actuels)
|   |   |
|   |   |-- cron/
|   |   |   |-- push-inactive/route.ts # GET - Cron relance clients inactifs (30j)
|   |   |
|   |   |-- dashboard/
|   |   |   |-- kpis/route.ts              # GET - 8 KPIs dashboard
|   |   |   |-- visits-week/route.ts       # GET - Visites 7 derniers jours
|   |   |   |-- top-clients/route.ts       # GET - Top 3 clients
|   |   |   |-- export-clients/route.ts    # GET - Export donnees clients
|   |   |   |-- engagement-stats/route.ts  # GET - Stats gamification
|   |   |   |-- gamification/route.ts      # GET/PUT - Config gamification
|   |   |   |-- missions/route.ts          # GET/PUT - Config missions
|   |   |   |   |-- pending/route.ts       # GET - Validations en attente
|   |   |   |-- wheel-prizes/route.ts      # GET/POST/PUT/DELETE - CRUD roue
|   |   |
|   |   |-- join/route.ts                 # POST - Inscription client
|   |   |-- recover/route.ts              # GET - Recuperation cartes par phone
|   |   |-- scan/route.ts                 # POST - Scan QR commercant
|   |   |
|   |   |-- manifest/
|   |   |   |-- [cardId]/route.ts          # GET - Manifest PWA dynamique
|   |   |
|   |   |-- missions/
|   |   |   |-- complete/route.ts          # POST - Completer une mission
|   |   |   |-- validate/route.ts          # POST - Valider/rejeter une mission
|   |   |   |-- [cardId]/route.ts          # GET - Missions disponibles pour une carte
|   |   |
|   |   |-- push/
|   |   |   |-- subscribe/route.ts         # POST/DELETE - Gestion abonnements push
|   |   |   |-- broadcast/route.ts         # GET/POST - Broadcast push commercant
|   |   |
|   |   |-- pwa-visit/
|   |   |   |-- [cardId]/route.ts          # POST - Enregistrer visite PWA
|   |   |
|   |   |-- wallet/
|   |   |   |-- [cardId]/route.ts          # GET - Generer .pkpass
|   |   |   |-- v1/
|   |   |       |-- devices/
|   |   |       |   |-- [deviceLibraryId]/
|   |   |       |       |-- registrations/
|   |   |       |           |-- [passTypeId]/
|   |   |       |               |-- route.ts       # GET - Passes mis a jour
|   |   |       |               |-- [serialNumber]/
|   |   |       |                   |-- route.ts   # POST/DELETE - Register/unregister
|   |   |       |-- log/route.ts                   # POST - Logs Apple Wallet
|   |   |       |-- passes/
|   |   |           |-- [passTypeId]/
|   |   |               |-- [serialNumber]/
|   |   |                   |-- route.ts           # GET - Download pass mis a jour
|   |   |
|   |   |-- wheel/
|   |       |-- [cardId]/route.ts              # GET - Config roue pour une carte
|   |       |-- spin/route.ts                  # POST - Tourner la roue
|   |
|   |-- card/                      # ** Page carte client **
|   |   |-- [cardId]/
|   |       |-- page.tsx               # Server Component (SSR data)
|   |       |-- CardPageClient.tsx     # Client Component (UI interactive)
|   |
|   |-- join/                      # ** Page inscription client **
|   |   |-- [businessId]/
|   |       |-- page.tsx               # Server Component
|   |       |-- JoinForm.tsx           # Client Component (formulaire)
|   |
|   |-- recover/                   # ** Page recuperation cartes **
|   |   |-- page.tsx                   # Server Component
|   |   |-- RecoverForm.tsx            # Client Component
|   |
|   |-- dashboard/                 # ** Dashboard commercant **
|   |   |-- (auth)/                    # Route group : pages publiques
|   |   |   |-- login/page.tsx             # Login email + password
|   |   |   |-- register/page.tsx          # Inscription commercant
|   |   |
|   |   |-- (protected)/              # Route group : pages protegees
|   |       |-- layout.tsx                 # Layout avec Sidebar + nav mobile
|   |       |-- page.tsx                   # Dashboard home (SSR)
|   |       |-- DashboardClient.tsx        # Dashboard client (KPIs, scanner)
|   |       |-- Sidebar.tsx                # Navigation desktop
|   |       |
|   |       |-- clients/
|   |       |   |-- page.tsx               # Liste clients (SSR)
|   |       |   |-- ClientsClient.tsx      # Filtres, recherche, export
|   |       |   |-- [id]/
|   |       |       |-- page.tsx           # Detail client (SSR)
|   |       |       |-- ClientDetailClient.tsx  # Gestion carte client
|   |       |
|   |       |-- engagement/
|   |       |   |-- page.tsx               # Config gamification complete
|   |       |
|   |       |-- notifications/
|   |       |   |-- page.tsx               # Broadcast push
|   |       |
|   |       |-- settings/
|   |       |   |-- page.tsx               # Parametres programme fidelite
|   |       |
|   |       |-- profile/
|   |           |-- page.tsx               # Profil (SSR)
|   |           |-- ProfileClient.tsx      # Email, password, deconnexion
|   |
|   |-- components/                # Composants partages app
|       |-- OTPInput.tsx               # Saisie OTP 6 chiffres
|       |-- QrScanner.tsx              # Scanner QR camera
|       |-- QrCodeDisplay.tsx          # Affichage QR code SVG
|       |-- ShortCodeDisplay.tsx       # Affichage code court + copie
|       |-- RegisterSW.tsx             # Enregistrement service worker
|
|-- components/                    # Composants partages (racine)
|   |-- dashboard/
|       |-- BottomNav.tsx              # Navigation mobile (bottom tabs)
|       |-- MobileHeader.tsx           # Header mobile
|
|-- lib/                           # ** Utilitaires et logique metier **
|   |-- types.ts                       # Types TypeScript (14 entites)
|   |-- ratelimit.ts                   # 15 rate limiters Upstash
|   |-- referral.ts                    # Generation/validation codes parrainage
|   |-- supabase/
|   |   |-- client.ts                  # Client browser (anon key)
|   |   |-- server.ts                  # Client server SSR (cookies)
|   |   |-- service.ts                 # Client service role (bypass RLS)
|   |-- push/
|   |   |-- sendPush.ts               # Web Push VAPID
|   |-- wallet/
|       |-- generatePass.ts            # Generation .pkpass (PKCS7 + ZIP)
|       |-- push.ts                    # Push APNs HTTP/2
|
|-- src/                           # ** Legacy (duplication) **
|   |-- lib/
|       |-- supabase/
|           |-- client.ts              # (doublon de lib/supabase/client.ts)
|           |-- server.ts              # (doublon de lib/supabase/server.ts)
|
|-- supabase/                      # ** Migrations base de donnees **
|   |-- migrations/
|       |-- 20260308_push_last_sent.sql       # Tracking push sent
|       |-- 20260308_push_subscriptions.sql   # Table push_subscriptions
|       |-- 20260309_reward_claims_cascade.sql # Fix cascade reward_claims
|       |-- add_gamification_column.sql       # Colonne gamification (jsonb)
|       |-- add_missions_tables.sql           # Tables missions, completions, referrals, pwa_visits
|       |-- add_short_code.sql                # Colonne short_code businesses
|       |-- add_wheel_tables.sql              # Tables wheel_prizes, wheel_spins
|
|-- public/                        # ** Assets statiques **
|   |-- manifest.json                  # Manifest PWA statique
|   |-- sw.js                          # Service Worker (cache + push)
|   |-- icon.svg                       # Icone vectorielle
|   |-- icon-192.png                   # Icone PWA 192x192
|   |-- icon-512.png                   # Icone PWA 512x512 (maskable)
|
|-- scripts/                       # ** Scripts utilitaires **
|   |-- generate-vapid-keys.js         # Generateur cles VAPID
|
|-- docs/                          # ** Documentation **
|   |-- PROJET_STATE.md                # Etat complet du projet (original)
|   |-- SUPABASE_EMAIL_TEMPLATE.md     # Template email OTP
|   |-- (... docs generees ...)
|
|-- middleware.ts                   # Protection routes /dashboard/*
|-- next.config.ts                 # Config Next.js (security headers)
|-- tsconfig.json                  # Config TypeScript
|-- package.json                   # Dependances npm
|-- vercel.json                    # Config Vercel (cron jobs)
|-- eslint.config.mjs              # Config ESLint
|-- postcss.config.mjs             # Config PostCSS (Tailwind)
|-- SECURITY_AUDIT.md              # Audit securite (4 mars 2026)
|-- README.md                      # README template Next.js
```

## Dossiers critiques

| Dossier | Importance | Description |
|---------|-----------|-------------|
| `app/api/` | Haute | Toute la logique backend — 45 routes API |
| `app/card/[cardId]/` | Haute | Experience client principale — carte fidelite |
| `app/dashboard/(protected)/` | Haute | Dashboard commercant complet |
| `lib/` | Haute | Utilitaires critiques (Supabase, Wallet, Push, Rate limiting) |
| `supabase/migrations/` | Haute | Schema de la base de donnees |
| `middleware.ts` | Haute | Securite — protection des routes |
| `public/sw.js` | Moyenne | Service Worker PWA (cache + push) |
| `src/lib/supabase/` | Basse | Duplication legacy — a supprimer |

## Points d'entree

| Point d'entree | Fichier | Description |
|----------------|---------|-------------|
| App racine | `app/layout.tsx` | Layout racine Next.js |
| Page accueil | `app/page.tsx` | Authentification client |
| Middleware | `middleware.ts` | Protection routes dashboard |
| Service Worker | `public/sw.js` | PWA, cache, push notifications |
