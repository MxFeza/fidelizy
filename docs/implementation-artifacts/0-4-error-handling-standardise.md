# Story 0.4 : Error handling standardise + logging

Status: review

## Story

En tant que developpeur,
je veux un error handling coherent sur toutes les routes,
afin qu'aucune erreur brute Supabase ne soit exposee au client.

## Acceptance Criteria

1. **Given** <10% des routes ont un error handling propre actuellement
   **When** le middleware d'erreur est en place
   **Then** une classe `AppError` est creee avec codes (VALIDATION, AUTH, NOT_FOUND, RATE_LIMIT, INTERNAL)

2. **And** chaque route utilise un wrapper `withErrorHandler()` qui catch les erreurs et retourne des reponses JSON propres

3. **And** les erreurs sont loguees avec contexte (route, params, timestamp)

4. **And** aucune erreur Supabase brute n'est exposee au client

## Tasks / Subtasks

- [x] Task 1 — Creer `lib/errors.ts` avec AppError + withErrorHandler (AC: #1, #2, #3, #4)
  - [x] 1.1 Creer `lib/errors.ts` : classe `AppError` avec codes enum + static factories
  - [x] 1.2 Migrer `ServiceError` de `loyalty.service.ts` vers `AppError` (re-export pour compat)
  - [x] 1.3 Creer `withErrorHandler(handler)` : wrapper HOF catch AppError, Supabase errors, erreurs inconnues
  - [x] 1.4 Logger : timestamp, route, error code, message, stack en dev uniquement
  - [x] 1.5 Tests Vitest : 7 tests (AppError props, factories, withErrorHandler pass-through, catch AppError, catch unknown, catch Supabase)

- [x] Task 2 — Appliquer withErrorHandler sur les routes refactorees (AC: #2)
  - [x] 2.1 `app/api/scan/route.ts`
  - [x] 2.2 `app/api/card/add/route.ts`
  - [x] 2.3 `app/api/card/deduct/route.ts`
  - [x] 2.4 `app/api/card/claim-reward/route.ts`
  - [x] 2.5 `app/api/card/reset/route.ts`
  - [x] 2.6 `app/api/join/route.ts`
  - [x] 2.7 `app/api/auth/send-otp/route.ts`
  - [x] 2.8 `app/api/auth/verify-otp/route.ts`
  - [x] 2.9 `app/api/auth/add-email/route.ts`

- [x] Task 3 — Appliquer sur les routes non-refactorees (AC: #2, #4)
  - [x] 3.1 `app/api/dashboard/kpis/route.ts`
  - [x] 3.2 `app/api/dashboard/top-clients/route.ts`
  - [x] 3.3 `app/api/dashboard/visits-week/route.ts`
  - [x] 3.4 `app/api/dashboard/export-clients/route.ts`
  - [x] 3.5 `app/api/push/broadcast/route.ts`
  - [x] 3.6 `app/api/wallet/[cardId]/route.ts` (logging ameliore, pas withErrorHandler car retourne binaire)
  - [x] 3.7 `app/api/recover/route.ts`
  - [x] 3.8 `app/api/card/update-profile/route.ts` (nettoye logique missions morte)

- [x] Task 4 — Validation finale (AC: #1-4)
  - [x] 4.1 Aucune route ne retourne d'erreur Supabase brute
  - [x] 4.2 TypeScript compile sans erreur
  - [x] 4.3 29 tests Vitest passent
  - [x] 4.4 Next.js build passe

## Dev Notes

### Pattern withErrorHandler

```typescript
// lib/errors.ts
import { NextRequest, NextResponse } from 'next/server'

export type ErrorCode = 'VALIDATION' | 'AUTH' | 'NOT_FOUND' | 'RATE_LIMIT' | 'INTERNAL'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: ErrorCode = 'INTERNAL'
  ) {
    super(message)
    this.name = 'AppError'
  }
}

type RouteHandler = (request: NextRequest) => Promise<NextResponse>

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest) => {
    try {
      return await handler(request)
    } catch (err) {
      if (err instanceof AppError) {
        logError(request, err)
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: err.statusCode }
        )
      }
      logError(request, err)
      return NextResponse.json(
        { error: 'Erreur serveur inattendue' },
        { status: 500 }
      )
    }
  }
}
```

### Migration ServiceError → AppError

`ServiceError` dans `loyalty.service.ts` est remplacee par `AppError` de `lib/errors.ts`.
Tous les services importent `AppError` au lieu de definir leur propre classe d'erreur.
Les routes qui importaient `ServiceError` switchent vers `AppError` (mais n'en ont plus besoin directement car withErrorHandler s'en charge).

### Route refactoree AVANT (story 0.3) :

```typescript
export async function POST(request: NextRequest) {
  try {
    // ... validation, auth, appel service
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
```

### Route refactoree APRES (story 0.4) :

```typescript
export const POST = withErrorHandler(async (request) => {
  // ... validation, auth, appel service
  return NextResponse.json(result)
})
```

Le try/catch + ServiceError check disparait de CHAQUE route.

### Fichiers qui importent ServiceError (a migrer)

- `lib/services/loyalty.service.ts` — definition + usage
- `lib/services/customer.service.ts` — import + usage
- `lib/services/auth.service.ts` — import + usage
- `app/api/scan/route.ts` — import (supprime avec withErrorHandler)
- `app/api/card/add/route.ts` — idem
- `app/api/card/deduct/route.ts` — idem
- `app/api/card/claim-reward/route.ts` — idem
- `app/api/card/reset/route.ts` — idem
- `app/api/join/route.ts` — idem
- `app/api/auth/send-otp/route.ts` — idem
- `app/api/auth/add-email/route.ts` — idem

### NE PAS TOUCHER

- `app/api/cron/push-inactive/route.ts` — cron avec auth Bearer, pattern different
- `app/api/wallet/v1/` — Apple Wallet protocol, error handling specifique
- `app/api/push/subscribe/route.ts` — pas de try/catch global necessaire
- `middleware.ts`

### References

- [Source: docs/planning-artifacts/epics.md#Story 0.4]
- [Source: docs/planning-artifacts/architecture-decisions.md#Strangler Fig Pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- ServiceError migre vers AppError — re-export dans loyalty.service.ts pour compat
- update-profile nettoye : logique missions morte supprimee (tables n'existent plus)
- wallet/[cardId] pas wrappe avec withErrorHandler (retourne binaire .pkpass, pas JSON)

### Completion Notes List

- `lib/errors.ts` cree avec AppError (5 codes, 4 factories) + withErrorHandler (log structuré)
- ServiceError remplacee par AppError dans 3 services
- 17 routes migrees vers withErrorHandler ou logging ameliore
- Toutes les routes retournent des erreurs generiques au client (jamais de details Supabase)
- 29 tests passent, 0 erreur TS, build OK

### Change Log

- 2026-04-12: Story 0.4 complete — error handling standardise sur 17 routes

### File List

**New files:**
- lib/errors.ts
- lib/services/__tests__/errors.test.ts

**Modified files:**
- lib/services/loyalty.service.ts (ServiceError → AppError)
- lib/services/customer.service.ts (ServiceError → AppError)
- lib/services/auth.service.ts (ServiceError → AppError)
- lib/services/__tests__/loyalty.service.test.ts
- lib/services/__tests__/customer.service.test.ts
- lib/services/__tests__/auth.service.test.ts
- app/api/scan/route.ts
- app/api/card/add/route.ts
- app/api/card/deduct/route.ts
- app/api/card/claim-reward/route.ts
- app/api/card/reset/route.ts
- app/api/join/route.ts
- app/api/auth/send-otp/route.ts
- app/api/auth/verify-otp/route.ts
- app/api/auth/add-email/route.ts
- app/api/dashboard/kpis/route.ts
- app/api/dashboard/top-clients/route.ts
- app/api/dashboard/visits-week/route.ts
- app/api/dashboard/export-clients/route.ts
- app/api/push/broadcast/route.ts
- app/api/wallet/[cardId]/route.ts
- app/api/recover/route.ts
- app/api/card/update-profile/route.ts
