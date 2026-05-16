/**
 * Catalogue Izou — Microsoft Fluent Emoji.
 *
 * Source : https://github.com/microsoft/fluentui-emoji (MIT)
 * Rendu : CDN jsDelivr `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/{folder}/Color/{slug}_color.png`
 * Fallback : caractère Unicode si l'asset CDN ne charge pas.
 *
 * Pour ajouter un emoji : étendre `EMOJI_CATALOG`, choisir une `category` existante,
 * puis renseigner le `unicode` (fallback) + `fluentFolder` (nom du dossier dans le repo).
 *
 * Voir `lib/emojis/README.md` pour les conventions.
 */

import type { BusinessType } from '@/lib/types'

export type EmojiCategory =
  | 'beverages'
  | 'pastries'
  | 'meals'
  | 'desserts'
  | 'hair'
  | 'nails'
  | 'beauty'
  | 'florist'
  | 'apparel'
  | 'rewards'
  | 'ui'
  | 'merchant'

export interface EmojiEntry {
  /** Caractère Unicode utilisé en fallback si l'asset CDN ne charge pas. */
  unicode: string
  /**
   * Nom du dossier dans `microsoft/fluentui-emoji@main/assets/`.
   * Le slug fichier est dérivé en lowercase + underscores + `_color.png`.
   */
  fluentFolder: string
  /** Catégorie pour le picker (onglets). */
  category: EmojiCategory
  /** Label FR affiché en tooltip dans le picker. */
  label: string
}

export const EMOJI_CATALOG = {
  // ─── Boissons ───
  coffee: { unicode: '☕', fluentFolder: 'Hot beverage', category: 'beverages', label: 'Café' },
  tea: { unicode: '🍵', fluentFolder: 'Teacup without handle', category: 'beverages', label: 'Thé' },
  'iced-coffee': { unicode: '🧊', fluentFolder: 'Ice', category: 'beverages', label: 'Boisson glacée' },
  'bubble-tea': { unicode: '🧋', fluentFolder: 'Bubble tea', category: 'beverages', label: 'Bubble tea' },
  juice: { unicode: '🧃', fluentFolder: 'Beverage box', category: 'beverages', label: 'Jus' },
  smoothie: { unicode: '🥤', fluentFolder: 'Cup with straw', category: 'beverages', label: 'Smoothie' },
  wine: { unicode: '🍷', fluentFolder: 'Wine glass', category: 'beverages', label: 'Vin' },
  beer: { unicode: '🍺', fluentFolder: 'Beer mug', category: 'beverages', label: 'Bière' },
  cocktail: { unicode: '🍸', fluentFolder: 'Cocktail glass', category: 'beverages', label: 'Cocktail' },
  water: { unicode: '💧', fluentFolder: 'Droplet', category: 'beverages', label: 'Eau' },

  // ─── Pâtisseries / Boulangerie ───
  croissant: { unicode: '🥐', fluentFolder: 'Croissant', category: 'pastries', label: 'Croissant' },
  bread: { unicode: '🍞', fluentFolder: 'Bread', category: 'pastries', label: 'Pain' },
  baguette: { unicode: '🥖', fluentFolder: 'Baguette bread', category: 'pastries', label: 'Baguette' },
  cookie: { unicode: '🍪', fluentFolder: 'Cookie', category: 'pastries', label: 'Cookie' },
  cake: { unicode: '🍰', fluentFolder: 'Shortcake', category: 'pastries', label: 'Gâteau' },
  'birthday-cake': { unicode: '🎂', fluentFolder: 'Birthday cake', category: 'pastries', label: "Gâteau d'anniversaire" },
  cupcake: { unicode: '🧁', fluentFolder: 'Cupcake', category: 'pastries', label: 'Cupcake' },
  donut: { unicode: '🍩', fluentFolder: 'Doughnut', category: 'pastries', label: 'Donut' },
  pancake: { unicode: '🥞', fluentFolder: 'Pancakes', category: 'pastries', label: 'Pancakes' },
  pretzel: { unicode: '🥨', fluentFolder: 'Pretzel', category: 'pastries', label: 'Bretzel' },
  pie: { unicode: '🥧', fluentFolder: 'Pie', category: 'pastries', label: 'Tarte' },
  chocolate: { unicode: '🍫', fluentFolder: 'Chocolate bar', category: 'pastries', label: 'Chocolat' },

  // ─── Plats / Restaurant / Snack ───
  pizza: { unicode: '🍕', fluentFolder: 'Pizza', category: 'meals', label: 'Pizza' },
  burger: { unicode: '🍔', fluentFolder: 'Hamburger', category: 'meals', label: 'Burger' },
  fries: { unicode: '🍟', fluentFolder: 'French fries', category: 'meals', label: 'Frites' },
  hotdog: { unicode: '🌭', fluentFolder: 'Hot dog', category: 'meals', label: 'Hot-dog' },
  sandwich: { unicode: '🥪', fluentFolder: 'Sandwich', category: 'meals', label: 'Sandwich' },
  taco: { unicode: '🌮', fluentFolder: 'Taco', category: 'meals', label: 'Taco' },
  burrito: { unicode: '🌯', fluentFolder: 'Burrito', category: 'meals', label: 'Burrito' },
  salad: { unicode: '🥗', fluentFolder: 'Green salad', category: 'meals', label: 'Salade' },
  sushi: { unicode: '🍣', fluentFolder: 'Sushi', category: 'meals', label: 'Sushi' },
  ramen: { unicode: '🍜', fluentFolder: 'Steaming bowl', category: 'meals', label: 'Bol chaud' },
  rice: { unicode: '🍱', fluentFolder: 'Bento box', category: 'meals', label: 'Bento' },
  meat: { unicode: '🍗', fluentFolder: 'Poultry leg', category: 'meals', label: 'Viande' },
  cheese: { unicode: '🧀', fluentFolder: 'Cheese wedge', category: 'meals', label: 'Fromage' },
  egg: { unicode: '🥚', fluentFolder: 'Egg', category: 'meals', label: 'Œuf' },

  // ─── Glaces / Desserts ───
  'ice-cream': { unicode: '🍦', fluentFolder: 'Soft ice cream', category: 'desserts', label: 'Glace' },
  popsicle: { unicode: '🍡', fluentFolder: 'Dango', category: 'desserts', label: 'Sucette glacée' },
  candy: { unicode: '🍬', fluentFolder: 'Candy', category: 'desserts', label: 'Bonbon' },
  lollipop: { unicode: '🍭', fluentFolder: 'Lollipop', category: 'desserts', label: 'Sucette' },

  // ─── Coiffure / Barber ───
  scissors: { unicode: '✂️', fluentFolder: 'Scissors', category: 'hair', label: 'Ciseaux' },
  comb: { unicode: '🪮', fluentFolder: 'Hair pick', category: 'hair', label: 'Peigne' },
  razor: { unicode: '🪒', fluentFolder: 'Razor', category: 'hair', label: 'Rasoir' },
  mirror: { unicode: '🪞', fluentFolder: 'Mirror', category: 'hair', label: 'Miroir' },
  hairdryer: { unicode: '💨', fluentFolder: 'Dashing away', category: 'hair', label: 'Sèche-cheveux' },
  barber: { unicode: '💈', fluentFolder: 'Barber pole', category: 'hair', label: 'Barber' },
  'man-haircut': { unicode: '💇', fluentFolder: 'Person getting haircut', category: 'hair', label: 'Coupe homme' },
  'woman-haircut': { unicode: '💇', fluentFolder: 'Person getting haircut', category: 'hair', label: 'Coupe femme' },
  beard: { unicode: '🧔', fluentFolder: 'Person beard', category: 'hair', label: 'Barbe' },
  'crown-hair': { unicode: '👑', fluentFolder: 'Crown', category: 'hair', label: 'Style chic' },

  // ─── Ongles / Manucure ───
  'nail-polish': { unicode: '💅', fluentFolder: 'Nail polish', category: 'nails', label: 'Vernis' },
  gem: { unicode: '💎', fluentFolder: 'Gem stone', category: 'nails', label: 'Gemme' },
  ring: { unicode: '💍', fluentFolder: 'Ring', category: 'nails', label: 'Bague' },
  sparkles: { unicode: '✨', fluentFolder: 'Sparkles', category: 'nails', label: 'Étincelles' },
  'star-shine': { unicode: '🌟', fluentFolder: 'Glowing star', category: 'nails', label: 'Étoile brillante' },
  palette: { unicode: '🎨', fluentFolder: 'Artist palette', category: 'nails', label: 'Palette' },

  // ─── Beauté / Spa ───
  lipstick: { unicode: '💄', fluentFolder: 'Lipstick', category: 'beauty', label: 'Rouge à lèvres' },
  lotion: { unicode: '🧴', fluentFolder: 'Lotion bottle', category: 'beauty', label: 'Lotion' },
  soap: { unicode: '🧼', fluentFolder: 'Soap', category: 'beauty', label: 'Savon' },
  bath: { unicode: '🛁', fluentFolder: 'Bathtub', category: 'beauty', label: 'Bain' },
  massage: { unicode: '💆', fluentFolder: 'Person getting massage', category: 'beauty', label: 'Massage' },
  eye: { unicode: '👁️', fluentFolder: 'Eye', category: 'beauty', label: 'Sourcil/cils' },
  kiss: { unicode: '💋', fluentFolder: 'Kiss mark', category: 'beauty', label: 'Baiser' },
  'flower-spa': { unicode: '🌸', fluentFolder: 'Cherry blossom', category: 'beauty', label: 'Fleur spa' },

  // ─── Fleuriste ───
  bouquet: { unicode: '💐', fluentFolder: 'Bouquet', category: 'florist', label: 'Bouquet' },
  rose: { unicode: '🌹', fluentFolder: 'Rose', category: 'florist', label: 'Rose' },
  tulip: { unicode: '🌷', fluentFolder: 'Tulip', category: 'florist', label: 'Tulipe' },
  sunflower: { unicode: '🌻', fluentFolder: 'Sunflower', category: 'florist', label: 'Tournesol' },
  hibiscus: { unicode: '🌺', fluentFolder: 'Hibiscus', category: 'florist', label: 'Hibiscus' },
  'cherry-blossom': { unicode: '🌸', fluentFolder: 'Cherry blossom', category: 'florist', label: 'Fleur de cerisier' },
  'wilted-flower': { unicode: '🥀', fluentFolder: 'Wilted flower', category: 'florist', label: 'Fleur fanée' },
  'potted-plant': { unicode: '🪴', fluentFolder: 'Potted plant', category: 'florist', label: 'Plante en pot' },

  // ─── Pressing / Cordonnerie / Habillement ───
  shirt: { unicode: '👕', fluentFolder: 'T-shirt', category: 'apparel', label: 'T-shirt' },
  dress: { unicode: '👗', fluentFolder: 'Dress', category: 'apparel', label: 'Robe' },
  jeans: { unicode: '👖', fluentFolder: 'Jeans', category: 'apparel', label: 'Jean' },
  tie: { unicode: '👔', fluentFolder: 'Necktie', category: 'apparel', label: 'Cravate / chemise' },
  shoe: { unicode: '👞', fluentFolder: "Man's shoe", category: 'apparel', label: 'Chaussure' },
  heel: { unicode: '👠', fluentFolder: 'High-heeled shoe', category: 'apparel', label: 'Talon' },
  boot: { unicode: '👢', fluentFolder: "Woman's boot", category: 'apparel', label: 'Botte' },
  hanger: { unicode: '🧥', fluentFolder: 'Coat', category: 'apparel', label: 'Manteau / cintre' },

  // ─── Récompenses / Fidélité ───
  gift: { unicode: '🎁', fluentFolder: 'Wrapped gift', category: 'rewards', label: 'Cadeau' },
  trophy: { unicode: '🏆', fluentFolder: 'Trophy', category: 'rewards', label: 'Trophée' },
  'medal-gold': { unicode: '🥇', fluentFolder: '1st place medal', category: 'rewards', label: 'Médaille or' },
  'medal-silver': { unicode: '🥈', fluentFolder: '2nd place medal', category: 'rewards', label: 'Médaille argent' },
  'medal-bronze': { unicode: '🥉', fluentFolder: '3rd place medal', category: 'rewards', label: 'Médaille bronze' },
  star: { unicode: '⭐', fluentFolder: 'Star', category: 'rewards', label: 'Étoile' },
  crown: { unicode: '👑', fluentFolder: 'Crown', category: 'rewards', label: 'Couronne' },
  confetti: { unicode: '🎉', fluentFolder: 'Party popper', category: 'rewards', label: 'Confetti' },
  fireworks: { unicode: '🎆', fluentFolder: 'Fireworks', category: 'rewards', label: "Feu d'artifice" },
  ticket: { unicode: '🎫', fluentFolder: 'Ticket', category: 'rewards', label: 'Tampon' },

  // ─── États / UI ───
  lock: { unicode: '🔒', fluentFolder: 'Locked', category: 'ui', label: 'Verrouillé' },
  unlock: { unicode: '🔓', fluentFolder: 'Unlocked', category: 'ui', label: 'Déverrouillé' },
  bell: { unicode: '🔔', fluentFolder: 'Bell', category: 'ui', label: 'Cloche' },
  wheel: { unicode: '🎡', fluentFolder: 'Ferris wheel', category: 'ui', label: 'Roue' },
  wave: { unicode: '👋', fluentFolder: 'Waving hand', category: 'ui', label: 'Coucou' },
  mobile: { unicode: '📱', fluentFolder: 'Mobile phone', category: 'ui', label: 'Mobile' },
  'mobile-arrow': { unicode: '📲', fluentFolder: 'Mobile phone with arrow', category: 'ui', label: 'Mobile + notif' },
  home: { unicode: '🏠', fluentFolder: 'House', category: 'ui', label: 'Maison' },

  // ─── Setup commerçant ───
  printer: { unicode: '🖨️', fluentFolder: 'Printer', category: 'merchant', label: 'Imprimante' },
  handshake: { unicode: '🤝', fluentFolder: 'Handshake', category: 'merchant', label: 'Accueil' },
  clock: { unicode: '⏰', fluentFolder: 'Alarm clock', category: 'merchant', label: 'Horaire' },
  'error-face': { unicode: '😕', fluentFolder: 'Confused face', category: 'merchant', label: 'Erreur' },
} as const satisfies Record<string, EmojiEntry>

export type EmojiName = keyof typeof EMOJI_CATALOG

/**
 * Suggestions par métier pour le picker — affichées en haut avant les onglets catégorie.
 */
export const BUSINESS_TYPE_SUGGESTIONS: Record<BusinessType, EmojiName[]> = {
  cafe: ['coffee', 'tea', 'croissant', 'cookie', 'cake', 'donut', 'gift', 'star'],
  restaurant: ['pizza', 'burger', 'salad', 'wine', 'cake', 'gift', 'star', 'trophy'],
  bakery: ['croissant', 'baguette', 'bread', 'cake', 'cookie', 'cupcake', 'donut', 'pretzel'],
  snack: ['burger', 'fries', 'hotdog', 'sandwich', 'pizza', 'ice-cream', 'gift', 'ticket'],
  hair: ['scissors', 'comb', 'razor', 'hairdryer', 'barber', 'man-haircut', 'woman-haircut', 'gift'],
  nails: ['nail-polish', 'sparkles', 'gem', 'palette', 'ring', 'star-shine', 'gift', 'crown'],
}

export const DEFAULT_SUGGESTIONS: EmojiName[] = [
  'gift',
  'star',
  'trophy',
  'sparkles',
  'confetti',
  'ticket',
  'crown',
  'medal-gold',
]

export const CATEGORY_LABELS: Record<EmojiCategory, string> = {
  beverages: 'Boissons',
  pastries: 'Pâtisseries',
  meals: 'Plats',
  desserts: 'Desserts',
  hair: 'Coiffure',
  nails: 'Ongles',
  beauty: 'Beauté',
  florist: 'Fleuriste',
  apparel: 'Habillement',
  rewards: 'Récompenses',
  ui: 'États',
  merchant: 'Commerçant',
}

export const CATEGORY_ORDER: EmojiCategory[] = [
  'rewards',
  'beverages',
  'pastries',
  'meals',
  'desserts',
  'hair',
  'nails',
  'beauty',
  'florist',
  'apparel',
  'ui',
  'merchant',
]

/**
 * Construit l'URL CDN jsDelivr pour un emoji du catalogue.
 *
 * Convention Microsoft : `assets/{Folder}/Color/{folder_lower_underscores}_color.png`
 */
export function getEmojiAssetUrl(name: EmojiName): string {
  const entry = EMOJI_CATALOG[name]
  const folder = entry.fluentFolder
  const slug = folder.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  return `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/${encodeURIComponent(folder)}/Color/${slug}_color.png`
}

/**
 * Index inverse Unicode → EmojiName, pour la rétrocompat des `business.reward_tiers[].emoji`
 * stockés en Unicode brut avant la migration.
 */
const UNICODE_INDEX: Record<string, EmojiName> = (() => {
  const map: Record<string, EmojiName> = {}
  for (const [name, entry] of Object.entries(EMOJI_CATALOG)) {
    if (!map[entry.unicode]) {
      map[entry.unicode] = name as EmojiName
    }
  }
  return map
})()

export function lookupByUnicode(unicode: string): EmojiName | null {
  return UNICODE_INDEX[unicode] ?? null
}

export function getEntry(name: EmojiName): EmojiEntry {
  return EMOJI_CATALOG[name]
}

export function getEmojisByCategory(category: EmojiCategory): EmojiName[] {
  return (Object.keys(EMOJI_CATALOG) as EmojiName[]).filter(
    (name) => EMOJI_CATALOG[name].category === category,
  )
}
