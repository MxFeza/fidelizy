export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'

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

  const body = await request.json()
  const initialStamps =
    typeof body.initial_stamps === 'number'
      ? Math.max(0, Math.min(3, Math.floor(body.initial_stamps)))
      : undefined

  if (initialStamps === undefined) throw AppError.validation('initial_stamps requis (0-3)')

  await supabase
    .from('businesses')
    .update({ gamification: { initial_stamps: initialStamps } })
    .eq('id', user.id)
    .throwOnError()

  return NextResponse.json({ initial_stamps: initialStamps })
})
