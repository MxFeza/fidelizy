import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/services/auth.service'
import { AppError, withErrorHandler } from '@/lib/errors'

/**
 * Verify OTP token (envoye par email a partir d'un phone lookup) et
 * persiste la session client (cookie) via le server-side Supabase
 * client. Permet de garder le client connecte entre les pages /me,
 * /card/{cardId}, etc.
 */
export const POST = withErrorHandler(async (request) => {
  const { phone, token } = await request.json()
  if (!phone || typeof phone !== 'string') throw AppError.validation('Numéro manquant')
  if (!token || typeof token !== 'string' || token.length !== 6) throw AppError.validation('Code invalide')

  const supabase = createServiceClient()
  const supabaseAuth = await createServerClient() // cookies-aware: persiste la session apres verify
  const result = await verifyOtp(supabase, supabaseAuth, { phone, token })

  return NextResponse.json(result)
})
