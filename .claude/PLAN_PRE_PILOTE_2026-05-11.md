# Plan pré-pilote Izou — 2026-05-11

**Source** : session de planification mode plan, validée user.
**Branche** : `develop` (tests 79/79 verts au démarrage).
**Workflow** : step-by-step strict — UN chunk à la fois, validation user entre chaque.

## Context

Izou ouvre prochainement le pilote aux testeurs commerçants. Audit ciblé sur 5 bugs P0 bloquants + 2 décisions produit qui simplifient le scope. Aucun code n'est écrit avant OK explicite par chunk.

## Décisions produit validées (cette session)

- **B4 → charte merchant fixe** : on retire la perso couleur client (`customers.card_color`). La carte affiche la couleur du commerce uniquement. Simplifie B4 + dette future.
- **U3 → retirer avatar** : upload + colonne supprimés. -1 chantier pré-pilote.
- **Q1 → flow scan bidirectionnel assumé** : client scanne QR commerce (`/scan`) + merchant peut scanner QR client au comptoir (`/api/scan` déjà fonctionnel). À documenter + vérifier UI complète.

---

## Audit P0 — Bloquants prod

### P0.B1 — Input "Ajouter X tampons" cassé sur mobile + erreur API

**Fichier** : `app/dashboard/(protected)/clients/[id]/ClientDetailClient.tsx:432-443`

**Causes racines** (confirmées dans le code) :
1. `max={isStamps ? stampsRequired : 9999}` ligne 435 → en mode stamps avec `stamps_required=10`, le browser HTML bloque toute saisie >10. Impossible de taper 20.
2. `onBlur` ligne 441 réinitialise le champ à 1 si vide → impossible d'effacer pour retaper.
3. Pas de `inputMode="numeric"` → keyboard alphanumeric s'ouvre sur mobile.
4. `Math.max(1, Number(v))` ligne 439 → forçage à ≥1 dans le state à chaque keystroke, plante la saisie progressive.
5. Endpoint `/api/card/add` n'a pas de validation Zod (contrairement à `/api/card/deduct`) → si la RPC `increment_stamps` plante (ex: dépasse stamps_required), retour générique "Erreur lors de la mise à jour des tampons".

**Fix** :
- Retirer `max` HTML (ou le borner à 999), passer `inputMode="numeric"` + `pattern="[0-9]*"`.
- Retirer `Math.max(1, ...)` du onChange. Garder un guard côté Validate uniquement.
- Retirer onBlur reset → permettre champ vide pendant la saisie, valider sur submit.
- Ajouter validation Zod sur `/api/card/add` : `amount: z.coerce.number().int().min(1).max(999)`.
- Améliorer message d'erreur côté serveur (différencier "carte introuvable" vs "rate limit" vs "amount invalide").

**Effort** : ~1h. **Risque** : faible.

---

### P0.B2 — Tampons mal répartis sur carte client mobile

**Fichier** : `components/dashboard/LoyaltyCardVisual.tsx:111-161`

**Cause racine** : `gridTemplateColumns: repeat(${cols}, minmax(0, max-content))` + `justify-items-start` ⇒ chaque cercle a une largeur fixe `size-5/6/7` (20-28px) et toute la grille est tassée à gauche du container `flex-[0.62]`. Sur desktop merchant, le container est large, l'écart est invisible. Sur mobile client (~60% du card width = ~220px), il reste un trou vide à droite.

**Fix** : passer en `repeat(${cols}, 1fr)` + `justify-items-center`. Les cercles gardent leur taille mais sont répartis uniformément dans la largeur disponible.

**Effort** : 15 min + vérif visuelle 2 résolutions. **Risque** : très faible.

---

### P0.B3 — Apple Wallet pass cassé

**Fichiers** : `app/api/wallet/[cardId]/route.ts:11-16`, `lib/wallet/generatePass.ts`

**Causes racines** (par probabilité décroissante) :
1. **`Content-Disposition: attachment; filename="loyalty.pkpass"`** force iOS Safari à télécharger le fichier au lieu de le router vers PassKit. **Fix : retirer le header attachment, garder seulement `Content-Type: application/vnd.apple.pkpass`**.
2. Certs ENV b64 absents/expirés en prod Vercel (`APPLE_PASS_KEY_B64`, `APPLE_PASS_CERT_B64`, `APPLE_WWDR_CERT_B64`) → signing throw silencieux ligne 304, retour `null`, endpoint renvoie 404 "Carte introuvable" (`generatePass.ts:300-306`).
3. `target="_blank"` sur le bouton (`CardTab.tsx:198-205`) ouvre nouveau tab — OK en Safari standalone, mais en PWA installée le webview peut intercepter.
4. Le pass est minimal : icon `solidPng` aplat couleur business uniquement. Pas de logo, pas de strip image. Branding générique mais pas "cassé" en soi.

**Fix immédiat (P0)** :
- Retirer `Content-Disposition: attachment`.
- Ajouter logging serveur clair quand signing échoue (différencier "cert manquant" vs "card not found").
- Vérifier les 3 env vars Apple en prod Vercel (avec le user).

**Refonte branding (P2/F2)** : Story 6.1 documentée dans `docs/implementation-artifacts/6-1-apple-wallet-customization.md` — strip image dynamique + logo merchant + 4 fields structurés. Effort ~8h. **Reporter post-pilote**.

**Effort fix P0** : ~30 min (header + logging) + audit env Vercel manuel. **Risque** : faible.

---

### P0.B4 — Sync card_color → DÉCISION : retirer la perso client

**Fichiers à modifier** :
- `components/dashboard/LoyaltyCardVisual.tsx` — retirer `cardColor` prop + `CARD_COLOR_MAP` + `DARK_TEXT_COLORS`. Utiliser couleur business ou `DEFAULT_COLOR` noir.
- `app/me/profile/card-customization/` — supprimer la page entière (route + client + lien depuis profile).
- `app/api/me/card-color/route.ts` — supprimer.
- `app/card/[cardId]/components/CardTab.tsx:128` — retirer prop `cardColor`.
- `lib/onboarding/getCustomerTaskStatus.ts` — retirer task `card_customized` (4ème tâche du banner, Story 9.2 v2). Banner repasse à X/3.
- Migration Supabase : `ALTER TABLE customers DROP COLUMN card_color` (idempotente, nullable).
- Bonus : passer `LoyaltyCardVisual` à `business.primary_color` (à vérifier si saisi en UI merchant, sinon noir fixe).

**Note** : `business.primary_color` n'est probablement pas saisi en UI merchant aujourd'hui. À vérifier dans `BusinessClient.tsx`. Si non, ajouter un color picker dans Réglages > Mon entreprise (court : 30 min).

**Effort** : ~2h (incl. migration + tests régression sur onboarding banner). **Risque** : moyen (touche onboarding Story 9.2).

---

### P0.B5 — Input "Nombre de tampons sur la carte" non borné

**Fichier** : `app/dashboard/(protected)/marketing/loyalty/LoyaltyClient.tsx:50,218-220`

**Cause** : `STAMPS_PRESETS = [5, 8, 10, 12]` + custom max actuellement 50 → permet 42.

**Fix** : borner custom à 3-30. Présets inchangés. Validation Zod côté serveur sur PATCH `/api/business` aussi.

**Effort** : 15 min. **Risque** : nul.

---

## Audit P1 — Cohérence post-P0

### P1.U1 — Loader répétitif chargement
Hypothèses à valider pendant l'exécution :
- `loading.tsx` dans `app/card/[cardId]/` + `app/me/` + sous-pages → Suspense triggered à chaque nav.
- `revalidate` absent ou `cache: 'no-store'` abusif dans les fetch RSC.
- SW custom (`public/sw.js`) probablement pas vraiment SWR.
- Endpoint `/api/card/[cardId]/live/route.ts` polling/no-cache.

**Action** : audit dédié 1h pendant la session d'exécution P1, classer 3 causes les plus impactantes, fixer dans l'ordre. **Reporter post-P0**.

### P1.U2 — Ergonomie BusinessClient (Mon entreprise)
**Fichier** : `app/dashboard/(protected)/settings/BusinessClient.tsx`
**Action** : screenshot exhaustif desktop + mobile, lister chaque CTA, proposer refonte. **À faire avant pilote** (page sensible merchant).

### P1.U4 — Dismiss croix tasks checklist
**Reporter post-P0**. Déjà en TODO précédent (3 options design à proposer).

### P1.U5 — Responsive cassé
**Pas reproductible sans screenshots user**. Demander capture dès rencontre.

---

## Audit P2 — Améliorations / nouvelles features

### F1 — Bouton Partager modal QR + share commerçant
**Fichier modal** : `app/card/[cardId]/components/CardTab.tsx:212-276` (modal Agrandir : "Copier" + "Fermer" seulement).

**Scope** :
- Bouton "Partager" → `navigator.share()` Web Share API.
- URL partagée = `/join/{shortCode}` du commerce (PAS le root Izou).
- Côté merchant settings : bouton "Partager ma fiche" identique.
- Open Graph custom : `app/join/[shortCode]/page.tsx` generateMetadata dynamique avec banner commerce + logo + nom.

**Effort** : ~3h. **Risque** : faible. **Vague 2** (post-P0, avant pilote — viral impact).

### F2 — Epic refonte Apple Wallet branding (Story 6.1)
Déjà documentée : `docs/implementation-artifacts/6-1-apple-wallet-customization.md`. **Effort ~8h. Reporter post-pilote**. Le fix B3 suffit pour fonctionnement nominal.

---

## Recommandation de séquencement

### Vague 1 — Avant testeurs (P0 ironclad)

Ordre suggéré, **un chunk à la fois avec validation user entre chaque** :

1. **B1** — Input ajout points + Zod /api/card/add (~1h)
2. **B5** — Borne 3-30 stamps_required (~15 min, peut être groupé avec B1)
3. **B3** — Retrait `Content-Disposition: attachment` + logging cert (~30 min) + audit ENV Vercel manuel
4. **B2** — Grille cercles `1fr` + center (~15 min)
5. **B4** — Retrait perso couleur client + migration DB + adapt onboarding banner (~2h, plus risqué donc en dernier)

Total estimé : ~4h dev + tests + checkpoints visuels.

### Vague 2 — Pendant les premiers jours de pilote (P1)

- **F1** — Bouton Partager + OG meta `/join/[shortCode]` (~3h)
- **U1** — Audit perf loaders + fix top 3 causes (~1h investig + 1-2h fix)
- **U2** — Refonte ergonomique BusinessClient (effort à scoper après screenshots)

### Vague 3 — Post-pilote

- **F2** — Epic 6.1 Apple Wallet branding complet (~8h)
- **U4** — Dismiss croix tasks
- **U5** — Cas responsive remontés par testeurs

---

## Verification end-to-end

Pour chaque chunk avant validation :
1. **B1** : preview Vercel mobile → page client detail → input "Ajouter 20 tampons" → API succès + carte MAJ optimistique + router.refresh sync.
2. **B2** : screenshots LoyaltyCardVisual 3 résolutions (desktop merchant / iPhone client / tablet) → cercles répartis uniformément.
3. **B3** : iPhone réel Safari → "Ajouter à Apple Wallet" → PassKit modal s'ouvre → pass ajouté avec couleur business.
4. **B4** : migration appliquée → `/me/profile` sans card-customization → carte client = couleur business → page merchant client detail = même couleur.
5. **B5** : Réglages > Programme fidélité → custom 42 bloqué à 30.
6. Tests : `npm test` reste 79/79 (ou +N nouveaux).
7. `npm run typecheck && npm run build` clean.
8. Commits atomiques par bug pour facilité rollback.

---

## Critical files (récap)

- `app/dashboard/(protected)/clients/[id]/ClientDetailClient.tsx` (B1)
- `app/api/card/add/route.ts` (B1 — ajouter Zod)
- `app/dashboard/(protected)/marketing/loyalty/LoyaltyClient.tsx` (B5)
- `app/api/wallet/[cardId]/route.ts` (B3 — retrait attachment)
- `lib/wallet/generatePass.ts` (B3 — logging amélioré)
- `components/dashboard/LoyaltyCardVisual.tsx` (B2 + B4)
- `app/me/profile/card-customization/` (B4 — suppression dossier)
- `app/api/me/card-color/route.ts` (B4 — suppression)
- `app/me/profile/page.tsx` + `ProfileClient.tsx` (B4 + U3 — retrait lien + retrait avatar)
- `lib/onboarding/getCustomerTaskStatus.ts` (B4 — retrait task card_customized)
- `app/card/[cardId]/components/CardTab.tsx` (B4 — retrait prop cardColor)
- `supabase/migrations/2026MMDD_drop_card_color_and_avatar.sql` (B4 + U3 — migration)
- `lib/types.ts` (B4 + U3 — clean types)

---

## Statut chunks (mettre à jour à chaque commit)

| Chunk | Status | PR | Commit | Notes |
|---|---|---|---|---|
| B1 — Input ajout points | ⏳ pending | — | — | À démarrer |
| B5 — Borne stamps_required | ⏳ pending | — | — | Groupable avec B1 |
| B3 — Wallet Content-Disposition | ⏳ pending | — | — | + audit ENV Vercel |
| B2 — Cercles grid 1fr | ⏳ pending | — | — | Vérif visuelle 3 résolutions |
| B4 — Retrait card_color | ⏳ pending | — | — | Migration DB nécessaire |
| F1 — Bouton Partager + OG | ⏳ pending | — | — | Vague 2 |
| U1 — Perf loaders | ⏳ pending | — | — | Vague 2 |
| U2 — BusinessClient refonte | ⏳ pending | — | — | Vague 2 |
| F2 — Story 6.1 Wallet branding | ⏳ pending | — | — | Vague 3 (post-pilote) |
