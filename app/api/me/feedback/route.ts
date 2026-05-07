import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { getIP } from '@/lib/ratelimit'

const schema = z.object({
  message: z.string().trim().min(10, 'Le message doit faire au moins 10 caractères.').max(1000, 'Le message ne peut pas dépasser 1000 caractères.'),
})

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const feedbackLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '3600 s'),
  prefix: 'rl:customer-feedback',
})

/**
 * POST /api/me/feedback — soumet un feedback libre client.
 * Body : { message: string (10-1000) }
 * Rate-limit : 3/heure par customer. Story 4.7 v2.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const ip = getIP(request)
  let success = true
  try {
    const result = await feedbackLimiter.limit(`feedback:${user.id}:${ip}`)
    success = result.success
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err
    console.warn('[ratelimit] Upstash unavailable in dev — bypassing.', err instanceof Error ? err.message : err)
  }
  if (!success) throw AppError.rateLimit('Vous avez envoyé trop de feedbacks. Réessayez dans une heure.')

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    throw AppError.validation(parsed.error.issues[0]?.message ?? 'Message invalide')
  }

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  if (!customer) throw AppError.notFound('Profil introuvable')

  const { error } = await service
    .from('customer_feedback')
    .insert({ customer_id: customer.id, message: parsed.data.message })
  if (error) throw new AppError('Erreur lors de l\'envoi.', 500)

  return NextResponse.json({ ok: true })
})
