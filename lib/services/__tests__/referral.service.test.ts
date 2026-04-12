import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/wallet/generatePass', () => ({
  setPendingWalletAction: vi.fn(),
}))

vi.mock('@/lib/services/notification.service', () => ({
  notifyClient: vi.fn().mockResolvedValue({ sent: [], failed: [] }),
}))

import { generateReferralCode, findCardByReferralCode } from '../referral.service'

describe('referral.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateReferralCode', () => {
    it('should generate CODE-LAST4 format', () => {
      expect(generateReferralCode('Jean', '+33612345678')).toBe('JEAN-5678')
    })

    it('should pad short names with X', () => {
      expect(generateReferralCode('Li', '+33600001234')).toBe('LIXX-1234')
    })

    it('should uppercase the name prefix', () => {
      expect(generateReferralCode('marie', '+33699998888')).toBe('MARI-8888')
    })
  })

  describe('findCardByReferralCode', () => {
    it('should return null for invalid format', async () => {
      const supabase = {} as never
      expect(await findCardByReferralCode('invalid', 'biz-1', supabase)).toBeNull()
    })

    it('should return null for code with wrong suffix length', async () => {
      const supabase = {} as never
      expect(await findCardByReferralCode('JEAN-12', 'biz-1', supabase)).toBeNull()
    })

    it('should find matching card', async () => {
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }
      // After the chain completes (2nd .eq), resolve with data
      let callCount = 0
      chainable.eq.mockImplementation(() => {
        callCount++
        if (callCount >= 2) {
          // Final .eq returns a promise-like with data
          return Promise.resolve({
            data: [{
              id: 'card-1',
              customer_id: 'cust-1',
              customers: { first_name: 'Jean', phone: '+33612345678' },
            }],
          })
        }
        return chainable
      })

      const supabase = { from: vi.fn().mockReturnValue(chainable) }

      const result = await findCardByReferralCode('JEAN-5678', 'biz-1', supabase as never)
      expect(result).toEqual({ id: 'card-1', customer_id: 'cust-1' })
    })
  })
})
