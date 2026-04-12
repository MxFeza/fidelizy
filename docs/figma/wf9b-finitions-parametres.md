Continue la refonte Figma Izou V3. Fichier : PVqIzNHJH5AH3aujECItxR. Plan : C:\Users\UX8402\.claude\plans\floofy-wandering-bird.md.

WORKFLOW 9B — Finitions Paramètres + Enrichissement

Contexte : Le WF9 navigation est terminé (sidebar desktop, bottom nav mobile, bell header, renommages). Les 6 sous-pages Paramètres existent en desktop + mobile mais nécessitent des finitions et enrichissements.

## État actuel des écrans

### Desktop (page Figma : 🖥️ COMMERÇANT — G. Paramètres Programme)
- **G1 — Programme fidélité** (10057:1008) : ✅ existant, sub-nav 6 items OK
- **G1a — Infos personnelles** (10230:586) : ✅ bandeau profil + formulaire (Prénom, Nom, Email, Photo)
- **G1b — Mon entreprise** (10241:586) : ⚠️ bandeau + formulaire TROP COURT — manque horaires, map, Google My Business, description, couleur
- **G1d — Sécurité** (10241:733) : ✅ formulaire simple (Email, Nouveau mdp, Confirmer mdp)
- **G1e — Plan** (10241:980) : ✅ formulaire simple (Plan actuel, Email facturation, Renouvellement)
- **G1f — Notifications** (10241:1227) : ✅ formulaire simple (Email, Push, SMS)
- **H1c — Programme de parrainage** (10192:717) : ✅ dans page Marketing

### Mobile (même page Figma)
- **G1a Mobile** (10257:586) : ✅ bandeau profil + formulaire + bottom nav
- **G1b Mobile** (10257:671) : ⚠️ même problème que desktop — trop court
- **G1d Mobile** (10257:756) : ⚠️ "Team members" en bold pas traduit → doit dire "Sécurité"
- **G1e Mobile** (10257:878) : ⚠️ "Team members" → "Mon plan"
- **G1f Mobile** (10257:1000) : ⚠️ "Team members" → "Préférences de notifications"

## Tâches à faire

### 1. Nettoyer les résidus mobiles
Sur G1d, G1e, G1f mobile : le titre bold "Team members" n'a pas été traduit (c'est un texte dans un composant, chercher en profondeur).

### 2. Enrichir G1b Mon entreprise (Desktop + Mobile)
Le formulaire actuel n'a que : Nom commerce, Activité, Adresse, Logo upload.
Il DOIT aussi contenir :
- **Téléphone** du commerce
- **Horaires d'ouverture** (champ texte multi-lignes)
- **Description du commerce** (textarea avec WYSIWYG — déjà dans le template Profile section, il suffit de le rendre visible et traduire)
- **Lien Google My Business** (input)
- **Couleur du programme** (select/input avec preview couleur)
- **Emplacement / Map** → utiliser le composant Contact section du template : https://www.figma.com/design/PVqIzNHJH5AH3aujECItxR?node-id=673-20368

Pour enrichir : re-montrer la section "Profile" cachée (10241:701 sur desktop) et la traduire. Sur mobile, même logique. Puis ajouter la map depuis le template Contact.

### 3. Ajouter les paliers de récompenses dans G1 Programme fidélité
Le champ "Récompense" actuel montre un seul select "Boisson offerte". L'architecture v3 prévoit des paliers multi-niveaux :
- Café offert → 30 points
- Cookie offert → 40 points
- 5% réduction → 50 points
- Menu offert → 100 points

Utiliser un composant table ou liste du template Untitled UI pour afficher ces paliers avec possibilité d'ajouter/supprimer.

## Templates de référence disponibles

| Template | ID | Usage |
|----------|-----|-------|
| Settings Desktop profil+bandeau | 1676:412584 | G1a, G1b |
| Settings Desktop simple | 1672:457278 | G1d, G1e, G1f |
| Settings Mobile profil+bandeau | 1677:538862 | G1a, G1b mobile |
| Settings Mobile simple | 1677:538204 | G1d, G1e, G1f mobile |
| Contact sections (map) | 673:20368 | Map pour G1b |
| Tables | 214:0 | Paliers récompenses |
| Icons | 1025:31781 | Icônes Untitled UI |

## Règles (rappel)
- **JAMAIS créer d'éléments from scratch** — toujours cloner/réutiliser des composants du template
- Cacher les éléments inutiles (visible = false), ne pas supprimer
- Screenshot de vérification après chaque modification
- 1 écran à la fois, vérifier, puis suivant
- Textes en français, design system Izou (jaune #F9D714 pour accents)
- Sidebar Izou : 3 icônes haut (home, users, send) + 1 user icon en bas
- Bottom nav mobile : 4 icônes template (Tableau de bord | Clients | Marketing | Paramètres)
- Bell icon 🔔 dans le header de chaque écran
