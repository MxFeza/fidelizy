Continue la refonte Figma Izou V3. Fichier : PVqIzNHJH5AH3aujECItxR. Plan : C:\Users\UX8402\.claude\plans\floofy-wandering-bird.md.

WORKFLOW 8 — Carte Fidélité Client (B)

Contexte : c'est l'écran principal du client au quotidien. Il voit sa carte, sa progression, son historique. B1 (Carte 7/10 tampons) existe déjà (9872:587). Il faut créer B2, B3, B4. Tous les écrans sont mobiles (375px). FRs couvertes : FR9-FR16.

Écrans à créer (page 📱 CLIENT — B. Carte Fidélité) :

B2 — Carte 10/10 (récompense débloquée) : même base que B1 mais avec 10/10 tampons remplis + état "Récompense disponible !" + bouton CTA "Réclamer ma récompense" + confetti/célébration visuelle. La progress bar doit être pleine. Badge "🎉 Boisson offerte".

B3 — Points 350/500 : variante système points au lieu de tampons. Même layout que B1 adapté. Progress bar montrant 350/500 points. Texte "Plus que 150 points avant votre prochaine récompense". Badge niveau (ex: "Habitué"). Historique des gains de points ("+10 pts — 28 mars", "+10 pts — 25 mars", etc.).

B4 — Historique complet : écran dédié à l'historique des visites/transactions. Liste chronologique avec date, type (scan, récompense, parrainage), détail. Filtres par période. Header "Historique" + bottom tab bar.

Référence B1 existant : vérifier le screenshot de B1 (9872:587) AVANT de commencer pour reproduire le même style.

Règles :
- Cloner B1 comme base pour B2 et B3 (même layout, modifier le contenu)
- Pour B4, cloner une page mobile depuis le template (Info Mobile 2 ou similaire) pour la liste
- JAMAIS créer from scratch — utiliser composants existants
- Bottom Tab Bar client 5 onglets : Carte | Historique | Scanner | Parrainage | Profil
- Mobile-first (375px)
- Screenshot de vérification après chaque modification
- 1 écran à la fois, vérifier, puis suivant
- Textes en français, design system Izou (jaune #F9D714 pour accents)
- Cacher les éléments inutiles (visible = false), ne pas supprimer
- Certains composants peuvent ne pas être nommés comme attendu — explorer composant par composant avant de choisir
- Vérifier la cohérence avec le PRD (FR9-FR16) et l'UX spec avant de valider
