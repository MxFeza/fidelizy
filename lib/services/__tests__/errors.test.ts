import { describe, it, expect, vi } from 'vitest'
import { AppError, withErrorHandler } from '@/lib/errors'
import { NextRequest } from 'next/server'

describe('AppError', () => {
  it('should create error with code and status', () => {
    const err = new AppError('Not found', 404, 'NOT_FOUND')
    expect(err.message).toBe('Not found')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
    expect(err.name).toBe('AppError')
  })

  it('should default to INTERNAL code', () => {
    const err = new AppError('Server error', 500)
    expect(err.code).toBe('INTERNAL')
  })

  it('should have static factory methods', () => {
    expect(AppError.validation('bad').statusCode).toBe(400)
    expect(AppError.validation('bad').code).toBe('VALIDATION')
    expect(AppError.auth('denied').statusCode).toBe(401)
    expect(AppError.notFound('gone').statusCode).toBe(404)
    expect(AppError.rateLimit('slow').statusCode).toBe(429)
  })
})

describe('withErrorHandler', () => {
  function makeRequest(path = '/api/test') {
    return new NextRequest(new URL(path, 'http://localhost'))
  }

  it('should pass through successful responses', async () => {
    const handler = withErrorHandler(async () => {
      const { NextResponse } = await import('next/server')
      return NextResponse.json({ ok: true })
    })

    const res = await handler(makeRequest())
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(res.status).toBe(200)
  })

  it('should catch AppError and return JSON', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const handler = withErrorHandler(async () => {
      throw new AppError('Carte introuvable', 404, 'NOT_FOUND')
    })

    const res = await handler(makeRequest())
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.error).toBe('Carte introuvable')
    expect(body.code).toBe('NOT_FOUND')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('should catch unknown errors and hide details', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const handler = withErrorHandler(async () => {
      throw new Error('Supabase connection failed: password auth')
    })

    const res = await handler(makeRequest())
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error).toBe('Erreur serveur inattendue')
    expect(body.error).not.toContain('Supabase')
    expect(body.error).not.toContain('password')

    consoleSpy.mockRestore()
  })

  it('should catch Supabase-shaped errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const handler = withErrorHandler(async () => {
      throw { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: null }
    })

    const res = await handler(makeRequest())
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error).toBe('Erreur serveur inattendue')

    consoleSpy.mockRestore()
  })
})
