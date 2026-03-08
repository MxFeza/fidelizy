-- Missions disponibles par commerce
CREATE TABLE missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  template_key text NOT NULL,
  reward_points integer NOT NULL DEFAULT 3,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, template_key)
);

-- Complétions de missions
CREATE TABLE mission_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  mission_id uuid REFERENCES missions(id) ON DELETE CASCADE,
  proof_url text,
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'pending_review')),
  period text,
  points_awarded integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Parrainages
CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_card_id uuid REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  referred_card_id uuid REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  referrer_points_awarded integer DEFAULT 0,
  referred_points_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(referred_card_id, business_id)
);

-- Visites PWA quotidiennes
CREATE TABLE pwa_visits (
  card_id uuid REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (card_id, visit_date)
);

-- Champ anniversaire sur cards
ALTER TABLE loyalty_cards ADD COLUMN IF NOT EXISTS birthday date;

-- RLS
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_manage_missions" ON missions
  FOR ALL USING (business_id = auth.uid());

ALTER TABLE mission_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_view_completions" ON mission_completions
  FOR SELECT USING (
    mission_id IN (SELECT id FROM missions WHERE business_id = auth.uid())
  );

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_view_referrals" ON referrals
  FOR SELECT USING (business_id = auth.uid());

ALTER TABLE pwa_visits ENABLE ROW LEVEL SECURITY;
-- pwa_visits : accès uniquement via service role (API routes)

-- Index
CREATE INDEX idx_missions_business ON missions(business_id);
CREATE INDEX idx_mission_completions_card ON mission_completions(card_id);
CREATE INDEX idx_mission_completions_mission ON mission_completions(mission_id);
CREATE INDEX idx_referrals_business ON referrals(business_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_card_id);
CREATE INDEX idx_pwa_visits_card ON pwa_visits(card_id);
