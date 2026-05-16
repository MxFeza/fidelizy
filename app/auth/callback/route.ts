import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback handler — echange le `?code=xxx` envoye par Supabase
 * (PKCE flow) contre une session en cookies, puis redirige vers `next`.
 *
 * Fix bug reset password 2026-05-15 (signale par client commercant) :
 * @supabase/ssr 0.8.0 + supabase-js 2.98.0 utilisent PKCE par defaut.
 * Le lien email `resetPasswordForEmail` envoie un `?code=xxx` a la
 * redirect URL. Sans cette route qui appelle exchangeCodeForSession,
 * la session n'est jamais etablie cote serveur, et le updateUser sur
 * /dashboard/reset-password echouait silencieusement (perception user :
 * "le lien ne fait rien").
 *
 * Pattern officiel Supabase Next.js SSR :
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * Query params :
 *   - code (requis) : le PKCE code fourni par Supabase Auth
 *   - next (optionnel) : path relatif vers lequel rediriger apres echange
 *
 * Erreurs :
 *   - Pas de code → redirect /dashboard/forgot-password?error=invalid_link
 *   - Echec exchange → idem (lien expire ou deja utilise)
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Whitelist des paths next acceptes pour eviter open redirect
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard/forgot-password?error=invalid_link`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
    return NextResponse.redirect(`${origin}/dashboard/forgot-password?error=expired_link`)
  }

  return NextResponse.redirect(`${origin}${safeNext}`)
}
