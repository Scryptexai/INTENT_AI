-- ============================================================================
-- IntentAI — User Profiling & Path Progress Tables
-- ============================================================================
-- Tables:
--   1. user_profiles_intent  — profiling answers + scores + segment + chosen path
--   2. user_path_progress    — per-user task completion tracking
--   3. weekly_checkpoints    — weekly self-report + system adjustment
--   4. ai_personalization_log — AI-generated content per user (why text, custom tasks)
-- ============================================================================

-- 1. User profiling data (replaces localStorage "intent_profile")
CREATE TABLE IF NOT EXISTS user_profiles_intent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Raw answers
  answer_time TEXT NOT NULL,
  answer_capital TEXT NOT NULL,
  answer_target_speed TEXT NOT NULL,
  answer_comfort TEXT NOT NULL,
  answer_risk TEXT NOT NULL,
  answer_skill TEXT NOT NULL,
  
  -- Computed scores
  score_time INTEGER NOT NULL DEFAULT 1,
  score_capital INTEGER NOT NULL DEFAULT 0,
  score_target_speed INTEGER NOT NULL DEFAULT 1,
  score_comfort INTEGER NOT NULL DEFAULT 1,
  score_risk INTEGER NOT NULL DEFAULT 1,
  score_skill INTEGER NOT NULL DEFAULT 0,
  
  -- Engine results
  segment_tag TEXT NOT NULL,  -- zero_capital_builder, skill_leverager, etc.
  primary_path TEXT NOT NULL, -- micro_service, niche_content, etc.
  alternate_path TEXT,
  eliminated_paths TEXT[] DEFAULT '{}',
  path_scores JSONB DEFAULT '{}',
  
  -- AI generated content
  ai_why_text TEXT,           -- AI-generated "kenapa jalur ini cocok"
  ai_custom_tasks JSONB,      -- AI-personalized weekly tasks
  ai_niche_suggestion TEXT,   -- AI-suggested specific niche
  
  -- State
  is_active BOOLEAN DEFAULT true,
  current_week INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_checkpoint_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, is_active) -- only 1 active profile per user
);

-- 2. Per-task completion tracking (replaces localStorage progress)
CREATE TABLE IF NOT EXISTS user_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles_intent(id) ON DELETE CASCADE,
  
  path_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  task_index INTEGER NOT NULL,
  task_text TEXT NOT NULL,
  
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, profile_id, path_id, week_number, task_index)
);

-- 3. Weekly checkpoint logs (section XII-H from NEW_KONSEP)
CREATE TABLE IF NOT EXISTS weekly_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles_intent(id) ON DELETE CASCADE,
  
  week_number INTEGER NOT NULL,
  completion_rate REAL DEFAULT 0,        -- 0.0 to 1.0
  self_report_status TEXT,               -- 'on_track', 'stuck', 'ahead'
  stuck_area TEXT,                        -- free text: where user is stuck
  market_response BOOLEAN,               -- did user get market response?
  
  -- System decision
  system_adjustment TEXT,                -- 'continue', 'adjust_niche', 'pivot_path'
  ai_feedback TEXT,                       -- AI-generated weekly feedback
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, profile_id, week_number)
);

-- 4. AI personalization log (audit trail of AI calls)
CREATE TABLE IF NOT EXISTS ai_personalization_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES user_profiles_intent(id) ON DELETE SET NULL,
  
  request_type TEXT NOT NULL,  -- 'why_text', 'custom_tasks', 'weekly_feedback', 'niche_suggestion'
  ai_input JSONB NOT NULL,     -- structured context sent to AI
  ai_output TEXT NOT NULL,     -- AI response
  model_used TEXT DEFAULT 'claude-3-sonnet-20240229',
  processing_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE user_profiles_intent ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_personalization_log ENABLE ROW LEVEL SECURITY;

-- user_profiles_intent: users can only CRUD their own
CREATE POLICY "Users manage own intent profile"
  ON user_profiles_intent FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_path_progress: users can only CRUD their own
CREATE POLICY "Users manage own path progress"
  ON user_path_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- weekly_checkpoints: users can only CRUD their own
CREATE POLICY "Users manage own checkpoints"
  ON weekly_checkpoints FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ai_personalization_log: users can only read their own
CREATE POLICY "Users read own ai logs"
  ON ai_personalization_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ai logs"
  ON ai_personalization_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_user_profiles_intent_user ON user_profiles_intent(user_id);
CREATE INDEX idx_user_profiles_intent_active ON user_profiles_intent(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_path_progress_profile ON user_path_progress(profile_id);
CREATE INDEX idx_weekly_checkpoints_profile ON weekly_checkpoints(profile_id);
