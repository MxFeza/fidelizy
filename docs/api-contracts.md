# Izou — Contrats API

> Genere le : 2026-03-23 | Scan exhaustif | 45 endpoints

## Vue d'ensemble

L'API est composee de 45 endpoints Next.js API Routes repartis en 12 domaines fonctionnels. Toutes les routes sont dans `app/api/`.

### Conventions

- **Format** : JSON (requete et reponse)
- **Auth commercant** : Session Supabase via cookies (middleware)
- **Auth client** : Aucune (routes publiques avec rate limiting)
- **Auth Wallet** : Header `ApplePass <token>` (HMAC-SHA256)
- **Auth Cron** : Header `Authorization: Bearer CRON_SECRET`
- **Rate limiting** : Upstash Redis sliding window
- **Codes erreur** : 400 (validation), 401 (auth), 404 (not found), 429 (rate limit), 500 (serveur)

---

## 1. Authentification client (OTP email)

### POST `/api/auth/send-otp`
Envoie un OTP par email au client identifie par telephone.

| Champ | Detail |
|-------|--------|
| Auth | Non |
| Rate limit | `otpLimiter` (3 req / 10 min) |
| Body | `{ phone: string }` (6-20 chars) |
| Reponse | `{ status: 'otp_sent' \| 'not_found' \| 'needs_email', email?, maskedEmail? }` |
| Tables | `customers` (SELECT), Supabase Auth (signInWithOtp) |

### POST `/api/auth/add-email`
Ajoute un email a un client existant puis envoie un OTP.

| Champ | Detail |
|-------|--------|
| Auth | Non |
| Rate limit | `otpLimiter` (3 req / 10 min) |
| Body | `{ phone: string, email: string }` |
| Reponse | `{ status: 'otp_sent' }` |
| Tables | `customers` (UPDATE), Supabase Auth (signInWithOtp) |

### POST `/api/auth/verify-otp`
Verifie le code OTP et retourne les cartes du client.

| Champ | Detail |
|-------|--------|
| Auth | Non |
| Rate limit | Aucun |
| Body | `{ email: string, token: string }` (token = 6 chars) |
| Reponse | `{ status: 'verified' \| 'invalid', cards?: [...] }` |
| Tables | `customers` (SELECT), `loyalty_cards` + `businesses` (SELECT JOIN) |

---

## 2. Business lookup

### GET `/api/business?short_code=XXX`
Recherche un commerce par code court.

| Champ | Detail |
|-------|--------|
| Auth | Non |
| Rate limit | Aucun |
| Query params | `short_code` (requis) |
| Reponse | `{ id: string }` |
| Tables | `businesses` (SELECT par UPPER(short_code)) |

---

## 3. Operations carte (commercant)

### POST `/api/card/add`
Ajoute des tampons ou points a une carte.

| Champ | Detail |
|-------|--------|
| Auth | Commercant (Supabase) |
| Rate limit | `cardWriteLimiter` (20 req / 60s) |
| Body | `{ card_id: string, type: 'stamps'\|'points', amount: int }` (1-1000) |
| Reponse | `{ success, message, new_value, surprise?: { triggered, message } }` |
| Tables | `businesses`, `loyalty_cards` (UPDATE), `transactions` (INSERT), `reward_tiers` (SELECT) |
| Services | `sendPushToCard()`, `notifyWalletDevices()`, `setPendingWalletAction()` |
| Logique | Surprise bonus (probabilite configurable), goal gradient notification |

### POST `/api/card/claim-reward`
Echange des points contre une recompense (palier).

| Champ | Detail |
|-------|--------|
| Auth | Commercant |
| Rate limit | `cardWriteLimiter` |
| Body | `{ card_id: string, reward_tier_id: string }` |
| Reponse | `{ success, message, new_points }` |
| Tables | `loyalty_cards` (UPDATE), `reward_tiers` (SELECT), `reward_claims` (INSERT), `transactions` (INSERT) |

### POST `/api/card/deduct`
Retire des tampons ou points (correction).

| Champ | Detail |
|-------|--------|
| Auth | Commercant |
| Rate limit | `cardWriteLimiter` |
| Body | `{ card_id: string, type: 'stamps'\|'points', amount: int }` |
| Reponse | `{ success, new_value }` |
| Tables | `loyalty_cards` (UPDATE), `transactions` (INSERT) |

### POST `/api/card/reset`
Remet les tampons a zero (apres recompense).

| Champ | Detail |
|-------|--------|
| Auth | Commercant |
| Rate limit | `cardWriteLimiter` |
| Body | `{ card_id: string }` |
| Reponse | `{ success }` |
| Tables | `loyalty_cards` (UPDATE), `transactions` (INSERT) |

### POST `/api/card/update-profile`
Met a jour le profil client (email, anniversaire) et auto-complete la mission profil.

| Champ | Detail |
|-------|--------|
| Auth | Non |
| Rate limit | `profileUpdateLimiter` (5 req / 1h) |
| Body | `{ cardId: string, email?: string, birthday?: string }` |
| Reponse | `{ ok, mission_completed?, points_awarded? }` |
| Tables | `loyalty_cards` + `customers` (UPDATE), `missions`, `mission_completions`, `transactions` |

### GET `/api/card/[cardId]/live`
Polling leger pour les donnees temps reel de la carte.

| Champ | Detail |
|-------|--------|
| Auth | Non |
| Rate limit | Aucun |
| Params | `cardId` (qr_code_id dans l'URL) |
| Reponse | `{ stamps, points, rewards: [...], wheel?: { enabled, cost, eligible } }` |
| Tables | `loyalty_cards`, `businesses`, `reward_tiers` (SELECT) |
| Cache | `Cache-Control: no-store` |

---

## 4. Inscription / Recuperation

### POST `/api/join`
Inscription d'un nouveau client avec creation de carte.

| Champ | Detail |
|-------|--------|
| Auth | Non |
| Rate limit | `joinLimiter` (5 req / 60s) |
| Body | `{ businessId, firstName, phone, email, referral_code? }` |
| Reponse | `{ qrCodeId, cardId }` |
| Tables | `businesses`, `customers` (UPSERT), `loyalty_cards` (INSERT), `transactions`, `missions`, `mission_completions`, `referrals` |
| Services | `sendPushToCard()`, `notifyWalletDevices()` |
| Logique | Initial stamps bonus, referral (points aux 2 parties) |

### GET `/api/recover?phone=XXX`
Retrouve les cartes d'un client par telephone.

| Champ | Detail |
|-------|--------|
| Auth | Non |
| Rate limit | `recoverLimiter` (5 req / 60s) |
| Query params | `phone` (6+ chars) |
| Reponse | `{ cards: [...] }` |
| Tables | `customers`, `loyalty_cards` + `businesses` (SELECT JOIN) |

---

## 5. Scanner commercant

### POST `/api/scan`
Scan QR code par le commercant — ajoute automatiquement 1 tampon ou N points.

| Champ | Detail |
|-------|--------|
| Auth | Commercant |
| Rate limit | `scanLimiter` (10 req / 60s) |
| Body | `{ qr_code_id: string }` (UUID ou code court 8 chars) |
| Reponse | `{ success, customer, card, message, surprise? }` |
| Tables | `businesses`, `loyalty_cards` (UPDATE), `transactions` (INSERT), `reward_tiers` |
| Services | `sendPushToCard()`, `notifyWalletDevices()`, `setPendingWalletAction()` |
| Logique | +1 stamp ou +points_per_euro, surprise bonus, goal gradient, reset auto |

---

## 6. Dashboard KPIs

### GET `/api/dashboard/kpis`
| Auth | Commercant | Tables | `businesses`, `transactions`, `loyalty_cards`, `reward_tiers` |
| Reponse | `{ visitsToday, newClientsMonth, distributedMonth, loyaltyType, tauxRetour, frequenceMoyenne, clientsARisque, clientsPerdus }` |

### GET `/api/dashboard/visits-week`
| Auth | Commercant | Tables | `transactions` | Reponse | `{ days: [{ label, count }] }` |

### GET `/api/dashboard/top-clients`
| Auth | Commercant | Tables | `loyalty_cards` + `customers` | Reponse | `{ topClients: [...] }` (top 3) |

### GET `/api/dashboard/export-clients`
| Auth | Commercant | Tables | `businesses`, `loyalty_cards` + `customers` | Reponse | `{ business, clients: [...] }` |

---

## 7. Dashboard gamification

### GET/PUT `/api/dashboard/gamification`
Config gamification du commerce (surprise, roue, goal gradient, initial stamps).

| Champ | Detail |
|-------|--------|
| Auth | Commercant |
| Rate limit | `gamificationLimiter` (10 req / 60s) |
| Body PUT | Champs gamification (clampes : surprise_probability 0.1-0.3, wheel_cost_points 1-1000) |
| Tables | `businesses` (gamification jsonb) |

### GET/PUT `/api/dashboard/missions`
Config des missions (google_review, referral, complete_profile, monthly_visits).

| Auth | Commercant | Rate limit | `gamificationLimiter` | Tables | `missions` (UPSERT) |

### GET `/api/dashboard/missions/pending`
Missions en attente de validation (avis Google).

| Auth | Commercant | Tables | `mission_completions`, `missions`, `loyalty_cards`, `customers` |

### GET `/api/dashboard/engagement-stats`
Stats engagement gamification du mois.

| Auth | Commercant | Rate limit | `gamificationLimiter` |
| Reponse | `{ surprises_month, wheel_spins_month, missions_completed_month, referrals_total }` |

### GET/POST/PUT/DELETE `/api/dashboard/wheel-prizes`
CRUD segments roue de la fortune (max 8, min 2).

| Auth | Commercant | Rate limit | `wheelPrizesLimiter` (10 req / 60s) |
| Tables | `wheel_prizes` |

---

## 8. Missions client

### GET `/api/missions/[cardId]`
Missions disponibles pour une carte avec statut de completion.

| Auth | Non | Rate limit | `missionsLimiter` |
| Tables | `loyalty_cards`, `customers`, `missions`, `mission_completions`, `referrals`, `pwa_visits` |
| Reponse | `{ missions: [...], referral_code }` |

### POST `/api/missions/complete`
Completer une mission (profil, avis Google).

| Auth | Non | Rate limit | `missionCompleteLimiter` (5 req / 1h) |
| Body | `{ cardId, templateKey, proofUrl? }` |
| Logique | google_review → pending_review, complete_profile → instant, monthly_visits → auto |

### POST `/api/missions/validate`
Valider/rejeter une mission en attente (commercant).

| Auth | Commercant | Rate limit | `missionValidateLimiter` |
| Body | `{ completionId, approved: boolean }` |

---

## 9. Roue de la fortune

### GET `/api/wheel/[cardId]`
Config et eligibilite roue pour un client.

| Auth | Non | Rate limit | `wheelLimiter` |
| Reponse | `{ segments, eligible, cost, current_points }` |

### POST `/api/wheel/spin`
Tourner la roue (selection aleatoire ponderee).

| Auth | Non | Rate limit | `wheelSpinLimiter` (3 req / 60s) |
| Body | `{ cardId, businessId }` |
| Logique | Deduire cout, selection ponderee, appliquer recompense |
| Reponse | `{ success, prize, winner_index, new_points }` |

---

## 10. Push notifications

### POST `/api/push/subscribe`
Abonner un appareil aux push web.

| Auth | Non | Rate limit | `pushLimiter` | Body | `{ cardId, subscription }` |

### DELETE `/api/push/subscribe`
Desabonner un appareil.

| Auth | Non | Rate limit | `pushLimiter` | Body | `{ cardId, endpoint }` |

### GET `/api/push/broadcast`
Nombre d'abonnes push du commerce.

| Auth | Commercant |

### POST `/api/push/broadcast`
Envoyer un push a tous les clients.

| Auth | Commercant | Rate limit | `broadcastLimiter` (5 req / 1h) |
| Body | `{ title: string (max 50), body: string (max 100) }` |
| Reponse | `{ sent, errors }` |

### GET `/api/cron/push-inactive`
Cron job Vercel — relance clients inactifs >30 jours.

| Auth | Bearer CRON_SECRET | Schedule | `0 10 * * *` (10h UTC quotidien) |

---

## 11. PWA

### GET `/api/manifest/[cardId]`
Manifest PWA dynamique par carte (nom et couleur du commerce).

| Auth | Non | Cache | `max-age=3600` |

### POST `/api/pwa-visit/[cardId]`
Enregistre une visite PWA quotidienne. Auto-complete la mission monthly_visits.

| Auth | Non | Tables | `loyalty_cards`, `pwa_visits` (UPSERT), `missions`, `mission_completions` |

---

## 12. Apple Wallet

### GET `/api/wallet/[cardId]`
Genere et telecharge le fichier .pkpass.

### GET `/api/wallet/v1/devices/[deviceLibraryId]/registrations/[passTypeId]`
Liste les passes mis a jour (protocole Apple).

### POST `/api/wallet/v1/devices/[deviceLibraryId]/registrations/[passTypeId]/[serialNumber]`
Enregistre un appareil pour les mises a jour de pass.

| Auth | `ApplePass <token>` (HMAC-SHA256) | Body | `{ pushToken }` |

### DELETE `/api/wallet/v1/devices/[deviceLibraryId]/registrations/[passTypeId]/[serialNumber]`
Desenregistre un appareil.

| Auth | `ApplePass <token>` |

### GET `/api/wallet/v1/passes/[passTypeId]/[serialNumber]`
Telecharge la version a jour du pass (apres push notification).

| Auth | `ApplePass <token>` | Reponse | Binary .pkpass |

### POST `/api/wallet/v1/log`
Recoit les logs d'erreur Apple Wallet (debug).

| Auth | Aucune |

---

## Tableau recapitulatif des rate limiters

| Nom | Limite | Fenetre | Routes concernees |
|-----|--------|---------|-------------------|
| `scanLimiter` | 10 | 60s | /api/scan |
| `joinLimiter` | 5 | 60s | /api/join |
| `recoverLimiter` | 5 | 60s | /api/recover |
| `otpLimiter` | 3 | 10 min | /api/auth/send-otp, add-email |
| `cardWriteLimiter` | 20 | 60s | /api/card/add, deduct, reset, claim-reward |
| `profileUpdateLimiter` | 5 | 1h | /api/card/update-profile |
| `pushLimiter` | 10 | 60s | /api/push/subscribe |
| `broadcastLimiter` | 5 | 1h | /api/push/broadcast |
| `gamificationLimiter` | 10 | 60s | /api/dashboard/gamification, missions, engagement-stats |
| `wheelLimiter` | 10 | 60s | /api/wheel/[cardId] |
| `wheelSpinLimiter` | 3 | 60s | /api/wheel/spin |
| `wheelPrizesLimiter` | 10 | 60s | /api/dashboard/wheel-prizes |
| `missionsLimiter` | 10 | 60s | /api/missions/[cardId] |
| `missionCompleteLimiter` | 5 | 1h | /api/missions/complete |
| `missionValidateLimiter` | 10 | 60s | /api/missions/validate |
