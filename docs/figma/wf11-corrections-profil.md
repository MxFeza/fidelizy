Continue la refonte Figma Izou V3. Fichier : PVqIzNHJH5AH3aujECItxR. Plan : C:\Users\UX8402\.claude\plans\floofy-wandering-bird.md.

WORKFLOW 11 — Corrections écrans WF10 + Écrans Profil Client

## Contexte

Les 8 écrans du WF10 (C1-C4, D1-D2, K1-K2) existent dans le fichier Figma mais ont 3 problèmes majeurs identifiés au recettage :

1. **Burger menu incohérent** — Les écrans client normaux (C2, D1, K1, K2) ont un header avec logo IZOU + burger menu hamburger, alors qu'ils ont déjà une Bottom Tab Bar en bas. Le burger menu n'a aucun contenu prévu côté client. → **Supprimer le burger**, garder juste le logo IZOU en header (comme B1) ou un header avec bouton retour quand pertinent.

2. **Emojis/éléments from scratch** — Des emojis texte (☕, 🍪, 🏷️, 🍔, 🎁, 👤, 📱) ont été utilisés à la place de vrais composants du template Untitled UI. → **Remplacer chaque emoji par une icône ou un composant du template** (page Icons `1025:31781`, page Badges `12:539`, page Avatars `18:1350`).

3. **Écrans Profil client manquants** — La Bottom Tab Bar a un onglet "Profil" mais aucun écran n'existe derrière. → Créer les écrans Profil.

---

## PARTIE A — Corrections des 8 écrans existants

### Écrans concernés et leurs IDs actuels

| Écran | Node ID | Page Figma |
|-------|---------|------------|
| K1 — Retrouver ma carte | 10300:613 | 📱 CLIENT — K. Récupération carte |
| K2 — Carte retrouvée | 10305:612 | 📱 CLIENT — K. Récupération carte |
| C1 — Succès carte complète | 10320:612 | 📱 CLIENT — C. Récompense & Succès |
| C2 — Paliers points | 10360:612 | 📱 CLIENT — C. Récompense & Succès |
| C3 — Demande envoyée | 10321:613 | 📱 CLIENT — C. Récompense & Succès |
| C4 — Validation commerçant | 10324:612 | 📱 CLIENT — C. Récompense & Succès |
| D1 — Page parrainage | 10306:613 | 📱 CLIENT — D. Parrainage |
| D2 — Succès parrainage | 10326:612 | 📱 CLIENT — D. Parrainage |

### Correction 1 : Supprimer le burger menu

**Écrans normaux (C2, D1, K1, K2)** — Le header actuel = logo IZOU + burger (hérité des templates). Le remplacer par :
- **K1** : Logo IZOU seul (pas de burger) — c'est un écran d'entrée
- **K2** : Logo IZOU seul — écran de succès post-reconnexion
- **C2** : Logo IZOU + flèche retour (←) à gauche — on peut revenir à la carte
- **D1** : Logo IZOU + flèche retour (←) à gauche — on peut revenir à la carte

Pour le bouton retour : utiliser l'icône `arrow-left` ou `chevron-left` de la page Icons (`1025:31781`), PAS un emoji ou texte "←".

**Écrans immersifs (C1, D2)** — Pas de header du tout (déjà correct).
**C3** — Garder le header actuel (écran intermédiaire).
**C4** — Bottom sheet, pas de header (déjà correct).

### Correction 2 : Remplacer les emojis par des composants template

Voici chaque emoji à remplacer et par quoi :

| Écran | Emoji actuel | Remplacement |
|-------|-------------|-------------|
| C2 table | ☕ Café offert | Icône `coffee` (page Icons) + texte |
| C2 table | 🍪 Cookie offert | Icône `cookie` ou `gift` (page Icons) + texte |
| C2 table | 🏷️ 5% réduction | Icône `tag` (page Icons) + texte |
| C2 table | 🍔 Menu offert | Icône `utensils` ou `shopping-bag` (page Icons) + texte |
| C2 table | ✓ / 🔒 | Badge composant (`1046:3819`) variant Success/Gray |
| C1 badge | 🎁 Boisson offerte | Badge composant (`1046:3819`) variant Warning/jaune |
| C3 banner | 📱 Présentez cet écran | Icône `smartphone` (page Icons) + texte |
| C4 | 👤 Inès réclame | Avatar composant (`18:1350`) + texte |
| C4 | 🎁 Boisson offerte | Badge composant (`1046:3819`) variant Warning |
| D1 code | Texte créé from scratch | Réutiliser un Input field (readonly) du template pour afficher INES-CAFE |
| D1 filleuls | ✅ Inscrit / En attente | Badge composant (`1046:3819`) variant Success / Gray |

**Méthode pour trouver les icônes :** Explorer la page Icons (`1025:31781`) — elle contient des centaines d'icônes Untitled UI. Chercher par nom : `coffee`, `gift`, `tag`, `shopping-bag`, `smartphone`, `share`, `arrow-left`, `lock`, `check`, `clock`, etc. Si l'icône exacte n'existe pas, utiliser la plus proche.

### Correction 3 : Vérifier les Bottom Tab Bars

Les tab bars ajoutées (clonées depuis la Bottom Tab Bar Commerçant `10161:717`) utilisent actuellement les icônes commerçant (home, users, send, user, user). Vérifier que :
- Les 5 labels sont bien : Carte | Historique | Scanner | Parrainage | Profil
- Les icônes correspondent au mieux : `credit-card` | `clock` | `scan` ou `qr-code` | `users` ou `gift` | `user`
- S'il manque des icônes spécifiques dans le template, utiliser les plus proches

---

## PARTIE B — Écrans Profil Client (nouveaux)

### Contexte fonctionnel
Le client collecte ses infos progressivement :
- **À l'inscription (A2-A5)** : Prénom + Téléphone + OTP
- **Plus tard (gamifié via FR26 "Profil complet")** : Email + Date anniversaire

Le profil client est beaucoup plus simple que le côté commerçant (Settings). Pas de facturation, pas d'équipe, pas de plan.

### Écrans à créer

#### P1 — Mon profil (vue principale)
**Base template :** Settings Mobile 1 (`1677:538204`) — le plus adapté pour un profil mobile avec sections
**Contenu :**
- Header : "Mon profil" + flèche retour
- Section "Informations personnelles" :
  - Prénom : "Sarah" (input éditable)
  - Téléphone : "+33 6 12 34 56 78" (input, non modifiable ou avec confirmation OTP)
  - Email : "sarah@email.com" (input éditable) — ou vide avec incitation "Ajouter votre email"
  - Date anniversaire : "15/04/1995" (input date) — ou vide avec incitation
- Mission gamifiée : si email OU anniversaire manquant, afficher un banner/badge : "Complétez votre profil → +1 tampon bonus" (FR26)
- Section "Sécurité" :
  - Bouton : "Changer mon numéro" → relance le flow OTP (A4-A5)
- Section "À propos" :
  - Lien : "Conditions d'utilisation"
  - Lien : "Politique de confidentialité"
  - Version : "Izou v1.0"
- Bouton danger en bas : "Supprimer mon compte" (texte corail)
- Bottom Tab Bar client (onglet "Profil" actif)

#### P2 — Édition profil (optionnel, si tu penses que c'est nécessaire)
Si le P1 n'est pas directement éditable en ligne (inline editing), prévoir un écran d'édition avec :
- Input fields pré-remplis
- Boutons "Annuler" / "Enregistrer"
- Base : même Settings Mobile 1

---

## Templates de référence (IDs Figma)

| Template | ID | Usage |
|----------|-----|-------|
| Settings Mobile 1 | 1677:538204 | P1 profil client |
| Icons | 1025:31781 | Remplacer tous les emojis |
| Badges (312 variants) | 1046:3819 | Statuts, récompenses, "Profil complet" |
| Avatars | 18:1350 | C4 avatar Inès |
| Progress bar | 1085:57382 | Mission "Profil complet" (optionnel) |
| Bottom Tab Bar Commerçant (à adapter) | 10161:717 | Source pour les tab bars |

## Composants existants à réutiliser

| Composant | Où le trouver | Usage |
|-----------|--------------|-------|
| Bottom Tab Bar Client (5 onglets) | Déjà sur K1 (`10375:612`) | Cloner pour P1 |
| Credit card mockup | Déjà sur K2 | Pattern carte fidélité |
| Donut chart (jaune) | Déjà sur C2 | Pattern progression |

## Règles STRICTES

1. **ZÉRO élément from scratch** — Pas de `figma.createText()`, pas de `figma.createRectangle()`, rien. Tout doit être cloné depuis un composant/frame existant dans le fichier template.
2. **ZÉRO emoji comme icône** — Les emojis (☕, 🎁, 👤, 📱, ✅, 🔒, etc.) ne sont PAS des composants design. Utiliser les icônes Untitled UI de la page Icons.
3. **Explorer TOUTES les pages du template** avant de dire "ce composant n'existe pas". Les noms ne correspondent pas toujours — regarder visuellement. Prendre un screenshot de chaque page de composants avant de commencer.
4. **Cacher les éléments inutiles** (`visible = false`), ne pas supprimer.
5. **Screenshot de vérification** après chaque modification significative.
6. **1 écran à la fois**, vérifier, valider, puis suivant.
7. **Le design doit être au niveau** des écrans B1-B4 (carte fidélité) qui sont la référence de qualité côté client.

## Ordre d'exécution

1. **Explorer les pages Icons et Badges** — prendre des screenshots pour connaître les icônes disponibles
2. **Corriger C2** — remplacer emojis par icônes/badges template dans la table
3. **Corriger C1** — remplacer emoji badge par composant Badge jaune
4. **Corriger C3** — remplacer emoji par icône smartphone
5. **Corriger C4** — remplacer emoji par Avatar + Badge template
6. **Corriger D1** — remplacer texte from-scratch INES-CAFE par input template, badges filleuls
7. **Corriger headers** — supprimer burgers, ajouter retour sur C2/D1
8. **Vérifier tab bars** — icônes cohérentes
9. **Créer P1** — profil client depuis Settings Mobile 1
