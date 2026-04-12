# Prompt — Session Epics & User Stories Izou

> Copier-coller ce prompt au début de la prochaine session Claude Code.

---

## INSTRUCTION

Lance `/bmad-create-epics-and-stories` pour le projet Izou.

## CONTEXTE À CHARGER

Lis ces fichiers dans cet ordre AVANT de commencer :

1. **PRD + Functional Requirements (52 FR)** :
   - Cherche dans les mémoires projet : `C:\Users\UX8402\.claude\projects\C--Users-UX8402\memory\project_izou.md`
   - Product brief : `C:\Users\UX8402\fidelizy\docs\planning-artifacts\product-brief-izou-2026-03-23.md`

2. **Écrans & Composants (source of truth UX)** :
   - `C:\Users\UX8402\Desktop\IZOU-ECRANS-COMPOSANTS.md` — 28 écrans, 10 workflows, composants custom

3. **État du code existant** :
   - `C:\Users\UX8402\fidelizy\docs\PROJET_STATE.md` — features implémentées, routes API, composants React
   - `C:\Users\UX8402\fidelizy\docs\api-contracts.md` — 45 endpoints

4. **Architecture** :
   - `C:\Users\UX8402\fidelizy\docs\architecture.md`
   - `C:\Users\UX8402\fidelizy\docs\data-models.md` — 14 tables

5. **Figma progress (ce qui a été designé)** :
   - `C:\Users\UX8402\.claude\projects\C--Users-UX8402\memory\project_izou_figma_progress.md`
   - Fichier Figma : `PVqIzNHJH5AH3aujECItxR` — 20+ écrans client + ~80 artefacts dev-ready

6. **Backlog v2 (features exclues du pilote)** :
   - `C:\Users\UX8402\.claude\projects\C--Users-UX8402\memory\project_izou_v2_backlog.md`

7. **Interviews utilisateurs** :
   - `C:\Users\UX8402\.claude\projects\C--Users-UX8402\memory\project_izou_interviews_v2.md`

8. **Navigation architecture v4** :
   - `C:\Users\UX8402\.claude\projects\C--Users-UX8402\memory\project_izou_nav_architecture.md`

9. **Brief recettage (architecture cible sidebar)** :
   - `C:\Users\UX8402\Desktop\IZOU-RECETTAGE-BRIEF.md`

## CONTRAINTES

- **Scope v1 pilote uniquement** — ne PAS inclure les features du backlog v2
- Le code existe DÉJÀ en prod (fidelizy.vercel.app) — les epics doivent distinguer ce qui est à **refactoriser** (aligner sur le nouveau Figma) vs ce qui est à **créer** (écrans/features manquants)
- Solo dev — les sprints doivent être réalistes pour 1 personne
- Pilote avril 2026 — deadline dure
- Les user stories doivent référencer les écrans Figma par ID quand pertinent
- Inclure un epic dédié **Apple Wallet + Google Wallet** (design des cartes wallet natif)
- Inclure un epic dédié **Refactor UI client** (aligner /card, /join, /recover sur le nouveau Figma)

## OUTPUT ATTENDU

Un fichier structuré avec :
1. Liste des Epics (6-10 max)
2. Pour chaque Epic : 3-8 User Stories avec acceptance criteria
3. Dépendances entre epics
4. Estimation T-shirt sizing (S/M/L/XL)
5. Ordre de priorité pour le pilote
