import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { otpLimiter, getIP } from '@/lib/ratelimit'
import { sendOtp } from '@/lib/services/auth.service'
import { sendOtpSchema } from '@/lib/services/auth.schemas'
import { AppError, withErrorHandler } from '@/lib/errors'

export const POST = withErrorHandler(async (request) => {
  const { success } = await otpLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessayez dans quelques minutes.')

  const parsed = sendOtpSchema.safeParse(await request.json())
  if (!parsed.success) throw AppError.validation('phone ou email requis')

  const supabase = createServiceClient()
  const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const result = await sendOtp(supabase, supabaseAuth, parsed.data)

  return NextResponse.json(result)
})
