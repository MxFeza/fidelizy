import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

type LimitResult = { success: boolean; limit: number; remaining: number; reset: number }

let upstashWarned = false

/**
 * Wraps un Ratelimit Upstash pour qu'il soit gracieux en dev local quand
 * l'env Redis n'est pas configurée (ou les creds expirées). En production
 * on laisse l'erreur remonter — fail-closed sur l'infra critique.
 */
function gracefulLimit(rl: Ratelimit) {
  return {
    limit: async (key: string): Promise<LimitResult> => {
      try {
        return await rl.limit(key)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          if (!upstashWarned) {
            console.warn(
              '[ratelimit] Upstash KV unavailable in dev — bypassing rate limit. Configure KV_REST_API_URL/TOKEN to test rate limiting locally.',
              err instanceof Error ? err.message : err,
            )
            upstashWarned = true
          }
          return { success: true, limit: Infinity, remaining: Infinity, reset: 0 }
        }
        throw err
      }
    },
  }
}

export const scanLimiter = gracefulLimit(new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'rl:scan',
}))

export const joinLimiter = gracefulLimit(new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  prefix: 'rl:join',
}))

export const recoverLimiter = gracefulLimit(new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  prefix: 'rl:recover',
}))

export const otpLimiter = gracefulLimit(new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '600 s'),
  prefix: 'rl:otp',
}))

export const cardWriteLimiter = gracefulLimit(new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  prefix: 'rl:card-write',
}))

export const pushLimiter = gracefulLimit(new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'rl:push',
}))

export const broadcastLimiter = gracefulLimit(new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '3600 s'),
  prefix: 'rl:broadcast',
}))

export const profileUpdateLimiter = gracefulLimit(new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '3600 s'),
  prefix: 'rl:profile-update',
}))

export const merchantOtpLimiter = gracefulLimit(new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '600 s'),
  prefix: 'rl:merchant-otp',
}))

export function getIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'anonymous'
}
