/**
 * Setup fontconfig pour Sharp/libvips/Pango sur Vercel serverless.
 *
 * Probleme : sur AWS Lambda / Vercel, libvips (utilise par Sharp) appelle
 * Pango pour rendre le texte des SVG. Pango utilise Fontconfig pour resoudre
 * les noms de polices. Mais Fontconfig n'a pas de fichier de config par
 * defaut sur Vercel → erreur "Cannot load default config file" + fallback
 * vers une police qui ne contient pas les glyphes Unicode = boxes.
 *
 * Solution : ecrire un fonts.conf minimal dans /tmp/ qui pointe vers le
 * dossier `lib/fonts/` du deploiement, et set FONTCONFIG_PATH avant que
 * Sharp/libvips initialise Pango.
 *
 * IMPORTANT : ce module DOIT etre importe AVANT `sharp` dans share-card.ts
 * pour que FONTCONFIG_PATH soit dans le process.env quand Sharp charge son
 * binding natif.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CONFIG_DIR = join(tmpdir(), 'izou-fontconfig')
const CACHE_DIR = join(tmpdir(), 'izou-fontconfig-cache')

// Plusieurs paths possibles pour les fonts selon le deploiement Vercel.
const FONT_DIRS = [
  join(process.cwd(), 'lib', 'fonts'),
  '/var/task/lib/fonts',
  join(process.cwd(), 'public', 'fonts'),
]

try {
  mkdirSync(CONFIG_DIR, { recursive: true })
  mkdirSync(CACHE_DIR, { recursive: true })

  const fontsConf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
${FONT_DIRS.map((d) => `  <dir>${d}</dir>`).join('\n')}
  <cachedir>${CACHE_DIR}</cachedir>

  <!-- Aliases pour que sans-serif/Arial/etc. resolvent vers Inter -->
  <alias>
    <family>sans-serif</family>
    <prefer><family>Inter</family></prefer>
  </alias>
  <alias>
    <family>Arial</family>
    <prefer><family>Inter</family></prefer>
  </alias>
  <alias>
    <family>Helvetica</family>
    <prefer><family>Inter</family></prefer>
  </alias>
  <alias>
    <family>system-ui</family>
    <prefer><family>Inter</family></prefer>
  </alias>

  <!-- Fallback final si Inter pas trouve -->
  <alias>
    <family>Inter</family>
    <default><family>sans-serif</family></default>
  </alias>
</fontconfig>`

  const confPath = join(CONFIG_DIR, 'fonts.conf')
  writeFileSync(confPath, fontsConf)
  // Multiples env vars pour couvrir differentes versions de fontconfig.
  process.env.FONTCONFIG_PATH = CONFIG_DIR
  process.env.FONTCONFIG_FILE = confPath
  // Tell pango/cairo where to find fonts config too.
  if (!process.env.XDG_CONFIG_HOME) {
    process.env.XDG_CONFIG_HOME = CONFIG_DIR
  }

  console.log(`[fontconfig-setup] FONTCONFIG_PATH=${CONFIG_DIR} FONTCONFIG_FILE=${confPath}`)
} catch (e) {
  console.warn('[fontconfig-setup] failed to write fonts.conf:', e)
}
