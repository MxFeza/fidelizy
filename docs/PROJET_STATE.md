# Fidelizy — Etat complet du projet

> Derniere mise a jour : 2026-03-09

## Stack technique

| Categorie     | Technologie                                    |
| ------------- | ---------------------------------------------- |
| Framework     | Next.js 16.1.6 (App Router, Turbopack)         |
| React         | 19.2.3                                         |
| Langage       | TypeScript 5                                   |
| CSS           | Tailwind CSS 4                                 |
| Auth + DB     | Supabase (Auth, PostgreSQL, RLS)               |
| Rate limiting | Upstash Redis (@upstash/ratelimit)             |
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

---

## Modeles de donnees (lib/types.ts)

- **Business** : id (= auth.uid), business_name, logo_url, primary_color, secondary_color, loyalty_type (stamps\|points), stamps_required, stamps_reward, points_per_euro, short_code, is_active
- **Customer** : id, first_name, phone, email, push_token (pas de compte Supabase Auth)
- **LoyaltyCard** : id, customer_id, business_id, current_stamps, current_points, total_visits, last_visit_at, qr_code_id, is_active
- **Transaction** : id, loyalty_card_id, business_id, type (earn\|redeem), stamps_added, points_added, description
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

## Routes API

### Authentification client (OTP email)

| Methode | Chemin                | Description                                                       | Rate limit |
| ------- | --------------------- | ----------------------------------------------------------------- | ---------- |
| POST    | `/api/auth/send-otp`  | Cherche le client par phone, envoie OTP par email                 | 3/10min    |
| POST    | `/api/auth/verify-otp`| Verifie le code OTP 6 chiffres, retourne les cartes du client     | —          |
| POST    | `/api/auth/add-email` | Ajoute un email a un client existant (phone), puis envoie OTP     | 3/10min    |

### Commerce

| Methode | Chemin             | Description                                          | Auth       |
| ------- | ------------------ | ---------------------------------------------------- | ---------- |
| GET     | `/api/business`    | Lookup business par short_code (query param)         | Public     |

### Carte client

| Methode | Chemin                       | Description                                           | Auth            | Rate limit |
| ------- | ---------------------------- | ----------------------------------------------------- | --------------- | ---------- |
| POST    | `/api/join`                  | Inscription client : cree customer + loyalty_card      | Public          | 5/60s      |
| GET     | `/api/recover`               | Retrouver ses cartes par telephone                     | Public          | 5/60s      |
| POST    | `/api/scan`                  | Scanner QR : +1 tampon ou +N points                    | Commercant auth | 10/60s     |
| POST    | `/api/card/add`              | Ajouter manuellement tampons/points                    | Commercant auth | 20/60s     |
| POST    | `/api/card/deduct`           | Retirer tampons/points (correction)                    | Commercant auth | 20/60s     |
| POST    | `/api/card/reset`            | Remettre les tampons a 0                               | Commercant auth | 20/60s     |
| POST    | `/api/card/claim-reward`     | Echanger des points contre une recompense (palier)     | Commercant auth | 20/60s     |
| GET     | `/api/card/[cardId]/live`    | Polling leger : stamps + points actuels                | Public          | —          |

### Dashboard commercant (KPIs)

| Methode | Chemin                          | Description                                           | Auth            |
| ------- | ------------------------------- | ----------------------------------------------------- | --------------- |
| GET     | `/api/dashboard/kpis`           | KPIs : visites jour, nouveaux mois, distribues, taux retour, frequence, a risque, perdus | Commercant auth |
| GET     | `/api/dashboard/visits-week`    | Visites des 7 derniers jours (pour graphique)          | Commercant auth |
| GET     | `/api/dashboard/top-clients`    | Top 3 clients par nombre de visites                    | Commercant auth |

### PWA Manifest

| Methode | Chemin                      | Description                                   |
| ------- | --------------------------- | --------------------------------------------- |
| GET     | `/api/manifest/[cardId]`    | Manifest dynamique par carte (nom + couleur)   |

### Apple Wallet

| Methode | Chemin                                                                           | Description                                     |
| ------- | -------------------------------------------------------------------------------- | ----------------------------------------------- |
| GET     | `/api/wallet/[cardId]`                                                           | Genere et telecharge le .pkpass                  |
| GET     | `/api/wallet/v1/devices/[deviceLibraryId]/registrations/[passTypeId]`            | Liste les passes mis a jour (protocole Apple)    |
| POST/DELETE | `/api/wallet/v1/devices/[deviceLibraryId]/registrations/[passTypeId]/[serialNumber]` | Enregistrer/desenregistrer un device (protocole Apple) |
| GET     | `/api/wallet/v1/passes/[passTypeId]/[serialNumber]`                              | Telecharger la derniere version du pass (protocole Apple) |
| POST    | `/api/wallet/v1/log`                                                             | Recevoir les logs d'erreur Apple Wallet          |

### Gamification

| Methode | Chemin                                | Description                                           | Auth            | Rate limit |
| ------- | ------------------------------------- | ----------------------------------------------------- | --------------- | ---------- |
| GET/PUT | `/api/dashboard/gamification`         | Config gamification (surprise, roue, goal gradient)    | Commercant auth | 10/60s     |
| GET/POST/PUT/DELETE | `/api/dashboard/wheel-prizes` | CRUD segments de la roue de la fortune          | Commercant auth | 10/60s     |
| GET/PUT | `/api/dashboard/missions`             | Config missions (google_review, referral, etc.)        | Commercant auth | 10/60s     |
| GET     | `/api/dashboard/missions/pending`     | Liste des validations en attente (avis Google)         | Commercant auth | 10/60s     |
| GET     | `/api/dashboard/engagement-stats`     | Stats engagement (surprises, roue, missions, parrainages) | Commercant auth | 10/60s |
| POST    | `/api/missions/complete`              | Completer une mission (profil, avis Google)            | Service role    | 5/h        |
| POST    | `/api/missions/validate`              | Valider/refuser un avis Google soumis                  | Commercant auth | 10/60s     |
| GET     | `/api/missions/[cardId]`              | Missions disponibles pour une carte                    | Public          | —          |
| POST    | `/api/wheel/spin`                     | Tourner la roue de la fortune                          | Service role    | 3/60s      |
| GET     | `/api/wheel/[cardId]`                 | Config roue pour une carte (segments, cout)            | Public          | —          |
| POST    | `/api/pwa-visit/[cardId]`             | Enregistrer une visite PWA quotidienne                 | Service role    | —          |

### Push & Notifications

| Methode | Chemin                     | Description                                           | Auth            | Rate limit |
| ------- | -------------------------- | ----------------------------------------------------- | --------------- | ---------- |
| POST    | `/api/push/subscribe`      | Souscrire aux push web (VAPID)                        | Public          | 10/60s     |
| POST    | `/api/push/broadcast`      | Envoyer un push a tous les clients d'un commerce      | Commercant auth | 5/h        |
| GET     | `/api/cron/push-inactive`  | Cron : notifier les clients inactifs                   | Cron (Vercel)   | —          |

---

## Pages frontend

### Pages publiques (client)

| Chemin              | Fichiers                                        | Description                                                    |
| ------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| `/`                 | `app/page.tsx`                                  | Accueil : saisie code commerce, phone, email, OTP              |
| `/join/[businessId]`| `app/join/[businessId]/page.tsx`, `JoinForm.tsx` | Inscription client : prenom, phone, email, OTP, creation carte |
| `/card/[cardId]`    | `app/card/[cardId]/page.tsx`, `CardPageClient.tsx` | Vue carte client : tampons/points, QR code, historique, Apple Wallet |
| `/recover`          | `app/recover/page.tsx`, `RecoverForm.tsx`        | Retrouver ses cartes par telephone + OTP                       |

### Dashboard commercant

| Chemin                    | Fichiers                                                    | Description                                               |
| ------------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| `/dashboard/login`        | `app/dashboard/(auth)/login/page.tsx`                       | Connexion commercant (email + password)                    |
| `/dashboard/register`     | `app/dashboard/(auth)/register/page.tsx`                    | Inscription commercant                                     |
| `/dashboard`              | `app/dashboard/(protected)/page.tsx`, `DashboardClient.tsx` | Tableau de bord : KPIs, graphique semaine, top 3, scanner, saisie manuelle |
| `/dashboard/clients`      | `app/dashboard/(protected)/clients/page.tsx`, `ClientsClient.tsx` | Liste clients : stats, filtres status, recherche, tri, pagination |
| `/dashboard/clients/[id]` | `app/dashboard/(protected)/clients/[id]/page.tsx`, `ClientDetailClient.tsx` | Detail client : carte visuelle, stats, ajout/retrait, historique |
| `/dashboard/engagement`   | `app/dashboard/(protected)/engagement/page.tsx`             | Gamification : surprises, roue, missions, templates, stats |
| `/dashboard/notifications`| `app/dashboard/(protected)/notifications/page.tsx`          | Configuration des notifications push (broadcast)            |
| `/dashboard/settings`     | `app/dashboard/(protected)/settings/page.tsx`               | Parametres : infos commerce, type fidelite, paliers recompense |
| `/dashboard/profile`      | `app/dashboard/(protected)/profile/page.tsx`, `ProfileClient.tsx` | Profil : changer email, changer mot de passe, deconnexion |

---

## Composants

### Composants app (`app/components/`)

| Composant          | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `OTPInput.tsx`     | 6 inputs pour code OTP, autoComplete one-time-code, paste support    |
| `QrScanner.tsx`    | Modal scanner camera via html5-qrcode, appelle /api/scan             |
| `QrCodeDisplay.tsx`| Affiche un QR code SVG via qrcode.react                              |
| `ShortCodeDisplay.tsx` | Affiche le code court de la carte avec bouton copier             |
| `RegisterSW.tsx`   | Enregistre le service worker (`/sw.js`)                              |

### Composants dashboard (`components/dashboard/`)

| Composant          | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `BottomNav.tsx`    | Navigation mobile bottom : Scanner, Clients, Insights (disabled), Reglages, Profil |
| `MobileHeader.tsx` | Header mobile : logo Fidelizy + nom du commerce                      |

### Composants internes au dashboard (`app/dashboard/(protected)/`)

| Composant             | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `Sidebar.tsx`         | Sidebar desktop : nav, Insights (disabled), profil, deconnexion      |
| `DashboardClient.tsx` | Client du tableau de bord : 8 KPIs, graphique Recharts, top 3, scanner |
| `ClientsClient.tsx`   | Client liste clients : filtres status (all/active/at_risk/inactive/lost), search, sort, pagination |
| `ClientDetailClient.tsx` | Client detail : carte visuelle tampons, stats, ajout/retrait, reset, claim reward, historique |
| `ProfileClient.tsx`   | Client profil : changement email, mot de passe, deconnexion          |

---

## Bibliotheques internes (`lib/`)

| Fichier                    | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `supabase/client.ts`       | Client Supabase browser (createBrowserClient, anon key)         |
| `supabase/server.ts`       | Client Supabase serveur (createServerClient, cookies, anon key) |
| `supabase/service.ts`      | Client Supabase service role (bypass RLS, API routes)           |
| `types.ts`                 | Types TypeScript (Business, Customer, LoyaltyCard, etc.)        |
| `ratelimit.ts`             | Rate limiters Upstash (scan, join, recover, otp, card-write)    |
| `wallet/generatePass.ts`   | Generation de fichiers .pkpass (Apple Wallet)                   |
| `wallet/push.ts`           | Envoi de push notifications APNs pour mise a jour des passes    |

---

## Middleware

`middleware.ts` — Protege les routes `/dashboard/*` :
- Si non authentifie et pas sur login/register → redirect `/dashboard/login`
- Si authentifie et sur login/register → redirect `/dashboard`
- Rafraichit la session Supabase via cookies

---

## Fichiers publics (`public/`)

| Fichier          | Description                               |
| ---------------- | ----------------------------------------- |
| `manifest.json`  | Manifest PWA statique (Fidelizy)          |
| `icon.svg`       | Icone SVG vectorielle                     |
| `icon-192.png`   | Icone PNG 192x192 (PWA)                   |
| `icon-512.png`   | Icone PNG 512x512 (PWA, maskable)         |
| `sw.js`          | Service worker (PWA)                      |

---

## Configuration Next.js

- Security headers : X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS, Referrer-Policy, Permissions-Policy (camera self)
- Fonts : Geist Sans + Geist Mono (Google Fonts)
- Viewport : pas de zoom (maximumScale=1, userScalable=false)
- Langue : `<html lang="fr">`

---

## Features implementees

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
- [x] Tableau de bord avec 8 KPIs :
  - Clients total, visites aujourd'hui, nouveaux ce mois, tampons/points ce mois
  - Taux de retour, frequence moyenne, clients a risque, clients perdus
- [x] Graphique en barres des visites sur 7 jours (Recharts)
- [x] Top 3 clients par visites
- [x] Scanner QR code camera
- [x] Saisie manuelle (code court ou UUID)
- [x] Code commerce + lien d'inscription direct
- [x] Liste des derniers scans
- [x] Liste clients avec :
  - Stats (actifs, inactifs, perdus, taux de retour)
  - Filtres par statut (tous, actifs, a risque, inactifs, perdus)
  - Recherche par nom/telephone
  - Tri multi-colonnes
  - Pagination (20/page)
  - Table desktop + cards mobile
- [x] Detail client :
  - Carte visuelle de tampons
  - Stats (visites, derniere visite, date inscription)
  - Ajout/retrait tampons ou points (champs vidables)
  - Reset carte (tampons)
  - Echange recompense (points + paliers)
  - Historique transactions
- [x] Parametres :
  - Nom du commerce, couleur primaire
  - Configuration type fidelite (tampons/points)
  - Gestion des paliers de recompenses
- [x] Profil commercant :
  - Email actuel + changement d'email
  - Changement de mot de passe
  - Deconnexion
- [x] Dashboard responsive mobile :
  - Sidebar desktop / bottom nav mobile
  - Header mobile
  - Onglet Insights desactive avec badge "Bientot"
- [x] Rate limiting sur toutes les routes sensibles
- [x] Headers de securite (HSTS, X-Frame-Options, etc.)

### Apple Wallet
- [x] Generation de .pkpass (carte de fidelite Apple Wallet)
- [x] Protocole complet Apple Wallet Web Service :
  - Enregistrement/desenregistrement de devices
  - Mise a jour des passes
  - Push notifications APNs (HTTP/2)
  - Endpoint de logs

### Phase Gamification (Sprints 1-4)
- [x] Config gamification par commerce (jsonb sur businesses)
- [x] Surprise au scan : bonus aleatoire (probabilite, valeur configurable)
- [x] Goal gradient : notification quand le client est proche d'une recompense
- [x] Tampons de bienvenue (initial_stamps configurable, 0-3)
- [x] Roue de la fortune (mode points) :
  - Segments configurables (2-8), types : bonus_points, bonus_stamps, custom_reward
  - Cout en points configurable, selection ponderee aleatoire
  - Animation cote client, log des spins
- [x] Missions :
  - Avis Google (soumission + validation manuelle par le commercant)
  - Profil complet (email + anniversaire)
  - Visites mensuelles (comptage automatique via PWA)
  - Parrainage (code unique, bonus parrain + filleul)
- [x] Parrainage :
  - Code parrain genere automatiquement (PREF-1234)
  - Points configurable pour parrain et filleul
  - Referral table avec suivi
- [x] Notifications completes pour tous les events gamification :
  - Web push (VAPID) + wallet Apple (changeMessage + APNs)
  - Surprise, goal gradient, roue, mission completee, avis valide, parrainage (parrain + filleul), visite mensuelle
- [x] Templates commercant (Cafe, Restaurant, Boulangerie) :
  - Pre-remplissage automatique de toute la config engagement
  - Gamification + roue + missions en un clic
- [x] Stats engagement basiques :
  - Surprises declenchees (mois), tours de roue (mois), missions completees (mois), parrainages (total)
  - API GET /api/dashboard/engagement-stats
- [x] Notifications push web (VAPID) + broadcast commercant
- [x] Export CSV des clients
- [x] Cron job pour notifier les clients inactifs

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
- [ ] **Template email OTP** : a configurer dans Supabase (voir `docs/SUPABASE_EMAIL_TEMPLATE.md`)

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
