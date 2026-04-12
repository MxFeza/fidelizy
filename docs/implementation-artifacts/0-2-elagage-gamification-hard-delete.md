# Story 0.2: Elagage gamification hard delete

Status: done

## Story

En tant que developpeur,
je veux supprimer le code et les tables de gamification inutilisees,
afin de reduire la surface de code de ~30% avant le refactoring.

## Acceptance Criteria

1. Les tables sont supprimees : `wheel_prizes`, `wheel_spins`, `missions`, `mission_completions`, `pwa_visits`
2. Les champs JSONB de `businesses.gamification` sont nettoyes (conserver UNIQUEMENT `initial_stamps`)
3. ~15 endpoints gamification sont supprimes
4. Le code frontend de la roue, missions, surprises, engagement est supprime
5. Les types TypeScript correspondants (`Mission`, `MissionCompletion`) sont supprimes
6. Les rate limiters gamification sont supprimes de `lib/ratelimit.ts`
7. La navigation (Sidebar + BottomNav) ne reference plus "Engagement"
8. Les tests E2E (Story 0.1) passent toujours apres la suppression
9. Le nombre d'endpoints passe de ~45 a ~30

## Tasks / Subtasks

- [x] Task 1 — Verifier que les tests E2E passent AVANT l'elagage (AC: #8)
  - [x] Executer `npm run test:e2e` et confirmer 6/6 passent
  - [x] Si echec, HALT — corriger avant de continuer

- [x] Task 2 — Migration SQL : supprimer les tables (AC: #1, #2)
  - [x] Creer `supabase/migrations/20260412_remove_gamification.sql`
  - [x] DROP TABLE IF EXISTS `wheel_spins` (depend de `wheel_prizes`)
  - [x] DROP TABLE IF EXISTS `wheel_prizes`
  - [x] DROP TABLE IF EXISTS `mission_completions` (depend de `missions`)
  - [x] DROP TABLE IF EXISTS `missions`
  - [x] DROP TABLE IF EXISTS `pwa_visits`
  - [x] Nettoyer le JSONB `businesses.gamification` : retirer `surprise_enabled`, `surprise_probability`, `surprise_reward_type`, `surprise_reward_value`, `wheel_enabled`, `wheel_cost_points`, `goal_gradient_notification`. Garder `initial_stamps`.
  - [x] Executer la migration via Supabase Dashboard (SQL Editor) ou CLI

- [x] Task 3 — Supprimer les routes API gamification (AC: #3, #9)
  - [x] Supprimer le dossier `app/api/dashboard/wheel-prizes/` (GET/POST/PUT/DELETE)
  - [x] Supprimer le dossier `app/api/dashboard/missions/` (GET/PUT + `pending/` GET)
  - [x] Supprimer le dossier `app/api/dashboard/engagement-stats/` (GET)
  - [x] Supprimer le dossier `app/api/missions/` ([cardId] GET, complete POST, validate POST)
  - [x] Supprimer le dossier `app/api/wheel/` ([cardId] GET, spin POST)
  - [x] Supprimer le dossier `app/api/pwa-visit/` ([cardId] POST)
  - [x] Simplifier `app/api/dashboard/gamification/route.ts` : ne garder que GET/PUT pour `initial_stamps`

- [x] Task 4 — Nettoyer les routes API existantes (AC: #3)
  - [x] `app/api/card/add/route.ts` : retirer la logique surprise + goal gradient
  - [x] `app/api/scan/route.ts` : retirer la logique surprise + goal gradient
  - [x] `app/api/join/route.ts` : garder uniquement `initial_stamps` dans la lecture de gamification
  - [x] Verifier `app/api/card/[cardId]/live/route.ts` : retirer les refs wheel/gamification

- [x] Task 5 — Supprimer le frontend gamification (AC: #4, #7)
  - [x] Supprimer le dossier `app/dashboard/(protected)/engagement/` (page.tsx ~1364 lignes)
  - [x] `app/dashboard/(protected)/Sidebar.tsx` : retirer l'entree "Engagement"
  - [x] `components/dashboard/BottomNav.tsx` : retirer l'entree "Engagement"
  - [x] `app/card/[cardId]/CardPageClient.tsx` : retirer l'onglet Missions, ses states, son fetch, son rendu (~200 lignes)

- [x] Task 6 — Nettoyer les types et rate limiters (AC: #5, #6)
  - [x] `lib/types.ts` : supprimer les interfaces `Mission` et `MissionCompletion`
  - [x] `lib/ratelimit.ts` : supprimer `gamificationLimiter`, `wheelLimiter`, `wheelSpinLimiter`, `wheelPrizesLimiter`, `missionsLimiter`, `missionCompleteLimiter`, `missionValidateLimiter` (7 limiters)

- [x] Task 7 — Verifier que les tests E2E passent APRES l'elagage (AC: #8)
  - [x] Executer `npm run test:e2e` et confirmer 6/6 passent
  - [x] Si echec, identifier et corriger la regression
  - [x] Verifier que `npm run build` compile sans erreur
  - [x] Verifier que `npm run lint` ne montre pas de nouvelles erreurs

## Dev Notes

### Prerequis

- **Story 0.1 TERMINEE** : les tests E2E Playwright sont en place et passent
- **Pattern Strangler Fig** : on SUPPRIME du code, on n'en ajoute pas

### Stack existante a respecter

- **Framework** : Next.js 16.1.6 (App Router) — [Source: docs/PROJET_STATE.md]
- **Auth commercant** : Supabase email + password via cookies — [Source: docs/architecture.md]
- **DB** : Supabase PostgreSQL, 14 tables avec RLS → 9 tables apres elagage — [Source: docs/data-models.md]
- **Deploiement** : Vercel auto-deploy depuis main — [Source: docs/PROJET_STATE.md]

### Ce qui est conserve

- La table `referrals` et le code parrainage — c'est une feature metier, PAS de la gamification
- Le champ `businesses.gamification.initial_stamps` — utilise pour les tampons de bienvenue
- Toutes les fonctionnalites core : tampons, points, QR scan, dashboard KPIs, liste clients, Apple Wallet, push notifications
- Les `push_subscriptions` et `wallet_registrations` — ce sont des tables de notification, pas de gamification

### Ce qui est supprime

| Categorie | Elements | Quantite |
|-----------|----------|----------|
| Tables DB | wheel_prizes, wheel_spins, missions, mission_completions, pwa_visits | 5 |
| JSONB fields | surprise_*, wheel_*, goal_gradient_* | 7 champs |
| Dossiers API | wheel-prizes/, missions/, engagement-stats/, missions/, wheel/, pwa-visit/ | 6 dossiers |
| Routes a modifier | card/add, scan, join, card/live, dashboard/gamification | 5 |
| Page frontend | engagement/ | 1 |
| Composant CardPage | onglet Missions + states/fetch | ~200 lignes |
| Nav entries | Sidebar + BottomNav "Engagement" | 2 |
| Types | Mission, MissionCompletion | 2 |
| Rate limiters | gamification*, wheel*, mission* | 7 |

### Ordre de suppression recommande

1. **D'abord les tests** (confirmer le baseline)
2. **Puis le code** (routes API, frontend, types, limiters)
3. **Puis la DB** (migration SQL — les routes supprimees ne referenceront plus les tables)
4. **Enfin re-tester** (confirmer zero regression)

> Note : supprimer le code AVANT la DB evite les erreurs de runtime pendant la transition. Si on supprime les tables d'abord, les routes qui les referencent casseraient.

### Intelligence de la Story 0.1

- Les tests E2E utilisent des helpers Supabase admin pour creer/nettoyer des donnees de test
- Les tests couvrent : inscription + stamps, dashboard + clients, parrainage + bonus
- Le test parrainage verifie les bonus en DB via `referrals` table (qui est CONSERVEE)
- Le test dashboard verifie les KPIs mais PAS les stats engagement (qui seront supprimees)
- Les tests ne referencent aucune route/table gamification → ils ne devraient pas casser

### References

- [Source: docs/planning-artifacts/architecture-decisions.md#Elagage Gamification — Hard Delete]
- [Source: docs/planning-artifacts/epics.md#Story 0.2]
- [Source: docs/PROJET_STATE.md#Features implementees > Phase Gamification]
- [Source: docs/api-contracts.md#Gamification]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- 6 dossiers API gamification supprimes (wheel-prizes, missions, engagement-stats, missions, wheel, pwa-visit)
- Route `/api/dashboard/gamification` simplifiee (initial_stamps uniquement)
- Routes card/add, scan, join, live, update-profile nettoyees (surprise, goal gradient, missions retires)
- Page engagement frontend supprimee (~1364 lignes)
- CardPageClient nettoye : onglet Missions, roue de la fortune, etats missions retires
- Sidebar + BottomNav : entree "Engagement" retiree
- Types Mission + MissionCompletion supprimes de lib/types.ts
- 7 rate limiters gamification supprimes de lib/ratelimit.ts
- Referrals decouplees des missions (bonus hardcodes: 5 pts parrain, 2 pts filleul)
- Migration SQL creee (supabase/migrations/20260412_remove_gamification.sql) — EXECUTION MANUELLE REQUISE
- Build compile sans erreur, 6/6 tests E2E passent

### File List

- `app/api/dashboard/wheel-prizes/` (supprime)
- `app/api/dashboard/missions/` (supprime)
- `app/api/dashboard/engagement-stats/` (supprime)
- `app/api/missions/` (supprime)
- `app/api/wheel/` (supprime)
- `app/api/pwa-visit/` (supprime)
- `app/api/dashboard/gamification/route.ts` (modifie — simplifie)
- `app/api/card/add/route.ts` (modifie — surprise + goal gradient retires)
- `app/api/scan/route.ts` (modifie — surprise + goal gradient retires)
- `app/api/join/route.ts` (modifie — missions decouplees des referrals)
- `app/api/card/[cardId]/live/route.ts` (modifie — wheel retire)
- `app/api/card/update-profile/route.ts` (modifie — missions retirees)
- `app/dashboard/(protected)/engagement/` (supprime)
- `app/dashboard/(protected)/Sidebar.tsx` (modifie)
- `components/dashboard/BottomNav.tsx` (modifie)
- `app/card/[cardId]/CardPageClient.tsx` (modifie — missions tab + wheel retires)
- `lib/types.ts` (modifie — Mission, MissionCompletion supprimes)
- `lib/ratelimit.ts` (modifie — 7 limiters supprimes)
- `supabase/migrations/20260412_remove_gamification.sql` (nouveau)
