/**
 * Tests des schemas Zod inline aux routes API critiques (batch A + C
 * audit security 2026-05-23). Les schemas sont exportes depuis leurs
 * route.ts respectifs pour permettre l'isolation en test.
 *
 * Couvre :
 *  - addCardSchema (/api/me/add-card POST)
 *  - deleteDataSchema (/api/card/delete-data DELETE)
 *  - gamificationUpdateSchema (/api/dashboard/gamification PUT)
 *  - pushSubscriptionSchema, subscribePostSchema, subscribeDeleteSchema
 *    (/api/push/subscribe POST + DELETE)
 *  - validateClaimSchema (/api/scan/validate-claim POST)
 */
import { describe, it, expect } from 'vitest'

import { addCardSchema } from '@/app/api/me/add-card/route'
import { deleteDataSchema } from '@/app/api/card/delete-data/route'
import { gamificationUpdateSchema } from '@/app/api/dashboard/gamification/route'
import {
  pushSubscriptionSchema,
  subscribePostSchema,
  subscribeDeleteSchema,
} from '@/app/api/push/subscribe/route'
import { validateClaimSchema } from '@/app/api/scan/validate-claim/route'

const VALID_UUID = '11111111-1111-4111-8111-111111111111'

describe('addCardSchema', () => {
  it('accepts a 6-char alphanumeric short_code', () => {
    const r = addCardSchema.safeParse({ short_code: '89Q5BK' })
    expect(r.success).toBe(true)
  })

  it('trims + uppercases the short_code', () => {
    const r = addCardSchema.safeParse({ short_code: '  89q5bk  ' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.short_code).toBe('89Q5BK')
  })

  it('rejects shorter than 4 chars', () => {
    expect(addCardSchema.safeParse({ short_code: 'AB' }).success).toBe(false)
  })

  it('rejects longer than 12 chars', () => {
    expect(addCardSchema.safeParse({ short_code: 'A'.repeat(13) }).success).toBe(false)
  })

  it('rejects non-string short_code', () => {
    expect(addCardSchema.safeParse({ short_code: 12345 }).success).toBe(false)
  })
})

describe('deleteDataSchema', () => {
  it('accepts valid uuid', () => {
    expect(deleteDataSchema.safeParse({ card_id: VALID_UUID }).success).toBe(true)
  })

  it('rejects non-uuid string', () => {
    expect(deleteDataSchema.safeParse({ card_id: 'not-a-uuid' }).success).toBe(false)
  })

  it('rejects missing card_id', () => {
    expect(deleteDataSchema.safeParse({}).success).toBe(false)
  })
})

describe('gamificationUpdateSchema', () => {
  it('accepts integer 0..3', () => {
    for (const v of [0, 1, 2, 3]) {
      expect(gamificationUpdateSchema.safeParse({ initial_stamps: v }).success).toBe(true)
    }
  })

  it('rejects negative', () => {
    expect(gamificationUpdateSchema.safeParse({ initial_stamps: -1 }).success).toBe(false)
  })

  it('rejects above 3', () => {
    expect(gamificationUpdateSchema.safeParse({ initial_stamps: 4 }).success).toBe(false)
  })

  it('rejects non-integer', () => {
    expect(gamificationUpdateSchema.safeParse({ initial_stamps: 1.5 }).success).toBe(false)
  })

  it('rejects non-number', () => {
    expect(gamificationUpdateSchema.safeParse({ initial_stamps: '2' }).success).toBe(false)
  })
})

describe('pushSubscriptionSchema', () => {
  it('accepts minimal valid subscription (endpoint only)', () => {
    expect(
      pushSubscriptionSchema.safeParse({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc' })
        .success,
    ).toBe(true)
  })

  it('accepts subscription with VAPID keys', () => {
    expect(
      pushSubscriptionSchema.safeParse({
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
        keys: { p256dh: 'pub-key', auth: 'auth-secret' },
        expirationTime: null,
      }).success,
    ).toBe(true)
  })

  it('rejects non-url endpoint', () => {
    expect(pushSubscriptionSchema.safeParse({ endpoint: 'not-a-url' }).success).toBe(false)
  })

  it('passthrough unknown fields (future browser extensions)', () => {
    const r = pushSubscriptionSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      futureField: 'whatever',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect((r.data as Record<string, unknown>).futureField).toBe('whatever')
    }
  })
})

describe('subscribePostSchema', () => {
  it('accepts valid cardId + subscription', () => {
    expect(
      subscribePostSchema.safeParse({
        cardId: VALID_UUID,
        subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc' },
      }).success,
    ).toBe(true)
  })

  it('rejects invalid cardId', () => {
    expect(
      subscribePostSchema.safeParse({
        cardId: 'not-uuid',
        subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc' },
      }).success,
    ).toBe(false)
  })
})

describe('subscribeDeleteSchema', () => {
  it('accepts valid cardId + endpoint url', () => {
    expect(
      subscribeDeleteSchema.safeParse({
        cardId: VALID_UUID,
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      }).success,
    ).toBe(true)
  })

  it('rejects non-url endpoint', () => {
    expect(
      subscribeDeleteSchema.safeParse({ cardId: VALID_UUID, endpoint: 'plain-text' }).success,
    ).toBe(false)
  })
})

describe('validateClaimSchema', () => {
  it('accepts code alone', () => {
    expect(validateClaimSchema.safeParse({ code: 'REWARD-123' }).success).toBe(true)
  })

  it('accepts claimId alone', () => {
    expect(validateClaimSchema.safeParse({ claimId: 'claim-abc' }).success).toBe(true)
  })

  it('accepts both', () => {
    expect(validateClaimSchema.safeParse({ code: 'R-1', claimId: 'c-1' }).success).toBe(true)
  })

  it('rejects empty object (refine)', () => {
    expect(validateClaimSchema.safeParse({}).success).toBe(false)
  })

  it('rejects when both are empty strings', () => {
    expect(validateClaimSchema.safeParse({ code: '', claimId: '' }).success).toBe(false)
  })

  it('trims code', () => {
    const r = validateClaimSchema.safeParse({ code: '  REWARD-123  ' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.code).toBe('REWARD-123')
  })
})
