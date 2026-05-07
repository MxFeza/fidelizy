import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { profileUpdateLimiter, getIP } from '@/lib/ratelimit'

const schema = z.object({
  push_enabled: z.boolean().optional(),
  stamps_enabled: z.boolean().optional(),
  rewards_enabled: z.boolean().optional(),
  campaigns_enabled: z.boolean().optional(),
  referrals_enabled: z.boolean().optional(),
})

/**
 * PATCH /api/me/notification-prefs — merge prefs notif client.
 * Body : { push_enabled?, stamps_enabled?, rewards_enabled?, campaigns_enabled?, referrals_enabled? }
 * Story 4.7 v2 P1.1.
 */
export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const ip = getIP(request)
  const { success } = await profileUpdateLimiter.limit(`notif-prefs:${user.id}:${ip}`)
  if (!success) throw AppError.rateLimit('Trop de mises à jour. Réessayez plus tard.')

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) throw AppError.validation('Paramètres invalides')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id, notification_prefs')
    .eq('email', user.email)
    .maybeSingle()
  if (!customer) throw AppError.notFound('Profil introuvable')

  const merged = {
    ...((customer.notification_prefs as Record<string, unknown>) ?? {}),
    ...parsed.data,
  }

  const { error } = await service
    .from('customers')
    .update({ notification_prefs: merged })
    .eq('id', customer.id)
  if (error) throw new AppError('Erreur lors de la mise à jour', 500)

  return NextResponse.json({ ok: true, notification_prefs: merged })
})
