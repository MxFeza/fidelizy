-- Carte loyalty : retour au noir Izou (#0F172A) sur la carte elle-meme.
-- Decision user 2026-05-14 (revision de 20260513_force_brand_izou_primary_color
-- qui avait force le violet brand #7F56D9). Le violet brand reste pour les
-- CTAs/banners/etats (DA Izou globale), mais la carte loyalty revient au noir
-- Izou pour matcher la nouvelle direction artistique inspiree des passes Apple
-- Wallet style Carrefour Club.
--
-- Aligne app + Apple Wallet pkpass : lib/wallet/generatePass.ts lit
-- business.primary_color donc le pass devient automatiquement noir Izou.
--
-- Pas de personnalisation couleur cote merchant (DA Izou uniforme — cf.
-- memoire feedback_da_izou_uniforme.md).

UPDATE businesses SET primary_color = '#0F172A';

ALTER TABLE businesses ALTER COLUMN primary_color SET DEFAULT '#0F172A';

COMMENT ON COLUMN businesses.primary_color IS
  'Couleur principale carte loyalty. Forcee noir Izou #0F172A pour le pilote (DA uniforme). Lue par LoyaltyCardVisual + lib/wallet/generatePass.ts.';
