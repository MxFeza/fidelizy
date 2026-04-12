import { NextRequest, NextResponse } from 'next/server'

export type ErrorCode = 'VALIDATION' | 'AUTH' | 'NOT_FOUND' | 'RATE_LIMIT' | 'INTERNAL'

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

  static notFound(message: string) {
    return new AppError(message, 404, 'NOT_FOUND')
  }

  static rateLimit(message: string) {
    return new AppError(message, 429, 'RATE_LIMIT')
  }
}

type RouteHandler = (request: NextRequest) => Promise<NextResponse>

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest) => {
    try {
      return await handler(request)
    } catch (err) {
      const timestamp = new Date().toISOString()
      const route = request.nextUrl.pathname

      if (err instanceof AppError) {
        console.error(
          `[${timestamp}] AppError ${err.code} ${err.statusCode} on ${route}: ${err.message}`
        )
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: err.statusCode }
        )
      }

      // Supabase errors have a `code` and `message` property
      const supaErr = err as { code?: string; message?: string; details?: string }
      if (supaErr.code && supaErr.message) {
        console.error(
          `[${timestamp}] DB error on ${route}: ${supaErr.code} — ${supaErr.message}`,
          supaErr.details ?? ''
        )
        return NextResponse.json(
          { error: 'Erreur serveur inattendue', code: 'INTERNAL' as ErrorCode },
          { status: 500 }
        )
      }

      // Unknown error
      const message = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : undefined
      console.error(
        `[${timestamp}] Unhandled error on ${route}: ${message}`,
        process.env.NODE_ENV === 'development' ? stack : ''
      )

      return NextResponse.json(
        { error: 'Erreur serveur inattendue', code: 'INTERNAL' as ErrorCode },
        { status: 500 }
      )
    }
  }
}
