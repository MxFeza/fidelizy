---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-28'
inputDocuments:
  - '{output_folder}/planning-artifacts/prd.md'
  - 'fidelizy/docs/planning-artifacts/product-brief-izou-2026-03-23.md'
  - 'fidelizy/docs/planning-artifacts/personas-izou-2026-03-27.md'
  - 'fidelizy/docs/architecture.md'
  - 'fidelizy/docs/data-models.md'
  - 'fidelizy/docs/api-contracts.md'
  - 'fidelizy/docs/project-overview.md'
  - 'fidelizy/docs/PROJET_STATE.md'
workflowType: 'architecture'
project_name: 'Izou (Fidelizy)'
user_name: 'UX8402'
date: '2026-03-28'
---

# Architecture Decision Document — Izou (Fidelizy)

_Ce document se construit collaborativement, étape par étape. Les sections sont ajoutées au fur et à mesure de nos décisions architecturales._

## Analyse du Contexte Projet

### Vue d'ensemble des Exigences

**Exigences Fonctionnelles (52 FR) :**

| Domaine | FRs | Implications architecturales |
|---------|-----|------------------------------|
| Gestion du commerce (FR1-8) | 8 | Onboarding, templates métier, personnalisation, configuration programme |
| Fidélité tampons (FR9-12) | 4 | Logique métier cœur, progression visuelle, réinitialisation auto |
| Fidélité points (FR13-16) | 4 | Paliers de récompenses, échange, flexibilité de configuration |
| QR intelligent (FR17-22) | 6 | Routage contextuel, détection client existant, OTP, anti-doublon |
| Wallet & Notifications (FR23-29) | 7 | Apple Wallet, Google Wallet (nouveau), push multi-canal, broadcast, cron |
| Parrainage (FR30-33) | 4 | Code unique, attribution automatique, configuration bonus |
| Dashboard & données (FR34-41) | 8 | KPIs temps réel, recherche, filtres, export, notifications commerçant |
| Anti-fraude (FR42-45) | 4 | Cooldown, unicité parrainage, rate limiting, isolation RLS |
| RGPD (FR46-48) | 3 | Suppression cascade, consentement, export données |
| Administration (FR49-52) | 4 | Fallback manuel, corrections, validation récompenses |

**Exigences Non-Fonctionnelles :**

| Catégorie | Contraintes clés |
|-----------|-----------------|
| Performance | LCP < 2s, API < 500ms, wallet < 3s, 60fps animations |
| Sécurité | HTTPS, RLS, OTP, HMAC-SHA256 (Apple), JWT (Google), rate limiting |
| Fiabilité | > 99.5% uptime, 0 bug P0, dégradation gracieuse |
| Maintenabilité | ~25-30 endpoints (vs 45), tests critiques, code repris possible |
| Scalabilité | 5-10 commerçants V1, 30-50 à 12 mois, monolithe suffisant |

**Échelle & Complexité :**

- Domaine principal : Full-stack monolithe web (Next.js App Router)
- Niveau de complexité : Moyen-Haut
- Contexte : Brownfield MVP — consolidation et simplification
- Composants architecturaux estimés : ~8-10 modules fonctionnels

### Contraintes Techniques & Dépendances

**Stack imposée (existante) :**
- Next.js 16 App Router (hybride SSR/CSR) sur Vercel
- Supabase PostgreSQL + Auth + RLS
- Upstash Redis (rate limiting)
- Apple Wallet (APNs HTTP/2, PKCS7, .pkpass)
- Tailwind CSS 4, React 19

**Nouvelles intégrations V1 :**
- Google Wallet API (REST/JWT) — couvre 75% du marché Android
- Tests automatisés (framework à déterminer)

**Contraintes de ressources :**
- Solo dev + outils IA
- Pilote avril 2026
- Pas de CI/CD au-delà de Vercel auto-deploy

### Préoccupations Transverses Identifiées

1. **Authentification bi-modale** — Commerçant (email+password, session cookies, middleware) vs Client (OTP email, sans compte Supabase Auth). Deux systèmes cohabitent avec des niveaux de sécurité différents.

2. **Notifications multi-canal** — Push web (VAPID), Apple Wallet (APNs), Google Wallet (à définir), notifications commerçant. Orchestration unifiée nécessaire.

3. **Isolation des données** — RLS strict par business_id. Service role pour les opérations publiques. Pas de cross-tenant.

4. **Anti-fraude** — Cooldown temporel, rate limiting (15 limiters Upstash), contraintes unicité base de données. Protection du modèle client-initié.

5. **Conformité RGPD** — Suppression cascade (nouveau), consentement, portabilité. Impact sur toutes les tables liées à un customer.

6. **Direction artistique & performance** — Micro-animations premium (scan, progression, confetti, transitions) tout en maintenant 60fps et LCP < 2s. Tension entre richesse visuelle et performance.

7. **Élagage de la complexité** — Retrait roue de la fortune, missions, surprises, goal gradient. Impact sur le schéma de données (tables à conserver/supprimer), les endpoints, et les types TypeScript.

## Évaluation de la Fondation Technique

### Contexte : Projet Brownfield

Izou est un MVP existant déployé en production. La stack est établie — l'enjeu est de valider les décisions existantes et de documenter les évolutions pour la V1 consolidée.

### Stack Existante (validée)

| Couche | Technologie | Version | Statut V1 |
|--------|-------------|---------|-----------|
| Framework | Next.js App Router | 16.1.6 | Conserver |
| UI | React | 19.2.3 | Conserver |
| Langage | TypeScript | 5 | Conserver |
| CSS | Tailwind CSS | 4 | Conserver |
| Base de données | Supabase PostgreSQL + Auth + RLS | 2.98.0 | Conserver |
| Rate limiting | Upstash Redis | 2.0.8 | Conserver |
| Apple Wallet | node-forge + JSZip | 1.3.3 / 3.10.1 | Conserver |
| Push web | web-push (VAPID) | 3.6.7 | Conserver |
| Charts | Recharts | 3.7.0 | Conserver |
| QR Code | html5-qrcode + qrcode.react | 2.3.8 / 4.2.0 | Conserver |
| Déploiement | Vercel (auto-deploy main) | — | Conserver |

### Nouvelles Décisions Techniques V1

#### 1. Framework de Tests : Vitest (services) + Playwright (E2E)

**Tests unitaires/intégration — Vitest :**
- Cible : services extraits dans `lib/services/` (logique métier isolée)
- Mock Supabase pour tester en isolation
- Pas de React Testing Library en V1 — ROI insuffisant pour un solo dev, les E2E couvrent l'UI

**Tests E2E — Playwright :**
- 3 parcours critiques prioritaires :
  1. Inscription client + scan QR + tampon
  2. Dashboard commerçant (KPIs, liste clients, détail)
  3. Parrainage (lien, inscription filleul, bonus)
- Multi-navigateur (Chromium + WebKit) — essentiel pour Apple Wallet sur Safari
- Mode mobile natif (viewport, touch)

**Justification :** React Testing Library retiré du scope V1 — les tests Playwright couvrent déjà les interactions UI. Vitest cible exclusivement la logique métier extraite dans les services. Prioriser Playwright en premier (validation que le produit marche de bout en bout), Vitest sur les services ensuite.

#### 2. State Management : useState local (confirmé)

**Décision : conserver useState local, pas de librairie globale.**

- La V1 simplifie le code — la complexité d'état diminue
- Les Server Components gèrent le chargement initial
- Le polling 8s masque le besoin d'état partagé
- **Point d'attention :** structurer les composants dashboard pour que l'introduction de Zustand soit un changement de 30 minutes si le passage en WebSocket se fait en Phase 2

#### 3. Structure du Code : Extraction Services Progressive

**Décision : extraire `lib/services/` sans réorganiser `app/api/`.**

**Approche pragmatique :**

```
lib/
  services/
    loyalty.service.ts      # Logique tampons, points, paliers
    customer.service.ts     # Inscription, récupération, RGPD
    merchant.service.ts     # Commerce, config, templates
    wallet.service.ts       # Apple Wallet + Google Wallet
    notification.service.ts # Push web, push wallet, broadcast
    referral.service.ts     # Parrainage
    auth.service.ts         # OTP client, session commerçant

app/api/  # Structure de dossiers INCHANGÉE
  # Les route handlers deviennent des wrappers fins :
  # validation input → appel service → réponse JSON
```

**Règle d'extraction :** extraire les services uniquement pour les fonctions qu'on modifie (Google Wallet, fix OTP, RGPD suppression, etc.). Le code existant qui fonctionne sans modification reste en place. La réorganisation complète des dossiers est reportée en Phase 2.

**Justification :**
- Testabilité : les services sont testables en isolation avec Vitest
- Risque minimal : pas de refactoring big bang avant le pilote
- Maintenabilité progressive : chaque modification améliore la structure
- Cohérent avec le PRD : "un autre dev doit pouvoir reprendre"

## Décisions Architecturales

### Priorité des Décisions

**Décisions critiques (bloquent l'implémentation) :**
- Élagage gamification (migration hard delete)
- Google Wallet (nouvelle intégration)
- Service notification unifié (prérequis Google Wallet)
- Fix OTP + suppression de compte RGPD

**Décisions importantes (façonnent l'architecture) :**
- Validation Zod progressive
- Extraction services progressive
- Framework de tests Vitest + Playwright

**Décisions différées (Phase 2) :**
- Réorganisation complète des dossiers (`lib/domains/`)
- State management global (Zustand si besoin WebSocket)
- CI/CD avancé
- Sentry error tracking

### Architecture des Données

#### Élagage Gamification — Hard Delete

**Décision :** Suppression définitive des tables et du code gamification.

**Tables à supprimer (migration SQL) :**
- `wheel_prizes` — segments roue de la fortune
- `wheel_spins` — historique des tours
- `missions` — templates de missions
- `mission_completions` — progrès des clients
- `pwa_visits` — visites PWA (dépendance missions)

**Tables à modifier :**
- `businesses` — retirer les champs gamification du jsonb (`surprise_enabled`, `surprise_probability`, `surprise_reward_type`, `surprise_reward_value`, `wheel_enabled`, `wheel_cost_points`, `goal_gradient_notification`). Conserver `initial_stamps`.

**Tables conservées intégralement :** `businesses`, `customers`, `loyalty_cards`, `transactions`, `reward_tiers`, `reward_claims`, `referrals`, `push_subscriptions`, `wallet_registrations` (9 tables)

**Endpoints à supprimer (~15) :**
- `/api/dashboard/wheel-prizes` (GET/POST/PUT/DELETE)
- `/api/dashboard/missions` (GET/PUT)
- `/api/dashboard/missions/pending` (GET)
- `/api/dashboard/engagement-stats` (GET)
- `/api/dashboard/gamification` (GET/PUT) — simplifier pour ne garder que `initial_stamps`
- `/api/missions/[cardId]` (GET)
- `/api/missions/complete` (POST)
- `/api/missions/validate` (POST)
- `/api/wheel/[cardId]` (GET)
- `/api/wheel/spin` (POST)
- `/api/pwa-visit/[cardId]` (POST)

**Résultat estimé :** ~30 endpoints (vs 45 actuellement)

#### Validation des Données — Zod (progressif)

**Décision :** Introduire Zod pour la validation des inputs API, progressivement sur les services touchés.

**Approche :**
- Créer des schémas Zod dans chaque service (`loyalty.schemas.ts`, `customer.schemas.ts`, etc.)
- Les schémas Zod infèrent les types TypeScript — remplacement progressif de `lib/types.ts`
- Appliquer en priorité sur les routes modifiées (Google Wallet, OTP, RGPD)
- Les routes existantes non modifiées conservent leur validation manuelle

### Authentification & Sécurité

#### Authentification — Conserver l'existant, ajouter Google Wallet JWT

**Décision :** Pas de changement sur l'auth existante. Ajout du JWT Google Wallet.

| Canal | Méthode | Statut V1 |
|-------|---------|-----------|
| Commerçant | Email + password (Supabase Auth, session cookies) | Conserver |
| Client OTP | Email OTP (Supabase Auth signInWithOtp) | Conserver + fix bug |
| Apple Wallet | HMAC-SHA256 + timingSafeEqual | Conserver |
| Google Wallet | JWT signé (clé de service Google) | Nouveau |
| Cron | Bearer CRON_SECRET | Conserver |

#### RGPD — Suppression de compte cascade

**Décision :** Endpoint de suppression cascade pour les clients.

**Séquence de suppression :**
1. `push_subscriptions` (par card_id)
2. `wallet_registrations` (par serial_number = qr_code_id)
3. `referrals` (par referrer_card_id ou referred_card_id)
4. `reward_claims` (par loyalty_card_id)
5. `transactions` (par loyalty_card_id)
6. `loyalty_cards` (par customer_id)
7. `customers` (par id)

**Implémentation :** Fonction Supabase (RPC) ou service-side avec service role. Transaction PostgreSQL pour garantir l'atomicité.

### API & Communication

#### Strategie de Reconstruction — Strangler Fig Pattern (decision 2026-04-12)

**Décision :** Reconstruction chirurgicale du codebase, PAS de rewrite from scratch ni de simple refactoring cosmétique.

**Contexte :** L'audit du code existant (12K lignes, 23 fichiers) révèle :
- 3 mega-composants frontend (1364, 599, 545 lignes) — insoutenables
- 37 routes API avec 85% de logique métier inline, ~220 lignes dupliquées
- 0 tests, <10% des routes avec error handling propre
- MAIS : infrastructure solide (Supabase RLS, Apple Wallet protocol, rate limiting, Vercel)

**Principe Strangler Fig :** Envelopper l'ancien code avec du nouveau propre, tester, puis supprimer l'ancien pièce par pièce. Jamais casser ce qui marche.

**GARDER (ne pas toucher) :**
- Supabase (tables, RLS policies, auth config, migrations)
- Apple Wallet protocol (PKCS7, APNs HTTP/2, register/unregister)
- Middleware auth (`middleware.ts`)
- Rate limiting Upstash (`lib/ratelimit.ts`)
- Config Vercel + crons
- Variables d'environnement

**RECONSTRUIRE (neuf, propre) :**
- `lib/services/` — logique métier extraite, testée (loyalty, customer, merchant, wallet, notification, referral, auth)
- Tous les composants frontend — composants de 100-200 lignes max, alignés Figma V4
- Routes API — wrappers fins de 20-30 lignes (validation Zod → appel service → réponse JSON)
- Error handling — classe `AppError` standardisée avec logging
- Tests — Playwright E2E + Vitest services

**Objectif :** ~8-10K lignes propres au lieu de 12K sales. Moins de code, plus de valeur. Un senior dev peut reprendre le projet en 1 journée de lecture.

#### Consolidation des Endpoints — Suppression gamification + refactoring routes

**Décision :** Suppression des ~15 routes gamification + refactoring progressif des routes restantes en wrappers fins sur services.

#### Notifications — Service unifié

**Décision :** Créer `lib/services/notification.service.ts` comme point d'entrée unique.

**Interface :**
```typescript
type NotificationEvent =
  | 'stamp_added'
  | 'reward_reached'
  | 'referral_success'
  | 'welcome'
  | 'broadcast'
  | 'inactive_reminder';

async function notifyClient(
  cardId: string,
  event: NotificationEvent,
  payload: { title: string; body: string; data?: Record<string, unknown> }
): Promise<{ sent: string[]; failed: string[] }>
```

**Dispatch automatique vers tous les canaux actifs du client :**
1. Push web (VAPID) — si `push_subscriptions` existe
2. Apple Wallet (APNs) — si `wallet_registrations` existe
3. Google Wallet — si google_wallet_token existe (nouveau)

**Bénéfices :** Un seul appel dans les route handlers. L'ajout de Google Wallet ne touche qu'un seul fichier. Dégradation gracieuse si un canal échoue.

### Frontend

#### UI Component Library — Untitled UI React (MIT, gratuit)

**Decision (2026-04-12) :** Utiliser la librairie React officielle d'Untitled UI pour TOUS les composants frontend. Zero composant cree from scratch.

**Justification :**
- Meme design system que le Figma (`PVqIzNHJH5AH3aujECItxR`) = coherence pixel-perfect garantie
- MIT license = gratuit pour usage commercial illimite
- Stack compatible : React 19.2, Tailwind CSS v4.2, TypeScript 5.9, React Aria
- Centaines de composants gratuits : Inputs, Buttons, Badges, Tables, Modals, Sidebars, Verification code inputs, QR codes, Progress, Avatars, etc.
- Pages completes disponibles : Login, Register, Dashboard, Settings

**Installation :**
```bash
npm install @untitledui/icons react-aria-components tailwindcss-react-aria-components tailwind-merge tailwindcss-animate next-themes
```

**Configuration Next.js :**
- `theme.css` avec design tokens (couleurs Brand, spacing, typo Inter)
- `globals.css` importe tailwindcss + theme.css
- RouteProvider + ThemeProvider dans layout.tsx
- Font Inter via next/font/google

**Regle stricte :** JAMAIS creer de composant UI from scratch. Toujours utiliser un composant Untitled UI existant et le configurer. Si un composant n'existe pas dans la lib (ex: StampCard), le construire en COMPOSANT de composants Untitled UI (badges + grids + icons).

**Source :** https://github.com/untitleduico/react, https://www.untitledui.com/react/components

#### Animations — Framer Motion (hybride) + CSS/Tailwind

**Décision :** Framer Motion (MIT, open source, gratuit) pour les animations complexes, CSS/Tailwind pour le reste.

**Framer Motion — animations ciblées :**
- Scan → confirmation tampon (feedback visuel satisfaisant)
- Progression des tampons (remplissage animé)
- Confetti / célébration quand la carte est complétée
- Transitions de page (layoutId)

**CSS/Tailwind — animations simples :**
- Hover/focus sur les boutons
- Loaders et spinners
- Transitions de couleur
- Apparition/disparition d'éléments

### Infrastructure & Déploiement

#### Monitoring — Vercel natif

**Décision :** Vercel Analytics + Vercel Logs pour V1. Sentry en Phase 2 si nécessaire.

### Analyse d'Impact — Séquence d'Implémentation

1. Migration hard delete gamification (libère de la surface de code)
2. Extraction `notification.service.ts` (prérequis Google Wallet)
3. Fix bug OTP + extraction `auth.service.ts`
4. Intégration Google Wallet + `wallet.service.ts`
5. Suppression de compte RGPD + `customer.service.ts`
6. Introduction Zod sur les services extraits
7. Tests Playwright (3 parcours E2E)
8. Tests Vitest (services extraits)
9. Micro-animations Framer Motion
10. Activation Vercel Analytics

**Dépendances croisées :**
- Google Wallet dépend du service notification unifié
- Les tests Vitest dépendent de l'extraction services
- Les tests Playwright peuvent commencer dès que les parcours sont stables
- Zod s'introduit naturellement lors de l'extraction de chaque service

## Patterns d'Implémentation & Règles de Cohérence

### Points de Conflit Potentiels Identifiés

12 zones où des agents IA pourraient faire des choix divergents si les patterns ne sont pas explicités.

### Conventions de Nommage

#### Base de Données (existant — à respecter strictement)

| Élément | Convention | Exemples |
|---------|-----------|----------|
| Tables | snake_case, pluriel | `businesses`, `loyalty_cards`, `push_subscriptions` |
| Colonnes | snake_case | `business_id`, `created_at`, `qr_code_id` |
| Clés étrangères | `{table_singulier}_id` | `customer_id`, `business_id`, `card_id` |
| Index | `idx_{table}_{colonne}` | `idx_referrals_business`, `idx_wheel_spins_card` |
| Contraintes uniques | inline dans la migration | `UNIQUE(business_id, template_key)` |
| JSONB | snake_case dans le JSON | `surprise_enabled`, `initial_stamps` |

#### API (existant — à respecter strictement)

| Élément | Convention | Exemples |
|---------|-----------|----------|
| Routes | `/api/{domaine}/{action}` kebab-case | `/api/card/add`, `/api/push/broadcast` |
| Routes avec paramètre | `/api/{domaine}/[paramId]` | `/api/card/[cardId]/live`, `/api/missions/[cardId]` |
| Query params | snake_case | `?short_code=XXX`, `?phone=XXX` |
| Body JSON | snake_case | `{ card_id, business_id, qr_code_id }` |
| Réponses JSON | snake_case | `{ new_value, points_awarded }` |

#### Code TypeScript (existant — à respecter strictement)

| Élément | Convention | Exemples |
|---------|-----------|----------|
| Fichiers composants | PascalCase `.tsx` | `CardPageClient.tsx`, `QrScanner.tsx` |
| Fichiers utilitaires | camelCase `.ts` | `generatePass.ts`, `sendPush.ts` |
| Fichiers services (nouveau) | kebab-case `.service.ts` | `loyalty.service.ts`, `notification.service.ts` |
| Fichiers schémas (nouveau) | kebab-case `.schemas.ts` | `loyalty.schemas.ts`, `customer.schemas.ts` |
| Composants React | PascalCase | `DashboardClient`, `OTPInput` |
| Fonctions | camelCase | `sendPushToCard()`, `notifyWalletDevices()` |
| Variables | camelCase | `cardId`, `businessName` |
| Types/Interfaces | PascalCase | `Business`, `LoyaltyCard`, `Transaction` |
| Constantes | UPPER_SNAKE_CASE | `CRON_SECRET`, `VAPID_PUBLIC_KEY` |
| Fichiers tests (nouveau) | `{nom}.test.ts` co-localisé | `loyalty.service.test.ts` |
| Fichiers E2E (nouveau) | `{parcours}.spec.ts` dans `e2e/` | `e2e/inscription-scan.spec.ts` |

### Patterns de Structure

#### Organisation des Tests

```
lib/services/
  loyalty.service.ts
  loyalty.service.test.ts      # Co-localisé avec le service
  loyalty.schemas.ts

e2e/
  inscription-scan.spec.ts     # Parcours 1 : inscription + scan + tampon
  dashboard.spec.ts            # Parcours 2 : commerçant dashboard
  parrainage.spec.ts           # Parcours 3 : parrainage
```

**Règle :** Tests unitaires co-localisés avec les services. Tests E2E dans un dossier `e2e/` à la racine.

#### Organisation des Services

```
lib/
  services/                    # Logique métier extraite
    loyalty.service.ts
    customer.service.ts
    notification.service.ts
    wallet.service.ts
    referral.service.ts
    auth.service.ts
    merchant.service.ts
  shared/                      # Utilitaires partagés (existant renommé)
    supabase/
      client.ts
      server.ts
      service.ts
    ratelimit.ts
    anti-fraud.ts
  types.ts                     # Types partagés (migration progressive vers Zod)
```

**Règle :** Un service = un fichier. Pas de sous-dossiers dans `services/`. Les dépendances partagées vont dans `lib/shared/`.

### Patterns de Format

#### Réponses API

**Succès :**
```typescript
return NextResponse.json({ success: true, message: "...", ...data }, { status: 200 });
```

**Erreur :**
```typescript
return NextResponse.json({ error: "Message descriptif" }, { status: 400|401|404|429|500 });
```

**Règle :** Pas de wrapper générique `{ data, error, meta }`. Réponses directes comme l'existant. Un champ `error` (string) pour les erreurs, des champs métier pour les succès.

#### Codes HTTP

| Code | Usage |
|------|-------|
| 200 | Succès (GET, PUT, POST réussi) |
| 400 | Validation échouée (input invalide) |
| 401 | Non authentifié |
| 404 | Ressource non trouvée |
| 429 | Rate limit atteint |
| 500 | Erreur serveur inattendue |

**Règle :** Jamais de 201, 204, ou 422. L'existant utilise 200 pour tout succès — rester cohérent.

#### Dates

- **En base :** `timestamptz` (PostgreSQL)
- **En JSON API :** Chaîne ISO 8601 (`2026-03-28T14:30:00.000Z`)
- **En affichage :** Format français (`28 mars 2026`, `14h30`)

### Patterns de Process

#### Structure d'un Route Handler

```typescript
export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await limiter.limit(ip);
  if (!success) return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });

  // 2. Auth (si nécessaire)
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  // 3. Validation input (Zod si service extrait, manuel sinon)
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  // 4. Appel service
  const result = await loyaltyService.addStamp(parsed.data);

  // 5. Notification (via service unifié)
  await notifyClient(result.cardId, 'stamp_added', { title: '...', body: '...' });

  // 6. Réponse
  return NextResponse.json({ success: true, ...result });
}
```

**Règle :** Les routes modifiées suivent ce pattern. Les routes non modifiées gardent leur structure actuelle.

#### Gestion des Erreurs

```typescript
// Dans les services — throw des erreurs typées
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'VALIDATION' | 'UNAUTHORIZED' | 'CONFLICT',
    public statusCode: number = 400
  ) {
    super(message);
  }
}

// Dans les route handlers — catch et conversion en réponse HTTP
try {
  const result = await service.doSomething(data);
  return NextResponse.json({ success: true, ...result });
} catch (err) {
  if (err instanceof ServiceError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  console.error('Unexpected error:', err);
  return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
}
```

#### États de Chargement (Frontend)

**Règle :** Chaque composant client gère son propre état via `useState<boolean>`. Pas de loading global, pas de skeleton screens en V1.

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

#### Supabase Client — Quelle instance utiliser

| Contexte | Client | Import |
|----------|--------|--------|
| Composant client (browser) | `createBrowserClient()` | `lib/shared/supabase/client.ts` |
| Server Component / middleware | `createServerClient()` | `lib/shared/supabase/server.ts` |
| API Route (opérations publiques) | `createServiceClient()` | `lib/shared/supabase/service.ts` |
| API Route (opérations commerçant) | `createServerClient()` | `lib/shared/supabase/server.ts` |

**Règle :** Opérations client (inscription, scan) → service client (bypass RLS). Opérations commerçant → server client (RLS actif).

### Directives pour les Agents IA

**Tout agent IA travaillant sur ce projet DOIT :**

1. Respecter les conventions de nommage existantes (snake_case en base et API, camelCase en TypeScript)
2. Ne JAMAIS modifier une route API existante qui fonctionne — uniquement ajouter ou supprimer
3. Extraire la logique métier dans `lib/services/` uniquement pour les fichiers qu'il modifie
4. Utiliser Zod pour la validation uniquement dans les services nouvellement extraits
5. Appeler `notifyClient()` du service notification unifié — ne jamais appeler les canaux individuellement
6. Écrire les tests Vitest co-localisés avec les services
7. Utiliser le bon client Supabase selon le contexte (voir tableau ci-dessus)
8. Ne JAMAIS exposer de clé sensible côté client (`NEXT_PUBLIC_` uniquement pour Supabase URL et anon key)
9. Conserver le pattern de réponse API existant (pas de wrapper générique)
10. Écrire tous les messages utilisateur en français

## Structure du Projet & Frontières

### Structure Complète du Répertoire (V1 Consolidée)

```
fidelizy/
├── .env.local                          # Variables d'environnement (17 vars, jamais commité)
├── .env.example                        # Template des variables requises
├── .gitignore
├── middleware.ts                        # Protection routes /dashboard/*
├── next.config.ts                       # Headers sécurité, config Next.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts                     # [NOUVEAU] Configuration Vitest
├── playwright.config.ts                 # [NOUVEAU] Configuration Playwright
│
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                         # Accueil : code commerce + OTP
│   │
│   ├── card/[cardId]/
│   │   ├── page.tsx
│   │   └── CardPageClient.tsx
│   │
│   ├── join/[businessId]/
│   │   ├── page.tsx
│   │   └── JoinForm.tsx
│   │
│   ├── recover/
│   │   ├── page.tsx
│   │   └── RecoverForm.tsx
│   │
│   ├── dashboard/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (protected)/
│   │       ├── page.tsx
│   │       ├── DashboardClient.tsx
│   │       ├── Sidebar.tsx
│   │       ├── clients/
│   │       │   ├── page.tsx
│   │       │   ├── ClientsClient.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx
│   │       │       └── ClientDetailClient.tsx
│   │       ├── notifications/page.tsx
│   │       ├── settings/page.tsx
│   │       └── profile/
│   │           ├── page.tsx
│   │           └── ProfileClient.tsx
│   │
│   ├── components/
│   │   ├── OTPInput.tsx
│   │   ├── QrScanner.tsx
│   │   ├── QrCodeDisplay.tsx
│   │   ├── ShortCodeDisplay.tsx
│   │   └── RegisterSW.tsx
│   │
│   └── api/
│       ├── auth/
│       │   ├── send-otp/route.ts
│       │   ├── verify-otp/route.ts
│       │   └── add-email/route.ts
│       ├── business/route.ts
│       ├── join/route.ts
│       ├── recover/route.ts
│       ├── scan/route.ts
│       ├── card/
│       │   ├── add/route.ts
│       │   ├── deduct/route.ts
│       │   ├── reset/route.ts
│       │   ├── claim-reward/route.ts
│       │   ├── update-profile/route.ts
│       │   └── [cardId]/live/route.ts
│       ├── dashboard/
│       │   ├── kpis/route.ts
│       │   ├── visits-week/route.ts
│       │   ├── top-clients/route.ts
│       │   ├── export-clients/route.ts
│       │   └── gamification/route.ts    # Simplifié : uniquement initial_stamps
│       ├── push/
│       │   ├── subscribe/route.ts
│       │   └── broadcast/route.ts
│       ├── cron/
│       │   └── push-inactive/route.ts
│       ├── manifest/[cardId]/route.ts
│       └── wallet/
│           ├── [cardId]/route.ts
│           └── v1/
│               ├── devices/[deviceLibraryId]/registrations/[passTypeId]/
│               │   ├── route.ts
│               │   └── [serialNumber]/route.ts
│               ├── passes/[passTypeId]/[serialNumber]/route.ts
│               └── log/route.ts
│
├── components/
│   └── dashboard/
│       ├── BottomNav.tsx
│       └── MobileHeader.tsx
│
├── lib/
│   ├── types.ts
│   │
│   ├── services/                        # [NOUVEAU] Logique métier extraite
│   │   ├── loyalty.service.ts
│   │   ├── loyalty.service.test.ts
│   │   ├── loyalty.schemas.ts
│   │   ├── customer.service.ts
│   │   ├── customer.service.test.ts
│   │   ├── customer.schemas.ts
│   │   ├── merchant.service.ts
│   │   ├── notification.service.ts
│   │   ├── notification.service.test.ts
│   │   ├── wallet.service.ts
│   │   ├── wallet.service.test.ts
│   │   ├── referral.service.ts
│   │   ├── referral.service.test.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.test.ts
│   │   └── errors.ts
│   │
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── service.ts
│   │
│   ├── ratelimit.ts
│   ├── referral.ts
│   │
│   └── wallet/
│       ├── generatePass.ts
│       └── push.ts
│
├── e2e/                                 # [NOUVEAU] Tests E2E Playwright
│   ├── inscription-scan.spec.ts
│   ├── dashboard.spec.ts
│   └── parrainage.spec.ts
│
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icon.svg
│   ├── icon-192.png
│   └── icon-512.png
│
├── supabase/
│   └── migrations/
│       ├── ...migrations existantes...
│       └── YYYYMMDD_remove_gamification.sql  # [NOUVEAU]
│
└── docs/
    ├── index.md
    ├── project-overview.md
    ├── architecture.md
    ├── data-models.md
    ├── api-contracts.md
    └── planning-artifacts/
        ├── product-brief-izou-2026-03-23.md
        ├── personas-izou-2026-03-27.md
        ├── prd.md
        └── architecture.md              # CE document
```

**Routes supprimées (élagage gamification) :**
- ~~`app/api/dashboard/wheel-prizes/`~~
- ~~`app/api/dashboard/missions/`~~
- ~~`app/api/dashboard/missions/pending/`~~
- ~~`app/api/dashboard/engagement-stats/`~~
- ~~`app/api/missions/`~~
- ~~`app/api/wheel/`~~
- ~~`app/api/pwa-visit/`~~
- ~~`src/lib/supabase/`~~ (duplication legacy)

### Frontières Architecturales

#### Frontières API

```
                    ┌──────────────────────────────────┐
                    │        ROUTES PUBLIQUES           │
                    │  (service client, bypass RLS)     │
                    │                                  │
                    │  /api/join      /api/auth/*       │
                    │  /api/recover   /api/card/*/live  │
                    │  /api/business  /api/wallet/*     │
                    │  /api/push/subscribe              │
                    │  /api/manifest/*                  │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────┴───────────────────────┐
                    │      ROUTES COMMERÇANT            │
                    │  (server client, RLS actif)       │
                    │  (middleware auth obligatoire)    │
                    │                                  │
                    │  /api/scan        /api/card/*     │
                    │  /api/dashboard/* /api/push/broad │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────┴───────────────────────┐
                    │        ROUTES SYSTÈME             │
                    │  (auth spécifique)               │
                    │                                  │
                    │  /api/cron/*  (Bearer CRON_SECRET)│
                    │  /api/wallet/v1/* (HMAC Apple)    │
                    └──────────────────────────────────┘
```

#### Frontières des Services

```
app/api/ (route handlers)
    │
    │  validation input + auth + rate limit
    │
    ▼
lib/services/ (logique métier)
    │
    │  orchestration, règles métier, transactions
    │
    ├──► lib/supabase/ (accès données)
    ├──► lib/ratelimit.ts (rate limiting)
    ├──► lib/wallet/ (génération .pkpass, push APNs)
    └──► notification.service.ts (dispatch multi-canal)
              │
              ├──► web-push (VAPID)
              ├──► Apple Wallet (APNs HTTP/2)
              └──► Google Wallet (API REST/JWT)
```

**Règle de dépendance :** Les route handlers dépendent des services. Les services dépendent de `lib/supabase/` et des utilitaires. Jamais l'inverse.

#### Frontières des Données

| Couche | Accès | Isolation |
|--------|-------|----------|
| Routes publiques | `createServiceClient()` | Bypass RLS — le code filtre par business_id |
| Routes commerçant | `createServerClient()` | RLS actif — PostgreSQL filtre automatiquement |
| Cron | `createServiceClient()` | Bypass RLS — opérations cross-tenant |
| Client browser | `createBrowserClient()` | Anon key — accès limité aux opérations publiques |

### Mapping Exigences → Structure

| Domaine fonctionnel (FR) | Route API | Service | Composants |
|--------------------------|-----------|---------|------------|
| Gestion commerce (FR1-8) | `/api/business`, `/api/dashboard/gamification` | `merchant.service.ts` | `dashboard/settings/`, `dashboard/(auth)/` |
| Tampons (FR9-12) | `/api/scan`, `/api/card/add,reset` | `loyalty.service.ts` | `card/[cardId]/CardPageClient.tsx` |
| Points (FR13-16) | `/api/card/add,claim-reward` | `loyalty.service.ts` | `card/[cardId]/CardPageClient.tsx` |
| QR intelligent (FR17-22) | `/api/join`, `/api/scan`, `/api/auth/*` | `auth.service.ts`, `customer.service.ts` | `join/`, `app/page.tsx` |
| Wallet (FR23-29) | `/api/wallet/*`, `/api/push/*` | `wallet.service.ts`, `notification.service.ts` | `card/[cardId]/CardPageClient.tsx` |
| Parrainage (FR30-33) | `/api/join` (referral_code) | `referral.service.ts` | `card/[cardId]/CardPageClient.tsx` |
| Dashboard (FR34-41) | `/api/dashboard/*` | `merchant.service.ts` | `dashboard/(protected)/*` |
| Anti-fraude (FR42-45) | Transverse | `lib/ratelimit.ts`, RLS | middleware.ts |
| RGPD (FR46-48) | `/api/customer/delete` [NOUVEAU] | `customer.service.ts` | `card/[cardId]/CardPageClient.tsx` |
| Admin (FR49-52) | `/api/card/add,deduct,reset,claim-reward` | `loyalty.service.ts` | `dashboard/clients/[id]/` |

### Points d'Intégration Externes

| Service externe | Fichier d'intégration | Protocole | Auth |
|----------------|----------------------|-----------|------|
| Supabase PostgreSQL | `lib/supabase/*.ts` | HTTP REST | Anon key / Service role |
| Supabase Auth | `lib/supabase/*.ts` | HTTP REST | Anon key |
| Upstash Redis | `lib/ratelimit.ts` | HTTP REST | API token |
| Apple Wallet (APNs) | `lib/wallet/push.ts` | HTTP/2 | Certificat P8 |
| Apple Wallet (.pkpass) | `lib/wallet/generatePass.ts` | — | PKCS7 signing |
| Google Wallet [NOUVEAU] | `lib/services/wallet.service.ts` | REST API | JWT (service account) |
| Web Push (VAPID) | `notification.service.ts` | HTTP | VAPID keys |
| Vercel Cron | `/api/cron/push-inactive` | HTTP | Bearer token |

## Validation de l'Architecture

### Validation de Cohérence ✅

**Compatibilité des décisions :** Toutes les technologies sont compatibles entre elles. Pas de conflit de version identifié.

**Cohérence des patterns :** Conventions de nommage cohérentes. Patterns de structure alignés avec les décisions.

**Alignement structure :** La structure projet reflète fidèlement toutes les décisions architecturales.

### Couverture des Exigences ✅

**Exigences fonctionnelles :** 52/52 FR couvertes architecturalement.

**Exigences non-fonctionnelles :** Toutes les NFR adressées.

### Analyse des Gaps (post Party Mode validation)

**Gaps critiques : 0**

**Gaps importants — Points aveugles identifiés (6) :**

| # | Point aveugle | Sévérité | Action |
|---|---------------|----------|--------|
| 1 | Données existantes dans les tables gamification en prod | Moyenne | `SELECT COUNT(*)` sur les 5 tables AVANT migration |
| 2 | Cooldown anti-fraude non documenté dans les patterns | Moyenne | Documenter le mécanisme existant (stockage, scope, configuration) |
| 3 | Régression lors du hard delete gamification | Haute | Playwright smoke tests AVANT le hard delete |
| 4 | Extraction notification.service.ts = risque régression | Moyenne | Extraction iso-fonctionnelle obligatoire avant ajout Google Wallet |
| 5 | Bug OTP — root cause non identifiée | Haute | Diagnostiquer si Supabase Auth ou template email AVANT refactoring |
| 6 | Logique de routage QR intelligent non documentée | Haute | Documenter le flux existant (détection client nouveau/existant) |

### Séquence d'Implémentation Révisée

La validation Party Mode a inversé la position des tests E2E : tester AVANT de casser, pas après avoir reconstruit.

1. **Tests Playwright smoke basiques** (filet de sécurité — baseline de non-régression)
2. Diagnostic root cause bug OTP (Supabase Auth ou template email ?)
3. Vérification données prod tables gamification (`SELECT COUNT(*)`)
4. Migration hard delete gamification (+ re-run Playwright pour valider)
5. Extraction `notification.service.ts` (iso-fonctionnelle)
6. Fix bug OTP + extraction `auth.service.ts`
7. Intégration Google Wallet + `wallet.service.ts`
8. Suppression de compte RGPD + `customer.service.ts`
9. Introduction Zod sur les services extraits
10. Tests Vitest (services extraits)
11. Enrichissement tests Playwright (3 parcours complets)
12. Micro-animations Framer Motion
13. Activation Vercel Analytics

### Documentation à ajouter aux Patterns

**Cooldown anti-fraude :** À documenter — mécanisme actuel de prévention des scans multiples (stockage, scope carte vs client, durée, configurabilité).

**Routage QR intelligent :** À documenter — logique de détection client nouveau vs existant vs récupération. Mécanisme critique validé terrain — tout agent IA modifiant ce flux doit comprendre la logique complète.

### Checklist de Complétude

**✅ Analyse des Exigences**
- [x] Contexte projet analysé en profondeur
- [x] Échelle et complexité évaluées
- [x] Contraintes techniques identifiées
- [x] Préoccupations transverses cartographiées

**✅ Décisions Architecturales**
- [x] Décisions critiques documentées avec versions
- [x] Stack technique complètement spécifiée
- [x] Patterns d'intégration définis
- [x] Performance et sécurité adressées

**✅ Patterns d'Implémentation**
- [x] Conventions de nommage établies
- [x] Patterns de structure définis
- [x] Patterns de format spécifiés
- [x] Patterns de process documentés
- [x] Directives agents IA (10 règles)

**✅ Structure du Projet**
- [x] Arborescence complète définie
- [x] Frontières des composants établies
- [x] Points d'intégration cartographiés
- [x] Mapping exigences → structure complet

**✅ Validation**
- [x] Cohérence des décisions vérifiée
- [x] Couverture 52/52 FR confirmée
- [x] Points aveugles identifiés et adressés (6 trouvés via Party Mode)
- [x] Séquence d'implémentation révisée

### Évaluation Finale

**Statut : PRÊT POUR L'IMPLÉMENTATION**

**Niveau de confiance : ÉLEVÉ** (renforcé par la validation multi-perspectives)

**Forces :**
- Architecture brownfield validée par le code en production
- Approche pragmatique — extraction progressive
- Séquence révisée — tests d'abord, refactoring ensuite
- Points aveugles identifiés et mitigés

**Évolutions Phase 2 :**
- Réorganisation dossiers (`lib/domains/`)
- State management global si WebSocket
- Sentry error tracking
- CI/CD avancé
- Gamification simplifiée si demandée
