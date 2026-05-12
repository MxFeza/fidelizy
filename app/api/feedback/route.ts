export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_FEEDBACK_DB_ID = process.env.NOTION_FEEDBACK_DB_ID

const feedbackInputSchema = z.object({
  // 2000 = ce qu'on slice avant envoi à Notion. Borne haute pour bloquer les
  // payloads gigantesques (DoS / abus du form). Min 1 pour rejeter le vide.
  message: z.string().trim().min(1).max(2000),
  // page : URL ou label de la page d'origine. 256 chars suffisent largement.
  page: z.string().max(256).optional().or(z.literal('')),
})

export const POST = withErrorHandler(async (request: Request) => {
  // Auth — only logged-in merchants can submit feedback
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw AppError.auth('Non authentifié')

  // Get business info
  const { data: business } = await supabase
    .from('businesses')
    .select('business_name')
    .eq('id', user.id)
    .single()

  const parsed = feedbackInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw AppError.validation('Le message est requis (1-2000 caractères)')
  const { message, page } = parsed.data

  // Send to Notion if configured
  if (NOTION_API_KEY && NOTION_FEEDBACK_DB_ID) {
    await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_FEEDBACK_DB_ID },
        properties: {
          'Titre': {
            title: [{ text: { content: message.slice(0, 80) } }],
          },
          'Commerce': {
            rich_text: [{ text: { content: business?.business_name ?? 'Inconnu' } }],
          },
          'Email': {
            email: user.email ?? null,
          },
          'Type': {
            select: { name: 'Amelioration' },
          },
          'Message': {
            rich_text: [{ text: { content: message } }],
          },
          'Page concernee': {
            rich_text: [{ text: { content: page ?? '' } }],
          },
          'Statut': {
            select: { name: 'Nouveau' },
          },
        },
      }),
    })
  }

  return NextResponse.json({ ok: true })
})
