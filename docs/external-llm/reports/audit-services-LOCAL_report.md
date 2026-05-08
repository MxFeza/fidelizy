# Audit sécurité — Services métier (Plan B local)

**Source :** Claude Code Opus 4.7 (audit local, fallback Gemini session 3 bloquée)
**Date :** 2026-05-08
**Scope :** `lib/services/**/*.ts` (12 fichiers, ~1485 lignes, ~15K tokens)
**Bundle audité :** `.tmp/audit-services.md`

## Résumé exécutif

| Tier | Description | Nombre |
|---|---|---|
| **Tier 1 (P0)** | Prod-bloquant pilote — exploitabilité réaliste | **3** |
| **Tier 2 (P1)** | À fixer avant scale (>20 commerçants) | **6** |
| **Tier 3 (P2)** | Hardening / nice-to-have | **4** |

Verdict global : **architecture services solide**. Validation Zod systématique, RPCs Postgres atomiques sur les opérations critiques (`increment_stamps`, `deduct_points`, `increment_points`), RLS verrouillée sur `claim_requests`, idempotence sur `registerCustomer` et `validateClaim`. **3 findings P0 réels** liés à la cryptographie des codes, le takeover account et l'absence de cooldown sur les ajouts manuels.

---

## Tier 1 — P0 (prod-bloquant pilote)

### T1-1 — `generateCode()` utilise `Math.random()` non-crypto

**File :** [lib/services/claim.service.ts:158-164](../../lib/services/claim.service.ts#L158-L164)

```ts
function generateCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)]
  }
  return code
}
```

**Evidence :** `Math.random()` n'est pas cryptographiquement sûr. Sur charset 30 chars × 6 positions = 729M combinaisons. Avec ~10 commerçants × ~10 claims pending simultanés possibles, l'espace effectif des codes valides à un instant T peut descendre à ~100. Un attaquant qui devine ou bruteforce peut valider une réclamation pour le compte d'un autre client (le validateClaim filtre par `business_id` mais pas par `client_id`).

**Impact pilote :** un employé d'un commerce X qui connaît le code d'une victime peut le réclamer côté caisse → vol de récompense. Risque amplifié par la fenêtre de 5 min TTL.

**Recommendation :** remplacer par `crypto.getRandomValues()` (web crypto, dispo dans Next.js Edge/Node) :
```ts
function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => CODE_CHARSET[b % CODE_CHARSET.length]).join('')
}
```
**Note** : `b % CODE_CHARSET.length` introduit un biais minime (30 ne divise pas 256) mais négligeable pour ce use-case.

**Effort :** 0.5 h

---

### T1-2 — Account takeover via `addEmailAndSendOtp` (phone seul)

**File :** [lib/services/auth.service.ts:970-997](../../lib/services/auth.service.ts#L970-L997)

```ts
export async function addEmailAndSendOtp(
  supabase, supabaseAuth,
  params: AddEmailInput  // { phone, email }
) {
  const { phone, email } = params
  const { error: updateError } = await supabase
    .from('customers')
    .update({ email })          // ⚠️ écrase l'email existant
    .eq('phone', phone.trim())
  // ...
  await supabaseAuth.auth.signInWithOtp({ email, ... })
}
```

**Evidence :** la fonction met à jour l'email d'un customer identifié uniquement par son numéro de téléphone, **sans facteur d'authentification préalable**. Un attaquant qui connaît le phone d'une victime (carte papier visible, scan QR public) peut :
1. Appeler la route qui invoque `addEmailAndSendOtp` avec `{ phone: <victime>, email: <attaquant> }`
2. Recevoir l'OTP côté attaquant
3. Compléter `verifyOtp` → session valide sur le compte de la victime
4. Voir/agir sur ses cartes, supprimer le compte, etc.

**Impact pilote :** takeover réaliste. Le téléphone n'est pas un secret (visible sur sticker QR commerce, transmissible verbalement).

**Recommendation :** exiger un OTP préalable sur le phone (via signInWithOtp SMS si Supabase le supporte) ou bloquer l'écrasement si l'email existe déjà :
```ts
const { data: existing } = await supabase
  .from('customers')
  .select('email')
  .eq('phone', phone.trim())
  .maybeSingle()

if (existing?.email && existing.email !== email) {
  throw new AppError("Cet utilisateur a déjà un email enregistré.", 409)
}
```
Pas de dégradation UX significative : un user qui a perdu accès à son email passe par le support.

**Effort :** 1 h (fix défensif) à 4 h (flow OTP phone complet).

---

### T1-3 — Aucun cooldown sur `addToCard` (action merchant manuelle)

**File :** [lib/services/loyalty.service.ts:1115-1145](../../lib/services/loyalty.service.ts#L1115-L1145)

**Evidence :** `scanCard` (QR comptoir client) impose un cooldown anti-fraude de 4h par défaut entre 2 scans (lignes 1066-1092). Mais `addToCard`, qui est l'action **manuelle merchant** (employé qui ajoute des tampons depuis le dashboard), n'a **aucune limite**. Un employé malhonnête peut crediter ses propres cartes (ou celles d'amis) à volonté. Un commerce qui veut booster ses chiffres KPI peut spam ses propres cartes. Le `amount.max(1000)` du Zod est trop large.

**Impact pilote :** abuse réaliste par employés. Sur 5-10 commerçants, suffit d'un seul mauvais acteur pour vider le système de récompenses ou bias les analytics.

**Recommendation :**
- A) Ajouter un rate-limit Upstash sur l'endpoint `/api/dashboard/.../add` (ex: max 50 ajouts / min / merchant)
- B) Borner `amount` à un max raisonnable contextuel (ex: `min(amount, business.stamps_required)` — pas plus que une carte complète d'un coup)
- C) Logger systématiquement avec timestamp + employee_id si multi-user dashboard

**Effort :** 1.5 h (B + rate-limit basique)

---

## Tier 2 — P1 (à fixer avant scale)

### T2-1 — `registerCustomer` permet hijack de compte par email connu

**File :** [lib/services/customer.service.ts:734-743](../../lib/services/customer.service.ts#L734-L743)

```ts
if (email) {
  const { data } = await supabase.from('customers').select('id').eq('email', email.toLowerCase()).maybeSingle()
  if (data) existingCustomer = data
}
```

**Evidence :** lookup par email d'abord. Si un attaquant connaît l'email d'une victime, il peut s'inscrire chez un commerce X avec `{ phone: <attaquant>, email: <victime> }` → la nouvelle carte est attachée au compte de la victime. La victime voit une carte non sollicitée chez X dans son `/me`. Pas de takeover direct (l'attaquant n'a pas accès aux autres cartes de la victime), mais leak de l'existence du compte + bruit/spam pour la victime.

**Recommendation :** envoyer email de confirmation à `email` avant attachement à un compte existant, OU exiger que phone match aussi (réduit le scope mais on perd la fonctionnalité multi-cartes Netflix).

**Effort :** 2 h

---

### T2-2 — `generateReferralCode` format prévisible

**File :** [lib/services/referral.service.ts:507-511](../../lib/services/referral.service.ts#L507-L511)

```ts
export function generateReferralCode(firstName: string, phone: string): string {
  const prefix = firstName.substring(0, 4).toUpperCase().padEnd(4, 'X')
  const suffix = phone.slice(-4)
  return `${prefix}-${suffix}`
}
```

**Evidence :** le code est entièrement déterministe à partir de (firstName, phone). Quelqu'un qui connaît le prénom + 4 derniers chiffres du téléphone d'un client peut générer son referral code et l'utiliser comme parrain pour ses propres inscriptions → vol de bonus de parrainage à répétition.

**Impact pilote :** réaliste si bonus de parrainage > 0. Borné par `referral_enabled` + bonus configurable, mais les commerces avec referral activé sont exposés.

**Recommendation :** générer un code aléatoire (8 chars `crypto.getRandomValues`) stocké en DB sur `customers.referral_code` ou `loyalty_cards.referral_code`. Format actuel garde-le pour migration mais nouvelle source = colonne DB.

**Effort :** 3 h (migration + backfill + 2 endpoints).

---

### T2-3 — Pas d'unique constraint sur `referrals` → double-bonus possible

**File :** [lib/services/referral.service.ts:578-584](../../lib/services/referral.service.ts#L578-L584)

```ts
await supabase.from('referrals').insert({
  referrer_card_id: ..., referred_card_id: ..., business_id: ...,
}).throwOnError()
```

**Evidence :** rien n'empêche d'insérer 2 fois la même `(referrer_card_id, referred_card_id)`. En pratique `processReferral` n'est appelée qu'une fois par registration, mais une race-condition (double-submit, retry HTTP) peut crédit doublement. Pas de check `existingReferral` avant insert.

**Recommendation :** ajouter UNIQUE INDEX (referrer_card_id, referred_card_id) dans une migration + `try/catch` sur l'insert pour dédup gracieusement.

**Effort :** 1 h

---

### T2-4 — `claimReward` `tier.id` virtuel envoyé en `reward_tier_id`

**File :** [lib/services/loyalty.service.ts:1276](../../lib/services/loyalty.service.ts#L1276) + [loyalty.tiers.ts:415](../../lib/services/loyalty.tiers.ts#L415)

**Evidence :** `resolveClientTiers` renvoie un tier virtuel avec `id: 'virtual-stamps-reward'` (pas un UUID). `claimReward` insère ça directement dans `reward_claims.reward_tier_id`. Si la colonne a une FK strict sur `reward_tiers(id)`, le claim plante en runtime sur les commerces single-tier sans tier JSONB. Le commit message de claim.service.ts dit "plus de FK strict depuis Story 4.4" donc c'est probablement OK, mais à cross-checker côté schéma DB (bundle Auth/RLS Gemini).

**Recommendation :** soit confirmer absence de FK (test d'intégration), soit nullifier explicitement quand l'id démarre par `virtual-` (pattern déjà utilisé dans claim.service.ts:253).

**Effort :** 0.5 h

---

### T2-5 — `addToCard` `amount.max(1000)` trop large

**File :** [lib/services/loyalty.schemas.ts:65-71](../../lib/services/loyalty.schemas.ts#L65-L71)

**Evidence :** un merchant peut envoyer `amount: 1000` en une requête. Pour une carte stamps_required=10, ça crée un déséquilibre comptable absurde (rapport KPI faussé, transaction "1000 tampons ajoutés" dans l'historique client). Combine avec T1-3.

**Recommendation :** clamp côté service à `Math.min(amount, business.stamps_required * 5)` ou similaire. Validation Zod ne sait pas le contexte business, donc à faire côté service.

**Effort :** 0.5 h

---

### T2-6 — Notification errors silently swallowed

**File :** [lib/services/loyalty.service.ts:1187, 1294, 1342](../../lib/services/loyalty.service.ts#L1187) + [referral.service.ts:614, 645](../../lib/services/referral.service.ts#L614)

**Evidence :** `notifyClient(...).catch(() => {})` partout. Si push échoue (Supabase down, VAPID expiré, Apple cert rotation), le user perd la notif **silencieusement**. Pas de Sentry capture, pas de retry. Acceptable pour pilote 5-10 commerçants si on accepte que les notifs sont best-effort.

**Recommendation :** au moins capturer dans Sentry (`Sentry.captureException`) pour observabilité. Garder le `catch` pour ne pas bloquer le flow business.

**Effort :** 1 h

---

## Tier 3 — P2 (hardening)

### T3-1 — `console.error` dans `auth.service.ts:919` au lieu de logger structuré

Couvert par bundle 4 (Wallet + Observability). Logger Sentry à introduire globalement.

### T3-2 — `generateCode` peut throw 500 sur 5 collisions consécutives

[claim.service.ts:243](../../lib/services/claim.service.ts#L243) — extrêmement improbable (charset 30^6) mais log warn + retry alternatif (8 chars) plus robuste.

### T3-3 — `validateClaim` race-condition documentée mais limite à 1 retry

[claim.service.ts:335-337](../../lib/services/claim.service.ts#L335) — l'atomic update gère le double-claim mais ne distingue pas "déjà validé" de "race perdue" dans le message (les 2 renvoient 409). UX correcte mais traçabilité limitée.

### T3-4 — `findCustomerCards` lookup par phone seul

[customer.service.ts:836-858](../../lib/services/customer.service.ts#L836) — pas un problème si la route appelante demande OTP avant. À cross-checker avec audit API (bundle 2 Gemini).

---

## Points positifs (pas d'action requise)

- ✅ Validation Zod systématique sur tous les inputs services (loyalty.schemas, customer.schemas, auth.schemas, etc.)
- ✅ RPCs Postgres atomiques (`increment_stamps`, `deduct_points`, `increment_points`) pour éviter race-conditions sur les compteurs
- ✅ `validateClaim` atomic update avec `.eq('status', 'pending')` pour empêcher double-validation concurrente
- ✅ `registerCustomer` idempotent : retourne la carte existante si déjà inscrite
- ✅ `claim_requests` RLS verrouillée service_role (commit historique)
- ✅ Codes éphémères 5 min TTL avec annulation des pending précédents
- ✅ Cooldown anti-fraude bien implémenté sur `scanCard` (configurable via `business.scan_cooldown_hours`)

## Cross-checks à faire avec autres rapports Gemini

1. **Auth/RLS bundle** : confirmer absence de FK strict sur `reward_claims.reward_tier_id` (T2-4)
2. **API/Validation bundle** : confirmer rate-limit Upstash sur `/api/scan` et `/api/dashboard/.../add` (T1-3)
3. **API/Validation bundle** : confirmer authz merchant sur `/api/dashboard/.../add` (le service trust le business_id de l'API caller, donc l'API doit valider la session merchant)

## Plan d'action suggéré pour pilote

**Avant pilote (P0 — ~3 h)** :
1. T1-1 : remplacer `Math.random()` par `crypto.getRandomValues()` (0.5 h)
2. T1-2 : bloquer écrasement email existant dans `addEmailAndSendOtp` (1 h, fix défensif)
3. T1-3 : clamp `amount` côté service + rate-limit basique sur add (1.5 h)

**Post-pilote phase 1 (~7 h)** :
4. T2-1, T2-2, T2-3, T2-5

**Hardening continu** :
5. T2-6, T3-1 (Sentry), T2-4 (test intégration)
