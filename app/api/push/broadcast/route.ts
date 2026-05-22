export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { broadcastLimiter } from '@/lib/ratelimit'
import { createServiceClient } from '@/lib/supabase/service'
import { broadcastToBusinessClients } from '@/lib/services/notification.service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

const broadcastInputSchema = z.object({
  title: z.string().trim().min(1).max(50),
  body: z.string().trim().min(1).max(100),
  // scheduledAt : ISO 8601 (Date.parse-compatible). Validation temporelle
  // (>= maintenant - 60s) faite après le parse pour message d'erreur clair.
  // .nullable() : le client envoie `null` pour les envois immediats (cf.
  // PushClient.doSend) — sinon Zod fail avec "Paramètres invalides".
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
})

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

  const parsed = broadcastInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw AppError.validation(
      issue?.path?.[0] === 'title'
        ? 'Titre invalide (1-50 caractères)'
        : issue?.path?.[0] === 'body'
        ? 'Message invalide (1-100 caractères)'
        : 'Paramètres invalides'
    )
  }
  const { title, body, scheduledAt } = parsed.data

  // Programmation : on persiste sans envoyer, le cron prendra le relais
  if (scheduledAt) {
    const when = new Date(scheduledAt)
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
