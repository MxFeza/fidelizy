import { z } from 'zod'

export const phoneSchema = z.string().trim().min(6).max(20)
export const emailSchema = z.string().trim().email().toLowerCase()
export const uuidSchema = z.string().uuid()
export const shortCodeSchema = z.string().trim().length(6).toUpperCase()
export const otpTokenSchema = z.string().length(6).regex(/^\d{6}$/)

export const joinBodySchema = z.object({
  businessId: z.string().min(1),
  firstName: z.string().trim().min(1).max(100),
  phone: phoneSchema,
  email: emailSchema,
  referral_code: z.string().optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Le consentement est obligatoire' }),
  }),
})

export const scanBodySchema = z.object({
  qr_code_id: z.string().min(1).max(100),
})

export const cardActionSchema = z.object({
  card_id: uuidSchema,
  type: z.enum(['stamps', 'points']),
  amount: z.number().int().min(1).max(1000),
})

export const wheelSpinSchema = z.object({
  cardId: uuidSchema,
  businessId: uuidSchema,
})

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  token: otpTokenSchema,
})

export const sendOtpSchema = z.object({
  phone: phoneSchema,
})

// Helper to safely parse JSON body with Zod
export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: string }> {
  try {
    const raw = await request.json()
    const result = schema.safeParse(raw)
    if (!result.success) {
      const firstError = result.error.issues[0]
      return { error: firstError?.message || 'Données invalides' }
    }
    return { data: result.data }
  } catch {
    return { error: 'Corps de requête invalide' }
  }
}
