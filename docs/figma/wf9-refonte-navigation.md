Continue la refonte Figma Izou V3. Fichier : PVqIzNHJH5AH3aujECItxR. Plan : C:\Users\UX8402\.claude\plans\floofy-wandering-bird.md.

WORKFLOW 9 — Refonte Navigation Complète (Desktop + Mobile)

Contexte : la navigation actuelle est incohérente entre desktop et mobile. L'app déployée (fidelizy.vercel.app) a une navigation simple qui fait sa force. Il faut aligner TOUS les écrans Figma sur la nouvelle architecture. Voir project_izou_nav_architecture.md pour le détail complet.

## Nouvelle architecture navigation — 4 entrées principales

### 1. Dashboard (Tableau de bord)
Sous-pages :
- Overview : KPIs (nb clients, visites aujourd'hui, nouveaux ce mois, points ce mois, taux de retour, fréquence moy.), chart visites semaine, top 3 clients, QR code commerce + lien inscription, derniers scans
- Insights détaillés : chiffres avec filtres (période, segment)

### 2. Clients
Sous-pages :
- Overview clients : KPIs + liste clients avec filtres
- Fiche client détaillée : aperçu (avatar, tel, email, date inscription), solde de points, ajouter/retirer points, utiliser récompense, historique transactions, supprimer données client

### 3. Marketing (ex-"Engagement")
Sous-pages :
- Campagnes push notification (composer, envoyer, historique) — I1b existe déjà (10140:586)
- SMS marketing (futur / grayed "Bientôt disponible")
- Automatisation (futur / grayed)
- Programme de parrainage (config parrainage, code, bonus)

### 4. Paramètres (fusionné avec Profil)
Sous-pages :
- Infos personnelles (nom, email, photo)
- Mon entreprise (nom commerce, logo, couleur, infos pratiques, horaires, lien Google My Business, map emplacement → visible côté client)
- Programme fidélité (type tampons/points, nombre tampons, paliers de récompenses multi-niveaux : Café offert 30pts, Cookie 40pts, 5% réduction 50pts, Menu offert 100pts, cooldown, description)
- Sécurité (email, mot de passe)
- Plan (abonnement)
- Notifications (ce que le commerçant reçoit — toggles Email/Push/SMS)

## Changements à appliquer

### Sidebars Desktop — Mettre à jour sur TOUS les écrans desktop :
- Renommer "Engagement" → "Marketing" dans la sidebar
- Supprimer "Notifications" du nav principal → devient sous-onglet de Paramètres
- Ajouter les sous-menus dans chaque sub-nav selon la page active
- Référence sidebar actuelle : E1 (10052:1389), F1 (10055:1531), G1 (10057:1008), H1 (10045:933), I1 (10058:1008)

### Bottom Nav Mobile — Mettre à jour sur TOUS les écrans mobiles commerçant :
- 4 onglets : Dashboard | Clients | Marketing | Paramètres
- Remplacer les emojis actuels par des icônes Untitled UI (home, users, send, settings)
- Écrans concernés : E2 (9865:887), F3 (9958:586), G2 (9963:834), H2 (9972:834), I2 (9978:834)

### Alertes temps réel :
- Ajouter icône 🔔 dans le header de chaque écran (desktop et mobile) pour les notifications en temps réel
- Ce n'est PLUS une page de navigation

### Écrans à réorganiser :
- I1 (Notifications Desktop) → devient une sous-page de Paramètres ou de Marketing selon le contenu
- I1b (Nouvelle Push) → devient sous-page de Marketing > Campagnes push
- H. Engagement → renommer la page Figma en "Marketing", réorganiser les sous-pages
- G. Paramètres → ajouter les sous-pages manquantes (Infos perso, Mon entreprise, Sécurité, Plan, Notifications)
- Ajouter les paliers de récompenses dans Programme fidélité (actuellement absent)

## Règles :
- Cloner depuis le template Untitled UI, JAMAIS créer from scratch
- Cacher les éléments inutiles (visible = false), ne pas supprimer
- Screenshot de vérification après chaque modification
- 1 écran à la fois, vérifier, puis suivant
- Les sous-menus doivent être visibles dans la sub-nav (desktop) ou en select/tabs (mobile)
- Textes en français, design system Izou (jaune #F9D714 pour accents)
- Cohérence desktop ↔ mobile : mêmes labels, même structure
