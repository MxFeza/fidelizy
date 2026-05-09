import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { scanLimiter, getIP } from '@/lib/ratelimit'
import { scanCard } from '@/lib/services/loyalty.service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

const scanInputSchema = z.object({
  qr_code_id: z.string().min(1).max(100),
})

export const POST = withErrorHandler(async (request) => {
  const { success } = await scanLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessaie dans quelques secondes.')

  const body = await request.json()
  const parsed = scanInputSchema.safeParse(body)
  if (!parsed.success) throw AppError.validation('qr_code_id invalide')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, business_name, stamps_required, stamps_reward, loyalty_type, points_per_euro, scan_cooldown_hours')
    .eq('id', user.id)
    .single()

  if (!business) throw AppError.notFound('Commerce introuvable')

  // RPCs loyalty appelées en service_role (TD-001 Option C 2026-05-08) :
  // les fonctions increment_stamps/points sont REVOKE FROM authenticated.
  // L'auth merchant est déjà vérifiée ci-dessus via supabase.auth.getUser.
  const service = createServiceClient()
  const result = await scanCard(service, { qrCodeId: parsed.data.qr_code_id, business })

  return NextResponse.json({
    success: true,
    customer: result.customer,
    card: result.updatedCard,
    message: result.message,
  })
})
