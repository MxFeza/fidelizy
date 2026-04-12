# Izou — Audit Complet V2 & Mapping Features/Pages

**Date :** 2026-03-31
**Sources :** PRD (52 FRs), UX Spec (14 etapes), Product Brief, Personas, IZOU-ECRANS-COMPOSANTS.md, retours user V2

---

## 1. INVENTAIRE COMPLET DES FEATURES V1

### A. Features COMMERCANT (extraites du PRD)

| # | Feature | FRs | Page(s) Figma | Statut actuel |
|---|---------|-----|---------------|---------------|
| C1 | Creer un compte (email + mdp) | FR1 | J1, J2 | OK - pages creees |
| C2 | Configurer programme via template metier (Cafe, Restaurant, Boulangerie, Snack) | FR2 | G1 | PARTIEL - pas de selection template |
| C3 | Personnaliser apparence (couleurs, nom commerce) | FR3 | G1 | PARTIEL - color pickers basiques |
| C4 | Choisir mode tampons/points | FR4 | G1 | PARTIEL - pas de vues distinctes |
| C5 | Configurer parametres (nb tampons, recompense, points/visite, tampons bienvenue) | FR5 | G1 | PARTIEL - pas assez detaille |
| C6 | Generer et imprimer QR code | FR6 | G1 ou E1 | ABSENT |
| C7 | Obtenir lien inscription direct | FR7 | G1 ou E1 | ABSENT |
| C8 | Modifier profil (email, mdp) | FR8 | G1 (onglet) | PARTIEL |
| C9 | Consulter KPIs temps reel | FR34 | E1 | PARTIEL - KPIs insuffisants |
| C10 | Visualiser historique visites 7j | FR35 | E1 | PARTIEL - graphique present |
| C11 | Voir top meilleurs clients | FR36 | E1 | ABSENT |
| C12 | Rechercher client (nom ou telephone) | FR37 | F1 | OK |
| C13 | Detail client (carte, stats, historique) | FR38 | F2 | OK |
| C14 | Filtrer clients par statut | FR39 | F1 | PARTIEL |
| C15 | Exporter liste clients CSV | FR40 | F1 | ABSENT |
| C16 | Recevoir notification a chaque scan | FR41 | (automatique) | N/A design |
| C17 | Envoyer notification broadcast | FR28 | I1 | OK |
| C18 | Ajouter manuellement tampons/points (fallback) | FR49 | F2 | ABSENT |
| C19 | Retirer tampons/points (correction) | FR50 | F2 | ABSENT |
| C20 | Reinitialiser carte client | FR51 | F2 | ABSENT |
| C21 | Valider manuellement echange recompense | FR52 | F2 ou notif | ABSENT |
| C22 | Configurer bonus parrainage | FR33 | G1 (onglet) | ABSENT |
| C23 | Configurer cooldown anti-fraude | FR42 | G1 | ABSENT |

### B. Features CLIENT FINAL (extraites du PRD)

| # | Feature | FRs | Page(s) Figma | Statut actuel |
|---|---------|-----|---------------|---------------|
| CL1 | Scanner QR comptoir → inscription | FR17, FR19 | A1, A2 | OK |
| CL2 | Scanner QR → tampon automatique | FR9, FR20 | (pas d'ecran specifique) | ABSENT - ecran confirmation tampon |
| CL3 | Voir progression tampons (carte) | FR10 | B1, B2 | REBUILD REQUIS |
| CL4 | Recevoir tampons bienvenue | FR11 | A3 | OK |
| CL5 | Accumuler points fixes par visite | FR13 | B3 | REBUILD REQUIS |
| CL6 | Voir paliers recompenses points | FR14, FR16 | B3 | REBUILD REQUIS |
| CL7 | Echanger points contre recompense | FR15 | C2 | REBUILD REQUIS |
| CL8 | Ajouter carte Apple Wallet | FR23 | A6 | OK |
| CL9 | Ajouter carte Google Wallet | FR24 | A6 | OK |
| CL10 | Recuperer carte (reconnexion) | FR21 | ABSENT | ABSENT - page client reconnexion |
| CL11 | Verification OTP | FR22 | A5 | OK |
| CL12 | Parrainage - lien unique | FR30 | D1 | PARTIEL |
| CL13 | Inscription via lien parrainage | FR31 | (flow A) | N/A |
| CL14 | Demander suppression compte | FR46 | ABSENT | ABSENT |
| CL15 | Consulter historique transactions | - | B4 | A CREER |
| CL16 | Ecran succes recompense (tampons) | - | C1 | REBUILD REQUIS |
| CL17 | Ecran succes points (code ephemere) | - | C2 | REBUILD REQUIS |
| CL18 | Cadeau surprise (du commercant) | - | C3 | REBUILD REQUIS |
| CL19 | Validation commercant (bottom sheet) | - | C4 | ABSENT |
| CL20 | Page connexion/recuperation client | - | ABSENT | ABSENT |

### C. Features MARKETING/ENGAGEMENT (V1 + futures visibles)

| # | Feature | Statut V1 | Page Figma | Statut actuel |
|---|---------|-----------|------------|---------------|
| M1 | Push notifications (broadcast) | V1 ACTIF | I1 | OK |
| M2 | Push notifications (auto - inscription, tampon, recompense) | V1 ACTIF | (automatique) | N/A |
| M3 | Relance clients inactifs (>30j) | FR29 - V1 | I1 ou H1 | ABSENT |
| M4 | SMS marketing | V2 FUTUR | H1 (grayed/locked) | ABSENT |
| M5 | Automation marketing | V2 FUTUR | H1 (grayed/locked) | ABSENT |
| M6 | Campagnes email | V3 FUTUR | H1 (grayed/locked) | ABSENT |
| M7 | Segmentation clients | V2 FUTUR | H1 (grayed/locked) | ABSENT |
| M8 | Templates notifications metier | V1 POSSIBLE | H1 | PARTIEL |
| M9 | Stats engagement | V1 | H1 | PARTIEL |
| ~~M10~~ | ~~Surprises au scan~~ | ~~RETIRE V1~~ | ~~H1~~ | ~~A SUPPRIMER~~ |
| ~~M11~~ | ~~Missions gamifiees~~ | ~~RETIRE V1~~ | ~~H1~~ | ~~A SUPPRIMER~~ |
| ~~M12~~ | ~~Roue de la fortune~~ | ~~RETIRE V1~~ | ~~H1~~ | ~~A SUPPRIMER~~ |

---

## 2. AUDIT PAR PAGE — CE QUI VA, CE QUI NE VA PAS, CE QUI MANQUE

---

### PAGE A — Onboarding Client (6 ecrans mobiles)

**Workflow :** Scan QR → Inscription prenom → Bienvenue+2tampons → Securisation tel → OTP → Wallet

| Ecran | Statut | Problemes | Corrections |
|-------|--------|-----------|-------------|
| A1 Scan QR | A VERIFIER | Utilise-t-il des elements du pack ? | Verifier que le cadre de scan est un composant existant |
| A2 Inscription Prenom | A VERIFIER | Social buttons masques mais presents ? | Nettoyer completement |
| A3 Bienvenue | A VERIFIER | Placeholder illustration prevu ? | Verifier espace reserve |
| A4 Securisation Tel | OK | Existait deja | - |
| A5 OTP | OK | Existait deja | - |
| A6 Wallet | A VERIFIER | Boutons Apple/Google Wallet | Verifier composants pack |

**Features manquantes sur cette page :** Aucune (flow complet)

---

### PAGE B — Carte Fidelite (4 ecrans mobiles) ⚠️ REBUILD COMPLET

**Workflow :** Ecran HOME quotidien du client → Carte tampons OU points → Historique

| Ecran | Statut | Problemes | Corrections |
|-------|--------|-----------|-------------|
| B1 Carte Tampons 7/10 | REBUILD | Aucun element du pack, typo/couleurs/icones incorrectes | Reconstruire avec composants existants |
| B2 Carte Tampons 10/10 | REBUILD | Idem B1 | Idem |
| B3 Carte Points 350/500 | REBUILD | Idem B1 | Barre progression + paliers |
| B4 Historique Transactions | A CREER | N'existe pas encore | Creer avec composants Table/List du pack |

**Features requises sur B1/B2 (ecran HOME client) :**
- Greeting "Bonjour [Prenom]" + nom commerce
- StampCard (grille 5x2, tampons jaunes/vides)
- Compteur "7/10" ou "350/500 pts"
- Message encouragement ("Plus que 3 !")
- Encart recompense prochaine
- Banniere parrainage (visible sur HOME — FR30)
- Section dernieres transactions (historique simplifie)
- Bottom Tab Bar 5 onglets (Carte, Historique, Scanner, Parrainage, Profil)
- Icones DU PACK avec couleurs Izou

**Critical :** Le user insiste — AUCUN element from scratch. Fouiller toutes les pages du template pour trouver les assets les plus proches et les adapter.

---

### PAGE C — Recompense & Succes (4 ecrans mobiles) ⚠️ REBUILD

**Workflow :** Carte complete → Succes (tampons) OU Succes+code (points) OU Cadeau surprise

| Ecran | Statut | Problemes | Corrections |
|-------|--------|-----------|-------------|
| C1 Succes Recompense | REBUILD | CTAs mal places, regles template non appliquees | Fond foret, typo blanche, CTA en bas |
| C2 Succes Points | REBUILD | Space Grotesk apparait alors que typos ne doivent PAS changer | Code ephemere + timer |
| C3 Cadeau Surprise | REBUILD | Memes problemes que C1 | Message personnalise commercant |
| C4 Validation Commercant | A CREER | N'existe pas | Bottom sheet avec Valider/Refuser |

**Features requises :**
- PLACEHOLDER pour illustration en arriere-plan (Lottie Tier 1 ~250px)
- Texte qui s'adapte a l'illustration (descend si illustration presente)
- CTA toujours positionne EN BAS de l'ecran (coherence)
- Fond foret #1E3A2F (pas de fond blanc)
- Titre blanc, prenom jaune
- Code ephemere "[PRENOM]-XXXX" en Space Grotesk (SEUL usage autorise de Space Grotesk)
- Timer "Valide 5 min" pulsant

---

### PAGE D — Parrainage (1 ecran mobile) ⚠️ WORKFLOW INCOMPLET

**Workflow :** Visible depuis B1 (banniere) → Ecran dedie → Partage natif

| Ecran | Statut | Problemes | Corrections |
|-------|--------|-----------|-------------|
| D1 Parrainage | PARTIEL | Page isolee, pas de workflow visible | Integrer dans un flow clair |

**Features requises :**
- Header illustre (placeholder Tier 2 ~180px)
- Code parrainage copiable (pill + icone copie)
- Bouton "Partager" pill noir → selecteur natif OS
- Section "Ils recoivent / Vous recevez" (bonus parrain + filleul)
- Stats parrainage (X filleuls, X bonus recus) — Badges
- Bottom Tab Bar (onglet "Parrainage" actif)
- Connexion workflow : accessible depuis banniere B1 + onglet bottom tab

---

### PAGE E — Dashboard Home (2 ecrans) ⚠️ CORRECTIONS MAJEURES

**Workflow :** Ecran d'accueil quand le commercant se connecte. LE plus important.

| Ecran | Statut | Problemes | Corrections |
|-------|--------|-----------|-------------|
| E1 Desktop | CORRIGER | Icones sidebar non alignees, KPIs insuffisants, noms incorrects | Refaire |
| E2 Mobile | CORRIGER | Icones differentes du desktop, filtres couleur differente, double menu | Aligner sur desktop |

**Problemes specifiques E1 (Desktop) :**
- Les noms Marie Dupont, Thomas Martin, Sophie Leroy = noms de CLIENTS dans le feed d'activite, PAS de commercants. Corriger le contexte : ce sont des clients qui scannent.
- Boulangerie du Marche, Cafe des Arts = NE DOIVENT PAS apparaitre (c'est le dashboard d'UN commercant)
- Icones sidebar non alignees avec le modele de base → recaler

**Problemes specifiques E2 (Mobile) :**
- Icones DIFFERENTES du desktop (incoherent)
- Filtres ont une couleur specifique absente du desktop
- DEUX menus : bottom nav + burger menu en haut → choisir UN ou contenu different
- Bottom nav recommande (UX spec) : Scanner | Clients | Engagement | Reglages | Profil

**KPIs requis (FR34 — 8 metriques minimum) :**

| KPI | Source | Priorite |
|-----|--------|----------|
| Clients total | FR34 | P0 |
| Clients actifs | FR34 | P0 |
| Visites du jour | FR34 | P0 |
| Nouveaux ce mois | FR34 | P0 |
| Taux de retour | FR34 | P0 |
| Frequence moyenne | FR34 | P1 |
| Clients a risque | FR34 | P1 |
| Parrainages realises | FR33 | P1 |

**Elements requis sur E1 :**
- Sidebar sobre (blanc/warm, selection subtile) — 5 items : Tableau de bord, Clients, Engagement, Notifications, Parametres
- Footer sidebar : Mon profil, Se deconnecter
- 4-8 KPI cards en haut (les plus importants)
- Graphique visites/semaine (chart)
- Feed d'activite (timeline des derniers scans/inscriptions)
- Top clients (FR36)
- Insight/alerte proactive ("Vos clients reviennent tous les 3 jours")
- Bouton recherche client (FR37)

---

### PAGE F — Dashboard Clients (3 ecrans)

**Workflow :** Liste clients → Detail client → Actions sur client

| Ecran | Statut | Problemes | Corrections |
|-------|--------|-----------|-------------|
| F1 Liste Desktop | A VERIFIER | Sidebar coherente ? Filtres ? Export CSV ? | Ajouter export CSV, filtres par statut |
| F2 Detail Desktop | A VERIFIER | Actions manuelles presentes ? | Ajouter : offrir recompense, ajouter/retirer tampons, reinitialiser |
| F3 Liste Mobile | A VERIFIER | Coherence avec desktop ? | Verifier |

**Features MANQUANTES sur F2 (Detail Client) :**
- Bouton "Offrir une recompense" (FR - Journey 6, Cadeau surprise)
- Bouton "Ajouter tampon/points" (FR49 — fallback)
- Bouton "Retirer tampon/points" (FR50 — correction)
- Bouton "Reinitialiser carte" (FR51)
- Bouton "Valider recompense" (FR52 — mode points)

---

### PAGE G — Dashboard Parametres (2 ecrans) ⚠️ ENRICHIR SIGNIFICATIVEMENT

**Workflow :** Configuration complete du programme de fidelite

| Ecran | Statut | Problemes | Corrections |
|-------|--------|-----------|-------------|
| G1 Desktop | ENRICHIR | Une seule vue pour les deux modes, color pickers basiques | Deux vues + apercu carte |
| G2 Mobile | ENRICHIR | Idem | Idem layout vertical |

**Structure requise — DEUX VUES DISTINCTES :**

#### Vue 1 : Programme Tampons
- Radio "Tampons" selectionne
- Nombre de tampons requis (input, ex: 10)
- Tampons de bienvenue (input 0-3)
- Recompense (texte libre, ex: "1 boisson offerte")
- Cooldown anti-fraude (select 2h/4h/6h) — FR42

#### Vue 2 : Programme Points
- Radio "Points" selectionne
- Points par visite (input, ex: 10)
- Tableau des paliers avec :
  - Seuil en points (50, 100, 200...)
  - Nom de la recompense
  - Bouton + Ajouter un palier
  - Bouton supprimer par palier

#### Onglets/sections supplementaires :
- **Personnalisation** : Nom commerce, logo (upload), couleurs
  - Color pickers = rectangles ou cercles issus des ASSETS du template (page Colors)
  - Le cercle jaune/noir meme intensite que les autres
  - PLACEHOLDER pour mini-illustrations sur les cartes
  - Apercu carte fidelite LIVE (preview en temps reel)
- **Parrainage** : Bonus parrain (nb tampons/pts), Bonus filleul — FR33
- **QR Code** : Apercu QR + bouton telecharger PDF + lien direct — FR6, FR7
- **Profil** : Email, mot de passe, nom commerce — FR8

---

### PAGE H — Dashboard Engagement (2 ecrans) ⚠️ REFONTE TOTALE

**Workflow :** Outils marketing et d'engagement du commercant

| Ecran | Statut | Problemes | Corrections |
|-------|--------|-----------|-------------|
| H1 Desktop | REFONTE | Contient surprises/missions/roue (retires V1), manque features marketing | Supprimer gamification, ajouter marketing |
| H2 Mobile | REFONTE | Idem | Idem |

**CE QUI DOIT ETRE SUPPRIME (retire V1 par le PRD) :**
- ~~Surprises au scan~~
- ~~Missions gamifiees~~
- ~~Roue de la fortune~~

**CE QUI DOIT APPARAITRE :**

| Section | Statut V1 | Presentation |
|---------|-----------|-------------|
| **Push notifications** | ACTIF V1 | Section complete : composer, envoyer, historique envois |
| **Relance inactifs** | FR29 - V1 | Toggle "Relancer automatiquement apres 30j" + message personnalisable |
| **Templates metier** | V1 POSSIBLE | Presets de messages par type de commerce |
| **SMS marketing** | V2 FUTUR | Section grisee/verrouillee "Bientot disponible" |
| **Automation marketing** | V2 FUTUR | Section grisee "Bientot disponible" — regles automatiques |
| **Campagnes email** | V3 FUTUR | Section grisee "Bientot disponible" |
| **Segmentation clients** | V2 FUTUR | Section grisee — cibler par statut/frequence |
| **Stats engagement** | V1 ACTIF | KPIs : taux ouverture push, parrainages, taux retour post-notif |

**Note user :** "meme si aujourd'hui on ne travaillera pas ces features, il faut qu'elles apparaissent comme des features futures de l'application"

---

### PAGE I — Dashboard Notifications (2 ecrans) — ENRICHIR

**Workflow :** Composer et envoyer des notifications push

| Ecran | Statut | Problemes | Corrections |
|-------|--------|-----------|-------------|
| I1 Desktop | ENRICHIR | Basique, options limitees | Ajouter historique envois, stats ouverture |
| I2 Mobile | ENRICHIR | Non mis a jour | Aligner sur desktop |

**Features actuelles (OK mais insuffisantes) :**
- Formulaire titre + message
- Apercu notification
- Bouton envoi
- Modal confirmation

**Features A AJOUTER :**
- Historique des notifications envoyees (liste avec date, nb destinataires, taux ouverture)
- Choix du segment (tous / actifs / inactifs / a risque) — lie a M7
- Limite visible "5 envois par heure" avec compteur restant
- Templates rapides ("Offre du week-end", "On vous a manque ?")

---

### PAGE J — Login/Register Commercant (2 ecrans) — OK

| Ecran | Statut | Problemes | Corrections |
|-------|--------|-----------|-------------|
| J1 Login | OK | - | Verifier alignement avec template |
| J2 Register | OK | - | Verifier alignement avec template |

---

### PAGE K — Login/Recuperation Client (A CREER) ⚠️ ABSENT

**Workflow :** Client qui a perdu sa session/cookie veut retrouver sa carte

**Ecrans a creer :**
- K1 : Page d'accueil "Retrouver ma carte" — Input telephone + bouton "Continuer"
- K2 : Verification OTP (reutiliser pattern A5)
- K3 : Carte retrouvee — affichage carte + message "Vos X tampons sont intacts !"

**Source :** PRD FR21 "Un client qui re-scanne avec un numero deja connu peut etre reconnecte a sa carte existante" + Parcours 4 Edge Case Scene 2

---

## 3. WORKFLOWS COMPLETS (ce qui manque le plus)

### Workflow Client (mobile) — Flow complet

```
PREMIER CONTACT:
  Scan QR (A1) → Inscription prenom (A2) → Bienvenue+2tampons (A3)
  → Securisation tel (A4) → OTP (A5) → Wallet (A6)

USAGE QUOTIDIEN:
  Scan QR → Confirmation tampon (ecran manquant!) → Carte mise a jour (B1/B3)

CONSULTATION:
  Carte tampons (B1) ou Points (B3) → Historique (B4) → Parrainage (D1)

RECOMPENSE (TAMPONS):
  B2 (10/10) → C1 (Succes) → Code ephemere ou push commercant → Carte reset (B1 a 0/10)

RECOMPENSE (POINTS):
  B3 → Bottom sheet "Utiliser X pts ?" → Push commercant ou Code (C2) → Points deduits

CADEAU SURPRISE:
  Notification push → C3 (Cadeau!) → Validation

PARRAINAGE:
  Banniere B1 → D1 → Partage natif → Filleul scan → Attribution auto

RECONNEXION:
  Scan QR → Systeme reconnait → Telephone (K1) → OTP (K2) → Carte retrouvee (K3)
```

### Workflow Commercant (desktop + mobile) — Flow complet

```
INSCRIPTION:
  J2 (Register) → Selection template metier → Configuration programme (G1) → QR genere (G1/E1)

QUOTIDIEN:
  E1 (Dashboard) → Voir KPIs + feed activite → F1 (Clients) si besoin detail

GESTION CLIENT:
  F1 (Liste) → Recherche/filtre → F2 (Detail) → Actions (offrir, ajouter, retirer, reinitialiser)

ENGAGEMENT:
  H1 → Composer notification / Activer relance auto / Voir stats

NOTIFICATIONS:
  I1 → Composer + envoyer push → Historique envois

PARAMETRES:
  G1 → Programme (tampons/points) / Personnalisation / Parrainage / QR / Profil
```

---

## 4. PROBLEMES TRANSVERSAUX

### 4.1 Coherence mobile/desktop
- **REGLE :** L'app est MOBILE-FIRST. Desktop est secondaire.
- Les icones mobiles DOIVENT etre les memes que desktop
- Les filtres DOIVENT avoir les memes couleurs partout
- Le highlight mobile = changement couleur de l'ICONE, pas fond colore

### 4.2 Navigation mobile
- Bottom nav client : Carte | Historique | Scanner | Parrainage | Profil (5 onglets)
- Bottom nav merchant : Scanner | Clients | Engagement | Reglages | Profil (5 onglets)
- PAS de burger menu en plus du bottom nav (anti-pattern identifie dans UX spec)
- Si les deux menus existent : le burger contient des items DIFFERENTS (aide, QR, liens)

### 4.3 Separation commercant/client
- Nommer les pages clairement : "CLIENT - Carte Fidelite", "MERCHANT - Dashboard"
- Organiser dans Figma : pages client (A-D, K) et pages merchant (E-J) separees
- Pas de confusion possible sur le contexte (qui voit quoi)

### 4.4 Elements du template
- FOUILLER toutes les pages du template Untitled UI pour trouver des assets
- Un element nomme "Payment Card" peut devenir une carte fidelite
- Un element nomme "Transaction List" peut devenir un historique tampons
- NE JAMAIS creer from scratch ce qui existe dans le template
- Proposer de supprimer les pages verrouillees/payantes si ca aide

### 4.5 Variete visuelle
- Utiliser la PALETTE COMPLETE : jaune, foret, corail, lavande (pas juste jaune+noir)
- Les icones doivent porter les couleurs de la palette (pas monochromes grises)
- Alterner fonds warm-50 / blanc pour rythmer les sections

---

## 5. ECRANS MANQUANTS A CREER

| # | Ecran | Type | Page | Priorite |
|---|-------|------|------|----------|
| 1 | Confirmation tampon (scan quotidien) | Client mobile | B (ou pop-up sur B1) | P0 |
| 2 | K1 Retrouver ma carte | Client mobile | K | P0 |
| 3 | K2 OTP recuperation | Client mobile | K | P0 |
| 4 | K3 Carte retrouvee | Client mobile | K | P1 |
| 5 | C4 Validation commercant (bottom sheet) | Client mobile | C | P0 |
| 6 | B4 Historique transactions | Client mobile | B | P1 |
| 7 | Profil client (onglet bottom tab) | Client mobile | Nouveau | P1 |
| 8 | Profil commercant | Merchant desktop+mobile | G ou nouveau | P1 |
| 9 | Selection template metier (onboarding) | Merchant | J (suite) | P1 |
| 10 | Apercu QR a imprimer | Merchant | G | P1 |

---

## 6. PLAN DE REWORK RECOMMANDE

### Phase 1 : Fondations (avant de toucher les ecrans)
1. Scanner TOUTES les pages du template Untitled UI pour inventorier les assets utilisables
2. Mapper chaque besoin (carte, liste, bouton, icone, chart) a un asset existant
3. Identifier les assets manquants (s'il y en a) et le signaler au user

### Phase 2 : Pages critiques (une a la fois, validation user)
1. **B — Carte Fidelite** (rebuild complet — ecran HOME client)
2. **E — Dashboard Home** (corrections majeures — ecran HOME commercant)
3. **C — Recompense & Succes** (rebuild)
4. **G — Parametres** (enrichissement significatif)
5. **H — Engagement** (refonte totale)

### Phase 3 : Pages secondaires
6. **D — Parrainage** (integrer dans workflow)
7. **I — Notifications** (enrichir)
8. **K — Login/Recuperation client** (creer)
9. **F — Clients** (verifier + ajouter actions manquantes)
10. **A — Onboarding** (verifier coherence)

### Phase 4 : Coherence transversale
11. Aligner TOUS les ecrans mobiles sur l'esthetique desktop
12. Verifier la navigation (bottom nav vs sidebar)
13. Nommer et organiser clairement les pages dans Figma
14. Verifier les workflows de bout en bout

---

## 7. QUESTIONS POUR LE USER AVANT DE COMMENCER

1. **Pages verrouillees du template :** Tu veux que je les supprime pour accelerer ? Quelles pages exactement ?
2. **Page Engagement (H) :** Pour les features futures (SMS, automation, email), tu preferes des sections grisees avec "Bientot disponible" ou des toggles desactives ?
3. **Apercu carte (G) :** Tu as des inspirations specifiques pour le configurateur de carte ? Des captures de Shine ou d'autres apps ?
4. **Illustrations :** On garde les placeholders pour l'instant (rectangles annotes) ou tu veux qu'on commence a sourcer des illustrations ?
5. **Ordre de priorite :** Tu valides l'ordre Phase 2 (B → E → C → G → H) ou tu preferes un autre ordre ?
