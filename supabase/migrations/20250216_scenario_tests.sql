-- Migration: Micro Scenario Test (Level 2 Profiling)
-- Created: 2025-02-16
-- Purpose: Implement Level 2 Profiling with practical skill validation
-- Based on: INTENT_DOC.txt requirement for "Micro scenario test"

-- ============================================================================
-- TABLE: scenario_templates
-- ============================================================================
-- Stores scenario test templates per economic model & sub-sector

CREATE TABLE IF NOT EXISTS scenario_templates (
  id TEXT PRIMARY KEY,
  economic_model TEXT NOT NULL,
  sub_sector TEXT NOT NULL,
  scenario TEXT NOT NULL,
  instructions JSONB NOT NULL,
  resources JSONB DEFAULT '[]',
  time_limit_minutes INTEGER NOT NULL,
  evaluation_criteria JSONB NOT NULL,
  example_answer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scenario_templates_model ON scenario_templates(economic_model);
CREATE INDEX IF NOT EXISTS idx_scenario_templates_sector ON scenario_templates(sub_sector);

-- ============================================================================
-- TABLE: scenario_submissions
-- ============================================================================
-- Stores user answers to scenario tests

CREATE TABLE IF NOT EXISTS scenario_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles_intent(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL REFERENCES scenario_templates(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  time_taken_seconds INTEGER NOT NULL,
  self_score INTEGER CHECK (self_score BETWEEN 1 AND 5),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scenario_submissions_user ON scenario_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_submissions_profile ON scenario_submissions(profile_id);
CREATE INDEX IF NOT EXISTS idx_scenario_submissions_scenario ON scenario_submissions(scenario_id);

-- ============================================================================
-- TABLE: scenario_evaluations
-- ============================================================================
-- Stores AI evaluations of scenario submissions

CREATE TABLE IF NOT EXISTS scenario_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES scenario_submissions(id) ON DELETE CASCADE,
  aspect_scores JSONB NOT NULL,
  total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  feedback JSONB NOT NULL,
  overall_feedback TEXT NOT NULL,
  level_recommendation TEXT NOT NULL CHECK (level_recommendation IN ('beginner', 'intermediate', 'advanced', 'expert')),
  skill_adjustments JSONB NOT NULL,
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scenario_evaluations_submission ON scenario_evaluations(submission_id);
CREATE INDEX IF NOT EXISTS idx_scenario_evaluations_score ON scenario_evaluations(total_score);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE scenario_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_evaluations ENABLE ROW LEVEL SECURITY;

-- Templates: Everyone can read, only service role can write
CREATE POLICY "Public can view templates"
  ON scenario_templates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can insert templates"
  ON scenario_templates FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update templates"
  ON scenario_templates FOR UPDATE
  TO service_role
  WITH CHECK (true);

-- Submissions: Users can view own, insert own
CREATE POLICY "Users can view own submissions"
  ON scenario_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON scenario_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions"
  ON scenario_submissions FOR UPDATE
  USING (auth.uid() = user_id);

-- Evaluations: Users can view own evaluations
CREATE POLICY "Users can view own evaluations"
  ON scenario_evaluations FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM scenario_submissions
      WHERE scenario_submissions.id = scenario_evaluations.submission_id
        AND scenario_submissions.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert evaluations"
  ON scenario_evaluations FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- SEED: Initial scenario templates
-- ============================================================================

-- Skill Service - Design
INSERT INTO scenario_templates (
  id, economic_model, sub_sector, scenario, instructions, resources,
  time_limit_minutes, evaluation_criteria, example_answer
) VALUES (
  'ss_design_01',
  'skill_service',
  'design',
  'Buat 3 konsep logo untuk startup ''FoodieGo'' (app delivery food local)',
  '[
    "Baca brief: FoodieGo adalah app delivery makanan lokal dengan target gen Z",
    "Target audience: 18-25 tahun, suka visual bold & colorful",
    "Buat 3 konsep logo berbeda dengan penjelasan singkat",
    "Upload hasil dalam format gambar atau tuliskan deskripsi detail"
  ]'::JSONB,
  '[
    {"type": "guide", "title": "Panduan desain logo untuk startup", "content": "Tips: Mulai dari keywords: food, speed, local, bold. Gunakan warna yang menarik untuk gen Z."},
    {"type": "tool", "title": "Canva (free tier)", "url": "https://www.canva.com"}
  ]'::JSONB,
  45,
  '[
    {
      "aspect": "Kreativitas & orisinalitas",
      "weight": 0.3,
      "rubric": {
        "poor": "Konsep generik, mirip logo lain",
        "fair": "Ada ide menarik tapi belum kuat",
        "good": "Konsep original dengan twist menarik",
        "excellent": "Sangat kreatif, unexpected dan memorable"
      }
    },
    {
      "aspect": "Relevansi dengan brand",
      "weight": 0.3,
      "rubric": {
        "poor": "Tidak sesuai dengan brief sama sekali",
        "fair": "Cukup sesuai tapi kurang mendalam",
        "good": "Sesuai dengan brief & target audience",
        "excellent": "Sangat relevan, capture brand essence dengan sempurna"
      }
    },
    {
      "aspect": "Eksekusi visual",
      "weight": 0.2,
      "rubric": {
        "poor": "Eksekusi kasar, tidak rapi",
        "fair": "Eksekusi lumayan tapi belum professional",
        "good": "Eksekusi rapi dan presentable",
        "excellent": "Eksekusi professional, siap pakai"
      }
    },
    {
      "aspect": "Presentasi & penjelasan",
      "weight": 0.2,
      "rubric": {
        "poor": "Tidak ada penjelasan atau tidak jelas",
        "fair": "Penjelasan singkat kurang detail",
        "good": "Penjelasan jelas dengan reasoning",
        "excellent": "Penjelasan sangat jelas, reasoned, dan persuasive"
      }
    }
  ]'::JSONB,
  'Contoh: 1) Logo typography bold "FG" dengan gradient orange-to-red, melambangkan energy & speed. 2) Icon mangkok stylized dengan garis speed lines, modern & playful. 3) Lettermark "foodie" dengan "go" dalam highlighted circle, simple & memorable.'
) ON CONFLICT (id) DO NOTHING;

-- Skill Service - Writing
INSERT INTO scenario_templates (
  id, economic_model, sub_sector, scenario, instructions, resources,
  time_limit_minutes, evaluation_criteria
) VALUES (
  'ss_writing_01',
  'skill_service',
  'writing',
  'Buat caption Instagram untuk brand skincare ''GlowUp'' yang akan launch produk baru',
  '[
    "Produk: Vitamin C Serum dengan harga Rp 150k",
    "Target: Wanita 20-30 tahun, concern dengan dark spot & glowing skin",
    "Buat 3 opsi caption dengan gaya berbeda (educational, emotional, promotional)",
    "Include hook, body, dan CTA"
  ]'::JSONB,
  '[
    {"type": "guide", "title": "Template caption Instagram yang convert", "content": "Hook: 3秒 grab attention. Body: Educational/storytelling. CTA: Clear & specific."}
  ]'::JSONB,
  30,
  '[
    {
      "aspect": "Hook strength",
      "weight": 0.3,
      "rubric": {
        "poor": "Hook lemah, tidak menarik perhatian",
        "fair": "Hook cukup menarik tapi generic",
        "good": "Hook kuat & relevant",
        "excellent": "Hook sangat kuat, membuat orang ingin lanjut baca"
      }
    },
    {
      "aspect": "Copywriting skill",
      "weight": 0.3,
      "rubric": {
        "poor": "Copy kaku, tidak natural",
        "fair": "Copy cukup oke tapi kurang engaging",
        "good": "Copy engaging & on-brand",
        "excellent": "Copy sangat engaging, persuasive, & memorable"
      }
    },
    {
      "aspect": "Brand voice consistency",
      "weight": 0.2,
      "rubric": {
        "poor": "Tidak ada brand voice yang jelas",
        "fair": "Brand voice kurang konsisten",
        "good": "Brand voice cukup konsisten",
        "excellent": "Brand voice sangat konsisten & unique"
      }
    },
    {
      "aspect": "CTA effectiveness",
      "weight": 0.2,
      "rubric": {
        "poor": "CTA lemah atau tidak ada",
        "fair": "CTA ada tapi kurang spesifik",
        "good": "CTA jelas & spesifik",
        "excellent": "CTA sangat compelling & actionable"
      }
    }
  ]'::JSONB
) ON CONFLICT (id) DO NOTHING;

-- Audience Based - Content
INSERT INTO scenario_templates (
  id, economic_model, sub_sector, scenario, instructions, resources,
  time_limit_minutes, evaluation_criteria
) VALUES (
  'ab_content_01',
  'audience_based',
  'content_creator',
  'Buat outline video TikTok 60 detik tentang ''5 Tips Belajar Efektif''',
  '[
    "Target: Pelajar SMA/kuliah yang ingin belajar lebih efisien",
    "Buat outline dengan: hook (3 detik), poin utama (5 tips), dan CTA",
    "Tambahkan catatan visual/audio di setiap bagian"
  ]'::JSONB,
  '[
    {"type": "guide", "title": "Struktur video TikTok yang viral", "content": "Hook: Pattern interrupt, question, atau bold statement. Body: Fast-paced info. CTA: Follow untuk tips lain."}
  ]'::JSONB,
  25,
  '[
    {
      "aspect": "Hook quality",
      "weight": 0.35,
      "rubric": {
        "poor": "Hook tidak menarik",
        "fair": "Hook cukup menarik",
        "good": "Hook kuat & stop-the-scroll",
        "excellent": "Hook sangat kuat, impossible to scroll past"
      }
    },
    {
      "aspect": "Content value",
      "weight": 0.35,
      "rubric": {
        "poor": "Tips kurang berharga",
        "fair": "Tips cukup berguna",
        "good": "Tips sangat berguna & actionable",
        "excellent": "Tips sangat valuable & belum banyak diketahui"
      }
    },
    {
      "aspect": "Production planning",
      "weight": 0.3,
      "rubric": {
        "poor": "Tidak ada planning visual/audio",
        "fair": "Planning ada tapi kurang detail",
        "good": "Planning cukup detail",
        "excellent": "Planning sangat detail & professional"
      }
    }
  ]'::JSONB
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- FUNCTION: Get user's skill level from scenario tests
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_skill_level(p_user_id UUID)
RETURNS TABLE (
  economic_model TEXT,
  sub_sector TEXT,
  avg_score DECIMAL,
  latest_level TEXT,
  test_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.economic_model,
    st.sub_sector,
    AVG(se.total_score)::DECIMAL(10,2),
    se.level_recommendation,
    COUNT(*)::INTEGER
  FROM scenario_submissions ss
  JOIN scenario_templates st ON ss.scenario_id = st.id
  JOIN scenario_evaluations se ON se.submission_id = ss.id
  WHERE ss.user_id = p_user_id
  GROUP BY st.economic_model, st.sub_sector, se.level_recommendation
  ORDER BY st.economic_model, st.sub_sector, ss.submitted_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Update profile skill level based on scenario results
-- ============================================================================

CREATE OR REPLACE FUNCTION update_profile_from_scenario(
  p_user_id UUID,
  p_profile_id UUID,
  p_scenario_id TEXT
)
RETURNS VOID AS $$
DECLARE
  v_evaluation JSONB;
  v_skill_level TEXT;
BEGIN
  -- Get latest evaluation
  SELECT se.skill_adjustments, se.level_recommendation
  INTO v_evaluation, v_skill_level
  FROM scenario_evaluations se
  JOIN scenario_submissions ss ON se.submission_id = ss.id
  WHERE ss.user_id = p_user_id
    AND ss.profile_id = p_profile_id
    AND ss.scenario_id = p_scenario_id
  ORDER BY se.evaluated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN RETURN; END IF;

  -- Update profile with validated skill level
  UPDATE user_profiles_intent
  SET
    answer_tags = COALESCE(answer_tags, '{}'::JSONB) || JSONB_BUILD_OBJECT(
      'validated_skill_level', v_skill_level
    ),
    updated_at = NOW()
  WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-update profile when scenario is evaluated
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_profile_skill_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile with validated skill level
  PERFORM update_profile_from_scenario(
    (SELECT user_id FROM scenario_submissions WHERE id = NEW.submission_id),
    (SELECT profile_id FROM scenario_submissions WHERE id = NEW.submission_id),
    (SELECT scenario_id FROM scenario_submissions WHERE id = NEW.submission_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS scenario_evaluated_profile_update ON scenario_evaluations;
CREATE TRIGGER scenario_evaluated_profile_update
  AFTER INSERT ON scenario_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_profile_skill_update();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE scenario_templates IS 'Templates for micro scenario tests per economic model & sector';
COMMENT ON TABLE scenario_submissions IS 'User answers to scenario tests';
COMMENT ON TABLE scenario_evaluations IS 'AI evaluations of scenario test answers';
COMMENT ON FUNCTION get_user_skill_level(UUID) IS 'Get user skill levels from completed scenario tests';
COMMENT ON FUNCTION update_profile_from_scenario(UUID, UUID, TEXT) IS 'Update profile with validated skill level from scenario test';
