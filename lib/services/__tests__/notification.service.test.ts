import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/push/sendPush', () => ({
  sendPushToCard: vi.fn().mockResolvedValue(undefined),
  sendPushToAllBusinessClients: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/wallet/push', () => ({
  notifyWalletDevices: vi.fn().mockResolvedValue(undefined),
}))

// `broadcastToBusinessClients` does a dynamic import of `@/lib/supabase/service`
// and calls .from('push_subscriptions').select('id', {count, head}).eq(...)
// where the final `.eq()` resolves the count. We expose a settable mock so each
// test can override the count.
const supabaseEqMock = vi.fn().mockResolvedValue({ count: 0, data: null, error: null })

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: supabaseEqMock,
      })),
    })),
  })),
}))

import { notifyClient, broadcastToBusinessClients } from '../notification.service'
import {
  sendPushToCard,
  sendPushToAllBusinessClients,
} from '@/lib/push/sendPush'
import { notifyWalletDevices } from '@/lib/wallet/push'
import { createServiceClient } from '@/lib/supabase/service'

describe('notification.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseEqMock.mockResolvedValue({ count: 0, data: null, error: null })
  })

  describe('notifyClient', () => {
    it('sends to both channels (web push + Apple Wallet) on success', async () => {
      const result = await notifyClient('card-1', 'qr-123', {
        title: 'Test',
        body: 'Test body',
      })

      expect(result.sent).toEqual(['web_push', 'apple_wallet'])
      expect(result.failed).toEqual([])
      expect(sendPushToCard).toHaveBeenCalledTimes(1)
      expect(notifyWalletDevices).toHaveBeenCalledTimes(1)
    })

    it('captures web push failure but continues to wallet', async () => {
      vi.mocked(sendPushToCard).mockRejectedValueOnce(new Error('VAPID error'))

      const result = await notifyClient('card-1', 'qr-123', {
        title: 'T',
        body: 'B',
      })

      expect(result.sent).toEqual(['apple_wallet'])
      expect(result.failed).toEqual(['web_push'])
      expect(notifyWalletDevices).toHaveBeenCalledWith('qr-123')
    })

    it('captures wallet failure but still reports web push success', async () => {
      vi.mocked(notifyWalletDevices).mockRejectedValueOnce(new Error('APNs down'))

      const result = await notifyClient('card-1', 'qr-123', {
        title: 'T',
        body: 'B',
      })

      expect(result.sent).toEqual(['web_push'])
      expect(result.failed).toEqual(['apple_wallet'])
    })

    it('returns both failed if both channels fail', async () => {
      vi.mocked(sendPushToCard).mockRejectedValueOnce(new Error('VAPID'))
      vi.mocked(notifyWalletDevices).mockRejectedValueOnce(new Error('APNs'))

      const result = await notifyClient('card-1', 'qr-123', {
        title: 'T',
        body: 'B',
      })

      expect(result.sent).toEqual([])
      expect(result.failed).toEqual(['web_push', 'apple_wallet'])
    })

    it('logs to console.error on each failure (does not throw)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(sendPushToCard).mockRejectedValueOnce(new Error('VAPID'))
      vi.mocked(notifyWalletDevices).mockRejectedValueOnce(new Error('APNs'))

      await expect(
        notifyClient('card-1', 'qr-123', { title: 'T', body: 'B' })
      ).resolves.toBeDefined()

      expect(errSpy).toHaveBeenCalledTimes(2)
      errSpy.mockRestore()
    })

    it('passes the correct URL to web push (https://fidelizy.vercel.app/card/{qrCodeId})', async () => {
      await notifyClient('card-1', 'qr-abc-123', {
        title: 'Reward',
        body: 'You won!',
      })

      expect(sendPushToCard).toHaveBeenCalledWith('card-1', {
        title: 'Reward',
        body: 'You won!',
        url: 'https://fidelizy.vercel.app/card/qr-abc-123',
      })
    })
  })

  describe('broadcastToBusinessClients', () => {
    it('queries push_subscriptions count by business_id', async () => {
      // Capture the supabase chain calls to assert what was queried
      const eqSpy = vi.fn().mockResolvedValue({ count: 0, data: null, error: null })
      const selectSpy = vi.fn(() => ({ eq: eqSpy }))
      const fromSpy = vi.fn(() => ({ select: selectSpy }))
      vi.mocked(createServiceClient).mockReturnValueOnce({ from: fromSpy } as never)

      await broadcastToBusinessClients('biz-42', { title: 'T', body: 'B' })

      expect(fromSpy).toHaveBeenCalledWith('push_subscriptions')
      expect(selectSpy).toHaveBeenCalledWith('id', { count: 'exact', head: true })
      expect(eqSpy).toHaveBeenCalledWith('business_id', 'biz-42')
    })

    it('returns recipientCount from supabase count result', async () => {
      supabaseEqMock.mockResolvedValueOnce({ count: 42, data: null, error: null })

      const result = await broadcastToBusinessClients('biz-1', {
        title: 'Promo',
        body: 'Venez !',
      })

      expect(result).toEqual({ recipientCount: 42 })
    })

    it('returns recipientCount: 0 if count is null', async () => {
      supabaseEqMock.mockResolvedValueOnce({ count: null, data: null, error: null })

      const result = await broadcastToBusinessClients('biz-1', {
        title: 'T',
        body: 'B',
      })

      expect(result).toEqual({ recipientCount: 0 })
    })

    it('calls sendPushToAllBusinessClients with title + body', async () => {
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
