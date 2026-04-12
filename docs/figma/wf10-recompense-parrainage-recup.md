Continue la refonte Figma Izou V3. Fichier : PVqIzNHJH5AH3aujECItxR. Plan : C:\Users\UX8402\.claude\plans\floofy-wandering-bird.md.

WORKFLOW 10 — Récompense (C) + Parrainage (D) + Récupération carte (K)

Contexte : Les 6 pages commerçant (Dashboard, Clients, Marketing, Paramètres, Login, Notifications) sont terminées en desktop + mobile. Les 6 écrans client existants (A1-A6 Onboarding, B1-B4 Carte fidélité) sont terminés. Il reste les écrans de récompense, parrainage et récupération de carte — tous mobile-only (parcours client).

---

## Écrans à créer

### BLOC C — Récompense & Succès (4 écrans mobile, 375px wide)

#### C1 — Succès carte complète (Tampons)
**PRD :** FR10 (progression visuelle), FR12 (auto-reset après récompense)
**UX :** Journey 3 — Full-screen forest background, expansion 600ms, vibration 3 pulses, confetti
**Contenu :**
- Fond : forêt #1E3A2F (full-screen immersif)
- Illustration placeholder (cercle ou cadre pour future animation Lottie Tier 1)
- Titre : "Félicitations !" (Santoku, blanc)
- Sous-titre : "Vous avez complété votre carte !"
- Badge récompense : "Boisson offerte" (pill jaune #F9D714, texte noir)
- CTA principal : "Réclamer ma récompense" (pill noir, texte blanc)
- CTA secondaire : "Plus tard" (texte blanc underline)
- Pas de navigation (écran modal plein écran)

#### C2 — Palier atteint (Points)
**PRD :** FR15 (échange points contre récompense), FR16 (voir paliers disponibles)
**UX :** Journey 3 — Barre horizontale avec paliers verrouillés/déverrouillés
**Contenu :**
- Header : "Mes récompenses" + bouton retour
- Barre de progression horizontale avec 4 paliers marqués :
  - 30 pts : Café offert (débloqué ✓)
  - 40 pts : Cookie offert (débloqué ✓)
  - 50 pts : 5% réduction (PROCHAIN — highlight jaune)
  - 100 pts : Menu offert (verrouillé 🔒)
- Points actuels : "45 / 50 points" (gros chiffre)
- Liste des récompenses disponibles (celles débloquées) avec bouton "Échanger"
- Bottom Tab Bar client (5 onglets)

#### C3 — Demande envoyée
**PRD :** FR52 (validation commerçant)
**UX :** Journey 3 — Demande envoyée, push commerçant
**Contenu :**
- Fond : blanc/warm
- Illustration placeholder Tier 2 (SVG, cadre pour future illustration)
- Titre : "Demande envoyée !"
- Sous-titre : "Le commerçant va valider votre récompense."
- Indicateur : animation loader ou check animé
- Info : "Présentez cet écran au comptoir"
- Code éphémère : "A7X-29K" (gros, monospace Space Grotesk, validité 5 min)
- Timer : "Expire dans 4:32"
- CTA : "Retour à ma carte"

#### C4 — Validation commerçant (bottom sheet)
**PRD :** FR52 (merchant validates reward)
**UX :** Journey 3 — Bottom sheet, 1-tap validation
**Contenu :**
- Bottom sheet (pas full-screen) avec fond dimmed
- Avatar + prénom client : "Inès réclame :"
- Récompense : "Boisson offerte" (badge jaune)
- Bouton : "Valider la récompense" (pill noir)
- Bouton : "Refuser" (texte corail, underline)
- Note : "Les tampons seront remis à zéro"

---

### BLOC D — Parrainage Client (2 écrans mobile)

#### D1 — Page parrainage
**PRD :** FR30 (lien unique), FR31 (inscription via lien), FR33 (config bonus)
**UX :** Journey 5 — Share → native selector
**Contenu :**
- Header : "Parrainage" + bouton retour
- Section haute :
  - Illustration placeholder Tier 2
  - Titre : "Invitez vos amis !"
  - Sous-titre : "Parrainez un ami et gagnez tous les deux 2 tampons bonus."
- Code parrainage : "INES-CAFE" (copyable, monospace)
- Bouton : "Partager mon lien" (pill noir, icône share)
  → ouvre le sélecteur natif (SMS, Instagram, WhatsApp, copier)
- Section "Mes filleuls" :
  - Liste : Avatar + Prénom + Date + Statut (badge "Inscrit" vert / "En attente" gris)
  - Empty state si 0 : "Aucun filleul pour le moment"
- Bottom Tab Bar client

#### D2 — Succès parrainage (notification reçue)
**PRD :** FR32 (bonus auto parrain + filleul)
**UX :** Journey 5 — Referral success
**Contenu :**
- Fond : forêt #1E3A2F (succès immersif, même pattern que C1)
- Illustration placeholder
- Titre : "Nouveau filleul !"
- Sous-titre : "Karim s'est inscrit grâce à vous."
- Badge : "+2 tampons bonus" (pill jaune)
- CTA : "Voir ma carte" (pill noir)

---

### BLOC K — Récupération carte (2 écrans mobile)

#### K1 — Retrouver ma carte
**PRD :** FR21 (reconnexion par téléphone, pas de doublon)
**UX :** Journey 4 Scene 2 — Auto-reconnect by phone
**Contenu :**
- Logo Izou + nom commerce en header
- Titre : "Retrouver ma carte"
- Sous-titre : "Entrez le numéro utilisé lors de votre inscription."
- Input téléphone : +33 pré-rempli, clavier numérique
- Bouton : "Retrouver" (pill noir)
- Lien : "Créer une nouvelle carte" (texte underline)

#### K2 — Carte retrouvée (succès)
**PRD :** FR21 (préservation des données)
**UX :** Journey 4 Scene 2 — No data loss
**Contenu :**
- Illustration placeholder Tier 2
- Titre : "Carte retrouvée !"
- Sous-titre : "Vos 5 tampons ont été préservés."
- Aperçu mini-carte (composant StampCard réduit)
- Bouton : "Voir ma carte" (pill noir)
- Bouton : "Ajouter au Wallet" (pill jaune, icônes Apple/Google)

---

## Templates de référence (IDs Figma)

| Template | ID | Usage |
|----------|-----|-------|
| Info Mobile 2 | 1781:509811 | D1 base page parrainage |
| Login Mobile 1 | 1646:417912 | K1 retrouver carte |
| Signup Mobile 1 | 6476:161440 | K2 succès + D2 succès |
| Modals (bottom sheet) | 172:4293 | C4 validation commerçant |
| Progress bar | 1085:57382 | C2 barre paliers |
| Progress circle | 1154:89981 | C2 progression points |
| Badges (312 variants) | 1046:3819 | Statuts, récompenses |
| Credit card mockup | 1291:157837 | K2 aperçu carte |
| Icons | 1025:31781 | Icônes Untitled UI |
| Charts (donut) | 1050:146949 | C2 visualisation optionnelle |

## Assets à fournir par le user
- Composants spécifiques à cloner pour les écrans de succès (C1, D2)
- Confirmation du style bottom sheet pour C4
- Éventuels composants supplémentaires du template pour la page parrainage

## Règles (rappel)
- **JAMAIS créer d'éléments from scratch** — toujours cloner/réutiliser des composants du template
- Cacher les éléments inutiles (visible = false), ne pas supprimer
- Screenshot de vérification après chaque modification
- 1 écran à la fois, vérifier, puis suivant
- Textes en français, design system Izou (jaune #F9D714 pour accents, forêt #1E3A2F pour succès)
- Bottom Tab Bar client : Card | Historique | Scanner | Parrainage | Profil (5 onglets)
- Écrans de succès (C1, D2) : full-screen forêt, pas de navigation
- Écrans normaux (C2, D1, K1, K2) : navigation standard

## Ordre d'exécution recommandé
1. **K1 + K2** (les plus simples — clones directs de Login/Signup Mobile)
2. **D1** (page parrainage — clone Info Mobile + ajouts)
3. **C2** (paliers points — plus complexe, barre de progression)
4. **C1** (succès tampons — écran immersif forêt)
5. **C3** (demande envoyée — écran intermédiaire)
6. **C4** (bottom sheet validation — composant modal)
7. **D2** (succès parrainage — même pattern que C1)
