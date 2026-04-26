# Story 2.1 — Vue d'ensemble dashboard desktop (E1)

**Epic :** 2 (Dashboard Commercant) · **Taille :** M · **Statut :** review
**Figma :** E1 [`10408:100385`](https://figma.com/design/PVqIzNHJH5AH3aujECItxR?node-id=10408-100385)
**Date :** 2026-04-25

## Fichiers livres

| Fichier | Role |
|---------|------|
| `app/dashboard/(protected)/DashboardClient.tsx` | **REECRIT COMPLET** — refactor avec tokens Untitled UI, layout E1, hero balloon |
| `app/dashboard/(protected)/layout.tsx` | `bg-gray-50` → `bg-secondary` (token semantique) |
| `app/api/dashboard/kpis/route.ts` | + `visitsMonth`, `clientsTotal`, `clientsActifs`, `clientsInactifs` |

## Sections du dashboard (top → bottom)

1. **Hero** — image montgolfiere full-width 200px (asset `auth/balloons-landscape.webp` du bucket Supabase Storage)
2. **Page header** — titre "Bonjour, {prenom}" + sous-titre + 4 actions (Bell, Saisie manuelle, Exporter, Scanner client)
3. **Visites hebdo** (col-span-8) + **Code commerce** (col-span-4) — chart Recharts + QR + short_code + boutons PDF/Lien
4. **KPIs row 1** (4 cards) — Clients inscrits, Visites du mois, Tampons distribues, Taux de retour
5. **KPIs row 2** (3 cards) — Clients actifs (< 30j), A risque (20-60j), Perdus (> 60j)
6. **Top 3 clients** (col-span-4) + **Activites recentes** (col-span-8 table)

## Design tokens utilises

- Tokens semantiques **Untitled UI uniquement** : `bg-primary`, `bg-secondary`, `text-primary`, `text-tertiary`, `text-quaternary`, `border-secondary`, `bg-brand-secondary`, `text-fg-brand-primary`, `text-success-primary`, `text-warning-primary`, `text-error-primary`
- Plus aucune classe `bg-indigo-*`, `text-gray-*`, `bg-gray-*` raw Tailwind
- Brand violet `#7F56D9` utilise dans le QR code generation et le bar chart

## Composants utilises

- `Button` de `@/components/ui/base/buttons/button` (Untitled UI) — 4 variantes : primary, secondary, tertiary
- Icons `@untitledui/icons` : Bell01, Download01, QrCode01, Edit05, ArrowUp, ArrowDown, Copy01, CheckDone01, Loading01, X, Trophy01
- `recharts` BarChart pour visites hebdo (custom `fill="#7F56D9"`)
- `WelcomeModal` (modal post-onboarding) integre via `showWelcome` prop
- `QrScanner` (existant) declenche par CTA primary
- StatCard inline (peut etre extrait si reutilise ailleurs)

## Responsivite

- Mobile : grille 1-col, actions s'enroulent (`flex-wrap`), labels longs caches en faveur de courts (`Saisie manuelle` → `Manuel`)
- Tablette : 2-col KPIs, layout vertical
- Desktop : grilles 12-col, layout horizontal, tous les boutons libelles complets

## Dette documentee

- **Hero balloon** : reuse temporaire de l'image auth, a remplacer par un asset dedie quand le user le fournit (cf. memoire `feedback_no_ai_slop.md`)
- **Revenus estimes** : KPI Figma E1 non implemente — necessite tracking valeur monetaire des transactions (out-of-scope v1)
- **Variation %% vs mois dernier** : pas de snapshots historiques en DB. A implementer avec une table `kpi_snapshots` plus tard.
- **Pagination table activites** : Figma montre une pagination "Page 1 sur 10". Pour l'instant on liste les 10 dernieres seulement. A implementer si la liste devient longue (Story 2-2 polish).

## Acceptance criteria

- [x] Hero affiche image au-dessus de la zone contenu
- [x] Greeting avec prenom du commercant
- [x] 4 actions header (Bell, Saisie manuelle, Exporter, Scanner)
- [x] Chart visites hebdo avec barres violet brand
- [x] Carte Code commerce avec QR + short_code + 2 CTA (PDF, Lien)
- [x] 4 KPIs row 1 + 3 KPIs row 2 utilisent les tokens semantiques
- [x] Table activites recentes
- [x] Modale WelcomeModal s'affiche au 1er login (welcome_seen=false)
- [x] Tous les tokens semantiques utilises (aucun `bg-indigo-*`)
- [x] Type check passe
- [x] Routes 200 (dev server)

## Test manuel a faire

1. Login → dashboard → verifier rendu visuel
2. Cliquer "Scanner client" → modale QrScanner s'ouvre
3. Cliquer "Saisie manuelle" → modale + saisie d'un code → valider
4. Cliquer "PDF" sur Code commerce → telecharger le PDF
5. Cliquer le short_code → copier dans clipboard (icone change CheckDone01 2s)
6. Cliquer un client dans Top 3 → naviguer vers fiche client
7. Verifier responsive : redimensionner navigateur de 320px a 1440px
