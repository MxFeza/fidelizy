# Izou — Cahier des Ecrans & Composants

Fichier de travail Figma : `PVqIzNHJH5AH3aujECItxR` (Untitled UI)
Les pages Izou seront creees dans ce fichier pour avoir acces direct aux composants.

---

## VUE D'ENSEMBLE

| # | Workflow | Ecrans | Plateforme |
|---|---------|--------|-----------|
| A | Onboarding Client (1er scan) | 6 ecrans | Mobile 375x812 |
| B | Carte Fidelite (usage quotidien) | 4 ecrans | Mobile 375x812 |
| C | Recompense & Succes | 4 ecrans | Mobile 375x812 |
| D | Parrainage | 1 ecran (+share natif) | Mobile 375x812 |
| E | Dashboard Commercant — Home | 2 ecrans | Desktop 1440x900 + Mobile |
| F | Dashboard Commercant — Clients | 3 ecrans | Desktop 1440x900 + Mobile |
| G | Dashboard Commercant — Parametres | 2 ecrans | Desktop 1440x900 + Mobile |
| H | Dashboard Commercant — Engagement | 2 ecrans | Desktop 1440x900 + Mobile |
| I | Dashboard Commercant — Notifications | 2 ecrans | Desktop 1440x900 + Mobile |
| J | Login / Register Commercant | 2 ecrans | Responsive 1440x900 |
| **Total** | **10 workflows** | **28 ecrans** | |

---

## A. ONBOARDING CLIENT (1er scan) — 6 ecrans

### A1. Scan QR
- Camera plein ecran, cadre de scan centre
- **Composants Untitled UI :** Aucun (ecran custom camera)
- **A creer :** Frame noir 375x812, rectangle arrondi central (cadre scan), texte instruction, bouton retour icone
- **Illustration/Photo :** Aucun

### A2. Inscription — Prenom
- Ecran minimaliste, 1 seul champ, auto-focus
- **Composants Untitled UI :**
  - `Input field` (id: 1090:57817) — variante Default/Placeholder
  - `Buttons/Button` (id: 1038:34411) — CTA "Continuer" (Primary, lg)
- **A creer :** Header question "Comment vous appelez-vous ?"
- **Illustration/Photo :** Aucun

### A3. Bienvenue + 2 Tampons
- Celebration, carte creee, 2 tampons offerts
- **Composants Untitled UI :**
  - `Buttons/Button` — "Continuer"
  - `Badge` (id: 1046:3819) — "+2 tampons offerts"
- **A creer :** Titre bienvenue, representation StampCard 2/10
- **ILLUSTRATION TIER 2 :** Scene accueil (porte ouverte, lumiere, plante) — position haut ecran ~200px

### A4. Securisation — Telephone
- Saisie numero +33
- **Composants Untitled UI :**
  - `Input field` (id: 1090:57817) — avec prefix telephone
  - `Buttons/Button` — CTA "Continuer"
- **Illustration/Photo :** Aucun

### A5. Verification OTP
- 6 inputs mono-caractere
- **Composants Untitled UI :**
  - `Verification code input field` (id: 1106:66757) — composant ideal 6 champs
  - `Buttons/Button` — CTA "Verifier"
- **A creer :** Lien "Renvoyer le code", email masque
- **Illustration/Photo :** Aucun

### A6. Wallet (Apple/Google)
- 3 choix : Apple Wallet / Google Wallet / Plus tard
- **Composants Untitled UI :**
  - `Mobile app store badge` (id: 1303:2162) — Apple + Google variants
  - `Buttons/Button` — "Plus tard" (variante Link)
- **ILLUSTRATION TIER 2 :** Smartphone + carte qui glisse — position centre ~180px

---

## B. CARTE FIDELITE (quotidien) — 4 ecrans

### B1. Carte Tampons — 7/10 (ecran HOME)
- L'ecran principal du client au quotidien
- **Composants Untitled UI :**
  - `Avatar` (id: 19:1012) — photo/logo commerce
  - `Badge` (id: 1046:3819) — compteur "7/10", statuts
  - `Progress bar` (id: 1085:57382) — optionnel sous la carte
- **A creer (CUSTOM) :**
  - **StampCard** — Grille 5x2 (7 remplis jaune, 3 vides dashed)
  - Greeting "Bonjour [Prenom]"
  - Message encouragement "Plus que 3 !"
  - Encart recompense
  - Banniere parrainage
  - Lignes historique transactions
  - **BottomTabBar** 5 onglets
- **PHOTO placeholder :** Avatar commerce (placeholder gris rond)

### B2. Carte Tampons — 10/10 (complet)
- Identique B1 mais tous tampons remplis, CTA "Recuperer ma recompense"
- Memes composants que B1

### B3. Carte Points — 350/500 pts
- Variante a points
- **Composants Untitled UI :**
  - `Progress bar` (id: 1085:57382) — barre de progression
  - `Badge` (id: 1046:3819) — paliers
  - `Avatar` (id: 19:1012)
- **A creer (CUSTOM) :**
  - **PointsProgressBar** avec marqueurs paliers
  - Gros chiffre "350 points"
  - **RewardCatalog** cards horizontales scrollables
  - BottomTabBar

### B4. Historique Transactions
- Liste complete
- **Composants Untitled UI :**
  - `Badge` (id: 1046:3819) — type transaction
  - `Pagination` (id: 1115:68622)
  - `Input field` (id: 1090:57817) — recherche
- BottomTabBar

---

## C. RECOMPENSE & SUCCES — 4 ecrans

### C1. Succes Recompense (Tampons)
- Plein ecran celebratoire, fond foret #1E3A2F
- **Composants Untitled UI :**
  - `Buttons/Button` — CTA large
- **A creer :** Titre blanc, prenom jaune, sous-titre, encart recompense fond #FFF8D6
- **ILLUSTRATION TIER 1 (Lottie) :** Formes festives (etoiles, cercles organiques) ambre+corail+lavande — ~250px centre superieur

### C2. Succes Points (code ephemere)
- Variante avec code a presenter au commercant
- **Composants Untitled UI :**
  - `Buttons/Button` — CTA
  - `Badge` — timer "Valide 5 min"
- **A creer :** Code "[PRENOM]-XXXX" Space Grotesk, timer pulsant, fond foret
- **ILLUSTRATION TIER 1 (Lottie) :** Variante de C1

### C3. Cadeau Surprise
- Le commercant offre une recompense spontanee
- **Composants Untitled UI :**
  - `Buttons/Button` — CTA
- **A creer :** Titre "Cadeau !", message personnalise, fond foret
- **ILLUSTRATION TIER 1 (Lottie) :** Boite cadeau qui s'ouvre — ~250px

### C4. Validation Commercant (bottom sheet)
- Le commercant valide/refuse la recompense
- **Composants Untitled UI :**
  - `Modal` (id: 933:39265) — variante bottom sheet
  - `Buttons/Button` — "Valider" (primary) + "Refuser" (destructive)
  - `Avatar` (id: 19:1012) — photo client
- **PHOTO placeholder :** Avatar client

---

## D. PARRAINAGE — 1 ecran

### D1. Ecran Parrainage
- Code copiable + bouton partage
- **Composants Untitled UI :**
  - `Input field` (id: 1090:57817) — champ code lecture seule + icone copie
  - `Buttons/Button` — "Partager" (primary)
  - `Badge` (id: 1046:3819) — stats (X filleuls, X bonus recus)
- **A creer :** Section "Ils recoivent" / "Vous recevez", BottomTabBar
- **ILLUSTRATION TIER 2 :** Deux silhouettes connectees — position header ~180px

*Note : D2 "Partage Natif" = share sheet OS, pas d'ecran a designer.*

---

## E. DASHBOARD HOME — 2 ecrans

### E1. Dashboard Desktop (1440x900)
- **Base :** Clone du `Dashboard Desktop` Untitled UI (id: 1716:461435) — DEJA CLONE
- **Composants Untitled UI dans le clone :**
  - Sidebar navigation (icones)
  - `Line and bar chart` (id: 1062:46989)
  - `Table` complet (id: 1227:110587) + cells + headers
  - `Avatar label group` (id: 82:2793)
  - `Checkbox` (id: 1097:63652)
  - `Badge` (id: 1046:3819)
  - `Buttons/Button` — header actions
  - `Input field` — recherche
  - `Dropdown` (id: 1050:146925) — filtres
  - `Pagination` (id: 1115:68622)
- **Composants supplementaires a placer :**
  - `Pie chart` (id: 1079:51184) ou `Activity gauge` (id: 1078:155) — repartition clients
- **A creer (CUSTOM) :**
  - 4 KPICards : "Clients actifs" | "Visites semaine" | "Recompenses" | "Taux retour"
- **PHOTO placeholder :** Avatar commercant sidebar footer

### E2. Dashboard Mobile (375x812)
- Version mobile, bottom nav, KPIs empiles 2x2
- **Composants Untitled UI :**
  - Memes composants qu'E1 mais layout vertical
  - Cards au lieu de table
- **A creer :** Bottom navigation 4 items, KPICards empiles

---

## F. DASHBOARD CLIENTS — 3 ecrans

### F1. Liste Clients Desktop (1440x900)
- **Composants Untitled UI :**
  - Sidebar (meme que E1)
  - `Table` complet (id: 1227:110587)
  - `Table header` (id: 1221:106788) + `Table header cell` (id: 1221:107933)
  - `Table cell` (id: 1222:107305) — multiples variantes
  - `Avatar label group` (id: 82:2793)
  - `Badge` (id: 1046:3819) — Actif/Inactif/VIP
  - `Checkbox` (id: 1097:63652)
  - `Pagination` (id: 1115:68622)
  - `Input field` — recherche
  - `Dropdown` — filtres
- **Colonnes :** Checkbox | Avatar+Nom | Tampons/Points | Derniere visite | Statut | Actions (edit/delete)

### F2. Fiche Client Detail Desktop (1440x900)
- **Composants Untitled UI :**
  - Sidebar
  - `Avatar` (id: 19:1012) — grand
  - `Badge` — statut
  - `Input field` (lecture seule) — infos
  - `Buttons/Button` — "Offrir une recompense" + "Retour"
  - `Buttons/Button destructive` (id: 7699:116817) — pour action cadeau (corail)
- **A creer :** StampCard lecture seule, historique transactions
- **PHOTO placeholder :** Grand avatar client

### F3. Liste Clients Mobile (375x812)
- Cards empilees au lieu de table
- **Composants Untitled UI :**
  - `Input field` — recherche
  - `Avatar` — dans chaque card
  - `Badge` — statut
- **A creer :** ClientCard (avatar + nom + tampons + derniere visite + badge), bottom nav

---

## G. DASHBOARD PARAMETRES — 2 ecrans

### G1. Parametres Programme Desktop (1440x900)
- **Base :** Clone du `Settings Desktop` Untitled UI (id: 1672:457278) — DEJA CLONE
- **Composants Untitled UI dans le clone :**
  - Sidebar with labels
  - `Input field` (id: 1090:57817) — multiples champs
  - `Select` (id: 1096:8566)
  - `Textarea input field` (id: 1238:278)
  - `Avatar profile photo` (id: 1217:108477) — upload logo
  - `Buttons/Button` — "Enregistrer" + "Annuler"
- **Composants supplementaires a placer :**
  - `Radio group` (id: 1142:87213) — choix Tampons / Points
  - `Toggle` (id: 1102:4208) — activer notifications
- **A creer (CUSTOM) :**
  - Swatches couleur selectionnables
  - Apercu carte fidelite live
- **PHOTO placeholder :** Upload logo commerce

### G2. Parametres Programme Mobile (375x812)
- Meme contenu, layout vertical
- Memes composants empiles + bottom navigation

---

## H. DASHBOARD ENGAGEMENT — 2 ecrans

Route code : `/dashboard/engagement` (engagement/page.tsx)

### H1. Engagement Desktop (1440x900)
- **Base :** Clone du `Settings Desktop` Untitled UI (meme structure que G1)
- **Sidebar :** Sidebar corrigee (5 items), "Engagement" actif
- **Titre page :** "Engagement" + sous-titre "Augmentez l'engagement et la fidelite de vos clients"
- **Sections (scrollables, cards blanches arrondies) :**

  **Section 1 — Templates metier**
  - 3 cards preset : ☕ Cafe, 🍽️ Restaurant, 🥐 Boulangerie
  - Chaque card : emoji + nom + CTA "Appliquer"
  - Composants Untitled UI : `Buttons/Button`, cards avec border gray-100

  **Section 2 — Surprises au scan**
  - Toggle "Activer les surprises" (composant `Toggle`)
  - Si actif : slider probabilite (10-30%), input bonus (nombre)
  - Composants : `Toggle` (id: 1102:4208), `Input field` (id: 1090:57817)

  **Section 3 — Roue de la fortune** (visible si mode Points)
  - Toggle "Activer la roue"
  - Si actif : input cout par tour, table segments (emoji, nom, chance %, type, valeur)
  - Max 8 segments, bouton "+ Ajouter un segment"
  - Composants : `Toggle`, `Input field`, `Select` (id: 1096:8566), `Buttons/Button`

  **Section 4 — Missions**
  - 4 missions avec toggle chacune :
    1. Avis Google — "Le client soumet un lien, vous validez"
    2. Parrainage — "Code unique par client, bonus mutuel"
    3. Profil complet — "Email + date anniversaire renseignes"
    4. Visites mensuelles — "Comptees automatiquement via la PWA"
  - Chaque mission : titre + description + toggle + inputs recompense
  - Composants : `Toggle`, `Input field`

  **Section 5 — Statistiques engagement**
  - 4 KPIs en grille 2x2 : 🎁 Surprises, 🎡 Tours de roue, 🎯 Missions, 🤝 Parrainages
  - Composants : cards colorees (amber-50, purple-50, green-50, blue-50)

- **Bouton principal :** "Sauvegarder l'engagement" (primary)

### H2. Engagement Mobile (375x812)
- Meme contenu, layout vertical empile
- Bottom nav merchant (5 items, "Engagement" actif)

---

## I. DASHBOARD NOTIFICATIONS — 2 ecrans

Route code : `/dashboard/notifications` (notifications/page.tsx)

### I1. Notifications Desktop (1440x900)
- **Base :** Clone du `Settings Desktop` ou structure simple sidebar + zone centrale
- **Sidebar :** Sidebar corrigee, "Notifications" actif
- **Titre page :** "Envoyer une notification" + badge "{N} clients abonnes"
- **Zone principale (max-w-lg centree) :**

  **Formulaire compose :**
  - Input titre : label "Titre", placeholder "Ex: Offre speciale du week-end", compteur 0/50
  - Textarea message : label "Message", placeholder "Ex: -20% sur tous les menus ce samedi !", compteur 0/100, 3 lignes
  - Composants Untitled UI : `Input field` (id: 1090:57817), `Textarea input field` (id: 1238:278)

  **Apercu notification :**
  - Card grise avec icone cloche + titre + message en temps reel
  - Composant : card bg-gray-50, icone Bell

  **Bouton envoi :**
  - "Envoyer a tous mes clients" (primary, full width)
  - Composant : `Buttons/Button` (id: 1038:34411)

  **Note :** "Limite : 5 envois par heure" (text-xs gray)

  **Modal confirmation :**
  - "Confirmer l'envoi" + "Vous allez notifier {N} clients. Confirmer ?"
  - 2 boutons : "Annuler" (secondary) + "Confirmer" (primary)
  - Composant : `Modal` (id: 933:39265)

### I2. Notifications Mobile (375x812)
- Meme contenu, layout vertical
- Bottom nav merchant (5 items, pas d'item actif specifique ou icone cloche)

---

## J. LOGIN / REGISTER COMMERCANT — 2 ecrans

Routes code : `/dashboard/login`, `/dashboard/register`

### J1. Login Commercant (responsive 1440x900)
- **Base :** Clone d'une page Sign In / Login du template Untitled UI
- **Layout :** Centre de l'ecran, fond gradient leger (indigo-50 → blanc)
- **Contenu :**
  - Logo Izou (carre indigo-600 arrondi avec icone checkmark)
  - Titre : "Connexion"
  - Sous-titre : "Accedez a votre espace commercant"
  - Input email : placeholder "vous@exemple.com"
  - Input mot de passe
  - Bouton "Se connecter" (primary, full width)
  - Lien : "Pas encore de compte ? S'inscrire" → /dashboard/register
- **Composants Untitled UI :** `Input field` (id: 1090:57817), `Buttons/Button` (id: 1038:34411)

### J2. Register Commercant (responsive 1440x900)
- **Base :** Clone d'une page Sign Up du template Untitled UI
- **Layout :** Identique a J1
- **Contenu :**
  - Logo Izou
  - Titre : "Creer mon compte"
  - Sous-titre : "Lancez votre programme de fidelite"
  - Input nom du commerce : placeholder "Ex: Boulangerie Dupont"
  - Input email : placeholder "vous@exemple.com"
  - Input mot de passe : placeholder "Minimum 6 caracteres"
  - Bouton "Creer mon compte" (primary, full width)
  - Lien : "Deja un compte ? Se connecter" → /dashboard/login
- **Composants Untitled UI :** `Input field`, `Buttons/Button`

---

## COMPOSANTS CUSTOM A CREER

| Composant | Ecrans | Description |
|-----------|--------|-------------|
| **StampCard** | B1, B2, A3, F2 | Grille 5x2 cercles, jaune remplis / dashed vides, variants 0-10/10 |
| **PointsProgressBar** | B3 | Barre horizontale + marqueurs paliers (cadenas/etoile) |
| **BottomTabBar** | B1-B4, D1 | 5 onglets : Carte, Historique, Scanner, Parrainage, Profil |
| **BottomNavDashboard** | E2, F3, G2, H2, I2 | 5 onglets : Scanner, Clients, Engagement, Reglages, Profil |
| **KPICard** | E1, E2 | Chiffre + label + accent + sparkline optionnel |
| **RewardCatalog** | B3 | Cards horizontales scrollables (emoji + nom + cout + statut) |
| **EphemeralCode** | C2 | Code Space Grotesk large + timer pulsant |
| **ColorSwatches** | G1 | Cercles couleur selectionnables |
| **ClientCard** | F3 | Card mobile (avatar + nom + tampons + visite + badge) |

---

## RECAPITULATIF ILLUSTRATIONS & PHOTOS

### TIER 1 — Lottie Animated (a generer avec AI puis vectoriser)
| Ecran | Sujet | Position | Budget |
|-------|-------|----------|--------|
| C1 Succes Recompense | Formes festives : etoiles, cercles, formes organiques en ambre+corail+lavande sur fond foret | Centre superieur ~250px | 10-50 KB |
| C2 Succes Points | Variante C1 | Centre superieur ~250px | 10-50 KB |
| C3 Cadeau Surprise | Boite cadeau qui s'ouvre avec lumiere ambre | Centre superieur ~250px | 10-50 KB |

### TIER 2 — SVG Animated CSS (a generer)
| Ecran | Sujet | Position |
|-------|-------|----------|
| A3 Bienvenue | Porte ouverte, lumiere, plante, accueil chaleureux | Haut ecran ~200px |
| A6 Wallet | Smartphone + carte qui glisse dedans | Centre ~180px |
| D1 Parrainage | Deux silhouettes connectees, formes liees | Header ~180px |

### TIER 3 — SVG Static (a generer)
| Usage | Sujet |
|-------|-------|
| Empty state "aucun client" | Plante qui pousse + texte encourageant |
| Empty state "aucune transaction" | Tasse souriante + "Les 1eres visites arrivent" |
| Empty state "aucun filleul" | Mains tendues + "Partagez votre programme" |
| Erreur reseau | Nuage deconnecte |

### Photos/Avatars (placeholders gris a remplacer)
| Ecran | Element |
|-------|---------|
| B1 Carte Client | Logo/photo commerce (avatar rond) |
| E1 Dashboard sidebar | Photo profil commercant |
| F1 Table clients | Photos profils clients (multiples) |
| F2 Fiche client | Grand avatar client |
| G1 Parametres | Upload zone logo commerce |

---

## PROMPT GENERATION ILLUSTRATIONS (pour Midjourney/DALL-E)

```
Flat illustration, soft organic rounded shapes, warm palette:
amber (#F9D714), coral (#E8725A), lavender (#8B7EC8), forest green (#2A5C46).
Gentle strokes, no thick black outlines.
Simplified silhouette characters (no detailed faces).
Everyday commerce elements: cups, plants, storefronts, QR codes, phones.
Soft light shadows. Modern, warm, premium accessible style.
White or cream background. No gradients.
```
