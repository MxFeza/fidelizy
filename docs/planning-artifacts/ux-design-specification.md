---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
lastStep: 14
inputDocuments:
  - '{output_folder}/planning-artifacts/prd.md'
  - 'fidelizy/docs/planning-artifacts/product-brief-izou-2026-03-23.md'
  - 'fidelizy/docs/planning-artifacts/personas-izou-2026-03-27.md'
  - '{output_folder}/planning-artifacts/architecture.md'
  - 'fidelizy/docs/index.md'
workflowType: 'ux-design'
project_name: 'Izou (Fidelizy)'
user_name: 'UX8402'
date: '2026-03-29'
---

# UX Design Specification — Izou (Fidelizy)

**Author:** UX8402
**Date:** 2026-03-29

---

## Executive Summary

### Vision Projet

Izou est le partenaire digital invisible du commerçant de proximité — une plateforme qui donne aux coffee shops, restaurants rapides et boulangeries les mêmes armes d'engagement client que les grandes enseignes, sans friction ni matériel dédié.

Contexte : brownfield MVP en production. La V1 consolidée élague la gamification lourde (roue, missions, surprises) et resserre le cœur sur : tampons/points + parrainage + wallet (Apple + Google) + dashboard KPIs.

Deux interfaces distinctes mais cohérentes :
- **App client mobile (PWA)** — scan QR, carte fidélité, progression, wallet, parrainage, notifications push
- **Dashboard commerçant (web responsive)** — KPIs, liste clients, configuration programme, broadcast, personnalisation

### Utilisateurs Cibles

**Commerçants :**
- **Jérémy** (primaire) — jeune indépendant connecté, 28-38 ans. Décide en < 5 min, veut voir des résultats en J1. Sensible au bouche-à-oreille entre pairs.
- **Nadia** (secondaire, Phase 2) — commerçante établie peu digitale, 42-55 ans. Nécessite accompagnement humain pour l'onboarding.
- **Les employés** (Katia, Fati) — doivent être convaincus autant que le patron. Si ça prend du temps → abandon immédiat.

**Clients finaux :**
- **Yasmine** (primaire) — étudiante 18-24 ans, génération Instagram/TikTok. Partage sur les réseaux sociaux (stories, DMs), pas principalement WhatsApp. L'esthétique des écrans doit être "story-worthy" — screenshotable et partageable. Wallet = canal naturel.
- **Karim** (secondaire) — jeune actif 25-35 ans. Fidèle par l'expérience MAIS aussi sensible aux bons plans de manière réfléchie. Conscient du coût de la vie, fait des choix intelligents. Veut voir concrètement ce qu'il économise et gagne.

**Hors cible V1 :** Seniors 65+ (Monique)

### Défis UX Clés

1. **Le premier scan est le goulot critique** — Inscription client < 30s, 2 tampons offerts (Endowed Progress +79%). Chaque seconde de friction = abandon (validé terrain).

2. **Deux audiences, deux langages UX** — Dashboard data/professionnel pour le commerçant, app vibrante/émotionnelle pour le client. Deux mondes visuels partageant une même identité Izou chaleureuse et vivante.

3. **Izou s'efface derrière le commerçant** — Des concurrents premium existent. Le différenciateur n'est pas juste "être beau" — c'est donner au commerçant un espace qui est le SIEN. Ses couleurs, son nom, son identité. Le client voit "le programme de Samir", pas "une app Izou". La personnalisation est un levier d'appropriation fondamental.

4. **Zéro effort en rush** — Le client initie le geste (QR comptoir). L'employé n'a rien à faire. Le dashboard se consulte "entre deux clients" sur mobile.

5. **Feedback émotionnel et esthétique partageable** — Les "aha moments" doivent être visuellement satisfaisants ET partageables sur les réseaux sociaux (Instagram, TikTok). Progression des tampons, confetti, écrans de succès immersifs.

### Opportunités UX

1. **L'écran de succès comme signature partageable** — Chaque tampon, récompense ou parrainage réussi = célébration visuelle "story-worthy" que Yasmine a envie de screenshoter et poster.

2. **Palette chaleureuse et vivante** — Interface organique et accueillante (inspirée du système de thèmes Coinstar), adaptée à l'univers du commerce de proximité. Riche, harmonieuse, humaine — pas froide ni corporate.

3. **Le QR intelligent comme magie invisible** — Un seul QR = 3 flux (inscription / scan / récupération). Le client ne voit jamais de complexité.

4. **Le dashboard qui remplace le "au feeling"** — Rendre la data actionnable et humaine : "12 clients à risque cette semaine" plutôt que des chiffres bruts. Montrer à Karim ce qu'il économise concrètement.

5. **La personnalisation comme fierté** — Le commerçant personnalise couleurs, nom, récompenses. Izou devient l'extension de SA marque. Il est fier de montrer SON programme à ses clients.

## Core User Experience

### Expérience Fondatrice

**L'atome d'Izou : le scan QR au comptoir.** Tout le reste en découle.

Le client sort son téléphone, scanne, et en 3 secondes quelque chose de positif se passe — soit il s'inscrit (1ère fois), soit il reçoit un tampon (habitué), soit il récupère sa carte (retour après absence). Un seul geste, trois flux invisibles.

Si ce geste est fluide, rapide et satisfaisant → tout le reste fonctionne : le wallet se remplit, les notifications partent, le parrainage se propage, le dashboard se peuple. Si ce geste échoue ou prend trop de temps → rien ne fonctionne.

### Stratégie Plateforme

| Interface | Plateforme | Usage principal | Priorité |
|-----------|-----------|-----------------|----------|
| **Carte client** | PWA mobile (iOS Safari + Android Chrome) | Scan QR, progression, wallet, parrainage | P0 — mobile-first, touch |
| **Dashboard commerçant** | Web responsive | KPIs, clients, config, broadcast | P0 — desktop principal, mobile consultation |
| **Landing page** | Framer (indépendant) | Acquisition commerçants | P2 — en parallèle |

**Capacités plateforme exploitées :**
- Apple Wallet + Google Wallet — carte persistante + push natif
- PWA — installable sur écran d'accueil, icône personnalisée par commerce
- Camera native — scan QR sans app à télécharger
- Pas d'offline nécessaire en V1 — le scan nécessite la connexion

### Interactions Sans Effort

| Interaction | Cible | Comment |
|-------------|-------|---------|
| **Scan → tampon** (client reconnu) | < 3 secondes, zéro tap | QR → détection auto → tampon + feedback visuel + mise à jour wallet |
| **Premier scan → inscription** | < 30 secondes | QR → formulaire minimal (prénom + tel pré-rempli) → OTP → 2 tampons offerts → ajout wallet |
| **Consultation dashboard** | < 2 taps vers n'importe quelle info | Ouverture → KPIs visibles immédiatement, sans scroll pour les métriques clés |
| **Parrainage** | 1 tap → partage | Bouton partage → sélecteur natif (Instagram, TikTok, SMS, copier lien) |
| **Récompense** | Automatique | Carte complète → notification client + notification commerçant → validation 1 tap |

### Moments Critiques de Succès

1. **Le premier scan (make-or-break)** — Le client voit le QR, hésite 2 secondes. Il scanne. Si en 25 secondes il a sa carte avec 2 tampons dans son wallet → gagné. Si un écran de chargement, un bug OTP, ou un formulaire trop long apparaît → perdu pour toujours.

2. **Le "aha moment" commerçant — la première notification** — Le téléphone de Samir vibre : "Inès vient de s'inscrire". Il n'a rien fait. Ça tourne tout seul. C'est là qu'il comprend la valeur.

3. **Le "aha moment" client — la progression dans le wallet** — Yasmine ouvre son wallet, voit 5/10 tampons aux couleurs du coffee shop de Samir. C'est aussi premium que sa carte Starbucks. Elle screenshot et poste en story.

4. **La récompense — le moment de fierté** — "Tu as un café offert !" — notification push. Yasmine va le chercher, Samir valide en 1 tap. Moment de satisfaction partagé. C'est ici que le cycle viral démarre.

5. **Le parrainage qui marche — la preuve pour le commerçant** — Dashboard : "3 nouveaux clients cette semaine via parrainage". Samir n'a rien fait, son programme recrute tout seul. C'est ici qu'il recommande Izou à un pair.

### Principes d'Expérience

1. **"Le geste de 3 secondes"** — Chaque interaction client (scan, consultation, partage) doit se compléter en moins de 3 secondes. Si ça prend plus, c'est qu'on a échoué.

2. **"C'est SON programme, pas le nôtre"** — Izou est invisible. L'expérience client porte les couleurs, le nom et l'identité du commerçant. Le client ne sait même pas qu'il utilise Izou — il utilise le programme de fidélité de son café.

3. **"Ça tourne tout seul"** — Le commerçant et l'employé n'interviennent jamais dans le flux principal. Inscriptions, tampons, notifications, parrainages — tout est automatique. Le dashboard est un outil de lecture, pas d'action quotidienne.

4. **"Chaque moment compte visuellement"** — Les interactions produisent un feedback visuel chaleureux et satisfaisant — animations de remplissage, confetti, écrans de succès. L'app doit donner envie de screenshoter et partager.

5. **"Les métriques d'abord, l'histoire ensuite"** — Le dashboard affiche les KPIs bruts en priorité (scans du jour, nouveaux inscrits, visites totales) — le commerçant veut savoir ce qui s'est passé aujourd'hui. Une couche d'interprétation humaine complète ces chiffres en les traduisant en insights actionnables : "Vos clients reviennent 2x plus souvent", "12 clients inactifs depuis 2 semaines". Les deux coexistent — les métriques froides pour le suivi quotidien, le langage humain pour la prise de décision.

## Réponse Émotionnelle Souhaitée

### Objectifs Émotionnels Primaires

**Client final :** "Je fais partie de quelque chose" — reconnaissance, valorisation, appartenance. Le programme du commerce me reconnaît et me récompense. C'est MON café, et j'ai MA carte.

**Commerçant :** "Je maîtrise enfin ma fidélisation" — le passage du "au feeling" à "je vois ce qui se passe". Sentiment de contrôle sans charge de travail. Fierté de montrer SON programme.

**Employé :** "Ça ne me dérange pas" — le plus grand compliment. Soulagement que ce soit autonome, facilité d'utilisation en rush. Zéro charge mentale ajoutée.

### Carte Émotionnelle par Moment

| Moment | Client | Commerçant | Employé |
|--------|--------|------------|---------|
| **Découverte (QR comptoir)** | Curiosité → "Tiens, c'est quoi ?" | — | — |
| **Premier scan / inscription** | Surprise positive → "2 tampons direct !" | Fierté → "Mon programme tourne" | — |
| **1ère notification d'inscription** | — | Excitation → "Quelqu'un s'inscrit tout seul !" | — |
| **Scan quotidien (3 sec)** | Satisfaction discrète → réflexe | Tranquillité → ça tourne | Soulagement → rien à faire |
| **Client demande sa récompense** | — | — | Facilité → validation 1 tap |
| **Progression wallet** | Plaisir → "Plus que 3 !" | — | — |
| **Push "Plus qu'un tampon !"** | Anticipation → détour vers le commerce | — | — |
| **Récompense atteinte** | Fierté + gratification → "J'ai gagné !" | Plaisir de donner → 1 tap | Facilité → processus évident |
| **Parrainage** | Générosité → partager sur Insta/TikTok | Émerveillement → "Ils viennent seuls" | — |
| **Preview personnalisation** | — | Fierté → "C'est MON programme, c'est pro" | — |
| **Consultation dashboard** | — | Clarté → chiffres du jour en un regard | — |
| **Insights humains** | — | Intelligence → "Je comprends ce qui se passe" | — |
| **Découverte des options premium** | — | Envie → "Je veux ÇA pour mes clients" | — |
| **Écran de succès / confetti** | Joy → moment "story-worthy" | — | — |
| **Erreur / bug** | Patience → message clair, solution évidente | Confiance → fallback manuel | Facilité → pas besoin d'aide |

### Gradient Émotionnel Freemium → Premium

La stratégie freemium génère un **gradient de désir**, pas de frustration. La version gratuite est complète, fluide et qualitative — c'est elle qui crée la traction. La version premium va PLUS LOIN sans jamais brider l'expérience de base.

**Principe fondateur :** Ne jamais dégrader le gratuit pour vendre le payant. Le gratuit doit être suffisamment bon pour convaincre le commerçant et ses clients. Le premium doit être suffisamment désirable pour que l'upgrade soit une évidence émotionnelle, pas une nécessité fonctionnelle.

| Dimension | Gratuit (complet et fluide) | Premium (aller plus loin) |
|-----------|---------------------------|--------------------------|
| **Design carte client** | 1 design de carte soigné et premium | 2+ designs au choix que le client peut sélectionner |
| **Personnalisation** | Nom + logo du commerce | Bannières, palette de couleurs poussée, personnalisation avancée |
| **Animations & feedback** | Confetti, célébrations, transitions fluides — l'expérience complète | Identique — jamais bridé |
| **Dashboard** | KPIs essentiels, données du jour | Insights humains, tendances, alertes proactives |

**Réflexion stratégique à conserver :** La frontière gratuit/premium n'est pas encore figée en features — elle émergera de l'usage terrain. Ce qui compte pour le design UX : prévoir l'architecture pour que le premium soit un prolongement naturel, et que le commerçant soit guidé vers l'upgrade par l'envie, jamais par la contrainte.

### Micro-Émotions

| À cultiver | Comment | À éviter | Comment |
|-----------|---------|----------|---------|
| **Confiance** | OTP fluide, feedback immédiat, données sécurisées | **Méfiance** | Jamais de collecte non expliquée, pas de dark patterns |
| **Fierté** | Programme aux couleurs du commerçant, carte belle dans le wallet | **Honte** | Jamais de message culpabilisant |
| **Accomplissement** | Progression visible, célébration à chaque palier | **Frustration** | Jamais de chargement sans feedback, jamais de dead-end |
| **Appartenance** | "Bienvenue chez [Commerce] !", nom du commerce partout | **Anonymat** | Jamais de "Cher client" générique |
| **Surprise positive** | Tampons de bienvenue, confetti, notification récompense | **Agacement** | Jamais de spam, cooldown respecté |
| **Soulagement** (employé) | Autonomie totale, rien à faire, validation 1 tap | **Surcharge** | Jamais d'étape supplémentaire imposée à l'employé |
| **Envie** (freemium) | Preview des options premium dans la personnalisation | **Frustration** | Le gratuit reste fonctionnel et digne, jamais dégradé |
| **Sérénité** (commerçant) | Dashboard lisible, KPIs immédiats, "ça tourne tout seul" | **Anxiété** | Jamais de données confuses, pas de surcharge d'infos |

### Principes de Design Émotionnel

1. **"La chaleur habille l'efficacité"** — L'interface est d'abord efficace (3 secondes, zéro friction), puis la chaleur visuelle vient habiller cette efficacité — couleurs vivantes, animations fluides, typographie soignée. Les deux ne s'opposent pas : la chaleur est le vêtement d'une mécanique impeccable.
   *Test décisionnel : si l'animation ralentit l'interaction, elle doit être raccourcie ou supprimée.*

2. **"Célébrer, jamais culpabiliser"** — Chaque palier atteint est fêté. Un client inactif reçoit "On vous garde une place !", jamais un reproche. Le commerçant voit "12 clients à risque" comme une opportunité, pas un échec.
   *Test décisionnel : entre deux formulations, choisir celle qui donne envie de revenir, pas celle qui fait culpabiliser de ne pas être venu.*

3. **"Le premium accessible"** — Le design donne l'impression d'un service haut de gamme, même pour un coffee shop de quartier. La qualité visuelle n'est pas réservée aux grandes enseignes.
   *Test décisionnel : si un commerçant hésite à montrer un écran à un client, c'est que le design n'est pas assez premium.*

4. **"Le gratuit crée la traction, le premium crée la fierté"** — Le freemium ne bride jamais l'expérience de base. Le gratuit est complet, fluide et qualitatif — c'est lui qui convainc. Le premium prolonge l'expérience avec plus de choix, plus de personnalisation, plus de profondeur. L'upgrade est une envie naturelle, pas un mur.
   *Test décisionnel : face à une feature, se demander "est-ce que le gratuit reste digne sans elle ?" et "est-ce que le premium crée de l'envie avec elle ?"*

## UX Pattern Analysis & Inspiration

### Produits Inspirants pour les Utilisateurs Cibles

| App | Ce qu'elle fait bien | Pattern transférable pour Izou |
|-----|---------------------|-------------------------------|
| **Starbucks** | Carte fidélité wallet, progression étoiles, récompenses claires, push contextuels | Benchmark direct — Izou = "aussi premium que Starbucks pour mon café de quartier" |
| **McDo (MyMcDo)** | Deals personnalisés, QR en caisse, feedback instantané | Le scan QR en caisse est un geste connu — capitaliser sur ce réflexe |
| **Instagram** | Stories partageables, esthétique soignée, notifications habituelles | Écrans de succès "story-worthy" composés pour le screenshot |
| **Apple Wallet** | Cartes persistantes, push contextuels, design épuré par carte | Canal principal de fidélité — Izou doit s'y sentir chez lui |

### Analyse des Templates Figma d'Inspiration

#### Template 1 — Fintech iOS (Coinstar)

**Patterns retenus :**
- Design system structuré : palette primary/secondary/tertiary + neutrals, typography scale XL→XS, spacing progressif, corner radius sm→xl→round
- Wallet/Transactions : header coloré avec donnée principale + mini-graphe, liste avec avatars
- Statistics : donut chart avec montant central, toggle Graph/List, vue calendrier
- Onboarding : illustrations + pagination dots + CTA simple (3 étapes)
- Dark mode : inversion propre, accents préservés

**Force principale :** La rigueur du design system — chaque composant dans un cadre cohérent = perception premium.

#### Template 2 — QPay (Digital Wallet)

**Patterns retenus :**
- Home : salutation personnalisée, solde/progression en grand, actions rapides en pills, bannière parrainage intégrée
- Scan QR : viseur sur fond sombre, bouton "My Code"
- OTP : inputs séparés par chiffre, CTA prominent, lien "Didn't receive?"
- Écran de succès "All Done!" : fond coloré immersif, cercle lumineux + check — LE pattern pour feedback tampon/récompense
- Insights : bar chart avec mois courant en évidence, catégories avec icônes rondes
- Profil avec bannière parrainage : visible partout, jamais enfoui
- Cards (designs variés) : pattern clé pour le freemium (1 design gratuit, 2+ premium)

**Force principale :** L'énergie et la personnalité — identité forte et mémorable, écrans de succès émotionnels.

#### Template 3 — WEAVE (Banking Dashboard)

**Patterns retenus :**
- Dashboard layout : sidebar gauche + header + grid de cartes blanches sur fond gris clair
- KPI cards : 4 cards horizontales avec icône colorée + montant + tendance (%) + sparkline
- Charts combinés : bar chart + line chart multi-séries + donut
- Table de données : avatars, colonnes triables, statuts colorés (Active/Inactive/Pending)
- Version mobile : KPI cards empilées verticalement, charts plein écran
- Modales : overlay propre avec formulaire structuré

**Force principale :** La lisibilité de la data — KPIs immédiatement compréhensibles, statuts colorés pour scan visuel rapide.

### Fondation Technique : Untitled UI React

**Décision :** Adopter Untitled UI React comme fondation du design system Izou.

**Justification :**
- Stack identique (Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript 5)
- Système de CSS variables `--color-brand-*` (50→950) parfait pour la personnalisation par commerçant au runtime
- Modèle copy-paste : pas de dépendance npm, le code est possédé
- Tier gratuit couvre 90% des besoins (Tables, Charts, KPI cards, Sidebar, Modals, Inputs, Buttons)
- React Aria pour l'accessibilité native
- PRO ($349 one-time) reporté — achat si besoin ultérieur

**Architecture à deux couches visuelles :**

| Couche | Composants | Outils | Ton |
|--------|-----------|--------|-----|
| **Dashboard commerçant** | Untitled UI React (tables, KPIs, sidebar, forms, modals) | Tailwind + Recharts | Professionnel, data, sobre-premium |
| **App client mobile** | Composants custom Izou (carte fidélité, scan, progression, succès, parrainage) | Tailwind + Framer Motion | Chaleureux, vivant, émotionnel |
| **Tokens partagés** | `theme.css` avec palette Izou remplaçant le violet par défaut | CSS variables `--color-brand-*` | Identité unifiée |

Cette architecture résout le défi "deux audiences, deux langages UX" identifié à l'étape 2 : la cohérence est au niveau des tokens (couleurs, spacing, radius), pas au niveau des composants.

### Univers Visuel & Illustrations

**Vision :** L'interface Izou intègre des illustrations qui donnent vie et chaleur à l'expérience — pas un SaaS froid ni du corporate, mais quelque chose d'organique et convivial qui reflète le commerce de proximité.

**Emplacements clés pour les illustrations :**
- Onboarding commerçant (3 étapes illustrées)
- Empty states ("Pas encore de clients ? Voici comment démarrer")
- Écrans de succès (récompense, parrainage)
- Designs de cartes fidélité (le cœur visuel d'Izou)

**Approche pragmatique :**
- V1 pilote : pack d'illustrations existant adapté aux couleurs Izou (rapide, propre)
- V2 post-validation : illustrations custom créant l'identité unique d'Izou

**Brief visuel à définir :** le style, le ton et les scènes clés seront verrouillés quand les inspirations du stakeholder seront partagées. Prévoir l'espace dans le design pour l'intégration naturelle des illustrations.

### Anti-Patterns à Éviter

| Anti-pattern | Risque pour Izou |
|-------------|-----------------|
| Menu hamburger sur mobile | Actions clés (scan, parrainage) doivent rester visibles |
| Onboarding en 10+ écrans | Jérémy décroche — template métier en 1 clic |
| Dashboard surchargé | Le commerçant fuit — KPIs essentiels en haut, détails en scroll |
| Notifications génériques | Chaque push doit être contextuel et actionnable |
| Design carte générique | Personnalisation couleurs/nom dès le gratuit |
| Parrainage enfoui dans les settings | Visible dans la home ET le profil |
| Formulaires avec validation finale | Validation inline en temps réel |

### Stratégie d'Inspiration

**Adopter :** Layout dashboard WEAVE, flow OTP QPay, écran de succès immersif QPay, bannière parrainage QPay, design system structuré Coinstar, fondation Untitled UI React.

**Adapter :** Home QPay → carte client Izou, Cards QPay → designs carte fidélité freemium, KPI cards WEAVE → métriques commerçant, Insights QPay → stats commerçant, palette Coinstar → palette Izou chaleureuse.

**Ne pas reprendre :** Violet/lime QPay brut, illustrations géométriques Coinstar, world map WEAVE, dark mode en V1.

## Design System Foundation

### Choix du Design System

**Approche hybride : Untitled UI React (fondation) + composants custom Izou (métier)**

Ni full custom (trop lent pour un solo dev avec pilote avril 2026), ni système établi pur (trop générique pour la personnalisation commerçant et l'expérience client émotionnelle). Un socle éprouvé pour le "mobilier standard" + du sur-mesure pour le cœur du produit.

### Justification

| Critère | Décision | Raison |
|---------|----------|--------|
| **Stack** | Untitled UI React | Exact match : Next.js 16 + React 19 + TW4 + TS5 |
| **Personnalisation brand** | CSS variables `--color-brand-*` | 12 shades auto-générées, swap runtime par commerçant |
| **Vitesse de dev** | Composants prêts (tables, KPIs, sidebar, forms) | Solo dev — chaque jour compte |
| **Propriété du code** | Modèle copy-paste (MIT) | Pas de dépendance npm, code possédé |
| **Premium feel** | Design system Figma le plus populaire au monde | Qualité visuelle intégrée dès le départ |
| **Accessibilité** | React Aria (Adobe) natif | WCAG intégré sans effort supplémentaire |
| **Dark mode** | CSS variables avec inversion native | Prêt Phase 2 sans refactoring |

### Architecture d'Implémentation

Deux couches visuelles, un socle de tokens :

**Tokens partagés (`theme.css`) :**
- `--color-brand-*` (50→950) → personnalisé par commerçant au runtime
- `--color-utility-*` (red, green, yellow, etc.) → couleurs fonctionnelles
- Spacing, radius, shadows, typography → cohérence globale

**Couche 1 — Dashboard commerçant :**
- Composants Untitled UI React (Tables, KPI cards, Sidebar, Modals, Inputs, Buttons, Charts Recharts, Notifications)
- Ton : professionnel, data, sobre-premium

**Couche 2 — App client mobile (PWA) :**
- Composants custom Izou (carte fidélité animée, écran de scan QR, progression tampons, écran de succès, parrainage, onboarding, illustrations)
- Ton : chaleureux, vivant, émotionnel
- Framer Motion pour les animations complexes

### Stratégie de Personnalisation

**Mécanisme runtime :** Le commerçant choisit sa couleur principale → le système génère automatiquement les 12 shades (50→950) → toutes les CSS variables `--color-brand-*` sont mises à jour → l'ensemble de l'interface client s'adapte (carte, wallet, notifications, PWA).

**Niveaux de personnalisation (freemium) :**

| Niveau | Ce qui est personnalisable |
|--------|--------------------------|
| **Gratuit** | Nom du commerce, logo, 1 couleur principale (→ 12 shades auto), 1 design de carte |
| **Premium** | Palette étendue (principale + secondaire + accent), 2+ designs de carte au choix, bannières, personnalisation avancée |

**Principe :** Les animations, confetti et transitions fluides sont identiques en gratuit et premium — jamais bridés. Le premium ajoute de la profondeur visuelle, pas de la fonctionnalité de base.

### Palette Izou (à définir)

La palette par défaut d'Untitled UI (violet) sera remplacée par une palette Izou chaleureuse et vivante, inspirée du système de thèmes Coinstar — riche, harmonieuse, organique.

**Tokens sémantiques conservés d'Untitled UI :**
- `text-primary`, `text-secondary`, `text-tertiary`
- `bg-primary`, `bg-secondary`, `bg-brand-solid`
- `border-primary`, `border-brand`
- `fg-success`, `fg-warning`, `fg-error`

**Direction chromatique :** Palette principale chaleureuse (à valider avec les inspirations du stakeholder), complétée par les couleurs utilitaires standard (vert succès, rouge erreur, jaune warning, bleu info).

### Composants Custom Prioritaires (V1)

| Composant | Usage | Technologie |
|-----------|-------|-------------|
| **Carte fidélité** | Cœur visuel — wallet + PWA, progression tampons animée | React + Framer Motion + CSS vars brand |
| **Écran de succès** | Feedback tampon/récompense/parrainage — "story-worthy" | React + Framer Motion (full screen immersif) |
| **QR intelligent** | Affichage du QR personnalisé aux couleurs du commerce | React + qrcode.react + CSS vars brand |
| **Progression tampons** | Visualisation animée du remplissage | React + Framer Motion |
| **Bannière parrainage** | Intégrée home + profil, jamais enfouie | React + CSS vars brand |
| **Bottom tab bar** | Navigation client mobile (Carte, Historique, Scan, Parrainage, Profil) | React + CSS |

## Expérience Utilisateur Détaillée

### Expérience Fondatrice en une phrase

**Client :** "Tu scannes le QR au comptoir, t'as direct des tampons, et quand ta carte est pleine t'as un café offert. C'est dans ton wallet."
**Commerçant :** "Tu colles un QR, les clients scannent tout seuls, et toi tu vois tout sur ton téléphone."

### Modèle Mental des Utilisateurs

- **Le client** pense "carte à tamponner digitale" — le geste mental est le même que la carte carton. "Ma carte du café de Samir", pas "l'app Izou".
- **Le commerçant** pense "caisse enregistreuse" — "à la fin de la journée, combien de scans, combien de nouveaux, est-ce que ça marche ?"
- **L'employé** pense "un truc en plus ou pas ?" — si la réponse est "non, rien à faire", c'est adopté.

### Mécanique 1 — Premier scan (inscription)

| Phase | Ce qui se passe | Feedback |
|-------|----------------|----------|
| **Scan QR** | Client ouvre caméra, scanne le QR au comptoir | QR gros, bien éclairé, signalétique "2 tampons offerts" |
| **Détection** | Système détecte : client inconnu → page d'inscription | Transition fluide |
| **Prénom** | Champ unique : "Comment vous appelez-vous ?" | Auto-focus, clavier ouvert |
| **Carte créée** | 2 tampons apparaissent avec animation de remplissage | Feedback visuel immédiat — la carte existe |
| **Sécurisation** | "Entrez votre numéro pour sécuriser votre carte" → téléphone (pré-rempli) → OTP email (coût zéro via Supabase Auth, déjà en place) | Carte créée AVANT l'OTP — le client voit sa valeur avant de donner ses infos |
| **Ajout wallet** | Bouton "Ajouter au Wallet" → carte dans Apple/Google Wallet | Encouragé fortement, pas bloquant |
| **Notification commerçant** | "[Prénom] vient de s'inscrire" | Push discret |

**Durée cible :** ~15-20 secondes (prénom + téléphone pré-rempli + OTP).
**Sécurité :** L'OTP sécurise le compte dès la création. À chaque reconnexion (cookie perdu, changement de téléphone), l'OTP prouve l'identité — personne ne peut voler une carte juste en connaissant un numéro.

### Mécanique 2 — Scan quotidien (client reconnu)

| Phase | Ce qui se passe | Feedback |
|-------|----------------|----------|
| **Scan** | Client re-scanne le même QR | Geste de quelques secondes |
| **Détection** | Système reconnaît le client (cookie/session ou reconnexion wallet) | Pas de formulaire |
| **Tampon** | +1 tampon ajouté automatiquement | Animation de remplissage |
| **Wallet** | Carte wallet mise à jour en < 3s | Progression visible |
| **Anti-fraude** | Re-scan < 2h → "Tampon déjà enregistré" | Message clair |

**Persistance de l'identité (par ordre de fiabilité) :**
1. Cookie/session navigateur (fragile — nav privée, changement de tel)
2. PWA installée sur écran d'accueil (stockage local plus durable)
3. Wallet Apple/Google (le plus fiable — persiste entre appareils via iCloud/Google)
4. Reconnexion par téléphone + OTP (fallback si tout est perdu)

**Notifications groupées :** Si > 2 scans en 5 minutes, le commerçant reçoit un résumé ("3 clients ont scanné") au lieu de 3 vibrations.

### Mécanique 3 — Récompense

| Phase | Ce qui se passe | Feedback |
|-------|----------------|----------|
| **Déclenchement** | 10/10 tampons atteints | Écran de succès immersif (confetti, couleurs du commerce) |
| **Auto-validation** | Client appuie "Utiliser ma récompense" → **code visuel éphémère** affiché (ex: "CAFÉ-7829", valide 5 min, gros et lisible) | Preuve visuelle indiscutable |
| **Échange** | Client montre le code à l'employé, l'employé sert la récompense | L'employé n'a RIEN à chercher — il voit le code et sert |
| **Réinitialisation** | Carte remise à 0 automatiquement après utilisation du code | Nouveau cycle démarre |
| **Notification** | Commerçant notifié : "Récompense utilisée par [Prénom]" | Traçabilité sans intervention |

**Pourquoi ce système fonctionne à chaque fois :** Le code visuel éphémère est généré côté serveur, unique, horodaté, et à usage unique. Pas de dashboard à consulter, pas de confiance aveugle, pas de validation manuelle. Le client initie, le code prouve, l'employé sert.

### Mécanique 4 — Parrainage (deux canaux)

**Canal 1 — Lien direct (DM, SMS) :**

| Phase | Ce qui se passe |
|-------|----------------|
| **Découverte** | Bannière visible dans la carte ET le profil |
| **Partage** | 1 tap → sélecteur natif → lien personnalisé envoyé |
| **Inscription filleul** | Clic → landing mini "Ouvrir dans le navigateur" → inscription avec attribution auto |
| **Bonus** | Parrain + filleul reçoivent les tampons bonus automatiquement |

**Canal 2 — Attribution au comptoir :**

| Phase | Ce qui se passe |
|-------|----------------|
| **Découverte** | Yasmine poste sa carte en story Instagram/TikTok → son ami voit le nom du commerce |
| **Conversion** | L'ami passe devant le commerce, scanne le QR physique |
| **Attribution** | À l'inscription : "Quelqu'un vous a recommandé ?" → sélection du parrain |
| **Bonus** | Parrain notifié + bonus attribués |

**Insight :** La story Instagram/TikTok est un canal de NOTORIÉTÉ (le nom du commerce doit être bien visible sur la carte), le lien direct est un canal de CONVERSION. Les deux coexistent.

### Mécanique 5 — Dashboard commerçant

**Écran d'accueil = Feed d'activité :**

Le commerçant ouvre son dashboard et voit un journal chronologique des événements du jour — comme il consulte sa caisse. Pas un tableau de bord d'analyste.

```
Aujourd'hui
  ☕ Inès a scanné — 7/10 tampons
  🎉 Marc a complété sa carte ! Récompense utilisée (CAFÉ-4521)
  👋 Nouveau : Léa s'est inscrite (via parrainage de Inès)
  ☕ Karim a scanné — 4/10 tampons

Cette semaine : 12 scans · 3 nouveaux · 1 parrainage
💡 "Vos clients reviennent en moyenne tous les 3 jours"
```

**Sous-pages pour creuser :**
- **Statistiques** → KPI cards (style WEAVE) + charts (bar: scans/jour, line: évolution, donut: statuts clients)
- **Clients** → Table avec statuts colorés (actif/à risque/inactif), recherche, filtres, détail
- **Configuration** → Programme, personnalisation, QR, parrainage

**Version mobile :** Feed d'activité seul, KPIs résumés en 4 chiffres. Charts et tables en sous-pages. Pas de sidebar — bottom nav simplifié.

**Alerte proactive :** Si 0 scans sur un jour habituellement actif → "Votre QR est-il toujours en place ?"

### Mécanique 6 — Espace multi-commerces (client)

Quand un client a plusieurs cartes de commerces Izou, son espace PWA affiche une **collection de cartes**, chacune aux couleurs du commerce.

**Principes :**
- Chaque carte est un monde visuel autonome (couleurs, nom, récompense du commerce)
- La liste des cartes est le seul espace "neutre" — hub de navigation sobre
- Scanner le QR d'un nouveau commerce ajoute automatiquement la carte à la collection
- Chaque carte existe aussi dans le wallet (indépendamment de la PWA)
- Isolation totale des données entre commerces (le commerçant ne voit que ses clients)

### Ton des Messages par Template Métier

Les messages et notifications adoptent un ton adapté au type de commerce, choisi à l'onboarding :

| Template | Ton | Exemple notification |
|----------|-----|---------------------|
| **Café / Snack** | Décontracté | "Plus que 3 avant ton café offert ! ☕" |
| **Boulangerie** | Chaleureux | "Merci de votre fidélité ! Votre croissant vous attend." |
| **Restaurant** | Convivial | "On vous garde une table et un dessert offert ! 🍽️" |

### Critères de Succès

| Interaction | Métrique | Seuil |
|-------------|---------|-------|
| Premier scan → inscription | Temps total | < 20 secondes |
| Scan quotidien → tampon | Temps total | < 3 secondes |
| Taux de complétion inscription | % de scans aboutis | > 70% |
| Ajout wallet | % des inscrits | > 50% |
| Taux de parrainage | % des inscrits qui parrainent | > 15% |
| Consultation dashboard | Fréquence | Quotidienne |

## Visual Design Foundation

### Philosophie Visuelle

**Concept : "Forêt au Soleil"** — Un vert profond chaleureux + un noir élégant comme ancrage, complétés par un écosystème LUMINEUX et VIBRANT de couleurs en aplats. L'ambiance globale est baignée de lumière ambrée/dorée.

**Inspiration directe :** La logique de DA de Shine.fr (warm minimalism, optimistic & grounded) adaptée à l'univers de la fidélisation client. Shine utilise le noir (cartes, boutons) et le vert forêt (headings, sections) comme ancrage, avec du jaune en aplat — jamais en dégradé. Izou suit cette même logique.

**Principe fondateur :** Des aplats de couleur propres, simples et professionnels. JAMAIS de dégradés. La chaleur vient de la LUMIÈRE (fonds crème, accents ambrés, photographies chaleureuses) et de la simplicité. Chaque écran doit respirer : simple, efficace, professionnel, chaleureux et accueillant.

### Color System

#### Noir — Ancrage principal

| Token | Hex | Nom | Usage |
|-------|-----|-----|-------|
| `izou-black` | `#1E1E1E` | Noir | Boutons principaux, nav, texte fort, cartes premium |

*Comme Shine utilise le noir pour ses cartes bancaires et ses boutons CTA. Le noir est l'ancrage d'élégance et de professionnalisme.*

#### Vert forêt — Identité Izou

| Token | Hex | Nom | Usage |
|-------|-----|-----|-------|
| `izou-forest` | `#1E3A2F` | Forêt | Sections colorées, fonds premium, headings d'accent |
| `izou-forest-medium` | `#2A5C46` | Émeraude | Liens, éléments secondaires, success |
| `izou-forest-soft` | `#3D7A60` | Feuille | Hover, bordures actives |

*Le vert forêt est la couleur identitaire d'Izou — utilisé en sections pleines (comme Shine) et non en boutons principaux (c'est le rôle du noir).*

#### Jaune — Couleur dominante

| Token | Hex | Nom | Usage |
|-------|-----|-----|-------|
| `izou-yellow` | `#F9D714` | Jaune Izou | Couleur DOMINANTE — highlights, badges, récompenses, fonds accent, boutons secondaires, célébrations |
| `izou-yellow-light` | `#FFF8D6` | Jaune clair | Fonds accent doux, pills secondaires |
| `izou-yellow-dark` | `#D4B40F` | Jaune foncé | Hover sur jaune, bordures accent |

*Exactement comme Shine avec son jaune signature (#FFF389). Le jaune est la couleur que l'on voit en PREMIER — elle domine l'expérience. Le noir et le vert viennent structurer et ancrer, mais le jaune est l'énergie d'Izou.*

#### Accent vibrant — Corail

| Token | Hex | Nom | Usage |
|-------|-----|-----|-------|
| `izou-coral` | `#E8725A` | Corail | CTA secondaires, notifications, énergie |
| `izou-coral-light` | `#FDDDD6` | Pêche | Fonds erreur doux, badges chauds |

*Apporte la vibrance et l'énergie. Présent dans les ebooks Shine (pills rose/saumon).*

#### Accent doux — Lavande

| Token | Hex | Nom | Usage |
|-------|-----|-----|-------|
| `izou-lavender` | `#8B7EC8` | Lavande | Éléments ludiques, gamification, progression |
| `izou-lavender-light` | `#E8E4F5` | Lilas | Fonds accent frais |

*Apporte la dimension fun et ludique de la fidélité sans être enfantin. Différenciateur vs Shine.*

#### Fonds chaleureux (gamme Warm — indépendante de la brand)

| Token | Hex | Nom | Usage |
|-------|-----|-----|-------|
| `izou-warm-50` | `#FAF7F2` | Lin | Fond de page principal |
| `izou-warm-100` | `#F3EDE3` | Crème | Fond cartes, sections alternées |
| `izou-warm-200` | `#E8DFD0` | Sable | Bordures, séparateurs |
| `white` | `#FFFFFF` | Blanc | Nav, modals, inputs |

*Philosophie Shine : la chaleur ambiante vient des fonds crème, pas du blanc froid.*

#### Texte

| Token | Hex | Usage |
|-------|-----|-------|
| `text-heading` | `#1E1E1E` | Titres (noir) |
| `text-primary` | `#1A1A1A` | Corps de texte |
| `text-secondary` | `#6B6558` | Texte secondaire (brun-gris chaud) |
| `text-on-dark` | `#FBFBFB` | Texte sur fond sombre |

#### Sémantiques

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#2A5C46` | Validations (forest-medium — cohérent) |
| `warning` | `#F9D714` | Alertes (jaune — cohérent) |
| `error` | `#D94F3B` | Erreurs |
| `info` | `#5B8DB8` | Informations |

#### Règles d'usage couleurs

- **DO :** Jaune `#F9D714` = couleur DOMINANTE, omniprésente (highlights, badges, boutons secondaires, fonds accent, célébrations). Noir = boutons principaux, nav, CTA, texte fort. Forêt = sections pleines, identité, success. Corail = énergie, notifications. Lavande = ludique, progression.
- **DON'T :** JAMAIS de dégradés (entre couleurs). Jamais 3 accents côte à côte. Le jaune ne sert JAMAIS de couleur de texte sur fond clair (contraste insuffisant). Le corail n'est jamais la couleur dominante d'un écran.
- **Aplats uniquement :** Les couleurs s'utilisent en blocs plats, en sections pleines, en fonds unis — comme Shine. Pas de transitions, pas de gradients.
- **Duo signature :** Noir + Jaune = le duo Izou (comme Shine = Vert + Jaune). Le vert forêt vient en troisième position pour les sections d'identité.
- **Personnalisation commerçant :** Le token `--color-brand-*` (50→950) remplace forest par la couleur choisie. Noir, jaune, corail, lavande et fonds warm RESTENT — ils sont l'identité Izou persistante.

#### Logo Izou

- Sur fond sombre (`#1E3A2F` ou `#1E1E1E`) : logo en blanc `#FBFBFB`
- Sur fond clair (`#FAF7F2` ou `#FFFFFF`) : logo en `#1E1E1E`
- Sur fond jaune (`#F9D714`) : logo en `#1E1E1E`

### Typography System

#### Polices

| Rôle | Police | Justification |
|------|--------|---------------|
| **Display / Headings** | **Santoku** | Police principale — caractère fort, moderne, distinctif. Donne à Izou une identité typographique unique et reconnaissable |
| **Body / UI** | **Inter** | Identique à Shine — lisibilité parfaite, standard industrie, Google Fonts gratuit |
| **Tertiaire / Accents** | **Space Grotesk** | Pour labels, overlines, éléments techniques, données. Apporte une touche géométrique moderne en complément |

#### Échelle typographique

| Token | Taille | Line-height | Poids | Usage |
|-------|--------|-------------|-------|-------|
| `display` | 42px (mobile) / 58px (desktop) | 1.15 | 400 | Hero, accueil |
| `heading-l` | 30px | 1.28 | 400 | Titres de section, nom commerce |
| `heading-m` | 24px | 1.28 | 400 | Sous-titres, cartes |
| `heading-s` | 20px | 1.3 | 500 | Labels de section |
| `body` | 15px | 1.5 | 400 | Texte courant |
| `body-sm` | 14px | 1.5 | 400-500 | Boutons, labels |
| `caption` | 11px | 1.45 | 500 uppercase | Catégories, overlines |

#### Propriétés typographiques

- **Letter-spacing headings :** `-0.02em` (resserrement subtil comme Shine)
- **CTA et boutons :** Inter Medium (500)
- **Labels / Overlines :** Space Grotesk Medium (500), uppercase pour les catégories
- **Text-underline-offset :** `4px` (liens)

### Spacing & Layout Foundation

#### Système de base : 4px

```
4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 60 | 80
```

#### Espacement

Philosophie Shine "aérer pour respirer" — sections espacées de 48-80px, padding interne 24-40px. White space généreux.

#### Border radius

| Token | Valeur | Usage |
|-------|--------|-------|
| `radius-sm` | `8px` | Inputs, petits éléments |
| `radius-md` | `12px` | Cartes, conteneurs |
| `radius-lg` | `16px` | Grandes cartes, sections |
| `radius-xl` | `20px` | Hero elements |
| `radius-full` | `9999px` | **Boutons pill**, avatars, pills/tags — signature Shine |

#### Ombres minimales

| Token | Valeur | Usage |
|-------|--------|-------|
| `shadow-subtle` | `0 4px 15px 0 rgba(30, 58, 47, 0.06)` | Cartes au repos — teintée forêt |
| `shadow-focus` | `0 0 0 3px rgba(30, 58, 47, 0.2)` | Focus ring accessibilité |

#### Layout

- Mobile-first (PWA client = usage principal)
- Nav sticky blanche avec CTA pill noir à droite (pattern Shine)
- Fonds alternés warm-50 / white pour rythmer les sections
- Cards sur fond warm-100 ou white selon le contexte

### Accessibility Considerations

- **Contraste WCAG AAA :** `#1E1E1E` sur `#FAF7F2` → ratio ~14:1
- **Contraste WCAG AAA :** `#1E3A2F` sur `#FAF7F2` → ratio ~11:1
- **Ambre/jaune :** jamais comme couleur de texte sur fond clair (contraste insuffisant)
- **Focus ring visible** sur tous les éléments interactifs
- **Font-size minimum** 14px pour le body, 11px uniquement pour overlines uppercase
- **Touch targets** minimum 44×44px (mobile-first)
- **Couleur seule :** ne jamais utiliser la couleur comme seul indicateur (ajouter icône ou texte)

## Design Direction Decision

### Design Directions Explored

6 directions visuelles explorées via un showcase HTML interactif (`planning-artifacts/ux-design-directions.html`) :

1. **Palette & Typographie** — Fondation visuelle : swatches, échelle typo Santoku + Inter
2. **Carte Client Mobile** — Carte fidélité Corner Coffee, tampons, bottom tab
3. **Écran de Succès** — Fond forêt plein, code éphémère, typo blanche impactante
4. **Dashboard Commerçant** — Sidebar sobre (blanc/warm, style Shine), KPIs, feed d'activité, insight lavande
5. **Inscription Rapide** — Flow 3 étapes minimal (prénom → carte → wallet)
6. **Univers de Couleurs** — Démonstration de la palette sur différents contextes

### Chosen Direction

**Direction unifiée** — L'ensemble des 6 directions forme un langage visuel cohérent validé par le stakeholder. Pas de choix entre directions mais une validation du système global avec les ajustements suivants :

### Design Rationale

**Ce qui fonctionne :**
- L'approche aplats plats (Shine philosophy) — simple, clean, professionnel
- Le noir `#1E1E1E` comme ancrage principal pour les CTA et la nav
- La palette riche et modulaire (forêt + ambre + corail + lavande + warm)
- L'alternance de fonds warm-50 / blanc pour le rythme
- Les boutons pill comme signature

**Points à affiner lors de l'implémentation :**
- Intégrer des illustrations et icônes de qualité pour guider l'utilisateur — chaque écran doit avoir des éléments visuels qui orientent l'action
- Le dashboard nécessite des détails visuels plus poussés (inspirés des templates Figma WEAVE/QPay)
- La police Santoku (variable font `Santoku_roman_v1-VF.ttf`) doit être chargée via `@font-face` — fichier source disponible localement
- Prévoir des placeholders pour illustrations dans chaque empty state, onboarding et écran de succès

### Implementation Approach

**Typographie :**
- Santoku (fichier variable TTF local) → `public/fonts/Santoku_roman_v1-VF.ttf`, chargé via `@font-face`
- Inter via Google Fonts (ou next/font)
- Space Grotesk pour labels/overlines

**Composants :**
- Dashboard : composants Untitled UI React adaptés aux tokens Izou
- App client : composants custom avec Framer Motion
- Illustrations : pack V1 adapté aux couleurs, emplacements prévus dans chaque écran

**Expérience guidée :**
- Chaque écran comporte au minimum : un titre clair, un élément visuel (illustration/icône), un CTA évident, un feedback contextuel
- L'utilisateur ne doit JAMAIS se demander "que faire maintenant ?" — le chemin est toujours visible

## User Journey Flows

### Journey 1 — Premier scan client (inscription)

**Durée cible : 15-20 secondes. Le goulot critique d'Izou.**

```
Scan QR → Système : client reconnu ?
├── OUI → [Journey 2 : scan quotidien]
└── NON → "Comment vous appelez-vous ?"
           [Input prénom, auto-focus, clavier ouvert]
           → Bouton "Continuer" (pill noir)
           → ✨ Carte CRÉÉE avec 2 tampons (animation spring remplissage)
             "Bienvenue [Prénom] ! 2 tampons offerts"
           → "Sécurisez votre carte" [Input téléphone]
           → OTP email → 6 inputs mono
           ├── OTP valide → "Ajouter au Wallet" [Apple] [Google] ["Plus tard"]
           │                → Notification commerçant : "[Prénom] s'est inscrit"
           └── OTP invalide → "Code incorrect" → 3 tentatives → "Renvoyer" (60s)
```

**Principe clé :** La carte existe AVANT l'OTP — le client voit sa valeur avant de donner ses infos. Escalade progressive d'engagement.

### Journey 2 — Scan quotidien (client reconnu)

**Durée cible : < 3 secondes. Aucun tap requis.**

```
Scan QR (cookie/session/wallet actif)
→ Cooldown anti-fraude : dernier scan > 2h ?
  ├── NON → "Tampon déjà enregistré. Revenez plus tard !"
  │         (shake horizontal 150ms + vibration error)
  └── OUI → +1 tampon/points automatique
            → Animation remplissage (spring 500ms) + vibration light
            → Mise à jour Wallet (< 3s)
            → Notification commerçant (groupée si > 2 scans en 5 min)
            → Carte complète ? → [Journey 3]
```

### Journey 3 — Récompense

**Deux mécaniques distinctes selon le mode du programme :**

#### Mode Tampons — Récompense automatique (zéro choix)

```
10/10 tampons → Écran succès plein écran AUTOMATIQUE
  Fond forêt (#1E3A2F), expansion depuis le dernier tampon (600ms)
  "Bravo [Prénom] ! [Récompense] offert(e) !"
  Vibration success (3 pulses)
  → Récompense IMMÉDIATEMENT disponible, pas de bouton "Utiliser"
  → Notification push commerçant : "[Prénom] a complété sa carte"

FLOW PRINCIPAL : Validation par notification
  → Client tap "Demander ma récompense" quand il est au comptoir
  → Push commerçant : "[Prénom] souhaite son [Récompense]" [✓ Valider]
  → Commerçant valide en 1 tap → points déduits + écran succès client

FALLBACK : Commerçant indisponible (pas de réponse 30s)
  → Code éphémère affiché : "CAFÉ-7829"
  → Client montre l'écran, employé sert
  → Pas d'expiration pour les tampons (une seule récompense)
  → Carte remise à 0 automatiquement
```

#### Mode Points — Multi-paliers (le client choisit)

```
Client a X points
  → Barre de progression horizontale avec paliers
    [●──●──●──○──○──○──○]
     50  80  120 135 150 200 240
  → Paliers débloqués = icône dorée + bouton "Utiliser"
  → Paliers verrouillés = cadenas grisé + "Plus que X pts"
  → Catalogue scrollable sous la barre (photos + noms + coûts)

Client tap "Utiliser" sur un palier débloqué
  → Bottom sheet confirmation : "Utiliser 80 pts pour [Croissant] ?"
    [Confirmer] [Annuler]
  → DEMANDE ENVOYÉE au commerçant

FLOW PRINCIPAL :
  → Push commerçant : "[Prénom] souhaite échanger 80 pts → Croissant"
    [✓ Valider] [✗ Refuser]
  → Validé → Points déduits + écran succès (fond forêt)
  → Refusé → Points conservés + message client

FALLBACK (pas de réponse 30s) :
  → Code éphémère : "CROISSANT-4821" (inclut le nom du palier)
  → Valide 5 min → si non utilisé, points RESTITUÉS automatiquement

ANTI-ABUS :
  → ≥ 3 activations non utilisées en 24h → cooldown discret
  → Points jamais perdus
```

**Engagement inter-paliers :** Barre de progression animée continue, message "Plus que X avant...", notification push à 50% d'un palier.

**Le client peut TOUJOURS économiser** pour un palier supérieur — aucune pression à dépenser au palier le plus bas.

### Journey 4 — Onboarding commerçant

**Durée cible : < 5 minutes. Zéro configuration technique.**

```
Clic lien inscription (recommandation pair)
→ Email + mot de passe
→ "Quel est votre type de commerce ?"
  [Café ☕] [Boulangerie 🥐] [Restaurant 🍽️] [Autre]
→ Template pré-remplit TOUT :
  - Programme tampons/points avec paliers suggérés
  - 2 tampons de bienvenue
  - Parrainage activé
  - Récompense + couleur suggérées
→ "Personnalisez votre programme" (nom, récompense, couleur)
→ "Créer mon programme" (pill noir)
→ ✨ Dashboard avec QR code généré
  [Télécharger PDF] [Partager le lien]
→ Guide contextuel (3 bulles) :
  1. "Collez le QR près de la caisse"
  2. "Les clients scannent eux-mêmes"
  3. "Suivez tout ici"
→ En attente du premier scan
  → Notification : "[Prénom] s'est inscrit !" (le "aha moment")
```

### Journey 5 — Parrainage

```
Client voit bannière parrainage (carte OU profil)
→ "Parraine tes amis — gagne 2 tampons/pts bonus !"

Canal 1 — Lien direct :
  → Bouton "Partager" → sélecteur natif OS
  → Filleul clique → inscription avec attribution auto
  → Parrain + filleul reçoivent bonus automatiquement
  → Notification riche parrain : "Ton amie [Prénom] s'est inscrite ! +2 tampons"
    (screenshotable, story-worthy)

Canal 2 — Attribution au comptoir :
  → Filleul scanne QR physique (vu en story/bouche-à-oreille)
  → À l'inscription : "Quelqu'un vous a recommandé ?" [Oui → sélection] [Non → skip]
  → Bonus si parrain sélectionné
```

### Journey 6 — Récompense surprise (commerçant → client)

```
Dashboard → Fiche client → "Offrir une récompense"
→ Commerçant choisit ou écrit librement ("Un dessert pour toi !")
→ Notification client : "Samir t'offre un dessert ! 🎉"
  → Écran spécial "Cadeau !" (distinct du succès normal)
  → Pas de points dépensés — c'est un cadeau libre
  → Validation par le même flow (push + fallback code)
```

*Le geste humain digitalisé — différenciateur émotionnel d'Izou.*

### Edge Cases Documentés

| Scénario | Comportement |
|----------|-------------|
| **Changement de téléphone** | Re-scan QR → "Retrouver ma carte" → téléphone + OTP → carte intacte |
| **Numéro déjà existant** | Jamais de doublon — reconnexion forcée via OTP |
| **Multi-cartes commerces** | QR = routeur contextuel, hub "Mes cartes" en navigation |
| **Multi-appareils** | Carte liée au numéro, pas à l'appareil. Wallets coexistent |
| **Changement programme (tampons→points)** | Conversion proposée (1 tampon = X pts), notification positive au client |
| **Modification paliers** | Application immédiate + notification transparente aux clients |
| **Multi-établissements** | V1 = 1 compte = 1 commerce. Workaround : 2 comptes |
| **Connexion instable** | Skeleton immédiat + retry. Jamais d'optimistic UI pour tampons |
| **Triche récompenses** | Rate limit (3 activations/jour), points jamais perdus |
| **Récompense expirée (code 5min)** | Points RESTITUÉS automatiquement |

### Micro-interactions & Fluidité

#### Constantes d'animation (Framer Motion)

| Type | Durée | Easing | Usage |
|------|-------|--------|-------|
| Micro | 150ms | ease-out | Hover, focus, toggle, button tap (scale 0.97) |
| Standard | 300ms | cubic-bezier(0.25, 0.1, 0.25, 1) | Navigation, tab switch, fade-in |
| Emphasis | 500ms | spring (stiffness 300, damping 20) | Tampon rempli, palier débloqué |
| Immersive | 600ms | spring | Écran de succès plein écran |
| Entrance | 400ms + stagger 50ms | ease | Page load, liste items |

#### Feedback sensoriel par action

| Action | Visuel | Haptique |
|--------|--------|----------|
| Tampon ajouté | Cercle se remplit (spring 500ms) | Impact light |
| Palier débloqué | Cadenas → étoile dorée (500ms) | Notification |
| Carte complète | Expansion plein écran forêt | Success (3 pulses) |
| Scan refusé (cooldown) | Shake horizontal (150ms) | Error (2 taps) |
| OTP validé | Check vert + fade-out | Impact light |
| OTP invalide | Shake des 6 inputs | Error (2 taps) |
| Récompense surprise reçue | Écran spécial "Cadeau !" | Success (3 pulses) |
| Button tap (tous) | Scale 0.97 → 1.0 (100ms) | — |

**Pas de sons** — l'app est utilisée en public (comptoir, file d'attente).

#### Illustrations animées

Les illustrations (SVG/Lottie) intègrent des micro-animations subtiles au repos : mouvement léger, flottement, respiration. Exemples : montgolfières qui oscillent doucement, confetti qui tombent lentement, plantes qui bougent. Ces animations sont décoratives mais renforcent la sensation de vie et de chaleur. Elles ne bloquent jamais l'interaction.

#### Principes de fluidité

| Principe | Règle |
|----------|-------|
| Jamais de blanc | Skeleton immédiat sur chaque chargement |
| Réponse < 100ms | Tout tap produit un feedback visuel instantané |
| Valeur avant navigation | La carte apparaît AVANT que le client navigue |
| Continuité spatiale | Les éléments se transforment (slide, fade, spring) — jamais de cut |
| Pré-cache | Version locale affichée pendant la synchro serveur |
| Haptique cohérent | Success = 3 pulses, error = 2 taps, info = 1 light |
| Bottom sheets | Jamais de modal plein écran pour les actions secondaires |
| Le tampon est sacré | Spring 500ms — la seule animation "lente", c'est le moment de dopamine |

### Parité Tampons / Points

| Aspect | Mode Tampons | Mode Points |
|--------|-------------|-------------|
| Accumulation | +1 tampon par visite | +X points par visite (fixe V1) |
| Visualisation | Cercles remplis (grille 5×2) | Barre de progression + chiffre |
| Récompense | Unique, automatique (zéro choix) | Multi-paliers, le client choisit |
| Activation | Immédiate à la complétion | Le client décide quand |
| Validation | Push commerçant (fallback: pas d'expiration) | Push commerçant (fallback: code 5min) |
| Reset | Carte remise à 0 | Points déduits du solde |
| Engagement | "Plus que 3 tampons !" | "Plus que 20 pts avant [Dessert] !" |

### Fonctionnalités V1.1 (post-pilote)

| Feature | Description |
|---------|-------------|
| **Streaks** | Compteur de visites consécutives + bonus à la 5ème (A — Adapt) |
| **Récompenses éphémères** | Palier temporaire "du moment" avec date de fin (M — Modify) |

### Fonctionnalités V2+

| Feature | Description |
|---------|-------------|
| **Don solidaire** | Palier optionnel : dépenser des points pour offrir un café suspendu (P — Put) |
| **Multi-établissements** | 1 compte commerçant = plusieurs points de vente |

### Flow Optimization Principles

1. **"Valeur avant engagement"** — Le client voit ses 2 tampons AVANT de donner son téléphone. Le commerçant voit son QR AVANT de peaufiner les détails.
2. **"Le chemin par défaut est le bon"** — Templates pré-remplissent tout. Le client n'a qu'un champ (prénom).
3. **"L'erreur est un détour, pas un mur"** — OTP échoué ? Renvoi 60s. Cookie perdu ? Reconnexion téléphone. Bug ? Fallback manuel.
4. **"Chaque écran a une seule mission"** — Un input, une action, un feedback.
5. **"Le client initie, le commerçant valide"** — Récompenses, inscriptions, scans : le client fait le geste, le système fait le reste.

## Component Strategy

### Design System Components (Untitled UI React — tier gratuit)

**Disponibles pour le dashboard commerçant :** Button, Input, Modal, Tabs, Badge, Avatar, Toggle, Tooltip, Alert, Notification, Loading, Empty State, Featured Icon, Progress Indicator, Table patterns.

**Non disponibles → custom requis :** Tout ce qui est métier fidélité (cartes, tampons, progression paliers, célébrations, QR, wallet).

### Custom Components

#### P0 — Core (pilote)

**StampCard**
- **Purpose :** Progression client en mode tampons — cœur visuel d'Izou
- **Anatomy :** Header commerce (nom + couleur brand) → Grille 5×2 cercles → Message "Plus que X !" → CTA
- **States :** Vide (0/10), En cours (X/10), Complet (10/10 → succès auto), Loading (skeleton)
- **Variants :** Couleur via `--color-brand-*` du commerçant
- **Animation :** Spring 500ms sur remplissage tampon. Remplis = brand-500, vides = warm-200 bordure

**PointsProgressBar**
- **Purpose :** Barre horizontale avec paliers à la BK (cadenas → étoiles)
- **Anatomy :** Barre → Marqueurs paliers (cadenas/étoile) → Chiffres → "Plus que X avant..."
- **States :** Verrouillé (cadenas grisé), Débloqué (étoile ambre), Actif (surbrillance)
- **Animation :** Remplissage progressif (300ms). Cadenas → étoile (500ms spring) au déblocage
- **Interaction :** Tap palier débloqué → scrolle vers la récompense dans le catalogue

**RewardCatalog**
- **Purpose :** Catalogue scrollable des récompenses par palier
- **Anatomy :** Carte = Photo/placeholder + Nom + Coût pts + "Utiliser" ou Cadenas
- **States :** Débloquée (bouton actif ambre), Verrouillée (grisée), Activée (en attente validation)
- **Layout :** Scroll horizontal par tier ("40 pts — Petits Plaisirs", "80 pts — Snacks")

**RewardSuccessScreen**
- **Purpose :** Célébration plein écran — LE moment émotionnel
- **Anatomy :** Fond couleur brand commerçant (ou forêt par défaut) → Illustration Lottie animée (formes festives en couleurs Izou fixes : ambre, corail, lavande) → Titre Santoku blanc → Sous-titre → CTA ambre-light
- **States :** Tampons (automatique, reste affiché), Points (en attente validation)
- **Animation :** Expansion depuis tampon/barre (600ms spring). Illustration Lottie en boucle douce.
- **Note :** Le fond porte les couleurs du COMMERÇANT, l'illustration porte les couleurs d'IZOU. Résultat : personnel ET signé.

**EphemeralCode**
- **Purpose :** Code visuel de fallback pour validation récompense
- **Anatomy :** Code "[NOM]-XXXX" en Space Grotesk gros → Timer "Valide 5 min" pulsant
- **States :** Actif (timer décompte), Expiré (points restitués, message toast)

**ValidationPush**
- **Purpose :** Notification commerçant pour valider une récompense
- **Anatomy :** Nom client + Récompense demandée + [✓ Valider] [✗ Refuser]
- **States :** Reçue (badge), Ouverte, Validée (check vert, auto-dismiss 1s), Refusée
- **Localisation :** Bottom sheet mobile, toast desktop

**QRScannerView** — Viseur caméra plein écran, fond sombre, cadre centré
**WalletButtons** — Apple Wallet + Google Wallet, côte à côte, pill
**OTPInput** — 6 inputs mono (existe déjà, à restyler)
**BottomTabBar** — 5 onglets : Carte | Historique | Scanner | Parrainage | Profil
**SkeletonCard** — Placeholder chargement forme de la carte

#### P1 — Engagement

**ReferralBanner** — Bannière parrainage illustrée (ambre-light fond, illustration)
**ActivityFeed** — Feed chronologique événements (avatar + texte + timestamp)
**KPICard** — Chiffre + label + accent couleur (forêt/ambre/corail)
**ClientCard** — Résumé client mobile (nom, tampons/points, dernière visite)
**SurpriseRewardButton** — "Offrir une récompense" sur fiche client

#### P2 — Expansion

**MultiCardHub** — Collection de cartes multi-commerces
**StreakCounter** — Compteur séries de visites (V1.1)

### Stratégie d'illustration

#### Deux modes visuels alternés

L'app alterne entre deux ambiances visuelles complémentaires — comme Shine alterne entre son site sobre et ses ebooks ultra illustrés :

**Mode 1 — Illustré / Vibrant (écrans Izou)**
Utilisé sur : onboarding, succès, parrainage, empty states, accueil, inscription.
Illustrations grandes, colorées (ambre + corail + lavande + forêt), style flat organique avec rondeur et chaleur. Animées en Lottie (Tier 1) ou SVG (Tier 2/3).
Inspiration : onboarding Coinstar (illustrations héro plein écran), écran succès QPay (couleur vive + check), parrainage QPay (illustration enveloppe), ebooks Shine.

**Mode 2 — Sobre / Shine (écrans opérationnels)**
Utilisé sur : dashboard commerçant, listes clients, formulaires, navigation, paramètres.
Clean, data-driven, espacement généreux, pas d'illustration sauf petites touches contextuelles ("Need Help?" comme WEAVE).
Inspiration : dashboard WEAVE (sidebar + KPIs + tables), navigation Shine (blanc, pill, minimal).

#### Cartographie des illustrations

**Tier 1 — Moments "Wow" (Lottie animé, lazy-loaded)**

| Écran | Illustration | Animation |
|-------|-------------|-----------|
| RewardSuccessScreen | Formes festives (étoiles, cercles, formes organiques) en ambre + corail + lavande sur fond brand commerçant | Flottement doux, pulsation |
| Récompense surprise "Cadeau !" | Boîte cadeau ouverte avec lumière ambrée | Ouverture à l'arrivée |
| Carte complète (tampons) | Le dernier tampon éclate en formes illustrées | Expansion depuis le tampon |

**Tier 2 — Moments "Chaleur" (SVG animé CSS)**

| Écran | Illustration | Animation |
|-------|-------------|-----------|
| Inscription — Bienvenue + 2 tampons | Scène accueillante (porte ouverte, lumière, plante) | Mouvement subtil |
| Parrainage | Deux silhouettes connectées, formes liées | Léger mouvement |
| Onboarding commerçant étape 1 | Vitrine de commerce illustrée | — |
| Onboarding commerçant étape 2 | QR code avec téléphone | — |
| Onboarding commerçant étape 3 | Dashboard avec graphique montant | Graphique se remplit |

**Tier 3 — Moments "Support" (SVG statique)**

| Écran | Illustration |
|-------|-------------|
| Empty state — Pas de clients | Plante qui pousse + "Votre premier client arrive bientôt !" |
| Empty state — Pas de transactions | Tasse souriante + "Les premières visites arrivent" |
| Empty state — Pas de parrainages | Mains qui se tendent + "Partagez votre programme" |
| Erreur réseau | Nuage déconnecté + "Connexion difficile" |
| Chargement long | Logo Izou (6 cercles) qui pulse |

#### Style visuel des illustrations

- Formes rondes et organiques (pas angulaires, pas Corporate Memphis)
- Palette : ambre + corail + lavande + forêt (les 4 accents Izou — FIXES, pas personnalisables)
- Traits doux, pas de contours noirs épais
- Personnages : silhouettes arrondies simplifiées (pas de visages détaillés)
- Éléments du quotidien commerce : tasses, plantes, vitrines, QR, téléphones
- Ombres douces et légères

#### Technique

| Format | Poids | Usage | Chargement |
|--------|-------|-------|------------|
| Lottie JSON | 10-50 KB | Tier 1 (wow) | Lazy load |
| SVG animé CSS | 5-20 KB | Tier 2 (chaleur) | Inline/pré-chargé |
| SVG statique | 3-10 KB | Tier 3 (support) | Inline |

**Budget total : ~210 KB** — performance PWA préservée.
**Librairie : `lottie-react`** (~15KB gzipped).
**V1 : illustrations AI vectorisées** (Midjourney/DALL-E → vectorisées) — coût zéro, cohérence maximale.
**V2 : illustrations custom** par un illustrateur.

#### Règle des illustrations et couleur commerçant

Les illustrations utilisent les couleurs FIXES d'Izou (ambre, corail, lavande, forêt). Le FOND des écrans de succès peut prendre la couleur brand du commerçant. Résultat : l'écran est personnel (couleurs du commerce) ET signé Izou (style d'illustration).

Les écrans qui ne nécessitent pas de personnalisation (onboarding Izou, page d'accueil, landing) montrent la DA complète d'Izou. La personnalisation commerçant n'intervient que sur les écrans spécifiques au programme (carte, tampons, succès, wallet).

### Component Implementation Strategy

| Couche | Composants | Source | Technologie |
|--------|-----------|--------|-------------|
| Dashboard commerçant | KPICard, ActivityFeed, Table, Sidebar, ValidationPush | Untitled UI + custom | Tailwind + CSS variables |
| App client mobile | StampCard, PointsProgressBar, RewardCatalog, SuccessScreen, BottomTabBar | 100% custom | Tailwind + Framer Motion + Lottie |
| Tokens partagés | Couleurs, spacing, radius, shadows | theme.css | CSS variables `--color-brand-*` |

### Implementation Roadmap

**Phase 1 — Core (pilote) :**
StampCard, PointsProgressBar, RewardCatalog, RewardSuccessScreen, QRScannerView, OTPInput, WalletButtons, BottomTabBar, ValidationPush, EphemeralCode, SkeletonCard + illustrations Tier 1

**Phase 2 — Engagement :**
ReferralBanner, ActivityFeed, KPICard, ClientCard, SurpriseRewardButton + illustrations Tier 2

**Phase 3 — Expansion :**
MultiCardHub, StreakCounter, récompenses éphémères + illustrations Tier 3 (empty states)

## UX Consistency Patterns

### Button Hierarchy

| Type | Apparence | Usage | Exemples |
|------|-----------|-------|----------|
| **Primary** | Pill noir `#1E1E1E`, texte blanc, Inter 500 | Action principale unique par écran | "Continuer", "Créer mon programme", "Confirmer" |
| **Secondary** | Pill ambre-light `#FFF2CC`, texte noir | Action secondaire ou alternative | "Ajouter au Wallet", "Plus tard" |
| **Tertiary** | Texte forêt souligné, pas de fond | Action tertiaire discrète | "Renvoyer le code", "Annuler", "Passer" |
| **Danger** | Pill corail `#E8725A`, texte blanc | Action destructive ou refus | "Refuser", "Supprimer" |
| **Disabled** | Pill warm-200, texte warm-200 | Action non disponible | Bouton grisé avant validation |

**Règles :** Max 1 primary par écran. Primary toujours en zone pouce (bas) sur mobile. Tous les boutons = pill (9999px). Tap feedback : scale 0.97 → 1.0 (100ms).

### Feedback Patterns

| Type | Visuel | Comportement |
|------|--------|-------------|
| **Success** | Toast vert forêt `#2A5C46`, icône check, texte blanc | Auto-dismiss 3s |
| **Error** | Toast corail `#D94F3B`, icône X, texte blanc | Reste jusqu'à dismiss/action |
| **Warning** | Toast ambre `#E8A832`, icône !, texte noir | Auto-dismiss 5s |
| **Info** | Toast info `#5B8DB8`, icône i, texte blanc | Auto-dismiss 3s |
| **Loading** | Skeleton screen (forme du contenu attendu) | Jamais de spinner, jamais d'écran blanc |
| **Celebration** | Plein écran (fond brand) + illustration Lottie | Reste jusqu'à action |
| **Validation inline** | Bordure verte + check sous input | Immédiat |
| **Erreur inline** | Bordure corail + message + shake 150ms | Immédiat |
| **Cooldown** | Shake horizontal 150ms + message clair | Vibration error (2 taps) |

**Règle d'or :** Chaque action produit un feedback < 100ms. Le silence est interdit.

### Form Patterns

| Pattern | Comportement |
|---------|-------------|
| **Input unique** | 1 champ par écran sur mobile (prénom, puis téléphone, puis OTP) |
| **Auto-focus** | Clavier ouvert automatiquement sur le premier input |
| **Validation** | Inline en temps réel, jamais en soumission finale |
| **Erreur** | Bordure corail + message sous le champ + shake |
| **Labels** | Au-dessus de l'input (pas de placeholder-as-label) |
| **OTP** | 6 inputs séparés, Space Grotesk, auto-advance |
| **Téléphone** | Préfixe +33 pré-sélectionné, format auto |
| **Recherche** | Input avec loupe, debounce 300ms, résultats inline |

### Navigation Patterns

**App client mobile :**
- Bottom Tab Bar 5 onglets : Carte | Historique | Scanner | Parrainage | Profil
- Onglet actif en forêt, inactifs en warm-200
- Switch : crossfade 200ms. Retour : flèche + slide-right
- Deep link QR : amène directement à la carte du commerce

**Dashboard commerçant :**
- Desktop : sidebar fixe gauche (fond blanc, style Shine — item actif = fond warm-50 + texte noir + bordure gauche 3px forêt) + zone contenu à droite
- Mobile : bottom nav simplifié 4 items (Accueil | Clients | Scanner | Plus) + plein écran
- Modals desktop : centre, overlay dimmed. Mobile : bottom sheet
- Notifications : toast haut-droit (desktop), push native (mobile)

### Modal & Overlay Patterns

| Type | Usage | Comportement |
|------|-------|-------------|
| **Bottom Sheet** | Confirmations, choix, validation récompense | Slide-up 300ms, fond dimmed, contexte visible |
| **Modal centre** | Formulaires complexes (desktop) | Fade-in 200ms |
| **Toast** | Feedback non bloquant | Haut de l'écran, auto-dismiss |
| **Full screen** | Célébrations uniquement | Expansion 600ms spring |

Jamais de modal plein écran pour les actions secondaires.

### Empty States

Chaque empty state = illustration (Tier 3 SVG) + message encourageant + CTA clair. Jamais d'écran vide nu.

| Contexte | Message | CTA |
|----------|---------|-----|
| Pas de clients | "Votre premier client arrive bientôt !" | "Partagez votre QR" |
| Pas de transactions | "Les premières visites arrivent" | "Vérifiez votre QR" |
| Pas de parrainages | "Partagez votre programme" | "Activer le parrainage" |
| Pas de récompenses | "Continuez, vous y êtes presque !" | — |

### Message & Notification Patterns

**Messages personnalisés (concierge) :** Toujours le prénom. Variant selon l'heure (matin/après-midi/soir). Jamais de "Cher client" générique.

**Notifications push :**

| Type | Ton | Exemple |
|------|-----|---------|
| Tampon ajouté | Factuel | "7/10 — Plus que 3 !" |
| Palier débloqué | Enthousiaste | "Nouvelle récompense disponible !" |
| Carte complète | Célébration | "Bravo ! Ton café est offert !" |
| Parrainage réussi | Gratifiant | "Ton amie Léa s'est inscrite ! +2 tampons" |
| Client inactif (7j) | Chaleureux | "On te garde une place !" — jamais culpabilisant |
| Récompense surprise | Joyeux | "Samir t'offre un dessert !" |
| Commerçant : inscription | Informatif | "[Prénom] vient de s'inscrire" |
| Commerçant : récompense | Actionnable | "[Prénom] souhaite son café offert [✓]" |

**Règle :** Groupé si > 2 en 5 min. Jamais culpabilisant. Toujours le prénom.

### Scroll & Pagination

| Contexte | Pattern |
|----------|---------|
| Liste clients | Pagination 20/page |
| Catalogue récompenses | Scroll horizontal par tier, snap |
| Historique transactions | Infinite scroll + skeleton, groupé par jour |
| Feed d'activité | Infinite scroll, groupé "Aujourd'hui" / "Cette semaine" |

## Responsive Design & Accessibilité

### Stratégie Responsive

**Approche : mobile-first.** Les media queries ajoutent de la complexité vers le haut, jamais l'inverse.

**Mobile (prioritaire — 90%+ des interactions client)**
- Bottom Tab Bar 5 onglets (client), zone pouce, tous les CTA en bas
- Inputs plein écran (1 champ par écran), clavier auto-ouvert
- Carte fidélité et tampons : composant principal, jamais tronqué
- Dashboard commerçant mobile : bottom nav 4 items (Accueil | Clients | Scanner | Plus)
- KPIs visibles sans scroll — le commerçant consulte "entre deux clients"

**Tablet (usage commerçant en caisse iPad)**
- Dashboard : sidebar rétractable + contenu centré
- Même bottom nav que mobile pour la partie client
- Touch targets identiques au mobile (48px minimum)

**Desktop (dashboard commerçant bureau)**
- Sidebar fixe gauche sobre (fond blanc, style Shine — item actif = fond warm-50 + texte noir + bordure gauche 3px forêt)
- Zone contenu large avec tableaux clients colonnes complètes
- Modals centrées (pas de bottom sheets)

### Stratégie Breakpoints

Breakpoints Tailwind standards — pas de custom :

| Breakpoint | Largeur | Cible |
|-----------|---------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet / commerçant en caisse |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |

### Stratégie Accessibilité

**Niveau cible : WCAG 2.1 AA** — standard industrie, suffisant pour le cadre légal français.

| Critère | Exigence | Application Izou |
|---------|----------|-----------------|
| Contraste texte | 4.5:1 (normal), 3:1 (grand) | Noir #1E1E1E sur jaune #F9D714 = 10.4:1. Blanc sur forêt #1E3A2F = 11.2:1. OK |
| Touch targets | 48×48px minimum | Boutons pill, onglets tab bar, tampons grille |
| Focus visible | Anneau 2px forêt `#2A5C46` | Tous les éléments interactifs |
| Screen reader | ARIA labels sur composants custom | StampCard, PointsProgressBar, BottomTabBar, OTPInput |
| Keyboard nav | Tab order logique | Dashboard desktop surtout |
| Motion réduite | `prefers-reduced-motion` | Désactiver spring/Lottie → fade 150ms |
| Skip links | Lien "Aller au contenu" | Dashboard desktop |
| Distinction sans couleur | Tampons remplis vs vides | Forme différente (filled solid vs cercle vide bordure) — pas seulement couleur |
| Fallback caméra | Input saisie manuelle code QR | Sous le scanner : "Entrer le code manuellement" |

**Règles spécifiques :**
- Animations (confetti, spring tampons) respectent `prefers-reduced-motion: reduce` → transitions simples fade 150ms
- Écrans de succès plein écran dismissables au clavier (Escape)
- Toasts auto-dismiss lisibles par lecteurs d'écran (`role="status"`, `aria-live="polite"`)
- Hook centralisé `useReducedMotion()` consulté par tous les composants Framer Motion

### Stratégie de Test

**Responsive :**
- Test réel : iPhone SE (petit), iPhone 15 (standard), iPad, desktop 1440px
- Navigateurs : Safari iOS (priorité #1), Chrome Android, Chrome/Firefox desktop
- Performance PWA : Lighthouse > 90 sur mobile 4G

**Accessibilité :**
- axe-core intégré au CI (0 violations AA) — `@axe-core/react` en dev uniquement
- VoiceOver iOS : parcours complet scan → tampon → récompense
- Navigation clavier complète sur dashboard
- Simulation daltonisme : tampons distinguables sans couleur (forme + opacité)

### Guidelines d'Implémentation

**Responsive :**
- Unités relatives : `rem` pour spacing, `%` et `vw` pour layout
- Classes Tailwind responsive : `sm:` / `md:` / `lg:` / `xl:`
- Images : `srcset` + `loading="lazy"`, illustrations SVG scalables
- Viewport : `width=device-width, initial-scale=1`

**Accessibilité :**
- HTML sémantique : `<nav>`, `<main>`, `<section>`, `<button>` (jamais `<div onClick>`)
- ARIA : `aria-label` composants custom, `aria-current="page"` nav active, `role="progressbar"` sur PointsProgressBar
- Focus : `focus-visible` outline forêt 2px, focus trap dans modals/bottom sheets
- Motion : `@media (prefers-reduced-motion: reduce)` → `transition: none`, `animation: none`
- Couleur : ne jamais utiliser la couleur seule comme indicateur (tampon rempli = couleur + forme solid)
