import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { AppError, withErrorHandler } from '@/lib/errors'
import { merchantOtpLimiter, getIP } from '@/lib/ratelimit'

const schema = z.object({
  new_password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.').max(72, 'Mot de passe trop long.'),
})

/**
 * POST /api/me/password-change — change le mot de passe customer.
 * Note: les clients Izou s'authentifient principalement via OTP. Cet endpoint
 * permet de définir / changer un mot de passe pour ceux qui veulent un
 * second mode d'auth. Story 4.7 v2 P1.4.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const ip = getIP(request)
  const { success } = await merchantOtpLimiter.limit(`password-change:${user.id}:${ip}`)
  if (!success) throw AppError.rateLimit('Trop de tentatives. Réessayez dans 10 minutes.')

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) throw AppError.validation(parsed.error.issues[0]?.message ?? 'Mot de passe invalide')

  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password })
  if (error) {
    console.error('Password change error:', error)
    throw new AppError(error.message || 'Erreur lors du changement de mot de passe.', 400)
  }

  return NextResponse.json({ ok: true, updated_at: new Date().toISOString() })
})
