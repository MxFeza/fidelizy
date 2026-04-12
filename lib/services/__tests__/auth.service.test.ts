import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/services/loyalty.service', () => ({
  ServiceError: class ServiceError extends Error {
    constructor(message: string, public statusCode: number) {
      super(message)
      this.name = 'ServiceError'
    }
  },
}))

import { sendOtp, verifyOtp, addEmailAndSendOtp } from '../auth.service'

// Mock auth client (anon key client for OTP operations)
function createMockAuthClient() {
  return {
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-user-1' } }, error: null }),
    },
  }
}

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendOtp', () => {
    it('should return not_found when customer does not exist', async () => {
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      }
      const supabase = { from: vi.fn().mockReturnValue(chainable) }
      const supabaseAuth = createMockAuthClient()

      const result = await sendOtp(supabase as never, supabaseAuth as never, { phone: '+33600000000' })
      expect(result.status).toBe('not_found')
    })

    it('should return needs_email when customer has no email', async () => {
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'cust-1', email: null } }),
      }
      const supabase = { from: vi.fn().mockReturnValue(chainable) }
      const supabaseAuth = createMockAuthClient()

      const result = await sendOtp(supabase as never, supabaseAuth as never, { phone: '+33600000000' })
      expect(result.status).toBe('needs_email')
    })

    it('should send OTP and mask email', async () => {
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'cust-1', email: 'jean@gmail.com' } }),
      }
      const supabase = { from: vi.fn().mockReturnValue(chainable) }
      const supabaseAuth = createMockAuthClient()

      const result = await sendOtp(supabase as never, supabaseAuth as never, { phone: '+33612345678' })
      expect(result.status).toBe('otp_sent')
      expect(result.maskedEmail).toBe('j***n@gmail.com')
    })
  })

  describe('verifyOtp', () => {
    it('should verify OTP and return cards', async () => {
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'cust-1' } }),
      }
      const cardsChainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ id: 'card-1', qr_code_id: 'qr-1' }] }),
      }

      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce(chainable)
          .mockReturnValueOnce(cardsChainable),
      }
      const supabaseAuth = createMockAuthClient()

      const result = await verifyOtp(supabase as never, supabaseAuth as never, { email: 'jean@gmail.com', token: '123456' })
      expect(result.status).toBe('verified')
      expect(result.cards).toHaveLength(1)
    })
  })

  describe('addEmailAndSendOtp', () => {
    it('should update email and send OTP', async () => {
      const chainable = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const supabase = { from: vi.fn().mockReturnValue(chainable) }
      const supabaseAuth = createMockAuthClient()

      const result = await addEmailAndSendOtp(supabase as never, supabaseAuth as never, {
        phone: '+33612345678',
        email: 'new@gmail.com',
      })
      expect(result.status).toBe('otp_sent')
    })
  })
})
