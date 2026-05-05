import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

/**
 * GET /api/me/profile — lit les infos du client connecté.
 * PATCH /api/me/profile — met à jour le prénom.
 *
 * Le téléphone et l'email ne sont PAS modifiables ici (il faut passer
 * par /recover ou /me login pour changer un identifier auth).
 */

export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id, first_name, phone, email, created_at')
    .eq('email', user.email)
    .maybeSingle()

  if (!customer) throw AppError.notFound('Profil introuvable')

  return NextResponse.json(customer)
})

const updateProfileSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
})

export const PATCH = withErrorHandler(async (request) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const parsed = updateProfileSchema.safeParse(await request.json())
  if (!parsed.success) throw AppError.validation('Paramètres invalides')

  const service = createServiceClient()
  const { error } = await service
    .from('customers')
    .update({ first_name: parsed.data.first_name })
    .eq('email', user.email)

  if (error) throw new AppError('Erreur lors de la mise à jour', 500)

  return NextResponse.json({ ok: true })
})
