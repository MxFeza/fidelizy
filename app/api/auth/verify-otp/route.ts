import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/services/auth.service'
import { verifyOtpSchema } from '@/lib/services/auth.schemas'
import { AppError, withErrorHandler } from '@/lib/errors'

/**
 * Verify OTP token et persiste la session client (cookie) via le server-side
 * Supabase client. Permet de garder le client connecte entre les pages /me,
 * /card/{cardId}, etc.
 *
 * Accept phone OR email comme identifier (cf. auth.schemas).
 */
export const POST = withErrorHandler(async (request) => {
  const parsed = verifyOtpSchema.safeParse(await request.json())
  if (!parsed.success) throw AppError.validation('phone ou email + token requis')

  const supabase = createServiceClient()
  const supabaseAuth = await createServerClient() // cookies-aware: persiste la session apres verify
  const result = await verifyOtp(supabase, supabaseAuth, parsed.data)

  return NextResponse.json(result)
})
