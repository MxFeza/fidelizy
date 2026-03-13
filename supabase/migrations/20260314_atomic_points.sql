-- Fonction RPC pour ajouter des points de manière atomique
-- Retourne le nouveau solde
CREATE OR REPLACE FUNCTION increment_points(
  p_card_id UUID,
  p_amount INTEGER
) RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE loyalty_cards
  SET current_points = GREATEST(0, current_points + p_amount)
  WHERE id = p_card_id
  RETURNING current_points INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found: %', p_card_id;
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction RPC pour ajouter des tampons de manière atomique
-- Retourne le nouveau solde
CREATE OR REPLACE FUNCTION increment_stamps(
  p_card_id UUID,
  p_amount INTEGER
) RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE loyalty_cards
  SET current_stamps = GREATEST(0, current_stamps + p_amount)
  WHERE id = p_card_id
  RETURNING current_stamps INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found: %', p_card_id;
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction RPC pour déduire des points avec vérification de solde
-- Retourne le nouveau solde, ou -1 si solde insuffisant
CREATE OR REPLACE FUNCTION deduct_points_safe(
  p_card_id UUID,
  p_amount INTEGER
) RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE loyalty_cards
  SET current_points = current_points - p_amount
  WHERE id = p_card_id
    AND current_points >= p_amount
  RETURNING current_points INTO new_balance;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction RPC pour reset tampons (mettre à 0 et incrémenter visits)
CREATE OR REPLACE FUNCTION reset_stamps_atomic(
  p_card_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE loyalty_cards
  SET current_stamps = 0,
      total_visits = total_visits + 1,
      last_visit_at = NOW()
  WHERE id = p_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
