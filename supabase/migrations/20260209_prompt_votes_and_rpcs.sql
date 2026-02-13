-- Migration: Add prompt_votes table, toggle_upvote RPC, and increment_view RPC
-- Sprint: Feb 9, 2026

-- ============================================================
-- 1. prompt_votes table (prevents double-voting)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prompt_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, prompt_id)
);

-- Enable RLS
ALTER TABLE public.prompt_votes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own votes"
ON public.prompt_votes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own votes"
ON public.prompt_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
ON public.prompt_votes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_prompt_votes_user_prompt ON public.prompt_votes (user_id, prompt_id);
CREATE INDEX idx_prompt_votes_prompt ON public.prompt_votes (prompt_id);

-- ============================================================
-- 2. RPC: toggle_upvote (atomic insert/delete + update count)
-- ============================================================
CREATE OR REPLACE FUNCTION public.toggle_upvote(p_prompt_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
  v_new_count INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Check if vote already exists
  SELECT EXISTS (
    SELECT 1 FROM public.prompt_votes
    WHERE user_id = v_user_id AND prompt_id = p_prompt_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove vote
    DELETE FROM public.prompt_votes
    WHERE user_id = v_user_id AND prompt_id = p_prompt_id;

    -- Decrement upvotes (floor at 0)
    UPDATE public.prompts
    SET upvotes = GREATEST(upvotes - 1, 0)
    WHERE id = p_prompt_id
    RETURNING upvotes INTO v_new_count;

    RETURN json_build_object('upvoted', false, 'upvotes', v_new_count);
  ELSE
    -- Add vote
    INSERT INTO public.prompt_votes (user_id, prompt_id)
    VALUES (v_user_id, p_prompt_id);

    -- Increment upvotes
    UPDATE public.prompts
    SET upvotes = upvotes + 1
    WHERE id = p_prompt_id
    RETURNING upvotes INTO v_new_count;

    RETURN json_build_object('upvoted', true, 'upvotes', v_new_count);
  END IF;
END;
$$;

-- ============================================================
-- 3. RPC: increment_view (fire-and-forget view tracking)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_view(p_prompt_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.prompts
  SET views = views + 1
  WHERE id = p_prompt_id;
END;
$$;

-- ============================================================
-- 4. RPC: increment_copy (accurate copy tracking)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_copy(p_prompt_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.prompts
  SET copies = copies + 1
  WHERE id = p_prompt_id;
END;
$$;

-- ============================================================
-- 5. RPC: check_user_vote (check if current user voted)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_user_vote(p_prompt_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.prompt_votes
    WHERE user_id = v_user_id AND prompt_id = p_prompt_id
  );
END;
$$;
