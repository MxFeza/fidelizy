-- Migration: Remove gamification tables and clean up JSONB fields
-- Story 0.2: Elagage gamification hard delete
-- Date: 2026-04-12
-- IRREVERSIBLE: This migration permanently deletes gamification data.

-- 1. Drop tables (order matters: children first, then parents)
DROP TABLE IF EXISTS wheel_spins;
DROP TABLE IF EXISTS wheel_prizes;
DROP TABLE IF EXISTS mission_completions;
DROP TABLE IF EXISTS missions;
DROP TABLE IF EXISTS pwa_visits;

-- 2. Clean up businesses.gamification JSONB: keep only initial_stamps
UPDATE businesses
SET gamification = jsonb_build_object('initial_stamps', COALESCE((gamification->>'initial_stamps')::int, 0))
WHERE gamification IS NOT NULL;
