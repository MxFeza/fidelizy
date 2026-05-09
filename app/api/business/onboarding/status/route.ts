export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AppError, withErrorHandler } from '@/lib/errors'
import { getMerchantTaskStatus } from '@/lib/onboarding/getMerchantTaskStatus'

/**
 * GET /api/business/onboarding/status
 *
 * Renvoie l'état d'onboarding du commerçant connecté :
 *  { started, completed, percent, doneCount, totalCount, tasks: [...] }
 *
 * Auth : Supabase cookie SSR. Le `business_id` vaut `auth.uid()` (relation 1:1).
 *
 * Pas de rate-limit dur (lecture pure, idempotent). Le client peut cacher
 * 30 s côté front pour limiter les appels (cf spec §14 risque perf).
 */
export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw AppError.auth('Non authentifié')

  const status = await getMerchantTaskStatus(user.id)

  return NextResponse.json(status)
})
