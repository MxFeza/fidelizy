import { z } from 'zod'

export const processReferralSchema = z.object({
  referralCode: z.string().min(1),
  referredCardId: z.string().uuid(),
  businessId: z.string().uuid(),
  referredFirstName: z.string().min(1),
})
export type ProcessReferralInput = z.infer<typeof processReferralSchema>
