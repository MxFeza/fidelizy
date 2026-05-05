// This file configures the initialization of Sentry on the server side (Node.js runtime).
// The config is loaded whenever Next.js runs in node mode (API routes, SSR, etc.).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  debug: false,

  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
})
