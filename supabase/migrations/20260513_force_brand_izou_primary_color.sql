-- 2026-05-13 — Force le brand Izou sur tous les commerces + nouveau default.
--
-- Décision pré-pilote (user retour 2026-05-13) :
--   "Uniformément sur tous mes clients, doit être la direction artistique
--   de Izou qui doit primer. Pour le moment, il ne faut pas ajouter d'outils
--   qui permettent de changer la couleur des cartes."
--
-- Actions :
--   1. Reset toutes les valeurs existantes de primary_color sur '#7F56D9'.
--      (Le default historique '#6366f1' indigo + les couleurs auto-set par
--      l'onboarding métier ne respectent pas la charte Izou.)
--   2. Changer le DEFAULT de la colonne pour les futurs commerces.
--
-- Le color picker UI dans BusinessClient (introduit dans la PR #49) est
-- retiré dans le même commit que cette migration côté app — la DA est
-- imposée, pas configurable. Si on autorise la perso plus tard (story v2),
-- il suffit de réactiver le picker, la colonne accepte toujours un hex
-- libre.

UPDATE businesses SET primary_color = '#7F56D9' WHERE primary_color IS NULL OR primary_color != '#7F56D9';
ALTER TABLE businesses ALTER COLUMN primary_color SET DEFAULT '#7F56D9';
