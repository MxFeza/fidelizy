import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/wallet/generatePass', () => ({
  setPendingWalletAction: vi.fn(),
}))

vi.mock('@/lib/services/notification.service', () => ({
  notifyClient: vi.fn().mockResolvedValue({ sent: [], failed: [] }),
}))

import {
  generateReferralCode,
  findCardByReferralCode,
  processReferral,
} from '../referral.service'
import { notifyClient } from '@/lib/services/notification.service'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'

// ── Helper: step-based supabase mock ──
//
// Some `from(table)` chains terminate on `.single()`/`.maybeSingle()`/
// `.throwOnError()`, but `findCardByReferralCode` ends on the 2nd `.eq()`
// (which returns a Promise directly). `eq2` configures that terminal.

interface Step {
  table?: string
  single?: { data: unknown }
  maybeSingle?: { data: unknown }
  eq2?: { data: unknown }
  throwOnError?: { data: unknown; error: unknown }
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
      chain.update = vi.fn().mockImplementation((body: unknown) => {
        step.updateBody = body
        return chain
      })
      chain.insert = vi.fn().mockImplementation((body: unknown) => {
        step.insertBody = body
        return chain
      })
      let eqCount = 0
      chain.eq = vi.fn().mockImplementation((col: string, val: unknown) => {
        step.eqArgs!.push([col, val])
        eqCount++
        if (step.eq2 && eqCount === 2) {
          return Promise.resolve(step.eq2) as never
        }
        return chain
      })
      chain.single = vi.fn().mockResolvedValue(step.single ?? { data: null })
      chain.maybeSingle = vi
        .fn()
        .mockResolvedValue(step.maybeSingle ?? { data: null })
      chain.throwOnError = vi
        .fn()
        .mockResolvedValue(step.throwOnError ?? { data: null, error: null })
      return chain
    }),
  }

  return { supabase, calls }
}

describe('referral.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── generateReferralCode (pure) ──

  describe('generateReferralCode', () => {
    it('returns format PRENOM-XXXX where PRENOM = first 4 chars upper', () => {
      expect(generateReferralCode('Jean', '0612345678')).toBe('JEAN-5678')
    })

    it('pads firstName with X if shorter than 4 chars', () => {
      expect(generateReferralCode('Al', '0612345678')).toBe('ALXX-5678')
    })

    it('truncates firstName to 4 chars if longer', () => {
      expect(generateReferralCode('Jean-Pierre', '0612345678')).toBe('JEAN-5678')
    })

    it('uses last 4 chars of phone as suffix (works with international format)', () => {
      expect(generateReferralCode('Marie', '+33612345678')).toBe('MARI-5678')
    })
  })

  // ── findCardByReferralCode ──

  describe('findCardByReferralCode', () => {
    it('returns null for invalid format (no dash)', async () => {
      expect(
        await findCardByReferralCode('JEANXXXX', 'biz-1', {} as never)
      ).toBeNull()
    })

    it('returns null for invalid format (suffix != 4 chars)', async () => {
      expect(
        await findCardByReferralCode('JEAN-12', 'biz-1', {} as never)
      ).toBeNull()
    })

    it('returns null if no cards exist for the business', async () => {
      const { supabase } = makeSupabase([
        { table: 'loyalty_cards', eq2: { data: [] } },
      ])
      expect(
        await findCardByReferralCode('JEAN-5678', 'biz-1', supabase as never)
      ).toBeNull()
    })

    it('returns matching card.id + customer_id when prefix and suffix match', async () => {
      const { supabase } = makeSupabase([
        {
          table: 'loyalty_cards',
          eq2: {
            data: [
              {
                id: 'card-A',
                customer_id: 'cust-A',
                customers: { first_name: 'Marie', phone: '+33611111111' },
              },
              {
                id: 'card-B',
                customer_id: 'cust-B',
                customers: { first_name: 'Jean', phone: '+33612345678' },
              },
              {
                id: 'card-C',
                customer_id: 'cust-C',
                customers: { first_name: 'Sophie', phone: '+33622222222' },
              },
            ],
          },
        },
      ])

      const result = await findCardByReferralCode(
        'JEAN-5678',
        'biz-1',
        supabase as never
      )
      expect(result).toEqual({ id: 'card-B', customer_id: 'cust-B' })
    })

    it('returns null if no card matches', async () => {
      const { supabase } = makeSupabase([
        {
          table: 'loyalty_cards',
          eq2: {
            data: [
              {
                id: 'card-A',
                customer_id: 'cust-A',
                customers: { first_name: 'Marie', phone: '+33611111111' },
              },
            ],
          },
        },
      ])
      expect(
        await findCardByReferralCode('JEAN-5678', 'biz-1', supabase as never)
      ).toBeNull()
    })
  })

  // ── processReferral ──

  describe('processReferral', () => {
    const params = {
      referralCode: 'JEAN-5678',
      referredCardId: 'card-new',
      businessId: 'biz-1',
      referredFirstName: 'Sophie',
    }

    function happyPathSteps() {
      return [
        // 1. business config
        {
          table: 'businesses',
          single: {
            data: {
              referral_enabled: true,
              referral_referrer_bonus: 5,
              referral_referred_bonus: 2,
            },
          },
        },
        // 2. findCardByReferralCode → loyalty_cards .eq().eq() Promise
        {
          table: 'loyalty_cards',
          eq2: {
            data: [
              {
                id: 'card-ref',
                customer_id: 'cust-ref',
                customers: { first_name: 'Jean', phone: '+33612345678' },
              },
            ],
          },
        },
        // 3. insert referrals
        { table: 'referrals' },
        // 4. select referrer card
        {
          table: 'loyalty_cards',
          single: {
            data: { current_points: 10, qr_code_id: 'qr-ref' },
          },
        },
        // 5. update referrer card points
        { table: 'loyalty_cards' },
        // 6. insert transaction (referrer earn)
        { table: 'transactions' },
        // 7. select referred card
        {
          table: 'loyalty_cards',
          single: { data: { qr_code_id: 'qr-new' } },
        },
        // 8. update referred card points
        { table: 'loyalty_cards' },
        // 9. insert transaction (referred welcome)
        { table: 'transactions' },
      ] as Step[]
    }

    it('does nothing if business.referral_enabled === false', async () => {
      const { supabase } = makeSupabase([
        {
          table: 'businesses',
          single: {
            data: {
              referral_enabled: false,
              referral_referrer_bonus: 5,
              referral_referred_bonus: 2,
            },
          },
        },
      ])

      await processReferral(supabase as never, params)

      expect(supabase.from).toHaveBeenCalledTimes(1)
      expect(notifyClient).not.toHaveBeenCalled()
    })

    it('does nothing if referrerCard not found via code', async () => {
      const { supabase } = makeSupabase([
        {
          table: 'businesses',
          single: {
            data: {
              referral_enabled: true,
              referral_referrer_bonus: 5,
              referral_referred_bonus: 2,
            },
          },
        },
        // No matching cards
        { table: 'loyalty_cards', eq2: { data: [] } },
      ])

      await processReferral(supabase as never, params)

      // 2 calls: business + loyalty_cards (find by code). No insert.
      expect(supabase.from).toHaveBeenCalledTimes(2)
      expect(notifyClient).not.toHaveBeenCalled()
    })

    it('inserts a referrals row with referrerPoints/referredPoints from business config', async () => {
      const { supabase, calls } = makeSupabase(happyPathSteps())

      await processReferral(supabase as never, params)

      expect(calls[2].table).toBe('referrals')
      expect(calls[2].insertBody).toMatchObject({
        referrer_card_id: 'card-ref',
        referred_card_id: 'card-new',
        business_id: 'biz-1',
        referrer_points_awarded: 5,
        referred_points_awarded: 2,
      })
    })

    it('uses default 5/2 points if business config bonuses are null', async () => {
      const steps = happyPathSteps()
      // Override business config with null bonuses
      steps[0].single = {
        data: {
          referral_enabled: true,
          referral_referrer_bonus: null,
          referral_referred_bonus: null,
        },
      }
      const { supabase, calls } = makeSupabase(steps)

      await processReferral(supabase as never, params)

      expect(calls[2].insertBody).toMatchObject({
        referrer_points_awarded: 5,
        referred_points_awarded: 2,
      })
    })

    it('updates referrer card current_points (existing + referrerPoints)', async () => {
      const { supabase, calls } = makeSupabase(happyPathSteps())

      await processReferral(supabase as never, params)

      // calls[4] is the update on referrer card (10 existing + 5 awarded = 15)
      expect(calls[4].table).toBe('loyalty_cards')
      expect(calls[4].updateBody).toEqual({ current_points: 15 })
    })

    it('inserts an "earn" transaction for the referrer', async () => {
      const { supabase, calls } = makeSupabase(happyPathSteps())

      await processReferral(supabase as never, params)

      expect(calls[5].table).toBe('transactions')
      expect(calls[5].insertBody).toMatchObject({
        loyalty_card_id: 'card-ref',
        business_id: 'biz-1',
        type: 'earn',
        points_added: 5,
      })
    })

    it('calls notifyClient for the referrer with success message', async () => {
      const { supabase } = makeSupabase(happyPathSteps())

      await processReferral(supabase as never, params)

      expect(notifyClient).toHaveBeenCalledWith(
        'card-ref',
        'qr-ref',
        expect.objectContaining({
          title: expect.stringMatching(/Parrainage/i),
          body: expect.stringContaining('Sophie'),
        })
      )
      expect(setPendingWalletAction).toHaveBeenCalledWith('qr-ref', 'add')
    })

    it('updates referred card current_points = referredPoints', async () => {
      const { supabase, calls } = makeSupabase(happyPathSteps())

      await processReferral(supabase as never, params)

      // calls[7] is the update on referred card
      expect(calls[7].table).toBe('loyalty_cards')
      expect(calls[7].updateBody).toEqual({ current_points: 2 })
    })

    it('inserts an "earn" transaction for the referred (welcome bonus)', async () => {
      const { supabase, calls } = makeSupabase(happyPathSteps())

      await processReferral(supabase as never, params)

      expect(calls[8].table).toBe('transactions')
      expect(calls[8].insertBody).toMatchObject({
        loyalty_card_id: 'card-new',
        business_id: 'biz-1',
        type: 'earn',
        points_added: 2,
      })
    })

    it('notifies referred customer with welcome message', async () => {
      const { supabase } = makeSupabase(happyPathSteps())

      await processReferral(supabase as never, params)

      // notifyClient should be called twice: once for referrer, once for referred
      expect(notifyClient).toHaveBeenCalledTimes(2)
      expect(notifyClient).toHaveBeenCalledWith(
        'card-new',
        'qr-new',
        expect.objectContaining({
          title: expect.stringMatching(/Bienvenue/i),
        })
      )
      expect(setPendingWalletAction).toHaveBeenCalledWith('qr-new', 'add')
    })

    it('catches notify errors silently (does not throw)', async () => {
      vi.mocked(notifyClient).mockRejectedValue(new Error('Push service down'))
      const { supabase } = makeSupabase(happyPathSteps())

      await expect(
        processReferral(supabase as never, params)
      ).resolves.toBeUndefined()
    })
  })
})
