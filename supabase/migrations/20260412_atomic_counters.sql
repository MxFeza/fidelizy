-- Drop existing functions if they have incompatible signatures
DROP FUNCTION IF EXISTS increment_stamps(uuid, int, int);
DROP FUNCTION IF EXISTS increment_points(uuid, int);
DROP FUNCTION IF EXISTS increment_points(uuid, integer);
DROP FUNCTION IF EXISTS deduct_points(uuid, int);
DROP FUNCTION IF EXISTS deduct_points(uuid, integer);

-- Atomic stamp increment: prevents race conditions on double-scan
-- Returns the new stamp count and whether the card is complete
CREATE OR REPLACE FUNCTION increment_stamps(
  p_card_id uuid,
  p_amount int,
  p_stamps_required int
)
RETURNS TABLE(new_stamps int, is_complete boolean, total_visits int)
LANGUAGE plpgsql
AS $$
DECLARE
  v_raw int;
  v_final int;
  v_complete boolean;
  v_visits int;
BEGIN
  UPDATE loyalty_cards
  SET
    current_stamps = CASE
      WHEN (current_stamps + p_amount) >= p_stamps_required THEN 0
      ELSE current_stamps + p_amount
    END,
    total_visits = loyalty_cards.total_visits + p_amount,
    last_visit_at = now()
  WHERE id = p_card_id
  RETURNING
    current_stamps,
    (current_stamps + p_amount) >= p_stamps_required,
    loyalty_cards.total_visits
  INTO v_final, v_complete, v_visits;

  -- Note: v_complete uses pre-update value in the RETURNING expression
  -- We need to recalculate
  SELECT
    lc.current_stamps,
    lc.total_visits
  INTO v_final, v_visits
  FROM loyalty_cards lc WHERE lc.id = p_card_id;

  v_raw := v_final;
  -- If current_stamps is 0 and we added stamps, it means it was reset (complete)
  v_complete := (v_final = 0 AND p_amount > 0);

  RETURN QUERY SELECT v_final, v_complete, v_visits;
END;
$$;

-- Atomic point increment: prevents race conditions
-- Returns the new point count
CREATE OR REPLACE FUNCTION increment_points(
  p_card_id uuid,
  p_amount int
)
RETURNS TABLE(new_points int, previous_points int, total_visits int)
LANGUAGE plpgsql
AS $$
DECLARE
  v_prev int;
  v_new int;
  v_visits int;
BEGIN
  -- Read current before update
  SELECT current_points INTO v_prev FROM loyalty_cards WHERE id = p_card_id;

  UPDATE loyalty_cards
  SET
    current_points = current_points + p_amount,
    total_visits = loyalty_cards.total_visits + 1,
    last_visit_at = now()
  WHERE id = p_card_id
  RETURNING current_points, loyalty_cards.total_visits
  INTO v_new, v_visits;

  RETURN QUERY SELECT v_new, v_prev, v_visits;
END;
$$;

-- Atomic point deduction (for rewards): prevents spending more than available
CREATE OR REPLACE FUNCTION deduct_points(
  p_card_id uuid,
  p_amount int
)
RETURNS TABLE(new_points int, success boolean)
LANGUAGE plpgsql
AS $$
DECLARE
  v_new int;
BEGIN
  UPDATE loyalty_cards
  SET current_points = current_points - p_amount
  WHERE id = p_card_id AND current_points >= p_amount
  RETURNING current_points INTO v_new;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, false;
  ELSE
    RETURN QUERY SELECT v_new, true;
  END IF;
END;
$$;
