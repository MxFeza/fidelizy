# Story 1.1 : Sidebar desktop v4 (4 entrees)

Status: review

## Story

En tant que commercant,
je veux une sidebar simplifiee avec 4 sections,
afin de naviguer rapidement.

## Acceptance Criteria

1. **Given** le commercant est sur desktop (>= md breakpoint, 768px)
   **When** il voit la sidebar
   **Then** 4 entrees principales : Tableau de bord, Clients, Marketing, Mon espace

2. **Given** l'entree Marketing est visible
   **When** le commercant clique dessus ou est sur une page Marketing
   **Then** un sous-menu s'expanse avec : Programme fidelite, Parrainage, Push, SMS (badge "Bientot"), Automatisations (badge "Bientot")

3. **Given** le commercant navigue entre les pages
   **Then** l'entree active est surlignee en Brand 600 (`#7F56D9`) avec fond `brand-50` et bordure gauche 3px `brand-600`

4. **Given** la sidebar est affichee
   **Then** logo Izou en haut, nom du commerce sous le logo, bouton "Se deconnecter" en bas

5. **Given** le commercant est sur mobile (< md breakpoint)
   **Then** la sidebar est masquee (`hidden md:flex`)

6. **Given** le commercant navigue sur /dashboard/notifications
   **Then** la page reste accessible mais Notifications N'EST PAS un item de navigation sidebar (sera un bell icon dans Story 1.3)

## Tasks / Subtasks

- [x] Task 1 — Refactorer `app/dashboard/(protected)/Sidebar.tsx` (AC: #1, #3, #4, #5)
  - [x] 1.1 Remplacer les SVGs inline par des icones `@untitledui/icons` (HomeLine, Users01, Send03, User01)
  - [x] 1.2 Mettre a jour le tableau `links` : 4 entrees (Tableau de bord, Clients, Marketing, Mon espace)
  - [x] 1.3 Supprimer les entrees "Notifications" et "Parametres" de la nav
  - [x] 1.4 Fusionner le lien "Mon profil" du bas dans le nav principal → renommer "Mon espace" href="/dashboard/profile"
  - [x] 1.5 Style actif : `bg-brand-50 text-brand-700 border-l-3 border-brand-600` (Untitled UI tokens)
  - [x] 1.6 Style inactif : `text-gray-700 hover:bg-gray-50 hover:text-gray-900`
  - [x] 1.7 Conserver logo Izou (utiliser `bg-brand-600` au lieu de `bg-indigo-600`)
  - [x] 1.8 Conserver le nom du commerce + bouton deconnexion en bas

- [x] Task 2 — Implementer le sous-menu Marketing expansible (AC: #2)
  - [x] 2.1 Creer un composant `SidebarSubmenu` dans le meme fichier ou un fichier dedie
  - [x] 2.2 Marketing se deroule au clic OU auto-expand si pathname commence par `/dashboard/marketing`
  - [x] 2.3 Sous-items : Programme fidelite (`/dashboard/marketing/loyalty`), Parrainage (`/dashboard/marketing/referral`), Push (`/dashboard/marketing/push`), SMS (disabled + badge "Bientot"), Automatisations (disabled + badge "Bientot")
  - [x] 2.4 Animation d'expansion : Framer Motion `AnimatePresence` + `motion.div` (height auto)
  - [x] 2.5 Style sous-items : `pl-9 text-sm text-gray-600`, actif `text-brand-700 font-medium`
  - [x] 2.6 Badge "Bientot" : `text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5`

- [x] Task 3 — Creer les routes placeholder Marketing (AC: #2)
  - [x] 3.1 Creer `app/dashboard/(protected)/marketing/page.tsx` → redirect vers loyalty
  - [x] 3.2 Creer `app/dashboard/(protected)/marketing/loyalty/page.tsx` → placeholder "Programme fidelite"
  - [x] 3.3 Creer `app/dashboard/(protected)/marketing/referral/page.tsx` → placeholder "Parrainage"
  - [x] 3.4 Creer `app/dashboard/(protected)/marketing/push/page.tsx` → placeholder "Push notifications"
  - [x] 3.5 Chaque placeholder : titre + empty state texte + icone illustrative (Untitled UI)

- [x] Task 4 — Adapter le layout et les imports (AC: #1, #5)
  - [x] 4.1 Verifier que `layout.tsx` continue a passer `businessName` a la Sidebar
  - [x] 4.2 Verifier que BottomNav et MobileHeader ne sont pas affectes
  - [x] 4.3 Remplacer TOUTES les references `indigo-600`/`indigo-50`/`indigo-700` par `brand-600`/`brand-50`/`brand-700` dans Sidebar

- [x] Task 5 — Tests et validation (AC: #1-6)
  - [x] 5.1 Verifier TypeScript compile sans erreur (`npx tsc --noEmit`)
  - [x] 5.2 Verifier Next.js build passe (`npm run build`)
  - [ ] 5.3 Verifier que les 6 tests Playwright existants passent (pas de regression)
  - [x] 5.4 Verifier que les 29 tests Vitest passent
  - [ ] 5.5 Test manuel : navigation entre les 4 entrees, sous-menu Marketing, deconnexion

## Dev Notes

### Architecture existante a modifier

**Fichier principal :** `app/dashboard/(protected)/Sidebar.tsx` (139 lignes)
- Client component (`'use client'`)
- Recoit `businessName: string` en prop depuis le layout Server Component
- 4 entrees actuelles : Tableau de bord, Clients, Notifications, Parametres + lien "Mon profil" separe en bas
- Utilise des SVGs inline (pas d'icon library)
- Style actif actuel : `bg-indigo-50 text-indigo-700` → remplacer par `bg-brand-50 text-brand-700`
- Logique isActive : exact match pour `/dashboard`, startsWith pour les autres

**Layout :** `app/dashboard/(protected)/layout.tsx` (40 lignes)
- Server Component qui fetch le business via Supabase
- Compose : `<Sidebar>` + `<MobileHeader>` + `<main>` + `<BottomNav>`
- NE PAS MODIFIER ce fichier sauf si necessaire

### Design tokens disponibles (theme.css — Untitled UI)

Les tokens sont deja configures dans `styles/theme.css` :
- `brand-25` a `brand-950` (palette violette Untitled UI)
- `brand-600` = `rgb(127 86 217)` = `#7F56D9` (couleur principale)
- `brand-50` = `rgb(249 245 255)` (fond actif sidebar)
- `brand-700` = `rgb(105 65 198)` (texte actif)
- `gray-50`, `gray-100`, `gray-500`, `gray-700`, `gray-900` (neutres)

**IMPORTANT :** Utiliser les classes Tailwind `brand-*` (pas `indigo-*`, pas les variables CSS custom `--izou-*`). Les tokens `--izou-*` dans `izou-tokens.css` sont legacy, ne pas les utiliser.

### Librairies disponibles

- **@untitledui/icons v0.0.21** : Icones React, import `{ HomeLine, Users01, Send03, User01, ChevronDown, Lock01, Zap } from '@untitledui/icons'`
  - `HomeLine` → Tableau de bord
  - `Users01` → Clients
  - `Send03` → Marketing (paper plane)
  - `User01` → Mon espace
  - `ChevronDown` → fleche expansion sous-menu
  - `Lock01` ou `Clock` → badge "Bientot" items
- **framer-motion v12.36.0** : Pour animation du sous-menu expansible
- **lucide-react** : NE PAS utiliser pour cette story, preferer @untitledui/icons pour coherence

### Regles design imperatives

- **JAMAIS de degrades** — aplats propres uniquement
- **Sidebar blanc/warm sobre** — fond blanc, selection par nuances subtiles (brand-50 + bordure brand-600)
- **Hierarchie CTA :** violet = principal, noir = secondaire, outline = tertiaire, rouge = destructif
- **Icones :** Untitled UI pour toute l'interface, emojis uniquement dans contenu utilisateur

### Routes/pages existantes a ne PAS casser

| Route | Page | Note |
|-------|------|------|
| `/dashboard` | Vue d'ensemble | Page principale dashboard |
| `/dashboard/clients` | Liste clients | Existante |
| `/dashboard/clients/[id]` | Detail client | Existante |
| `/dashboard/notifications` | Notifications | Existante — ne PAS supprimer, juste retirer de la nav |
| `/dashboard/settings` | Parametres | Existante — sera replacee sous "Mon espace" plus tard |
| `/dashboard/profile` | Profil | Existante — sera le href de "Mon espace" |

### Patterns du projet a respecter

- Client Components : `'use client'` en haut du fichier
- Imports Next.js : `Link` de `next/link`, `usePathname` de `next/navigation`
- Supabase client : `createClient` de `@/lib/supabase/client` (pour logout)
- Style : Tailwind CSS 4 avec tokens Untitled UI (pas de CSS-in-JS)
- Convention nommage : PascalCase composants, camelCase fonctions

### Previous Story Intelligence (Epic 0)

- **Pattern etabli :** `withErrorHandler` pour toutes les routes API — ne PAS modifier les routes API dans cette story
- **Tests :** 29 Vitest + 6 Playwright. Les tests E2E testent `/dashboard` (auth + KPIs). S'assurer que la sidebar modifiee ne casse pas le rendu
- **Build :** Le build Next.js est le gate final. Toujours verifier
- **Convention commits :** `feat(story-1.1): sidebar desktop v4 — 4 entrees nav`

### Figma Reference

- Desktop dashboard : node `10408:100385` dans fichier `PVqIzNHJH5AH3aujECItxR`
- Nav v4 spec : `docs/figma/wf9-refonte-navigation.md`

### Project Structure Notes

- Sidebar vit dans `app/dashboard/(protected)/Sidebar.tsx` — pas dans `components/`
- Les composants dashboard partages (BottomNav, MobileHeader) sont dans `components/dashboard/`
- Les nouvelles pages marketing iront dans `app/dashboard/(protected)/marketing/`
- Le route group `(protected)` assure l'auth via le layout Server Component

### References

- [Source: docs/planning-artifacts/epics.md#Epic-1, Story 1.1]
- [Source: docs/figma/wf9-refonte-navigation.md]
- [Source: memory/project_izou_nav_architecture.md]
- [Source: memory/project_izou_design_system.md]
- [Source: styles/theme.css — lignes 120-131 pour tokens brand-*]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

Aucun probleme rencontre.

### Completion Notes List

- Sidebar refactoree : 4 entrees (Tableau de bord, Clients, Marketing, Mon espace) remplacent les 5 anciennes (Tableau de bord, Clients, Notifications, Parametres, Mon profil)
- SVGs inline remplaces par @untitledui/icons (HomeLine, Users01, Send03, User01, ChevronDown, LogOut01, Star01, Heart, Bell01, MessageSquare01, Zap)
- Toutes les references indigo-* remplacees par brand-* (tokens Untitled UI)
- Sous-menu Marketing avec animation Framer Motion (AnimatePresence + motion.div)
- Auto-expand du sous-menu quand pathname commence par /dashboard/marketing
- Items "Bientot" (SMS, Automatisations) desactives avec badge gris
- 4 routes placeholder marketing creees (redirect index, loyalty, referral, push)
- Layout et BottomNav/MobileHeader non modifies
- TypeScript : 0 erreurs | Build Next.js : OK | Vitest : 29/29 | Playwright : non execute (necessite serveur local)

### Change Log

- 2026-04-12 : Implementation complete Story 1.1 — sidebar desktop v4

### File List

- app/dashboard/(protected)/Sidebar.tsx (MODIFIED — refactor complet)
- app/dashboard/(protected)/marketing/page.tsx (NEW — redirect vers loyalty)
- app/dashboard/(protected)/marketing/loyalty/page.tsx (NEW — placeholder)
- app/dashboard/(protected)/marketing/referral/page.tsx (NEW — placeholder)
- app/dashboard/(protected)/marketing/push/page.tsx (NEW — placeholder)
- docs/implementation-artifacts/1-1-sidebar-desktop-v4.md (MODIFIED — story file)
- docs/implementation-artifacts/sprint-status.yaml (MODIFIED — status updates)
