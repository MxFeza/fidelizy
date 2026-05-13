# Audit ergonomique — BusinessClient (Mon entreprise)

> Source : feedback user mentionné dans le plan pré-pilote — "cafouilli, boutons qui servent à rien, boutons qui se répètent, trop de couleurs".

Fichier : [app/dashboard/(protected)/settings/BusinessClient.tsx](app/dashboard/(protected)/settings/BusinessClient.tsx) (472 lignes).

Ce document audite la structure actuelle et propose une refonte par chunks. Aucun code n'est écrit avant que tu valides les directions. Suivant la règle `feedback_design_workflow` : je prépare, tu désignes.

---

## 1. Inventaire actuel (par section)

### Hero (lignes 198-232)
- **Bannière** full-width (LinkedIn-style) avec AssetUploader overlay (crayon flottant).
- **Logo rond** qui chevauche la bannière en bas-gauche.
- **SettingsHeader** :
  - Title : `businessName`
  - Subtitle : `address` ou placeholder "Ajoutez votre adresse pour qu'elle apparaisse ici"
  - 2 actions à droite :
    - **CTA "Partager"** (secondary + Share04 / CheckDone01) → `navigator.share` ou clipboard. URL : `joinUrl(short_code)` (depuis PR #41).
    - **CTA "Voir fiche"** (primary + ArrowUpRight) → ouvre `gmbUrl`. Désactivé si pas de gmbUrl.

### Section 1 — Infos personnelles (lignes 242-261)
- Input Prénom + Input Nom (côte-à-côte md+)
- Email read-only avec note inline `Pour modifier votre email, allez dans Sécurité.`

### Section 2 — Mon entreprise (lignes 263-319)
- Input Nom du commerce (required)
- Input Adresse (icon MarkerPin01)
- AssetUploader Logo (rond)
- AssetUploader Image carte loyalty (avec preview `LoyaltyCardVisual` live)

### Section 3 — Détails du commerce (lignes 321-406)
- Input Téléphone + Input Lien Google My Business (côte-à-côte)
- Input Site internet + Input Lien réservation (côte-à-côte)
- Input Horaires d'ouverture + 4 presets boutons
- Textarea Description (max 280 char, compteur)
- MapPreview (iframe Google Maps embed)

### Save bar (lignes 408-433, en bas, statique non-sticky)
- Badge "Modifications enregistrées" (success, conditionnel sur `savedAt`)
- Bouton Annuler (secondary, désactivé si `!isDirty`)
- Bouton Enregistrer les modifications (primary, désactivé si `!isDirty` ou `businessName` vide)

---

## 2. Problèmes identifiés

### 🔴 A. Doublon "Voir fiche" header ↔ Lien GMB section 3
- Le bouton "Voir fiche" du header ouvre `business.gmb_url`.
- Le user édite `business.gmb_url` plus bas dans la section 3 (Lien Google My Business).
- Friction : on voit un bouton qui ouvre ce qu'on est en train de configurer, ou qui est désactivé tant que le champ n'est pas rempli.
- **Reco** : retirer "Voir fiche" du header. Le user qui veut tester son lien le fait depuis l'icône externe à côté du champ d'édition (à ajouter — petit `<a>` discret).

### 🟡 B. Section 3 "Détails du commerce" trop dense
- 7 champs hétérogènes empilés (téléphone, GMB, site, réservation, horaires, description, map).
- Hauteur de la section dépasse l'écran sur mobile et même sur laptop 13".
- **Reco** : splitter en 2 sous-sections :
  - **Coordonnées** : téléphone, GMB, site, réservation
  - **Présence client** : horaires + presets + description + map preview

### 🟡 C. Email read-only avec redirection texte
- Note inline "Pour modifier votre email, allez dans **Sécurité**." — "Sécurité" en gras mais pas cliquable.
- **Reco** : transformer en `<Link href="/dashboard/security">` (souligné brand).

### 🟢 D. Save bar non-sticky volontairement
- Le commentaire dit "feedback user 2026-05-01" — c'est un choix validé.
- **Pas de reco**, mais sur mobile avec sections longues, le user peut perdre de vue le bouton Enregistrer. Suggestion optionnelle : afficher un petit indicateur "Modifications non sauvegardées" sticky-top quand `isDirty` (sans cacher le contenu).

### 🟢 E. Ordre des sections
- Actuel : Infos personnelles → Mon entreprise → Détails.
- Fréquence d'usage probable : le user reviendra surtout sur "Mon entreprise" (logo, image carte) et "Détails" (horaires, description). Infos personnelles = configuré une fois.
- **Reco** (optionnelle) : déplacer "Infos personnelles" en bas, juste avant la save bar.

### 🟢 F. Couleurs
- L'audit utilise tokens semantic (`text-primary`, `bg-primary`, `ring-secondary`). Pas d'AI slop.
- Seul élément discutable : le badge "Modifications enregistrées" en vert + texte success-primary à côté du bouton primary violet. Visuellement OK.
- **Pas de reco**.

---

## 3. Proposition de refonte priorisée

### Vague A — Quick wins pré-pilote (~45 min)
Sans changement structurel, juste retrait de duplication et fix friction.

| # | Action | Effort |
|---|---|---|
| A1 | Retirer "Voir fiche" du header. Ajouter une petite icône externe `<a target="_blank">` à droite du champ "Lien Google My Business" pour tester. | 15 min |
| A2 | Rendre "Sécurité" cliquable dans la note email (Link). | 5 min |
| A3 | Ajouter aux 3 inputs URL (site, réservation, GMB) la même icône externe `<a>` à côté pour tester un lien sans le mémoriser. | 20 min |

### Vague B — Restructuration des sections (~1h30)
Une fois validé visuellement.

| # | Action | Effort |
|---|---|---|
| B1 | Splitter section 3 "Détails du commerce" en deux : "Coordonnées" + "Présence client". | 30 min |
| B2 | Réordonner : Mon entreprise → Coordonnées → Présence client → Infos personnelles. | 15 min |
| B3 | Sticky indicator "Modifications non sauvegardées" top-page quand `isDirty` (mobile uniquement). | 45 min |

### Vague C — Refonte plus large (~2-3h)
Optionnelle, à valider après les vagues A et B.

| # | Action | Effort |
|---|---|---|
| C1 | Tabs horizontaux au lieu de scroll vertical : "Mon entreprise" / "Détails publics" / "Compte". | ~3h |

---

## 4. Étapes recommandées

1. **Tu fais un tour visuel sur preview** Vercel `https://fidelizy-git-develop-mxfezas-projects.vercel.app/dashboard/settings` et tu me dis si l'audit colle à ton ressenti.
2. **Tu valides Vague A** (low risk, 45 min) → je l'implémente en 1 PR.
3. **Tu valides Vague B** OU tu redessines en Figma — selon ton workflow préféré (`feedback_figma_is_source` : Figma source unique, ou retour brut Claude → tu désignes).
4. **Vague C** : à décider après pilote, basé sur retour testeurs.

---

## 5. Ce que je ne touche PAS sans validation

- L'identité visuelle (couleurs, polices, espacements globaux) — utilise les tokens semantic déjà en place.
- La logique d'auth/persist (`handleSaveAll`, `handleShare`) — fonctionnelle, juste à raccorder différemment.
- Le `MapPreview` (component séparé, OK tel quel).
- Le pattern "save bar globale" (validé par toi le 2026-05-01).
- Le pattern "1 seul Enregistrer pour toute la page" (validé).

---

## 6. Questions pour toi avant de coder

1. Vague A — j'attaque tout de suite (zero risque visuel) ou tu veux d'abord screenshots avant/après ?
2. Vague B — tu veux que je propose les wireframes en Figma (créer les frames) ou en mockup ASCII rapide dans un message ?
3. Vague C (tabs) — vraiment souhaité ou trop disruptif vs un long scroll bien découpé ?
