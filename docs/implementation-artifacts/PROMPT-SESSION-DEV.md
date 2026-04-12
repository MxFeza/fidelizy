# Prompt — Session Dev Story 0.1

> Copier-coller ce prompt au debut de la prochaine session Claude Code.
> Working directory : `C:\Users\UX8402\fidelizy`

---

## INSTRUCTION

Lance `/bmad-dev-story` pour implementer la Story 0.1 (Tests E2E Playwright).

## CONTEXTE RAPIDE

Le projet Izou (fidelizy) est une app de fidelisation pour commercants de proximite. Le MVP est en production (fidelizy.vercel.app). On reconstruit le codebase en suivant le **Strangler Fig Pattern** : garder l'infra qui marche, reconstruire le code proprement.

**Story 0.1 est la PREMIERE story** — poser le filet de tests E2E avant tout refactoring.

## FICHIERS A CHARGER

1. **Story a implementer :**
   `docs/implementation-artifacts/0-1-tests-e2e-playwright.md`

2. **Sprint status :**
   `docs/implementation-artifacts/sprint-status.yaml`

3. **Architecture (pour les conventions) :**
   `docs/planning-artifacts/architecture-decisions.md`

4. **Etat du code actuel :**
   `docs/PROJET_STATE.md`

5. **API contracts (pour les tests) :**
   `docs/api-contracts.md`

## DECISIONS CLES A RESPECTER

- **Strangler Fig Pattern** : ne PAS toucher au code applicatif existant. Cette story ajoute UNIQUEMENT Playwright + tests
- **3 parcours E2E** : inscription+scan, dashboard commercant, parrainage
- **Chromium + WebKit** (Safari obligatoire pour Apple Wallet)
- **Pas de mock Supabase** — les tests frappent le vrai backend
- **OTP** : utiliser Supabase `autoconfirm` en dev ou recuperer l'OTP via admin API
- **UI Library (pour les futures stories)** : Untitled UI React (MIT gratuit) — NE PAS installer dans cette story, c'est pour Epic 1+

## OUTPUT ATTENDU

- `playwright.config.ts` a la racine
- `tests/e2e/inscription-scan.spec.ts`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/parrainage.spec.ts`
- Script `test:e2e` dans package.json
- Les 3 tests passent en Chromium + WebKit
