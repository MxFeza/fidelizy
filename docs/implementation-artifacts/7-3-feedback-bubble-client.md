# Story 7.3 — Pastille feedback flottante côté client mobile

**Epic :** 7 (Auth & Profil client)
**Taille :** S (~2 h)
**Statut :** ready-for-dev
**Date :** 2026-05-08
**Demande utilisateur :** retour 2026-05-08 sur la preview Vercel — *"Ça pourrait être intéressant de remettre la pastille de feedback un peu comme sur la partie commerçante sur le mobile, qui serait une pastille flottante permettant aux utilisateurs finaux d'envoyer des feedbacks ou signaler des bugs."*

## 1. Contexte

Le composant [components/dashboard/FeedbackBubble.tsx](components/dashboard/FeedbackBubble.tsx) (132 LOC) implémente déjà une bulle flottante "Proposer une amélioration" côté merchant mobile. Le pattern :
- FAB `position: fixed bottom-20 right-4` (au-dessus de la BottomTabBar)
- Modal expandable au clic avec textarea + bouton envoyer
- POST `/api/feedback` avec `{ text, page }` + capture pathname automatique
- Toast confirmation succès puis ferme la bulle

L'utilisateur veut le **même pattern** côté client (PWA mobile uniquement) pour permettre aux clients finaux de signaler bugs ou suggestions pendant le pilote.

**Bénéfices** :
- Boucle feedback rapide pour itérer pendant le pilote 5-10 commerçants
- Zéro friction (pas de page support à chercher)
- Capture automatique de la page d'origine (utile pour reproduire les bugs)

## 2. Scope

**In** :
- Créer [components/client/FeedbackBubbleClient.tsx](components/client/FeedbackBubbleClient.tsx) (clone du merchant adapté visuellement)
- Monter dans le layout client global (au moins sur `/me/*`, `/card/*`, `/scan`, `/join/*`) — JAMAIS sur `/landing`, `/`, `/dashboard/*`
- Visibilité `md:hidden` (mobile uniquement comme la version merchant)
- Position `bottom-20 right-4` pour ne pas chevaucher BottomTabBarClient
- POST sur l'endpoint existant `/api/feedback` ou créer `/api/me/feedback` selon la séparation des canaux feedback merchant/customer
- Capture automatique du pathname courant + cardId si présent dans l'URL

**Out** :
- Page de support dédiée (déjà couverte par `/me/profile/help` via story 4.7-v2 P1)
- Capture screenshot automatique (trop intrusif, demande permission caméra)
- Traduction multi-langue (français only pour le pilote)

## 3. Décision routing endpoint

L'endpoint `/api/feedback` existe et envoie vers Notion (`feedback_table_id`). Question : on réutilise ou on crée `/api/me/feedback` séparé ?

**Reco** : créer `/api/me/feedback` séparé. Raisons :
- Le contexte business est différent : un feedback merchant est sur leur dashboard, un feedback client est sur leur app loyalty
- Permet de cibler une autre Notion DB (ou tag différent) pour trier les feedbacks
- L'agent profil P1 a déjà créé l'endpoint `POST /api/me/feedback` (cf. commit 7a66330) — peut-être qu'on peut le réutiliser tel quel s'il fait l'insert

**Action** : vérifier l'existence et le comportement de [app/api/me/feedback/route.ts](app/api/me/feedback/route.ts) pendant l'implémentation. Si OK, brancher dessus. Sinon, ajuster.

## 4. Fichiers à créer/modifier

### 4.1 [components/client/FeedbackBubbleClient.tsx](components/client/FeedbackBubbleClient.tsx) (CREATE)

Cloner [FeedbackBubble.tsx](components/dashboard/FeedbackBubble.tsx) avec adaptations :
- Endpoint cible : `/api/me/feedback` (vérifier le format du body attendu)
- Texte UI :
  - FAB tooltip : "Envoyer un feedback"
  - Modal title : "Une suggestion ? Un bug ?"
  - Subtitle : "Aidez-nous à améliorer Izou"
  - Placeholder textarea : "Décrivez votre retour…"
  - Button submit : "Envoyer"
- Couleur FAB : violet brand (cohérent avec hiérarchie CTA)
- Icon : `MessageChatCircle` (déjà utilisé côté merchant) ou `MessagePlusSquare` selon préférence

### 4.2 Layout d'intégration

Option A (préférée) : monter dans un layout segment partagé `app/(client-mobile)/layout.tsx` qui s'applique aux routes `/me`, `/card/*`, `/scan`, `/join/*`. Demande potentiellement de créer un route group (recommandé Next.js 16).

Option B : monter dans chaque page Server Component qui en a besoin (manuel, plus simple à scoper, moins propre).

**Reco** : Option B pour le pilote. Monter dans :
- [app/me/layout.tsx](app/me/layout.tsx) (à vérifier si existant)
- [app/card/[cardId]/CardPageClient.tsx](app/card/[cardId]/CardPageClient.tsx) (intégrer le composant client)
- [app/scan/...] et [app/join/[businessId]/...] selon décision UX

### 4.3 [app/api/me/feedback/route.ts](app/api/me/feedback/route.ts)

Vérifier :
- Le route existe (commit 7a66330) — Vérifier le schema attendu
- Body attendu : `{ message, type? }` ou similaire
- Si nécessaire, étendre pour accepter `{ message, type: 'bug' | 'suggestion', page: string, cardId?: string }`

## 5. Critères d'acceptation

1. ✅ Sur mobile (≤768px) `/me`, `/card/[cardId]`, `/scan`, `/join/[businessId]`, le FAB violet apparaît en bas à droite (au-dessus BottomTabBar)
2. ✅ Sur desktop (≥768px), le FAB est invisible (`md:hidden`)
3. ✅ Sur `/`, `/landing`, `/dashboard/*`, le FAB est invisible
4. ✅ Cliquer le FAB ouvre un panel/modal avec textarea + bouton Envoyer
5. ✅ Soumettre vide → bouton désactivé
6. ✅ Soumettre avec texte → POST `/api/me/feedback`, toast success, modal se ferme après 1.8s
7. ✅ Le payload contient bien `page: pathname` pour traçabilité
8. ✅ Pas de duplicate avec la modal "Envoyer un feedback" déjà accessible depuis `/me/profile` → réfléchir si on garde les 2 (la pastille = quick access, la modal profile = parcours plus formel)
9. ✅ Tests visuels iPhone 13 (375px) : FAB pas masqué par bottom nav, pas par toasts

## 6. Effort

| Sous-tâche | Estimation |
|---|---|
| Lecture FeedbackBubble.tsx merchant + verify `/api/me/feedback` | 15 min |
| Création FeedbackBubbleClient.tsx | 45 min |
| Intégration layout (Option B sur 4 routes) | 30 min |
| Test mobile manuel sur preview Vercel | 30 min |
| **Total** | **~2 h** |

## 7. Dépendances

- **Story 4.7-v2 P1 (DONE)** — fournit `/api/me/feedback` endpoint + FeedbackModal client
- **`@untitledui/icons` `MessageChatCircle`** — déjà utilisé côté merchant
- **Notion DB feedback** — existe (cf. memory `reference_notion_feedback.md`), juste à vérifier qu'on tape sur la bonne DB
- **BottomTabBarClient** — pour calculer la position bottom de la pastille

## 8. Risques

- **Spam** : un client malveillant peut spammer la route. Atténuation : ajouter un `feedbackLimiter` Upstash si pas déjà présent (cohérent avec finding T2.3 audit Gemini api-validation).
- **UX collision** avec FeedbackModal de `/me/profile` (story 4.7-v2 P1) : à vérifier que les 2 ne s'ouvrent pas simultanément. Soit on garde les 2 (pastille = quick, modal profile = formel), soit on retire la modal profile.
