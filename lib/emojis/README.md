# `lib/emojis/` — catalogue Izou (Microsoft Fluent Emoji)

Composants et catalogue d'emojis self-managed pour assurer une **cohérence visuelle cross-device**
sur l'app Izou (carte client, dashboard commerçant, picker palier, push templates).

- **Source d'assets** : [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT) via CDN jsDelivr.
- **Fallback** : caractère Unicode si l'asset CDN ne charge pas (offline, blocage CDN, slug renommé).
- **Catalogue Izou** : ~110 emojis groupés en 12 catégories métier (boissons, pâtisseries, plats, desserts, coiffure, ongles, beauté, fleuriste, habillement, récompenses, états UI, commerçant).

## API publique

```ts
import { Emoji, EmojiPicker, type EmojiName } from '@/lib/emojis'
```

### `<Emoji name="cookie" size={24} />`

Rendu unifié d'un emoji du catalogue. Décoratif par défaut (`aria-hidden`).

```tsx
<Emoji name="gift" size={32} />
<Emoji name="coffee" ariaLabel="Café offert" />
<Emoji unicode="🎁" />  {/* rétrocompat — résout vers `gift` si présent au catalogue */}
```

| prop | type | défaut | description |
|------|------|--------|-------------|
| `name` | `EmojiName` | — | Nom du catalogue (cf. `EMOJI_CATALOG`). Mutuellement exclusif avec `unicode`. |
| `unicode` | `string` | — | Caractère Unicode (rétrocompat DB). Mutuellement exclusif avec `name`. |
| `size` | `number` | `24` | Taille en pixels (largeur=hauteur). |
| `className` | `string` | — | Classes Tailwind additionnelles. |
| `ariaLabel` | `string` | — | Si fourni, sort du mode décoratif (`role=img` + label lu par screen readers). |

### `<EmojiPicker value onChange businessType />`

Popover-style picker pour formulaire commerçant (paliers récompense, push templates).

```tsx
<EmojiPicker
  value={tier.emoji}                          // Unicode courant
  onChange={(unicode) => setTier({ emoji: unicode })}
  businessType={business.business_type}       // pré-rempli les suggestions
/>
```

- Affiche `BUSINESS_TYPE_SUGGESTIONS[businessType]` en haut (top 8).
- Onglets catégorie en dessous (Boissons, Coiffure, Beauté, etc.).
- Stocke en **Unicode** (pas en `name`) pour rester compatible avec les paliers existants en DB.

## Conventions de naming

- `name: EmojiName` — kebab-case anglais, descriptif (`nail-polish`, `medal-gold`, `cherry-blossom`).
- `fluentFolder` — nom EXACT du dossier dans `microsoft/fluentui-emoji@main/assets/` (avec espaces et casse, ex : `Hot beverage`, `1st place medal`).
- `unicode` — caractère Unicode unique pour le fallback. Si plusieurs emojis du catalogue partagent le même Unicode (ex: `man-haircut` et `woman-haircut` → 💇), seul le PREMIER inscrit dans le catalogue sera retrouvé par `lookupByUnicode()`. Ce trade-off est OK pour la rétrocompat DB (l'ordre dans `EMOJI_CATALOG` détermine la préférence).

## Ajouter un emoji au catalogue

1. Trouver le dossier dans [github.com/microsoft/fluentui-emoji/tree/main/assets](https://github.com/microsoft/fluentui-emoji/tree/main/assets).
2. Ajouter une entrée à `EMOJI_CATALOG` dans `lib/emojis/emoji-mapping.ts` :
   ```ts
   'cherry': { unicode: '🍒', fluentFolder: 'Cherries', category: 'desserts', label: 'Cerise' },
   ```
3. Si applicable, ajouter `'cherry'` à `BUSINESS_TYPE_SUGGESTIONS[bakery]` ou `DEFAULT_SUGGESTIONS`.
4. Vérifier le rendu : `<Emoji name="cherry" size={32} />` dans une page de test, ouvrir le DevTools Network et confirmer le 200 sur l'URL CDN.

## Mapping `business_type` → emojis suggérés

Édité dans `BUSINESS_TYPE_SUGGESTIONS`. Top 8 emojis pertinents par métier — affichés en bandeau "Suggestions" dans le picker.

Métiers supportés actuellement : `cafe`, `restaurant`, `bakery`, `snack`, `hair`, `nails`.

> Pour étendre à `beauty`, `florist`, `pressing`, etc. : étendre d'abord `BusinessType` dans [`lib/types.ts`](../types.ts), ajouter une migration DB CHECK constraint, puis enrichir `BUSINESS_TYPE_SUGGESTIONS`.

## Performance

- **Pas de dépendance npm ajoutée.** Les assets sont fetchés au runtime via CDN jsDelivr.
- `loading="lazy"` + `decoding="async"` sur chaque `<img>` → emojis hors viewport ne chargent pas tant qu'ils ne sont pas visibles.
- Premier paint potentiellement légèrement plus lent qu'un emoji Unicode natif (qui est toujours instant). Si visible aux Web Vitals, deux options :
  1. **Self-host** — télécharger les ~110 PNG dans `public/emojis/fluent/` et changer `getEmojiAssetUrl` pour pointer vers `/emojis/fluent/...`. Pas de breaking change côté API, swap isolé à 1 ligne.
  2. **Preload critique** — `<link rel="preload" as="image" href="..." />` pour les 5–10 emojis above-the-fold (gift, coffee, croissant, etc.).

Le fallback Unicode dans `Emoji.tsx` se déclenche aussi si l'asset CDN renvoie 404 — donc un emoji renommé chez Microsoft ne casse pas l'UI, il "downgrade" simplement vers le rendu OS natif.

## Rétrocompat DB

Les `business.reward_tiers[].emoji` historiquement stockés en Unicode brut (ex: `"🎁"`, `"☕"`, `"💅"`) continuent de fonctionner :

```tsx
{tier.emoji ? <Emoji unicode={tier.emoji} /> : <Emoji name="gift" />}
```

`<Emoji unicode>` fait `lookupByUnicode(value)` pour résoudre vers le `name` du catalogue ; si absent, retombe sur `<span>{unicode}</span>`. Les paliers anciens affichent donc l'asset Fluent Emoji s'il y a un mapping, sinon l'emoji OS-rendu — jamais cassés.

Migration DB vers `emoji_name` (text) optionnelle plus tard si besoin de stocker le nom catalogue pour des stats / search merchant.

## Symboles typographiques NON migrés

Volontairement gardés en Unicode brut car ce sont des **glyphes texte**, pas des emojis :

- `✓` (check) — états valides, badges « Copié »
- `✉` (envelope text-style) — links mailto
- `⌘K` (cmd shortcut) — composant Input
- `•` (bullet) — fallback liste

Le composant `<Emoji>` ne les supporte pas (pas dans le catalogue), c'est intentionnel.

## Push notifications & toasts (texte uniquement)

Les emojis dans les **push notifications natives** (cf. `app/api/cron/push-inactive/route.ts`) restent en Unicode dans la string `body` — la Web Push API rend l'OS emoji par design, on ne peut pas embed une `<img>`.

Idem pour les **toasts** où l'emoji est dans une string interpolée (`setNotification('+1 tampon ☕')`) — refactorer impliquerait passer à un format structuré pour le toast. Pas prioritaire.

Voir `docs/audit/emojis-inventory.md` pour la liste complète des cas non migrés et le rationnel.
