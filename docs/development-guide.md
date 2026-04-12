# Izou — Guide de developpement

> Genere le : 2026-03-23 | Scan exhaustif

## Pre-requis

| Outil | Version |
|-------|---------|
| Node.js | >= 18 (recommande : 20+) |
| npm | >= 9 |
| Git | >= 2.x |
| Compte Supabase | Projet avec Auth + PostgreSQL |
| Compte Upstash | Redis pour rate limiting |
| Compte Apple Developer | Pour Apple Wallet (optionnel en dev) |

## Installation

```bash
git clone https://github.com/MxFeza/fidelizy.git
cd fidelizy
npm install
```

## Variables d'environnement

Creer un fichier `.env.local` a la racine :

```env
# Supabase (requis)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Upstash Redis (requis pour rate limiting)
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=xxx

# Apple Wallet (optionnel en dev)
APPLE_PASS_TYPE_ID=pass.com.xxx
APPLE_TEAM_ID=xxx
WALLET_AUTH_SECRET=xxx
APPLE_PASS_CERT_B64=xxx
APPLE_PASS_KEY_B64=xxx
APPLE_WWDR_CERT_B64=xxx

# Web Push VAPID (optionnel en dev)
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:contact@fidelizy.app

# Vercel Cron (prod uniquement)
CRON_SECRET=xxx
```

Pour generer les cles VAPID :
```bash
node scripts/generate-vapid-keys.js
```

## Commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de developpement (Turbopack) |
| `npm run build` | Build de production |
| `npm start` | Serveur de production |
| `npm run lint` | Linting ESLint |

## Structure du projet

```
app/           → Pages + API routes (Next.js App Router)
components/    → Composants partages dashboard
lib/           → Utilitaires (Supabase, Wallet, Push, Rate limit, Types)
src/           → Legacy (duplication de lib/supabase/) — a ignorer
supabase/      → Migrations SQL
public/        → Assets statiques (PWA icons, manifest, service worker)
scripts/       → Scripts utilitaires
docs/          → Documentation
```

Voir [source-tree-analysis.md](./source-tree-analysis.md) pour le detail complet.

## Base de donnees

### Appliquer les migrations

Les migrations sont dans `supabase/migrations/`. Les appliquer dans l'ordre :

1. Tables de base (businesses, customers, loyalty_cards, transactions, reward_tiers, reward_claims) — deja presentes sur Supabase
2. `add_short_code.sql`
3. `add_gamification_column.sql`
4. `add_wheel_tables.sql`
5. `add_missions_tables.sql`
6. `20260308_push_subscriptions.sql`
7. `20260308_push_last_sent.sql`
8. `20260309_reward_claims_cascade.sql`

### Clients Supabase

3 clients disponibles :

| Client | Fichier | Usage | RLS |
|--------|---------|-------|-----|
| Browser | `lib/supabase/client.ts` | Composants client (navigateur) | Oui |
| Server | `lib/supabase/server.ts` | Server Components, middleware | Oui |
| Service | `lib/supabase/service.ts` | API routes (operations publiques) | Non (bypass) |

**Important** : Ne jamais importer `lib/supabase/service.ts` dans un composant `'use client'`.

## Patterns de developpement

### Creer une nouvelle page

1. Server Component pour le chargement SSR :
```tsx
// app/ma-page/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function MaPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('table').select('*')
  return <MaPageClient data={data} />
}
```

2. Client Component pour l'interactivite :
```tsx
// app/ma-page/MaPageClient.tsx
'use client'

export default function MaPageClient({ data }) {
  const [state, setState] = useState(data)
  // ...
}
```

### Creer une nouvelle API route

```tsx
// app/api/mon-endpoint/route.ts
import { createServiceClient } from '@/lib/supabase/service'
import { scanLimiter, getIP } from '@/lib/ratelimit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const { success } = await scanLimiter.limit(getIP(request))
  if (!success) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })

  // 2. Auth (si route protegee)
  const supabase = await createClient() // server client
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  // 3. Validation input
  const { param } = await request.json()
  if (!param || typeof param !== 'string') {
    return NextResponse.json({ error: 'Parametre invalide' }, { status: 400 })
  }

  // 4. Logique metier (service client pour bypass RLS si necessaire)
  const service = createServiceClient()
  const { data, error } = await service.from('table').select('*')

  return NextResponse.json({ data })
}
```

### Notifications

Apres une operation de carte, envoyer les notifications :

```tsx
import { sendPushToCard } from '@/lib/push/sendPush'
import { notifyWalletDevices, setPendingWalletAction } from '@/lib/wallet/generatePass'

// Web Push
await sendPushToCard(cardId, { title: 'Titre', body: 'Message' })

// Apple Wallet
setPendingWalletAction(qrCodeId, 'add', remainingForReward)
await notifyWalletDevices(qrCodeId)
```

## Tests

Aucun framework de tests n'est configure. C'est une dette technique identifiee.

## Conventions de code

- **Langage** : TypeScript strict
- **Style** : ESLint (eslint-config-next + TypeScript)
- **CSS** : Tailwind CSS 4 (classes utilitaires, pas de CSS modules)
- **Imports** : Alias `@/*` → racine du projet
- **Nommage fichiers** : camelCase pour les composants, kebab-case pour les routes API
- **Composants** : PascalCase
- **Types** : Interfaces dans `lib/types.ts`
- **Pas de state management global** : `useState` local uniquement

## Flux de travail Git

- Branche principale : `main`
- Auto-deploy sur Vercel depuis `main`
- Pas de CI/CD au-dela de Vercel
- Commits en francais avec prefixes conventionnels (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`)
