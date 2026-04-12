# Izou — Index de documentation

> Genere le : 2026-03-23 | Scan exhaustif
> Cet index est le point d'entree principal pour le developpement assiste par IA.

## Vue d'ensemble du projet

- **Nom** : Izou (domaine : fidelizy)
- **Type** : Application web full-stack monolithique
- **Stack** : Next.js 16.1.6 / React 19 / TypeScript 5 / Tailwind CSS 4 / Supabase / Upstash Redis / Vercel
- **Architecture** : Next.js App Router (Server + Client Components, API Routes serverless)
- **URL prod** : https://fidelizy.vercel.app
- **Repo** : https://github.com/MxFeza/fidelizy

## Reference rapide

- **Langage** : TypeScript 5 (strict)
- **Point d'entree** : `app/layout.tsx`
- **Middleware** : `middleware.ts` (protection /dashboard/*)
- **Pattern** : Component-based + API Routes serverless, SSR/CSR hybrid
- **Base de donnees** : 14 tables PostgreSQL avec RLS
- **API** : 45 endpoints (12 domaines)
- **Composants** : 28 (8 serveur, 20 client)
- **Rate limiters** : 15 (Upstash Redis sliding window)

## Documentation generee

- [Vue d'ensemble du projet](./project-overview.md)
- [Architecture](./architecture.md)
- [Arbre source annote](./source-tree-analysis.md)
- [Contrats API](./api-contracts.md) — 45 endpoints documentes
- [Modeles de donnees](./data-models.md) — 14 tables avec schema complet
- [Inventaire des composants](./component-inventory.md) — 28 composants
- [Guide de developpement](./development-guide.md)
- [Guide de deploiement](./deployment-guide.md)

## Documentation existante

- [Etat complet du projet (original)](./PROJET_STATE.md) — Documentation initiale detaillee (9 mars 2026)
- [Template email OTP Supabase](./SUPABASE_EMAIL_TEMPLATE.md) — Configuration autocomplete iOS/Android
- [Audit de securite](../SECURITY_AUDIT.md) — Headers HTTP, validation input, rate limiting (4 mars 2026)

## Pour commencer

### Developpement local
```bash
git clone https://github.com/MxFeza/fidelizy.git
cd fidelizy
npm install
# Configurer .env.local (voir development-guide.md)
npm run dev
```

### Navigation par fonctionnalite

| Fonctionnalite | Fichiers cles |
|----------------|---------------|
| Auth client (OTP) | `app/page.tsx`, `app/api/auth/`, `app/components/OTPInput.tsx` |
| Carte fidelite | `app/card/[cardId]/`, `app/api/card/`, `lib/types.ts` |
| Dashboard | `app/dashboard/(protected)/`, `app/api/dashboard/` |
| Apple Wallet | `lib/wallet/`, `app/api/wallet/` |
| Push notifications | `lib/push/`, `app/api/push/`, `public/sw.js` |
| Gamification | `app/api/dashboard/gamification/`, `app/api/wheel/`, `app/api/missions/` |
| Rate limiting | `lib/ratelimit.ts` |
| Base de donnees | `supabase/migrations/`, `lib/supabase/`, `lib/types.ts` |

### Utilisation pour un PRD brownfield

Lors de la creation d'un PRD pour une nouvelle fonctionnalite, pointer vers :
- **Ce fichier** (`docs/index.md`) comme point d'entree
- **architecture.md** pour le contexte technique
- **api-contracts.md** pour les endpoints existants
- **data-models.md** pour le schema de la base
- **component-inventory.md** pour les composants reutilisables
