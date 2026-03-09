-- Fix: reward_claims foreign key blocks deletion of reward_tiers
-- Add ON DELETE CASCADE so deleting a reward_tier also removes its claims

ALTER TABLE reward_claims DROP CONSTRAINT IF EXISTS reward_claims_reward_tier_id_fkey;
ALTER TABLE reward_claims ADD CONSTRAINT reward_claims_reward_tier_id_fkey
  FOREIGN KEY (reward_tier_id) REFERENCES reward_tiers(id) ON DELETE CASCADE;
