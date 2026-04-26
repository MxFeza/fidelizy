# Story 1.4 — Sous-navigation horizontale (sub-nav)

**Epic :** 1 (Navigation & Design System) · **Taille :** S · **Statut :** in-progress
**Figma :** E2 node `10421:5312` ("Sub navigation") — pattern container violet + pill blanc actif
**Fichiers livres :**
- `components/ui/application/app-navigation/sub-nav.tsx` (nouveau, reutilisable)
- `app/dashboard/(protected)/marketing/layout.tsx` (nouveau, wrap Marketing)

## Contexte

Story ajoutee au sprint 2026-04-22 suite au feedback user sur la Story 1.2 : sections Marketing et Reglages ont des sous-onglets dans la sidebar desktop, mais rien ne les expose dans le content area — impossible de naviguer entre "Programme fidelite" et "Push" sur mobile, et pas de repere visuel de la section active sur desktop.

## Pattern visuel (Figma)

Container horizontal `rounded-lg bg-brand-solid p-1` avec gap-1 entre tabs. Chaque tab est un `<Link>` :
- **Actif** : `bg-primary text-brand-secondary` (pill blanc, texte brand-700)
- **Inactif** : `bg-transparent text-white hover:bg-brand-solid_hover` (transparent, texte blanc)

## API du composant

```tsx
import { SubNav } from '@/components/ui/application/app-navigation/sub-nav'

<SubNav items={[
  { label: 'Programme fidelite', href: '/dashboard/marketing/loyalty' },
  { label: 'Push', href: '/dashboard/marketing/push' },
]} />
```

- `items: SubNavItem[]` requis
- `matcher?: (pathname: string) => boolean` optionnel par item (par defaut : match exact ou prefix)
- `className?: string` optionnel sur la nav

Accessibilite : `role="tablist"` sur la nav, `role="tab"` + `aria-selected` sur chaque tab, `aria-current="page"` sur l'actif.

## Branchements

| Section | Sous-routes existantes | SubNav branche ? |
|---------|------------------------|------------------|
| Marketing | `/loyalty`, `/push` | **OUI** via `marketing/layout.tsx` |
| Reglages | aucune encore (Mon entreprise, Securite, Abonnement, Confidentialite = TODO) | Non — a brancher quand les routes existeront |
| Tableau de bord | Statistiques retire → plus de sous-items | Non applicable |

## Decision scope

Reglages n'est pas branche dans cette story car les sous-pages n'existent pas encore (clic dans la sidebar = 404). Sera traite dans une story dediee quand Epic 7 ou une story settings creera les routes.

## Test manuel

1. Aller sur `/dashboard/marketing/loyalty` → SubNav affiche avec **Programme fidelite** en pill blanc + **Push** en texte blanc sur fond violet.
2. Cliquer **Push** → switch, URL devient `/dashboard/marketing/push`, **Push** devient pill blanc.
3. Desktop + mobile (375px) : les deux doivent rendre correctement.

## Next

1-3 Bell notifications + design tokens globaux.
