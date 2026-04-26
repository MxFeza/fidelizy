import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing service
vi.mock('@/lib/wallet/generatePass', () => ({
  setPendingWalletAction: vi.fn(),
}))

vi.mock('@/lib/services/notification.service', () => ({
  notifyClient: vi.fn().mockResolvedValue({ sent: ['web_push'], failed: [] }),
  broadcastToBusinessClients: vi.fn().mockResolvedValue(undefined),
}))

import { scanCard, deductFromCard, claimReward, resetCard } from '../loyalty.service'
import { AppError } from '@/lib/errors'

// ── Helper: chainable mock with throwOnError ──

function mockChain(resolvedData: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.ilike = vi.fn().mockReturnValue(chain)
  chain.gt = vi.fn().mockReturnValue(chain)
  chain.lte = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.throwOnError = vi.fn().mockResolvedValue({ data: resolvedData, error: null })
  // For calls that don't chain throwOnError (reads)
  chain.single = vi.fn().mockResolvedValue({ data: resolvedData })
  return chain
}

describe('loyalty.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('scanCard', () => {
    it('should earn 1 stamp on scan for stamps business via RPC', async () => {
      const card = {
        id: 'card-1',
        current_stamps: 3,
        current_points: 0,
        total_visits: 5,
        qr_code_id: 'qr-123',
        customers: { first_name: 'Jean' },
      }

      const rpcChain = {
        single: vi.fn().mockResolvedValue({
          data: { new_stamps: 4, is_complete: false, total_visits: 6 },
          error: null,
        }),
      }

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: card }),
      }

      // No recent earn (pas de cooldown actif)
      const cooldownChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      }

      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        throwOnError: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      let fromCallCount = 0
      const supabase = {
        from: vi.fn().mockImplementation(() => {
          fromCallCount++
          if (fromCallCount === 1) return selectChain // find card
          if (fromCallCount === 2) return cooldownChain // anti-fraude check
          if (fromCallCount === 3) return { ...selectChain, single: vi.fn().mockResolvedValue({ data: { ...card, current_stamps: 4 } }) } // fetch updated
          return insertChain // transactions
        }),
        rpc: vi.fn().mockReturnValue(rpcChain),
      }

      const result = await scanCard(supabase as never, {
        qrCodeId: 'qr-123',
        business: {
          id: 'biz-1',
          business_name: 'Mon Café',
          loyalty_type: 'stamps',
          stamps_required: 10,
          stamps_reward: 'Café offert',
          points_per_euro: null,
          scan_cooldown_hours: 4,
        },
      })

      expect(result.success).toBe(true)
      expect(supabase.rpc).toHaveBeenCalledWith('increment_stamps', {
        p_card_id: 'card-1',
        p_amount: 1,
        p_stamps_required: 10,
      })
      expect(result.customer).toEqual({ first_name: 'Jean' })
    })

    it('should throw AppError for unknown card', async () => {
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      }
      const supabase = { from: vi.fn().mockReturnValue(selectChain) }

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
      ).rejects.toThrow(AppError)
    })

    it('should throw 429 cooldown error when last scan is within cooldown window', async () => {
      const card = {
        id: 'card-1',
        current_stamps: 3,
        current_points: 0,
        total_visits: 5,
        qr_code_id: 'qr-123',
        customers: { first_name: 'Jean' },
      }

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: card }),
      }

      // Recent earn 30 min ago (cooldown 4h => still blocked)
      const recentEarnIso = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const cooldownChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { created_at: recentEarnIso } }),
      }

      let fromCallCount = 0
      const supabase = {
        from: vi.fn().mockImplementation(() => {
          fromCallCount++
          if (fromCallCount === 1) return selectChain
          return cooldownChain
        }),
        rpc: vi.fn(),
      }

      await expect(
        scanCard(supabase as never, {
          qrCodeId: 'qr-123',
          business: {
            id: 'biz-1',
            business_name: 'Mon Café',
            loyalty_type: 'stamps',
            stamps_required: 10,
            stamps_reward: 'Café offert',
            points_per_euro: null,
            scan_cooldown_hours: 4,
          },
        })
      ).rejects.toThrow(/Trop tôt/)

      // RPC ne doit pas etre appele si cooldown bloque
      expect(supabase.rpc).not.toHaveBeenCalled()
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

      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: card }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        throwOnError: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      const supabase = { from: vi.fn().mockReturnValue(chain) }

      const result = await deductFromCard(supabase as never, {
        cardId: 'card-1',
        businessId: 'biz-1',
        type: 'stamps',
        amount: 5,
      })

      expect(result.success).toBe(true)
      expect(result.newValue).toBe(0)
    })
  })

  describe('claimReward', () => {
    it('should throw when insufficient points (via RPC)', async () => {
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

      let fromCallCount = 0
      const supabase = {
        from: vi.fn().mockImplementation(() => {
          fromCallCount++
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: fromCallCount === 1 ? card : tier }),
          }
        }),
        rpc: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { new_points: 0, success: false },
            error: null,
          }),
        }),
      }

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

      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: card }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        throwOnError: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      const supabase = { from: vi.fn().mockReturnValue(chain) }

      const result = await resetCard(supabase as never, {
        cardId: 'card-1',
        businessId: 'biz-1',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('AppError', () => {
    it('should have correct properties', () => {
      const err = new AppError('Test error', 404)
      expect(err.message).toBe('Test error')
      expect(err.statusCode).toBe(404)
      expect(err.name).toBe('AppError')
    })
  })
})
