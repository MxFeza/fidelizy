-- Add gamification JSONB column to businesses table
-- Default values ensure existing businesses are unaffected
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS gamification jsonb DEFAULT '{
  "surprise_enabled": false,
  "surprise_probability": 0.2,
  "surprise_reward_type": "bonus_stamp",
  "surprise_reward_value": 1,
  "initial_stamps": 0,
  "goal_gradient_notification": true
}'::jsonb;
