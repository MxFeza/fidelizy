-- Couleur carte loyalty : passage du noir Izou #0F172A vers le noir officiel
-- du design system Izou #1E1E1E (decision user 2026-05-13 — c'est la teinte
-- exacte du DS, pas un slate-900). Aligne carte in-app + Apple Wallet pkpass
-- + theme color PWA.
--
-- Revision de 20260514_card_color_black_izou.sql qui avait force #0F172A.

UPDATE businesses SET primary_color = '#1E1E1E' WHERE primary_color IN ('#0F172A', '#7F56D9');

ALTER TABLE businesses ALTER COLUMN primary_color SET DEFAULT '#1E1E1E';

COMMENT ON COLUMN businesses.primary_color IS
  'Couleur principale carte loyalty. Forcee #1E1E1E (noir DS Izou) pour le pilote (DA uniforme).';
