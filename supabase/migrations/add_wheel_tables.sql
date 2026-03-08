-- Segments de la roue (config par commerce)
CREATE TABLE wheel_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  label text NOT NULL,
  emoji text DEFAULT '🎯',
  probability integer NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('bonus_stamps', 'bonus_points', 'custom_reward')),
  reward_value integer DEFAULT 1,
  reward_description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Historique des spins
CREATE TABLE wheel_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  points_spent integer NOT NULL,
  prize_id uuid REFERENCES wheel_prizes(id),
  prize_label text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE wheel_prizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_manage_prizes" ON wheel_prizes
  FOR ALL USING (business_id = auth.uid());

ALTER TABLE wheel_spins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_view_spins" ON wheel_spins
  FOR SELECT USING (business_id = auth.uid());

-- Index
CREATE INDEX idx_wheel_prizes_business ON wheel_prizes(business_id);
CREATE INDEX idx_wheel_spins_card ON wheel_spins(card_id);
CREATE INDEX idx_wheel_spins_business ON wheel_spins(business_id);
