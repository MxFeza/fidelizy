---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments:
  - fidelizy/docs/planning-artifacts/product-brief-izou-2026-03-23.md
  - fidelizy/docs/planning-artifacts/personas-izou-2026-03-27.md
  - fidelizy/docs/index.md
  - fidelizy/docs/project-overview.md
  - fidelizy/docs/PROJET_STATE.md
  - fidelizy/docs/architecture.md
  - fidelizy/docs/data-models.md
  - fidelizy/docs/api-contracts.md
  - fidelizy/docs/component-inventory.md
  - fidelizy/docs/source-tree-analysis.md
  - fidelizy/docs/development-guide.md
  - fidelizy/docs/deployment-guide.md
  - fidelizy/docs/SUPABASE_EMAIL_TEMPLATE.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  personas: 1
  projectDocs: 11
  fieldInterviews: 3
classification:
  projectType: 'Plateforme multi-canal SaaS B2B2C (Web + PWA + Wallet + Push)'
  domain: 'Micro-Retail Digital Enablement (fidélisation TPE de proximité)'
  complexity: 'Moyenne-Haute (RGPD, two-sided, marché de conviction pré-mature)'
  marketMaturity: 'Émergente — curiosité d''abord, conviction ensuite'
  projectContext: 'Brownfield MVP — consolidation/simplification avant expansion'
fieldResearch:
  interviews: 3
  merchants:
    - name: 'My Tea Coffee (Katia, responsable, 21 ans)'
      regulars: '50%'
      currentLoyalty: 'Carte papier'
      pricing: '1.99€ acceptable, 25€ si top du top (8/10)'
      clientInitiated: 'Ça l''arrangerait — évite oublis'
      abandonRisk: 'Si ça prend trop de temps'
      dashboard: 'Très intéressée, suit au feeling'
    - name: 'Rest. Peppers (incomplet)'
      regulars: '70%'
      currentLoyalty: 'Avaient des cartes, arrêté sans savoir pourquoi'
    - name: 'Corner Coffee (Fati, employée)'
      regulars: '50%'
      currentLoyalty: 'Aucun'
      pricing: '30€/mois comme un abonnement téléphone'
      clientInitiated: 'C''est super bien, c''est ma pôle !'
      abandonRisk: 'Inutile, trop compliqué, mal guidée'
      dashboard: 'Utile pour comprendre comportements'
      designImportance: 'Hyper important, il faut que ça soit design'
  keyInsights:
    - 'Client initie le geste (QR comptoir/table) = validé terrain'
    - 'Pricing freemium viable, premium 25-30€/mois si valeur démontrée'
    - 'Contrainte n°1: chaque seconde de friction = abandon'
    - 'Design et personnalisation = levier d''appropriation'
    - 'L''employé doit être convaincu autant que le patron'
    - 'Menu intégré au QR = vision future (Fati)'
workflowType: 'prd'
---

# Product Requirements Document - Izou

**Author:** UX8402
**Date:** 2026-03-27

## Executive Summary

Izou est le partenaire digital du commerçant de proximité — une plateforme qui donne aux coffee shops, restaurants rapides et boulangeries les mêmes armes d'engagement client que les grandes enseignes (notifications wallet, marketing automatisé, données comportementales), sans aucune complexité ni matériel dédié.

Le problème est structurel : les commerçants de proximité ne fidélisent pas leurs clients — non par choix, mais par manque de temps, de compétences digitales et d'outils adaptés à leur réalité opérationnelle. Les solutions existantes ajoutent de la charge là où il faudrait en retirer. La carte carton, encore largement utilisée, fidélise dans l'ombre : aucune donnée, aucune mesure, aucune communication possible. Le commerçant suit son activité "au feeling" (verbatim terrain) et ne sait jamais si sa fidélisation est rentable.

Izou résout ce problème en rendant la fidélisation **visible, mesurable et automatisée**. Le client scanne un QR code au comptoir ou tapote un tag NFC — le commerçant n'a rien à faire. Les tampons s'accumulent dans Apple Wallet et Google Wallet avec notifications push en temps réel. Le dashboard révèle les données que la carte carton ne pouvait pas capturer : taux de retour, fréquence de visite, clients à risque, impact du parrainage. Le commerçant voit pour la première fois si sa fidélisation fonctionne — et à quel point.

**Phase actuelle :** Le MVP est fonctionnel et déployé en production. La priorité est la **consolidation et simplification** — élaguer les fonctionnalités non essentielles (gamification lourde), solidifier la base de code avec des tests, et ajouter Google Wallet pour couvrir 75% du marché mobile Android en France. Les interviews terrain (mars 2026, 3 commerçants) ont validé le mécanisme client-initié, le besoin de dashboard, et un pricing freemium avec premium à 25-30€/mois si la valeur est démontrée.

### Ce qui rend Izou spécial

**L'automatisation qui élimine la charge mentale.** Là où les concurrents demandent du temps au commerçant, Izou fonctionne sans intervention : le client initie le geste, les notifications sont automatiques, le parrainage se propage seul, le dashboard met à jour les KPIs en temps réel. Les pré-configurations par template métier (Café, Restaurant, Boulangerie) permettent un onboarding en un clic. La contrainte terrain est claire : chaque seconde de friction supplémentaire = abandon (validé par les 3 interviews).

**L'expérience premium accessible.** Izou mise sur un design soigné, des micro-animations et une personnalisation commerçant (couleurs, logo, icône PWA) qui transforment un outil utilitaire en extension de la marque du commerçant. L'insight terrain : "Hyper important. Il faut que ça soit design." (Fati, Corner Coffee). Le commerçant est fier de montrer Izou à ses clients — c'est son programme, pas un service externe.

**La donnée révélée.** Pour la première fois, le commerçant de proximité peut mesurer le ROI de sa fidélisation — pas en estimation, mais en données réelles. La carte carton ne permet aucune visibilité. Izou transforme chaque visite en donnée actionnable.

## Classification Projet

| Dimension | Valeur |
|-----------|--------|
| **Type** | Plateforme multi-canal SaaS B2B2C (Web + PWA + Apple Wallet + Google Wallet + Push) |
| **Domaine** | Micro-Retail Digital Enablement — fidélisation TPE de proximité |
| **Complexité** | Moyenne-Haute — RGPD, marketplace two-sided, marché de conviction pré-mature |
| **Maturité marché** | Émergente — curiosité d'abord, conviction par la preuve de valeur ensuite |
| **Contexte** | Brownfield MVP — consolidation/simplification avant expansion |
| **Cible primaire** | Commerçants indépendants (1-5 employés, < 2 ans) + clients finaux 18-35 ans |
| **Validation terrain** | 3 interviews commerçants (mars 2026) — mécanisme, pricing et besoins validés |

## Critères de Succès

### Succès Utilisateur

**Commerçant :**
- Onboarding complet en < 5 minutes, sans assistance
- Utilisation quotidienne du dashboard pour consulter l'activité (remplacement du "au feeling")
- Le commerçant recommande Izou à un pair dans les 3 premiers mois d'usage
- Verbatim cible : *"Je ne peux plus m'en passer pour suivre mes clients"*

**Client final :**
- Inscription en < 30 secondes (scan QR + prénom + téléphone)
- Carte ajoutée au wallet (Apple ou Google) dès la première visite
- Le client revient et utilise sa carte sans qu'on le lui rappelle — le geste est devenu un réflexe
- Taux de parrainage > 15% (les inscrits partagent naturellement le lien)

### Succès Business

| Métrique | Cible 3 mois | Cible 12 mois |
|----------|-------------|---------------|
| Commerçants actifs (programme en usage) | 5 | 20-30 |
| Clients inscrits par commerçant (moyenne) | > 30 | > 100 |
| Taux de rétention commerçant | > 80% à 3 mois | > 70% à 12 mois |
| Taux ajout wallet (Apple + Google) | > 50% des inscrits | > 60% |
| Taux de complétion carte (tampons) | > 25% | > 30% |
| Diffusion organique | 1er RDV entrant via bouche-à-oreille | Majorité des nouveaux commerçants via recommandation |
| Conversion freemium → payant | Premiers tests pricing | > 20% des commerçants actifs |

**Signal de validation :** Le produit est viable quand des commerçants parlent d'Izou à leurs pairs, que des rendez-vous entrants arrivent sans démarchage, et que l'usage s'ancre dans les habitudes quotidiennes.

### Succès Technique

- **Zéro bug bloquant sur les parcours critiques** — inscription, scan/tampon, wallet, dashboard. Le bug OTP actuel est l'exemple type de ce qui ne doit plus exister.
- **Tests automatisés sur tous les flux critiques** — chaque feature livrée a ses tests. Si c'est pas testé, c'est pas stable, c'est pas livré.
- **Temps de réponse < 2s** sur toutes les interactions utilisateur — le scan QR, le chargement du dashboard, la mise à jour du wallet.
- **Code simplifié et maintenable** — réduction du nombre d'endpoints (~25-30 vs 45 actuellement), suppression de la dette technique identifiée (duplication `src/lib/`, pas de state management).
- **Parcours UX sans friction** — wordings clairs, navigation intuitive, chaque action se réalise sans ambiguïté pour commerçant ET client final.

### Résultats Mesurables

| Indicateur | Mesure | Source |
|-----------|--------|--------|
| Adoption du geste client | % de visites avec scan effectif vs visites physiques estimées | Dashboard KPIs |
| Engagement notifications | Taux d'ouverture push > 15% | Analytics push |
| Fréquence de visite membres vs non-membres | Écart > 20% (benchmark industrie) | Dashboard comparatif |
| NPS commerçant | > 8/10 à 3 mois | Enquête terrain |
| Bugs critiques en production | 0 sur parcours critiques | Monitoring |

## Parcours Utilisateur

### Parcours 1 — Le commerçant : de la découverte à "je ne peux plus m'en passer"

**Profil :** Samir, 32 ans, patron d'un coffee shop indépendant depuis 8 mois. Gère seul le matin, une employée l'après-midi. Pas de système de fidélité — il a essayé la carte papier, abandonné au bout de 2 mois ("les clients la perdent"). Il suit son activité "au feeling".

**Scène d'ouverture :** Un commerçant voisin lui montre Izou sur son téléphone. "Regarde, j'ai 47 clients inscrits en 3 semaines, et 8 sont venus grâce au parrainage." Samir est intrigué. Le commerçant lui envoie un lien d'inscription par SMS.

**Action montante :**
- Création de compte en 2 minutes (email, mot de passe, nom du commerce).
- Onboarding : "Quel est votre type de commerce ?" → sélectionne **Café**.
- Template Café pré-remplit tout : programme tampons (10 = 1 boisson offerte), 2 tampons de bienvenue, parrainage activé (bonus parrain + filleul), couleur suggérée.
- Samir ajuste le nom de la récompense ("1 boisson au choix offerte") et valide en 1 clic.
- Personnalise : couleur, nom affiché. Reçoit son QR code à imprimer et son lien d'inscription client.
- Colle le QR près de la caisse avec un support : "Scannez pour votre carte de fidélité — 2 tampons offerts". Total : 5 minutes.

**Climax :** Le lendemain, sa première cliente scanne le QR par curiosité. Inscrite en 25 secondes, 2 tampons déjà remplis, carte dans Apple Wallet. Le téléphone de Samir vibre : "Inès vient de s'inscrire à votre programme". Il n'a rien eu à faire. 6 inscrits et 6 notifications à la fin de la journée. Il ouvre le dashboard et voit pour la première fois des données concrètes sur sa clientèle.

**Résolution :** 3 semaines plus tard, 35 clients inscrits, 4 venus par parrainage (des inconnus). Il consulte ses KPIs chaque matin comme il consulte sa caisse. À un ami commerçant : "Installe Izou, ça m'a pris 5 minutes et maintenant je sais exactement qui revient."

**Capacités révélées :** Inscription commerçant express, templates métier avec pré-configuration complète, personnalisation, QR code imprimable, notification à chaque inscription client, dashboard KPIs.

---

### Parcours 2 — La cliente : du premier scan au parrainage naturel

**Profil :** Inès, 21 ans, étudiante, budget serré. Coffee shop de Samir 3-4 fois/semaine. Apps fidélité McDo et Starbucks dans son wallet, rien pour les indépendants.

**Scène d'ouverture :** En attendant son café, Inès voit le panneau QR : "Scannez pour votre carte de fidélité — 2 tampons offerts". Téléphone sorti par réflexe.

**Action montante :**
- Scan du QR. Système ne la reconnaît pas → formulaire inscription : prénom, téléphone (pré-rempli), email. Code OTP reçu, tapé — 25 secondes.
- Carte affichée : 2/10 tampons aux couleurs du coffee shop. Bouton "Ajouter au Wallet" → carte dans Apple Wallet.
- Samir n'a rien fait. Notification reçue : "Inès vient de s'inscrire".

**Scans suivants — routage intelligent :**
- Lendemain, Inès re-scanne le même QR. Système la reconnaît (cookie/session) → pas de formulaire, tampon ajouté automatiquement. Wallet mis à jour : 3/10. Interaction : 3 secondes.

**Anti-fraude :**
- Inès essaie de re-scanner immédiatement → "Tampon déjà enregistré aujourd'hui. Revenez demain !" Cooldown de 2h minimum. Samir a reçu la notification du premier scan.

**Climax :** 4 jours plus tard, notification push via Wallet : "Plus que 5 tampons avant ta boisson offerte !" Elle bifurque vers le coffee shop. Scan QR → 5/10. Le soir, dans le groupe WhatsApp de la fac, elle envoie son lien de parrainage : "Va chez Samir, on a tous les deux des tampons bonus."

**Résolution :** Carte complétée en 3 semaines, 2 amies parrainées. Boisson offerte, elle est fière. La carte dans le wallet est devenue aussi naturelle que celle de Starbucks — réflexe de 3 secondes.

**Capacités révélées :** QR intelligent (routage inscription/scan auto), inscription < 30s, wallet Apple + Google, tampons de bienvenue, scan automatique (client reconnu), cooldown anti-fraude, notification commerçant, push wallet, parrainage par lien, progression visuelle.

---

### Parcours 3 — L'employée : utilisation quotidienne en rush

**Profil :** Katia, 21 ans, responsable de l'après-midi chez My Tea Coffee. Seule de 14h à 20h. Si un outil prend trop de temps, elle l'abandonne (verbatim terrain).

**Scène d'ouverture :** Le patron a installé Izou le matin avec le template Café. Katia arrive à 14h, voit le QR au comptoir et un message : "Les clients scannent eux-mêmes, tu n'as rien à faire."

**Action montante :**
- Premier client : "C'est quoi ce QR ?" → Katia : "C'est la carte de fidélité, scannez-le." Le client le fait. Katia n'a pas quitté la machine.
- 17h, rush. 3 clients en queue. Deux scannent le QR en attendant — système les reconnaît, tampons ajoutés automatiquement. Le troisième est nouveau → inscription en 25 secondes pendant qu'il attend sa commande.
- Entre deux commandes, Katia jette un œil au dashboard : 8 scans, 2 nouveaux. Elle ne connaissait même pas ces chiffres hier.

**Climax :** Un client arrive : "J'ai reçu une notif que j'ai un café offert !" Katia n'a rien envoyé — c'est automatique. Dashboard → 10 tampons → offre le café → réinitialise d'un tap. "En fait ça tourne tout seul."

**Résolution :** 1 semaine plus tard, Katia ne pense plus à Izou. Clients scannent seuls, notifications automatiques, récompenses auto. Au patron : "Oui on garde, ça ne me dérange pas" — le plus grand compliment de quelqu'un qui abandonne tout ce qui prend du temps.

**Capacités révélées :** Zéro effort employé (client-initié), QR intelligent, fonctionnement autonome en rush, dashboard mobile, réinitialisation 1 tap, aucune formation.

---

### Parcours 4 — Edge cases : quand ça ne marche pas

**Scène 1 — Bug OTP :** Client frustré, code ne marche pas. Samir ouvre le dashboard → recherche par nom → trouve le client (7 tampons) → ajoute 1 tampon manuellement. Fallback immédiat, client satisfait.
→ *Recherche client, ajout manuel, détail client*

**Scène 2 — Carte "perdue" :** Cliente revient après 2 semaines, ne retrouve plus rien. Re-scanne le QR → entre son téléphone → système détecte le numéro existant → reconnecte à sa carte (5 tampons conservés). Pas de doublon, pas de perte.
→ *Routage intelligent, reconnexion auto par téléphone, persistance des données*

**Scène 3 — Tentative de fraude :** Client re-scanne 10 minutes après → "Tampon déjà enregistré. Revenez plus tard !" Samir voit les scans dans l'historique du jour — pattern visible si suspect.
→ *Cooldown anti-fraude configurable, historique des scans*

**Scène 4 — Peu d'inscrits :** 1 mois, 12 inscrits seulement. Samir ouvre le dashboard : taux de retour 40%, 2 parrainages, fréquence 2.1 visites/semaine. Il réalise que 12 clients mesurés valent plus que "plein au feeling". Décide de mettre le QR plus en évidence.
→ *KPIs honnêtes, conviction par les données*

---

### Parcours 5 — Le système de points (variante)

**Profil :** Nora, 38 ans, restaurant rapide. Préfère les points aux tampons car ses plats ont des prix différents (formule 8€ vs sandwich 4€).

**Configuration :** Template "Restaurant" → mode points. Pré-rempli : 1 visite = 10 points, paliers (50 pts = boisson offerte, 100 pts = dessert, 200 pts = formule). Points fixes par visite en V1 — pas liés au montant.

**Usage :** Client scanne → 10 points ajoutés automatiquement → notification wallet "10 points gagnés ! Plus que 40 avant votre prochaine récompense." Au palier atteint, notification client + validation commerçant depuis le dashboard.

**Vision future (pas V1) :** Points proportionnels au montant via saisie manuelle du montant par le commerçant, puis à terme scan ticket/intégration caisse.

**Capacités révélées :** Mode points avec paliers, points fixes par visite (V1), templates métier adaptés, notifications de progression par palier.

---

### Synthèse des capacités par parcours

| Capacité | P1 Commerçant | P2 Cliente | P3 Employée | P4 Edge cases | P5 Points |
|----------|:-:|:-:|:-:|:-:|:-:|
| Inscription commerçant express | ✓ | | | | |
| Templates métier + pré-configuration | ✓ | | | | ✓ |
| Personnalisation (couleurs, nom) | ✓ | | | | |
| QR intelligent (routage auto) | | ✓ | ✓ | ✓ | |
| Inscription client < 30s | | ✓ | ✓ | | |
| Scan automatique (client reconnu) | | ✓ | ✓ | | ✓ |
| Tampons de bienvenue | | ✓ | | | |
| Wallet Apple + Google | | ✓ | | | ✓ |
| Notifications push automatiques | ✓ | ✓ | ✓ | | ✓ |
| Notification commerçant à chaque scan | ✓ | ✓ | ✓ | ✓ | |
| Cooldown anti-fraude | | ✓ | | ✓ | |
| Parrainage par lien | | ✓ | | | |
| Dashboard KPIs | ✓ | | ✓ | ✓ | |
| Ajout/réinitialisation manuelle | | | ✓ | ✓ | |
| Recherche client | | | | ✓ | |
| Récupération carte (reconnexion auto) | | | | ✓ | |
| Mode points avec paliers | | | | | ✓ |

## Exigences Domaine

### Conformité & Réglementaire

- **RGPD** — Déjà implémenté dans le MVP. La V1 consolidée doit vérifier :
  - Consentement explicite à l'inscription (case à cocher ou mention claire)
  - Droit de suppression de compte (identifié comme manquant — à ajouter en V1)
  - Politique de rétention des données documentée
  - Export des données personnelles sur demande (droit à la portabilité)
- **ePrivacy** — Les notifications push nécessitent un consentement explicite (déjà géré par le mécanisme d'abonnement push navigateur/wallet)

### Contraintes Techniques

- **Isolation des données** — Un commerçant n'accède qu'aux données de ses propres clients (RLS Supabase déjà en place, à maintenir strictement)
- **Données sensibles** — Téléphone, email, historique de visites, fréquence. Stockage chiffré en transit (HTTPS) et au repos (Supabase PostgreSQL)
- **Notifications push** — Limiter la fréquence pour éviter le spam : plafond configurable côté commerçant, cooldown système sur les broadcasts
- **Tokens et secrets** — Apple Wallet (HMAC-SHA256), VAPID keys, Supabase service role : aucune exposition côté client (déjà respecté)

### Anti-fraude

- **Client** — Cooldown temporel entre deux scans (2-4h configurable), notification commerçant à chaque scan, historique consultable
- **Parrainage** — Un filleul ne peut être parrainé qu'une seule fois par commerce (contrainte unique déjà en base), un parrain ne peut pas se parrainer lui-même
- **Commerçant** — Les métriques dashboard reflètent les données réelles, pas de mécanisme de gonflage artificiel

### Risques Domaine et Mitigations

| Risque | Mitigation |
|--------|-----------|
| Client supprime l'app/cookie et re-scanne sans être reconnu | Reconnexion par numéro de téléphone (détection doublon à l'inscription) |
| Commerçant spamme ses clients par push | Plafond broadcast (déjà : 5/h), cooldown minimum entre notifications |
| Perte de données client (conformité RGPD) | Backups Supabase, export données sur demande |
| Suppression de compte non disponible | À implémenter en V1 — endpoint de suppression cascade (customer + cards + transactions) |

## Innovation & Positionnement

Izou n'est pas une rupture technologique — c'est une excellente exécution de concepts existants (wallet, QR, push, dashboard) appliquée à un marché sous-servi. L'innovation est dans le positionnement et la simplification.

### Angles d'innovation

1. **QR intelligent à routage unique** — Un seul QR code au comptoir gère trois flux distincts (inscription, scan régulier, récupération de compte) via détection automatique du contexte. Élimine la friction cognitive pour le client et la charge de formation pour le commerçant.

2. **Inversion du geste de fidélisation** — Le client initie le scan (et non le commerçant), ce qui élimine le goulot d'étranglement en rush et supprime la dépendance à la mémoire humaine. Validé terrain : "Ça l'arrangerait" (Katia), "C'est super bien, c'est ma pôle !" (Fati).

3. **Fidélisation révélée pour les micro-commerces** — Donner au patron d'un café de quartier les mêmes données comportementales qu'un directeur de grande enseigne. Le passage de "au feeling" à "en données" est l'innovation de positionnement — pas la technologie, mais la démocratisation de l'accès à la donnée client.

## Exigences Web App

### Architecture & Rendu

- **Framework :** Next.js 16 App Router — hybride SSR (Server Components) + CSR (Client Components)
- **Pattern :** Monolithe full-stack — frontend et API routes dans le même codebase. Adapté à la phase actuelle (solo dev, itération rapide)
- **PWA :** Service Worker + manifest dynamique par carte. Installable sur écran d'accueil avec icône personnalisée

### Support Navigateurs & Appareils

| Plateforme | Cible | Priorité |
|-----------|-------|----------|
| **Mobile Safari (iOS)** | Clients finaux — scan QR, wallet, push | P0 |
| **Mobile Chrome (Android)** | Clients finaux — scan QR, Google Wallet, push | P0 |
| **Mobile Firefox** | Clients finaux — fallback | P2 |
| **Desktop Chrome/Safari/Firefox** | Dashboard commerçant | P1 |

**Approche :** Mobile-first pour les parcours client, responsive pour le dashboard commerçant (Sidebar desktop / BottomNav mobile).

### Performance

Voir la section **Exigences Non-Fonctionnelles > Performance** pour les cibles détaillées (LCP < 2s, API < 500ms, wallet < 3s, animations 60fps).

### Ergonomie & Expérience (UX comme accessibilité)

- **Parcours fluides** — Chaque action se complète sans ambiguïté, zéro écran inattendu
- **Wordings clairs** — Langage simple, adapté à des utilisateurs non-tech
- **Boutons et zones tactiles** — Taille minimale 44x44px, espacement suffisant pour le tactile en rush
- **Feedback immédiat** — Chaque action produit un retour visuel instantané (loader, confirmation, animation)
- **Navigation intuitive** — Maximum 2 taps pour atteindre n'importe quelle action clé
- **États d'erreur explicites** — Messages clairs avec action de résolution, jamais de message technique brut

### Direction Artistique & Esthétique (V1)

Le design premium est un différenciateur dès le jour 1 — pas un polish post-MVP.

**Principes fondateurs :**
- Une **direction artistique claire** doit se dégager du projet dès la V1, même si toutes les animations ne sont pas encore implémentées
- Le commerçant doit être **fier** de montrer Izou à ses clients
- Palette personnalisable par commerçant mais cohérente et premium par défaut
- Typographie propre et lisible, espaces blancs généreux — pas d'interface surchargée
- Illustrations ou icônes avec un style graphique cohérent qui donne vie à l'interface

**Micro-animations V1 (prioritaires) :**
- Transition de scan → confirmation tampon (feedback visuel satisfaisant)
- Progression des tampons (remplissage animé de la carte)
- Confetti/célébration quand la carte est complétée (récompense émotionnelle)
- Transitions de page fluides (pas de flash blanc entre les écrans)
- Micro-interactions sur les boutons et éléments interactifs

**Inspirations :** Des templates Figma avec écrans mobile ont été identifiés comme référence pour la direction artistique. L'UX/UI sera conçue à partir de ces inspirations avant implémentation.

### Landing Page — Stratégie de lancement

La landing page est une **composante à part entière de la stratégie de lancement**, pas un nice-to-have.

**Phase pilote (avril 2026) :** Le fondateur fait le démarchage direct — la landing page n'est pas bloquante mais commence à être construite en parallèle.

**Approche technique :** Framer (recommandé) — permet une qualité de site élevée avec animations et responsive intégrés, sans effort de développement custom. Alternative : template haut de gamme sur autre plateforme no-code.

**Contenu V1 landing :**
- Proposition de valeur claire (ce qu'Izou fait, pour qui, pourquoi c'est différent)
- Fonctionnalités clés illustrées (scan QR, wallet, dashboard, parrainage)
- Témoignages commerçants pilotes (dès que disponibles)
- CTA inscription commerçant
- Direction artistique alignée avec l'app (même DA, même ton)

**Objectif :** Quand un commerçant recommande Izou à un pair, celui-ci tombe sur une page crédible et professionnelle qui convertit sans avoir besoin du fondateur.

### SEO

Hors scope V1 pour l'application. La landing page Framer intègrera un SEO basique (meta, titres, structured data) de façon native.

## Cadrage Projet & Développement Phasé

### Philosophie MVP

**Approche : MVP de validation par consolidation.** Izou n'est pas un produit à construire — c'est un MVP existant à élaguer, solidifier et polir. La stratégie n'est pas "quel minimum construire" mais "quel maximum retirer pour maximiser la fiabilité et la clarté". Chaque feature conservée doit être irréprochable.

**Ressources :** Dev solo + outils IA. Contrainte forte qui impose des choix radicaux de simplicité. Framer pour la landing page (pas de dev custom). Templates Figma comme base de direction artistique.

### Phase 1 — V1 Consolidée (cible : avril 2026)

**Parcours utilisateur supportés :** Les 5 parcours documentés (commerçant, cliente, employée, edge cases, variante points).

**Must-Have — Conserver et solidifier :**

| Capacité | Justification |
|----------|--------------|
| Tampons / Points (points fixes par visite) | Cœur du produit — sans ça, pas de produit |
| QR intelligent (routage inscription/scan/récupération) | Mécanisme d'interaction validé terrain |
| Cooldown anti-fraude + notification commerçant | Sécurité minimale du modèle client-initié |
| Apple Wallet + notifications push (PWA + Wallet) | "Aha moment" client, différenciateur clé |
| Parrainage par lien | Moteur viral — seul mécanisme d'acquisition organique |
| Dashboard KPIs essentiels | Remplacement du "au feeling", outil de conviction |
| Templates métier (Café, Restaurant, Boulangerie, Snack) | Onboarding < 5 min |
| Personnalisation (couleurs, nom du commerce) | Appropriation commerçant |
| Tampons de bienvenue (Endowed Progress) | +79% de complétion — levier d'activation le plus fort |

**Must-Have — Ajouter :**

| Capacité | Justification |
|----------|--------------|
| Google Wallet | 75% du marché Android — sans ça, 3 clients sur 4 exclus du wallet |
| Tests automatisés (flux critiques) | Pas testé = pas stable = pas livré |
| Fix bug OTP + tous bugs bloquants | Zéro bug sur les parcours critiques |
| Suppression de compte (RGPD) | Obligation légale identifiée comme manquante |
| Optimisation UX / wordings | Chaque seconde de friction = abandon |
| Direction artistique claire | Positionnement premium dès J1 |
| Micro-animations prioritaires | Scan → tampon, progression carte, confetti complétion, transitions fluides |

**Must-Have — Retirer :**

| Feature retirée | Raison | Réintroduction |
|----------------|--------|----------------|
| Roue de la fortune | Complexe (2 tables, 3 endpoints, animation), non essentiel | Phase 2 si demandé |
| Missions gamifiées | 5 endpoints, logique complexe, non validé terrain | Phase 2 simplifiée |
| Surprises au scan | Logique probabiliste, complexifie le flux principal | Phase 2 |
| Goal gradient | Nice-to-have, pas critique | Phase 2 |
| Visites PWA comme mission | Dépendance missions | Phase 2 |
| Duplication src/lib/supabase/ | Dette technique pure | Suppression immédiate |

**En parallèle — Landing Page :**
- Site Framer présentant Izou (valeur, fonctionnalités, CTA inscription)
- DA alignée avec l'app
- Construction en parallèle du pilote, pas bloquante

### Phase 2 — Croissance (post-validation pilote)

Déclencheur : 5 commerçants actifs pendant 3 mois avec clients récurrents.

- Micro-animations avancées et illustrations (app vivante complète)
- Personnalisation avancée (logo upload, couleur secondaire, icône PWA custom)
- Onboarding guidé contextuel
- NFC tag passif comme alternative au QR
- Page Insights / analytics avancées
- Automatisations marketing (relance intelligente, segmentation)
- Mode "commerçant scanne client" comme option secondaire
- Gamification simplifiée (si demandée par les commerçants)
- Points proportionnels au montant (saisie manuelle commerçant)
- Templates métier supplémentaires (Coiffeur, Fleuriste, etc.)
- Témoignages commerçants sur la landing page

### Phase 3 — Vision (expansion)

- Menu intégré au QR (convergence fidélité + carte restaurant)
- Intégration caisse pour ROI en euros réels
- Multi-points de vente
- CRM et marketing multicanal (SMS, newsletters)
- Spécialisation par corps de métier
- Communauté commerçant (événements, nouveautés)
- Parcours alternatif seniors
- Scan ticket / IA pour conversion montant → points

### Stratégie de Mitigation des Risques

**Risques techniques :**

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Google Wallet = nouvelle intégration | Bloquant — 75% du marché | Spike technique dès le début. API JWT-based plus simple qu'Apple. Fallback : PWA seule pour Android |
| Bug OTP persistant | Bloquant — empêche l'inscription | Diagnostic prioritaire. Workaround ou migration du flow OTP si lié à Supabase Auth |
| Tests insuffisants | Instabilité en prod | Couverture tests sur les 5 flux critiques avant le pilote |
| Solo dev = bus factor 1 | Projet fragile | Code simple, documenté, patterns standard. Un autre dev doit pouvoir reprendre |

**Risques marché :**

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Le premier commerçant n'adopte pas | Pas de validation | Accompagnement terrain direct. Mesurer l'adoption dès J1 |
| Les clients ne scannent pas le QR | Mécanisme non validé en réel | QR visible + signalétique + 2 tampons offerts = incitation premier geste |
| Freemium sans conversion payante | Pas de revenus | Tester le pricing dès les premiers pilotes |

**Risques ressources :**

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Trop de travail avant avril | Retard pilote | Scope élagué au maximum. Priorité : fix bugs > Google Wallet > tests > DA |
| Landing page prend trop de temps | Retard sur l'app | Framer no-code, construction en parallèle |

## Exigences Fonctionnelles

### Gestion du Commerce

- **FR1 :** Un commerçant peut créer un compte avec email et mot de passe
- **FR2 :** Un commerçant peut configurer son programme de fidélité via un template métier pré-rempli (Café, Restaurant, Boulangerie, Snack)
- **FR3 :** Un commerçant peut personnaliser l'apparence de son programme (couleurs, nom du commerce)
- **FR4 :** Un commerçant peut choisir entre le mode tampons et le mode points
- **FR5 :** Un commerçant peut configurer les paramètres de son programme (nombre de tampons requis, récompense, points par visite, tampons de bienvenue)
- **FR6 :** Un commerçant peut générer et imprimer un QR code à afficher au comptoir
- **FR7 :** Un commerçant peut obtenir un lien d'inscription direct pour ses clients
- **FR8 :** Un commerçant peut modifier ses informations de profil (email, mot de passe)

### Programme de Fidélité — Tampons

- **FR9 :** Un client peut accumuler des tampons via le scan du QR comptoir
- **FR10 :** Un client peut voir sa progression visuelle (tampons remplis sur le total)
- **FR11 :** Un client peut recevoir des tampons de bienvenue à l'inscription (nombre configurable par le commerçant, 0-3)
- **FR12 :** Le système peut réinitialiser automatiquement les tampons quand la récompense est atteinte

### Programme de Fidélité — Points

- **FR13 :** Un client peut accumuler des points fixes par visite (montant configurable par le commerçant)
- **FR14 :** Un commerçant peut définir des paliers de récompenses avec des seuils en points
- **FR15 :** Un client peut échanger ses points contre une récompense lorsqu'un palier est atteint
- **FR16 :** Un client peut voir ses points actuels et les paliers de récompenses disponibles

### Interaction Client — QR Intelligent

- **FR17 :** Un client peut scanner le QR code du comptoir pour initier une interaction
- **FR18 :** Le système peut détecter si le client est nouveau ou existant et router vers le flux approprié (inscription ou tampon automatique)
- **FR19 :** Un nouveau client peut s'inscrire en moins de 30 secondes (prénom, téléphone, email, OTP)
- **FR20 :** Un client existant peut recevoir un tampon/points automatiquement au scan sans ressaisir ses informations
- **FR21 :** Un client qui re-scanne avec un numéro déjà connu peut être reconnecté à sa carte existante (pas de doublon)
- **FR22 :** Un client peut vérifier son identité via un code OTP envoyé par email

### Wallet & Notifications

- **FR23 :** Un client peut ajouter sa carte de fidélité à Apple Wallet
- **FR24 :** Un client peut ajouter sa carte de fidélité à Google Wallet
- **FR25 :** Le système peut mettre à jour la carte wallet en temps réel après chaque scan (tampons/points)
- **FR26 :** Le système peut envoyer des notifications push via le wallet (Apple + Google) lors d'événements clés (tampon ajouté, récompense atteinte, parrainage réussi)
- **FR27 :** Le système peut envoyer des notifications push via la PWA aux clients abonnés
- **FR28 :** Un commerçant peut envoyer une notification broadcast à tous ses clients
- **FR29 :** Le système peut notifier automatiquement les clients inactifs (> 30 jours)

### Parrainage

- **FR30 :** Un client peut obtenir un lien de parrainage unique et partageable
- **FR31 :** Un nouveau client peut s'inscrire via un lien de parrainage
- **FR32 :** Le système peut attribuer automatiquement les bonus de parrainage au parrain et au filleul
- **FR33 :** Un commerçant peut configurer les bonus de parrainage (points pour parrain et filleul)

### Dashboard & Données Commerçant

- **FR34 :** Un commerçant peut consulter ses KPIs en temps réel (clients total, visites du jour, nouveaux du mois, taux de retour, fréquence moyenne, clients à risque, clients perdus)
- **FR35 :** Un commerçant peut visualiser l'historique des visites sur 7 jours
- **FR36 :** Un commerçant peut voir le top de ses meilleurs clients
- **FR37 :** Un commerçant peut rechercher un client par nom ou téléphone
- **FR38 :** Un commerçant peut consulter le détail d'un client (carte, stats, historique des transactions)
- **FR39 :** Un commerçant peut filtrer ses clients par statut (actifs, à risque, inactifs, perdus)
- **FR40 :** Un commerçant peut exporter la liste de ses clients (CSV)
- **FR41 :** Un commerçant peut recevoir une notification à chaque scan client (inscription ou tampon)

### Anti-fraude & Sécurité

- **FR42 :** Le système peut limiter les scans d'un même client à une fréquence configurable (cooldown 2-4h)
- **FR43 :** Le système peut empêcher un filleul d'être parrainé plus d'une fois par commerce
- **FR44 :** Le système peut appliquer un rate limiting sur toutes les routes sensibles
- **FR45 :** Le système peut isoler les données : un commerçant n'accède qu'à ses propres clients

### Conformité RGPD

- **FR46 :** Un client peut demander la suppression de son compte et de toutes ses données associées
- **FR47 :** Le système peut recueillir le consentement explicite du client à l'inscription
- **FR48 :** Un client peut demander l'export de ses données personnelles

### Administration & Fallback

- **FR49 :** Un commerçant peut ajouter manuellement des tampons/points à un client (fallback si le scan ne fonctionne pas)
- **FR50 :** Un commerçant peut retirer des tampons/points à un client (correction d'erreur)
- **FR51 :** Un commerçant peut réinitialiser la carte d'un client (après récompense distribuée)
- **FR52 :** Un commerçant peut valider manuellement l'échange d'une récompense (mode points)

## Exigences Non-Fonctionnelles

### Performance

| Critère | Cible | Contexte |
|---------|-------|----------|
| Temps de chargement initial (LCP) | < 2s sur 4G mobile | Parcours client : scan → affichage carte |
| Réponse API (scan, inscription, tampon) | < 500ms | Chaque interaction doit sembler instantanée |
| Mise à jour wallet après scan | < 3s | Le client voit sa carte mise à jour immédiatement |
| Chargement dashboard commerçant | < 2s | Consultation rapide entre deux clients |
| Polling carte (intervalle) | 8s | Suffisant V1 — pas de WebSocket |
| Animations et transitions | 60fps | Micro-animations fluides = perception premium |

### Sécurité

| Critère | Mesure |
|---------|--------|
| Chiffrement en transit | HTTPS obligatoire sur toutes les routes |
| Chiffrement au repos | Supabase PostgreSQL (chiffrement natif) |
| Authentification commerçant | Email + mot de passe via Supabase Auth |
| Authentification client | OTP email (6 chiffres, expiration 10 min) |
| Authentification wallet | HMAC-SHA256 avec timingSafeEqual (Apple), JWT (Google) |
| Isolation des données | RLS Supabase — un commerçant ne voit que ses données |
| Rate limiting | Upstash Redis sliding window sur toutes les routes sensibles |
| Secrets côté serveur | Aucune clé sensible exposée côté client |
| Headers de sécurité | X-Frame-Options DENY, HSTS, X-Content-Type-Options nosniff |

### Fiabilité

| Critère | Cible | Contexte |
|---------|-------|----------|
| Disponibilité | > 99.5% (Vercel SLA) | Les scans clients doivent fonctionner en permanence |
| Zéro bug bloquant | 0 bugs P0 en production | Inscription, scan, wallet, dashboard |
| Perte de données | 0 | Backups Supabase, pas de perte de tampons/points |
| Dégradation gracieuse | Si push/wallet échoue, le scan fonctionne | Le cœur ne dépend pas des services annexes |

### Maintenabilité

| Critère | Cible | Contexte |
|---------|-------|----------|
| Couverture tests | 100% des 5 parcours critiques | Inscription, scan, parrainage, wallet, dashboard |
| Complexité code | ~25-30 endpoints (vs 45 actuellement) | Moins de surface = moins de bugs |
| Documentation | Code auto-documenté, patterns standard | Un autre dev doit pouvoir reprendre |
| Dette technique | Suppression duplication src/lib, nettoyage gamification | Avant le pilote |
| Déploiement | Auto-deploy Vercel depuis main | Pas de CI/CD complexe en V1 |

### Intégrations

| Service | Rôle | Criticité |
|---------|------|-----------|
| Supabase (PostgreSQL + Auth) | Base de données, authentification | P0 |
| Apple Wallet (APNs) | Carte wallet iOS + push | P0 |
| Google Wallet (API REST/JWT) | Carte wallet Android | P0 — à ajouter V1 |
| Upstash Redis | Rate limiting | P1 — dégradation gracieuse possible |
| Vercel | Hébergement + CDN + Cron | P0 |
| Framer (landing page) | Site vitrine | P2 — indépendant de l'app |

### Scalabilité

| Critère | Cible V1 | Cible 12 mois |
|---------|---------|---------------|
| Commerçants simultanés | 5-10 | 30-50 |
| Clients inscrits totaux | 500 | 5 000 |
| Scans par jour | 100 | 1 000 |
| Architecture | Monolithe Next.js suffisant | Monolithe toujours suffisant à cette échelle |
