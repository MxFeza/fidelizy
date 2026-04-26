# Setup : Mon entreprise + uploads logo/bannière

> Étapes côté Supabase pour activer les nouvelles fonctionnalités d'upload (logo + bannière) et le profil étendu de Mon entreprise.

Toutes les étapes sont à faire **une seule fois** sur le projet Supabase `fidelizy` (eu-central-1).

---

## 1. Migration SQL — colonnes profil

Exécuter dans **Supabase Dashboard → SQL Editor** :

```sql
-- Fichier : supabase/migrations/20260426_business_profile_extension.sql
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS gmb_url text,
  ADD COLUMN IF NOT EXISTS gmb_visible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS opening_hours text,
  ADD COLUMN IF NOT EXISTS banner_url text;
```

✅ Vérifier après : Table Editor → `businesses` doit afficher les 9 nouvelles colonnes.

---

## 2. Créer le bucket `business-banners`

**Supabase Dashboard → Storage → New bucket** :

| Champ | Valeur |
|---|---|
| Name | `business-banners` |
| Public bucket | ✅ Oui (lecture publique pour affichage sur cartes/wallet) |
| File size limit | `8 MB` |
| Allowed MIME types | `image/png, image/jpeg, image/webp` |

---

## 3. Policies RLS — `business-banners`

Onglet **Policies** du bucket → New policy → utiliser ces 3 templates :

### SELECT (lecture publique)
```sql
-- Lecture publique : permet l'affichage sur les cartes loyalty + Apple/Google Wallet
-- sans signed URL, comme business-logos.
CREATE POLICY "business-banners-public-read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-banners');
```

### INSERT (upload owner-only)
```sql
CREATE POLICY "business-banners-owner-insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-banners'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### UPDATE (owner-only)
```sql
CREATE POLICY "business-banners-owner-update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-banners'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### DELETE (owner-only)
```sql
CREATE POLICY "business-banners-owner-delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-banners'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 4. Ajuster `business-logos` en lecture publique (si pas déjà fait)

Le bucket `business-logos` existe déjà mais peut être en mode privé strict. Pour que les **clients** puissent voir le logo du commerce sur leur carte de fidélité (sans signed URL), on doit autoriser SELECT public.

Vérifier sur **Storage → business-logos → Policies** : la policy `SELECT` doit autoriser `public` (anon). Si ce n'est pas le cas :

```sql
DROP POLICY IF EXISTS "business-logos-owner-read" ON storage.objects;
CREATE POLICY "business-logos-public-read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-logos');
```

INSERT/UPDATE/DELETE restent owner-only (premier segment du path = `auth.uid()`).

⚠️ Sécurité : les paths sont `{auth.uid()}/logo.{ext}`. Le `auth.uid()` est un UUID v4 — non-énumérable en pratique. Tout client avec le `business_id` connaît déjà l'identité du commerce, donc l'exposition publique de l'asset n'apporte aucune fuite supplémentaire.

---

## 5. Tester l'upload

Une fois les étapes 1-4 faites, tester le flow complet :

1. Aller sur `/dashboard/settings`
2. Uploader un logo PNG transparent → doit apparaître dans le header de la page + dans la sidebar (avatar bottom-left) avec object-contain (ratio préservé)
3. Uploader une bannière JPG paysage → doit apparaître en cover photo dans le header de la page
4. Recharger → assets persistent
5. Cliquer "Supprimer" → asset retiré

---

## 6. Notes

- Les URLs sont préfixées d'un `?v={timestamp}` après chaque upload pour bust le cache CDN
- Taille max : 5 MB (logo), 8 MB (bannière)
- Formats : PNG, JPG, WebP, SVG (logo uniquement)
- Le logo uploadé est **automatiquement** affiché sur les cartes de fidélité, le menu de navigation et les pass Apple/Google Wallet (object-contain partout pour préserver le ratio)
