import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { broadcastLimiter } from '@/lib/ratelimit'
import { createServiceClient } from '@/lib/supabase/service'
import { broadcastToBusinessClients } from '@/lib/services/notification.service'
import { AppError, withErrorHandler } from '@/lib/errors'

export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const serviceClient = createServiceClient()
  const { count } = await serviceClient
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', user.id)

  return NextResponse.json({ count: count ?? 0 })
})

export const POST = withErrorHandler(async (request) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const { success: rateLimitOk } = await broadcastLimiter.limit(user.id)
  if (!rateLimitOk) throw AppError.rateLimit('Limite atteinte : 5 notifications par heure maximum.')

  const { title, body } = await request.json()
  if (!title || !body) throw AppError.validation('Titre et message requis')
  if (typeof title !== 'string' || title.length > 50) throw AppError.validation('Titre trop long (50 caractères max)')
  if (typeof body !== 'string' || body.length > 100) throw AppError.validation('Message trop long (100 caractères max)')

  await broadcastToBusinessClients(user.id, { title, body })
  return NextResponse.json({ success: true })
})
