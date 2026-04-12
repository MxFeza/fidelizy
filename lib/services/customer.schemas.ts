import { z } from 'zod'

export const registerCustomerSchema = z.object({
  businessId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().toLowerCase(),
  referralCode: z.string().optional(),
})
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>

export const recoverCardsSchema = z.object({
  phone: z.string().trim().min(6),
})
export type RecoverCardsInput = z.infer<typeof recoverCardsSchema>
