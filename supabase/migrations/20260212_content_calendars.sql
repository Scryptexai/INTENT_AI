-- ============================================================================
-- Content Calendars Table — Persist weekly calendars per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL DEFAULT 1,
  week_theme TEXT NOT NULL DEFAULT '',
  week_goal TEXT,
  start_date DATE,
  calendar_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  profile_context JSONB,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_calendars_user_id ON public.content_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_content_calendars_user_week ON public.content_calendars(user_id, week_number);

-- RLS
ALTER TABLE public.content_calendars ENABLE ROW LEVEL SECURITY;

-- Users can read only their own calendars
CREATE POLICY "content_calendars_user_read" ON public.content_calendars
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own calendars
CREATE POLICY "content_calendars_user_insert" ON public.content_calendars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own calendars
CREATE POLICY "content_calendars_user_update" ON public.content_calendars
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own calendars
CREATE POLICY "content_calendars_user_delete" ON public.content_calendars
  FOR DELETE USING (auth.uid() = user_id);
