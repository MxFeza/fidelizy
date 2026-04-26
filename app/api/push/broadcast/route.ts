export const dynamic = 'force-dynamic'

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

  const { title, body, scheduledAt } = await request.json()
  if (!title || !body) throw AppError.validation('Titre et message requis')
  if (typeof title !== 'string' || title.length > 50) throw AppError.validation('Titre trop long (50 caractères max)')
  if (typeof body !== 'string' || body.length > 100) throw AppError.validation('Message trop long (100 caractères max)')

  // Programmation : on persiste sans envoyer, le cron prendra le relais
  if (scheduledAt) {
    const when = new Date(scheduledAt)
    if (isNaN(when.getTime())) throw AppError.validation('Date de programmation invalide')
    if (when.getTime() < Date.now() - 60_000) throw AppError.validation('La date doit être dans le futur')

    const { data: row, error: insertErr } = await supabase.from('push_broadcasts').insert({
      business_id: user.id,
      title,
      body,
      recipient_count: 0,
      status: 'scheduled',
      scheduled_at: when.toISOString(),
    }).select('id').single()

    if (insertErr) throw insertErr
    return NextResponse.json({ success: true, scheduled: true, id: row?.id })
  }

  // Envoi immediat
  const { recipientCount } = await broadcastToBusinessClients(user.id, { title, body })

  await supabase.from('push_broadcasts').insert({
    business_id: user.id,
    title,
    body,
    recipient_count: recipientCount,
    status: 'sent',
    sent_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, recipientCount })
})
