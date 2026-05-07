# Plan structurel — Travail externalisé via LLM (Google AI Studio / Gemini / Claude / GPT-4)

> Ce document est le **point d'entrée** pour confier des tâches à un LLM externe.
> Il décrit le projet, les conventions du repo, et liste les briefs disponibles.

**Date :** 2026-05-07
**Maintainer :** Francis (ebellafrancis@gmail.com)

---

## 1. Vue d'ensemble du projet

**Nom :** Izou (domaine `fidelizy.vercel.app`)
**Type :** Application de fidélisation client pour commerçants de proximité
**Cible primaire :** petits commerçants 1-5 personnes (cafés, restaurants, salons de coiffure, beauté, prothésistes ongulaires…)
**Cible secondaire :** clients finaux 18-35 ans (étudiants, jeunes actifs)
**Statut :** pilote v1 imminent — ~95% des fonctionnalités Epic 4 livrées
**Stack résumée :** Next.js 16.1.6 (App Router + Turbopack) / React 19 / TypeScript 5 / Tailwind 4 / Supabase (Auth + Postgres + RLS + Storage) / Upstash Redis (rate-limit) / Sentry (observability) / Vercel (deploy)

### Mécanique métier clé
- Le commerçant s'inscrit, configure son programme (mode tampons OU mode points + paliers de récompenses)
- Il imprime un QR code au comptoir
- Le client final scanne le QR → onboarding rapide (prénom + téléphone + email optionnel + OTP) → carte créée
- Chaque scan ultérieur = +1 tampon ou +N points
- Quand le client atteint le seuil, il "réclame" sa récompense → génère un code éphémère 6 chars → présente au commerçant qui valide → reset stamps ou deduct points
- Apple Wallet pris en charge (Google Wallet defer fin Epic)
- Parrainage : code unique par client → ami s'inscrit avec → bonus tampons/points pour les deux

---

## 2. Stack technique détaillée

### Framework & runtime
- **Next.js 16.1.6** (App Router, Turbopack en dev, route handlers `app/api/**/route.ts`)
- **React 19.2.3** (Server Components + Client Components clairement séparés via `'use client'`)
- **TypeScript 5** (strict mode)
- **Tailwind CSS 4** (config `tailwind.config.ts`, theme tokens)

### Backend
- **Supabase** (project `ggzgffwykthufieeikzb` en eu-central-1)
  - Postgres 17.6
  - RLS activée sur la majorité des tables
  - 3 buckets storage : `public-assets`, `business-logos`, `business-banners`
  - RPC functions : `increment_stamps`, `deduct_points` (atomic, race-safe)
  - Auth : email/password merchant, OTP email pour clients
- **Upstash Redis** pour rate-limit (`@upstash/ratelimit`)
- **Sentry** pour observability (`@sentry/nextjs`)

### UI
- **`@untitledui/react`** + **`@untitledui/icons`** (lib privée GitHub) — composants standardisés
- **Hiérarchie CTA stricte** : violet=primary / noir=secondary / outline=tertiary / rouge=destructive (cf. `feedback_cta_hierarchy`)
- **Pas de gradients** sauf le wrapper carte loyalty (cf. `feedback_no_gradients`)
- **Tokens couleurs** dans `theme.css` (importé impérativement)

### Tests & quality
- **Vitest 4.1.4** pour tests unitaires (`lib/services/__tests__/*.test.ts`, `app/__tests__/*.test.ts`)
- **Playwright 1.59** pour tests E2E (config probable `playwright.config.ts`)
- **ESLint** + **Husky pre-commit** (lint-staged) — bloque commits si erreurs
- **TypeScript strict** — `npm run typecheck` doit passer

### Déploiement
- **Vercel** auto-deploy depuis branche `main`
- Workflow : code → push `develop` → CI green → auto-PR `develop→main` → auto-merge si vert → Vercel deploy

---

## 3. Conventions importantes du repo

### Architecture
- `app/` : routes Next.js (App Router). Layouts, pages, API routes
- `app/api/**/route.ts` : route handlers — toujours `withErrorHandler` + `AppError` factory
- `lib/services/*.service.ts` : couche service métier (loyalty, claim, referral, notification, etc.)
- `lib/services/__tests__/` : tests des services
- `lib/supabase/{client,server,service}.ts` : 3 clients Supabase (browser, SSR, service_role)
- `components/dashboard/*` : composants merchant dashboard
- `components/client/*` : composants client (Toast, BottomTabBarClient, TopBarClient)
- `components/ui/base/*` : composants Untitled UI réutilisés (Button, Input, etc.)

### Patterns
- **Error handling** : toujours wrap les routes avec `withErrorHandler(async (req) => {...})`. Throw `AppError.validation()`, `AppError.auth()`, `AppError.notFound()`, etc.
- **Auth boundaries** :
  - Pages `app/dashboard/(protected)/**` → SSR auth obligatoire (redirect login si pas user)
  - Routes `/api/me/*` → auth client cookie SSR
  - Routes `/api/business/*` → auth merchant cookie SSR
  - Routes `/api/card/*` → public via `qr_code_id` (pas d'auth user)
  - Routes `/api/scan/*` → auth merchant
- **Rate-limiting** : tous les write endpoints doivent appeler un limiter de `lib/ratelimit.ts` (scanLimiter, joinLimiter, cardWriteLimiter, otpLimiter, etc.). Fail-open en dev via `gracefulLimit`, fail-closed en prod.
- **Validation Zod** : schémas dans `lib/services/*.schemas.ts` (loyalty.schemas.ts, etc.) — utilisés à la validation des inputs API.

### Design system
- **Pas de from-scratch UI** : si un composant existe dans `@untitledui/react`, l'utiliser. Sinon dans `components/ui/base/*`.
- **Icônes** : `@untitledui/icons` (UI) + emojis ponctuels dans contenu utilisateur — *cf. EMOJI_LIBRARY_BRIEF pour évolution*
- **Tokens couleurs sémantiques** : `bg-primary`, `bg-secondary`, `text-tertiary`, `bg-brand-solid`, `bg-success-secondary`, etc. — *jamais* `bg-gray-100` direct sauf cas particulier

### Git
- Branche principale : `develop` (push direct)
- Branche prod : `main` (auto-merge depuis develop)
- Pas de squash, conventional commits : `feat(4.X.Y)`, `fix(...)`, `chore(...)`, etc.
- Husky pre-commit lance ESLint --fix sur les fichiers staged

---

## 4. Comment utiliser le bundle

### Étape 1 — Générer le bundle
```bash
npm run export-for-llm
```
Sortie : `.tmp/repomix-bundle.md` (~600 KB - 2 MB selon date). Format Markdown structuré, gitignored.

### Étape 2 — Choisir un brief
Selon la tâche à exécuter :

| Brief | Fichier | Périmètre |
|-------|---------|-----------|
| **Tests Vitest** | `TESTING_BRIEF.md` | Couverture services manquants : claim, referral, notification |
| **Audit sécurité** | `SECURITY_AUDIT_BRIEF.md` | RLS, secrets, headers, validation Zod, rate-limit, auth boundaries |
| **Refonte Profil P1** | `PROFILE_REDESIGN_BRIEF.md` | Migration DB + 5 sub-screens + 6 modals + avatar selon Figma 2026-05-07 |
| **Migration emojis** | `EMOJI_LIBRARY_BRIEF.md` | Audit + remplacement galerie d'emojis (couverture multi-métiers) |

### Étape 3 — Coller dans Google AI Studio (ou autre)
1. Ouvrir Google AI Studio (Gemini 2.5 Pro recommandé pour context window)
2. Coller en premier message :
   ```
   [Le contenu de EXTERNAL_LLM_PLAN.md]

   [Le contenu du brief choisi, ex: TESTING_BRIEF.md]

   [Le contenu de .tmp/repomix-bundle.md]
   ```
3. Demander : *"Suis ce brief et produis-moi le format de retour attendu"*

### Étape 4 — Récupérer le résultat
Format attendu :
- **Tests / refonte** : PR markdown avec diffs précis (paths + line numbers + code complet) → je crée les fichiers et commit
- **Audits** : rapport markdown structuré Tier 1 / Tier 2 / Tier 3 avec recos précises → on traite par ordre de ROI

---

## 5. Tables Supabase principales (référence rapide)

| Table | Description | RLS |
|-------|-------------|-----|
| `businesses` | Compte commerçant (id = auth.users.id) | RLS owner |
| `customers` | Profil client (pas de Supabase Auth, juste téléphone + email) | RLS via card |
| `loyalty_cards` | Carte de fidélité (1 par couple business+customer) | RLS via FK |
| `transactions` | Historique scan/redeem | RLS via card |
| `reward_tiers` | **LEGACY** — remplacée par `business.reward_tiers` JSONB. Droppable | — |
| `reward_claims` | Historique récompenses réclamées | RLS via card |
| `claim_requests` | Codes éphémères Story 4.4 | RLS verrouillée (service_role only) |
| `referrals` | Parrainages | RLS via business |
| `wheel_*`, `mission_*` | LEGACY — élaguées via `chore(elagage-gamification)` | — |
| `wallet_registrations` | Apple Wallet device_library_id | RLS via card |
| `push_subscriptions` | VAPID web push | RLS via card |
| `pwa_visits` | Métriques PWA | — |

Modèles TypeScript : `lib/types.ts` (à mettre à jour avec les colonnes ajoutées récemment : `card_image_url`, `website_url`, `booking_url`)

---

## 6. Variables d'environnement (référence)

Voir `.env.example` (à vérifier qu'il est à jour). Variables critiques :
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Upstash)
- `APPLE_*` (5 vars wallet)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`

---

## 7. Documents BMAD de référence (déjà rédigés)

Tous dans `docs/planning-artifacts/` :
- `prd.md` (52 FRs, 5 parcours utilisateur)
- `architecture-decisions.md` (8 étapes BMAD)
- `ux-design-specification.md` (14 étapes)
- `epics.md` (9 epics, 36 stories)
- `personas-izou-2026-03-27.md`
- `audit-v2.md` (features livrées vs Figma)

Et dans `docs/figma/` :
- `wf8-carte-fidelite.md`
- `wf9-refonte-navigation.md`
- `wf10-recompense-parrainage-recup.md`
- `wf11-corrections-profil.md`

Le LLM externe peut s'y référer si besoin de contexte produit/UX précis.

---

## 8. Format de sortie attendu (résumé)

Pour les **briefs de génération de code** (tests, refonte) :
```
## Fichiers à créer/modifier

### path/to/file.ts (CREATE)
\`\`\`typescript
[contenu complet]
\`\`\`

### path/to/other.ts (MODIFY lines 42-58)
\`\`\`typescript
[diff précis]
\`\`\`
```

Pour les **briefs d'audit** (sécurité, emoji) :
```
## TL;DR
[3 lignes]

## Tier 1 — À faire immédiatement
| # | Item | Path | Effort | Recommandation |

## Tier 2 — À planifier
[idem]

## Tier 3 — Backlog
[liste courte]
```

---

## 9. Contact & itération

Si le LLM externe a besoin de clarification sur un point ambigu, il doit produire une **section "Questions ouvertes"** en fin de réponse. L'humain (Francis) répondra et le LLM raffinera.

**Sortie attendue idéale = utilisable directement sans aller-retour.** Les briefs sont rédigés pour être self-contained.
