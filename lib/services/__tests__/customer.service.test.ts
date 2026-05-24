import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/services/referral.service', () => ({
  processReferral: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/errors', () => ({
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode: number) {
      super(message)
      this.name = 'AppError'
    }
  },
}))

import { registerCustomer, findCustomerCards, ensureCustomerAndCard } from '../customer.service'

describe('customer.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerCustomer', () => {
    it('should return existing card if customer already enrolled', async () => {
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
        single: vi.fn(),
        insert: vi.fn().mockReturnThis(),
      }

      // Sequence: business, existingCustomer, existingCard
      chainable.single.mockResolvedValueOnce({
        data: { id: 'biz-1', loyalty_type: 'stamps', gamification: {} },
      })
      chainable.maybeSingle
        .mockResolvedValueOnce({ data: { id: 'cust-1' } }) // existing customer
      chainable.maybeSingle
        .mockResolvedValueOnce({ data: { id: 'card-1', qr_code_id: 'qr-existing' } }) // existing card

      const supabase = { from: vi.fn().mockReturnValue(chainable) }

      const result = await registerCustomer(supabase as never, {
        businessId: 'biz-1',
        firstName: 'Jean',
        phone: '+33612345678',
        email: 'jean@test.com',
      })

      expect(result.qrCodeId).toBe('qr-existing')
      expect(result.cardId).toBe('card-1')
    })
  })

  describe('findCustomerCards', () => {
    it('should return empty array if customer not found', async () => {
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      }

      const supabase = { from: vi.fn().mockReturnValue(chainable) }

      const result = await findCustomerCards(supabase as never, { phone: '+33600000000' })
      expect(result.cards).toEqual([])
    })
  })

  describe('ensureCustomerAndCard', () => {
    /**
     * Helper : construit un mock Supabase qui retourne dans l'ordre des
     * appels les payloads fournis. Les 4 appels possibles sont :
     *  1. SELECT customers (maybeSingle)
     *  2. INSERT customers (single)              [si pas trouve]
     *  3. SELECT loyalty_cards (maybeSingle)
     *  4. INSERT loyalty_cards (single)          [si pas trouve]
     *
     * Chaque appel `supabase.from(table)` re-utilise le meme objet chainable
     * mock — les sequences maybeSingle/single sont consommees dans l'ordre.
     */
    function buildSupabase({
      maybeSingleResults,
      singleResults,
    }: {
      maybeSingleResults: Array<{ data: unknown }>
      singleResults: Array<{ data: unknown; error?: { message: string } | null }>
    }) {
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
        single: vi.fn(),
      }
      maybeSingleResults.forEach((r) => chainable.maybeSingle.mockResolvedValueOnce(r))
      singleResults.forEach((r) => chainable.single.mockResolvedValueOnce(r))
      return {
        supabase: { from: vi.fn().mockReturnValue(chainable) },
        chainable,
      }
    }

    const business = { id: 'biz-1', loyalty_type: 'stamps' as const, gamification: null }

    it('returns existing card when customer + card both exist (idempotent)', async () => {
      const { supabase } = buildSupabase({
        maybeSingleResults: [
          { data: { id: 'cust-existing' } }, // customer found
          { data: { id: 'card-existing', qr_code_id: 'qr-existing' } }, // card found
        ],
        singleResults: [],
      })

      const result = await ensureCustomerAndCard(supabase as never, {
        user: { email: 'francis@test.com' },
        business,
      })

      expect(result).toEqual({ id: 'card-existing', qr_code_id: 'qr-existing' })
    })

    it('auto-creates customer from user_metadata.first_name when missing', async () => {
      const { supabase, chainable } = buildSupabase({
        maybeSingleResults: [
          { data: null }, // customer NOT found
          { data: { id: 'card-1', qr_code_id: 'qr-1' } }, // card found
        ],
        singleResults: [
          { data: { id: 'cust-new' }, error: null }, // INSERT customer success
        ],
      })

      const result = await ensureCustomerAndCard(supabase as never, {
        user: {
          email: 'marie@test.com',
          user_metadata: { first_name: 'Marie' },
        },
        business,
      })

      expect(result).toEqual({ id: 'card-1', qr_code_id: 'qr-1' })
      // L'INSERT customer doit avoir recu le bon firstName
      expect(chainable.insert).toHaveBeenCalledWith(
        expect.objectContaining({ first_name: 'Marie', email: 'marie@test.com' }),
      )
    })

    it('falls back to user_metadata.name then full_name then email-prefix for firstName', async () => {
      const { supabase, chainable } = buildSupabase({
        maybeSingleResults: [
          { data: null },
          { data: { id: 'card', qr_code_id: 'qr' } },
        ],
        singleResults: [{ data: { id: 'cust' }, error: null }],
      })

      await ensureCustomerAndCard(supabase as never, {
        user: { email: 'fallback@test.com', user_metadata: { full_name: 'Jean Dupont' } },
        business,
      })

      expect(chainable.insert).toHaveBeenCalledWith(
        expect.objectContaining({ first_name: 'Jean' }),
      )
    })

    it('uses email-prefix as last-resort firstName when metadata is empty', async () => {
      const { supabase, chainable } = buildSupabase({
        maybeSingleResults: [
          { data: null },
          { data: { id: 'card', qr_code_id: 'qr' } },
        ],
        singleResults: [{ data: { id: 'cust' }, error: null }],
      })

      await ensureCustomerAndCard(supabase as never, {
        user: { email: 'aazerty826@gmail.com', user_metadata: null },
        business,
      })

      expect(chainable.insert).toHaveBeenCalledWith(
        expect.objectContaining({ first_name: 'aazerty826' }),
      )
    })

    it('returns null when customer auto-create fails', async () => {
      const { supabase } = buildSupabase({
        maybeSingleResults: [{ data: null }], // customer not found
        singleResults: [{ data: null, error: { message: 'unique constraint violation' } }],
      })

      const result = await ensureCustomerAndCard(supabase as never, {
        user: { email: 'fail@test.com' },
        business,
      })
      expect(result).toBeNull()
    })

    it('auto-creates loyalty_card with initial_stamps from gamification (stamps mode)', async () => {
      const { supabase, chainable } = buildSupabase({
        maybeSingleResults: [
          { data: { id: 'cust' } }, // customer found
          { data: null }, // card NOT found
        ],
        singleResults: [
          { data: { id: 'new-card', qr_code_id: 'new-qr' }, error: null },
        ],
      })

      const result = await ensureCustomerAndCard(supabase as never, {
        user: { email: 'francis@test.com' },
        business: {
          id: 'biz-1',
          loyalty_type: 'stamps',
          gamification: { initial_stamps: 2 },
        },
      })

      expect(result).toEqual({ id: 'new-card', qr_code_id: 'new-qr' })
      expect(chainable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 'cust',
          business_id: 'biz-1',
          current_stamps: 2,
        }),
      )
    })

    it('ignores initial_stamps in points mode (always 0)', async () => {
      const { supabase, chainable } = buildSupabase({
        maybeSingleResults: [{ data: { id: 'cust' } }, { data: null }],
        singleResults: [{ data: { id: 'card', qr_code_id: 'qr' }, error: null }],
      })

      await ensureCustomerAndCard(supabase as never, {
        user: { email: 'u@t.com' },
        business: { id: 'biz', loyalty_type: 'points', gamification: { initial_stamps: 3 } },
      })

      expect(chainable.insert).toHaveBeenCalledWith(
        expect.objectContaining({ current_stamps: 0 }),
      )
    })

    it('returns null when card auto-create fails', async () => {
      const { supabase } = buildSupabase({
        maybeSingleResults: [
          { data: { id: 'cust' } },
          { data: null },
        ],
        singleResults: [
          { data: null, error: { message: 'RLS denied' } },
        ],
      })

      const result = await ensureCustomerAndCard(supabase as never, {
        user: { email: 'u@t.com' },
        business,
      })
      expect(result).toBeNull()
    })
  })
})
