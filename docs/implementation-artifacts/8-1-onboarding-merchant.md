# Story 8.1 — Onboarding commerçant : checklist ludique + walkthrough enthousiaste

**Epic :** 8 (Onboarding & Activation)
**Taille :** L (~12-15 h)
**Statut :** ready-for-dev
**Date :** 2026-05-08

## 1. Contexte & vision produit

Le pilote Izou ciblera 5-10 commerçants. Chaque commerçant qui s'inscrit doit comprendre **dans les 5 premières minutes** comment configurer son programme et imprimer son QR code. Sans guidage, le risque d'abandon est élevé (l'interface est dense pour un commerçant pas tech).

**Leitmotiv user (validé 2026-05-08)** : *"enthousiasme, doses de dopamine, se sentir privilégié, flatté, compris et rassuré"*. Chaque interaction doit célébrer la progression et faire sentir au commerçant qu'il est en train de transformer son business, pas de remplir un formulaire.

## 2. Pattern UX retenu

**Onboarding Checklist** style Linear / Notion / Vercel (validé 2026-05-08) — pas un walkthrough linéaire one-shot mais un **widget persistant** qui suit la progression :

1. **Modal "Welcome"** au 1ᵉʳ login (avant tout)
2. **Widget checklist** ancré dans la sidebar dashboard, persistant tant que < 100%
3. **Tooltips contextuels driver.js** déclenchés au clic sur chaque tâche
4. **Disparition auto** à 100% complété + célébration finale
5. **Re-launchable** depuis Aide & support → "Refaire la visite"

## 3. Lib retenue : `driver.js`

Lib JS open-source MIT (~5 KB gzipped) pour les popovers/tooltips contextuels. Choisie sur 3 candidates (driver.js, intro.js, shepherd.js) pour sa légèreté + customisation Tailwind facile + accessibilité ARIA solide.

**Install** :
```bash
npm install driver.js
```

**Pattern d'usage** :
```ts
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const tour = driver({
  showProgress: true,
  steps: [
    { element: '#config-loyalty', popover: { title: 'Mode tampons ou points ?', description: '…' } },
    // …
  ],
})
tour.drive()
```

CSS custom (à mettre dans `app/globals.css` pour matcher Untitled UI) :
- Popover background → `bg-primary` (white)
- Border radius → `rounded-2xl`
- Buttons → utiliser `bg-brand-solid`
- Box shadow → `shadow-xl`

## 4. Modal "Welcome" — premier login

Affiché uniquement si `business.onboarding_started_at IS NULL` au login.

**Contenu (texte enthousiaste obligatoire — pas de neutralité corporate)** :

> ### 🎉 Bienvenue {firstName}, vous y êtes !
>
> Vous venez de rejoindre la communauté des commerçants qui transforment leurs clients
> occasionnels en habitués fidèles. **Votre programme va décoller en moins de 5 minutes.**
>
> On vous guide pas à pas pour que vous repartiez avec :
> - ✓ Votre programme de fidélité configuré
> - ✓ Vos premières récompenses paramétrées
> - ✓ Votre QR code prêt à être affiché en boutique
>
> **C'est parti.** [→ Commencer]

**Boutons** :
- Primary violet : "Commencer la visite" (lance le tour driver.js + ouvre la checklist)
- Tertiary : "Plus tard" (ferme le modal mais checklist reste visible dans la sidebar)

**Comportement** : marque `business.onboarding_started_at = now()` au clic sur l'un des 2 boutons. Le modal ne se ré-affiche jamais.

## 5. Widget checklist — persistance

Composant `<OnboardingChecklist />` ancré dans la sidebar dashboard (sous le menu de navigation, au-dessus du `FeedbackBubble`).

**Structure visuelle** :
```
┌─────────────────────────────┐
│ 🚀 Démarrage Izou      3/7  │
│ ▓▓▓▓▓▓▓░░░░░░░░  43 %       │
├─────────────────────────────┤
│ ✓ Compléter mon profil      │
│ ✓ Ajouter mon logo          │
│ ✓ Configurer mes paliers    │
│ ○ Imprimer mon QR code     │
│ ○ Inviter mon premier client│
│ ○ Activer les notifs push   │
│ ○ Voir un client réclamer   │
└─────────────────────────────┘
```

**7 tâches proposées (à valider produit)** :

| # | Tâche | Validation auto-trigger | Dopamine |
|---|---|---|---|
| 1 | **Compléter mon profil** | `businesses.business_name && address && logo_url` IS NOT NULL | "Premier pas franchi !" |
| 2 | **Ajouter mon logo** | `businesses.logo_url IS NOT NULL` | "Votre commerce a déjà l'air pro." |
| 3 | **Configurer mon programme de fidélité** | `businesses.loyalty_type IS NOT NULL` AND (`stamps_required` OR `reward_tiers`) configuré | "Vos clients vont adorer." |
| 4 | **Imprimer mon QR code** | Bouton "J'ai imprimé" cliqué → marque `qr_printed_at = now()` | "Boum 🎉, vous êtes opérationnel." |
| 5 | **Inviter mon premier client** | Première carte créée dans `loyalty_cards` pour ce business | Confetti + "Un premier fidèle !" |
| 6 | **Activer les notifications push** | `business.notif_setup_at IS NOT NULL` (manuel via setting) | "Vos clients reviendront plus souvent." |
| 7 | **Voir un client réclamer sa récompense** | Premier `reward_claims` ou `claim_requests.status='validated'` pour ce business | "Vous l'avez fidélisé. Bravo." |

**Quand 100% atteint** :
- Confetti plein écran (réutiliser `components/client/ConfettiEffect.tsx`)
- Modal félicitations : *"Bravo {firstName} ! Votre programme tourne. Izou devient maintenant invisible — c'est exactement ce qu'on voulait. Continuez à gérer votre commerce, on s'occupe du reste."*
- Marque `business.onboarding_completed_at = now()`
- Le widget disparaît de la sidebar

## 6. Tooltips contextuels driver.js

Au clic sur une tâche non-cochée, on déclenche un mini-tour driver.js (1-3 steps) qui pointe les zones de l'interface concernées :

**Exemple Tâche 3 — "Configurer mon programme de fidélité"** :
1. Popover sur l'onglet Marketing > Fidélité (sidebar) : *"Tout commence ici. Cliquez pour configurer votre programme."*
2. Popover sur le sélecteur Tampons/Points : *"Tampons : carte de café (X visites = 1 offerte). Points : commerce avec ticket variable. Choisissez selon votre activité."*
3. Popover sur le bouton "Ajouter un palier" : *"Ajoutez 2-4 paliers pour donner envie à vos clients de revenir."*

À écrire pour chacune des 7 tâches (sauf 1, 4, 5, 7 qui se déclenchent par actions naturelles, pas besoin de tour).

## 7. DB schema additions

Migration `20260YYZZ_add_business_onboarding_columns.sql` :

```sql
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS onboarding_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS qr_printed_at timestamptz,
  ADD COLUMN IF NOT EXISTS notif_setup_at timestamptz;

COMMENT ON COLUMN public.businesses.onboarding_started_at IS
  'Timestamp click sur Welcome modal — empêche re-affichage';
COMMENT ON COLUMN public.businesses.onboarding_completed_at IS
  '100% checklist done — masque le widget OnboardingChecklist';
```

Indexer pas nécessaire (lecture par owner via `businesses.id = auth.uid()`).

## 8. Endpoints API

| Endpoint | Méthode | Body | Effet |
|---|---|---|---|
| `/api/business/onboarding/start` | POST | — | `onboarding_started_at = now()` (idempotent) |
| `/api/business/onboarding/qr-printed` | POST | — | `qr_printed_at = now()` (idempotent) |
| `/api/business/onboarding/notif-setup` | POST | — | `notif_setup_at = now()` (idempotent) |
| `/api/business/onboarding/complete` | POST | — | `onboarding_completed_at = now()` (idempotent) |
| `/api/business/onboarding/status` | GET | — | Renvoie `{ started, completed, tasks: [{id, label, done}, …] }` calculé côté serveur |

Auth : tous via `supabase.auth.getUser()` (cookie SSR), filtre `business_id = user.id`.
Rate-limit : `cardWriteLimiter` réutilisable (20/60s, déjà existant).

## 9. Fichiers à créer

| Path | Description |
|---|---|
| `components/dashboard/onboarding/OnboardingWelcomeModal.tsx` | Modal 1ᵉʳ login |
| `components/dashboard/onboarding/OnboardingChecklist.tsx` | Widget sidebar persistant |
| `components/dashboard/onboarding/TaskItem.tsx` | Item de tâche cochable |
| `components/dashboard/onboarding/onboardingTour.ts` | Définition des steps driver.js par tâche |
| `lib/onboarding/getMerchantTaskStatus.ts` | Logique de calcul des 7 tâches côté serveur (lit `businesses` + comptes liés) |
| `app/api/business/onboarding/start/route.ts` | Endpoint POST start |
| `app/api/business/onboarding/status/route.ts` | Endpoint GET status |
| `app/api/business/onboarding/qr-printed/route.ts` | Endpoint POST qr-printed |
| `app/api/business/onboarding/notif-setup/route.ts` | Endpoint POST notif-setup |
| `app/api/business/onboarding/complete/route.ts` | Endpoint POST complete |
| `supabase/migrations/2026MMDD_add_business_onboarding_columns.sql` | Migration DB |

## 10. Fichiers à modifier

| Path | Modification |
|---|---|
| `app/dashboard/(protected)/layout.tsx` | Mount `<OnboardingWelcomeModal />` + `<OnboardingChecklist />` (en server component si possible avec data initiale, sinon client component qui fetch /status au mount) |
| `app/dashboard/(protected)/page.tsx` ou similaire | Pas de modif si layout fait le job |
| `app/dashboard/(protected)/profile/...` | Section "Aide & support" : ajouter bouton "Refaire la visite" qui reset `onboarding_completed_at = NULL` et redéclenche le widget |
| `package.json` | `npm install driver.js` |
| `app/globals.css` | Custom CSS pour matcher Untitled UI (popover background, radius, shadow) |

## 11. Critères d'acceptation

1. ✅ Au 1ᵉʳ login post-inscription, modal Welcome s'affiche avec texte enthousiaste
2. ✅ Le clic sur "Commencer" lance le tour driver.js sur l'onglet Marketing
3. ✅ Le widget checklist apparaît en sidebar dès que `onboarding_started_at` est set
4. ✅ Les 7 tâches sont calculées en temps réel (refresh à chaque navigation page)
5. ✅ Cocher une tâche → effet visuel (check anim + couleur verte success)
6. ✅ Cliquer sur une tâche non-cochée → ouvre le mini-tour contextuel ou navigue vers la page concernée
7. ✅ Atteindre 100% → confetti + modal félicitations + widget disparaît
8. ✅ Profil > Aide & support > "Refaire la visite" → reset onboarding_completed_at + widget réapparaît
9. ✅ Le modal Welcome ne se ré-affiche **jamais** après 1ᵉʳ click (même si re-login)
10. ✅ Les écrits respectent le leitmotiv enthousiasme — pas de phrases neutres type "Vous avez complété cette étape"

## 12. Effort détaillé

| Phase | Sous-tâches | Estimation |
|---|---|---|
| **Phase 1 — Setup DB + endpoints** | Migration + 5 endpoints + getMerchantTaskStatus | 3 h |
| **Phase 2 — Modal Welcome** | Composant + intégration layout + texte produit | 2 h |
| **Phase 3 — Widget checklist** | OnboardingChecklist + TaskItem + sidebar mount + UI Untitled UI | 3 h |
| **Phase 4 — Tours driver.js** | Install lib + onboardingTour.ts (3 tours pour tâches 2, 3, 6) + CSS custom | 3 h |
| **Phase 5 — Célébration 100%** | ConfettiEffect mount + modal + reset link | 1.5 h |
| **Phase 6 — Test bout-en-bout** | Test pilote sur 2-3 comptes commerçants test, ajuster textes | 2.5 h |
| **Total** | | **~15 h** |

## 13. Dépendances

- **Story 7.2 (Profil reroute)** — DONE
- **Migration prod TD-001** — DONE (validée user 2026-05-08)
- **`driver.js`** — à installer via `npm install driver.js`
- **`ConfettiEffect.tsx`** — déjà existant (`components/client/ConfettiEffect.tsx`), à réutiliser

## 14. Risques

- **Texte produit** : le leitmotiv "enthousiasme" est subjectif. Soumettre les wordings au user avant push prod.
- **Performance** : le widget checklist appelle `/api/business/onboarding/status` à chaque navigation. Cacher 30s côté client.
- **Conflits z-index** : driver.js + modal Welcome + sidebar peuvent se chevaucher. Tester sur mobile (375px) ET desktop.
- **A11y** : driver.js gère ARIA mais s'assurer que le focus revient correctement à l'élément précédent à la fermeture.

## 15. Suite

Story 8.2 (onboarding client) sera traitée en parallèle dans une session dédiée — focus PWA install + Apple Wallet.
