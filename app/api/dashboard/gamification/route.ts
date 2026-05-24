export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

// 0-3 tampons offerts a l'inscription. Au-dela on entre dans une mecanique
// de bonus de bienvenue qui n'est pas encore exposee cote merchant.
const gamificationUpdateSchema = z.object({
  initial_stamps: z.number().int().min(0).max(3),
})

export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw AppError.auth('Non autorisé')

  const { data: business } = await supabase
    .from('businesses')
    .select('gamification')
    .eq('id', user.id)
    .single()

  if (!business) throw AppError.notFound('Commerce introuvable')

  const initialStamps = (business.gamification as Record<string, unknown>)?.initial_stamps ?? 0

  return NextResponse.json({ initial_stamps: initialStamps })
})

export const PUT = withErrorHandler(async (request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw AppError.auth('Non autorisé')

  const body = await request.json().catch(() => ({}))
  const parsed = gamificationUpdateSchema.safeParse(body)
  if (!parsed.success) {
    throw AppError.validation(parsed.error.issues[0]?.message ?? 'initial_stamps requis (0-3)')
  }
  const initialStamps = parsed.data.initial_stamps

  await supabase
    .from('businesses')
    .update({ gamification: { initial_stamps: initialStamps } })
    .eq('id', user.id)
    .throwOnError()

  return NextResponse.json({ initial_stamps: initialStamps })
})
