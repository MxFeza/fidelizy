# Prompt de reprise — Projet Izou (Fidelizy)

Copie-colle ce prompt au debut de ta prochaine session Claude Code.

---

## Contexte projet

Projet **Izou** (repo `fidelizy`) — app de fidelite commercant/client. Stack : Next.js 16 App Router, Supabase PostgreSQL + Auth + RLS, TypeScript 5, Zod 4, Vitest, Playwright, Tailwind CSS 4. Deploye sur Vercel (auto-deploy main).

**Repo :** https://github.com/MxFeza/fidelizy
**Working dir :** `C:\Users\UX8402\fidelizy`
**Branche de travail :** `develop` (on merge dans main uniquement quand un epic complet est termine et review par Gemini)

## Etat actuel

### Epic 0 — Fondations Techniques : DONE (merge sur main)
- 0.1 Tests E2E Playwright — 6 tests, 3 parcours critiques
- 0.2 Elagage gamification — -3000 lignes, -15 endpoints
- 0.3 Extraction services metier — 5 services (`lib/services/`), 10 schemas Zod, RPCs atomiques (`increment_stamps`, `increment_points`, `deduct_points`)
- 0.4 Error handling — `AppError` + `withErrorHandler()` sur 100% des routes, `force-dynamic` sur GET

### Architecture en place
- `lib/services/` : loyalty, notification, customer, referral, auth (+ schemas Zod)
- `lib/errors.ts` : AppError (7 codes, 6 factories) + withErrorHandler HOF
- RPCs Supabase pour compteurs atomiques (pas de race conditions)
- `.throwOnError()` sur toutes les mutations Supabase
- 29 tests Vitest, build OK

### Prochain epic : Epic 1 — Navigation & Design System
Ordre des epics : ~~0~~ → **1** → 7 → 2 → 3 → 4 → 5 → 6 → 8

Stories Epic 1 :
- 1.1 Sidebar desktop v4 (4 entrees) — Figma E1 `10408:100385`
- 1.2 Bottom Nav mobile commercant (4 items) — Figma E2 `10421:4570`
- 1.3 Bell notifications + design tokens globaux

**Attention :** Epic 1 est du frontend. Lire les memories de feedback design avant de commencer :
- Figma obligatoire avant dev (checkpoint visuel du user)
- Untitled UI React pour TOUS les composants
- Jamais de degrades, blocs plats uniquement
- Violet (#7F56D9) = principal, noir = secondaire, outline = tertiaire, rouge = destructif
- Sidebar blanc/warm sobre
- UNE page a la fois, verifier, valider, puis suivante

### Workflow
1. `/bmad-create-story` pour la story (mode autopilote)
2. `/bmad-dev-story` pour implementer (mode autopilote)
3. Commit sur `develop`, push
4. Donner les fichiers a Gemini pour review adversariale
5. Corriger les findings, re-push
6. Quand epic complet : merge `develop` → `main`
7. Mettre a jour Notion (stories + epic + journal de bord)

### Notion IDs
- Page principale : `3407d98657818100920edda7383b1d58`
- DB Epics : `9cb962e9-3785-4a60-af26-a09b7971cabe`
- DB Stories : `160a5dae-538d-43ad-b45b-db17c33bf4d4`
- Journal de bord : `3407d986578181ac96eece9776134ac7`

### Git config
- User : MxFeza / ebellafrancis@gmail.com
- Co-author : `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`

---

## Commande de reprise

```
Lance /bmad-create-story puis /bmad-dev-story pour la Story 1.1 (sidebar desktop v4).
Mode autopilote — ne m'interromps que si une decision bloquante est necessaire.
Mets a jour Notion au fur et a mesure.
```
