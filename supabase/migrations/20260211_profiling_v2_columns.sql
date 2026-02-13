-- ============================================================================
-- IntentAI — Profiling System v2: Add new profiling columns
-- ============================================================================
-- 4 new profiling dimensions:
--   skill_secondary, interest_market, audience_access, daily_routine
-- Rename conceptual mapping:
--   answer_comfort → now stores work_style answer (column kept for compat)
--   answer_skill   → now stores skill_primary answer (column kept for compat)
--   score_comfort  → now stores work_style score (column kept for compat)
--   score_skill    → now stores skill_primary score (column kept for compat)
-- ============================================================================

-- Add new answer columns
ALTER TABLE user_profiles_intent
  ADD COLUMN IF NOT EXISTS answer_skill_secondary TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS answer_interest_market TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS answer_audience_access TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS answer_daily_routine TEXT DEFAULT '';

-- Add new score columns
ALTER TABLE user_profiles_intent
  ADD COLUMN IF NOT EXISTS score_skill_secondary INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_interest_market INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS score_audience_access INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_daily_routine INTEGER DEFAULT 1;

-- Add answer_tags JSONB for AI context enrichment
ALTER TABLE user_profiles_intent
  ADD COLUMN IF NOT EXISTS answer_tags JSONB DEFAULT '{}';
