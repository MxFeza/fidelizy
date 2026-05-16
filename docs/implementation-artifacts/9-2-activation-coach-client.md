# Story 9.2 — Activation coach client : install PWA + Wallet en priorité

**Epic :** 9 (Activation & Coaching) — **NOUVEAU**, à distinguer de :
- Epic 8 « Mon Espace & RGPD » (déjà dans roadmap)
- Story 4.2 « Onboarding client A1→A6 » (Epic 4 inscription, 5 écrans signup)
- Story 7.2 « Onboarding choix métier » (Epic 7 inscription merchant)

**Taille :** M (~8-10 h)
**Statut :** ready-for-dev
**Date :** 2026-05-08

## 1. Contexte & priorités produit

Le client final scanne le QR code commerçant, s'inscrit en 30 secondes (prénom + tel + email + OTP), et arrive sur sa carte. Sans onboarding, **deux piliers du produit sont sous-exploités** :

1. **Notifications push** — pilier de fidélisation (rappels récompense, campagnes commerçant). Sans installation PWA sur le téléphone, **les notifs ne fonctionnent pas** (Safari iOS exige PWA installée pour autoriser les push).
2. **Apple/Google Wallet** — la carte au format pass système est plus visible que la PWA dans la vie quotidienne (Apple/Google Pay shortcuts).

**Priorités validées user 2026-05-08 (par ordre)** :
1. Installer la PWA sur le tel (= autorise les notifs push, pilier produit)
2. Ajouter la carte au Wallet
3. Autres bénéfices (parrainage, customisation)

## 2. Pattern UX retenu

Même pattern que Story 8.1 (Onboarding Checklist Linear/Notion-style) mais **adapté mobile-first** car le client est ~95% sur mobile :

1. **Sheet bottom modal "Welcome"** au 1ᵉʳ accès `/card/[cardId]` post-onboarding (sheet plutôt que modal centré pour mobile)
2. **Banner sticky-top** ou **Card discrète** sur la home `/card/[cardId]` qui suit la progression (3 tâches)
3. **Tooltips contextuels driver.js** déclenchés au clic sur chaque tâche
4. **Disparition auto** à 3/3 tâches complétées + célébration light (toast "Bravo, vous êtes prêt à fidéliser !")
5. **Pas de re-launch** : une fois fait c'est fait, pas de "Refaire la visite" (le client n'en aura plus besoin)

## 3. Particularité mobile : install PWA

L'install PWA dépend de l'OS :

| OS / Navigateur | Méthode |
|---|---|
| **iOS Safari** | Pas d'API beforeinstallprompt. **Tutoriel manuel** : "Tapez sur le bouton Partager > Ajouter à l'écran d'accueil" |
| **Android Chrome / Edge** | Event `beforeinstallprompt` capté, déclenchement programmatique via `prompt()` |
| **Desktop (Chrome/Edge)** | Idem Android — `beforeinstallprompt` |
| **Safari Desktop, Firefox** | Pas de support PWA install — fallback "ouvrez sur votre mobile" |

**Côté code, tout existe déjà partiellement** : `app/card/[cardId]/CardPageClient.tsx` capture déjà `beforeinstallprompt` et affiche un banner Android (commit `9533fa0`). On va capitaliser dessus.

## 4. Sheet bottom "Welcome" — premier accès

Affiché uniquement si `customers.onboarding_started_at IS NULL` au 1ᵉʳ render `/card/[cardId]`.

**Contenu (3 slides scrollables horizontalement, façon stories Instagram)** :

**Slide 1 — Bienvenue** :
> ### 🎉 Bonjour {firstName} !
>
> Votre carte fidélité chez **{businessName}** est prête.
> En 2 minutes, on configure tout pour que vous ne ratiez plus jamais une récompense.
>
> [→ C'est parti]

**Slide 2 — Pourquoi installer Izou sur votre téléphone ?**
> ### 📱 Recevez vos récompenses en temps réel
>
> Installez Izou comme une app sur votre téléphone (en 1 clic) pour :
> - 🔔 Recevoir une notif quand votre récompense est débloquée
> - 🎁 Être prévenu des offres exclusives de **{businessName}**
> - ⚡ Accéder à votre carte sans ouvrir Safari/Chrome
>
> [→ Installer maintenant]

**Slide 3 — Wallet (optionnel, skip-able)** :
> ### 💳 Votre carte directement dans votre Wallet
>
> Ajoutez votre carte à Apple Wallet pour la retrouver d'un swipe sans déverrouiller votre téléphone.
>
> [→ Ajouter au Wallet] [Plus tard]

**Boutons globaux du sheet** :
- "Skip" (en haut-droite) qui ferme le sheet et marque `onboarding_started_at`
- Sur slide 2/3 : "Continuer" en bottom

**Comportement** : marque `customers.onboarding_started_at = now()` au 1ᵉʳ swipe ou clic.

## 5. Banner progression sur la home `/card/[cardId]`

Après le sheet Welcome, un banner persistant en haut de la page `/card/[cardId]` (sous le greeting "Bienvenue {firstName}") affiche la progression :

```
┌──────────────────────────────────────┐
│  ⚡ Configurez votre carte    1/3    │
│  ▓▓▓▓▓░░░░░░░░░░  33 %               │
├──────────────────────────────────────┤
│  ✓  Carte créée                       │
│  ○  Installer l'app sur mon tel  [→] │
│  ○  Ajouter au Apple Wallet      [→] │
└──────────────────────────────────────┘
```

**Comportement** :
- Cliquer une tâche `[→]` ouvre le mini-flow correspondant
- Une fois 3/3 → toast "Bravo, vous êtes prêt à fidéliser !" + banner disparaît
- Marque `customers.onboarding_completed_at = now()`

## 6. Les 3 tâches client (mobile-first)

| # | Tâche | Détection | Action si non-fait |
|---|---|---|---|
| 1 | **Carte créée** | Auto (toujours `true` à l'arrivée) | — (déjà coché) |
| 2 | **Installer l'app sur mon tel** | `customers.pwa_installed_at IS NOT NULL` OR `display-mode: standalone` détecté côté client | iOS : tooltip "Tapez sur ⎧ puis Ajouter à l'écran d'accueil" / Android : déclenche `beforeinstallprompt` |
| 3 | **Ajouter au Apple Wallet** | `customers.wallet_added_at IS NOT NULL` OR `wallet_registrations.customer_id = X` exists | Bouton qui télécharge le pkpass via `/api/wallet/[qrCodeId]` |

Note : tâche **parrainage** mise hors scope — pas dans les priorités validées user, peut s'ajouter en P1 si feedback demande.

## 7. DB schema additions

Migration `20260YYZZ_add_customer_onboarding_columns.sql` :

```sql
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS onboarding_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS pwa_installed_at timestamptz,
  ADD COLUMN IF NOT EXISTS wallet_added_at timestamptz;

COMMENT ON COLUMN public.customers.pwa_installed_at IS
  'Timestamp install PWA detecté côté client (display-mode standalone) ou via prompt natif';
```

## 8. Endpoints API

| Endpoint | Méthode | Body | Effet |
|---|---|---|---|
| `/api/me/onboarding/start` | POST | — | `onboarding_started_at = now()` |
| `/api/me/onboarding/pwa-installed` | POST | — | `pwa_installed_at = now()` (idempotent) |
| `/api/me/onboarding/wallet-added` | POST | — | `wallet_added_at = now()` (idempotent) |
| `/api/me/onboarding/complete` | POST | — | `onboarding_completed_at = now()` |
| `/api/me/onboarding/status` | GET | — | Renvoie `{ started, completed, tasks: [{id, label, done}, …] }` |

Auth via cookie SSR Customer + filtre par email matching.

## 9. Fichiers à créer

| Path | Description |
|---|---|
| `components/client/onboarding/OnboardingWelcomeSheet.tsx` | Sheet 3-slides au 1ᵉʳ accès |
| `components/client/onboarding/OnboardingProgressBanner.tsx` | Banner persistant home carte |
| `components/client/onboarding/PwaInstallPrompt.tsx` | Composant qui gère iOS tutorial vs Android prompt natif |
| `lib/onboarding/getCustomerTaskStatus.ts` | Calcul des 3 tâches côté serveur |
| `app/api/me/onboarding/start/route.ts` | + 4 autres endpoints (cf. §8) |
| `supabase/migrations/2026MMDD_add_customer_onboarding_columns.sql` | Migration DB |

## 10. Fichiers à modifier

| Path | Modification |
|---|---|
| `app/card/[cardId]/CardPageClient.tsx` | Mount `<OnboardingWelcomeSheet />` au top + `<OnboardingProgressBanner />` sous le greeting. Fusionner avec les banners install iOS/Android existants (lignes 254-306) — la logique passe sous le composant `PwaInstallPrompt` |
| `app/card/[cardId]/page.tsx` | SSR fetch onboarding status pour éviter flash unauth client-side |

## 11. Critères d'acceptation

1. ✅ Au 1ᵉʳ accès `/card/[cardId]`, sheet Welcome s'ouvre (3 slides scrollables)
2. ✅ Le sheet ne se ré-affiche jamais après 1ᵉʳ skip ou completion
3. ✅ Banner progression apparaît sous le greeting tant que < 3/3
4. ✅ Tâche "Installer l'app" :
   - Sur iOS Safari : tooltip qui guide vers le bouton Partager (visuel ARIA)
   - Sur Android Chrome : déclenche `beforeinstallprompt.prompt()`
   - Détection auto via `display-mode: standalone` quand l'app est ouverte depuis l'écran d'accueil → check + persist `pwa_installed_at`
5. ✅ Tâche "Wallet" : bouton télécharge le `.pkpass` (via endpoint existant) + ouvre le picker iOS, puis marque `wallet_added_at`
6. ✅ Atteindre 3/3 → toast success + banner disparaît
7. ✅ Le banner est `md:hidden` (mobile uniquement) — sur desktop il est inutile (PWA install desktop pas critique pour pilote)
8. ✅ Pas de double UI avec les banners install iOS/Android existants — on les remplace par `PwaInstallPrompt` unifié

## 12. Effort détaillé

| Phase | Sous-tâches | Estimation |
|---|---|---|
| **Phase 1 — Setup DB + endpoints** | Migration + 5 endpoints + getCustomerTaskStatus | 2 h |
| **Phase 2 — Sheet Welcome** | OnboardingWelcomeSheet 3 slides + animation swipe | 2 h |
| **Phase 3 — Banner progression** | OnboardingProgressBanner + intégration CardPageClient | 1.5 h |
| **Phase 4 — PwaInstallPrompt unifié** | Refactor des banners iOS/Android existants → composant unifié + détection display-mode standalone | 2 h |
| **Phase 5 — Wallet integration** | Bouton + tracking ajout Apple Wallet | 1.5 h |
| **Phase 6 — Test mobile réel** | iPhone + Android : flow complet, persistance entre re-loads | 1 h |
| **Total** | | **~10 h** |

## 13. Dépendances

- **Story 6.0 Apple Wallet** (DONE) — endpoint `/api/wallet/[qrCodeId]` existe déjà
- **Story 4.7-v2 P1** (DONE) — endpoint `/api/me/feedback` cookbook auth pattern
- **Story 7.3** (DONE) — `FeedbackBubbleClient` peut servir de référence pour le pattern bottom-sheet mobile
- **PWA service worker existant** — déjà fonctionnel (`public/sw.js` ou similaire)

## 14. Risques

- **iOS Safari** : pas d'API d'install programmatique. Le tutoriel visuel doit être très clair sinon les iPhone users abandonnent. Tester sur iPhone réel.
- **Wallet Apple cert** : le pkpass nécessite des certs Apple à jour côté serveur. Vérifier `APPLE_*` env vars en prod Vercel avant test.
- **`display-mode: standalone`** : la détection PWA installed n'est fiable qu'une fois l'app ouverte depuis l'icône d'accueil. Si user installe puis re-ouvre via Safari direct, on ne détecte pas — il faudra qu'il clique manuellement "J'ai installé".
- **Wording** : moins critique que côté merchant mais garder un ton chaleureux. Pas de jargon technique ("PWA", "Wallet", "service worker").

## 15. Out-of-scope

- **Onboarding parrainage** (= partage code à un ami) : pas dans les priorités, à voir post-pilote
- **Onboarding customisation carte couleur** : déjà accessible via `/me/profile/card-customization`, pas besoin de l'inclure
- **Onboarding rejouable** : pas demandé pour le client (vs commerçant), keep it simple
- **Tour driver.js** : pas nécessaire pour ce parcours mobile court (3 tâches), mais peut s'ajouter si besoin pour la tâche Wallet
