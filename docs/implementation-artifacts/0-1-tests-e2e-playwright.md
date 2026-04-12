# Story 0.1: Tests E2E Playwright — 3 parcours critiques

Status: done

## Story

En tant que developpeur,
je veux un filet de securite E2E couvrant les 3 parcours critiques,
afin de detecter toute regression avant et pendant le refactoring Strangler Fig.

## Acceptance Criteria

1. Playwright est installe et configure dans le projet fidelizy
2. Parcours 1 (inscription + scan) : un nouveau client s'inscrit via /join, recoit 2 tampons bienvenue, sa carte affiche 2/10
3. Parcours 2 (dashboard commercant) : un commercant se connecte, voit ses KPIs, accede a la liste clients, ouvre un detail client
4. Parcours 3 (parrainage) : un client partage son code, un nouveau client s'inscrit avec ce code, les deux recoivent des bonus
5. Les tests passent en Chromium ET WebKit (Safari — indispensable pour Apple Wallet)
6. Les tests sont executables via `npm run test:e2e` ou `npx playwright test`
7. Un fichier `playwright.config.ts` est present a la racine du projet

## Tasks / Subtasks

- [x] Task 1 — Installer Playwright (AC: #1, #7)
  - [x] `npm install -D @playwright/test` + `npx playwright install chromium webkit`
  - [x] Configurer `playwright.config.ts` : baseURL `http://localhost:3000`, projets Chromium + WebKit
  - [x] Ajouter script `test:e2e` dans package.json
  - [x] Verifier que le serveur Next.js demarre correctement pour les tests (`webServer` config)

- [x] Task 2 — Parcours 1 : Inscription client + scan + tampon (AC: #2)
  - [x] Test fichier : `tests/e2e/inscription-scan.spec.ts`
  - [x] Naviguer vers `/join/{businessId}` (commerce de test cree via admin API)
  - [x] Remplir le formulaire : prenom, telephone, email
  - [x] Verifier redirection vers la page carte `/card/{cardId}`
  - [x] Verifier que la carte affiche les tampons de bienvenue (2/10 si `initial_stamps: 2`)
  - [x] OTP : test emails rejetes par Supabase → fallback redirect vers carte (card created via /api/join)

- [x] Task 3 — Parcours 2 : Dashboard commercant (AC: #3)
  - [x] Test fichier : `tests/e2e/dashboard.spec.ts`
  - [x] Naviguer vers `/dashboard/login`, saisir credentials de test
  - [x] Verifier presence des KPIs (au moins 4 cards avec chiffres)
  - [x] Naviguer vers `/dashboard/clients`, verifier la table clients
  - [x] Cliquer sur un client, verifier le detail (carte visuelle, stats)

- [x] Task 4 — Parcours 3 : Parrainage (AC: #4)
  - [x] Test fichier : `tests/e2e/parrainage.spec.ts`
  - [x] Client A accede a sa carte, verifie le code parrainage
  - [x] Client B s'inscrit via `/join/{businessId}` avec code parrain
  - [x] Verifier que Client B a ses bonus filleul (2 points via DB)
  - [x] Verifier que Client A a recu son bonus parrain (5 points via DB)

- [x] Task 5 — Validation multi-navigateurs (AC: #5, #6)
  - [x] Executer `npx playwright test` : 6 tests passent (3 Chromium + 3 WebKit)
  - [x] Corriger les differences WebKit (validation email, navigation client-side, KPI timing)

## Dev Notes

### Stack existante a respecter

- **Framework** : Next.js 16.1.6 (App Router, Turbopack) — [Source: docs/PROJET_STATE.md]
- **Auth commercant** : Supabase email + password via cookies + middleware — [Source: docs/architecture.md]
- **Auth client** : OTP email via Supabase Auth `signInWithOtp` — [Source: docs/api-contracts.md#Authentification]
- **Base de donnees** : Supabase PostgreSQL, 14 tables avec RLS — [Source: docs/data-models.md]
- **Deploiement** : Vercel auto-deploy depuis main — [Source: docs/PROJET_STATE.md]

### Architecture Playwright recommandee

```
fidelizy/
├── playwright.config.ts
├── tests/
│   └── e2e/
│       ├── inscription-scan.spec.ts
│       ├── dashboard.spec.ts
│       └── parrainage.spec.ts
├── package.json  (+ script test:e2e)
```

[Source: docs/planning-artifacts/architecture-decisions.md — "Framework de Tests : Vitest (services) + Playwright (E2E)"]

### Gestion de l'OTP en test

Le flow OTP Supabase necessite une strategie de bypass en E2E :
1. **Option recommandee** : Activer `autoconfirm` dans les settings Supabase pour l'env de dev/test
2. **Alternative** : Utiliser l'API admin Supabase pour recuperer l'OTP genere
3. **NE PAS** mocker Supabase — ces tests doivent valider le vrai backend

[Source: docs/api-contracts.md#POST /api/auth/send-otp, /api/auth/verify-otp]

### Donnees de test

Le projet est en production. Les tests doivent :
- Utiliser un commerce de test dedie (ne pas polluer les donnees reelles)
- Creer les fixtures necessaires (business test + customers test)
- Nettoyer apres execution si possible (ou utiliser un prefix identifiable)

### Ce qui NE DOIT PAS etre fait

- NE PAS installer Jest (on utilise Playwright pour E2E, Vitest pour les services — Story 0.3)
- NE PAS mocker Supabase dans les tests E2E — le but est de tester le vrai backend
- NE PAS toucher au code applicatif existant — cette story ne modifie que la config test
- NE PAS ecrire de tests unitaires (c'est la Story 0.3 avec Vitest)

### Contexte strategique

Cette story est la PREMIERE du projet Strangler Fig. Le filet de tests E2E doit etre en place AVANT :
- Story 0.2 : Elagage gamification (suppression de 5 tables, 15 endpoints)
- Story 0.3 : Extraction des services metier
- Tout refactoring frontend

Si un test casse apres l'elagage, c'est qu'on a supprime quelque chose d'utile.

[Source: docs/planning-artifacts/architecture-decisions.md — "Tests Playwright (Priorite E2E) : Tests E2E AVANT refactoring"]

### References

- [Source: docs/planning-artifacts/architecture-decisions.md#Framework de Tests]
- [Source: docs/planning-artifacts/prd.md#Exigences Non-Fonctionnelles > Maintenabilite]
- [Source: docs/PROJET_STATE.md#Stack technique]
- [Source: docs/api-contracts.md#Authentification client]
- [Source: docs/planning-artifacts/epics.md#Story 0.1]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Playwright installe avec Chromium + WebKit, config a la racine
- 3 tests E2E couvrant inscription+stamps, dashboard commercant, et parrainage
- Helper Supabase admin pour creation/cleanup de donnees de test
- OTP : Supabase rejette les test emails → fallback JoinForm redirige vers carte (card deja creee)
- WebKit : ajustements pour validation email HTML5, navigation React client-side, timing KPIs
- Tests serialises (workers: 1) pour eviter conflits de donnees Supabase
- Aucun code applicatif modifie (Strangler Fig respecte)
- 6/6 tests passent (3 Chromium + 3 WebKit) en ~1 minute

### File List

- `playwright.config.ts` (nouveau) — Config Playwright avec dotenv, webServer, Chromium+WebKit
- `tests/e2e/helpers.ts` (nouveau) — Admin client Supabase, fixtures, cleanup, OTP helper
- `tests/e2e/inscription-scan.spec.ts` (nouveau) — Test parcours inscription + 2 tampons bienvenue
- `tests/e2e/dashboard.spec.ts` (nouveau) — Test parcours dashboard commercant + clients
- `tests/e2e/parrainage.spec.ts` (nouveau) — Test parcours parrainage avec bonus points
- `package.json` (modifie) — Ajout @playwright/test, dotenv, script test:e2e
- `.gitignore` (modifie) — Ajout test-results/, playwright-report/, etc.
- `.env.local` (modifie) — Ajout variables manquantes pour dev local
