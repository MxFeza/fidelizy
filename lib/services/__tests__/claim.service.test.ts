import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../loyalty.service', () => ({
  resetCard: vi.fn().mockResolvedValue({ success: true }),
  claimReward: vi.fn().mockResolvedValue({ success: true, message: 'ok', newPoints: 0 }),
}))

import { createClaimRequest, validateClaim } from '../claim.service'
import { resetCard, claimReward } from '../loyalty.service'
import { AppError } from '@/lib/errors'

// ── Step-based supabase mock ──
//
// Each `from(table)` call pops the next step. A step describes how the chain
// should resolve and lets the test inspect what was passed to update/insert.

interface Step {
  table: string
  // Result for terminal methods. `data` for .single()/.maybeSingle(),
  // or `throwOnErrorResult` for .throwOnError().
  data?: unknown
  throwOnErrorResult?: { data: unknown; error: unknown }
  // Capture (filled by chain when called)
  insertBody?: unknown
  updateBody?: unknown
  eqArgs?: Array<[string, unknown]>
}

function makeSupabase(steps: Step[]) {
  let cursor = 0
  const calls: Step[] = []

  const supabase = {
    from: vi.fn().mockImplementation((table: string) => {
      const step = steps[cursor++]
      if (!step) {
        throw new Error(`Unexpected from('${table}') call (step ${cursor})`)
      }
      step.table = step.table || table
      step.eqArgs = []
      calls.push(step)

      const chain: Record<string, ReturnType<typeof vi.fn>> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockImplementation((col: string, val: unknown) => {
        step.eqArgs!.push([col, val])
        return chain
      })
      chain.update = vi.fn().mockImplementation((body: unknown) => {
        step.updateBody = body
        return chain
      })
      chain.insert = vi.fn().mockImplementation((body: unknown) => {
        step.insertBody = body
        return chain
      })
      chain.single = vi.fn().mockResolvedValue({ data: step.data ?? null })
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: step.data ?? null })
      chain.throwOnError = vi
        .fn()
        .mockResolvedValue(step.throwOnErrorResult ?? { data: null, error: null })
      return chain
    }),
  }

  return { supabase, calls }
}

const VALID_CODE_REGEX = /^[A-HJ-NP-Z2-9]{6}$/

const baseBusinessStamps = {
  id: 'biz-1',
  loyalty_type: 'stamps',
  reward_tiers: [],
  stamps_required: 10,
  stamps_reward: 'Café offert',
}

const baseBusinessPoints = {
  id: 'biz-1',
  loyalty_type: 'points',
  reward_tiers: [
    { id: 'tier-real-uuid', emoji: '🎁', name: 'Boisson offerte', threshold: 100 },
  ],
  stamps_required: null,
  stamps_reward: '',
}

describe('claim.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createClaimRequest', () => {
    it('throws 404 if card not found', async () => {
      const { supabase } = makeSupabase([{ table: 'loyalty_cards', data: null }])

      await expect(
        createClaimRequest(supabase as never, { cardId: 'unknown' })
      ).rejects.toThrow(/Carte introuvable/)
    })

    it('throws 404 if business not found', async () => {
      const { supabase } = makeSupabase([
        { table: 'loyalty_cards', data: { id: 'card-1', business_id: 'biz-1', current_stamps: 10, current_points: 0 } },
        { table: 'businesses', data: null },
      ])

      await expect(
        createClaimRequest(supabase as never, { cardId: 'qr-123' })
      ).rejects.toThrow(/Commerce introuvable/)
    })

    it('throws 400 if not eligible (stamps insufficient)', async () => {
      const { supabase } = makeSupabase([
        { table: 'loyalty_cards', data: { id: 'card-1', business_id: 'biz-1', current_stamps: 5, current_points: 0 } },
        { table: 'businesses', data: baseBusinessStamps },
      ])

      await expect(
        createClaimRequest(supabase as never, { cardId: 'qr-123' })
      ).rejects.toThrow(/pas encore débloquée/)
    })

    it('throws 400 if not eligible (points insufficient)', async () => {
      const { supabase } = makeSupabase([
        { table: 'loyalty_cards', data: { id: 'card-1', business_id: 'biz-1', current_stamps: 0, current_points: 30 } },
        { table: 'businesses', data: baseBusinessPoints },
      ])

      await expect(
        createClaimRequest(supabase as never, { cardId: 'qr-123', tierId: 'tier-real-uuid' })
      ).rejects.toThrow(/pas encore débloquée/)
    })

    it('cancels previous pending claims for same card before insert', async () => {
      const insertedRow = {
        id: 'req-1',
        code: 'ABCDEF',
        reward_name: 'Café offert',
        points_cost: null,
        loyalty_type: 'stamps',
        expires_at: new Date().toISOString(),
      }
      const { supabase, calls } = makeSupabase([
        { table: 'loyalty_cards', data: { id: 'card-1', business_id: 'biz-1', current_stamps: 10, current_points: 0 } },
        { table: 'businesses', data: baseBusinessStamps },
        { table: 'claim_requests', throwOnErrorResult: { data: null, error: null } }, // cancel
        { table: 'claim_requests', data: null }, // uniqueness check #1 (no collision)
        { table: 'claim_requests', data: insertedRow }, // insert
      ])

      await createClaimRequest(supabase as never, { cardId: 'qr-123' })

      // The 3rd `from` call must be the cancel UPDATE with status:'cancelled'
      expect(calls[2].table).toBe('claim_requests')
      expect(calls[2].updateBody).toEqual({ status: 'cancelled' })
      // It must run BEFORE the INSERT (which is at index 4)
      expect(calls[4].insertBody).toBeDefined()
    })

    it('generates a 6-char code from charset ABCDEFGHJKMNPQRSTUVWXYZ23456789', async () => {
      const insertedRow = {
        id: 'req-1',
        code: 'PLACEHOLDER',
        reward_name: 'Café offert',
        points_cost: null,
        loyalty_type: 'stamps',
        expires_at: new Date().toISOString(),
      }
      const { supabase, calls } = makeSupabase([
        { table: 'loyalty_cards', data: { id: 'card-1', business_id: 'biz-1', current_stamps: 10, current_points: 0 } },
        { table: 'businesses', data: baseBusinessStamps },
        { table: 'claim_requests', throwOnErrorResult: { data: null, error: null } },
        { table: 'claim_requests', data: null },
        { table: 'claim_requests', data: insertedRow },
      ])

      await createClaimRequest(supabase as never, { cardId: 'qr-123' })

      const insertBody = calls[4].insertBody as { code: string }
      expect(insertBody.code).toMatch(VALID_CODE_REGEX)
      expect(insertBody.code).toHaveLength(6)
      // No ambiguous chars
      expect(insertBody.code).not.toMatch(/[01ILO]/)
    })

    it('retries up to 5 times if code collision then succeeds', async () => {
      const insertedRow = {
        id: 'req-1',
        code: 'OK0000',
        reward_name: 'Café offert',
        points_cost: null,
        loyalty_type: 'stamps',
        expires_at: new Date().toISOString(),
      }
      const { supabase, calls } = makeSupabase([
        { table: 'loyalty_cards', data: { id: 'card-1', business_id: 'biz-1', current_stamps: 10, current_points: 0 } },
        { table: 'businesses', data: baseBusinessStamps },
        { table: 'claim_requests', throwOnErrorResult: { data: null, error: null } },
        { table: 'claim_requests', data: { id: 'collision-1' } }, // attempt 1: collision
        { table: 'claim_requests', data: { id: 'collision-2' } }, // attempt 2: collision
        { table: 'claim_requests', data: { id: 'collision-3' } }, // attempt 3: collision
        { table: 'claim_requests', data: null },                  // attempt 4: free
        { table: 'claim_requests', data: insertedRow },           // insert
      ])

      const result = await createClaimRequest(supabase as never, { cardId: 'qr-123' })

      expect(result.code).toBe('OK0000')
      // 1 card + 1 business + 1 cancel + 4 uniqueness + 1 insert = 8 from calls
      expect(supabase.from).toHaveBeenCalledTimes(8)
      // Inserted code must be valid format (was generated, not from collision)
      const insertBody = calls[7].insertBody as { code: string }
      expect(insertBody.code).toMatch(VALID_CODE_REGEX)
    })

    it('throws 500 if 5 collisions in a row', async () => {
      const collision = { id: 'existing' }
      const { supabase } = makeSupabase([
        { table: 'loyalty_cards', data: { id: 'card-1', business_id: 'biz-1', current_stamps: 10, current_points: 0 } },
        { table: 'businesses', data: baseBusinessStamps },
        { table: 'claim_requests', throwOnErrorResult: { data: null, error: null } },
        { table: 'claim_requests', data: collision },
        { table: 'claim_requests', data: collision },
        { table: 'claim_requests', data: collision },
        { table: 'claim_requests', data: collision },
        { table: 'claim_requests', data: collision },
      ])

      await expect(
        createClaimRequest(supabase as never, { cardId: 'qr-123' })
      ).rejects.toThrow(/Impossible de générer un code unique/)
    })

    it('sets expires_at ~5 minutes in the future (±2s tolerance)', async () => {
      const insertedRow = {
        id: 'req-1',
        code: 'ABCDEF',
        reward_name: 'Café offert',
        points_cost: null,
        loyalty_type: 'stamps',
        expires_at: new Date().toISOString(),
      }
      const { supabase, calls } = makeSupabase([
        { table: 'loyalty_cards', data: { id: 'card-1', business_id: 'biz-1', current_stamps: 10, current_points: 0 } },
        { table: 'businesses', data: baseBusinessStamps },
        { table: 'claim_requests', throwOnErrorResult: { data: null, error: null } },
        { table: 'claim_requests', data: null },
        { table: 'claim_requests', data: insertedRow },
      ])

      const before = Date.now()
      await createClaimRequest(supabase as never, { cardId: 'qr-123' })
      const after = Date.now()

      const insertBody = calls[4].insertBody as { expires_at: string }
      const exp = new Date(insertBody.expires_at).getTime()
      expect(exp).toBeGreaterThanOrEqual(before + 5 * 60_000 - 2000)
      expect(exp).toBeLessThanOrEqual(after + 5 * 60_000 + 2000)
    })

    it('persists tier_id null for virtual tier (single-tier stamps)', async () => {
      // Business has no JSONB tiers + stamps_reward → resolveClientTiers builds 'virtual-stamps-reward'
      const insertedRow = {
        id: 'req-1',
        code: 'ABCDEF',
        reward_name: 'Café offert',
        points_cost: null,
        loyalty_type: 'stamps',
        expires_at: new Date().toISOString(),
      }
      const { supabase, calls } = makeSupabase([
        { table: 'loyalty_cards', data: { id: 'card-1', business_id: 'biz-1', current_stamps: 10, current_points: 0 } },
        { table: 'businesses', data: baseBusinessStamps },
        { table: 'claim_requests', throwOnErrorResult: { data: null, error: null } },
        { table: 'claim_requests', data: null },
        { table: 'claim_requests', data: insertedRow },
      ])

      await createClaimRequest(supabase as never, { cardId: 'qr-123' })

      const insertBody = calls[4].insertBody as { tier_id: string | null }
      expect(insertBody.tier_id).toBeNull()
    })

    it('persists tier_id UUID for explicit JSONB tier', async () => {
      const insertedRow = {
        id: 'req-1',
        code: 'ABCDEF',
        reward_name: 'Boisson offerte',
        points_cost: 100,
        loyalty_type: 'points',
        expires_at: new Date().toISOString(),
      }
      const { supabase, calls } = makeSupabase([
        { table: 'loyalty_cards', data: { id: 'card-1', business_id: 'biz-1', current_stamps: 0, current_points: 100 } },
        { table: 'businesses', data: baseBusinessPoints },
        { table: 'claim_requests', throwOnErrorResult: { data: null, error: null } },
        { table: 'claim_requests', data: null },
        { table: 'claim_requests', data: insertedRow },
      ])

      await createClaimRequest(supabase as never, { cardId: 'qr-123', tierId: 'tier-real-uuid' })

      const insertBody = calls[4].insertBody as { tier_id: string | null; points_cost: number | null }
      expect(insertBody.tier_id).toBe('tier-real-uuid')
      expect(insertBody.points_cost).toBe(100)
    })

    it('returns the inserted record correctly mapped (snake → camel)', async () => {
      const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString()
      const insertedRow = {
        id: 'req-42',
        code: 'XYZ123',
        reward_name: 'Boisson offerte',
        points_cost: 100,
        loyalty_type: 'points',
        expires_at: expiresAt,
      }
      const { supabase } = makeSupabase([
        { table: 'loyalty_cards', data: { id: 'card-1', business_id: 'biz-1', current_stamps: 0, current_points: 100 } },
        { table: 'businesses', data: baseBusinessPoints },
        { table: 'claim_requests', throwOnErrorResult: { data: null, error: null } },
        { table: 'claim_requests', data: null },
        { table: 'claim_requests', data: insertedRow },
      ])

      const result = await createClaimRequest(supabase as never, {
        cardId: 'qr-123',
        tierId: 'tier-real-uuid',
      })

      expect(result).toEqual({
        id: 'req-42',
        code: 'XYZ123',
        rewardName: 'Boisson offerte',
        pointsCost: 100,
        loyaltyType: 'points',
        expiresAt,
      })
    })
  })

  // ── validateClaim ──

  const baseClaimRow = {
    id: 'req-1',
    loyalty_card_id: 'card-1',
    business_id: 'biz-1',
    tier_id: null,
    reward_name: 'Café offert',
    points_cost: null,
    loyalty_type: 'stamps' as const,
    status: 'pending',
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    loyalty_cards: {
      qr_code_id: 'qr-123',
      customers: { first_name: 'Jean' },
    },
  }

  describe('validateClaim', () => {
    it('throws 404 if code not found', async () => {
      const { supabase } = makeSupabase([{ table: 'claim_requests', data: null }])

      await expect(
        validateClaim(supabase as never, { code: 'ABCDEF', merchantId: 'biz-1' })
      ).rejects.toThrow(/Code introuvable/)
    })

    it('throws 404 if code belongs to another business (filtered by business_id)', async () => {
      // The service filters by .eq('business_id', merchantId) — supabase returns null
      // when the join misses. We just verify the eq was called with the merchant id.
      const { supabase, calls } = makeSupabase([{ table: 'claim_requests', data: null }])

      await expect(
        validateClaim(supabase as never, { code: 'ABCDEF', merchantId: 'biz-other' })
      ).rejects.toThrow(/Code introuvable/)

      const eqArgs = calls[0].eqArgs!
      expect(eqArgs).toContainEqual(['business_id', 'biz-other'])
      expect(eqArgs).toContainEqual(['code', 'ABCDEF'])
    })

    it('throws 409 if status is already validated', async () => {
      const { supabase } = makeSupabase([
        { table: 'claim_requests', data: { ...baseClaimRow, status: 'validated' } },
      ])

      await expect(
        validateClaim(supabase as never, { code: 'ABCDEF', merchantId: 'biz-1' })
      ).rejects.toThrow(/Code déjà utilisé/)
    })

    it('throws 410 if status is expired', async () => {
      const { supabase } = makeSupabase([
        { table: 'claim_requests', data: { ...baseClaimRow, status: 'expired' } },
      ])

      await expect(
        validateClaim(supabase as never, { code: 'ABCDEF', merchantId: 'biz-1' })
      ).rejects.toThrow(/expiré/)
    })

    it('throws 410 if expires_at is past and updates status to expired', async () => {
      const past = new Date(Date.now() - 60_000).toISOString()
      const { supabase, calls } = makeSupabase([
        { table: 'claim_requests', data: { ...baseClaimRow, expires_at: past } },
        { table: 'claim_requests' }, // update status='expired'
      ])

      await expect(
        validateClaim(supabase as never, { code: 'ABCDEF', merchantId: 'biz-1' })
      ).rejects.toThrow(/Code expiré/)

      expect(calls[1].updateBody).toEqual({ status: 'expired' })
    })

    it('throws 409 when atomic update returns null (race lost)', async () => {
      const { supabase } = makeSupabase([
        { table: 'claim_requests', data: baseClaimRow },
        { table: 'claim_requests', data: null }, // atomic update found no row matching status='pending'
      ])

      await expect(
        validateClaim(supabase as never, { code: 'ABCDEF', merchantId: 'biz-1' })
      ).rejects.toThrow(/concurrence/)
    })

    it('calls resetCard for stamps loyalty_type', async () => {
      const { supabase } = makeSupabase([
        { table: 'claim_requests', data: baseClaimRow },
        { table: 'claim_requests', data: { id: 'req-1' } }, // atomic update success
      ])

      await validateClaim(supabase as never, { code: 'ABCDEF', merchantId: 'biz-1' })

      expect(resetCard).toHaveBeenCalledWith(expect.anything(), {
        cardId: 'card-1',
        businessId: 'biz-1',
      })
      expect(claimReward).not.toHaveBeenCalled()
    })

    it('calls claimReward for points loyalty_type with tier_id', async () => {
      const pointsRow = {
        ...baseClaimRow,
        loyalty_type: 'points' as const,
        tier_id: 'tier-real-uuid',
        points_cost: 100,
      }
      const { supabase } = makeSupabase([
        { table: 'claim_requests', data: pointsRow },
        { table: 'claim_requests', data: { id: 'req-1' } },
      ])

      await validateClaim(supabase as never, { code: 'ABCDEF', merchantId: 'biz-1' })

      expect(claimReward).toHaveBeenCalledWith(expect.anything(), {
        cardId: 'card-1',
        businessId: 'biz-1',
        rewardTierId: 'tier-real-uuid',
      })
      expect(resetCard).not.toHaveBeenCalled()
    })

    it('skips claim execution if loyalty_type=points but tier_id null (safety edge case)', async () => {
      const orphanRow = {
        ...baseClaimRow,
        loyalty_type: 'points' as const,
        tier_id: null,
      }
      const { supabase } = makeSupabase([
        { table: 'claim_requests', data: orphanRow },
        { table: 'claim_requests', data: { id: 'req-1' } },
      ])

      await validateClaim(supabase as never, { code: 'ABCDEF', merchantId: 'biz-1' })

      expect(claimReward).not.toHaveBeenCalled()
      expect(resetCard).not.toHaveBeenCalled()
    })

    it('returns success result with rewardName + customerName', async () => {
      const { supabase } = makeSupabase([
        { table: 'claim_requests', data: baseClaimRow },
        { table: 'claim_requests', data: { id: 'req-1' } },
      ])

      const result = await validateClaim(supabase as never, {
        code: 'ABCDEF',
        merchantId: 'biz-1',
      })

      expect(result).toEqual({
        success: true,
        rewardName: 'Café offert',
        loyaltyType: 'stamps',
        pointsCost: null,
        cardId: 'qr-123',
        customerName: 'Jean',
      })
    })

    it('uppercases the code before querying (case-insensitive lookup)', async () => {
      const { supabase, calls } = makeSupabase([
        { table: 'claim_requests', data: baseClaimRow },
        { table: 'claim_requests', data: { id: 'req-1' } },
      ])

      await validateClaim(supabase as never, { code: 'abcdef', merchantId: 'biz-1' })

      expect(calls[0].eqArgs).toContainEqual(['code', 'ABCDEF'])
    })
  })

  describe('AppError contract', () => {
    it('throws AppError instances (not raw Error) so withErrorHandler can map status codes', async () => {
      const { supabase } = makeSupabase([{ table: 'loyalty_cards', data: null }])

      await expect(
        createClaimRequest(supabase as never, { cardId: 'unknown' })
      ).rejects.toBeInstanceOf(AppError)
    })
  })
})
