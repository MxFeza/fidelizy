# Audit galerie emojis Izou — 2026-05-07

## TL;DR

**38 emojis hardcodés** détectés dans 17 fichiers `app/`, `components/`, `lib/`. Le picker actuel (`/dashboard/marketing/loyalty`) propose **18 presets** orientés food (☕🥐🍰…) — couverture insuffisante pour coiffure, beauté, fleuriste, pressing, cordonnier prévus au pilote.

**Recommandation :** Microsoft Fluent Emoji (MIT, ~3500 emojis, semi-3D, CDN jsDelivr) avec catalogue Izou self-hosted ~80–120 emojis groupés par catégorie métier. Effort estimé : 5–6 commits.

**Stratégie de migration :** rétrocompat Unicode (les `business.reward_tiers[].emoji` actuels continuent de s'afficher), nouveaux paliers stockés en **nom** (`emoji_name: "cookie"`) résolu côté client.

---

## Inventaire actuel

### Emojis hardcodés détectés

| Path | Line | Emoji | Contexte | Catégorie |
|------|------|-------|----------|-----------|
| `app/card/[cardId]/CardPageClient.tsx` | 57 | 🎉 | Banner « Récompense débloquée — présentez votre code » | celebration |
| `app/card/[cardId]/CardPageClient.tsx` | 140 | 🎫 | Toast `+N tampon ajouté` | stamp |
| `app/card/[cardId]/CardPageClient.tsx` | 148 | 🎉 | Toast `Récompense obtenue ! Carte remise à zéro` | celebration |
| `app/card/[cardId]/CardPageClient.tsx` | 177 | 🎫 | Toast realtime `+N tampon ajouté` | stamp |
| `app/card/[cardId]/CardPageClient.tsx` | 256 | 📱 | Bloc onboarding « Ajouter à l'écran d'accueil » | mobile |
| `app/card/[cardId]/CardPageClient.tsx` | 286 | 📲 | Bloc onboarding « Activer notifications » | mobile |
| `app/card/[cardId]/CardPageClient.tsx` | 334 | 👋 | Bandeau « Bienvenue {firstName} » | greeting |
| `app/card/[cardId]/components/CardTab.tsx` | 133 | 🎁 | Banner « Récompense disponible » | reward |
| `app/card/[cardId]/components/CardTab.tsx` | 170 | 🎡 | Bouton « Roue de la fortune » | wheel |
| `app/card/[cardId]/components/RecentActivity.tsx` | 99 | 🎁 | Icône transaction `redeem` | reward |
| `app/card/[cardId]/components/RecentActivity.tsx` | 108 | 🎫 | Icône transaction `+N tampon(s)` | stamp |
| `app/card/[cardId]/components/RecentActivity.tsx` | 117 | ⭐ | Icône transaction `+N point(s)` | point |
| `app/card/[cardId]/components/TierProgressBar.tsx` | 84 | 🎁 | Fallback emoji palier (si tier.emoji vide) | reward |
| `app/card/[cardId]/components/TierProgressBar.tsx` | 108 | 🔒 | Badge palier verrouillé `🔒 N tampons` | lock |
| `app/card/[cardId]/components/TierProgressBar.tsx` | 142 | 🎉 | Message « Tous les paliers débloqués » | celebration |
| `app/card/[cardId]/components/PushBanner.tsx` | 61 | 🔔 | Banner activation notifications push | bell |
| `app/card/[cardId]/components/WheelModal.tsx` | 103 | 🎡 | Titre modal « Roue de la fortune » | wheel |
| `app/card/[cardId]/components/WheelModal.tsx` | 164 | 🎡 | Texte SVG centre roue (slice neutre) | wheel |
| `app/card/[cardId]/error.tsx` | 12 | 😕 | Page d'erreur boundary client | error |
| `app/dashboard/(protected)/error.tsx` | 13 | 😕 | Page d'erreur boundary dashboard | error |
| `app/dashboard/(protected)/DashboardClient.tsx` | 460 | 🥇🥈🥉 | Top 3 ranks tableau clients fidèles | rank |
| `app/dashboard/(protected)/marketing/loyalty/LoyaltyClient.tsx` | 24 | ☕🥐🍰🍪🍩🥪🍕🍔🍟🥗🍷🍺🎁⭐💎🏆✂️💅 | Array `TIER_EMOJI_PRESETS` du picker actuel | preset list |
| `app/dashboard/(protected)/marketing/loyalty/LoyaltyClient.tsx` | 29 | 🎁 | Default emoji `newTier()` | reward |
| `app/dashboard/(protected)/marketing/loyalty/LoyaltyClient.tsx` | 92 | 🎁 | Bootstrap palier legacy (stamps_reward) | reward |
| `app/dashboard/(protected)/marketing/loyalty/LoyaltyClient.tsx` | 480 | 🎁 | Fallback bouton picker (`tier.emoji \|\| '🎁'`) | reward |
| `app/dashboard/(protected)/marketing/push/PushClient.tsx` | 46-49 | 🎁☕⏰🎉 | Templates push commerçant (label) | mixed |
| `app/landing/LandingClient.tsx` | 411 | 🥐 | Mock notification push « Bienvenue chez Les Délices ! » | bakery |
| `app/landing/LandingClient.tsx` | 550 | 👋 | Mock app preview « Bonjour Sophie » | greeting |
| `app/join/[businessId]/JoinFlow.tsx` | 465 | 🎉 | Confetti / célébration onboarding | celebration |
| `app/join/[businessId]/JoinFlow.tsx` | 484 | 🏆 | Bonus initial tampons | trophy |
| `app/me/MeListClient.tsx` | 138 | 👋 | Bandeau home liste cartes « Bonjour {firstName} » | greeting |
| `app/api/cron/push-inactive/route.ts` | 70 | 🎁 | Push body inactivité « Vous nous manquez » | reward |
| `components/dashboard/WelcomeModal.tsx` | 75 | 🎉 | Titre modal welcome dashboard | celebration |
| `components/dashboard/WelcomeModal.tsx` | 88 | 🖨️ | Liste setup commerçant — imprimer QR | print |
| `components/dashboard/WelcomeModal.tsx` | 92 | 🏠 | Liste setup commerçant — afficher en boutique | store |
| `components/dashboard/WelcomeModal.tsx` | 96 | 🤝 | Liste setup commerçant — accueillir clients | partnership |
| `lib/services/loyalty.tiers.ts` | 29 | 🎁 | Palier virtuel fallback (`stamps_reward` legacy) | reward |
| `lib/services/__tests__/loyalty.service.test.ts` | 242 | 🎁 | Fixture test (à laisser tel quel) | test |

**Total : 38 emojis hardcodés** (hors test fixture) + **18 dans `TIER_EMOJI_PRESETS`** (à remplacer par catalogue structuré).

### Symboles typographiques (à NE PAS migrer)

Les caractères suivants matchent le grep mais ne sont pas des emojis Unicode au sens strict — ce sont des glyphes texte qui fonctionnent partout sans assets : **✓** (check), **✉** (envelope text), **⌘K** (cmd shortcut), **•** (bullet). On les garde tels quels.

| Path | Line | Symbole | Décision |
|------|------|---------|----------|
| `app/dashboard/(auth)/AuthLayout.tsx` | 84 | ✉ | Garder (texte mailto) |
| `app/components/ShortCodeDisplay.tsx` | 31 | ✓ | Garder (badge `Copié`) |
| `app/join/[businessId]/JoinFlow.tsx` | 381 | ✓ | Garder (toast `Code vérifié`) |
| `app/card/[cardId]/components/TierProgressBar.tsx` | 104 | ✓ | Garder (badge `Débloqué`) |
| `components/ui/base/input/input.tsx` | 177 | ⌘K | Garder (shortcut générique) |
| `app/card/[cardId]/components/RecentActivity.tsx` | 124 | • | Garder (bullet fallback) |

### Emojis stockés en DB

- **`businesses.reward_tiers[]`** (JSONB) : champ `emoji: string` saisi via le picker à 18 presets actuel. Valeurs Unicode brut (ex: `"🎁"`, `"☕"`, `"💅"`).
- **`businesses.stamps_reward`** : texte libre (pas d'emoji, mais souvent recopié dans des toasts UI).
- Aucune autre colonne ne stocke d'emoji directement.

### Source de rendu actuel

- 100% **Unicode natif** (rendu OS-dependent : Apple emoji sur iOS/macOS, Segoe UI Emoji sur Windows, Noto Color Emoji sur Android, Twemoji sur certains navigateurs Linux).
- **Conséquence :** l'emoji `🎁` choisi par le commerçant sur Mac apparaît stylistiquement différent sur le téléphone Android du client final → fragmentation visuelle pré-pilote.

---

## Comparaison des options

| Critère | **Fluent Emoji** ⭐ | OpenMoji | Iconify | Lottie | Twemoji |
|---------|----|---|---|---|---|
| Couverture métiers cibles | ✅✅✅ (~3500, coiffure/beauté/fleuriste OK) | ✅✅ (~4000, style 2D) | ✅✅ (par pack) | ❌ pour catalogue, ✅ pour hero | ✅✅ |
| Style premium semi-3D | ✅✅✅ Color variant | ⚠️ flat 2D | varie | ✅✅✅ animé | ⚠️ flat 2D |
| Cohérence avec Untitled UI | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ |
| Licence | ✅ MIT | ⚠️ CC BY-SA 4.0 (attribution) | varie | varie | ✅ MIT/CC |
| CDN public dispo | ✅ jsDelivr GitHub | ✅ | ✅ Iconify API | ✅ lottiefiles | ✅ |
| Self-host facile | ✅ (svg/png par dossier nommé) | ✅ | ✅ | ⚠️ JSON/emoji ~5-50KB | ✅ |
| Maintenance active | ✅ Microsoft 2026 | ✅ | ✅ | ✅ | ❌ déprécié |
| Multi-skin-tone | ✅ | ✅ | n/a | ❌ | ✅ |

## Recommandation : **Microsoft Fluent Emoji**

**Justification :**
1. **Couverture pilote complète** — tous les métiers ciblés (food, hair, nails, beauty, florist, pressing, cordonnier, food-truck) sont représentés avec des assets dédiés.
2. **Style semi-3D `Color` variant** matche l'identité Untitled UI moderne déjà adoptée par Izou — pas le côté « flat 2D » de OpenMoji ni le côté « social media » de Twemoji.
3. **MIT** = aucune contrainte d'attribution dans Mentions Légales (vs CC BY-SA d'OpenMoji).
4. **CDN jsDelivr GitHub** = zéro dépendance npm initiale (`https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/...`). Self-host possible plus tard si on veut sortir du CDN.
5. **Cohérence cross-device** garantie : le commerçant sur Mac et le client sur Android voient exactement le même asset PNG/SVG.
6. **Pragmatisme pilote** : ~80–120 emojis suffisent. On ne charge pas le pack complet (3500 = ~50MB), on référence par URL CDN avec lazy-load et fallback Unicode pour rétrocompat.

**Trade-offs assumés :**
- Dépendance CDN externe → fallback Unicode prévu (le composant `<Emoji>` retombe sur le caractère Unicode si l'asset ne charge pas).
- Naming convention Microsoft = noms longs (ex: `Hot beverage/Color/hot_beverage_color.png`) → on encapsule ça dans `lib/emojis/emoji-mapping.ts` pour exposer une API courte (`coffee`, `tea`, etc.).

---

## Catalogue Izou proposé (~110 emojis)

Format : `name → emoji Unicode (fallback) | Fluent slug`

### Boissons (10)
- `coffee` → ☕ | Hot beverage
- `tea` → 🍵 | Teacup without handle
- `iced-coffee` → 🧊 | Ice (variant pour iced drink)
- `bubble-tea` → 🧋 | Bubble tea
- `juice` → 🧃 | Beverage box
- `smoothie` → 🥤 | Cup with straw
- `wine` → 🍷 | Wine glass
- `beer` → 🍺 | Beer mug
- `cocktail` → 🍸 | Cocktail glass
- `water` → 💧 | Droplet

### Pâtisseries / Boulangerie (12)
- `croissant` → 🥐 | Croissant
- `bread` → 🍞 | Bread
- `baguette` → 🥖 | Baguette bread
- `cookie` → 🍪 | Cookie
- `cake` → 🍰 | Shortcake
- `birthday-cake` → 🎂 | Birthday cake
- `cupcake` → 🧁 | Cupcake
- `donut` → 🍩 | Doughnut
- `pancake` → 🥞 | Pancakes
- `pretzel` → 🥨 | Pretzel
- `pie` → 🥧 | Pie
- `chocolate` → 🍫 | Chocolate bar

### Plats / Restaurant / Snack (14)
- `pizza` → 🍕 | Pizza
- `burger` → 🍔 | Hamburger
- `fries` → 🍟 | French fries
- `hotdog` → 🌭 | Hot dog
- `sandwich` → 🥪 | Sandwich
- `taco` → 🌮 | Taco
- `burrito` → 🌯 | Burrito
- `salad` → 🥗 | Green salad
- `sushi` → 🍣 | Sushi
- `ramen` → 🍜 | Steaming bowl
- `rice` → 🍱 | Bento box
- `meat` → 🍗 | Poultry leg
- `cheese` → 🧀 | Cheese wedge
- `egg` → 🥚 | Egg

### Glaces / Desserts (4)
- `ice-cream` → 🍦 | Soft ice cream
- `popsicle` → 🍡 | Dango (variant)
- `candy` → 🍬 | Candy
- `lollipop` → 🍭 | Lollipop

### Coiffure / Barber (10)
- `scissors` → ✂️ | Scissors
- `comb` → 🪮 | Hair pick
- `razor` → 🪒 | Razor
- `mirror` → 🪞 | Mirror
- `hairdryer` → 💨 | Dashing away (variant pour sèche-cheveux)
- `barber` → 💈 | Barber pole
- `man-haircut` → 💇‍♂️ | Man getting haircut
- `woman-haircut` → 💇‍♀️ | Woman getting haircut
- `beard` → 🧔 | Person beard
- `crown-hair` → 👑 | Crown (chic)

### Ongles / Manucure (6)
- `nail-polish` → 💅 | Nail polish
- `gem` → 💎 | Gem stone
- `ring` → 💍 | Ring
- `sparkles` → ✨ | Sparkles
- `star-shine` → 🌟 | Glowing star
- `palette` → 🎨 | Artist palette

### Beauté / Spa (8)
- `lipstick` → 💄 | Lipstick
- `lotion` → 🧴 | Lotion bottle
- `soap` → 🧼 | Soap
- `bath` → 🛁 | Bathtub
- `massage` → 💆 | Person getting massage
- `eye` → 👁️ | Eye
- `kiss` → 💋 | Kiss mark
- `flower-spa` → 🌸 | Cherry blossom

### Fleuriste (8)
- `bouquet` → 💐 | Bouquet
- `rose` → 🌹 | Rose
- `tulip` → 🌷 | Tulip
- `sunflower` → 🌻 | Sunflower
- `hibiscus` → 🌺 | Hibiscus
- `cherry-blossom` → 🌸 | Cherry blossom
- `wilted-flower` → 🥀 | Wilted flower
- `potted-plant` → 🪴 | Potted plant

### Pressing / Cordonnerie / Habillement (8)
- `shirt` → 👕 | T-shirt
- `dress` → 👗 | Dress
- `jeans` → 👖 | Jeans
- `tie` → 👔 | Necktie
- `shoe` → 👞 | Man's shoe
- `heel` → 👠 | High-heeled shoe
- `boot` → 👢 | Woman's boot
- `hanger` → 🧥 | Coat (proxy hanger/cintre)

### Récompenses / Fidélité (10)
- `gift` → 🎁 | Wrapped gift
- `trophy` → 🏆 | Trophy
- `medal-gold` → 🥇 | 1st place medal
- `medal-silver` → 🥈 | 2nd place medal
- `medal-bronze` → 🥉 | 3rd place medal
- `star` → ⭐ | Star
- `crown` → 👑 | Crown
- `confetti` → 🎉 | Party popper
- `fireworks` → 🎆 | Fireworks
- `ticket` → 🎫 | Ticket

### États / UI (8)
- `lock` → 🔒 | Locked
- `unlock` → 🔓 | Unlocked
- `bell` → 🔔 | Bell
- `wheel` → 🎡 | Ferris wheel
- `wave` → 👋 | Waving hand
- `mobile` → 📱 | Mobile phone
- `mobile-arrow` → 📲 | Mobile phone with arrow
- `home` → 🏠 | House

### Setup commerçant (4)
- `printer` → 🖨️ | Printer
- `handshake` → 🤝 | Handshake
- `clock` → ⏰ | Alarm clock
- `error-face` → 😕 | Confused face

**Total : 102 emojis répartis en 11 catégories.**

---

## Mapping `business_type` → emojis suggérés (top du picker)

| business_type | Emojis prioritaires (top 8) |
|---------------|------------------------------|
| `cafe` | coffee, tea, croissant, cookie, cake, donut, gift, star |
| `restaurant` | pizza, burger, salad, wine, cake, gift, star, trophy |
| `bakery` | croissant, baguette, bread, cake, cookie, cupcake, donut, pretzel |
| `snack` | burger, fries, hotdog, sandwich, pizza, ice-cream, gift, ticket |
| `hair` | scissors, comb, razor, hairdryer, barber, man-haircut, woman-haircut, gift |
| `nails` | nail-polish, sparkles, gem, palette, ring, star-shine, gift, crown |
| (default fallback) | gift, star, trophy, sparkles, confetti, ticket, crown, medal-gold |

> **Note pilote :** `beauty`, `florist`, `pressing`, `shoes`, `food-truck` ne sont pas encore dans `BusinessType` (`lib/types.ts:6`). À étendre lors de l'ajout de ces secteurs au pilote — le mapping est déjà prêt côté catalogue.

---

## Plan de migration

### Phase 1 — Audit (commit doc, ce fichier)
- `docs/audit/emojis-inventory.md` créé.

### Phase 2 — Install lib/emojis/ (1 commit)
Fichiers créés :
- `lib/emojis/emoji-mapping.ts` — catalogue : `Record<EmojiName, { unicode: string; fluentSlug: string; category: EmojiCategory }>` + `BUSINESS_TYPE_SUGGESTIONS: Record<BusinessType, EmojiName[]>`.
- `lib/emojis/Emoji.tsx` — composant `<Emoji name="cookie" size={24} />` qui :
  - rend `<img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/.../color/...png" />` avec lazy-load + `aria-hidden`,
  - fallback `<span>` Unicode si erreur de chargement (`onError`).
  - **Rétrocompat** : accepte aussi `unicode="🎁"` (résolu vers le `name` correspondant si trouvé, sinon rendu Unicode brut).
- `lib/emojis/EmojiPicker.tsx` — modal avec onglets catégorie + section « Suggestions {business_type} » en haut.

Pas de dépendance npm ajoutée (CDN jsDelivr suffit pour le pilote).

### Phase 3 — Refactor merchant (1 commit)
- `app/dashboard/(protected)/marketing/loyalty/LoyaltyClient.tsx` : suppression de `TIER_EMOJI_PRESETS`, remplacement de la grille 6×3 inline par `<EmojiPicker businessType={business.business_type} value={tier.emoji} onChange={...} />`.
- `LoyaltyTier.emoji` reste `string` (Unicode pour rétrocompat) — le picker renvoie l'Unicode du catalogue choisi. `lib/types.ts` peut optionnellement gagner `emoji_name?: string` plus tard si besoin.

### Phase 4 — Refactor UI (1 commit, peut être split en 2)
Remplace les emojis hardcodés par `<Emoji name="..." />` dans :
- `app/card/[cardId]/CardPageClient.tsx` (lignes 256, 286, 334 — toasts laissés en string interpolation Unicode car notification API).
- `app/card/[cardId]/components/CardTab.tsx` (lignes 133, 170).
- `app/card/[cardId]/components/RecentActivity.tsx` (icônes transactions — refactor du retour `describeTransaction` pour exposer `iconName: EmojiName`).
- `app/card/[cardId]/components/TierProgressBar.tsx` (lignes 84, 142 — fallback emoji palier).
- `app/card/[cardId]/components/PushBanner.tsx` (ligne 61).
- `app/card/[cardId]/components/WheelModal.tsx` (lignes 103, 164).
- `app/dashboard/(protected)/DashboardClient.tsx` (ligne 460 — `ranks` array).
- `app/dashboard/(protected)/marketing/push/PushClient.tsx` (templates).
- `app/me/MeListClient.tsx` (ligne 138).
- `app/landing/LandingClient.tsx` (lignes 411, 550).
- `app/join/[businessId]/JoinFlow.tsx` (lignes 465, 484).
- `components/dashboard/WelcomeModal.tsx` (lignes 75, 88, 92, 96).
- `app/card/[cardId]/error.tsx` + `app/dashboard/(protected)/error.tsx` (😕).

**Restent en Unicode brut (intentionnellement non migrés) :**
- Push notifications (`app/api/cron/push-inactive/route.ts:70`) — la Push API native rend l'OS emoji par design, pas un asset CDN.
- Toast strings (CardPageClient lignes 57, 140, 148, 177) — texte d'alerte, l'emoji est dans la string elle-même.
- Symboles typographiques listés plus haut (✓, ✉, •, ⌘K).
- Test fixtures (`lib/services/__tests__/...`).

### Phase 5 — Documentation (1 commit)
- `lib/emojis/README.md` : conventions naming, ajout d'un emoji au catalogue, perf considerations, fallback Unicode, migration future vers self-host si CDN deviens contraignant.

---

## Questions ouvertes

1. **Self-host vs CDN ?** Pilote = CDN jsDelivr pour vitesse de delivery. Si la perf devient un problème (ou si on veut sortir d'une dépendance externe), on télécharge les ~110 PNG dans `public/emojis/fluent/` et on swap l'URL — changement isolé à `Emoji.tsx`.
2. **Migration DB obligatoire ?** Non. Les 18 valeurs Unicode déjà stockées dans `businesses.reward_tiers[].emoji` continuent de fonctionner — `<Emoji unicode="🎁" />` fait la résolution inverse. Migration vers `emoji_name` peut attendre.
3. **`BusinessType` à étendre ?** `beauty`, `florist`, `pressing`, `shoes`, `food-truck` ne sont pas dans le type — décision pilote : ajouter au catalogue côté lib (déjà prêt) sans toucher au type DB tant qu'aucun commerçant de ces secteurs n'est onboardé.
