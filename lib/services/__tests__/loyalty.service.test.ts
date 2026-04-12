import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing service
vi.mock('@/lib/wallet/generatePass', () => ({
  setPendingWalletAction: vi.fn(),
}))

vi.mock('@/lib/services/notification.service', () => ({
  notifyClient: vi.fn().mockResolvedValue({ sent: ['web_push'], failed: [] }),
}))

import { scanCard, addToCard, deductFromCard, claimReward, resetCard, ServiceError } from '../loyalty.service'

// ── Supabase mock factory ──

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
  }

  return {
    from: vi.fn().mockReturnValue(chainable),
    _chain: chainable,
    ...overrides,
  }
}

describe('loyalty.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('scanCard', () => {
    it('should earn 1 stamp on scan for stamps business', async () => {
      const card = {
        id: 'card-1',
        current_stamps: 3,
        current_points: 0,
        total_visits: 5,
        qr_code_id: 'qr-123',
        customers: { first_name: 'Jean' },
      }

      const updatedCard = { ...card, current_stamps: 4 }

      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: card }) // find card
          .mockResolvedValueOnce({ data: updatedCard }), // update card
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnThis(),
      }

      const supabase = { from: vi.fn().mockReturnValue(chainable) }

      const result = await scanCard(supabase as never, {
        qrCodeId: 'qr-123',
        business: {
          id: 'biz-1',
          business_name: 'Mon Café',
          loyalty_type: 'stamps',
          stamps_required: 10,
          stamps_reward: 'Café offert',
          points_per_euro: null,
        },
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('4/10')
      expect(result.customer).toEqual({ first_name: 'Jean' })
    })

    it('should throw ServiceError for unknown card', async () => {
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      }

      const supabase = { from: vi.fn().mockReturnValue(chainable) }

      await expect(
        scanCard(supabase as never, {
          qrCodeId: 'unknown-qr',
          business: {
            id: 'biz-1',
            business_name: 'Test',
            loyalty_type: 'stamps',
            stamps_required: 10,
            stamps_reward: 'Free',
            points_per_euro: null,
          },
        })
      ).rejects.toThrow(ServiceError)
    })
  })

  describe('deductFromCard', () => {
    it('should deduct stamps and floor to 0', async () => {
      const card = {
        id: 'card-1',
        current_stamps: 2,
        current_points: 0,
        business_id: 'biz-1',
        qr_code_id: 'qr-123',
      }

      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: card }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      const supabase = { from: vi.fn().mockReturnValue(chainable) }

      const result = await deductFromCard(supabase as never, {
        cardId: 'card-1',
        businessId: 'biz-1',
        type: 'stamps',
        amount: 5,
      })

      expect(result.success).toBe(true)
      expect(result.newValue).toBe(0) // floored to 0, not -3
    })
  })

  describe('claimReward', () => {
    it('should throw when insufficient points', async () => {
      const card = {
        id: 'card-1',
        current_points: 3,
        business_id: 'biz-1',
        qr_code_id: 'qr-123',
      }

      const tier = {
        id: 'tier-1',
        reward_name: 'Café gratuit',
        points_required: 10,
      }

      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: card })
          .mockResolvedValueOnce({ data: tier }),
      }

      const supabase = { from: vi.fn().mockReturnValue(chainable) }

      await expect(
        claimReward(supabase as never, {
          cardId: 'card-1',
          businessId: 'biz-1',
          rewardTierId: 'tier-1',
        })
      ).rejects.toThrow('Points insuffisants')
    })
  })

  describe('resetCard', () => {
    it('should reset stamps to 0', async () => {
      const card = {
        id: 'card-1',
        business_id: 'biz-1',
        current_stamps: 7,
        qr_code_id: 'qr-123',
      }

      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: card }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      const supabase = { from: vi.fn().mockReturnValue(chainable) }

      const result = await resetCard(supabase as never, {
        cardId: 'card-1',
        businessId: 'biz-1',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('ServiceError', () => {
    it('should have correct properties', () => {
      const err = new ServiceError('Test error', 404)
      expect(err.message).toBe('Test error')
      expect(err.statusCode).toBe(404)
      expect(err.name).toBe('ServiceError')
    })
  })
})
