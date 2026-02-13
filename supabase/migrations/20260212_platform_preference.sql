-- ============================================================
-- Migration: Add preferred_platform columns to user_profiles_intent
-- Date: 2026-02-12
-- Description: Adds Q11 platform preference answer + score columns
-- ============================================================

ALTER TABLE user_profiles_intent
ADD COLUMN IF NOT EXISTS answer_preferred_platform TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS score_preferred_platform INTEGER DEFAULT 1;
