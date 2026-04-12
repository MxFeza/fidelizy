import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/services/auth.service'
import { AppError, withErrorHandler } from '@/lib/errors'

export const POST = withErrorHandler(async (request) => {
  const { email, token } = await request.json()
  if (!email || typeof email !== 'string') throw AppError.validation('Email manquant')
  if (!token || typeof token !== 'string' || token.length !== 6) throw AppError.validation('Code invalide')

  const supabase = createServiceClient()
  const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const result = await verifyOtp(supabase, supabaseAuth, { email, token })

  return NextResponse.json(result)
})
