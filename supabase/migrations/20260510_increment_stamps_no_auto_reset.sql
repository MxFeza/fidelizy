-- Story 9.x.fix (2026-05-10) — Bug critique prod : auto-claim récompense
--
-- Avant : la fonction increment_stamps reset current_stamps à 0 dès qu'on
-- atteignait stamps_required. Ça causait :
--  - Récompense automatiquement déduite sans laisser le client choisir
--  - Carte remise à 0 instantanément
--  - Aucun moyen pour le client de sélectionner laquelle des récompenses
--    (multi-tiers) il voulait réclamer
--
-- Après : la fonction CAP la carte à stamps_required (pas de reset).
-- Le flow de réclamation manuel via claim_requests (code 6 chars présenté
-- au merchant) prend le relais pour acter la récompense + reset.
--
-- is_complete reste exposé pour que le code applicatif détecte la complétion
-- et notifie le client "Récompense disponible".

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
  UPDATE public.loyalty_cards
  SET
    -- Cap à stamps_required au lieu de reset à 0. Une fois la carte pleine,
    -- les nouveaux scans ne dépassent pas le seuil tant que le client n'a
    -- pas réclamé sa récompense (flow claim_requests + validate-claim).
    current_stamps = LEAST(GREATEST(0, current_stamps + p_amount), p_stamps_required),
    total_visits = total_visits + GREATEST(0, p_amount),
    last_visit_at = now()
  WHERE id = p_card_id
  RETURNING current_stamps, total_visits
  INTO v_final, v_visits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found: %', p_card_id;
  END IF;

  RETURN QUERY SELECT
    v_final,
    -- is_complete = la carte est exactement au seuil après cette opération.
    -- Le caller (loyalty.service.ts) utilise ce flag pour notifier le client
    -- qu'une récompense est dispo, mais NE FAIT PAS le claim auto.
    (v_final >= p_stamps_required AND p_amount > 0),
    v_visits;
END;
$$;

COMMENT ON FUNCTION public.increment_stamps(uuid, integer, integer) IS
  'Story 9.x.fix 2026-05-10 — N''auto-reset plus la carte à 0 à la complétion. Le claim de récompense se fait explicitement via le flow claim_requests + scan/validate-claim.';
