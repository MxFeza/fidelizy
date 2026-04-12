# Story 0.3 : Extraction services metier (Strangler Fig core)

Status: review

## Story

En tant que developpeur,
je veux une couche service qui isole la logique metier des routes API,
afin que chaque route devienne un wrapper fin de 20-30 lignes.

## Acceptance Criteria

1. **Given** les routes actuelles contiennent 200-300 lignes de logique inline
   **When** les services sont extraits
   **Then** `lib/services/loyalty.service.ts` gere toute la logique tampons/points (scan, add, deduct, reset, claim) — elimine les ~220 lignes dupliquees entre scan et card/add

2. **And** `lib/services/customer.service.ts` gere inscription, recuperation, RGPD

3. **And** `lib/services/notification.service.ts` expose `notifyClient(cardId, event, payload)` et dispatche sur tous les canaux actifs (push web, Apple Wallet, futur Google Wallet)

4. **And** `lib/services/referral.service.ts` gere parrainage (code, attribution, bonus)

5. **And** `lib/services/auth.service.ts` gere OTP client + session commercant

6. **And** les routes API existantes appellent les services au lieu du code inline

7. **And** chaque service a ses schemas de validation Zod (`*.schemas.ts`)

8. **And** les tests unitaires Vitest couvrent chaque service

## Tasks / Subtasks

- [x] Task 1 — Setup Vitest + Zod (AC: #7, #8)
  - [x] 1.1 Installer vitest, zod, @supabase/supabase-js mock
  - [x] 1.2 Creer `vitest.config.ts` a la racine
  - [x] 1.3 Ajouter script `"test:unit": "vitest"` dans package.json
  - [x] 1.4 Creer `lib/services/__tests__/` + un test placeholder qui passe

- [x] Task 2 — `lib/services/loyalty.service.ts` + schemas (AC: #1)
  - [x] 2.1 Creer `lib/services/loyalty.schemas.ts` — schemas Zod pour earnStamps, earnPoints, deductStamps, deductPoints, claimReward, resetCard
  - [x] 2.2 Creer `lib/services/loyalty.service.ts` — extraire la logique dupliquee de `app/api/scan/route.ts` et `app/api/card/add/route.ts`
  - [x] 2.3 Fonctions: `scanCard`, `addToCard`, `deductFromCard`, `claimReward`, `resetCard` + internal `earnStampsInternal`, `earnPointsInternal`
  - [x] 2.4 Refactorer `app/api/scan/route.ts` → wrapper fin (validation → service → response)
  - [x] 2.5 Refactorer `app/api/card/add/route.ts` → wrapper fin
  - [x] 2.6 Refactorer `app/api/card/deduct/route.ts` → wrapper fin
  - [x] 2.7 Refactorer `app/api/card/claim-reward/route.ts` → wrapper fin
  - [x] 2.8 Refactorer `app/api/card/reset/route.ts` → wrapper fin
  - [x] 2.9 Tests Vitest pour loyalty.service.ts (mock Supabase)

- [x] Task 3 — `lib/services/notification.service.ts` (AC: #3)
  - [x] 3.1 Creer `lib/services/notification.schemas.ts` — types NotificationEvent, payload
  - [x] 3.2 Creer `lib/services/notification.service.ts` — consolider `lib/push/sendPush.ts` + `lib/wallet/push.ts`
  - [x] 3.3 Fonction principale: `notifyClient(cardId, qrCodeId, event, payload)` — dispatche sur push web + Apple Wallet + (futur Google Wallet)
  - [x] 3.4 Fonctions secondaires: `broadcastToBusinessClients(businessId, payload)`
  - [x] 3.5 Refactorer `app/api/push/broadcast/route.ts` → wrapper fin
  - [x] 3.6 Cron push-inactive conserve en l'etat (logique specifique cron non reutilisable)
  - [x] 3.7 Les routes loyalty (scan, add, deduct, claim, reset) appellent `notifyClient` au lieu du code inline
  - [x] 3.8 Tests Vitest pour notification.service.ts

- [x] Task 4 — `lib/services/customer.service.ts` (AC: #2)
  - [x] 4.1 Creer `lib/services/customer.schemas.ts` — schemas Zod pour register, recover
  - [x] 4.2 Creer `lib/services/customer.service.ts` — extraire de `app/api/join/route.ts`
  - [x] 4.3 Fonctions: `registerCustomer(supabase, params)`, `findCustomerCards(supabase, params)`
  - [x] 4.4 Refactorer `app/api/join/route.ts` → wrapper fin
  - [x] 4.5 Refactorer `app/api/recover/route.ts` → wrapper fin
  - [x] 4.6 Tests Vitest pour customer.service.ts

- [x] Task 5 — `lib/services/referral.service.ts` (AC: #4)
  - [x] 5.1 Creer `lib/services/referral.schemas.ts`
  - [x] 5.2 Creer `lib/services/referral.service.ts` — migrer de `lib/referral.ts` + logique parrainage de join/route.ts
  - [x] 5.3 Fonctions: `generateReferralCode(firstName, phone)`, `findCardByReferralCode(code, businessId, supabase)`, `processReferral(supabase, params)`
  - [x] 5.4 Supprimer `lib/referral.ts` (remplace par le service)
  - [x] 5.5 Tests Vitest pour referral.service.ts

- [x] Task 6 — `lib/services/auth.service.ts` (AC: #5)
  - [x] 6.1 Creer `lib/services/auth.schemas.ts`
  - [x] 6.2 Creer `lib/services/auth.service.ts` — extraire de `app/api/auth/send-otp/route.ts` + `verify-otp/route.ts` + `add-email/route.ts`
  - [x] 6.3 Fonctions: `sendOtp(supabase, params)`, `verifyOtp(supabase, params)`, `addEmailAndSendOtp(supabase, params)`
  - [x] 6.4 Refactorer les 3 routes auth → wrappers fins
  - [x] 6.5 Tests Vitest pour auth.service.ts

- [x] Task 7 — Refactorer les routes restantes + validation finale (AC: #6)
  - [x] 7.1 `card/update-profile` non modifie — pas de logique metier a extraire (simple update)
  - [x] 7.2 Toutes les routes modifiees suivent le pattern: validation → appel service → response JSON
  - [x] 7.3 `lib/push/sendPush.ts` et `lib/wallet/push.ts` importes par `notification.service.ts`
  - [x] 7.4 TypeScript compile sans erreur (tsc --noEmit)
  - [x] 7.5 22 tests Vitest passent (5 fichiers)

## Dev Notes

### Architecture du refactoring

Pattern cible pour chaque route API (20-30 lignes max):
```typescript
import { schema } from '@/lib/services/loyalty.schemas'
import { earnStamps } from '@/lib/services/loyalty.service'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const result = await earnStamps(supabase, parsed.data)
  return NextResponse.json(result)
}
```

### Signature des services

Chaque service recoit le client Supabase en parametre (pas d'import global) pour la testabilite:
```typescript
// lib/services/loyalty.service.ts
import { SupabaseClient } from '@supabase/supabase-js'

export async function earnStamps(
  supabase: SupabaseClient,
  params: EarnStampsInput
): Promise<EarnStampsResult> { ... }
```

### Duplication critique a eliminer

`app/api/scan/route.ts` (lignes 80-183) et `app/api/card/add/route.ts` (lignes 63-163) partagent ~220 lignes identiques:
- Branchement stamps vs points
- Fetch business config
- Update loyalty_cards (current_stamps/current_points)
- Insert transaction
- Check reward tier thresholds
- Appel wallet/push notifications

**Solution:** Extraire dans `loyalty.service.ts` les fonctions `earnStamps()` et `earnPoints()` appelees par les DEUX routes.

### Modules existants a consolider

| Module existant | Destination service |
|----------------|-------------------|
| `lib/push/sendPush.ts` (109 lignes) | `notification.service.ts` (import interne) |
| `lib/wallet/push.ts` (96 lignes) | `notification.service.ts` (import interne) |
| `lib/wallet/generatePass.ts` (317 lignes) | NE PAS TOUCHER — reste en place, Apple Wallet protocol |
| `lib/referral.ts` (45 lignes) | `referral.service.ts` (remplacer) |
| `lib/ratelimit.ts` (64 lignes) | NE PAS TOUCHER — reste dans les routes |
| `lib/types.ts` (80 lignes) | NE PAS TOUCHER — les schemas Zod completent mais ne remplacent pas |

### NE PAS TOUCHER

- `middleware.ts` — auth middleware, fonctionne
- `lib/ratelimit.ts` — rate limiting reste dans les routes (pas dans les services)
- `lib/wallet/generatePass.ts` — Apple Wallet protocol complexe, pas de refactoring
- `lib/supabase/` — clients Supabase, infrastructure
- Structure des dossiers `app/api/` — PAS de renommage de routes

### Tests Vitest — strategie mock

```typescript
// lib/services/__tests__/loyalty.service.test.ts
import { vi } from 'vitest'

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn(),
}

// Tester chaque fonction service avec des mocks Supabase
// Verifier: retour correct, appels Supabase corrects, edge cases
```

### Zod — pattern de schemas

```typescript
// lib/services/loyalty.schemas.ts
import { z } from 'zod'

export const earnStampsSchema = z.object({
  cardId: z.string().uuid(),
  businessId: z.string().uuid(),
  amount: z.number().int().positive().default(1),
})
export type EarnStampsInput = z.infer<typeof earnStampsSchema>
```

Les schemas servent AUSSI de DTOs typesafe — les types inferes remplacent les interfaces manuelles pour les inputs services.

### notification.service.ts — interface cible (ARCH2)

```typescript
type NotificationEvent =
  | 'stamp_added'
  | 'reward_reached'
  | 'referral_success'
  | 'welcome'
  | 'broadcast'
  | 'inactive_reminder'

async function notifyClient(
  cardId: string,
  event: NotificationEvent,
  payload: { title: string; body: string; data?: Record<string, unknown> }
): Promise<{ sent: string[]; failed: string[] }>
```

Dispatche automatiquement vers:
1. Push web (VAPID) — si `push_subscriptions` existe pour ce cardId
2. Apple Wallet (APNs) — si `wallet_registrations` existe pour ce qr_code_id
3. Google Wallet — placeholder pour Epic 6 (slot vide, pas d'implementation)

### Ordre d'execution recommande

1. **Task 1** (setup) → fondation
2. **Task 3** (notification) → prerequis pour loyalty (les routes loyalty appellent notifyClient)
3. **Task 5** (referral) → prerequis pour customer (join utilise referral)
4. **Task 2** (loyalty) → plus grosse extraction, elimine la duplication critique
5. **Task 4** (customer) → depend de referral.service et notification.service
6. **Task 6** (auth) → independant, peut aller en parallele avec customer
7. **Task 7** (validation) → final, verification complete

### Project Structure Notes

Structure cible apres extraction:
```
lib/
  services/
    loyalty.service.ts        # ~150 lignes (consolide 558 lignes de routes)
    loyalty.schemas.ts         # ~60 lignes
    customer.service.ts        # ~100 lignes (consolide 246 lignes)
    customer.schemas.ts        # ~30 lignes
    notification.service.ts    # ~120 lignes (consolide 245 lignes push + wallet push)
    notification.schemas.ts    # ~20 lignes
    referral.service.ts        # ~60 lignes (remplace lib/referral.ts)
    referral.schemas.ts        # ~20 lignes
    auth.service.ts            # ~70 lignes (consolide 173 lignes auth)
    auth.schemas.ts            # ~25 lignes
    __tests__/
      loyalty.service.test.ts
      customer.service.test.ts
      notification.service.test.ts
      referral.service.test.ts
      auth.service.test.ts
  push/
    sendPush.ts               # CONSERVE — importe par notification.service
  wallet/
    generatePass.ts           # CONSERVE — NE PAS TOUCHER
    push.ts                   # CONSERVE — importe par notification.service
  referral.ts                 # SUPPRIMER (remplace par referral.service.ts)
  ratelimit.ts                # CONSERVE
  types.ts                    # CONSERVE
```

### References

- [Source: docs/planning-artifacts/epics.md#Story 0.3] — AC et requirements
- [Source: docs/planning-artifacts/architecture-decisions.md#Extraction Services Progressive] — pattern d'extraction, structure lib/services/
- [Source: docs/planning-artifacts/architecture-decisions.md#Notifications — Service unifie] — interface notifyClient
- [Source: docs/planning-artifacts/architecture-decisions.md#Validation des Donnees — Zod] — strategie schemas
- [Source: docs/planning-artifacts/architecture-decisions.md#Framework de Tests] — Vitest services + Playwright E2E

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Zod 4 breaking change: `z.record()` requires 2 args (key, value) vs Zod 3's 1 arg
- E2E test `parrainage.spec.ts` imported old `lib/referral` — updated to `lib/services/referral.service`

### Completion Notes List

- 5 services extraits: loyalty, notification, customer, referral, auth
- 10 schemas Zod crees (2 par service)
- 12 routes API refactorees en wrappers fins
- ~220 lignes de duplication eliminee (scan vs card/add)
- `lib/referral.ts` supprime (remplace par `referral.service.ts`)
- `lib/push/sendPush.ts` et `lib/wallet/push.ts` conserves, importes par notification.service
- 22 tests unitaires Vitest passent, 0 erreur TypeScript

### Change Log

- 2026-04-12: Implementation complete — 5 services, 10 schemas, 22 tests, 12 routes refactorees

### File List

**New files:**
- vitest.config.ts
- lib/services/loyalty.service.ts
- lib/services/loyalty.schemas.ts
- lib/services/notification.service.ts
- lib/services/notification.schemas.ts
- lib/services/customer.service.ts
- lib/services/customer.schemas.ts
- lib/services/referral.service.ts
- lib/services/referral.schemas.ts
- lib/services/auth.service.ts
- lib/services/auth.schemas.ts
- lib/services/__tests__/loyalty.service.test.ts
- lib/services/__tests__/notification.service.test.ts
- lib/services/__tests__/customer.service.test.ts
- lib/services/__tests__/referral.service.test.ts
- lib/services/__tests__/auth.service.test.ts

**Modified files:**
- package.json (added zod, vitest, test:unit scripts)
- app/api/scan/route.ts
- app/api/card/add/route.ts
- app/api/card/deduct/route.ts
- app/api/card/claim-reward/route.ts
- app/api/card/reset/route.ts
- app/api/join/route.ts
- app/api/recover/route.ts
- app/api/auth/send-otp/route.ts
- app/api/auth/verify-otp/route.ts
- app/api/auth/add-email/route.ts
- app/api/push/broadcast/route.ts
- tests/e2e/parrainage.spec.ts

**Deleted files:**
- lib/referral.ts
