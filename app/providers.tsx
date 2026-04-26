'use client'

import { ThemeProvider } from 'next-themes'

// Light mode uniquement (pas de dark mode v1).
// `forcedTheme="light"` neutralise toute detection OS/systeme.
// Quand le dark mode sera prêt (v2), remplacer par :
//   <ThemeProvider attribute="class" value={{ dark: 'dark-mode' }} defaultTheme="light" enableSystem>
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light">
      {children}
    </ThemeProvider>
  )
}
