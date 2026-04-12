import { z } from 'zod'

export const scanCardSchema = z.object({
  qrCodeId: z.string().min(1).max(100),
  businessId: z.string().uuid(),
})
export type ScanCardInput = z.infer<typeof scanCardSchema>

export const addToCardSchema = z.object({
  cardId: z.string().uuid(),
  businessId: z.string().uuid(),
  type: z.enum(['stamps', 'points']),
  amount: z.number().int().positive().max(1000),
})
export type AddToCardInput = z.infer<typeof addToCardSchema>

export const deductFromCardSchema = z.object({
  cardId: z.string().uuid(),
  businessId: z.string().uuid(),
  type: z.enum(['stamps', 'points']),
  amount: z.number().int().positive().max(1000),
})
export type DeductFromCardInput = z.infer<typeof deductFromCardSchema>

export const claimRewardSchema = z.object({
  cardId: z.string().uuid(),
  businessId: z.string().uuid(),
  rewardTierId: z.string().uuid(),
})
export type ClaimRewardInput = z.infer<typeof claimRewardSchema>

export const resetCardSchema = z.object({
  cardId: z.string().uuid(),
  businessId: z.string().uuid(),
})
export type ResetCardInput = z.infer<typeof resetCardSchema>
