/**
 * Cron worker — diffuse les push notifications programmees dont scheduled_at <= now().
 *
 * A invoquer toutes les minutes par Vercel Cron (ou autre planificateur).
 * Authentifie via header `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Pour chaque ligne `push_broadcasts` avec status='scheduled' et scheduled_at <= now() :
 *   1. Appelle broadcastToBusinessClients()
 *   2. Met a jour status = 'sent', recipient_count, sent_at
 *   3. En cas d'erreur, status = 'failed'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { broadcastToBusinessClients } from '@/lib/services/notification.service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  const { data: due, error } = await supabase
    .from('push_broadcasts')
    .select('id, business_id, title, body')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let success = 0
  let failed = 0

  for (const row of due) {
    try {
      const { recipientCount } = await broadcastToBusinessClients(row.business_id, {
        title: row.title,
        body: row.body,
      })
      await supabase
        .from('push_broadcasts')
        .update({ status: 'sent', sent_at: new Date().toISOString(), recipient_count: recipientCount })
        .eq('id', row.id)
      success++
    } catch {
      await supabase
        .from('push_broadcasts')
        .update({ status: 'failed' })
        .eq('id', row.id)
      failed++
    }
  }

  return NextResponse.json({ processed: due.length, success, failed })
}
