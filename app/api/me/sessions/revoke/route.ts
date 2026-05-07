import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AppError, withErrorHandler } from '@/lib/errors'
import { profileUpdateLimiter, getIP } from '@/lib/ratelimit'

/**
 * POST /api/me/sessions/revoke — révoque toutes les autres sessions.
 * Garde la session courante active. Story 4.7 v2 P1.4.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const ip = getIP(request)
  const { success } = await profileUpdateLimiter.limit(`sessions-revoke:${user.id}:${ip}`)
  if (!success) throw AppError.rateLimit('Trop de tentatives. Réessayez plus tard.')

  // signOut scope 'others' = invalide tous les refresh tokens sauf la session courante
  const { error } = await supabase.auth.signOut({ scope: 'others' })
  if (error) {
    console.error('Session revoke error:', error)
    throw new AppError('Erreur lors de la révocation.', 500)
  }

  return NextResponse.json({ ok: true })
})
