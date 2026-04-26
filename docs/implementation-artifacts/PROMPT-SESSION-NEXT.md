# Prompt de reprise — Story 1.1 Sidebar Desktop v4

Copier-coller ce prompt dans une nouvelle conversation Claude Code.

---

Working directory : C:\Users\UX8402\fidelizy
Branche : develop

## Contexte projet

Izou (fidelizy) — app de fidelite commercant. Next.js 16 App Router, Supabase, TypeScript.
Repo : https://github.com/MxFeza/fidelizy

## Ce qui a ete fait (session precedente)

1. **Epic 0 (Fondations)** : TERMINE et merge sur main (tests, elagage, services, error handling)
2. **Design system pose** :
   - `@untitledui/react` installe (composants Sidebar, Button, Badge, Table, Avatar, Input, etc.)
   - `@untitledui/icons` v0.0.21 (1100+ icones, 1:1 avec Figma)
   - `styles/theme.css` = tokens Untitled UI (couleurs semantiques, typo, ombres, radius)
   - `docs/DESIGN.md` = regles design completes, mapping Figma → React
   - Ancien design system (`izou-tokens.css`) supprime
3. **Story 1.1 en cours** : sidebar partiellement implementee mais avec du code Tailwind manuel au lieu des composants `@untitledui/react`

## Ce qu'il reste a faire

**Reimplementer la sidebar avec les composants `@untitledui/react`** au lieu du code manuel actuel.

Le composant sidebar est dans : `node_modules/@untitledui/react/components/application/app-navigation/`
- 5 variantes : sidebar-simple, sidebar-slim, sidebar-dual-tier, sidebar-section-dividers, sidebar-sections-subheadings
- Sous-composants : NavButton, NavItemBase, NavList, NavAccountCard, MobileNavigationHeader

### Structure nav confirmee par le user (Figma E1 node 10408:100385)

```
Tableau de bord (HomeLine, chevron, expand)
  └ Vue d'ensemble
  └ Statistiques (badge "A venir")

Clients (Users01, chevron)

Marketing (Send03, chevron, expand)
  └ Programme fidelite (Star01) — inclut parrainage
  └ Push (Bell01)

Reglages (Settings01, chevron, expand)
  └ Mon entreprise (Building07)
  └ Securite (ShieldTick)
  └ Abonnement (CoinsStacked01)
  └ Confidentialite (FileShield02)
```

Footer : carte feedback + compte (avatar initiale, nom, email) + logout (LogOut01)
Logo : `public/Izou Assets/Izou logo Noir.svg`

### Couleurs (extraites du Figma, confirmees dans theme.css)

- Item actif parent : `bg-brand-600 text-brand-50` (ou classes semantiques `bg-brand-solid text-white`)
- Sous-item actif : `bg-brand-100 text-brand-700` (ou `bg-brand-secondary text-brand-secondary`)
- Item inactif : `text-gray-700` (ou `text-secondary`)
- Badge "A venir" : `bg-gray-100 text-gray-700`

### Fichiers a modifier

- `app/dashboard/(protected)/Sidebar.tsx` — refactor avec composants @untitledui/react
- `app/dashboard/(protected)/layout.tsx` — passe businessName + businessEmail a Sidebar

### Fichiers a NE PAS toucher

- Routes API (Epic 0 termine)
- BottomNav / MobileHeader (Story 1.2)
- Pages existantes (dashboard, clients, settings, profile, notifications)

## Regles imperatives

1. **BMAD-METHOD strict** — utiliser `/bmad-dev-story docs/implementation-artifacts/1-1-sidebar-desktop-v4.md`
2. **Figma = source de verite** — consulter via `get_design_context` node `10408:102520` fichier `PVqIzNHJH5AH3aujECItxR`
3. **@untitledui/react pour les composants** — JAMAIS coder from scratch
4. **@untitledui/icons pour les icones** — JAMAIS de SVG inline
5. **Classes semantiques Tailwind** (theme.css) — JAMAIS de hex bruts
6. **JAMAIS de degrades, JAMAIS de features v2** (SMS, Automatisations)
7. **Lire `docs/DESIGN.md`** avant toute implementation

## Commande

Lance `/bmad-dev-story docs/implementation-artifacts/1-1-sidebar-desktop-v4.md`
Mode autopilote. Utilise les composants @untitledui/react. Consulte le Figma. Suis le DESIGN.md.
