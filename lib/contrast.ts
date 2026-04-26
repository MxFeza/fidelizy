/**
 * Calcul de contraste pour decider d'un texte clair ou sombre sur une couleur de fond.
 * Utilise la formule de luminance relative WCAG.
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '').trim()
  const full = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned
  if (full.length !== 6) return null
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return null
  return { r, g, b }
}

/** Luminance relative WCAG (0 = noir, 1 = blanc). */
function luminance(r: number, g: number, b: number): number {
  const channel = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * Retourne 'light' (utiliser texte clair sur ce fond) ou 'dark' (utiliser texte sombre).
 * Seuil 0.5 = compromis raisonnable. Le seuil WCAG strict pour AA serait calcule sur le ratio,
 * mais pour un choix binaire light/dark, 0.5 est suffisant.
 */
export function pickTextTone(bgHex: string | null | undefined): 'light' | 'dark' {
  if (!bgHex) return 'light'
  const rgb = hexToRgb(bgHex)
  if (!rgb) return 'light'
  return luminance(rgb.r, rgb.g, rgb.b) > 0.5 ? 'dark' : 'light'
}
