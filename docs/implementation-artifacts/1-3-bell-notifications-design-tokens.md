# Story 1.3 — Bell notifications + design tokens globaux

**Epic :** 1 (Navigation & Design System) · **Taille :** S · **Statut :** in-progress
**Figma :** E2 node `10421:4576` (Bell notification dans Sidebar navigation mobile)
**Fichiers livres :**
- `components/dashboard/MobileHeader.tsx` (reecrit avec bell + tokens)

## Acceptance criteria

| Criterion | Statut | Notes |
|-----------|--------|-------|
| Bell icon top-right mobile | ✅ | Bell01 + `hasUnread` prop → dot rouge `bg-error-solid` avec ring blanc |
| Bell client (customer-facing) | ⏭ deferred | Out of scope 1.3. Livre dans Epic 4 (Refactor UI client) |
| CTA hierarchy (violet/noir/outline/rouge) | ✅ | Documente dans DESIGN.md section Patterns sidebar + feedback_cta_hierarchy memoire |
| Aucun gradient | ✅ partiel | Pas de gradient dans la nav. **Violations restantes** dans login/register (Epic 7) |
| Brand 600 #7F56D9 partout | ✅ | `bg-brand-solid` chain de variables confirmee → #7f56d9 dans le CSS compile |

## Fix cle livre

Reecriture complete de `MobileHeader.tsx` :

| Avant | Apres |
|-------|-------|
| SVG hand-rolled "Izou" inline | `<Image>` du vrai logo `public/Izou Assets/Izou logo Noir.svg` |
| `bg-white border-gray-200` | `bg-primary border-secondary` (tokens) |
| `bg-indigo-600 text-indigo-600` | Retire, remplace par logo SVG officiel |
| `text-gray-700` | `text-secondary` |
| Pas de bell | Bell01 + lien vers `/dashboard/notifications` + dot rouge conditional |

API : `<MobileHeader businessName="..." hasUnread={boolean} />`. `hasUnread` defaut `false`. A cabler plus tard sur le vrai etat unread (API ou real-time).

## Audit tokens — violations restantes (hors scope 1.3)

| Fichier | Violations | Story responsable |
|---------|------------|-------------------|
| `app/dashboard/(auth)/login/page.tsx` | `bg-gradient-to-br`, `bg-indigo-600`, `text-indigo-600` | Epic 7.1 |
| `app/dashboard/(auth)/register/page.tsx` | Gradients + indigo bruts | Epic 7.1 |
| `app/dashboard/(protected)/clients/ClientsClient.tsx` | `lucide-react` imports | Epic 3.1 |
| `app/dashboard/(protected)/DashboardClient.tsx` | `lucide-react` imports (10+ icones) | Epic 2.1 |
| `app/dashboard/(protected)/notifications/page.tsx` | `lucide-react` imports | Epic 4 ou dedie |
| `app/dashboard/(protected)/profile/ProfileClient.tsx` | `lucide-react` imports | Epic 4.7 |

Ces fichiers seront refactores **dans leur story respective** selon le pattern BMAD. Les documenter ici permet de tracker la dette.

## Test manuel

1. Mobile (DevTools 375px) :
   - Header affiche logo Izou noir a gauche, nom commerce au centre, bell a droite
   - Cliquer bell → redirige vers `/dashboard/notifications`
2. Passer `hasUnread={true}` dans le layout → verifier dot rouge sur bell
3. Desktop (>=768px) : header cache (`md:hidden`), sidebar prend le relais

## Next — Fin Epic 1

Apres 1.3 done, Epic 1 est complet. Prochaine etape = Epic 7 (Auth commercant) selon l'ordre sprint-status.yaml.
