import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/services/referral.service', () => ({
  processReferral: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/services/loyalty.service', () => ({
  ServiceError: class ServiceError extends Error {
    constructor(message: string, public statusCode: number) {
      super(message)
      this.name = 'ServiceError'
    }
  },
}))

import { registerCustomer, findCustomerCards } from '../customer.service'

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
})
