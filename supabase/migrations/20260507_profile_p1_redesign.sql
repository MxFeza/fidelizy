-- Story 4.7 v2 — Refonte profil client P1 (2026-05-07)
-- Ajoute last_name, avatar_url, notification_prefs, card_color à customers.
-- card_color reste nullable -> les cartes existantes gardent leur noir default (#0F172A).
-- Crée table customer_feedback + bucket customer-avatars + RLS.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS card_color text;

ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_card_color_check;
ALTER TABLE public.customers
  ADD CONSTRAINT customers_card_color_check
  CHECK (card_color IS NULL OR card_color IN ('violet', 'orange', 'jaune', 'corail', 'vert'));

COMMENT ON COLUMN public.customers.last_name IS 'Nom de famille du client (Story 4.7 v2). Optionnel.';
COMMENT ON COLUMN public.customers.avatar_url IS 'URL Supabase Storage de l avatar customer. Path: customer-avatars/{customer_id}/avatar.{ext}';
COMMENT ON COLUMN public.customers.notification_prefs IS 'Prefs notif client (jsonb) — clés: push_enabled, stamps_enabled, rewards_enabled, campaigns_enabled, referrals_enabled (booleans).';
COMMENT ON COLUMN public.customers.card_color IS 'Couleur carte choisie par client (Story 4.7.5). NULL = default noir (#0F172A). 5 valeurs si custom.';

CREATE TABLE IF NOT EXISTS public.customer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.customer_feedback IS 'Story 4.7 v2 — feedbacks libres soumis par clients via modal. RLS deny all, accès via service_role.';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-avatars',
  'customer-avatars',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "customer_avatars_public_read" ON storage.objects;
CREATE POLICY "customer_avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'customer-avatars');

DROP POLICY IF EXISTS "customer_avatars_owner_write" ON storage.objects;
CREATE POLICY "customer_avatars_owner_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'customer-avatars');

DROP POLICY IF EXISTS "customer_avatars_owner_update" ON storage.objects;
CREATE POLICY "customer_avatars_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'customer-avatars');

DROP POLICY IF EXISTS "customer_avatars_owner_delete" ON storage.objects;
CREATE POLICY "customer_avatars_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'customer-avatars');
