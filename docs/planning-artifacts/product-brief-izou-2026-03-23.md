---
stepsCompleted: [1, 2]
inputDocuments:
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/api-contracts.md
  - docs/data-models.md
  - docs/component-inventory.md
  - docs/source-tree-analysis.md
  - docs/development-guide.md
  - docs/deployment-guide.md
  - docs/PROJET_STATE.md
  - SECURITY_AUDIT.md
date: 2026-03-23
author: UX8402
---

# Product Brief: Izou

## Executive Summary

Izou est une plateforme de fidélisation client digitale conçue pour les commerçants de proximité — coffee shops, restaurants rapides, boulangeries, snacks — qui n'ont aujourd'hui aucune solution de fidélisation ou utilisent encore des cartes papier à tamponner. La plateforme permet de créer et gérer des programmes de fidélité digitaux (tampons ou points) avec une approche d'**effort minimal** : scan QR en quelques secondes depuis le smartphone du commerçant, configuration guidée par templates métier, et gamification activable progressivement par presets.

Le MVP est fonctionnel et déployé en production. Il couvre l'intégralité du parcours : inscription client par OTP, carte digitale avec Apple Wallet, dashboard commerçant avec KPIs, notifications push, et outils d'engagement. **Le produit est pré-market fit** : la priorité est de valider l'adoption auprès de 5-10 commerçants pilotes et de définir un modèle économique viable. À terme, Izou ambitionne de devenir une solution de pilotage complète du commerce de proximité.

**Décision préalable :** Izou est actuellement un MVP solo en phase d'exploration. Ce brief définit les conditions de passage en phase entrepreneuriale : adoption validée par au minimum 5 commerçants actifs pendant 3 mois, avec un taux de rétention client mesurable.

---

## Core Vision

### Problem Statement

Les commerçants de proximité ne fidélisent pas leurs clients — non par choix, mais par manque de temps, de compétences digitales et de solutions adaptées à leur réalité. Beaucoup ne disposent d'aucun système de fidélité. D'autres utilisent des cartes papier à tamponner, un système éprouvé et ultra-rapide (~1 seconde) mais qui laisse inexploitée toute la donnée client : fréquence de visite, récurrence, potentiel de recommandation, canal de communication directe.

Ces commerçants se focalisent sur l'acquisition de nouveaux clients au lieu de capitaliser sur ceux qui franchissent déjà leur porte. Ils ne voient la fidélité que comme un simple mécanisme de récompense ("10 tampons = 1 gratuit") et passent à côté de la véritable valeur : un client valorisé revient plus souvent et parle de vous autour de lui.

Ce besoin est **observé mais rarement exprimé** par les commerçants eux-mêmes. La fidélisation digitale est un marché de conviction, pas de demande spontanée — ce qui implique un effort d'éducation et de démonstration de valeur concrète. Le fait que des solutions concurrentes même médiocres trouvent preneurs confirme que la demande latente existe.

Pour les commerces de quartier établis, l'enjeu n'est pas seulement la récurrence des habitués — ils viennent déjà — mais aussi la **conversion des nouveaux clients en habitués**, face à la concurrence directe (la boulangerie Paul à 200 mètres).

### Problem Impact

- **Pour le commerçant** : perte de récurrence, taux de retour non mesuré, dépendance à l'acquisition constante de nouveaux clients, aucune donnée sur le comportement de sa clientèle, pas de canal de communication directe avec ses clients existants.
- **Pour le client** : aucune reconnaissance de sa fidélité, aucun avantage concret à revenir au même endroit plutôt qu'à une alternative dans la même rue, expérience transactionnelle sans lien émotionnel.
- **Pour le marché** : les solutions existantes (HeyPongo, Stamp Me, VeeCard, Fidelatoo, etc.) proposent des outils souvent complexes, avec des interfaces peu travaillées, qui ajoutent de la charge plutôt que d'en retirer. Le fait qu'elles trouvent preneurs malgré ces défauts confirme la demande latente.

### Why Existing Solutions Fall Short

- **Complexité** : interfaces surchargées qui demandent du temps d'apprentissage — pourtant certaines se vendent, preuve que le besoin prime sur l'ergonomie
- **Coût perçu** : un outil de plus à payer qui s'ajoute aux charges existantes
- **Temps requis** : en plein rush, chaque seconde compte — la carte papier reste le benchmark à battre en rapidité (~1 sec vs ~5 sec pour un scan QR)
- **Équipement spécifique** : un matériel dédié ou une intégration complexe est un frein immédiat
- **Pas pensées pour les "no-tech"** : les commerçants les moins digitalisés, ceux qui en auraient le plus besoin, sont précisément ceux que ces solutions n'arrivent pas à embarquer

**Note : section concurrence à compléter.** Étude terrain requise avant lancement commercial — s'inscrire et tester au moins 3 solutions concurrentes pour valider les affirmations ci-dessus.

### Proposed Solution

Izou est conçu autour d'un principe fondateur : **réduire au minimum l'effort du commerçant pour fidéliser ses clients**. Concrètement :

- **Mécanisme principal recommandé : le client scanne un QR affiché au comptoir.** Cela élimine la dépendance à la mémoire du commerçant et le goulot d'étranglement en rush. Le scan par le commerçant reste disponible comme alternative. Ni l'un ni l'autre ne sont parfaits — le premier scan (inscription) est le vrai goulot et la stratégie doit se concentrer sur le rendre irrésistible (récompense immédiate, inscription en 1 geste).
- **Onboarding express** avec templates métier préconfigurés (Café, Restaurant, Boulangerie) qui activent un programme complet en un clic
- **Un seul mode au lancement** : tampons/points + parrainage. Le parrainage est l'unique mécanique d'engagement activée par défaut — c'est la seule qui résonne naturellement pour les clients. Roue de la fortune et missions sont disponibles en option pour les commerçants qui le souhaitent. Un mode "communauté" (communication, événements, nouveautés) est envisagé pour V2 pour les commerces artisanaux/premium.
- **Gamification progressive** : activable par presets quand le commerçant est prêt, pas imposée dès le départ
- **Carte digitale client** accessible via QR code, intégrée à Apple Wallet avec notifications push en temps réel — le retour positif le plus concret des premiers testeurs
- **Dashboard commerçant** avec métriques honnêtes et vérifiables : nombre de visites, fréquence moyenne, clients actifs vs inactifs, parrainages réalisés. Le ROI en euros est un objectif futur nécessitant une intégration caisse qui n'existe pas dans le MVP — ne pas promettre ce qu'on ne peut pas mesurer.
- **Engagement continu** : le commerçant peut interagir avec ses clients même en dehors du commerce, via push notifications

### Key Differentiators

**Validés :**
1. **Zéro matériel requis** : un smartphone suffit — pas de borne, pas de tablette, pas d'investissement
2. **Templates métier** : onboarding en un clic adapté au secteur du commerçant

**Partiellement validés :**
3. **Apple Wallet natif** : carte de fidélité dans le wallet avec push notifications — retour positif des testeurs, mais crée une expérience à deux vitesses sans Google Wallet (~75% du marché mobile Android en France). Gap à combler pour crédibiliser le positionnement.

**À valider par le marché :**
4. **Simplicité perçue** : l'ambition est d'être la solution la plus simple du marché — la partie engagement doit encore être simplifiée pour tenir cette promesse
5. **UI/UX comme avantage** : dans un marché où les concurrents négligent le design, Izou mise sur une expérience soignée — mais les concurrents "moches" vendent quand même, ce qui relativise ce facteur
6. **Fidélisation révélée** : ne pas vendre un outil mais montrer au commerçant ce qu'il rate — cette approche commerciale reste à tester terrain

### Ambition long terme

À terme, Izou ambitionne de devenir une **solution de pilotage complète du commerce de proximité** — de la fidélisation à l'encaissement, du CRM au marketing multicanal (SMS, newsletters, automatisation), jusqu'à la gestion multi-points de vente. Cette vision n'est pertinente que si la brique fondamentale — la fidélisation digitale simple — est d'abord validée et adoptée.

### Risques critiques et mitigations

| Risque | Sévérité | Mitigation |
|--------|----------|------------|
| **Indifférence commerçante** — le besoin est observé mais non exprimé. Personne ne cherche activement cette solution. | 🔴 P0 Fatal | Valider avec 20 démarchages terrain avant tout nouveau développement. Trouver UN commerçant qui adopte et retient pendant 3 mois. |
| **Adoption fantôme** — le scan QR repose sur la mémoire du commerçant ou la motivation du client. Risque d'abandon après la première semaine. | 🔴 P0 Fatal | Privilégier le QR affiché au comptoir (client initie). Explorer NFC. Récompense immédiate au premier scan pour créer le réflexe. |
| **Friction inscription client** — 6 étapes en contexte rush = abandon élevé. | 🔴 P0 Fatal | Réduire à 1-2 étapes (scan + prénom). Collecter email/téléphone après la première récompense, quand le client a une raison de revenir. |
| **Spirale des features** — ajouter des fonctionnalités au lieu de valider l'adoption. | 🟠 P1 Grave | Gel des features. Zéro nouveau code jusqu'à 5 commerçants actifs avec clients récurrents. |
| **Freemium sans conversion** — commerçants utilisent le gratuit, ne convertissent jamais. | 🟠 P2 Grave | Tester le pricing dès les premiers pilotes. Demander "combien paieriez-vous ?" à chaque commerçant démarché. |
| **Solo dev, zéro résilience** — projet qui repose sur une seule personne. | 🟠 P2 Grave | Décider side project vs entreprise. Si entreprise : trouver un co-fondateur (idéalement commercial). |
| **Concurrent bouge** — un acteur établi lance une offre simplifiée sur la même cible. | 🟡 P3 | Veille concurrentielle. Tester 3 solutions concurrentes. Identifier ce qu'ils ne font PAS. |

### Questions ouvertes

- **Modèle économique** : freemium ? Quel seuil de conversion ? Quel prix acceptable pour un commerçant qui fait 2000-5000€/mois de CA ?
- **Go-to-market** : porte-à-porte, partenariats, bouche-à-oreille, démo en commerce ? Comment convaincre quelqu'un qui ne cherche pas de solution ?
- **Onboarding client** : peut-on réduire l'inscription à 1 étape (scan = inscription) ? Données complémentaires collectées plus tard ?
- **Google Wallet** : priorité à évaluer pour couvrir le marché Android (~75% en France)
- **Mécanisme anti-oubli** : quel dispositif pour que le scan se fasse même quand personne n'y pense ? (QR comptoir, NFC, intégration caisse, rappel automatique...)
- **Premier scan irrésistible** : quelle récompense immédiate pour convertir le premier geste ?
