import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { getCustomerTaskStatus } from '@/lib/onboarding/getCustomerTaskStatus'

/**
 * GET /api/me/onboarding/status — renvoie l'état d'onboarding du client.
 *
 * Retour : { started, completed, percent, tasks: [{id, label, done}, …] }
 * Story 9.2.
 */
export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  if (!customer) throw AppError.notFound('Profil introuvable')

  const status = await getCustomerTaskStatus(customer.id)
  return NextResponse.json(status)
})
