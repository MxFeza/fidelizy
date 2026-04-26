# Story 1.2 — Bottom Nav mobile commercant

**Epic :** 1 (Navigation & Design System) · **Taille :** S · **Statut :** in-progress
**Figma :** E2 node [10421:4570](https://figma.com/design/PVqIzNHJH5AH3aujECItxR?node-id=10421-4570) · frame "Bottom Tab Bar Commerçant" (10478:1042)
**Fichier :** `components/dashboard/BottomNav.tsx`

## Decision divergence Figma vs epic

- Figma E2 definit **5 tabs** (Tableau de bord, Clients, Marketing, Reglages, Profil).
- Epic 1.2 specifie **4 tabs** (Tableau de bord, Clients, Marketing, Mon espace).
- **Decision 2026-04-22** : option B (epic) valide par user — 4 tabs pour eviter etouffement sur 375px mobile et pour coherence avec sidebar desktop qui agrege settings+profil sous "Reglages". Tab "Mon espace" route vers `/dashboard/settings`.

## Changements vs version pre-existante

Le fichier existait mais violait plusieurs regles (lucide-react au lieu d'`@untitledui/icons`, couleurs brutes, mauvaise structure de nav). Reecrit proprement :

| Avant | Apres |
|-------|-------|
| `lucide-react` icons | `@untitledui/icons` (HomeLine, Users01, Send03, User01) |
| `text-indigo-600`, `text-gray-400` | Tokens semantiques (`text-fg-brand-primary`, `text-fg-quaternary`, `text-brand-secondary`, `text-secondary`) |
| 4 tabs : Scanner, Clients, Reglages, Profil | 4 tabs : Tableau de bord, Clients, Marketing, Mon espace |
| Nav `<nav>` avec `<Link>` directs | Structure semantique `<nav><ul><li><Link>` |
| Label `text-xs` sans poids | `text-xs font-semibold` + transition |

## Acceptance criteria

- [x] 4 tabs ordre : Tableau de bord / Clients / Marketing / Mon espace
- [x] Actif = icone `text-fg-brand-primary` (brand-600) + label `text-brand-secondary` (brand-700)
- [x] Inactif = icone `text-fg-quaternary` (gray-400) + label `text-secondary` (gray-700)
- [x] Cache en >=md (desktop) avec `md:hidden`
- [x] Safe area iOS via `pb-[env(safe-area-inset-bottom)]`
- [x] Accessibilite : `aria-current="page"` sur tab actif + focus ring

## Test manuel

1. Devtools → iPhone SE (375x667)
2. Verifier que la sidebar desktop disparait
3. Verifier que le bottom nav apparait en bas
4. Cliquer sur chaque tab → route correcte + tab actif en violet
5. Mon espace route vers `/dashboard/settings`

## Next story

1-3 Bell notifications + design tokens globaux.
