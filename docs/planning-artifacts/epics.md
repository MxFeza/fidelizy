---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - docs/planning-artifacts/prd.md
  - docs/planning-artifacts/ux-design-specification.md
  - docs/planning-artifacts/architecture-decisions.md
  - docs/planning-artifacts/product-brief-izou-2026-03-23.md
  - docs/planning-artifacts/ecrans-composants.md
  - docs/planning-artifacts/recettage-brief.md
  - docs/planning-artifacts/audit-v2.md
  - docs/sessions/rapport-nuit-2026-04-12.md
  - docs/PROJET_STATE.md
  - docs/api-contracts.md
  - docs/data-models.md
date: 2026-04-12
scope: v1 pilote uniquement
figma_file: PVqIzNHJH5AH3aujECItxR
---

# Izou — Epic Breakdown

## Vue d'ensemble

Ce document decompose les 52 FRs du PRD Izou en **9 epics et 36 user stories** pour le pilote v1.

Le MVP est **deja en production** (fidelizy.vercel.app). Chaque story est taguee :
- **REFACTOR** = le code existe, aligner sur le Figma V4
- **CREER** = feature/ecran manquant
- **SUPPRIMER** = code/tables a elaguer (decisions post-PRD)

### Decisions post-PRD integrees

| Decision | Date | Impact |
|----------|------|--------|
| Elagage gamification hard delete | 2026-03-28 (arch) | Supprimer roue, missions, surprises, goal gradient. -15 endpoints, -5 tables |
| Notification service unifie | 2026-03-28 (arch) | `notification.service.ts` prerequis Google Wallet |
| Google Wallet v1 | 2026-03-28 (arch) | Couverture Android +25% du marche |
| Nav v4 redesignee par user | 2026-04-02 | 4 entrees (Tableau de bord, Clients, Marketing, Mon espace) |
| Scanner client = placeholder | 2026-04-12 (PM) | Icone dans BottomTabBar mais pas d'ecran |
| Onboarding = 5 ecrans | 2026-04-12 (PM) | A3 supprime (inspiration deplacee page v2+) |
| Paliers narratifs | 2026-04-12 (PM) | Nouveau / Fidele / VIP / Legende |
| Pivot terrain immediat | 2026-04-12 (BMAD) | Demarcher maintenant, dev apres validation |
| Tests Playwright + Vitest | 2026-03-28 (arch) | E2E avant refactoring, filet de securite |
| Zod validation progressive | 2026-03-28 (arch) | Routes modifiees uniquement |
| C5 Cadeau surprise ajoute | 2026-04-12 (PM) | Ecran celebration pour feature surprise |
| P1.4 Securite + P1.5 Ma carte | 2026-04-12 (PM) | Sub-screens profil client completes |

### Contexte strategique

Le pivot terrain (decision BMAD 2026-04-12) dit : **"Gel features. Zero nouveau code jusqu'a 5 commercants actifs avec clients recurrents."** Le code actuel + Figma suffisent pour la demo terrain. Les epics ci-dessous constituent le plan d'implementation a executer **apres validation de l'adoption terrain** ou en parallele si le user decide de lancer le dev.

---

## Inventaire des Requirements

### Functional Requirements (52 FRs — source : PRD)

**Gestion du Commerce (FR1-FR8)**
- FR1 : Creer un compte commercant (email + mot de passe) [EXISTE]
- FR2 : Configurer via template metier pre-rempli [EXISTE backend — CREER ecran J3]
- FR3 : Personnaliser l'apparence (couleurs, nom) [EXISTE — REFACTOR]
- FR4 : Choisir entre mode tampons et mode points [EXISTE]
- FR5 : Configurer parametres programme [EXISTE — REFACTOR UI]
- FR6 : Generer et imprimer QR code comptoir [EXISTE — REFACTOR UI]
- FR7 : Obtenir un lien d'inscription clients [EXISTE]
- FR8 : Modifier ses informations de profil [EXISTE — REFACTOR]

**Programme Fidelite — Tampons (FR9-FR12)**
- FR9 : Accumuler tampons via scan QR [EXISTE]
- FR10 : Voir progression visuelle [EXISTE — REFACTOR UI]
- FR11 : Tampons de bienvenue a l'inscription [EXISTE]
- FR12 : Reinitialisation auto quand recompense atteinte [EXISTE]

**Programme Fidelite — Points (FR13-FR16)**
- FR13 : Accumuler points fixes par visite [EXISTE]
- FR14 : Definir paliers recompenses [EXISTE — REFACTOR UI]
- FR15 : Echanger points contre recompense [EXISTE]
- FR16 : Voir points actuels et paliers [EXISTE — REFACTOR UI]

**QR Intelligent (FR17-FR22)**
- FR17 : Scanner QR comptoir [EXISTE — REFACTOR UI]
- FR18 : Detection auto nouveau/existant [EXISTE]
- FR19 : Inscription < 30s [EXISTE — REFACTOR UI]
- FR20 : Tampon/points auto au scan [EXISTE]
- FR21 : Reconnexion carte existante [EXISTE]
- FR22 : Verification OTP email [EXISTE — REFACTOR UI]

**Wallet & Notifications (FR23-FR29)**
- FR23 : Apple Wallet [EXISTE — REFACTOR]
- FR24 : Google Wallet [CREER]
- FR25 : MAJ wallet temps reel [EXISTE Apple — CREER Google]
- FR26 : Push wallet evenements cles [EXISTE Apple — CREER Google]
- FR27 : Push PWA [EXISTE]
- FR28 : Broadcast commercant [EXISTE — REFACTOR UI]
- FR29 : Notification auto clients inactifs [EXISTE]

**Parrainage (FR30-FR33)**
- FR30 : Lien parrainage unique [EXISTE — REFACTOR UI]
- FR31 : Inscription via parrainage [EXISTE]
- FR32 : Attribution auto bonus [EXISTE]
- FR33 : Configuration bonus par commercant [EXISTE — REFACTOR UI]

**Dashboard & Donnees (FR34-FR41)**
- FR34 : KPIs temps reel [EXISTE — REFACTOR UI]
- FR35 : Historique visites 7j [EXISTE — REFACTOR UI]
- FR36 : Top clients [EXISTE — REFACTOR UI]
- FR37 : Recherche client [EXISTE]
- FR38 : Detail client [EXISTE — REFACTOR UI]
- FR39 : Filtres statut [EXISTE]
- FR40 : Export CSV [EXISTE]
- FR41 : Notification a chaque scan [EXISTE]

**Anti-fraude (FR42-FR45)** — toutes EXISTENT, transversal
**RGPD (FR46-FR48)** — FR46 + FR48 a CREER, FR47 a CREER
**Administration (FR49-FR52)** — toutes EXISTENT

### Non-Functional Requirements (source : PRD)

- NFR1-5 : Performance (LCP < 2s, API < 500ms, wallet < 3s, dashboard < 2s, 60fps)
- NFR6 : Securite (HTTPS, RLS, rate limiting, secrets serveur)
- NFR7 : Disponibilite > 99.5%
- NFR8 : Zero bug P0 parcours critiques
- NFR9 : Tests 100% des 5 parcours critiques (decision arch: Playwright + Vitest)
- NFR10 : ~25-30 endpoints (vs 45 actuels — elagage gamification)

### Decisions Architecture Post-PRD

- ARCH1 : Elagage gamification hard delete — tables `wheel_prizes`, `wheel_spins`, `missions`, `mission_completions`, `pwa_visits` + champs JSONB gamification + ~15 endpoints
- ARCH2 : Service notification unifie `lib/services/notification.service.ts`
- ARCH3 : Google Wallet via JWT (cle de service Google)
- ARCH4 : Extraction services progressive `lib/services/`
- ARCH5 : Tests Playwright (3 parcours E2E) + Vitest (services)
- ARCH6 : Validation Zod progressive sur routes modifiees
- ARCH7 : RGPD suppression cascade `/api/customer/delete`

### UX Design Requirements (Figma V4 + decisions PM)

- UX-DR1 a UX-DR7 : Composants custom (StampCard, PointsProgressBar, BottomTabBar, etc.)
- UX-DR8-10 : States, modals, toasts dev-ready (67 artefacts)
- UX-DR11 : Sub-screens P1.1-P1.5
- UX-DR12 : Hierarchie CTA (violet/noir/outline/rouge)
- UX-DR13 : Section "Prochaines recompenses" B1
- UX-DR14 : Bell icon + red dot
- UX-DR15-17 : Illustrations (Lottie/SVG/empty states)
- UX-DR18 : Jamais de degrades
- UX-DR19 : C5 Cadeau surprise (decision PM 2026-04-12)
- UX-DR20 : Profil P1 complet + 5 sub-screens
- UX-DR21 : Scanner = placeholder (icone sans ecran, decision PM 2026-04-12)
- UX-DR22 : Paliers narratifs Nouveau/Fidele/VIP/Legende (decision PM 2026-04-12)

---

## FR Coverage Map

| FR | Epic | Statut |
|----|------|--------|
| FR1 | Epic 7 | EXISTE |
| FR2 | Epic 7 | CREER ecran J3 |
| FR3 | Epic 8 | REFACTOR |
| FR4 | Epic 5 | EXISTE |
| FR5 | Epic 5 | REFACTOR UI |
| FR6 | Epic 2 | REFACTOR UI |
| FR7 | Epic 2 | EXISTE |
| FR8 | Epic 8 | REFACTOR |
| FR9-12 | Epic 4 | EXISTE |
| FR13, FR15 | Epic 4 | EXISTE |
| FR14, FR16 | Epic 4+5 | REFACTOR UI |
| FR17-22 | Epic 4 | EXISTE/REFACTOR UI |
| FR23 | Epic 6 | REFACTOR |
| FR24-26 | Epic 6 | CREER (Google) |
| FR27-29 | Epic 5 | EXISTE/REFACTOR |
| FR30-32 | Epic 4 | EXISTE/REFACTOR UI |
| FR33 | Epic 5 | REFACTOR UI |
| FR34-36 | Epic 2 | REFACTOR UI |
| FR37-40 | Epic 3 | EXISTE |
| FR41 | Epic 2 | EXISTE |
| FR42-45 | — | EXISTE (transversal) |
| FR46 | Epic 8 | CREER |
| FR47 | Epic 4 | CREER |
| FR48 | Epic 8 | CREER |
| FR49-52 | Epic 3 | EXISTE |

**52/52 FRs couvertes.**

---

## Epic List

| # | Epic | Taille | Priorite | FRs |
|---|------|--------|----------|-----|
| 0 | Fondations Techniques | M | 0 | ARCH1-7, NFR9-10 |
| 1 | Navigation & Design System | S | 1 | Transversal |
| 2 | Dashboard Commercant | M | 3 | FR6-7, FR34-36, FR41 |
| 3 | Gestion Clients | M | 4 | FR37-40, FR49-52 |
| 4 | Refactor UI Client | XL | 5 | FR9-22, FR30-32, FR47 |
| 5 | Marketing & Engagement | M | 6 | FR4-5, FR14, FR27-29, FR33 |
| 6 | Apple Wallet + Google Wallet | L | 7 | FR23-26 |
| 7 | Auth & Onboarding Commercant | S | 2 | FR1-2 |
| 8 | Mon Espace & RGPD | M | 8 | FR3, FR8, FR46, FR48 |

**Ordre d'execution :** 0 → 1 → 7 → 2 → 3 → 4 → 5 → 6 → 8

---

## Epic 0 : Fondations Techniques (Strangler Fig)

Poser les fondations propres AVANT tout travail frontend : filet de tests, elagage du code mort, extraction de la logique metier en services testables, error handling standardise. Pattern Strangler Fig : envelopper l'ancien code, tester, puis supprimer.

**Taille :** L | **Priorite :** 0 (PREMIER) | **ARCH1-7, NFR9-10**

### Story 0.1 : Tests E2E Playwright — 3 parcours critiques

En tant que developpeur,
je veux un filet de securite E2E avant tout refactoring,
afin de detecter les regressions immediates.

**CREER** | **M** | **NFR9, ARCH5**

**Given** Playwright est configure dans le projet
**When** les tests sont executes
**Then** Parcours 1 : inscription client + scan QR + tampon passe
**And** Parcours 2 : dashboard commercant (login, KPIs, liste clients) passe
**And** Parcours 3 : parrainage (lien, inscription filleul, bonus) passe
**And** les tests tournent en Chromium + WebKit (Safari)

### Story 0.2 : Elagage gamification hard delete

En tant que developpeur,
je veux supprimer le code et les tables de gamification inutilisees,
afin de reduire la surface de code de ~30%.

**SUPPRIMER** | **L** | **ARCH1, NFR10**

**Given** les tests E2E (Story 0.1) passent avant la suppression
**When** l'elagage est execute
**Then** les tables sont supprimees : `wheel_prizes`, `wheel_spins`, `missions`, `mission_completions`, `pwa_visits`
**And** les champs JSONB de `businesses.gamification` sont nettoyes (conserver uniquement `initial_stamps`)
**And** ~15 endpoints sont supprimes
**And** le code frontend de la roue, missions, surprises est supprime
**And** les types TypeScript correspondants sont supprimes
**And** les tests E2E passent toujours apres la suppression
**And** le nombre d'endpoints passe de ~45 a ~30

### Story 0.3 : Extraction services metier (Strangler Fig core)

En tant que developpeur,
je veux une couche service qui isole la logique metier des routes API,
afin que chaque route devienne un wrapper fin de 20-30 lignes.

**CREER** | **L** | **ARCH2, ARCH4**

**Given** les routes actuelles contiennent 200-300 lignes de logique inline
**When** les services sont extraits
**Then** `lib/services/loyalty.service.ts` gere toute la logique tampons/points (scan, add, deduct, reset, claim) — elimine les ~220 lignes dupliquees entre scan et card/add
**And** `lib/services/customer.service.ts` gere inscription, recuperation, RGPD
**And** `lib/services/notification.service.ts` expose `notifyClient(cardId, event, payload)` et dispatche sur tous les canaux actifs (push web, Apple Wallet, futur Google Wallet)
**And** `lib/services/referral.service.ts` gere parrainage (code, attribution, bonus)
**And** `lib/services/auth.service.ts` gere OTP client + session commercant
**And** les routes API existantes appellent les services au lieu du code inline
**And** chaque service a ses schemas de validation Zod (`*.schemas.ts`)
**And** les tests unitaires Vitest couvrent chaque service

### Story 0.4 : Error handling standardise + logging

En tant que developpeur,
je veux un error handling coherent sur toutes les routes,
afin qu'aucune erreur brute Supabase ne soit exposee au client.

**CREER** | **S** | **ARCH4**

**Given** <10% des routes ont un error handling propre actuellement
**When** le middleware d'erreur est en place
**Then** une classe `AppError` est creee avec codes (VALIDATION, AUTH, NOT_FOUND, RATE_LIMIT, INTERNAL)
**And** chaque route utilise un wrapper `withErrorHandler()` qui catch les erreurs et retourne des reponses JSON propres
**And** les erreurs sont loguees avec contexte (route, params, timestamp)
**And** aucune erreur Supabase brute n'est exposee au client

---

## Epic 1 : Navigation & Design System

Foundation visuelle pour tous les autres epics.

**Taille :** S | **Priorite :** 1

### Story 1.1 : Sidebar desktop v4 (4 entrees)

En tant que commercant,
je veux une sidebar simplifiee avec 4 sections,
afin de naviguer rapidement.

**REFACTOR** | **S** | **Figma :** E1 `10408:100385`

**Given** le commercant est sur desktop
**When** il voit la sidebar
**Then** 4 entrees : Tableau de bord, Clients, Marketing, Mon espace
**And** Marketing s'expanse avec sous-items : Programme fidelite, Parrainage, Push, SMS (Bientot), Automatisations (Bientot)
**And** l'entree active est Brand 600 `#7F56D9`

### Story 1.2 : Bottom Nav mobile commercant (4 items)

**REFACTOR** | **S** | **Figma :** E2 `10421:4570`

**Given** le commercant est sur mobile
**Then** 4 onglets : Tableau de bord, Clients, Marketing, Mon espace
**And** actif = Brand 600

### Story 1.3 : Bell notifications + design tokens globaux

**REFACTOR+CREER** | **S**

**Given** l'application est ouverte
**Then** icone bell en haut a droite + dot rouge unread (commercant + client)
**And** hierarchie CTA : violet principal, noir secondaire, outline tertiaire, rouge destructif
**And** aucun degrade — blocs plats uniquement
**And** Brand 600 `#7F56D9` partout

---

## Epic 2 : Dashboard Commercant

**Taille :** M | **Priorite :** 3 | **FRs :** FR6-7, FR34-36, FR41

### Story 2.1 : Vue d'ensemble desktop (E1)

**REFACTOR** | **M** | **FRs :** FR34-36, FR41

**Given** le commercant est sur le Tableau de bord
**Then** hero banner "Bonjour, [Prenom]", 4 KPICards (FR34), graphique 7j (FR35), top clients (FR36), QR commerce (FR6), activites recentes (FR41)

### Story 2.2 : Vue d'ensemble mobile (E2)

**REFACTOR** | **S**

**Given** le commercant est sur mobile
**Then** KPICards 2x2, graphique scrollable, activites en cards

### Story 2.3 : Page Statistiques placeholder

**CREER** | **S**

**Given** le commercant clique Statistiques
**Then** empty state "Bientot disponible" + badge "A venir"

---

## Epic 3 : Gestion Clients

**Taille :** M | **Priorite :** 4 | **FRs :** FR37-40, FR49-52

### Story 3.1 : Liste clients desktop (F1)

**REFACTOR** | **M** | **FRs :** FR37, FR39, FR40

**Given** le commercant accede a Clients
**Then** table avec Avatar+Nom, Tampons/Points, Derniere visite, Statut (badge), filtres (FR39), recherche (FR37), export CSV (FR40)

### Story 3.2 : Fiche client detail (F2)

**REFACTOR** | **M** | **FRs :** FR38, FR49-52

**Given** le commercant clique sur un client
**Then** carte fidelite visuelle lecture seule (FR38), stats, actions ajout/retrait (FR49-50), reset (FR51), echange recompense (FR52), historique

### Story 3.3 : Liste clients mobile (F3)

**REFACTOR** | **S**

**Given** le commercant est sur mobile
**Then** ClientCards empilees, recherche, filtres

---

## Epic 4 : Refactor UI Client

Le client final utilise une app premium alignee sur les ~80 artefacts Figma dev-ready.

**Taille :** XL | **Priorite :** 5 | **FRs :** FR9-22, FR30-32, FR47

### Story 4.1 : Composants custom React (prerequis)

En tant que developpeur,
je veux des composants React reutilisables crees en premier,
afin que tous les ecrans client les utilisent de facon coherente.

**CREER** | **M** | **UX-DR1-7**

**Given** les composants sont identifies dans le Figma
**When** ils sont implementes
**Then** StampCard (5x2, 0-10/10), PointsProgressBar (paliers), BottomTabBar Client (5 variants, Brand 50 actif), EphemeralCode (Space Grotesk + timer), KPICard, ClientCard mobile

### Story 4.2 : Onboarding client (A1→A2→A4→A5→A6) — 5 ecrans

En tant que nouveau client,
je veux un parcours d'inscription < 30 secondes,
afin de rejoindre le programme sans friction.

**REFACTOR** | **M** | **FRs :** FR17-22, FR47 | **Figma :** A `10899:621`

**Given** un client scanne le QR comptoir
**Then** A1 : ecran camera + logo IZOU dark mode
**And** A2 : prenom (auto-focus) — A3 est SUPPRIME (decision PM, inspiration deplacee page v2+)
**And** A4 : telephone +33
**And** A5 : 6 inputs OTP (6 etats : Empty, Typing, Wrong, Expired, Resent, Success)
**And** A6 : choix wallet (Apple/Google/Plus tard)
**And** consentement explicite recueilli (FR47)
**And** erreurs inline + 4 toasts fonctionnels

### Story 4.3 : Carte fidelite client (B1-B4) + BottomTabBar

En tant que client fidele,
je veux voir ma carte avec un design premium,
afin de suivre ma progression.

**REFACTOR** | **L** | **FRs :** FR9-16 | **Figma :** B `10895:586`

**Given** le client accede a sa carte
**Then** B1 : greeting, StampCard 5x2, "Plus que X !", "Prochaines recompenses" 3 rows (UX-DR13)
**And** BottomTabBar Client 5 onglets dont Scanner = **placeholder** (icone sans ecran, decision PM)
**And** Bell icon + red dot en haut a droite
**And** B2 (10/10) : CTA "Recuperer ma recompense"
**And** B3 (Points) : PointsProgressBar avec paliers narratifs Nouveau/Fidele/VIP/Legende
**And** B4 : historique transactions avec pagination
**And** etats Loading, Empty, Error implementes

### Story 4.4 : Ecrans de recompense (C1-C5)

**REFACTOR+CREER** | **M** | **FRs :** FR12, FR15 | **Figma :** C `10903:586`

**Given** un client debloque une recompense
**Then** C1 : celebration plein ecran (tampons)
**And** C2 : code ephemere + timer pulsant (points)
**And** C3 : cadeau du commercant
**And** C4 : bottom sheet validation commercant
**And** C5 : cadeau surprise gamification (NOUVEAU — decision PM, trigger `gamification.surprise.enabled`)
**And** emplacements Lottie prepares (dev hint sticky)

### Story 4.5 : Parrainage client (D1-D2)

**REFACTOR** | **S** | **FRs :** FR30-32 | **Figma :** D `10905:586`

**Given** le client accede a Parrainage
**Then** code dans champ lecture seule + copie (FR30), bouton Partager → share sheet natif, stats filleuls/bonus, etat Empty avec illustration SVG

### Story 4.6 : Recuperation carte (K1-K2)

**REFACTOR** | **S** | **FRs :** FR21-22 | **Figma :** K `10906:586`

**Given** le client accede a /recover
**Then** K1 : formulaire avec gestion erreurs (format, not found, loading)
**And** K2 : cartes retrouvees + option wallet
**And** K = flow modal pre-auth, PAS dans la navigation client (decision PM)

### Story 4.7 : Profil client (P1 + 5 sub-screens)

**CREER** | **L** | **FRs :** FR46 (client), FR48 (client) | **Figma :** P1 `10882:586`

**Given** le client accede a l'onglet Profil
**Then** header + avatar editable, formulaire (prenom, email, tel)
**And** P1.1 Notifications : toggle general + 4 granulaires
**And** P1.2 Confidentialite : hub RGPD (export, consentements, CGU, supprimer)
**And** P1.3 Aide : FAQ + contact + feedback
**And** P1.4 Securite : changer email, mot de passe (decision PM)
**And** P1.5 Ma carte : color picker 5 couleurs + preview (decision PM)
**And** 6 modals + 3 etats + 4 toasts

---

## Epic 5 : Marketing & Engagement

Le commercant configure son marketing. **Post-elagage :** la gamification lourde (roue, missions) est supprimee. Restent : push broadcast, programme fidelite, parrainage, templates metier.

**Taille :** M (reduit post-elagage) | **Priorite :** 6 | **FRs :** FR4-5, FR14, FR27-29, FR33

### Story 5.1 : Section Marketing dans la navigation

**REFACTOR** | **S**

**Given** le commercant clique Marketing
**Then** sous-items : Programme fidelite, Parrainage, Push, SMS (Bientot), Automatisations (Bientot)
**And** routes existantes redirigees

### Story 5.2 : Push Notifications (H1)

**REFACTOR** | **M** | **FRs :** FR27-28

**Given** le commercant accede a Push
**Then** formulaire (titre 50, message 100) + apercu temps reel + badge abonnes + modale confirmation + limite 5/h

### Story 5.3 : Programme fidelite (G1)

**REFACTOR** | **M** | **FRs :** FR4-5, FR14

**Given** le commercant accede a Programme fidelite
**Then** radio tampons/points (FR4), parametres adaptes (FR5), paliers (FR14), templates metier, apercu live carte

### Story 5.4 : Parrainage (H1c)

**REFACTOR** | **S** | **FRs :** FR33

**Given** le commercant accede a Parrainage
**Then** bonus parrain/filleul editables (FR33), toggle, stats

### Story 5.5 : Placeholders SMS + Automatisations

**CREER** | **S**

**Then** empty state "Bientot disponible" + badge dans la nav

---

## Epic 6 : Apple Wallet + Google Wallet

**Taille :** L | **Priorite :** 7 | **FRs :** FR23-26
**Depend de :** Epic 0 (notification.service.ts)

### Story 6.1 : Optimiser Apple Wallet

**REFACTOR** | **M** | **FRs :** FR23, FR25-26

**Given** un client ajoute sa carte Apple Wallet
**Then** design aux couleurs du commerce, tampons/points + QR visibles, push sur scan/recompense/parrainage, mise a jour pass fonctionnelle

### Story 6.2 : Implementer Google Wallet

**CREER** | **XL** | **FRs :** FR24-26

**Given** le backend Google Wallet est configure
**Then** JWT signe genere, carte visible dans Google Wallet, mise a jour quand tampons/points changent, nouveau module `lib/services/wallet.service.ts`

### Story 6.3 : Ecran choix wallet (A6)

**REFACTOR** | **S**

**Given** le client termine l'inscription
**Then** bouton Apple (iOS), bouton Google (Android), "Plus tard"

### Story 6.4 : Design cartes wallet natives

**CREER** | **M**

**Then** logo commerce, nom programme, tampons/points, QR scannable, primary_color, aucun degrade

---

## Epic 7 : Auth & Onboarding Commercant

**Taille :** S | **Priorite :** 2 | **FRs :** FR1-2

### Story 7.1 : Login/Register (J1/J2)

**REFACTOR** | **S** | **FRs :** FR1

**Given** le commercant accede a /dashboard/login
**Then** logo centre, champs email + MDP, CTA primary, lien vers Register, responsive

### Story 7.2 : Onboarding choix metier (J3)

**CREER** | **M** | **FRs :** FR2

**Given** le commercant vient de s'inscrire
**Then** 3 radio cards (☕ Cafe, 🍽️ Restaurant, 🥐 Boulangerie) + "Autre"
**And** selection pre-configure tout (type, objectif, recompense)
**And** "Commencer" redirige vers dashboard

### Story 7.3 : OTP commercant (A5)

**REFACTOR** | **S**

**Then** 6 inputs OTP, autocompletion, "Renvoyer le code", gestion erreurs

---

## Epic 8 : Mon Espace & RGPD

**Taille :** M | **Priorite :** 8 | **FRs :** FR3, FR8, FR46, FR48

### Story 8.1 : Restructurer "Mon espace"

**REFACTOR** | **M** | **FRs :** FR3, FR8

**Given** le commercant clique Mon espace
**Then** sous-pages : Infos perso (FR8), Mon entreprise (FR3), Securite, Plan (placeholder), Notifications
**And** /settings et /profile redirigent vers /mon-espace

### Story 8.2 : Suppression compte RGPD

**CREER** | **M** | **FRs :** FR46 | **ARCH7**

**Given** le commercant clique "Supprimer mon compte"
**Then** modale step 1 (consequences) → step 2 (taper "SUPPRIMER")
**And** suppression cascade : push_subscriptions → wallet_registrations → referrals → reward_claims → transactions → loyalty_cards → customers → business
**And** deconnexion + redirection accueil

### Story 8.3 : Export donnees RGPD

**CREER** | **S** | **FRs :** FR48

**Given** le commercant clique "Exporter mes donnees"
**Then** modale confirmation, ZIP avec CSV (clients, transactions, config), toast "Export termine"

---

## Recapitulatif

| Epic | Taille | Stories | Semaine | Effort estime |
|------|--------|---------|---------|---------------|
| 0. Fondations (Strangler Fig) | L | 4 | S1-S2 | 8-10 jours |
| 1. Navigation & Design System | S | 3 | S3 | 2-3 jours |
| 7. Auth & Onboarding | S | 3 | S3 | 2-3 jours |
| 2. Dashboard Commercant | M | 3 | S4 | 4-6 jours |
| 3. Gestion Clients | M | 3 | S5 | 4-6 jours |
| 4. UI Client | XL | 7 | S6-S8 | 12-15 jours |
| 5. Marketing & Engagement | M | 5 | S9 | 4-6 jours |
| 6. Apple Wallet + Google Wallet | L | 4 | S10 | 7-10 jours |
| 8. Mon Espace & RGPD | M | 3 | S10 | 4-6 jours |
| **TOTAL** | | **35** | **~10 sem** | **~47-65 jours** |

### Strategie : Strangler Fig

```
GARDER                           RECONSTRUIRE
──────                           ────────────
Supabase (tables, RLS, auth)     lib/services/ (logique metier)
Apple Wallet protocol             Composants frontend (Figma V4)
Middleware auth                   Routes API (wrappers 20-30 lignes)
Rate limiting Upstash             Validation Zod
Vercel + crons                    Error handling + logging
Env variables                     Tests (Playwright + Vitest)
```

**Objectif : ~8-10K lignes propres au lieu de 12K sales.**

### Features EXCLUES v1 (backlog v2 avec declencheurs)

| Feature | Declencheur v2 |
|---------|----------------|
| SMS Marketing | 3+ commercants demandent apres 4 semaines push |
| Automatisations | Taux envoi push >70% + demande explicite |
| Segmentation avancee | Demande segments custom persistants |
| Personnalisation carte avancee | >=70% commercants a 50+ cartes OU feedback "trop generique" |
| Stats parrainage separees | Demande explicite 4 semaines |
| Page Statistiques avancees | Attente retours utilisateurs |
| Multi-commerces | Hors scope pilote |
| Scanner ecran client | Demande explicite apres 2 semaines pilote |
| Roue de la fortune | Revalidation post-pilote si engagement faible |
| Missions | Revalidation post-pilote si engagement faible |
