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
    .select('id, first_name, last_name, phone, email, notification_prefs, created_at')
    .eq('email', user.email)
    .maybeSingle()

  if (!customer) throw AppError.notFound('Profil introuvable')

  return NextResponse.json(customer)
})

const updateProfileSchema = z.object({
  first_name: z.string().trim().min(1).max(100).optional(),
  last_name: z.string().trim().max(100).nullable().optional(),
}).refine((d) => d.first_name !== undefined || d.last_name !== undefined, {
  message: 'Au moins un champ à mettre à jour',
})

export const PATCH = withErrorHandler(async (request) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const parsed = updateProfileSchema.safeParse(await request.json())
  if (!parsed.success) throw AppError.validation('Paramètres invalides')

  const update: Record<string, string | null> = {}
  if (parsed.data.first_name !== undefined) update.first_name = parsed.data.first_name
  if (parsed.data.last_name !== undefined) update.last_name = parsed.data.last_name === '' ? null : parsed.data.last_name

  const service = createServiceClient()
  const { error } = await service
    .from('customers')
    .update(update)
    .eq('email', user.email)

  if (error) throw new AppError('Erreur lors de la mise à jour', 500)

  return NextResponse.json({ ok: true })
})
