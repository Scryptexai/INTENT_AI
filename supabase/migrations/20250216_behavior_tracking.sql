-- Migration: Behavior Tracking Layer
-- Created: 2025-02-16
-- Purpose: Track user behavior for continuous learning & personalization
-- Based on: INTENT_DOC.txt requirement for "Behavior Tracking Layer"

-- ============================================================================
-- TABLE: behavior_sessions
-- ============================================================================
-- Tracks user sessions for grouping events and calculating session metrics

CREATE TABLE IF NOT EXISTS behavior_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  page_views INTEGER DEFAULT 0,
  events INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_behavior_sessions_user_id ON behavior_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_sessions_start_time ON behavior_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_sessions_session_id ON behavior_sessions(session_id);

-- ============================================================================
-- TABLE: behavior_events
-- ============================================================================
-- Tracks individual behavior events for analysis and personalization

CREATE TABLE IF NOT EXISTS behavior_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view', 'tab_switch',
    'task_view', 'task_start', 'task_complete', 'task_skip',
    'generator_use', 'content_copy', 'content_regenerate',
    'checkpoint_submit', 'checkpoint_status_change',
    'profile_create', 'profile_reset', 'profile_upgrade',
    'job_view_detail', 'job_accept_primary', 'job_view_alternative',
    'signal_click', 'signal_dismiss',
    'risk_warning_view', 'pivot_accept', 'pivot_dismiss',
    'week_expand', 'week_collapse', 'task_detail_expand'
  )),
  element_id TEXT,
  context JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_url TEXT NOT NULL,
  time_on_page INTEGER, -- milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_behavior_events_user_id ON behavior_events(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_events_session_id ON behavior_events(session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_events_event_type ON behavior_events(event_type);
CREATE INDEX IF NOT EXISTS idx_behavior_events_timestamp ON behavior_events(timestamp DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_behavior_events_user_timestamp ON behavior_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_user_type ON behavior_events(user_id, event_type);

-- ============================================================================
-- TABLE: behavior_insights_cache
-- ============================================================================
-- Caches pre-calculated insights for performance

CREATE TABLE IF NOT EXISTS behavior_insights_cache (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  avg_session_duration_minutes DECIMAL(10,2) DEFAULT 0,
  most_used_tab TEXT DEFAULT 'overview',
  task_completion_rate INTEGER DEFAULT 0, -- 0-100
  common_stuck_area TEXT DEFAULT 'none',
  engagement_score INTEGER DEFAULT 0, -- 0-100
  recommendations JSONB DEFAULT '[]',
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_behavior_insights_cache_user_id ON behavior_insights_cache(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE behavior_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_insights_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
  ON behavior_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON behavior_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON behavior_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can only see their own events
CREATE POLICY "Users can view own events"
  ON behavior_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON behavior_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only see their own insights
CREATE POLICY "Users can view own insights"
  ON behavior_insights_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON behavior_insights_cache FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTION: Update behavior insights cache
-- ============================================================================
-- This function recalculates insights for a user and caches the result

CREATE OR REPLACE FUNCTION recalculate_behavior_insights(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_sessions INTEGER;
  v_avg_duration DECIMAL(10,2);
  v_most_used_tab TEXT;
  v_task_completion_rate INTEGER;
  v_common_stuck_area TEXT;
  v_engagement_score INTEGER;
  v_recommendations JSONB;
BEGIN
  -- Total sessions
  SELECT COUNT(*) INTO v_total_sessions
  FROM behavior_sessions
  WHERE user_id = p_user_id;

  -- Avg session duration (in minutes)
  SELECT COALESCE(AVG(
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  ), 0) INTO v_avg_duration
  FROM behavior_sessions
  WHERE user_id = p_user_id
    AND end_time IS NOT NULL;

  -- Most used tab
  SELECT context->>'tabName' INTO v_most_used_tab
  FROM behavior_events
  WHERE user_id = p_user_id
    AND event_type = 'tab_switch'
  GROUP BY context->>'tabName'
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Task completion rate
  SELECT COALESCE(
    ROUND(
      (COUNT(*) FILTER (WHERE event_type = 'task_complete')::DECIMAL /
       NULLIF(COUNT(*) FILTER (WHERE event_type = 'task_start'), 0)
      ) * 100
    ), 0
  ) INTO v_task_completion_rate
  FROM behavior_events
  WHERE user_id = p_user_id;

  -- Common stuck area
  SELECT context->>'stuckArea' INTO v_common_stuck_area
  FROM behavior_events
  WHERE user_id = p_user_id
    AND event_type = 'checkpoint_submit'
    AND context->>'stuckArea' IS NOT NULL
    AND context->>'stuckArea' != ''
  GROUP BY context->>'stuckArea'
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Engagement score (0-100)
  SELECT COALESCE(LEAST(100, ROUND(
    (v_task_completion_rate * 0.3) +
    (COALESCE(AGG_EVENTS.count_per_session, 0) * 5) +
    (LEAST(v_avg_duration, 30) / 30 * 30)
  )), 0) INTO v_engagement_score
  FROM (
    SELECT COUNT(*)::DECIMAL / NULLIF(v_total_sessions, 0) AS count_per_session
    FROM behavior_events
    WHERE user_id = p_user_id
    GROUP BY session_id
  ) AS AGG_EVENTS;

  -- Recommendations (basic logic)
  v_recommendations := '[]'::JSONB;
  IF v_task_completion_rate < 50 THEN
    v_recommendations := v_recommendations || '{"task_completion_low": "Task completion rate rendah. Pertimbangkan untuk simplify roadmap."}'::JSONB;
  END IF;
  IF v_avg_duration < 5 THEN
    v_recommendations := v_recommendations || '{"session_short": "Sesi sangat singkat. User mungkin stuck atau bingung."}'::JSONB;
  END IF;
  IF v_most_used_tab = 'overview' AND v_total_sessions > 3 THEN
    v_recommendations := v_recommendations || '{"stuck_overview": "User stuck di overview. Perlu guidance untuk eksekusi."}'::JSONB;
  END IF;

  -- Insert or update cache
  INSERT INTO behavior_insights_cache (
    user_id,
    total_sessions,
    avg_session_duration_minutes,
    most_used_tab,
    task_completion_rate,
    common_stuck_area,
    engagement_score,
    recommendations,
    last_calculated_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_total_sessions,
    v_avg_duration,
    COALESCE(v_most_used_tab, 'overview'),
    v_task_completion_rate,
    COALESCE(v_common_stuck_area, 'none'),
    v_engagement_score,
    v_recommendations,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    avg_session_duration_minutes = EXCLUDED.avg_session_duration_minutes,
    most_used_tab = EXCLUDED.most_used_tab,
    task_completion_rate = EXCLUDED.task_completion_rate,
    common_stuck_area = EXCLUDED.common_stuck_area,
    engagement_score = EXCLUDED.engagement_score,
    recommendations = EXCLUDED.recommendations,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-recalculate insights on new events
-- ============================================================================

-- Function to trigger insight recalculation
CREATE OR REPLACE FUNCTION trigger_behavior_insights_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate every 10 events to avoid excessive computation
  IF (
    SELECT COUNT(*) % 10 = 0
    FROM behavior_events
    WHERE user_id = NEW.user_id
  ) THEN
    PERFORM recalculate_behavior_insights(NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS behavior_events_insights_trigger ON behavior_events;
CREATE TRIGGER behavior_events_insights_trigger
  AFTER INSERT ON behavior_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_behavior_insights_update();

-- ============================================================================
-- HELPER FUNCTION: Get cached insights
-- ============================================================================

CREATE OR REPLACE FUNCTION get_behavior_insights(p_user_id UUID)
RETURNS TABLE (
  total_sessions INTEGER,
  avg_session_duration_minutes DECIMAL,
  most_used_tab TEXT,
  task_completion_rate INTEGER,
  common_stuck_area TEXT,
  engagement_score INTEGER,
  recommendations JSONB,
  last_calculated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bi.total_sessions,
    bi.avg_session_duration_minutes,
    bi.most_used_tab,
    bi.task_completion_rate,
    bi.common_stuck_area,
    bi.engagement_score,
    bi.recommendations,
    bi.last_calculated_at
  FROM behavior_insights_cache bi
  WHERE bi.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CLEANUP FUNCTION: Delete old events (optional, for maintenance)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_behavior_events(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete events older than specified days
  DELETE FROM behavior_events
  WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Delete orphaned sessions
  DELETE FROM behavior_sessions
  WHERE id IN (
    SELECT bs.id
    FROM behavior_sessions bs
    LEFT JOIN behavior_events be ON be.session_id = bs.session_id
    WHERE be.session_id IS NULL
      AND bs.end_time IS NOT NULL
      AND bs.updated_at < NOW() - (days_to_keep || ' days')::INTERVAL
  );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE behavior_sessions IS 'Tracks user sessions for behavior analysis';
COMMENT ON TABLE behavior_events IS 'Tracks individual behavior events for personalization';
COMMENT ON TABLE behavior_insights_cache IS 'Caches pre-calculated behavior insights';
COMMENT ON FUNCTION recalculate_behavior_insights(UUID) IS 'Recalculates and caches behavior insights for a user';
COMMENT ON FUNCTION get_behavior_insights(UUID) IS 'Retrieves cached behavior insights for a user';
COMMENT ON FUNCTION cleanup_old_behavior_events(INTEGER) IS 'Deletes behavior events older than specified days';
