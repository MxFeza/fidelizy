# Brief — Tests Vitest pour les services manquants

> **Objectif :** Atteindre une couverture ~80%+ sur 3 services critiques actuellement non testés.
> **Format de retour attendu :** PR markdown avec le contenu complet des fichiers de test à créer.
> **Stack tests :** Vitest 4.1.4, mocks `vi`, pas de DB réelle (full mock Supabase client).

## Contexte

Le projet a déjà 2 fichiers de tests (vérifiés par audit 2026-05-05) :
- `app/__tests__/auth.test.ts` (signUp, signIn, signOut)
- `app/__tests__/customer.test.ts` (getCustomer, updateCustomer)
- `lib/services/__tests__/loyalty.service.test.ts` (scanCard, deductFromCard, claimReward, resetCard) — **pattern à reproduire**

3 services métiers critiques manquent de tests :

| Service | Path | Priorité | Story d'origine |
|---------|------|----------|-----------------|
| `claim.service` | `lib/services/claim.service.ts` | **HIGH** | Story 4.4 (flow réclamation) |
| `referral.service` | `lib/services/referral.service.ts` | MEDIUM | Story 4.5 |
| `notification.service` | `lib/services/notification.service.ts` | LOW (canaux externes mockés) | Cross-cutting |

---

## Pattern à reproduire (référence)

Lire et imiter `lib/services/__tests__/loyalty.service.test.ts`. Points clés :

- Imports mockés AVANT l'import du service :
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/wallet/generatePass', () => ({
  setPendingWalletAction: vi.fn(),
}))

vi.mock('@/lib/services/notification.service', () => ({
  notifyClient: vi.fn().mockResolvedValue({ sent: ['web_push'], failed: [] }),
  broadcastToBusinessClients: vi.fn().mockResolvedValue(undefined),
}))

import { scanCard, ... } from '../loyalty.service'
```

- Helper `mockChain(resolvedData)` qui crée un objet supabase chainable retournant `resolvedData` sur `.single()` ou `.throwOnError()`.

- Pattern avec `fromCallCount` pour différencier les retours selon l'ordre des appels `from('table_X')` :
```typescript
let fromCallCount = 0
const supabase = {
  from: vi.fn().mockImplementation(() => {
    fromCallCount++
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fromCallCount === 1 ? card : business }),
    }
  }),
  rpc: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { ... }, error: null }),
  }),
}
```

- `beforeEach(() => vi.clearAllMocks())` dans chaque describe.

---

## 1. claim.service.ts — couverture demandée

### Lecture du service
Fichier : `lib/services/claim.service.ts` (~200 lignes). Exporte 2 fonctions :
- `createClaimRequest(supabase, { cardId, tierId? })`
- `validateClaim(supabase, { code, merchantId })`

### Tests à écrire

#### `describe('createClaimRequest')`

1. **`it('throws 404 if card not found')`** — supabase mock retourne `data: null` au 1er from → expect throw `AppError('Carte introuvable', 404)`

2. **`it('throws 404 if business not found')`** — card OK mais business mock null → expect throw `AppError('Commerce introuvable', 404)`

3. **`it('throws 400 if not eligible (stamps insufficient)')`** — card.current_stamps = 5, business.stamps_required = 10, business.loyalty_type = 'stamps' → expect throw containing "pas encore débloquée"

4. **`it('throws 400 if not eligible (points insufficient)')`** — card.current_points = 30, tier.threshold = 100, loyalty_type = 'points' → expect throw

5. **`it('cancels previous pending claims for same card before insert')`** — supabase mock spy sur `.update({ status: 'cancelled' }).eq().eq()` doit être appelé avant l'INSERT. Vérifier ordre des appels.

6. **`it('generates a 6-char code from charset ABCDEFGHJKMNPQRSTUVWXYZ23456789')`** — appel valide, vérifier que le code retourné matche `/^[A-HJKMNPQRSTUVWXYZ23456789]{6}$/`

7. **`it('retries up to 5 times if code collision (existing pending)')`** — mock `.maybeSingle()` retourne `{id: 'existing'}` 3 fois puis `null` → le code généré doit être différent à chaque tentative, succès au 4e

8. **`it('throws 500 if 5 collisions')`** — mock retourne toujours existing → expect throw "Impossible de générer un code unique"

9. **`it('sets expires_at = now + 5 minutes')`** — vérifier que la date insérée est ~5min dans le futur (tolérance 1s)

10. **`it('persists tier_id null for virtual tier (single-tier stamps)')`** — tier.id starts with 'virtual-' → INSERT body should have `tier_id: null`

11. **`it('persists tier_id UUID for explicit JSONB tier')`** — tier.id = 'real-uuid' → INSERT body should have `tier_id: 'real-uuid'`

12. **`it('returns the inserted record correctly mapped (id/code/rewardName/...)')`** — mock retour DB et vérifier la shape du return

#### `describe('validateClaim')`

13. **`it('throws 404 if code not found')`** — supabase retourne null

14. **`it('throws 404 if code belongs to another business')`** — `.eq('business_id', merchantId)` filter — mock retourne null avec autre business

15. **`it('throws 409 if status already validated')`** — status='validated' → expect throw "Code déjà utilisé"

16. **`it('throws 410 if status expired')`** — expect throw "Code expiré"

17. **`it('throws 410 if expires_at < now (and updates status to expired)')`** — expires_at = past → vérifier UPDATE status='expired' ET throw

18. **`it('atomic UPDATE WHERE status=pending prevents double-validation')`** — mock l'UPDATE retourne null (race lost) → expect throw "Code déjà utilisé (concurrence)"

19. **`it('calls resetCard for stamps loyalty_type')`** — mock `resetCard` avec `vi.mock`, vérifier qu'il est appelé avec les bons args

20. **`it('calls claimReward for points loyalty_type with tier_id')`** — idem avec `claimReward`

21. **`it('skips claim execution if loyalty_type=points but tier_id null')`** — edge case (ne devrait pas arriver mais sécurité)

22. **`it('returns success result with rewardName + customerName')`** — mock loyalty_cards.customers join, vérifier que customerName est bien extrait

### Charset à utiliser dans les tests
```typescript
const CLAIM_CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
```

---

## 2. referral.service.ts — couverture demandée

### Lecture du service
Fichier : `lib/services/referral.service.ts`. Exporte :
- `generateReferralCode(firstName, phone)` — pure function
- `findCardByReferralCode(code, businessId, supabase)`
- `processReferral(supabase, params)`

### Tests à écrire

#### `describe('generateReferralCode')` — pure function tests

1. **`it('returns format PRENOM-XXXX where PRENOM = first 4 chars upper-padded with X')`** — `("Jean", "0612345678") → "JEAN-5678"`

2. **`it('pads firstName with X if shorter than 4 chars')`** — `("Al", "0612345678") → "ALXX-5678"`

3. **`it('truncates firstName to 4 chars if longer')`** — `("Jean-Pierre", "0612345678") → "JEAN-5678"`

4. **`it('uses last 4 chars of phone as suffix')`** — `("Marie", "+33612345678") → "MARI-5678"`

#### `describe('findCardByReferralCode')`

5. **`it('returns null for invalid format (no dash)')`** — `code = "JEANXXXX"` → null

6. **`it('returns null for invalid format (suffix != 4 chars)')`** — `code = "JEAN-12"` → null

7. **`it('returns null if no cards in business')`** — supabase retourne `data: []` → null

8. **`it('returns matching card.id + customer_id when prefix and suffix match')`** — mock 3 cards, 1 match → return that card

9. **`it('returns null if no card matches')`** — mock cards exist but none has matching first_name/phone

#### `describe('processReferral')`

10. **`it('does nothing if business.referral_enabled === false')`** — mock business référral_enabled=false → no INSERT, no notify

11. **`it('does nothing if referrerCard not found via code')`** — `findCardByReferralCode` returns null

12. **`it('inserts a referrals row with referrerPoints and referredPoints from business config')`** — vérifier INSERT body : `referrer_points_awarded: 5, referred_points_awarded: 2`

13. **`it('uses default 5/2 points if business config null')`** — mock business referrer_bonus=null → default 5

14. **`it('updates referrer card current_points (+ referrerPoints)')`** — vérifier UPDATE current_points

15. **`it('inserts a "earn" transaction for the referrer')`** — vérifier INSERT transactions

16. **`it('calls notifyClient for the referrer with success message')`** — vi.mock notifyClient, vérifier appel

17. **`it('updates referred card current_points = referredPoints')`** — vérifier UPDATE

18. **`it('inserts a "earn" transaction for the referred (welcome bonus)')`** — vérifier

19. **`it('notifies referred customer with welcome message')`** — vi.mock notifyClient

20. **`it('catches notify errors silently (does not throw)')`** — mock notifyClient reject → processReferral resolves

### Mocks à configurer

```typescript
vi.mock('@/lib/wallet/generatePass', () => ({
  setPendingWalletAction: vi.fn(),
}))
vi.mock('@/lib/services/notification.service', () => ({
  notifyClient: vi.fn().mockResolvedValue({ sent: [], failed: [] }),
}))
```

---

## 3. notification.service.ts — couverture demandée

### Lecture du service
Fichier : `lib/services/notification.service.ts`. Exporte :
- `notifyClient(cardId, qrCodeId, payload)` — multi-channel : web push + Apple Wallet
- `broadcastToBusinessClients(businessId, payload)` — broadcast à tous les clients du commerce

### Tests à écrire

#### `describe('notifyClient')`

1. **`it('sends to all 2 channels (web push + Apple Wallet) on success')`** — vi.mock `sendPushToCard` + `notifyWalletDevices` — both succeed → return `{ sent: ['web_push', 'apple_wallet'], failed: [] }`

2. **`it('captures web push failure but continues to wallet')`** — web push reject, wallet succeed → return `{ sent: ['apple_wallet'], failed: ['web_push'] }`

3. **`it('captures wallet failure but continues')`** — wallet reject → return failed: ['apple_wallet']

4. **`it('returns both failed if both channels fail')`** — web push + wallet reject → `{ sent: [], failed: ['web_push', 'apple_wallet'] }`

5. **`it('logs to console.error on each failure (does not throw)')`** — `vi.spyOn(console, 'error')` → vérifier appels mais notifyClient resolve

6. **`it('passes correct URL to web push (https://fidelizy.vercel.app/card/{qrCodeId})')`** — vérifier que sendPushToCard est appelé avec url contenant `qrCodeId`

#### `describe('broadcastToBusinessClients')`

7. **`it('queries push_subscriptions count by business_id')`** — vérifier `.from('push_subscriptions').select('id', { count: 'exact', head: true }).eq('business_id', ...)`

8. **`it('returns recipientCount from supabase count result')`** — mock count: 42 → return `{ recipientCount: 42 }`

9. **`it('returns recipientCount: 0 if count is null')`** — mock count: null → return `{ recipientCount: 0 }`

10. **`it('calls sendPushToAllBusinessClients with title + body')`** — vi.mock + vérifier args

### Mocks à configurer

```typescript
vi.mock('@/lib/push/sendPush', () => ({
  sendPushToCard: vi.fn(),
  sendPushToAllBusinessClients: vi.fn(),
}))
vi.mock('@/lib/wallet/push', () => ({
  notifyWalletDevices: vi.fn(),
}))
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 42 }),
    }),
  })),
}))
```

---

## Coverage attendue & vérification

### Commande de test
```bash
npm test                          # run all tests once
npm test -- --coverage            # avec coverage v8 (déjà installé)
npm test -- claim.service         # pattern matching
```

### Cibles
- `claim.service.ts` : ≥80% lines, ≥75% branches
- `referral.service.ts` : ≥80% lines, ≥75% branches
- `notification.service.ts` : ≥75% lines (canaux externes mockés)

### Output config
Si `vitest.config.ts` n'a pas la config coverage, l'ajouter :
```typescript
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['lib/services/**/*.ts'],
      exclude: ['lib/services/**/__tests__/**', 'lib/services/**/*.schemas.ts'],
    },
  },
})
```

---

## Format de réponse attendu

Pour chaque fichier de test à créer, donner :

```markdown
### lib/services/__tests__/claim.service.test.ts (CREATE)

\`\`\`typescript
[contenu complet, ~400 lignes]
\`\`\`
```

3 fichiers attendus :
1. `lib/services/__tests__/claim.service.test.ts`
2. `lib/services/__tests__/referral.service.test.ts`
3. `lib/services/__tests__/notification.service.test.ts`

Si besoin de modifier `vitest.config.ts` pour la coverage, l'inclure aussi en MODIFY.

**Section "Questions ouvertes"** : si un point du service est ambigu, lister les questions plutôt que de deviner.
