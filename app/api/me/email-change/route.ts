import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { AppError, withErrorHandler } from '@/lib/errors'
import { profileUpdateLimiter, getIP } from '@/lib/ratelimit'

const schema = z.object({
  new_email: z.string().trim().toLowerCase().email('Email invalide'),
})

/**
 * POST /api/me/email-change — déclenche le changement d'email customer.
 * Supabase Auth envoie un mail de confirmation au nouvel email — la mise à
 * jour effective n'a lieu qu'après clic sur le lien. Story 4.7 v2 P1.4.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const ip = getIP(request)
  const { success } = await profileUpdateLimiter.limit(`email-change:${user.id}:${ip}`)
  if (!success) throw AppError.rateLimit('Trop de tentatives. Réessayez plus tard.')

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) throw AppError.validation(parsed.error.issues[0]?.message ?? 'Email invalide')

  if (parsed.data.new_email === user.email) {
    throw AppError.validation('Le nouvel email est identique à l\'actuel.')
  }

  const { error } = await supabase.auth.updateUser({ email: parsed.data.new_email })
  if (error) {
    console.error('Email change error:', error)
    throw new AppError(error.message || 'Erreur lors du changement d\'email.', 400)
  }

  return NextResponse.json({
    ok: true,
    message: 'Un email de confirmation a été envoyé à votre nouvelle adresse.',
  })
})
