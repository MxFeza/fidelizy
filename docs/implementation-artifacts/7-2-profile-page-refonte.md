# Story 7.2 — Reconnexion onglet Profil → /me/profile (cleanup ProfileTab)

**Epic :** 7 (Auth & Profil client)
**Taille :** S (≈ 3 h)
**Statut :** ready-for-dev
**Date :** 2026-05-08
**Figma source :** capture utilisateur 2026-05-08 (form Prénom/Nom/Email + menu RÉGLAGES + bottom nav)

---

## 1. Contexte

L'agent profil P1 (story 4.7 v2) a livré une refonte **conforme Figma** de `/me/profile` :
- [app/me/profile/ProfileClient.tsx](app/me/profile/ProfileClient.tsx) (392 LOC) — header "Mon profil", form inline Prénom/Nom/Email avec icône `Mail01`, avatar circulaire + bouton caméra violet, MenuList Réglages, liens Se déconnecter / Supprimer compte centrés, BottomTabBar.
- 5 sous-écrans `app/me/profile/{security,notifications,privacy,help,card-customization}/` — tous conformes.
- 6 modales `components/client/profile/*Modal.tsx` (Avatar, Logout, DeleteAccount Step 1+2, ExportData, Feedback, ProfileModal primitive).
- 8 endpoints `/api/me/*`.

**Bug constaté en prod (capture user)** : cliquer l'onglet **Profil** du `BottomTabBarClient` n'ouvre PAS `/me/profile`. Il route vers `/card/{cardId}?tab=profile`, qui rend [app/card/[cardId]/components/ProfileTab.tsx](app/card/[cardId]/components/ProfileTab.tsx) (266 LOC, ancien design) :
- Header "Bienvenue {firstName} 👋"
- Carte "Mes informations" + bouton bleu "Modifier" (devrait être violet)
- Carte "Notifications" + bouton bleu (devrait être un MenuList → page sous-écran)
- Section "Informations légales" en liens texte (devrait être MenuList)
- Cartes rouges "Se déconnecter" / "Supprimer mes données" (mailto RGPD)
- Pas d'avatar uploadable, pas de menu Réglages, pas de modales

**Cette story corrige le routing**, pas le rendu. `/me/profile` est déjà conforme — il faut juste l'atteindre.

## 2. Scope

**In** :
- Rediriger l'onglet **Profil** du `BottomTabBarClient` vers `/me/profile` (au lieu de toggle local `?tab=profile`).
- Supprimer la branche `?tab=profile` de [app/card/[cardId]/CardPageClient.tsx](app/card/[cardId]/CardPageClient.tsx) (state `activeTab`, props `activeLocal`, branche `{activeTab === 'profile' && <ProfileTab .../>}`).
- Supprimer le fichier `app/card/[cardId]/components/ProfileTab.tsx` (mort après reroute).
- Adapter `BottomTabBarClient` : Profil devient un `<Link>` vers `/me/profile`, état actif basé sur `pathname.startsWith('/me/profile')`.

**Out** :
- Refonte du contenu de `/me/profile/ProfileClient.tsx` (déjà conforme Figma).
- Refonte des sous-écrans `/me/profile/{security,notifications,privacy,help,card-customization}` (déjà OK).
- Refonte des modales (déjà conformes pattern ProfileModal).
- Refonte cardColor v2 / banner v2.
- Endpoints `/api/me/*` (déjà fonctionnels).
- Suppression de l'ancien endpoint `/api/card/update-profile` (utilisé uniquement par `ProfileTab`, devient orphelin) → cleanup story dédiée plus tard.

## 3. Fichiers à modifier

### 3.1 [components/client/BottomTabBarClient.tsx](components/client/BottomTabBarClient.tsx) (~174 LOC)

| Ligne ~ | Action |
|---|---|
| L9 | `type LocalTabId = 'card' \| 'profile'` → `type LocalTabId = 'card'` |
| L11-20 | Resserrer `BottomTabBarClientProps` : `activeLocal?: 'card'`, JSDoc nettoyé |
| L44-45 | Supprimer la déclaration `profileTab` |
| L151-169 | Remplacer le rendu Profil (button local) par `<Link href="/me/profile">` ; état actif = `pathname.startsWith('/me/profile')` ; classes identiques aux 4 autres onglets |

### 3.2 [app/card/[cardId]/CardPageClient.tsx](app/card/[cardId]/CardPageClient.tsx) (~409 LOC)

| Ligne ~ | Action |
|---|---|
| L13 | Supprimer `import ProfileTab from './components/ProfileTab'` |
| L29-35 | Supprimer state `activeTab`, parsing `searchParams.get('tab')`, setter |
| L342-374 | Remplacer le rendu conditionnel par `<CardTab .../>` direct |
| L402-406 | Remplacer `<BottomTabBarClient activeLocal={activeTab} onLocalChange={...} />` par `<BottomTabBarClient cardId={card.qr_code_id} />` |
| L331-340 | Garder le header "Bienvenue {firstName}" — c'est le header de la home **carte**, pas profil |

### 3.3 `app/card/[cardId]/components/ProfileTab.tsx` (266 LOC)

**Supprimer le fichier.** Vérifier que `grep -r ProfileTab app/` ne remonte plus rien après cleanup.

### 3.4 Inchangé (vérifier la non-régression seulement)

- `app/me/profile/page.tsx` (56 LOC) — SSR `customer` + `cardId`
- `app/me/profile/ProfileClient.tsx` (392 LOC)
- Sous-écrans `app/me/profile/{security,notifications,privacy,help,card-customization}/`
- 6 modales `components/client/profile/*Modal.tsx`
- 8 endpoints `app/api/me/*`

## 4. Composants utilisés (déjà existants)

- `@untitledui/react` : `Button`, `Input`, `Avatar`, `Toggle`
- `@untitledui/icons` : `Mail01`, `Bell01`, `Shield01`, `HelpCircle`, `MessageCircle01`, `Lock01`, `CreditCard02`, `ChevronRight`, `Camera01`, `User01`
- [TopBarClient](components/client/TopBarClient.tsx)
- [BottomTabBarClient](components/client/BottomTabBarClient.tsx) (modifié dans cette story)
- [ToastContainer](components/client/ToastContainer.tsx) avec `useToast()`
- [components/client/profile/](components/client/profile/) : 6 modales

## 5. Layout / UI cible (déjà rendu par ProfileClient.tsx — vérification)

Page `/me/profile` (déjà conforme Figma) :

1. **TopBar** — logo Izou, zone droite vide
2. **Header** — `<h1>` "Mon profil" + sous-titre "Gérez vos informations personnelles"
3. **Bloc formulaire** : Input Prénom, Input Nom, Input Email (`icon={Mail01}`, validation regex inline), avatar circulaire + bouton caméra violet → ouvre `AvatarUploadModal`. Footer : `Annuler` (secondary) + `Enregistrer` (primary violet, disabled si non `dirty`)
4. **Section RÉGLAGES** (label uppercase gris) — MenuList :
   - Notifications → `/me/profile/notifications` (icône `Bell01`)
   - Confidentialité & données → `/me/profile/privacy` (icône `Shield01`)
   - Aide & support → `/me/profile/help` (icône `HelpCircle`)
   - Envoyer un feedback → ouvre `FeedbackModal` (icône `MessageCircle01`)
   - Sécurité → `/me/profile/security` (icône `Lock01`)
   - Ma carte (personnaliser) → `/me/profile/card-customization` (icône `CreditCard02`)
5. **Bloc bas centré** : "Se déconnecter" gras → `LogoutModal` ; "Supprimer mon compte" rouge → `DeleteAccountStep1Modal` → `Step2Modal` ; "Version 1.0.0 — Pilote" gris ; liens Confidentialité · CGU · Mentions
6. **BottomTabBar** — Profil actif violet

**Règles non-négociables (rappel)** :
- @untitledui/react obligatoire, jamais from scratch
- Hiérarchie CTA : violet=principal, noir=secondaire, outline=tertiaire, rouge=destructif
- Aucun gradient (blocs plats)
- Icônes lineart Untitled UI, pas d'emoji 3D dans la UI
- Pas de couleur business injectée sur la page profil

## 6. Branchements API (déjà câblés)

| Action | Endpoint | Méthode |
|---|---|---|
| Enregistrer prénom/nom | `/api/me/profile` | PATCH |
| Changer email | `/api/me/email-change` | POST |
| Upload avatar | `/api/me/avatar` | POST (form-data) |
| Envoyer feedback | `/api/me/feedback` | POST |
| Supprimer compte | `/api/me/delete` | DELETE |

## 7. Critères d'acceptation

1. ✅ Cliquer l'onglet **Profil** du `BottomTabBarClient` (depuis `/card/{cardId}` ou autre route avec bottom nav) navigue vers `/me/profile` (URL change, pas de query string).
2. ✅ Sur `/me/profile`, l'onglet **Profil** apparaît actif (icône + label `text-brand-secondary` violet) ; les 4 autres onglets sont gris.
3. ✅ La page `/card/{cardId}` ne lit plus `?tab=profile` (paramètre supprimé) ; rend `<CardTab />` directement.
4. ✅ Le fichier `ProfileTab.tsx` est supprimé ; `grep -r ProfileTab app/` ne renvoie aucun import.
5. ✅ Aucun bouton bleu, aucune couleur `business.primary_color` injectée sur `/me/profile`.
6. ✅ Tests `npm test` passent vert (76 cas existants).
7. ✅ TypeScript + lint clean (`npm run typecheck && npm run lint`).

## 8. Effort

| Sous-tâche | Estimation |
|---|---|
| Modifier `BottomTabBarClient` (Profil → Link) | 30 min |
| Cleanup `CardPageClient` (state activeTab + import ProfileTab) | 30 min |
| Supprimer `ProfileTab.tsx` + vérifier orphelins | 15 min |
| Test manuel mobile 375px : 5 onglets, état actif Profil, modales | 45 min |
| TypeScript + lint + tests Vitest | 30 min |
| Buffer ajustements tokens | 30 min |
| **Total** | **≈ 3 h** |

## 9. Dépendances

- **Agent profil P1 (story 4.7 v2)** — DONE. Sans `ProfileClient.tsx`, modales et endpoints, cette story est bloquée.
- `BottomTabBarClient` — composant existant à modifier
- Token Tailwind `text-brand` / `bg-brand` / `text-brand-secondary` — déjà définis
- RLS Supabase `customers` — déjà OK (story 7.1)

## 10. Risques / vigilance

- **Régression onglet Carte** : tester que `/card/{cardId}` continue d'afficher la carte normalement après suppression du state `activeTab`.
- **Endpoint orphelin** `/api/card/update-profile` : ne pas supprimer dans cette story (impact non scopé). Backlog cleanup ultérieur.
- **Toast emojis inline** : conserver les `🎫` / `🎉` dans les toasts (intentionnel selon commit `2747b65`).
- **Cohérence** : la home `/card/{cardId}` garde son header "Bienvenue {firstName}" — c'est le header carte, pas profil.
