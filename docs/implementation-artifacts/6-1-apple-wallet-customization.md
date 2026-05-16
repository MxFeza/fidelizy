# Story 6.1 — Apple Wallet pkpass : customisation max sur format vertical

**Epic :** 6 (Apple Wallet + Google Wallet)
**Taille :** M (~6-8 h)
**Statut :** ready-for-research
**Date :** 2026-05-08

## 1. Contexte & contrainte technique non négociable

L'utilisateur a demandé si on pouvait afficher la carte loyalty dans Apple Wallet au format **horizontal type carte bancaire** (comme la carte stylisée premium qu'on a dans l'app web `/card/[cardId]`).

**Réponse honnête** : impossible techniquement. Le format pkpass d'Apple Wallet impose **5 types verticaux exclusivement** :

| Type | Usage | Format |
|---|---|---|
| `boardingPass` | Billet d'avion | Vertical |
| `coupon` | Coupon promo | Vertical |
| `eventTicket` | Billet événement | Vertical |
| `generic` | Générique | Vertical |
| **`storeCard`** ✅ (notre cas) | Carte fidélité magasin | Vertical |

Le format horizontal "carte bancaire" est **Apple Pay** (PAN tokenisation), exclusif aux émetteurs bancaires certifiés Visa/Mastercard. Pas accessible aux apps tierces, jamais.

**Décision** : on capitalise sur les zones customisables du `storeCard` plutôt que de tenter l'impossible.

## 2. Scope

**In** :
- Personnalisation maximale du `storeCard` Apple Wallet selon les couleurs et l'identité du commerce
- Strip image (image bandeau) générée dynamiquement depuis `business.logo_url` + `business.primary_color`
- Background color depuis `business.primary_color`
- Logo carré 180×180 généré depuis `business.logo_url`
- Code-barres compatible scan caisse (Aztec ou QR — `business.qr_code_id`)
- 4 zones de texte structurées :
  - Header field : `business.business_name`
  - Primary field : nom du client + état stamps (ex: "Inès — 7/10 tampons")
  - Secondary fields : récompense suivante + parrainage code
  - Auxiliary fields : prochain palier (mode points) ou récompense débloquée

**Out** :
- Format horizontal type carte bancaire (impossible — voir §1)
- Image de fond pleine carte (Apple ne supporte que la `strip image` 375×123px sur storeCard)
- Animations (le pkpass est statique)
- Google Wallet (story Epic 6.2 séparée)

## 3. Fichiers à modifier

### 3.1 [lib/wallet/generatePass.ts](lib/wallet/generatePass.ts)

C'est le fichier central. Doit être refactoré pour :

| Section | Action |
|---|---|
| `pass.json` payload | Ajouter `backgroundColor`, `foregroundColor`, `labelColor` calculés depuis `business.primary_color` (contraste auto) |
| Strip image | Générer une image 375×123 PNG dynamique côté serveur (combine logo commerce + filigrane couleur) — pas hardcoder une image statique |
| Logo image | Redimensionner `business.logo_url` à 180×180 et 360×360 (@2x) — sans déformer si non-carré |
| `storeCard.headerFields` | Title court : `business.business_name` |
| `storeCard.primaryFields` | Mode stamps : `"X / Y tampons"` ; mode points : `"X points"` |
| `storeCard.secondaryFields` | Mode stamps : nom récompense + commerce ; mode points : prochain palier `"5% réduction (50 pts)"` |
| `storeCard.auxiliaryFields` | Code parrainage si `business.referral_enabled` |
| `storeCard.backFields` | Conditions, mentions légales, lien CGU, contact merchant |
| Code-barres | Aztec format (recommandé Apple) avec `qr_code_id` encoded |

### 3.2 [lib/wallet/generateStripImage.ts](lib/wallet/generateStripImage.ts) (CREATE)

Nouveau helper pour générer la strip image dynamique :
- Input : `{ logoUrl, primaryColor, businessName }`
- Process : composite via `sharp` (déjà installé probablement) ou `canvas` server-side
- Output : Buffer PNG 375×123 avec gradient subtle ou aplat couleur business + logo aligné gauche

### 3.3 [supabase/migrations/](supabase/migrations/) (potentiel)

Si on veut cacher les pkpass générés :
- Colonne `loyalty_cards.wallet_pass_etag` pour invalider quand `business.primary_color` ou `business.logo_url` change
- Pas urgent — dans un 1er temps régénérer à la demande

## 4. Tests d'acceptation visuels

À tester sur iPhone réel (simulateur Apple Wallet de Xcode peut échouer sur les certifs) :

1. **Génération** : POST `/api/wallet/[qrCodeId]` retourne un .pkpass valide
2. **Couleurs** : la carte dans Wallet a bien la couleur `business.primary_color` en fond, texte lisible (contraste auto)
3. **Logo** : le logo commerce est visible en haut, pas pixelisé
4. **Stamps live** : après ajout de tampon merchant-side, la carte se met à jour dans Wallet (push APNs déjà branché story 6.0)
5. **Variantes mode** :
   - Stamps mode : compteur `7/10` visible en primary field
   - Points mode : `123 pts` visible + prochain palier en secondary
6. **Récompense débloquée** : auxiliary field affiche "🎁 Récompense disponible !" en aplat couleur succès
7. **3 commerces tests** avec couleurs différentes (violet brand, café marron, salon rose) pour valider la lisibilité contraste

## 5. Effort détaillé

| Sous-tâche | Estimation |
|---|---|
| Recherche `sharp` server-side ou `node-canvas` pour strip image | 1h |
| Refactor `generatePass.ts` (color computation + 4 fields) | 2h |
| Implémentation `generateStripImage.ts` | 2h |
| Tests sur 3 commerces + iPhone réel | 1.5h |
| Buffer ajustements design (couleur contrast WCAG, alignements) | 1.5h |
| **Total** | **~8h** |

## 6. Pré-requis (à valider avant exécution)

1. **Certificats Apple Wallet à jour** : `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_CERT_PATH`, `APPLE_KEY_PATH`, `APPLE_KEY_PASSPHRASE` valides en prod (Vercel env)
2. **Endpoint web service Apple** déjà fonctionnel : `/api/wallet/v1/passes/[passTypeId]/[serialNumber]` + `/api/wallet/v1/devices/...` + `/api/wallet/v1/log`
3. **Push APNs** : déjà branché côté Story 6.0 — tester avec un device réel
4. **Logo commerce uploadé en Supabase Storage** : bucket `business-logos`, URL publique cachée

## 7. Dépendances

- **Story 6.0 Apple Wallet base (existante)** — DONE. Génération pkpass de base + endpoints registration + APNs push.
- **`@untitledui/icons`** : pas utilisé côté pkpass (Apple a son propre set d'icônes via fields)
- **Library `sharp`** : à confirmer dispo dans `package.json` ou ajouter (~6 MB binary)
- **Cert renewal Apple** : annuel, à mettre dans backlog ops

## 8. Décisions design à confirmer pré-dev

1. **Contraste auto** : utiliser une lib comme `tinycolor2` pour calculer `labelColor` (clair si fond foncé, sombre si fond clair) ?
2. **Strip image** : aplat couleur business + logo, OU image stylisée (gradient subtle, pattern) ? Reco : aplat (cohérent avec règle `feedback_no_gradients`).
3. **Code-barres** : Aztec (recommandé Apple, supporté par caisses récentes) OU QR code (plus universel) ?
4. **Back fields** : texte légal complet OU lien vers `/legal` ? Reco : texte court + lien.

## 9. Risques

- **Variations rendering iOS versions** : iOS 16/17/18 affichent les fields différemment. Tester sur 2 versions min.
- **Cert Apple expirés** : si `APPLE_CERT_PATH` n'est pas à jour en prod Vercel, la story plante au runtime. Vérifier en pré-requis.
- **Strip image trop lourde** : Apple recommande PNG <100KB. Optimiser via `sharp`.
- **Push APNs en cas de change couleur business** : il faut invalider le pass existant ETag pour forcer le re-download. Pas trivial.
