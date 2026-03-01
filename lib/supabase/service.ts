import { createClient } from '@supabase/supabase-js'

/**
 * Service role client — bypasses RLS.
 * Never import this in client components or expose it to the browser.
 * Use only in API routes and server components for public (unauthenticated) operations.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
