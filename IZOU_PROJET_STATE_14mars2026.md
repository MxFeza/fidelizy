# Fidelizy — Etat complet du projet

> Derniere mise a jour : 2026-03-14

## Stack technique

| Categorie     | Technologie                                    |
| ------------- | ---------------------------------------------- |
| Framework     | Next.js 16.1.6 (App Router, Turbopack)         |
| React         | 19.2.3                                         |
| Langage       | TypeScript 5                                   |
| CSS           | Tailwind CSS 4                                 |
| Auth + DB     | Supabase (Auth, PostgreSQL, RLS)               |
| Rate limiting | Upstash Redis (@upstash/ratelimit)             |
| Validation    | Zod (5 routes critiques)                       |
| QR Code       | html5-qrcode (scan), qrcode.react (generation) |
| Icones        | Lucide React                                   |
| Charts        | Recharts 3.7                                   |
| Apple Wallet  | node-forge + JSZip (generation .pkpass)         |
| Deploiement   | Vercel (auto-deploy depuis main)               |
| URL prod      | https://fidelizy.vercel.app                    |

---

## Variables d'environnement

| Variable                         | Usage                                  |
| -------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | URL du projet Supabase                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Cle publique Supabase (anon)           |
| `SUPABASE_SERVICE_ROLE_KEY`      | Cle service Supabase (bypass RLS)      |
| `KV_REST_API_URL`                | URL Upstash Redis (rate limiting)      |
| `KV_REST_API_TOKEN`              | Token Upstash Redis                    |
| `APPLE_PASS_TYPE_ID`             | Identifiant du pass Apple Wallet       |
| `APPLE_TEAM_ID`                  | Team ID Apple Developer                |
| `WALLET_AUTH_SECRET`             | Secret HMAC pour auth tokens Wallet    |
| `APPLE_CERT_PEM`                 | Certificat Apple Wallet (PEM)          |
| `APPLE_KEY_PEM`                  | Cle privee Apple Wallet (PEM)          |
| `APPLE_WWDR_PEM`                 | Certificat intermediaire Apple (WWDR)  |
| `APPLE_PASS_CERT_B64`           | Certificat Apple Wallet (base64)       |
| `APPLE_PASS_KEY_B64`            | Cle privee Apple Wallet (base64)       |
| `APPLE_WWDR_CERT_B64`           | Certificat WWDR Apple (base64)         |
| `VAPID_PUBLIC_KEY`              | Cle publique VAPID (push web)          |
| `VAPID_PRIVATE_KEY`             | Cle privee VAPID (push web)            |
| `VAPID_SUBJECT`                 | Contact VAPID (mailto:...)             |
| `NEXT_PUBLIC_APP_URL`           | URL de l'app (optionnel, fallback VERCEL_URL) |

---

## Modeles de donnees (lib/types.ts)

- **Business** : id (= auth.uid), business_name, logo_url, primary_color, secondary_color, loyalty_type (stamps|points), stamps_required, stamps_reward, points_per_euro, short_code, is_active
- **Customer** : id, first_name, phone, email, push_token (pas de compte Supabase Auth)
- **LoyaltyCard** : id, customer_id, business_id, current_stamps, current_points, total_visits, last_visit_at, qr_code_id, is_active
- **Transaction** : id, loyalty_card_id, business_id, type (earn|redeem), stamps_added, points_added, description
- **RewardTier** : id, business_id, points_required, reward_name, reward_description, sort_order
- **RewardClaim** : id, loyalty_card_id, reward_tier_id, reward_name, points_spent
- **WheelPrize** : id, business_id, label, emoji, probability, reward_type, reward_value, reward_description, sort_order
- **WheelSpin** : id, card_id, business_id, points_spent, prize_id, prize_label
- **Mission** : id, business_id, template_key, reward_points, is_active, config (jsonb)
- **MissionCompletion** : id, card_id, mission_id, proof_url, status, period, points_awarded
- **Referral** : id, referrer_card_id, referred_card_id, business_id, referrer_points_awarded, referred_points_awarded
- **PwaVisit** : card_id, visit_date (PK composite)
- **PushSubscription** : id, card_id, business_id, subscription (jsonb)
- **WalletRegistration** : id, device_library_id, serial_number, push_token

Relation cle : `businesses.id = auth.users.id` (1:1)
Note : `businesses.gamification` (jsonb) contient la config gamification (surprise, roue, initial_stamps, goal_gradient)

---

## Architecture technique

### Bibliotheques internes (`lib/`)

| Fichier                    | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `config.ts`                | BASE_URL centralise + helpers cardUrl(), joinUrl()              |
| `validation.ts`            | Schemas Zod partages + parseBody() helper                       |
| `types.ts`                 | Types TypeScript (Business, Customer, LoyaltyCard, etc.)        |
| `auth/cardToken.ts`        | HMAC token pour auth routes client (lu au call time)            |
| `db/atomic.ts`             | Fonctions RPC atomiques (points/stamps increment/deduct)        |
| `supabase/client.ts`       | Client Supabase browser (createBrowserClient, anon key)         |
| `supabase/server.ts`       | Client Supabase serveur (createServerClient, cookies, anon key) |
| `supabase/service.ts`      | Client Supabase service role (bypass RLS, API routes)           |
| `ratelimit.ts`             | Rate limiters Upstash (scan, join, recover, otp, card-write)    |
| `wallet/generatePass.ts`   | Generation de fichiers .pkpass (Apple Wallet)                   |
| `wallet/push.ts`           | Envoi de push notifications APNs pour mise a jour des passes    |
| `referral.ts`              | Recherche de carte par code parrain                             |
| `push/sendPush.ts`         | Envoi de push web VAPID a une carte                             |

### Composants carte client (`app/card/[cardId]/components/`)

| Composant          | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `CardTab.tsx`      | QR code, tampons/points, paliers, roue, Wallet (~320 lignes)         |
| `MissionsTab.tsx`  | Missions, code parrain, profil, avis Google (~320 lignes)            |
| `HistoryTab.tsx`   | Liste des transactions (~60 lignes)                                  |
| `WheelModal.tsx`   | Modal roue de la fortune + animation (~200 lignes)                   |
| `ConfettiEffect.tsx` | Effet confetti visuel (~45 lignes)                                 |
| `PushBanner.tsx`   | Bandeau permission push web (~85 lignes)                             |
| `utils.tsx`        | Fonctions utilitaires, icones tabs, types (~60 lignes)               |

---

## Ce qui est 100% fonctionnel

### Securite (Phase 0 — deploye 11 mars 2026)
- [x] Rate limit verify-otp (Upstash Redis)
- [x] Fix fuite email (masquage cote serveur)
- [x] Operations atomiques RPC (points/stamps) — lib/db/atomic.ts
- [x] Auth token client (HMAC) — lib/auth/cardToken.ts
- [x] Nettoyage logs sensibles

### Hygiene codebase (Phase 1 — deploye 14 mars 2026)
- [x] BASE_URL centralise dans lib/config.ts (21 URLs hardcodees supprimees)
- [x] Code mort supprime (dossier src/ duplique, assets create-next-app inutilises)
- [x] Error/loading boundaries (dashboard + carte client)
- [x] CardPageClient.tsx refactore en 7 composants (1374 → 415 lignes)
- [x] Zod validation sur 5 routes critiques (send-otp, verify-otp, join, scan, wheel/spin)

### Cote client (public)
- [x] Accueil avec saisie code commerce 6 caracteres
- [x] Authentification par telephone + OTP email
- [x] Ajout d'email si client existant sans email
- [x] Inscription nouveau client (prenom, phone, email, OTP)
- [x] Vue carte de fidelite (tampons visuels ou points)
- [x] QR code personnel pour scan
- [x] Code court de la carte (copier/coller)
- [x] Historique des transactions
- [x] Paliers de recompenses (mode points)
- [x] Recuperation de carte par telephone
- [x] PWA installable (manifest dynamique par carte)
- [x] Service worker
- [x] Apple Wallet (.pkpass) avec push notifications
- [x] Autocompletation OTP iOS (autoComplete one-time-code)
- [x] Polling leger pour mise a jour en temps reel des tampons/points

### Cote commercant (dashboard)
- [x] Inscription / connexion commercant (email + password)
- [x] Middleware de protection des routes dashboard
- [x] Tableau de bord avec 8 KPIs
- [x] Graphique en barres des visites sur 7 jours (Recharts)
- [x] Top 3 clients par visites
- [x] Scanner QR code camera
- [x] Saisie manuelle (code court ou UUID)
- [x] Code commerce + lien d'inscription direct
- [x] Liste des derniers scans
- [x] Liste clients avec filtres, recherche, tri, pagination
- [x] Detail client avec carte visuelle, stats, ajout/retrait
- [x] Parametres (nom, couleur, type fidelite, paliers)
- [x] Profil commercant (email, mot de passe, deconnexion)
- [x] Dashboard responsive mobile
- [x] Rate limiting sur toutes les routes sensibles
- [x] Headers de securite (HSTS, X-Frame-Options, etc.)
- [x] Export CSV des clients

### Apple Wallet
- [x] Generation de .pkpass
- [x] Protocole complet Apple Wallet Web Service

### Gamification (Sprints 1-4)
- [x] Config gamification par commerce (jsonb)
- [x] Surprise au scan (bonus aleatoire)
- [x] Goal gradient notification
- [x] Tampons de bienvenue (initial_stamps)
- [x] Roue de la fortune (mode points)
- [x] Missions (avis Google, profil, visites mensuelles, parrainage)
- [x] Templates commercant (Cafe, Restaurant, Boulangerie)
- [x] Stats engagement basiques
- [x] Notifications push web (VAPID) + broadcast
- [x] Cron job pour notifier les clients inactifs

---

## Bugs connus

- Roue "Non autorise" : **CORRIGE** (env var WALLET_AUTH_SECRET lue au call time au lieu du module load)

---

## Features non implementees / a faire

- [ ] **Insights** : page d'analytics avancee (onglet present mais desactive)
- [ ] **QR code imprimable** pour le commercant (a afficher en caisse)
- [ ] **Personnalisation avancee** : logo upload, couleur secondaire
- [ ] **Multi-commerces** : un commercant = plusieurs points de vente
- [ ] **Google Wallet** : equivalent du .pkpass pour Android
- [ ] **SMS** : envoi d'OTP par SMS (actuellement email uniquement)
- [ ] **Tableau de bord client** : espace client avec toutes ses cartes
- [ ] **Suppression de compte** (RGPD)
- [ ] **I18n** : traduction anglais (actuellement tout en francais)
- [ ] **Tests** : aucun test unitaire ou e2e
- [ ] **Template email OTP** : a configurer dans Supabase
- [ ] **Zod validation** : etendre aux 34 routes restantes
- [ ] **Types Supabase** : generer via CLI (npx supabase gen types)

---

## Dependances npm notables

### Production
| Package               | Version  | Usage                            |
| --------------------- | -------- | -------------------------------- |
| `next`                | 16.1.6   | Framework                        |
| `react` / `react-dom` | 19.2.3   | UI                               |
| `@supabase/ssr`       | ^0.8.0   | Client Supabase SSR              |
| `@supabase/supabase-js` | ^2.98.0 | Client Supabase JS              |
| `@upstash/ratelimit`  | ^2.0.8   | Rate limiting                    |
| `@upstash/redis`      | ^1.36.3  | Redis client                     |
| `zod`                 | ^3.x     | Validation schemas               |
| `html5-qrcode`        | ^2.3.8   | Scanner QR camera                |
| `qrcode.react`        | ^4.2.0   | Generation QR code SVG           |
| `lucide-react`        | ^0.577.0 | Icones                           |
| `recharts`            | ^3.7.0   | Graphiques                       |
| `jszip`               | ^3.10.1  | Creation ZIP (.pkpass)           |
| `node-forge`          | ^1.3.3   | Signature PKCS#7 (Apple Wallet)  |
| `web-push`            | ^3.x     | Push notifications VAPID (web)   |

### Dev
| Package               | Usage                            |
| --------------------- | -------------------------------- |
| `tailwindcss`         | CSS utility-first                |
| `@tailwindcss/postcss`| Plugin PostCSS                   |
| `typescript`          | Typage                           |
| `eslint` + `eslint-config-next` | Linting                 |
