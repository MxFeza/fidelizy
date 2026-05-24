import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { otpLimiter, getIP } from '@/lib/ratelimit'
import { addEmailAndSendOtp } from '@/lib/services/auth.service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { addEmailSchema } from '@/lib/services/auth.schemas'

export const POST = withErrorHandler(async (request) => {
  const { success } = await otpLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessayez dans quelques minutes.')

  const body = await request.json().catch(() => ({}))
  const parsed = addEmailSchema.safeParse(body)
  if (!parsed.success) {
    throw AppError.validation(parsed.error.issues[0]?.message ?? 'Données invalides')
  }
  // addEmailSchema deja trim/lowercase email, le service consomme tel quel.
  const { phone, email } = parsed.data

  const supabase = createServiceClient()
  const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const result = await addEmailAndSendOtp(supabase, supabaseAuth, { phone, email })

  return NextResponse.json(result)
})
