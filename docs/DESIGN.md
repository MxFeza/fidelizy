# Izou — Design System

## Sources de verite

| Source | Quoi | Lien |
|--------|------|------|
| **Figma** | Maquettes ecrans + composants visuels | Fichier `PVqIzNHJH5AH3aujECItxR` |
| **@untitledui/react** | Composants React (1:1 avec Figma) | `github.com/untitleduico/react` |
| **@untitledui/icons** | 1100+ icones React (identiques Figma) | Installe v0.0.21 |
| **styles/theme.css** | Design tokens CSS (couleurs, typo, ombres) | Local |

## Stack technique

| Package | Version | Role |
|---------|---------|------|
| `@untitledui/react` | A installer | Composants UI (sidebar, buttons, badges, tables, avatars, inputs, etc.) |
| `@untitledui/icons` | 0.0.21 | Icones React |
| `@untitledui/file-icons` | 0.0.9 | Icones fichiers |
| `react-aria-components` | 1.16.0 | Base headless pour les composants Untitled UI |
| `tailwindcss` | 4 | Utility classes + tokens |
| `framer-motion` | 12.36.0 | Animations ciblees |
| `recharts` | 3.7.0 | Graphiques |

---

## Mapping Figma → React — Composants utilises dans Izou

### Navigation

| Figma | React import | Props cles | Ecrans Izou |
|-------|-------------|------------|-------------|
| Sidebar with labels | `SidebarNavigation` (5 variantes) | NavButton, NavItemBase, NavList, NavAccountCard | E1, F1, G1, H1, I1 |
| Bottom Tab Bar (client) | Custom `BottomTabBar` | 5 onglets | B1-B4, C2, D1, K1, P1 |
| Bottom Nav (commercant) | Custom `BottomNav` | 4 onglets | E2, F3, G2, H2, I2 |
| Header Navigation | `HeaderNavigation` | Mobile menu | Headers mobile |

### Boutons

| Figma | React import | Props | Ecrans |
|-------|-------------|-------|--------|
| Buttons/Button Primary | `Button` | `color="primary"` `size="lg"` | 23+ ecrans |
| Buttons/Button Secondary | `Button` | `color="secondary"` | G1, F1, I1 |
| Buttons/Button Tertiary | `Button` | `color="tertiary"` | Sidebar footer |
| Buttons/Button Destructive | `Button` | `color="primary-destructive"` | F2, C4 |
| Close button | `CloseButton` | — | Modales |

**Sizes :** xs, sm, md, lg, xl
**Colors :** primary, secondary, tertiary, link-color, link-gray, primary-destructive, secondary-destructive, tertiary-destructive

### Badges

| Figma | React import | Props | Ecrans |
|-------|-------------|-------|--------|
| Badge (312 variantes) | `Badge` | `type="pill-color"` `color="brand"` | 14+ ecrans |
| Badge with dot | `BadgeWithDot` | — | Statuts clients |
| Badge with icon | `BadgeWithIcon` | `icon={Star01}` | Recompenses |

**Colors :** gray, brand, error, warning, success, purple, pink, orange, blue, indigo

### Formulaires

| Figma | React import | Props | Ecrans |
|-------|-------------|-------|--------|
| Input field | `Input` / `TextField` | `size="md"` `label` `hint` `isInvalid` | 15+ ecrans |
| Textarea | `Textarea` | `label` `rows` | G1, I1 |
| Select | `Select` | — | G1, H1 |
| Combobox | `Combobox` | Recherche autocomplete | F1 |
| Checkbox | `Checkbox` | — | E1, F1 |
| Radio group | `RadioButtons` | — | G1 |
| Toggle | `Toggle` | — | G1, H1 |
| Verification code (OTP) | Custom OTP | 6 digits | A5 |

### Affichage de donnees

| Figma | React import | Props | Ecrans |
|-------|-------------|-------|--------|
| Table | `Table` + `TableCard` | `size="sm"` Header/Body/Row/Cell | E1, F1, H1 |
| Avatar | `Avatar` | `size="md"` `src` `initials` `status` | 8+ ecrans |
| Avatar label group | `AvatarLabelGroup` | — | E1, F1 |
| Avatar profile photo | `AvatarProfilePhoto` | Upload | G1a |
| Pagination | `Pagination` | — | B4, E1, F1 |
| Progress bar | `ProgressBar` | `value` | B1, B3, C2 |
| Progress circle | `ProgressCircle` | — | C2 |

### Feedback & Overlays

| Figma | React import | Props | Ecrans |
|-------|-------------|-------|--------|
| Modal | `Modal` | — | C4, I1 |
| Empty state | `EmptyState` | — | Pages placeholder |
| Tabs | `Tabs` | — | Dashboard sous-pages |
| Dropdown | `Dropdown` | — | E1, F1 |

### Graphiques

| Figma | React import | Ecrans |
|-------|-------------|--------|
| Line/bar chart | `recharts` BarChart | E1 |
| Pie chart | `recharts` PieChart | E1 |

---

## Composants custom a creer (hors Untitled UI)

| Composant | Description | Ecrans |
|-----------|-------------|--------|
| `StampCard` | Grille 5x2 tampons (0-10/10) | B1, B2 |
| `PointsProgressBar` | Barre avec paliers | B3 |
| `KPICard` | Card metrique avec delta | E1, E2 |
| `EphemeralCode` | Code parrainage + timer | D1 |
| `ClientCard` | Card client mobile | F3 |
| `RewardCatalog` | Liste paliers recompenses | C2 |
| `ColorSwatches` | Selecteur couleur commerce | G1 |

---

## Palette couleurs — Tokens semantiques (REGLE ABSOLUE)

> **JAMAIS de couleurs brutes** (`bg-gray-50`, `text-gray-700`, `bg-brand-600`) dans le code des composants.
> **TOUJOURS utiliser les tokens semantiques** (`bg-primary_hover`, `text-secondary`, `bg-brand-solid`).
> Les tokens sont definis dans `styles/theme.css` et s'adaptent automatiquement light/dark.

### Text colors

| Token | Resout en | Usage |
|-------|-----------|-------|
| `text-primary` | gray-900 #181D27 | Titres, headings |
| `text-secondary` | gray-700 #414751 | **Nav items inactifs**, labels, section headings |
| `text-secondary_hover` | gray-800 | Hover sur texte secondaire |
| `text-tertiary` | gray-600 | Texte supporting, paragraphe |
| `text-quaternary` | gray-500 | Texte tres subtil (footer headings) |
| `text-placeholder` | gray-500 | Placeholder inputs |
| `text-white` | #FFF | Texte sur fond brand solide (**nav item actif**) |
| `text-brand-primary` | brand-900 | Headings brand |
| `text-brand-secondary` | brand-700 #6941C6 | **Sous-item nav actif**, accents brand |
| `text-brand-secondary_hover` | brand-800 | Hover sur texte brand |
| `text-error-primary` | error-600 | Erreurs |
| `text-warning-primary` | warning-600 | Alertes |
| `text-success-primary` | success-600 | Confirmations |

### Foreground (icones)

| Token | Resout en | Usage |
|-------|-----------|-------|
| `text-fg-primary` | gray-900 | Icones haute priorite |
| `text-fg-secondary` | gray-700 | Icones contraste eleve |
| `text-fg-tertiary` | gray-600 | Icones medium |
| `text-fg-quaternary` | gray-400 #A4A7AE | **Icones nav items inactifs**, icones inputs |
| `text-fg-quaternary_hover` | gray-500 | Hover sur icone inactif |
| `text-fg-white` | #FFF | Icones toujours blanches |
| `text-fg-brand-primary` | brand-600 | **Icones sous-item nav actif**, featured icons |
| `text-fg-brand-primary_alt` | brand-600→gray dark | Alt brand icons |

### Background

| Token | Resout en | Usage |
|-------|-----------|-------|
| `bg-primary` | white | Fond principal (sidebar, cards) |
| `bg-primary_hover` | gray-50 #FAFAFA | **Hover nav items**, hover menu items |
| `bg-secondary` | gray-50 | **Fond card feedback sidebar**, sections |
| `bg-secondary_hover` | gray-100 | Hover sur bg-secondary |
| `bg-tertiary` | gray-100 | Toggles, badges |
| `bg-quaternary` | gray-200 | Sliders, progress bars |
| `bg-active` | gray-50 | Item menu selectionne |
| `bg-overlay` | gray-950/60 | Overlay modales |
| `bg-brand-primary` | brand-50 | Fond brand tres clair |
| `bg-brand-secondary` | brand-100 #F4EBFF | **Fond sous-item nav actif**, featured icons |
| `bg-brand-solid` | brand-600 #7F56D9 | **Fond parent nav actif**, CTA primary |
| `bg-brand-solid_hover` | brand-700 #6941C6 | Hover CTA primary |
| `bg-error-solid` | error-600 | CTA destructif |
| `bg-success-solid` | success-600 | Confirmations |

### Border / Ring / Outline

| Token | Resout en | Usage |
|-------|-----------|-------|
| `border-primary` | gray-300 | Bordures haute contraste (inputs, checkboxes) |
| `border-secondary` | gray-200 #E9EAEB | **Bordures defaut** (sidebar, cards, dividers) |
| `border-tertiary` | gray-100 | Bordures subtiles |
| `border-brand` | brand-500 | Focus input actif |
| `border-error` | error-500 | Erreur input |
| `outline-focus-ring` | brand-500 | Focus accessible |

### Brand — echelle complete de violet (source exacte)

Ces valeurs sont definies dans `styles/theme.css` ligne 120-131 et ne doivent **jamais** etre redefinies. Utiliser les tokens semantiques ci-dessus, pas ces valeurs brutes.

| Classe brute | RGB | Hex | Swatch | Token qui l'utilise |
|--------------|-----|-----|--------|---------------------|
| `brand-25` | rgb(252 250 255) | #FCFAFF | tres clair | — (hover subtil) |
| `brand-50` | rgb(249 245 255) | #F9F5FF | lavande pale | `bg-brand-primary` |
| `brand-100` | rgb(244 235 255) | #F4EBFF | lavande | **`bg-brand-secondary`** (sous-item nav actif) |
| `brand-200` | rgb(233 215 254) | #E9D7FE | violet pastel | chevron sur parent actif |
| `brand-300` | rgb(214 187 251) | #D6BBFB | violet clair | — |
| `brand-400` | rgb(182 146 246) | #B692F6 | violet medium | — |
| `brand-500` | rgb(158 119 237) | #9E77ED | **Base brand** | focus ring |
| `brand-600` | rgb(127 86 217) | **#7F56D9** | **Violet principal** | **`bg-brand-solid`**, CTA primary, parent nav actif |
| `brand-700` | rgb(105 65 198) | #6941C6 | violet fonce | **`text-brand-secondary`**, hover `bg-brand-solid_hover` |
| `brand-800` | rgb(83 56 158) | #53389E | violet tres fonce | — |
| `brand-900` | rgb(66 48 125) | #42307D | indigo fonce | `text-brand-primary` |
| `brand-950` | rgb(44 28 95) | #2C1C5F | presque noir | headings sur fond violet |

### Gray — echelle complete

| Classe brute | Hex | Token semantique |
|--------------|-----|-------------------|
| `gray-25` | #FCFCFD | — |
| `gray-50` | #FAFAFA | `bg-secondary`, `bg-primary_hover` |
| `gray-100` | #F5F5F5 | `bg-tertiary` |
| `gray-200` | #E9EAEB | `bg-quaternary`, `border-secondary` |
| `gray-300` | #D5D7DA | `border-primary` |
| `gray-400` | #A4A7AE | `text-fg-quaternary` (icones inactives) |
| `gray-500` | #717680 | `text-placeholder`, `text-quaternary` |
| `gray-600` | #535862 | `text-tertiary` |
| `gray-700` | #414751 | **`text-secondary`** (nav items inactifs) |
| `gray-800` | #252B37 | `text-secondary_hover` |
| `gray-900` | #181D27 | **`text-primary`** (titres) |
| `gray-950` | #0C0E12 | `bg-overlay` |

### REGLE ABSOLUE

1. Dans un composant : **JAMAIS** `bg-brand-600`, `text-gray-700` etc.
2. TOUJOURS le token semantique : `bg-brand-solid`, `text-secondary`.
3. Le bon fichier pour referencer une valeur brute = **JAMAIS dans le code applicatif**, uniquement dans `styles/theme.css`.

---

## Typographie

**Font :** Inter (variable)

| Style | Classe Tailwind | Taille |
|-------|----------------|--------|
| Display 2xl | `text-display-2xl font-semibold` | 72px |
| Display xl | `text-display-xl font-semibold` | 60px |
| Display lg | `text-display-lg font-semibold` | 48px |
| Display md | `text-display-md font-semibold` | 36px |
| Display sm | `text-display-sm font-semibold` | 30px |
| Display xs | `text-display-xs font-semibold` | 24px |
| Text xl | `text-xl` | 20px |
| Text lg | `text-lg` | 18px |
| Text md | `text-md font-semibold` | 16px — titres cards |
| Text sm | `text-sm font-semibold` | **14px — nav items** (label + sous-items) |
| Text sm | `text-sm` | 14px — body, labels, hints |
| Text xs | `text-xs` | 12px — captions, kbd |

---

## Responsive

| Breakpoint | Valeur | Usage Izou |
|------------|--------|------------|
| `xxs` | 320px | Petit mobile |
| `xs` | 600px | Grand mobile |
| `md` | 768px | **Seuil sidebar** (hidden < md) |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Max container |

Hook disponible : `useBreakpoint("md")` → boolean

---

## Ombres

| Classe | Usage |
|--------|-------|
| `shadow-xs` | Inputs, boutons |
| `shadow-sm` | Cards |
| `shadow-lg` | Sidebar flottante |

## Radius

| Classe | Valeur | Usage |
|--------|--------|-------|
| `rounded-md` | 6px | Nav items, boutons, inputs |
| `rounded-lg` | 8px | Cards |
| `rounded-xl` | 12px | Grandes cards |
| `rounded-full` | 9999px | Avatars, badges pill |

---

## Patterns sidebar (Figma E1) — tokens semantiques

Les patterns ci-dessous sont la **source de verite** pour `components/ui/application/app-navigation/nav-item.tsx`. Ne pas les modifier sans mise a jour du fichier.

### Dimensions (identiques @untitledui/react)

| Propriete | Valeur | Usage |
|-----------|--------|-------|
| Hauteur max item | `max-h-9` | 36px — identique Untitled UI |
| Padding parent | `p-2` | 8px all-around |
| Padding sous-item | `py-2 pr-3 pl-10` | pl-10 = 40px (icone 20 + gap 2 + padding) |
| Radius | `rounded-md` | 6px |
| Icone | `size-5` | 20px |
| Texte | `text-sm font-semibold` | 14px / 600 |
| Transition | `transition duration-100 ease-linear` | Snappy |

### Etats (SEULE DIVERGENCE vs Untitled UI : active parent = violet solide au lieu de gray)

| Etat | Classes tokens |
|------|----------------|
| **Defaut** | `bg-primary text-secondary` + icone `text-fg-quaternary` |
| **Hover** | `bg-primary_hover` + texte `text-secondary_hover` + icone `text-fg-quaternary_hover` |
| **Parent actif** | `bg-brand-solid hover:bg-brand-solid_hover` + texte `text-white` + icone `text-white` |
| **Sous-item actif** | `bg-brand-secondary` + texte `text-brand-secondary` + icone `text-fg-brand-primary` |
| **Chevron actif** | `text-brand-200` (sur parent solide) |
| **Focus ring** | `outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2` |

### Badge "A venir"

```tsx
<span className="ml-3 inline-flex items-center rounded-full bg-tertiary px-2.5 py-0.5 text-sm font-medium text-secondary">
  A venir
</span>
```

(`bg-tertiary` = gray-100, `text-secondary` = gray-700)

---

## Mapping icones navigation

| Element | Import `@untitledui/icons` |
|---------|---------------------------|
| Tableau de bord | `HomeLine` |
| Clients | `Users01` |
| Marketing | `Send03` |
| Reglages | `Settings01` |
| Mon entreprise | `Building07` |
| Securite | `ShieldTick` |
| Abonnement | `CoinsStacked01` |
| Confidentialite | `FileShield02` |
| Programme fidelite | `Star01` |
| Push | `Bell01` |
| Deconnexion | `LogOut01` |
| Chevron | `ChevronDown` / `ChevronUp` |

---

## Regles absolues

1. **Figma = source de verite** — consulter le Figma AVANT d'implementer
2. **@untitledui/react pour TOUS les composants** — jamais from scratch
3. **@untitledui/icons pour TOUTES les icones** — jamais SVG inline, jamais lucide-react
4. **Classes Tailwind avec tokens theme.css** — jamais de hex bruts
5. **JAMAIS de degrades** — aplats propres uniquement
6. **JAMAIS de features v2** dans l'UI (SMS, Automatisations) — meme pas en placeholder

---

## Logo

| Variante | Fichier |
|----------|---------|
| Noir (sidebar) | `public/Izou Assets/Izou logo Noir.svg` |
| Blanc (fonds sombres) | `public/Izou Assets/Izou logo Blanc.svg` |

---

## Fichiers CSS

| Fichier | Role |
|---------|------|
| `styles/globals.css` | Imports Tailwind + plugins |
| `styles/theme.css` | **Tokens Untitled UI** — source de verite CSS |
| `styles/typography.css` | Classes typo additionnelles |
| `app/globals.css` | Reset app-level |
| ~~`styles/izou-tokens.css`~~ | **SUPPRIME** |
