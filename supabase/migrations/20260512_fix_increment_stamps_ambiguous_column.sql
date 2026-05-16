-- 🔴 HOTFIX PROD (2026-05-12) — Ajout de tampons cassé côté merchant
--
-- Symptôme : Toast rouge "Erreur lors de la mise à jour des tampons" sur
-- la fiche client dashboard quand le merchant clique "Ajouter".
--
-- Cause racine (logs Postgres) :
--   ERROR: column reference "total_visits" is ambiguous
--
-- La migration `20260510_increment_stamps_no_auto_reset.sql` a réécrit la
-- fonction `increment_stamps(uuid, integer, integer)` sans qualifier les
-- colonnes :
--
--   SET total_visits = total_visits + GREATEST(0, p_amount)
--
-- Postgres en SECURITY DEFINER avec un body PL/pgSQL ne sait plus si
-- `total_visits` est la colonne ou un alias. Idem `current_stamps`.
-- L'ancienne version (20260412) qualifiait via `loyalty_cards.total_visits`,
-- la régression vient du refactor 20260510.
--
-- Fix : utiliser un alias de table explicite `lc` et qualifier toutes les
-- références. Le comportement métier (cap à stamps_required, pas de reset
-- auto) reste identique à la 20260510.

CREATE OR REPLACE FUNCTION public.increment_stamps(
  p_card_id uuid,
  p_amount integer,
  p_stamps_required integer
)
RETURNS TABLE(new_stamps integer, is_complete boolean, total_visits integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_final int;
  v_visits int;
BEGIN
  UPDATE public.loyalty_cards AS lc
  SET
    current_stamps = LEAST(GREATEST(0, lc.current_stamps + p_amount), p_stamps_required),
    total_visits   = lc.total_visits + GREATEST(0, p_amount),
    last_visit_at  = now()
  WHERE lc.id = p_card_id
  RETURNING lc.current_stamps, lc.total_visits
  INTO v_final, v_visits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found: %', p_card_id;
  END IF;

  RETURN QUERY SELECT
    v_final,
    (v_final >= p_stamps_required AND p_amount > 0),
    v_visits;
END;
$$;

COMMENT ON FUNCTION public.increment_stamps(uuid, integer, integer) IS
  'Story 9.x.fix 2026-05-10 — N''auto-reset plus la carte à 0 à la complétion. Le claim de récompense se fait explicitement via le flow claim_requests + scan/validate-claim. Hotfix 2026-05-12 : alias lc pour désambiguïser les colonnes (bug prod ajout tampons).';
