# Izou — Brief de recettage Figma

> À lire en entier au début de la prochaine conversation.
> Mode : Plan → Exécution

---

## Contexte

22 écrans Figma V1 ont été créés dans le fichier Untitled UI (`PVqIzNHJH5AH3aujECItxR`).
Le user a donné des retours critiques. Ce document prépare le recettage.

## Problèmes identifiés par le user

### 1. Écrans mobiles (A/B/C/D) — qualité insuffisante
- Composants créés from scratch (cercles tampons, frames custom) au lieu de cloner l'existant
- Fonts, spacing, couleurs ne respectent pas les règles du template Untitled UI
- Manque d'icônes, incohérence avec les écrans desktop
- **Règle absolue** : COPIER-COLLER des éléments existants tels quels, modifier UNIQUEMENT les textes

### 2. Architecture sidebar dashboard — incohérente
- "Paramètres" ET "Réglages" dans le menu = doublon
- Dropdowns (Accueil, Tableau de bord, Clients, etc.) sans contenu défini
- Pas d'onglet marketing/interactions justifié

### 3. Écarts avec le PRD et le code existant

**Navigation réelle du code (Sidebar.tsx + BottomNav.tsx) :**
- Dashboard (Home)
- Clients
- Engagement (gamification : surprises, roue, missions, templates métier)
- Notifications (push broadcast)
- Settings (programme fidélité)
- Profile (email, mot de passe)

**Navigation actuelle dans les maquettes :**
- Accueil (dropdown)
- Tableau de bord (dropdown : Vue d'ensemble, Notifications, Historique)
- Clients (dropdown)
- Récompenses (dropdown)
- Statistiques (dropdown)
- Paramètres (dropdown)
- Support
- Réglages

→ Incohérence totale. Les maquettes ont une sidebar inventée qui ne correspond ni au code ni au PRD.

---

## Architecture cible (alignée PRD + code)

### Sidebar desktop — proposition à valider

| Menu | Contenu | Justification PRD |
|------|---------|-------------------|
| **Tableau de bord** | KPIs, graphiques, top clients, activité récente | Product brief : "Dashboard avec métriques honnêtes et vérifiables" |
| **Clients** | Liste, filtres, détail client, ajout/retrait tampons | Product brief : "gestion des clients", API : 45 endpoints dont clients |
| **Engagement** | Templates métier, surprises, roue, missions, parrainage config | Product brief : "gamification progressive activable par presets" |
| **Notifications** | Push broadcast, historique envois | Product brief : "engagement continu via push notifications" |
| **Paramètres** | Programme (type tampons/points, objectif, récompense), Apparence (couleur, aperçu carte), Commerce (nom, logo, adresse, horaires) | Code : settings/page.tsx + profile/page.tsx |

### Éléments RETIRÉS et justification
- **"Récompenses"** — intégré dans Engagement + Clients (détail)
- **"Statistiques"** — intégré dans Tableau de bord (KPIs + graphiques)
- **"Réglages"** — doublon de Paramètres, supprimé
- **"Support"** — hors scope V1 (product brief : "gel des features")
- **"Accueil"** — redondant avec Tableau de bord
- **Marketing dédié** — hors V1 (product brief : "mode communauté envisagé V2")

### Bottom nav mobile
Code actuel : Scanner, Clients, Engagement, Settings, Profile
→ Alignement : **Accueil, Clients, Scanner, Engagement, Plus** (Plus = Notifications + Paramètres + Profil)

---

## Plan d'exécution recettage

### Phase 1 : Validation architecture (mode Plan)
1. Confirmer la sidebar cible avec le user
2. Confirmer les sous-écrans de chaque section
3. Confirmer ce qui est V1 vs V2

### Phase 2 : Correction des écrans existants
1. **E1/E2** — Remplacer la sidebar par la version validée
2. **F1/F2/F3** — Sidebar + ajustements
3. **G1/G1b/G1c/G1d/G2** — Réorganiser selon la nouvelle architecture Paramètres

### Phase 3 : Reconstruction mobiles (A/B/C/D)
1. Explorer TOUT le fichier pour identifier les meilleurs assets à cloner
2. Reconstruire chaque écran uniquement par clone + modification texte
3. Zéro composant custom
4. Valider chaque écran avant le suivant

---

## Documents de référence

| Document | Chemin |
|----------|--------|
| Product Brief | `C:\Users\UX8402\fidelizy\docs\planning-artifacts\product-brief-izou-2026-03-23.md` |
| Personas | `C:\Users\UX8402\fidelizy\docs\planning-artifacts\personas-izou-2026-03-27.md` |
| Écrans & Composants | `C:\Users\UX8402\Desktop\IZOU-ECRANS-COMPOSANTS.md` |
| Architecture technique | `C:\Users\UX8402\fidelizy\docs\architecture.md` |
| API Contracts (45 endpoints) | `C:\Users\UX8402\fidelizy\docs\api-contracts.md` |
| Component Inventory (28 composants) | `C:\Users\UX8402\fidelizy\docs\component-inventory.md` |
| Project Overview | `C:\Users\UX8402\fidelizy\docs\project-overview.md` |
| Data Models (14 tables) | `C:\Users\UX8402\fidelizy\docs\data-models.md` |

## Fichier Figma

- **ID** : `PVqIzNHJH5AH3aujECItxR`
- **Accès** : via API Figma (use_figma)
- **Pages Izou** : E (Home), F (Clients), G (Paramètres), A (Onboarding), B (Carte), C (Récompense), D (Parrainage)

## Navigation code existante (source of truth)

```
Sidebar desktop (Sidebar.tsx):
  - Dashboard → /dashboard
  - Clients → /dashboard/clients
  - Engagement → /dashboard/engagement
  - Notifications → /dashboard/notifications
  - Settings → /dashboard/settings
  - Profile → /dashboard/profile

BottomNav mobile (BottomNav.tsx):
  - Scanner (scan QR)
  - Clients → /dashboard/clients
  - Engagement → /dashboard/engagement
  - Settings → /dashboard/settings
  - Profile → /dashboard/profile
```
