-- Fix bug onboarding 2026-05-15 : la check constraint business_type
-- acceptait uniquement 4 valeurs (cafe/restaurant/bakery/snack), ce qui
-- bloquait les commerces type "hair" (Coiffure) et "nails" (Onglerie &
-- Beaute) configurees dans le code TS (lib/types.ts BusinessType + page
-- onboarding). Resultat : UPDATE businesses SET business_type='hair'
-- silently rejected by Postgres CHECK → erreur generique cote client
-- "Impossible de sauvegarder".
--
-- Effet sur les clients existants :
--   - PrinceBarber69 (barbier) : bloque sur onboarding etape metier
--   - CALAD'HAIR (coiffure) : idem
--
-- Solution : drop + recreate la check constraint avec les 6 valeurs.
-- Migration safe : elargit l'enum, n'invalide aucune donnee existante.

ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_business_type_check;

ALTER TABLE businesses ADD CONSTRAINT businesses_business_type_check
  CHECK (business_type IS NULL OR business_type = ANY (ARRAY[
    'cafe'::text,
    'restaurant'::text,
    'bakery'::text,
    'snack'::text,
    'hair'::text,
    'nails'::text
  ]));

COMMENT ON CONSTRAINT businesses_business_type_check ON businesses IS
  'Whitelist des types de commerce supportes. Doit rester synchronisee avec BusinessType dans lib/types.ts et BUSINESS_TYPES dans OnboardingWizard.tsx.';
