# Brief — Audit + migration galerie d'emojis (couverture multi-métiers)

> **Objectif :** Auditer la galerie d'emojis actuelle, recommander une lib qui couvre TOUS les corps de métier prévus pour le pilote, planifier la migration commit-by-commit.
> **Format de retour attendu :** Rapport markdown + plan de migration exécutable (PR diffs si possible).
> **Effort estimé :** 5-8 commits / 2 sessions.

## Problème métier

**Constat user 2026-05-07 :**
La galerie d'emojis actuelle (semi-3D / Untitled UI / Unicode natif) couvre BIEN les métiers food/snack :
- ☕ café offert
- 🍪 cookie
- 🎁 récompense
- 🍩 donut
- 🥐 viennoiserie

Mais **insuffisamment** les autres corps de métier prévus pour le pilote :
- **Coiffure / Barber :** ciseaux, peigne, sèche-cheveux, brosse, coupe homme/femme
- **Prothésiste ongulaire :** vernis, lime, manucure, gel, motif nail-art
- **Beauté / spa :** soin visage, massage, épilation, sourcil, cils
- **Fleuriste :** bouquet, fleurs variées (rose, tulipe, pivoine), plantes
- **Salon de thé :** théière, infusion, gâteau, scone
- **Pressing :** chemise, repassage, cintre
- **Cordonnier :** chaussure, talon, semelle
- **Autres :** cordon bleu, traiteur, food-truck, glacier

**Symptôme actuel :** Quand un commerçant non-food crée son palier de récompense (ex: salon de coiffure : "Coupe offerte"), il est forcé d'utiliser un emoji générique 🎁 ou un emoji peu pertinent. Fragmentation visuelle pré-pilote.

## Inventaire actuel à faire (par le LLM externe)

### Emojis hardcodés dans le code

Grep le bundle pour trouver tous les emojis hardcodés. Patterns à chercher :
- Caractères Unicode emojis (U+1F300 - U+1F9FF, U+2600 - U+27BF, etc.)
- Lookups type `'☕'`, `"🎁"`, `\u{1F36A}`

Lieux probables (à vérifier précisément) :
- `app/card/[cardId]/components/CardTab.tsx` — banner "Récompense disponible : 🎁"
- `app/card/[cardId]/components/RecentActivity.tsx` — emojis de transactions
- `app/card/[cardId]/components/ClaimRewardModal.tsx` — éventuels emojis dans CTA
- `app/card/[cardId]/components/ClaimCodeModal.tsx`
- Toasts (TierProgressBar, banners) — "+1 tampon ☕"
- Push notifications titres + bodies
- Confettis / animations
- `components/dashboard/LoyaltyCardVisual.tsx` — si emojis dans le badge
- `components/dashboard/TierProgressBar.tsx` — emoji par palier

### Emojis stockés en DB

- **`businesses.reward_tiers[].emoji`** (JSONB, saisie libre par commerçant) — actuellement le commerçant tape n'importe quel emoji Unicode dans `/dashboard/marketing/loyalty`. Pas de picker structuré.

### Source de rendu actuel

- **Emojis Unicode** rendus par l'OS (donc style natif iOS / Android / Windows / macOS) → **incohérence cross-device**. Sur iOS = Apple emoji ; sur Android = Noto Color Emoji ; sur Windows = Segoe UI Emoji ; sur macOS = Apple emoji.
- Aucune lib d'emojis SVG/PNG self-hosted actuellement.

---

## Options à comparer (le LLM externe doit recommander 1)

### Option A — Microsoft Fluent Emoji ⭐ (recommandation par défaut)
- **Repo :** https://github.com/microsoft/fluentui-emoji
- **Style :** Semi-3D moderne (Color, Flat, High Contrast variants)
- **Couverture :** ~3500 emojis, multi-skin-tone
- **Métiers couverts :** ✂️ peigne, 💅 vernis, 💇 coupe, 🧔 barber, 👁 sourcil, 🌷 fleur, 🥐 etc.
- **Format :** PNG + SVG hosting via CDN (jsdelivr) ou self-host
- **Licence :** MIT (très permissive)
- **Intégration React :**
  - Soit lib `react-fluentui-emoji` (à vérifier sur npm)
  - Soit composant custom `<Emoji name="cookie" />` qui fetch une URL CDN
  - Soit mapping nom → URL self-host

### Option B — OpenMoji
- **Repo :** https://github.com/hfg-gmuend/openmoji
- **Style :** Flat color (plus 2D que semi-3D)
- **Couverture :** ~4000 emojis
- **Licence :** CC BY-SA 4.0 (attribution requise)
- **Métiers :** bien couverts mais style moins "premium" que Fluent

### Option C — Iconify (multi-pack agrégateur)
- **URL :** https://iconify.design/
- **Style :** dépend du pack choisi (Material, Phosphor, Tabler, Heroicons, Streamline, etc.)
- **Avantage :** accès à 100+ packs incl. des packs métier dédiés (nail-care, hair-cut, kitchen, etc.)
- **Format :** SVG via API ou self-host
- **Trade-off :** moins "emoji" plus "icon" — peut perdre le côté "fun" attendu pour la fidélisation client

### Option D — Lottie animations (lottiefiles.com)
- **Style :** animations SVG fluides
- **Avantage :** effet wow visuel
- **Inconvénient :** chaque emoji = JSON animation (~5-50KB), pas idéal pour une liste de 200 paliers
- **Cas d'usage idéal :** emojis hero (récompense débloquée, succès parrainage) — mais pas pour la liste

### Option E — 3D Icons commerciaux (Streamline, Iconscout)
- **Style :** très premium semi-3D
- **Inconvénient :** payant ($200+ pour pack complet)
- **Skip sauf budget alloué**

### Option F — Twemoji (Twitter)
- **Repo :** https://github.com/twitter/twemoji (dépréciée mais code accessible)
- **Style :** Apple-like, SVG
- **Couverture :** Unicode complet
- **Trade-off :** style "Twitter" légèrement reconnu, peut être perçu comme "social media"

---

## Critères de recommandation

Le LLM externe doit pondérer :
1. **Couverture métiers** : pilote = food + coiffure + beauté + fleuriste minimum (5+ secteurs)
2. **Cohérence visuelle** : tous les emojis du même pack pour un look unifié
3. **Performance** : poids total raisonnable (< 500KB asset bundle pour 100 emojis)
4. **Licence** : MIT ou similaire (CC BY-SA acceptable avec attribution dans Mentions Légales)
5. **Maintenance** : pack actif, mises à jour régulières
6. **Style** : matche le design Untitled UI actuel (semi-3D / clean / moderne)

---

## Plan de migration attendu

### Phase 1 — Setup (1-2 commits)

1. **Choisir et installer la lib**
   - `npm install [package]` ou self-host les assets dans `public/emojis/`
   - Créer `lib/emojis/` avec :
     - `emoji-mapping.ts` : mapping nom → asset URL ou Unicode
     - `EmojiPicker.tsx` : composant picker pour formulaire commerçant
     - `Emoji.tsx` : composant `<Emoji name="cookie" size={24} />`

2. **Définir le catalogue Izou**
   - Liste de ~80-120 emojis pertinents pour les métiers cibles
   - Groupés par catégorie (Boissons, Pâtisseries, Coiffure, Beauté, Fleurs, Récompenses générales, etc.)
   - Mapping vers les emojis de la lib choisie

### Phase 2 — Refactor merchant (1-2 commits)

3. **Remplacer la saisie libre emoji par `<EmojiPicker>` dans `/dashboard/marketing/loyalty`**
   - Le commerçant choisit dans le catalogue (modal popup avec catégories)
   - Le formulaire stocke le **name** (ex: `"cookie"`) plutôt que l'Unicode (`"🍪"`)
   - Migration DB optionnelle : `businesses.reward_tiers[].emoji_name` (text) en plus de `emoji` (Unicode pour rétrocompat)

4. **Mapping métier → emoji par défaut**
   - Selon `business.business_type` (cafe, hair, nails, etc.), suggérer 5-10 emojis pertinents en haut du picker

### Phase 3 — Refactor UI (2-3 commits)

5. **Refactor des emojis hardcodés**
   - Remplacer `'☕'` par `<Emoji name="coffee" />` dans CardTab, RecentActivity, etc.
   - Banners + toasts utilisant des emojis : remplacer par le composant unifié

6. **Migration LoyaltyCardVisual + TierProgressBar**
   - Si la lib choisie est en SVG/PNG, vérifier le rendu sur la grille tampons (ne pas casser le visuel actuel)

### Phase 4 — Polish + doc (1 commit)

7. **Documentation `lib/emojis/README.md`**
   - Comment ajouter un nouvel emoji au catalogue
   - Conventions de naming
   - Performance considerations

---

## Format de réponse attendu

```markdown
# Audit galerie emojis Izou — [Date]

## TL;DR
[3-4 lignes : recommandation lib + nb emojis hardcodés trouvés + estimation effort]

## Inventaire actuel

### Emojis hardcodés détectés

| Path | Line | Emoji | Contexte |
|------|------|-------|----------|
| app/card/[id]/components/CardTab.tsx | 132 | 🎁 | Banner reward unlocked |
| ... | ... | ... | ... |

[Total: N emojis hardcodés]

### Emojis stockés en DB

[État de business.reward_tiers[].emoji — sample exemples si possible depuis le code]

## Comparaison des options

| Critère | Fluent Emoji | OpenMoji | Iconify | Lottie | ... |
|---------|--------------|----------|---------|--------|-----|
| Couverture métiers | ✅✅✅ | ✅✅ | ✅✅ | ✅ | ... |
| Style premium | ✅✅ | ✅ | varie | ✅✅✅ | ... |
| Licence | MIT | CC BY-SA | varie | varie | ... |
| ...

## Recommandation : [Option choisie]

**Justification :** [3-5 phrases]

## Catalogue Izou proposé

### Boissons (8 emojis)
- coffee → ☕ Fluent
- tea → 🍵 Fluent
- ...

### Pâtisseries (10)
- cookie → 🍪 Fluent
- ...

### Coiffure (8)
- scissors → ✂️ Fluent
- comb → 🪮 Fluent
- ...

[etc. pour ~80-120 emojis groupés par catégorie]

## Plan de migration

### Phase 1
[fichiers à créer]

### Phase 2
...

## Mapping business_type → emojis suggérés

| business_type | Emojis pertinents (top 10) |
|---------------|----------------------------|
| cafe | coffee, tea, cookie, croissant, cake, donut, ... |
| restaurant | ... |
| bakery | ... |
| snack | ... |
| hair | scissors, comb, brush, hairdryer, ... |
| nails | nail-polish, nail-file, ... |

## Questions ouvertes

[Si besoin de décisions du user : ex Migration DB obligatoire ou rétrocompat Unicode ?]
```

---

## Notes méthodologiques

- **Lecture exhaustive du bundle** : le LLM externe a accès au repo complet via repomix. Doit grep tous les patterns emoji.
- **Pragmatisme pilote** : on cherche la couverture des métiers cibles, pas une perfection cosmétique. 80-120 emojis suffisent.
- **Rétrocompat** : les `business.reward_tiers[].emoji` actuels en Unicode doivent continuer à s'afficher pendant la migration. Migration DB optionnelle.
- **Performance** : si la lib pèse > 500KB, préférer un sous-set self-hosted plutôt que tout le pack.
