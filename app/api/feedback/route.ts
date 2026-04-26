export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_FEEDBACK_DB_ID = process.env.NOTION_FEEDBACK_DB_ID

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

  const { message, page } = await request.json()
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw AppError.validation('Le message est requis')
  }

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
            title: [{ text: { content: message.trim().slice(0, 80) } }],
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
            rich_text: [{ text: { content: message.trim().slice(0, 2000) } }],
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
