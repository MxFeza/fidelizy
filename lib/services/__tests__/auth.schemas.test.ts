import { describe, it, expect } from 'vitest'

import {
  sendOtpSchema,
  verifyOtpSchema,
  addEmailSchema,
  registerDirectSchema,
  merchantSignInSchema,
} from '../auth.schemas'

describe('auth.schemas', () => {
  describe('sendOtpSchema', () => {
    it('accepts phone alone', () => {
      expect(sendOtpSchema.safeParse({ phone: '+33612345678' }).success).toBe(true)
    })

    it('accepts email alone', () => {
      expect(sendOtpSchema.safeParse({ email: 'user@test.com' }).success).toBe(true)
    })

    it('lowercases email', () => {
      const r = sendOtpSchema.safeParse({ email: 'USER@TEST.COM' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.email).toBe('user@test.com')
    })

    it('rejects empty object', () => {
      expect(sendOtpSchema.safeParse({}).success).toBe(false)
    })

    it('rejects phone shorter than 6 chars', () => {
      expect(sendOtpSchema.safeParse({ phone: '12345' }).success).toBe(false)
    })
  })

  describe('verifyOtpSchema', () => {
    it('accepts email + 6-char token', () => {
      expect(verifyOtpSchema.safeParse({ email: 'u@t.com', token: '123456' }).success).toBe(true)
    })

    it('rejects token of wrong length', () => {
      expect(verifyOtpSchema.safeParse({ email: 'u@t.com', token: '12345' }).success).toBe(false)
      expect(verifyOtpSchema.safeParse({ email: 'u@t.com', token: '1234567' }).success).toBe(false)
    })

    it('rejects missing identifier', () => {
      expect(verifyOtpSchema.safeParse({ token: '123456' }).success).toBe(false)
    })
  })

  describe('addEmailSchema', () => {
    it('accepts valid phone + email', () => {
      const r = addEmailSchema.safeParse({ phone: '+33612345678', email: 'user@test.com' })
      expect(r.success).toBe(true)
    })

    it('rejects invalid email format', () => {
      expect(addEmailSchema.safeParse({ phone: '+33612345678', email: 'not-an-email' }).success).toBe(false)
    })

    it('lowercases the email', () => {
      const r = addEmailSchema.safeParse({ phone: '+33612345678', email: 'USER@TEST.COM' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.email).toBe('user@test.com')
    })
  })

  describe('registerDirectSchema', () => {
    it('accepts valid payload', () => {
      const r = registerDirectSchema.safeParse({
        first_name: 'Marie',
        phone: '+33612345678',
        email: 'marie@test.com',
      })
      expect(r.success).toBe(true)
    })

    it('rejects empty first_name', () => {
      expect(
        registerDirectSchema.safeParse({
          first_name: '',
          phone: '+33612345678',
          email: 'marie@test.com',
        }).success,
      ).toBe(false)
    })

    it('caps first_name at 100 chars', () => {
      expect(
        registerDirectSchema.safeParse({
          first_name: 'a'.repeat(101),
          phone: '+33612345678',
          email: 'marie@test.com',
        }).success,
      ).toBe(false)
    })
  })

  describe('merchantSignInSchema', () => {
    it('accepts valid email + password', () => {
      const r = merchantSignInSchema.safeParse({ email: 'merchant@biz.fr', password: 'pw12345' })
      expect(r.success).toBe(true)
    })

    it('rejects password longer than 72 chars (bcrypt limit)', () => {
      expect(
        merchantSignInSchema.safeParse({ email: 'm@b.fr', password: 'a'.repeat(73) }).success,
      ).toBe(false)
    })

    it('accepts password at the 72-char boundary', () => {
      expect(
        merchantSignInSchema.safeParse({ email: 'm@b.fr', password: 'a'.repeat(72) }).success,
      ).toBe(true)
    })

    it('rejects empty password', () => {
      expect(merchantSignInSchema.safeParse({ email: 'm@b.fr', password: '' }).success).toBe(false)
    })

    it('rejects invalid email format', () => {
      expect(merchantSignInSchema.safeParse({ email: 'invalid', password: 'pw' }).success).toBe(false)
    })
  })
})
