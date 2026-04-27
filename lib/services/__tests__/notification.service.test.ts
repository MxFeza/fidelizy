import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/push/sendPush', () => ({
  sendPushToCard: vi.fn().mockResolvedValue(undefined),
  sendPushToAllBusinessClients: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/wallet/push', () => ({
  notifyWalletDevices: vi.fn().mockResolvedValue(undefined),
}))

// Mock createServiceClient pour eviter le besoin d'env vars Supabase en CI
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ count: 5, data: null, error: null }),
      })),
    })),
  })),
}))

import { notifyClient, broadcastToBusinessClients } from '../notification.service'
import { sendPushToCard, sendPushToAllBusinessClients } from '@/lib/push/sendPush'
import { notifyWalletDevices } from '@/lib/wallet/push'

describe('notification.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('notifyClient', () => {
    it('should dispatch to web push and wallet', async () => {
      const result = await notifyClient('card-1', 'qr-123', {
        title: 'Test',
        body: 'Test body',
      })

      expect(sendPushToCard).toHaveBeenCalledWith('card-1', {
        title: 'Test',
        body: 'Test body',
        url: 'https://fidelizy.vercel.app/card/qr-123',
      })
      expect(notifyWalletDevices).toHaveBeenCalledWith('qr-123')
      expect(result.sent).toContain('web_push')
      expect(result.sent).toContain('apple_wallet')
      expect(result.failed).toHaveLength(0)
    })

    it('should report failed channels gracefully', async () => {
      vi.mocked(sendPushToCard).mockRejectedValueOnce(new Error('VAPID error'))

      const result = await notifyClient('card-1', 'qr-123', {
        title: 'Reward',
        body: 'You won!',
      })

      expect(result.failed).toContain('web_push')
      expect(result.sent).toContain('apple_wallet')
    })
  })

  describe('broadcastToBusinessClients', () => {
    it('should call sendPushToAllBusinessClients', async () => {
      await broadcastToBusinessClients('biz-1', {
        title: 'Promo',
        body: 'Venez !',
      })

      expect(sendPushToAllBusinessClients).toHaveBeenCalledWith('biz-1', {
        title: 'Promo',
        body: 'Venez !',
      })
    })
  })
})
