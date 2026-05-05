// This file configures the initialization of Sentry on the client side.
// The config is loaded whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,

  // Sample 10% of transactions in prod, 100% in dev for full visibility while ramping up.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture session replay only on errors to keep volume manageable on the free tier.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Send breadcrumbs in dev for easier debugging; quiet otherwise.
  debug: false,

  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // Filter out known noise.
  ignoreErrors: [
    // Common browser extension noise
    'top.GLOBALS',
    // Network errors users can't act on
    'NetworkError when attempting to fetch resource',
    // ResizeObserver throttling (benign)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],
})
