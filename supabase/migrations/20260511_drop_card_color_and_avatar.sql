-- 2026-05-11 — drop customer-side card_color + avatar_url (pre-pilot scope cut).
--
-- Decision (session 2026-05-11):
--   - Card color: switch to merchant-fixed charter (business.primary_color)
--     instead of customer self-customization. Removes B4 sync issue and one
--     full screen + endpoint from the pre-pilot scope.
--   - Avatar: never surfaced anywhere in the app despite the upload UI.
--     Cuts U3 (one less polish item before pilot).
--
-- Idempotent: IF EXISTS guards make this safe to re-run.

ALTER TABLE customers
  DROP COLUMN IF EXISTS card_color,
  DROP COLUMN IF EXISTS avatar_url;
