import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { joinLimiter, getIP } from '@/lib/ratelimit'
import { registerCustomer } from '@/lib/services/customer.service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

const joinInputSchema = z.object({
  businessId: z.string().min(1).max(100),
  firstName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email(),
  referral_code: z.string().optional(),
})

export const POST = withErrorHandler(async (request) => {
  const { success } = await joinLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessaie dans quelques secondes.')

  const parsed = joinInputSchema.safeParse(await request.json())
  if (!parsed.success) throw AppError.validation('Paramètres invalides')

  const supabase = createServiceClient()
  const { businessId, firstName, phone, email, referral_code } = parsed.data

  const result = await registerCustomer(supabase, {
    businessId,
    firstName,
    phone,
    email: email.toLowerCase(),
    referralCode: referral_code,
  })

  return NextResponse.json({ qrCodeId: result.qrCodeId, cardId: result.cardId })
})
