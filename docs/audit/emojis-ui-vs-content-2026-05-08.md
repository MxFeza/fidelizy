# Audit emojis : UI vs contenu utilisateur (commit 2747b65)

**Date :** 2026-05-08
**Commit audité :** `2747b65` — `refactor(emojis): remplace les emojis hardcodes UI par <Emoji name>`
**Règle de référence :** memory `feedback_icons_rule.md` — *"Untitled UI pour UI, emojis uniquement dans contenu utilisateur"*

## Résumé exécutif

| Catégorie | Nombre | Action |
|---|---|---|
| **UI** (à remplacer par `@untitledui/icons`) | 11 usages | Remplacement P0 (5) + P1 (6) |
| **CONTENU UTILISATEUR** (à garder en emoji 3D) | 9 usages | Aucun changement |
| **TOAST INLINE** (intentionnel selon commit) | 3 usages | Aucun changement |
| **Total audité** | 23 usages dans ~10 fichiers principaux | |

**Verdict** : l'agent emojis a fait le bon job technique mais a appliqué `<Emoji>` indistinctement sur de l'UI et du contenu. Les 11 usages UI doivent passer à `@untitledui/icons`. Les 9 usages contenu (paliers DB, transactions, segments roue) restent en emoji 3D Microsoft Fluent — c'est correct.

## Détail par fichier

### 🔴 P0 — Flux client critiques (visibles à chaque interaction pilote)

#### [app/card/[cardId]/components/CardTab.tsx](app/card/[cardId]/components/CardTab.tsx)

| Ligne | Usage | Classe | Action | Remplacement |
|---|---|---|---|---|
| 136 | `<Emoji name="gift">` bandeau "Récompense disponible" | UI | Remplacer | `<Gift01 className="size-5 text-violet-600" />` |
| 174 | `<Emoji name="wheel">` bouton "Roue de la fortune" | UI | Remplacer | ⚠️ Pas d'équivalent direct dans `@untitledui/icons` — proposer `<Target04>` ou créer custom `WheelIcon`. **À valider design.** |

#### [app/card/[cardId]/components/TierProgressBar.tsx](app/card/[cardId]/components/TierProgressBar.tsx)

| Ligne | Usage | Classe | Action | Remplacement |
|---|---|---|---|---|
| 85 | `<Emoji unicode={tier.emoji}>` (depuis JSONB DB) | **CONTENU** | Garder | — |
| 85 (fallback) | `<Emoji name="gift">` si `tier.emoji` absent | **CONTENU** (préserve fallback) | Garder | — |
| 109 | `<Emoji name="lock">` badge "X restants" verrouillé | UI | Remplacer | `<Lock01 className="size-4 text-gray-400" />` |
| 143 | `<Emoji name="confetti">` "Tous paliers débloqués" | UI | Remplacer | `<Stars02>` ou `<CheckCircle>` |

⚠️ **Vigilance** : la ligne 85 mélange contenu DB et fallback UI. Le pattern `tier.emoji ? <Emoji unicode> : <Emoji name="gift">` doit rester intact — sinon les paliers sans emoji DB perdent leur visuel.

#### [app/card/[cardId]/components/WheelModal.tsx](app/card/[cardId]/components/WheelModal.tsx)

| Ligne | Usage | Classe | Action | Remplacement |
|---|---|---|---|---|
| 105 | `<Emoji name="wheel">` titre modal | UI | Remplacer | Cohérence avec CardTab:174 (cf. décision design wheel icon) |
| 162 | `{seg.emoji}` dans SVG (string brute, pas composant Emoji) | **CONTENU** | Garder | — |
| 168 | `🎡` hardcoded centre de la roue | **CONTENU** (élément graphique du jeu) | Garder | — |

### 🟡 P1 — Composants secondaires (banniers, errors, push)

#### [app/card/[cardId]/CardPageClient.tsx](app/card/[cardId]/CardPageClient.tsx)

| Ligne | Usage | Classe | Action | Remplacement |
|---|---|---|---|---|
| 257 | `<Emoji name="mobile">` banner "Ajouter à l'écran d'accueil" iOS | UI | Remplacer | `<Download01>` ou `<Phone01>` |
| 287 | `<Emoji name="mobile-arrow">` banner "Installer l'app" Android | UI | Remplacer | `<Download01>` |
| 336 | `<Emoji name="wave">` greeting "Bienvenue {firstName} 👋" | UI | Remplacer | ⚠️ **À discuter** — un `wave` 3D peut être souhaitable comme touche personnelle. Sinon `<HandWave>` Untitled UI si dispo, sinon supprimer le pictogramme. |
| 141, 149, 178 | `🎫`, `🎉` inline dans strings de `showToast(...)` | TOAST INLINE | Garder | Décision intentionnelle commit 2747b65 |

#### [app/card/[cardId]/components/PushBanner.tsx](app/card/[cardId]/components/PushBanner.tsx)

| Ligne | Usage | Classe | Action | Remplacement |
|---|---|---|---|---|
| 62 | `<Emoji name="bell">` prompt activation notifications | UI | Remplacer | `<Bell01 className="size-6 text-gray-700" />` |

#### [app/card/[cardId]/error.tsx](app/card/[cardId]/error.tsx)

| Ligne | Usage | Classe | Action | Remplacement |
|---|---|---|---|---|
| 14 | `<Emoji name="error-face">` page 404 carte | UI | Remplacer | `<AlertCircle>` ou `<XCircle>` |

#### [app/dashboard/(protected)/error.tsx](app/dashboard/(protected)/error.tsx)

| Ligne | Usage | Classe | Action | Remplacement |
|---|---|---|---|---|
| 15 | `<Emoji name="error-face">` erreur dashboard | UI | Remplacer | `<AlertCircle>` (cohérence avec card/error.tsx) |

### 🟢 CONTENU — fichiers à NE PAS toucher

#### [app/card/[cardId]/components/RecentActivity.tsx](app/card/[cardId]/components/RecentActivity.tsx)

| Ligne | Usage | Classe | Justification |
|---|---|---|---|
| 83 | Icônes `gift`/`ticket`/`star` issues de `describeTransaction()` | CONTENU | Sélection dynamique selon type transaction DB — c'est de la donnée utilisateur, pas du chrome UI |

## Plan de remplacement séquencé

### Phase 1 — P0 (≈ 1.5 h)

1. `CardTab.tsx:136` — `gift` → `Gift01`
2. `CardTab.tsx:174` — `wheel` → ⚠️ valider design
3. `TierProgressBar.tsx:109` — `lock` → `Lock01`
4. `TierProgressBar.tsx:143` — `confetti` → `Stars02` ou `CheckCircle`
5. `WheelModal.tsx:105` — `wheel` (cohérent avec CardTab:174)

### Phase 2 — P1 (≈ 1 h)

6. `CardPageClient.tsx:257` — `mobile` → `Download01`
7. `CardPageClient.tsx:287` — `mobile-arrow` → `Download01`
8. `CardPageClient.tsx:336` — `wave` → ⚠️ discuter (garder ? remplacer ? supprimer ?)
9. `PushBanner.tsx:62` — `bell` → `Bell01`
10. `app/card/[cardId]/error.tsx:14` — `error-face` → `AlertCircle`
11. `app/dashboard/(protected)/error.tsx:15` — `error-face` → `AlertCircle`

### Phase 3 — Vérification (≈ 30 min)

- Visual diff sur preview Vercel
- `npm run typecheck && npm run lint && npm test`
- Confirmer que les 9 usages CONTENU + 3 TOAST INLINE n'ont pas été touchés par erreur

## Mappings de référence

| Emoji actuel | Icône Untitled UI | Confiance | Notes |
|---|---|---|---|
| `gift` | `Gift01` | ★★★ | Match exact |
| `lock` | `Lock01` | ★★★ | Match exact |
| `bell` | `Bell01` | ★★★ | Match exact |
| `confetti` | `Stars02` ou `CheckCircle` | ★★★ | Sémantique célébration |
| `error-face` | `AlertCircle` ou `XCircle` | ★★★ | Standard erreurs |
| `mobile` / `mobile-arrow` | `Download01` ou `Phone01` | ★★☆ | Selon contexte (install vs phone) |
| `wave` | `HandWave` (vérifier dispo) | ★★☆ | Sinon supprimer, ou garder en emoji 3D si choix design |
| `wheel` | aucun équivalent | ★☆☆ | **Décision design requise** : `Target04`, custom icon, ou garder l'emoji `🎡` |

## Risques / vigilance

1. **Pattern fallback TierProgressBar:85** — préserver le fallback `<Emoji name="gift">` si `tier.emoji` est absent. Ne PAS remplacer ce fallback par une icône Untitled UI : la cohérence visuelle des paliers exige que tous les paliers aient un emoji 3D, qu'il vienne de la DB ou du fallback.

2. **`wheel` icon** — pas d'équivalent direct Untitled UI. Trois options :
   - A) Garder l'emoji 3D `🎡` (exception documentée)
   - B) Utiliser `Target04` (sémantique "viser un prix")
   - C) Créer un SVG custom `WheelIcon`
   → décision designer requise avant Phase 1.

3. **`wave` greeting** — `👋` apporte une touche humaine sur le header. À arbitrer avant suppression : garder en emoji 3D (intentionnel, contexte chaleureux) ou retirer pour un look plus pro.

4. **Toast emojis** (`🎫`, `🎉`) — décision explicite du commit 2747b65 : restent inline. Documenter cette exception pour ne pas la perdre lors de futurs refactors.

## Liens utiles

- Catalogue emojis Izou : [lib/emojis/emoji-mapping.ts](lib/emojis/emoji-mapping.ts)
- Composant `<Emoji>` : [lib/emojis/Emoji.tsx](lib/emojis/Emoji.tsx)
- Doc agent : [lib/emojis/README.md](lib/emojis/README.md)
- Inventaire initial : [docs/audit/emojis-inventory.md](docs/audit/emojis-inventory.md)
