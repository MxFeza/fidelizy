# Strategie de gestion des assets — Izou

**Statut :** Actif depuis 2026-04-25
**Owner :** Eric (CTO)
**Source de verite code :** `lib/assets.ts`

## Probleme

Avant ce document, les assets etaient stockes en vrac dans `/public/Izou Assets/` (photos JPG/PNG/WebP de 1-2 Mo). Trois problemes :

1. **Bloat git** : photos commitees dans le repo → augmente la taille du clone, ralentit les deploiements.
2. **Pas de support uploads utilisateur** : un commercant qui upload son logo n'a nulle part ou aller (`/public` n'est pas writable en runtime sur Vercel).
3. **Aucune strategie cloud** : si on perd l'ordi de dev, ou si on change de poste, les assets sont scattered.

## Decision

On utilise **Supabase Storage** avec **3 buckets distincts**. Le projet Supabase est `fidelizy` (region eu-central-1).

| Bucket | Visibilite | Taille max | MIME types | Usage |
|---|---|---|---|---|
| `public-assets` | **Public** | 10 Mo | `image/*`, `image/svg+xml` | Marketing/branding fournis par l'equipe Izou : photos auth, logos Izou. Lecture libre, upload via dashboard Supabase ou script admin. |
| `business-logos` | **Privee + RLS** | 5 Mo | `image/*` | Logos uploades par les commercants. Path : `{business_id}/logo.{ext}`. RLS : seul le proprietaire lit/ecrit. |
| `qr-codes` | **Privee + RLS** | 1 Mo | `image/png` | Cache PNG des QR codes generes server-side. Path : `{business_id}/qr.png`. RLS : seul le proprietaire lit/ecrit. |

Les **icones SVG techniques** (favicon, manifest, sw.js) **restent dans `/public/`** : tres petits (<5 Ko), versionnes, et requis par le navigateur a la racine du domaine.

## Convention de paths

```
public-assets/
  auth/balloons-landscape.webp
  auth/marie-cap.jpg
  auth/card-pocket.png
  branding/izou-logo-noir.svg
  branding/izou-logo-blanc.svg

business-logos/
  {business_id}/logo.png

qr-codes/
  {business_id}/qr.png
```

Le `business_id` est l'`auth.uid()` du commercant (relation 1-1 `businesses.id = auth.users.id`).

## Code helper

`lib/assets.ts` expose les helpers et un catalogue centralise :

```typescript
import { PUBLIC_ASSETS, getBusinessLogoPath, getQRCodePath } from '@/lib/assets'

// Asset public (URL directe, pas besoin de signer)
<Image src={PUBLIC_ASSETS.auth.balloons} ... />

// Asset prive (a signer cote serveur avec createSignedUrl)
const path = getBusinessLogoPath(businessId, 'logo.png')
const { data } = await supabase.storage.from('business-logos').createSignedUrl(path, 3600)
```

`next.config.ts` autorise le domaine Supabase Storage dans `images.remotePatterns` pour que `next/image` fonctionne.

## Policies RLS

- **public-assets** : `SELECT` ouvert a `public`. Pas d'`INSERT/UPDATE/DELETE` cote app — uploads via dashboard ou script admin avec service_role.
- **business-logos** & **qr-codes** : `SELECT/INSERT/UPDATE/DELETE` autorises uniquement si le premier segment du path egale `auth.uid()`. Garantit qu'aucun commercant ne peut acceder aux assets d'un autre.

## Re-uploader les assets publics

Si jamais le bucket `public-assets` est vide ou re-cree, executer ce script avec la service_role key :

```bash
set -a; source .env.local; set +a
KEY="$SUPABASE_SERVICE_ROLE_KEY"
URL="$NEXT_PUBLIC_SUPABASE_URL"

upload() {
  curl -s -X POST \
    -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
    -H "Content-Type: $3" -H "x-upsert: true" \
    --data-binary "@$1" \
    "$URL/storage/v1/object/public-assets/$2"
}

upload "path/to/balloons.webp" "auth/balloons-landscape.webp" "image/webp"
# etc.
```

**Important** : la cle Supabase est au nouveau format `sb_secret_*`. L'authent Storage exige les **deux** headers `apikey` ET `Authorization: Bearer` — sinon erreur 403 "Invalid Compact JWS".

## Production deployment

- Vercel sert `next/image` avec optimisation automatique pour les URLs Supabase autorisees dans `remotePatterns`.
- Pas de configuration supplementaire necessaire : meme image, meme URL en local et en prod.
- Le CDN Supabase est colocalise eu-central-1, latence acceptable depuis la France.

## Quand creer un nouveau bucket ?

Cree un nouveau bucket si :
- Le contenu a un cycle de vie distinct (ex : `customer-avatars` privees uploadees par les clients finaux).
- Les regles d'acces sont differentes (ex : `internal-reports` accessibles uniquement aux admins Izou).

Sinon, ajoute un sous-prefixe dans un bucket existant (ex : `public-assets/email-templates/`).

## Historique des migrations

| Date | Action |
|---|---|
| 2026-04-25 | Creation initiale des 3 buckets + RLS policies. Migration des 5 assets `/public/Izou Assets/` (4 photos auth + 2 logos Izou) vers `public-assets`. Ajout colonnes `business_type` et `welcome_seen` sur `businesses`. |
