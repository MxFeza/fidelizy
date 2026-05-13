import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co").hostname;
  } catch {
    return "placeholder.supabase.co";
  }
})();

const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com https://vercel.live`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${supabaseHost}`,
  "font-src 'self' data:",
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.upstash.io https://api.notion.com https://vitals.vercel-insights.com https://*.ingest.de.sentry.io${isDev ? ' ws://localhost:* http://localhost:*' : ''}`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // `@resvg/resvg-js` a un binding natif (.node) que Turbopack ne sait pas
  // bundler en ESM. On le marque comme external pour que Next.js l'expose
  // via require() au runtime (Node native module loader).
  serverExternalPackages: ['@resvg/resvg-js'],
  // Force Next.js a inclure les .ttf fonts dans la lambda Vercel — sans ca,
  // `fs.readFileSync('lib/fonts/Inter-*.ttf')` echoue en serverless car les
  // fichiers ne sont pas detectes par le tracing automatique (pas d'import
  // direct dans le code TS).
  outputFileTracingIncludes: {
    '/api/share-card/**': ['./lib/fonts/**/*'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ]
  },
};

// Wrap with Sentry — source maps uploaded to Sentry on build (requires SENTRY_AUTH_TOKEN
// in CI/Vercel env). Without the token, the build still succeeds but source maps are skipped.
export default withSentryConfig(nextConfig, {
  org: "ebella",
  project: "fidelizy",
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
