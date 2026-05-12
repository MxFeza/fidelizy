import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export type ErrorCode = 'VALIDATION' | 'AUTH' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMIT' | 'INTERNAL'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: ErrorCode = 'INTERNAL'
  ) {
    super(message)
    this.name = 'AppError'
  }

  static validation(message: string) {
    return new AppError(message, 400, 'VALIDATION')
  }

  static auth(message: string) {
    return new AppError(message, 401, 'AUTH')
  }

  static forbidden(message: string) {
    return new AppError(message, 403, 'FORBIDDEN')
  }

  static notFound(message: string) {
    return new AppError(message, 404, 'NOT_FOUND')
  }

  static conflict(message: string) {
    return new AppError(message, 409, 'CONFLICT')
  }

  static rateLimit(message: string) {
    return new AppError(message, 429, 'RATE_LIMIT')
  }
}

type RouteHandler = (request: NextRequest, context?: unknown) => Promise<NextResponse | Response>

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: unknown) => {
    try {
      return await handler(request, context)
    } catch (err) {
      const timestamp = new Date().toISOString()
      const route = request.nextUrl.pathname

      // Known application errors — these are expected (validation, auth,
      // not-found, rate-limit). Log to console for Vercel debugging but do
      // NOT send to Sentry: they're not bugs, they're contract violations.
      if (err instanceof AppError) {
        console.error(
          `[${timestamp}] AppError ${err.code} ${err.statusCode} on ${route}: ${err.message}`
        )
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: err.statusCode }
        )
      }

      // Malformed JSON body from client — also expected, don't ship to Sentry.
      if (err instanceof SyntaxError && err.message.includes('JSON')) {
        console.error(`[${timestamp}] Invalid JSON on ${route}: ${err.message}`)
        return NextResponse.json(
          { error: 'Payload JSON invalide', code: 'VALIDATION' as ErrorCode },
          { status: 400 }
        )
      }

      // Supabase / Postgres errors (have a `code` and `message` property)
      // → these usually indicate a real bug (RLS broken, schema drift, RPC
      // wrong signature). Capture with structured tags so we can filter
      // by db_code in Sentry issues.
      const supaErr = err as { code?: string; message?: string; details?: string }
      if (supaErr.code && supaErr.message) {
        console.error(
          `[${timestamp}] DB error on ${route}: ${supaErr.code} — ${supaErr.message}`,
          supaErr.details ?? ''
        )
        Sentry.withScope((scope) => {
          scope.setTag('error_kind', 'db')
          scope.setTag('db_code', supaErr.code ?? 'unknown')
          scope.setTag('route', route)
          scope.setExtra('details', supaErr.details ?? null)
          Sentry.captureException(err)
        })
        return NextResponse.json(
          { error: 'Erreur serveur inattendue', code: 'INTERNAL' as ErrorCode },
          { status: 500 }
        )
      }

      // Unknown error — the most important to surface in Sentry. These are
      // raw bugs (TypeError, undefined access, third-party SDK throws, ...).
      const message = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : undefined
      console.error(
        `[${timestamp}] Unhandled error on ${route}: ${message}`,
        process.env.NODE_ENV === 'development' ? stack : ''
      )
      Sentry.withScope((scope) => {
        scope.setTag('error_kind', 'unhandled')
        scope.setTag('route', route)
        Sentry.captureException(err)
      })

      return NextResponse.json(
        { error: 'Erreur serveur inattendue', code: 'INTERNAL' as ErrorCode },
        { status: 500 }
      )
    }
  }
}
