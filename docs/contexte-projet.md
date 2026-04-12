# Izou (Fidelizy) — Contexte Projet Complet

**Date de mise a jour :** 2026-04-01
**Statut :** Phase Figma haute-fidelite en cours. PRD + UX Spec + Architecture termines.
**Pilote :** Avril 2026

---

## 1. IDENTITE PROJET

**Nom :** Izou (domaine commercial : fidelizy)
**Type :** App de fidelisation client pour commercants de proximite (SaaS B2B2C)
**Cible :** Coffee shops, restaurants rapides, boulangeries — independants 1-5 employes

**Probleme :** Les petits commercants ne fidelisent pas leurs clients. Les cartes papier se perdent, les solutions digitales coutent trop cher (100€+/mois). Le commercant suit son activite "au feeling".

**Solution :** Carte de fidelite digitale via QR code. Le client scanne au comptoir, les tampons s'accumulent dans Apple/Google Wallet. Le commercant voit tout dans un dashboard. Zero intervention du commercant/employe dans le flux principal.

**Ce qui rend Izou special :**
- **Automatisation totale** — le client initie le geste (scan QR), tout le reste est automatique
- **Experience premium accessible** — design soigne, micro-animations, personnalisation aux couleurs du commerce
- **Donnee revelee** — le commercant passe du "au feeling" a des donnees reelles (taux de retour, frequence, clients a risque)

---

## 2. MECANISMES CLES

### QR Intelligent (un seul QR = 3 flux)
Un seul QR code au comptoir gere automatiquement :
1. **Client nouveau** → inscription (prenom + tel + OTP email) → 2 tampons offerts → ajout wallet
2. **Client reconnu** → tampon/points automatique en < 3 secondes
3. **Client qui revient (cookie perdu)** → reconnexion par telephone + OTP

### Deux modes de fidelite
1. **Mode Tampons** — X visites = 1 recompense unique (ex: 10 tampons = 1 boisson offerte). Reset automatique apres recompense.
2. **Mode Points** — Points fixes par visite + paliers de recompenses multiples. Le client choisit quand depenser.

### Anti-fraude
- Cooldown temporel 2-4h entre deux scans (configurable)
- Notification commercant a chaque scan
- Historique consultable

### Validation recompense
- Flow principal : client appuie "Reclamer" → push commercant → validation 1 tap
- Fallback (30s sans reponse) : code ephemere visuel ("CAFE-7829", valide 5 min)

### Parrainage
- Lien unique partageable (Instagram, TikTok, SMS, WhatsApp)
- Attribution au comptoir ("Quelqu'un vous a recommande ?")
- Bonus parrain + filleul automatique

---

## 3. PERSONAS

### Commercant
- **Jeremy (primaire)** — 28-38 ans, independant connecte, decide en < 5 min, veut des resultats en J1
- **Nadia (secondaire, Phase 2)** — 42-55 ans, peu digitale, necessite accompagnement humain

### Client final
- **Yasmine (primaire)** — 18-24 ans, etudiante, generation Instagram/TikTok, wallet = canal naturel
- **Karim (secondaire)** — 25-35 ans, jeune actif, sensible aux bons plans, veut voir ce qu'il economise

### Employe
- **Katia/Fati** — doit etre convaincu autant que le patron. "Si ca prend du temps → abandon immediat"

---

## 4. DESIGN SYSTEM (v3.2)

### Philosophie : "Foret au Soleil"
Inspiration directe : **Shine.fr** (warm minimalism, optimistic & grounded). Aplats de couleur propres, JAMAIS de degrades.

### Palette

| Role | Couleur | Hex | Usage |
|------|---------|-----|-------|
| **Dominant** | Jaune Izou | `#F9D714` | Highlights, badges, recompenses, celebrations, boutons secondaires |
| Jaune clair | | `#FFF8D6` | Fonds accent doux |
| Jaune fonce | | `#D4B40F` | Hover sur jaune |
| **Ancrage** | Noir | `#1E1E1E` | Boutons principaux, nav, CTA, headings |
| **Identite** | Foret | `#1E3A2F` | Sections colorees, fonds premium |
| | Emeraude | `#2A5C46` | Liens, success |
| | Feuille | `#3D7A60` | Hover, bordures actives |
| **Accent chaud** | Corail | `#E8725A` | Notifications, energie |
| | Peche | `#FDDDD6` | Fonds erreur doux |
| **Accent ludique** | Lavande | `#8B7EC8` | Progression, gamification |
| | Lilas | `#E8E4F5` | Fonds accent frais |
| **Fonds** | Lin | `#FAF7F2` | Fond de page principal |
| | Creme | `#F3EDE3` | Fond cartes |
| | Sable | `#E8DFD0` | Bordures, separateurs |

**Regles strictes :**
- JAMAIS de degrades entre couleurs — aplats uniquement
- Duo signature : Noir + Jaune (comme Shine = Vert + Jaune)
- Le jaune ne sert JAMAIS de couleur de texte sur fond clair
- Varier les fonds (warm-50, white, creme) — jamais FAF7F2 partout

### Typographie

| Role | Police | Usage |
|------|--------|-------|
| Display/Headings | **Santoku** (variable font locale) | Titres, hero, identite |
| Body/UI | **Inter** (Google Fonts) | Corps de texte, boutons |
| Tertiaire | **Space Grotesk** | Labels, overlines, codes ephemeres |

### Composants cles
- Boutons **pill** (border-radius 9999px) — signature Shine
- Ombres minimales teintees foret
- Touch targets 44x44px minimum
- Animations spring (Framer Motion) pour les tampons
- Skeleton screens (jamais de spinner, jamais d'ecran blanc)

---

## 5. STACK TECHNIQUE

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Deploiement | Vercel (frontend), Supabase cloud (backend) |
| Wallet | Apple Wallet (APNs) + Google Wallet (JWT) |
| Rate limiting | Upstash Redis |
| Landing page | Framer (independant de l'app) |
| Design system | Untitled UI React (dashboard) + composants custom (app client) |
| Animations | Framer Motion + Lottie (illustrations) |

### Architecture a deux couches visuelles
1. **Dashboard commercant** — Composants Untitled UI React (tables, KPIs, sidebar, forms). Ton professionnel, data, sobre-premium.
2. **App client mobile (PWA)** — Composants custom Izou (carte fidelite, scan, progression, succes, parrainage). Ton chaleureux, vivant, emotionnel.
3. **Tokens partages** — CSS variables `--color-brand-*` (50→950) pour personnalisation par commercant au runtime.

---

## 6. EXIGENCES FONCTIONNELLES (52 FRs)

### Gestion Commerce (FR1-FR8)
- FR1: Creer compte email+mdp
- FR2: Configurer via template metier (Cafe, Restaurant, Boulangerie, Snack)
- FR3: Personnaliser apparence (couleurs, nom)
- FR4: Choisir mode tampons/points
- FR5: Configurer parametres (nb tampons, recompense, points/visite, tampons bienvenue)
- FR6: Generer/imprimer QR code
- FR7: Obtenir lien inscription direct
- FR8: Modifier profil

### Programme Tampons (FR9-FR12)
- FR9: Accumuler tampons via scan QR
- FR10: Voir progression visuelle
- FR11: Tampons de bienvenue (0-3 configurables)
- FR12: Reinitialisation auto a la recompense

### Programme Points (FR13-FR16)
- FR13: Points fixes par visite
- FR14: Paliers de recompenses
- FR15: Echanger points contre recompense
- FR16: Voir points + paliers disponibles

### QR Intelligent (FR17-FR22)
- FR17: Scanner QR comptoir
- FR18: Detection auto nouveau/existant → routage
- FR19: Inscription < 30s
- FR20: Tampon auto client reconnu
- FR21: Reconnexion carte existante (pas de doublon)
- FR22: Verification OTP email

### Wallet & Notifications (FR23-FR29)
- FR23: Apple Wallet
- FR24: Google Wallet
- FR25: Mise a jour wallet temps reel
- FR26: Push via wallet (tampon, recompense, parrainage)
- FR27: Push via PWA
- FR28: Broadcast commercant
- FR29: Notification auto clients inactifs (>30j)

### Parrainage (FR30-FR33)
- FR30: Lien unique partageable
- FR31: Inscription via lien parrainage
- FR32: Bonus auto parrain + filleul
- FR33: Configurer bonus parrainage

### Dashboard (FR34-FR41)
- FR34: KPIs temps reel (clients total, visites/jour, nouveaux/mois, taux retour, frequence, clients a risque, perdus)
- FR35: Historique visites 7j
- FR36: Top meilleurs clients
- FR37: Recherche client (nom/telephone)
- FR38: Detail client (carte, stats, historique)
- FR39: Filtrer par statut (actifs, a risque, inactifs, perdus)
- FR40: Export CSV
- FR41: Notification a chaque scan

### Anti-fraude (FR42-FR45)
- FR42: Cooldown configurable 2-4h
- FR43: Parrainage unique par commerce
- FR44: Rate limiting routes sensibles
- FR45: Isolation donnees (RLS)

### RGPD (FR46-FR48)
- FR46: Suppression compte + donnees
- FR47: Consentement explicite inscription
- FR48: Export donnees personnelles

### Administration (FR49-FR52)
- FR49: Ajout manuel tampons/points (fallback)
- FR50: Retrait tampons/points (correction)
- FR51: Reinitialisation carte
- FR52: Validation manuelle echange recompense

---

## 7. ECRANS & WORKFLOWS FIGMA

### Vue d'ensemble (28 ecrans, 10 workflows)

| # | Workflow | Ecrans | Plateforme |
|---|---------|--------|-----------|
| A | Onboarding Client (1er scan) | 6 ecrans | Mobile 375x812 |
| B | Carte Fidelite (quotidien) | 4 ecrans | Mobile 375x812 |
| C | Recompense & Succes | 4 ecrans | Mobile 375x812 |
| D | Parrainage | 1 ecran (+share natif) | Mobile 375x812 |
| E | Dashboard Home | 2 ecrans | Desktop 1440x900 + Mobile |
| F | Dashboard Clients | 3 ecrans | Desktop 1440x900 + Mobile |
| G | Parametres Programme | 2 ecrans | Desktop 1440x900 + Mobile |
| H | Engagement & Marketing | 2 ecrans | Desktop 1440x900 + Mobile |
| I | Notifications | 2 ecrans | Desktop 1440x900 + Mobile |
| J | Login/Register Commercant | 2 ecrans | Responsive 1440x900 |

### Detail des ecrans

**A. Onboarding Client (mobile)**
- A1: Scan QR (camera plein ecran)
- A2: Inscription prenom (1 champ, auto-focus)
- A3: Bienvenue + 2 tampons (celebration)
- A4: Securisation telephone (+33)
- A5: Verification OTP (6 inputs)
- A6: Ajout Wallet (Apple/Google/Plus tard)

**B. Carte Fidelite (mobile)**
- B1: Carte tampons 7/10 (ecran HOME client quotidien)
- B2: Carte tampons 10/10 (recompense debloguee, CTA "Reclamer")
- B3: Carte points 350/500 (variante points, badge "Habitue", historique +10pts)
- B4: Historique complet (liste chronologique, filtres, bottom tab bar)

**C. Recompense & Succes (mobile)**
- C1: Ecran succes tampons (fond foret plein ecran, confetti, code ephemere)
- C2: Ecran succes points (choix palier, validation)
- C3: Cadeau surprise du commercant
- C4: Validation commercant (bottom sheet push)

**D. Parrainage (mobile)**
- D1: Page parrainage (lien, partage natif, historique parrainages)

**E. Dashboard Home**
- E1: Desktop — sidebar + 7 KPIs + donut statuts clients + line chart 7 jours + feed activite
- E2: Mobile — KPIs data-only + bottom nav

**F. Dashboard Clients**
- F1: Desktop — liste clients, recherche, filtres, statuts colores
- F2: Desktop — fiche client detail (carte, stats, historique, actions manuelles)
- F3: Mobile — liste clients adaptee

**G. Parametres**
- G1: Desktop — Programme/Apparence/QR/Parrainage
- G2: Mobile

**H. Engagement & Marketing**
- H1: Push Notifications actif + SMS/Automatisations/Segmentation (coming soon)
- H2: Mobile

**I. Notifications**
- I1: Desktop — alertes + toggles Email/Push/SMS
- I1b: Nouvelle push — formulaire Titre/Message/Apercu/Audience/Programmation
- I2: Mobile

**J. Login/Register**
- J1: Login mobile + desktop split
- J2: Register mobile + desktop split
- J3: Onboarding metier (choix template + configuration)

---

## 8. AVANCEMENT FIGMA V3 (au 01/04/2026)

**Fichier Figma :** PVqIzNHJH5AH3aujECItxR (Untitled UI Free)

### Termine ✅
| Workflow | Ecrans | Details |
|----------|--------|---------|
| J. Login & Onboarding | J1, J2, J3 | Login/Register mobile + desktop split, onboarding metier |
| E. Dashboard Home | E1, E2 | Desktop new nav (7 KPIs, donut, line chart), mobile |
| F. Dashboard Clients | F1, F2, F3 | Liste clients, fiche detail, mobile |
| G. Parametres | G1, G2 | Desktop new nav, mobile |
| H. Engagement | H1-H4, H2 mobile | Push, SMS/Auto/Segment (coming soon), mobile |
| I. Notifications | I1, I1b, I2 | Desktop refonte + nouvelle push + mobile |
| A. Onboarding Client | A1-A6 | Scan, inscription, bienvenue, tel, OTP, wallet |
| B. Carte Fidelite | B1-B4 | 7/10, 10/10, points 350/500, historique |

### En attente ❌
| Workflow | Ecrans | Priorite |
|----------|--------|----------|
| C. Recompense & Succes | C1-C4 | P2 |
| D. Parrainage | D1 | P2 |
| K. Recuperation compte | K1 | P3 |

### Prochaine session — Refonte Navigation
Architecture 4 entrees (au lieu de 5) :
1. **Dashboard** — Overview + Insights
2. **Clients** — Overview + Fiche detail
3. **Marketing** — Push + SMS (futur) + Automatisation + Parrainage
4. **Parametres** (fusionne avec Profil) — Infos perso, Entreprise, Programme fidelite (avec paliers), Securite, Plan, Notifications

### Bugs connus
- J3 : emojis invisibles dans radio cards
- Bottom nav mobile : emojis au lieu d'icones Untitled UI
- FR47 consentement absent sur A2

---

## 9. INTERVIEWS TERRAIN (9 commercants, mars 2026)

### Interviews originales (dans le PRD)
1. **My Tea Coffee (Katia, 21 ans)** — Carte papier, 1.99-25€/mois, "design hyper important", "au feeling"
2. **Rest. Peppers** — 70% habitues, avaient des cartes puis arrete
3. **Corner Coffee (Fati, employee)** — 30€/mois, "c'est super bien c'est ma pole !", "grosse accessibilite"

### Nouvelles interviews (30-31 mars 2026)
4. **Bagelstein (employee)** — Tablette self-service, client fait TOUT seul, confiance anti-fraude, QR pas vu ("les gens regardent le menu"), ~40 tickets/jour
5. **Cookie World (Lina, gerante)** — Carte papier 2 ans, clients perdent les cartes, "les gens ne veulent pas donner leur numero", veut MARKETING (SMS, automation, segmentation, "de vraies pages"), 20-30€/mois, veut une demo
6. **Smash Paris** — Questions NFC/scanner fiabilite
7. **Fleonard/The New Me** — Programme fidelite existant, questions activation
8. **Alicia Boulangerie** — Beaucoup d'etudiants 18-30 ans, questions equipement
9. **CBD Etc** — ROI must be demonstrable, deductibilite impots

### Insights cles consolides
- **Marketing = besoin #1 non-adresse** (Cookie World veut de vraies campagnes)
- **Rapidite/simplicite = critere #1** (la carte papier est le benchmark)
- **Resistance a donner numero/email** → inscription ultra-fluide obligatoire
- **QR pas visible** → signaletique + incitation (2 tampons offerts) crucial
- **ROI doit etre demontrable** pour convaincre
- **Pricing 20-30€/mois** confirme par 3 sources
- **La demo est l'argument de vente** — le produit doit etre sa propre demo

---

## 10. DECISIONS CLES & CONTRAINTES

### Scope V1 (verroille)
- **Retire :** Roue de la fortune, missions gamifiees, surprises au scan, goal gradient
- **Conserve :** Tampons/points + parrainage + wallet + dashboard + templates metier
- **A ajouter :** Google Wallet, tests auto, fix bugs, suppression compte RGPD, DA claire

### Phasage
- **Phase 1 (avril 2026)** — V1 consolidee, pilote avec premier commercant
- **Phase 2 (post-validation)** — Marketing (SMS, automation), NFC, personnalisation avancee, gamification simplifiee
- **Phase 3 (expansion)** — Menu integre QR, integration caisse, multi-points de vente, CRM

### Contraintes dev
- **Solo dev + outils IA** — chaque choix doit maximiser la simplicite
- **Recommander le moins cher viable en premier** (Framer pour landing, Supabase gratuit, Untitled UI free)
- **Figma obligatoire avant dev** — jamais sauter les maquettes
- **Mobile-first** — mobile parfait avant desktop

### Workflow de design Figma
- **1 page a la fois** — verifier, valider, puis suivante
- **Cloner des pages entieres** depuis le template Untitled UI — jamais from scratch
- **Claude prepare, le user designe** — pas de decisions de design autonomes
- **Screenshot de verification** apres chaque modification
- **Cacher les elements inutiles** (visible = false), ne pas supprimer

---

## 11. NAVIGATION APP

### Client mobile — Bottom Tab Bar (5 onglets)
Carte | Historique | Scanner | Parrainage | Profil

### Dashboard commercant
**Desktop :** Sidebar fixe gauche (fond blanc, style Shine). Item actif = fond warm-50 + texte noir + bordure gauche 3px foret.
**Mobile :** Bottom nav simplifiee.

**4 entrees principales :**
1. Dashboard — Overview + Insights
2. Clients — Overview + Fiche detail
3. Marketing — Push + SMS + Automatisation + Parrainage
4. Parametres — Infos perso, Entreprise, Programme, Securite, Plan, Notifications

---

## 12. METRIQUES DE SUCCES

| Metrique | Cible 3 mois | Cible 12 mois |
|----------|-------------|---------------|
| Commercants actifs | 5 | 20-30 |
| Clients/commercant | > 30 | > 100 |
| Retention commercant | > 80% | > 70% |
| Ajout wallet | > 50% | > 60% |
| Completion carte | > 25% | > 30% |
| Conversion freemium→payant | Tests | > 20% |

| Interaction | Cible |
|-------------|-------|
| Premier scan → inscription | < 20 secondes |
| Scan quotidien → tampon | < 3 secondes |
| Completion inscription | > 70% |
| Taux parrainage | > 15% |

---

## 13. PERFORMANCE & NFRs

- LCP < 2s sur 4G mobile
- API < 500ms
- Wallet update < 3s
- Animations 60fps
- Disponibilite > 99.5%
- Zero bug P0 en production
- WCAG 2.1 AA (contraste, touch targets, focus visible, screen reader)
