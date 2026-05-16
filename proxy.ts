import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy Next.js 16 (= middleware classique) — 2 responsabilités :
 *
 * 1. **Auth merchant** sur `/dashboard/*` : redirige vers `/dashboard/login`
 *    si pas user, vers `/dashboard` si user déjà loggé sur login/register.
 *
 * 2. **Refresh session SSR** sur les routes authentifiées Customer
 *    (`/me/*`, sous-routes `/card/[cardId]/*` qui dépendent d'une session
 *    OTP cliente). Le simple appel à `supabase.auth.getUser()` ci-dessous
 *    rafraîchit le token expiré via le cookie adapter Supabase SSR — cela
 *    évite les déconnexions silencieuses des Customer après 1h, finding
 *    G-T1.4 audit Gemini auth-rls 2026-05-08.
 *
 * Note : la home `/card/[cardId]` (carte loyalty publique via QR) reste
 * accessible sans auth — on ne redirige rien sur le scope `/card/*`.
 * Seul le refresh session est utile pour les sous-routes auth-gated
 * (`/card/[cardId]/notifications` etc.).
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session si expirée (effet de bord du getUser via cookie adapter)
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Auth check failed — treat as unauthenticated
  }

  const { pathname } = request.nextUrl

  // ── Auth merchant (scope /dashboard/*) ──
  if (pathname.startsWith('/dashboard')) {
    const PUBLIC_AUTH_ROUTES = new Set([
      '/dashboard/login',
      '/dashboard/register',
      '/dashboard/forgot-password',
      '/dashboard/reset-password',
    ])
    const REDIRECT_IF_LOGGED_IN = new Set([
      '/dashboard/login',
      '/dashboard/register',
    ])

    const isPublic = PUBLIC_AUTH_ROUTES.has(pathname)
    const isLoginOrRegister = REDIRECT_IF_LOGGED_IN.has(pathname)

    if (!isPublic && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/login'
      return NextResponse.redirect(url)
    }

    if (isLoginOrRegister && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // ── Refresh-only pour /me/* et /card/* ──
  // Pas de redirect : les pages Server Components handle leur propre
  // logique d'auth (redirect ou rendu public selon contexte).

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/me/:path*',
    '/card/:path*',
  ],
}
