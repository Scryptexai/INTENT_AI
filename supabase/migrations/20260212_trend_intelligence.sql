-- ============================================================================
-- TREND INTELLIGENCE ENGINE — Core Data Tables
-- ============================================================================
-- Arsitektur: Data terstruktur → Scoring deterministik → AI reasoning
-- BUKAN AI browsing data mentah. AI hanya baca skor + konteks.
-- ============================================================================

-- ────────────────────────────────────────────────────
-- 1. NICHE TAXONOMY — Tree-based, setiap node punya ID unik
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.niche_taxonomy (
  id TEXT PRIMARY KEY,                          -- e.g. "content_creator.gaming.mobile"
  parent_id TEXT REFERENCES public.niche_taxonomy(id),
  label TEXT NOT NULL,                          -- "Mobile Gaming"
  path_id TEXT NOT NULL,                        -- maps to user's economic path
  depth INTEGER NOT NULL DEFAULT 0,             -- 0=root, 1=category, 2=sub, 3=micro
  aliases TEXT[] DEFAULT '{}',                  -- search aliases ["mobile game", "game hp"]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_niche_taxonomy_parent ON public.niche_taxonomy(parent_id);
CREATE INDEX IF NOT EXISTS idx_niche_taxonomy_path ON public.niche_taxonomy(path_id);

ALTER TABLE public.niche_taxonomy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "niche_taxonomy_public_read" ON public.niche_taxonomy FOR SELECT USING (true);

-- ────────────────────────────────────────────────────
-- 2. TREND DATA POINTS — Time-series raw data (numerik only)
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trend_data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id TEXT NOT NULL REFERENCES public.niche_taxonomy(id),
  keyword TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'google',       -- google | youtube | tiktok | instagram | x
  date DATE NOT NULL,
  -- Demand signals
  search_volume INTEGER DEFAULT 0,               -- absolute (from Keyword Planner) or relative index (Google Trends 0-100)
  search_volume_source TEXT DEFAULT 'trends',    -- 'trends' = relative, 'planner' = absolute
  growth_rate_7d REAL DEFAULT 0,                 -- % change vs 7 days ago
  growth_rate_30d REAL DEFAULT 0,                -- % change vs 30 days ago
  growth_rate_90d REAL DEFAULT 0,                -- % change vs 90 days ago
  -- Monetization signals
  cpc REAL DEFAULT 0,                            -- cost per click (USD) from Ads data
  affiliate_density REAL DEFAULT 0,              -- 0-1: how many affiliate products in niche
  ads_density REAL DEFAULT 0,                    -- 0-1: how many ads running for this keyword
  -- Supply signals
  content_density INTEGER DEFAULT 0,             -- how many results/posts exist
  creator_density INTEGER DEFAULT 0,             -- how many active creators in niche
  engagement_velocity REAL DEFAULT 0,            -- avg engagement rate on content
  -- Meta
  source TEXT NOT NULL DEFAULT 'manual',         -- manual | google_trends | youtube_api | tiktok_scrape | keyword_planner
  confidence REAL DEFAULT 0.5,                   -- 0-1 how reliable this data point is
  raw_data JSONB DEFAULT '{}',                   -- store original API response snippet
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(niche_id, keyword, platform, date)      -- 1 data point per keyword per platform per day
);

CREATE INDEX IF NOT EXISTS idx_trend_data_niche ON public.trend_data_points(niche_id);
CREATE INDEX IF NOT EXISTS idx_trend_data_keyword ON public.trend_data_points(keyword);
CREATE INDEX IF NOT EXISTS idx_trend_data_date ON public.trend_data_points(date DESC);
CREATE INDEX IF NOT EXISTS idx_trend_data_platform ON public.trend_data_points(platform);

ALTER TABLE public.trend_data_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trend_data_public_read" ON public.trend_data_points FOR SELECT USING (true);
CREATE POLICY "trend_data_auth_write" ON public.trend_data_points FOR ALL USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────
-- 3. TREND SCORES — Computed deterministik scores (bukan AI)
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trend_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id TEXT NOT NULL REFERENCES public.niche_taxonomy(id),
  keyword TEXT NOT NULL,
  -- Composite scores (0-100)
  opportunity_score REAL NOT NULL DEFAULT 0,      -- final weighted score
  trend_momentum REAL NOT NULL DEFAULT 0,         -- growth velocity composite
  monetization_score REAL NOT NULL DEFAULT 0,     -- cpc + affiliate + ads composite
  supply_gap_score REAL NOT NULL DEFAULT 0,       -- demand / supply ratio
  competition_score REAL NOT NULL DEFAULT 0,      -- how saturated
  -- Lifecycle detection
  lifecycle_stage TEXT NOT NULL DEFAULT 'unknown', -- emerging | early_growth | peak | saturating | declining
  -- Risk assessment
  risk_level TEXT NOT NULL DEFAULT 'medium',      -- low | medium | high
  risk_factors TEXT[] DEFAULT '{}',               -- ["high_competition", "api_limited_data"]
  -- Breakout detection
  is_breakout BOOLEAN DEFAULT false,              -- 7d growth > 200% with sustain
  is_hot BOOLEAN DEFAULT false,                   -- top 10% by opportunity_score
  breakout_detected_at TIMESTAMPTZ,
  -- Sustainability
  sustainability_window INTEGER DEFAULT 0,        -- estimated days trend will remain relevant
  -- Meta
  data_points_count INTEGER DEFAULT 0,            -- how many raw data points contributed
  last_calculated TIMESTAMPTZ DEFAULT now(),
  calculation_version TEXT DEFAULT 'v1',           -- scoring algorithm version
  score_breakdown JSONB DEFAULT '{}',             -- detailed breakdown for transparency
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(niche_id, keyword)
);

CREATE INDEX IF NOT EXISTS idx_trend_scores_niche ON public.trend_scores(niche_id);
CREATE INDEX IF NOT EXISTS idx_trend_scores_opportunity ON public.trend_scores(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_trend_scores_hot ON public.trend_scores(is_hot) WHERE is_hot = true;
CREATE INDEX IF NOT EXISTS idx_trend_scores_breakout ON public.trend_scores(is_breakout) WHERE is_breakout = true;
CREATE INDEX IF NOT EXISTS idx_trend_scores_lifecycle ON public.trend_scores(lifecycle_stage);

ALTER TABLE public.trend_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trend_scores_public_read" ON public.trend_scores FOR SELECT USING (true);
CREATE POLICY "trend_scores_auth_write" ON public.trend_scores FOR ALL USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────
-- 4. TREND REFRESH LOG — track when data was last fetched
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trend_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,                           -- google_trends | youtube_api | etc
  niche_id TEXT,                                  -- null = global refresh
  status TEXT NOT NULL DEFAULT 'pending',         -- pending | running | completed | failed
  keywords_fetched INTEGER DEFAULT 0,
  data_points_created INTEGER DEFAULT 0,
  scores_recalculated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trend_refresh_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trend_refresh_log_public_read" ON public.trend_refresh_log FOR SELECT USING (true);
CREATE POLICY "trend_refresh_log_auth_write" ON public.trend_refresh_log FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- SEED: Niche Taxonomy (tree structure)
-- ============================================================================
INSERT INTO public.niche_taxonomy (id, parent_id, label, path_id, depth, aliases) VALUES
-- ROOT LEVEL (depth 0) — maps to user paths
('skill_service',        NULL,               'Skill & Service',      'skill_service',        0, '{"jasa", "service", "freelance"}'),
('audience_based',       NULL,               'Audience-Based',       'audience_based',       0, '{"content creator", "audience", "monetisasi konten"}'),
('digital_product',      NULL,               'Digital Product',      'digital_product',      0, '{"produk digital", "info product", "kursus"}'),
('commerce_arbitrage',   NULL,               'Commerce & Arbitrage', 'commerce_arbitrage',   0, '{"jualan", "dropship", "arbitrase"}'),
('data_research',        NULL,               'Data & Research',      'data_research',        0, '{"riset", "data", "analisis"}'),
('automation_builder',   NULL,               'Automation Builder',   'automation_builder',   0, '{"automasi", "bot", "nocode"}'),

-- LEVEL 1 (depth 1) — Sub-sectors
-- Skill & Service
('skill.copywriting',    'skill_service',    'AI Copywriting',       'skill_service',        1, '{"copywriter", "penulisan", "caption"}'),
('skill.design',         'skill_service',    'AI Design',            'skill_service',        1, '{"desain", "thumbnail", "visual"}'),
('skill.video',          'skill_service',    'Video Production',     'skill_service',        1, '{"video", "editing", "motion"}'),
('skill.data_analysis',  'skill_service',    'Data Analysis',        'skill_service',        1, '{"data analyst", "spreadsheet", "dashboard"}'),
('skill.translation',    'skill_service',    'AI Translation',       'skill_service',        1, '{"terjemahan", "localization"}'),

-- Audience-Based
('audience.finance',     'audience_based',   'Personal Finance',     'audience_based',       1, '{"keuangan", "investasi", "uang"}'),
('audience.health',      'audience_based',   'Health & Fitness',     'audience_based',       1, '{"kesehatan", "fitness", "diet"}'),
('audience.tech',        'audience_based',   'Tech & AI',            'audience_based',       1, '{"teknologi", "AI", "software"}'),
('audience.gaming',      'audience_based',   'Gaming',               'audience_based',       1, '{"game", "esports", "mobile game"}'),
('audience.education',   'audience_based',   'Education',            'audience_based',       1, '{"pendidikan", "belajar", "tutorial"}'),
('audience.parenting',   'audience_based',   'Parenting',            'audience_based',       1, '{"parenting", "anak", "keluarga"}'),
('audience.business',    'audience_based',   'Business & Startup',   'audience_based',       1, '{"bisnis", "startup", "entrepreneurship"}'),

-- Digital Product
('product.course',       'digital_product',  'Online Course',        'digital_product',      1, '{"kursus online", "e-learning", "udemy"}'),
('product.template',     'digital_product',  'Templates & Tools',    'digital_product',      1, '{"template", "notion", "figma"}'),
('product.ebook',        'digital_product',  'E-book & Guide',       'digital_product',      1, '{"ebook", "panduan", "whitepaper"}'),
('product.prompt_pack',  'digital_product',  'AI Prompt Packs',      'digital_product',      1, '{"prompt", "ChatGPT", "Midjourney"}'),

-- Commerce & Arbitrage
('commerce.dropship',    'commerce_arbitrage', 'Dropshipping',       'commerce_arbitrage',   1, '{"dropship", "supplier", "reseller"}'),
('commerce.print_on_demand', 'commerce_arbitrage', 'Print on Demand', 'commerce_arbitrage',  1, '{"POD", "kaos", "merchandise"}'),
('commerce.digital_resell', 'commerce_arbitrage', 'Digital Reselling', 'commerce_arbitrage', 1, '{"resell", "lifetime deal", "license"}'),

-- LEVEL 2 (depth 2) — Micro-niches
('audience.finance.milenial',    'audience.finance',   'Finance untuk Milenial',   'audience_based', 2, '{"milenial finance", "investasi muda"}'),
('audience.finance.umkm',        'audience.finance',   'Finance UMKM',             'audience_based', 2, '{"keuangan UMKM", "akuntansi usaha"}'),
('audience.finance.crypto',      'audience.finance',   'Crypto & DeFi',            'audience_based', 2, '{"cryptocurrency", "bitcoin", "defi"}'),
('audience.tech.ai_tools',       'audience.tech',      'AI Tools Review',          'audience_based', 2, '{"AI tools", "ChatGPT", "review AI"}'),
('audience.tech.programming',    'audience.tech',      'Programming Tutorial',     'audience_based', 2, '{"coding", "programming", "web dev"}'),
('audience.gaming.mobile',       'audience.gaming',    'Mobile Gaming',            'audience_based', 2, '{"game HP", "mobile legends", "PUBG"}'),
('audience.health.workout',      'audience.health',    'Workout & Gym',            'audience_based', 2, '{"gym", "workout", "bodybuilding"}'),
('audience.health.nutrition',    'audience.health',    'Nutrition & Diet',         'audience_based', 2, '{"diet", "nutrisi", "meal prep"}'),
('skill.copywriting.email',      'skill.copywriting',  'Email Copywriting',        'skill_service',  2, '{"email marketing", "newsletter"}'),
('skill.copywriting.ads',        'skill.copywriting',  'Ads Copywriting',          'skill_service',  2, '{"iklan", "Facebook ads", "Google ads"}'),
('skill.copywriting.social',     'skill.copywriting',  'Social Media Copy',        'skill_service',  2, '{"caption", "hook", "social copy"}'),
('product.template.notion',      'product.template',   'Notion Templates',         'digital_product', 2, '{"notion template", "productivity"}'),
('product.template.canva',       'product.template',   'Canva Templates',          'digital_product', 2, '{"canva", "design template"}')

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED: Sample trend_data_points (simulating real data snapshots)
-- ============================================================================
INSERT INTO public.trend_data_points (niche_id, keyword, platform, date, search_volume, growth_rate_7d, growth_rate_30d, growth_rate_90d, cpc, affiliate_density, ads_density, content_density, creator_density, engagement_velocity, source, confidence) VALUES
-- Finance untuk Milenial (user's niche in test context)
('audience.finance.milenial', 'investasi untuk pemula',    'google',    '2026-02-12', 74, 12.5, 28.3, 45.0, 1.20, 0.65, 0.55, 8500, 320, 4.2, 'google_trends', 0.85),
('audience.finance.milenial', 'reksadana milenial',        'google',    '2026-02-12', 58, 18.0, 35.0, 62.0, 0.95, 0.50, 0.40, 3200, 95,  5.1, 'google_trends', 0.80),
('audience.finance.milenial', 'cara mengatur keuangan',    'google',    '2026-02-12', 82, 5.2,  12.0, 18.0, 0.85, 0.70, 0.60, 12000, 450, 3.8, 'google_trends', 0.90),
('audience.finance.milenial', 'financial freedom milenial','google',    '2026-02-12', 45, 25.0, 48.0, 85.0, 1.50, 0.45, 0.35, 2100, 78,  6.3, 'google_trends', 0.75),
('audience.finance.milenial', 'side hustle 2026',          'google',    '2026-02-12', 63, 32.0, 55.0, 120.0, 1.80, 0.60, 0.50, 4500, 210, 5.8, 'google_trends', 0.80),
('audience.finance.milenial', 'budgeting app terbaik',     'google',    '2026-02-12', 51, 8.0,  15.0, 22.0, 2.10, 0.80, 0.70, 6800, 180, 3.5, 'google_trends', 0.85),
-- TikTok signals
('audience.finance.milenial', 'tips keuangan',             'tiktok',    '2026-02-12', 89, 15.0, 30.0, 50.0, 0.0,  0.30, 0.20, 25000, 800, 7.2, 'tiktok_scrape', 0.70),
('audience.finance.milenial', 'investasi saham pemula',    'tiktok',    '2026-02-12', 72, 22.0, 42.0, 68.0, 0.0,  0.25, 0.15, 18000, 520, 6.5, 'tiktok_scrape', 0.70),
-- YouTube signals
('audience.finance.milenial', 'investasi untuk pemula',    'youtube',   '2026-02-12', 65, 10.0, 20.0, 35.0, 0.0,  0.55, 0.45, 9500, 280, 4.8, 'youtube_api', 0.80),
('audience.finance.milenial', 'passive income 2026',       'youtube',   '2026-02-12', 78, 28.0, 52.0, 95.0, 0.0,  0.50, 0.40, 5200, 150, 5.5, 'youtube_api', 0.80),

-- AI Tools niche
('audience.tech.ai_tools', 'ChatGPT tips',                 'google',    '2026-02-12', 88, 8.0,  15.0, 25.0, 2.50, 0.75, 0.65, 35000, 1200, 4.0, 'google_trends', 0.90),
('audience.tech.ai_tools', 'AI automation tools',           'google',    '2026-02-12', 72, 35.0, 65.0, 150.0, 3.20, 0.60, 0.55, 8000, 350, 5.2, 'google_trends', 0.85),
('audience.tech.ai_tools', 'Claude AI vs ChatGPT',          'google',    '2026-02-12', 55, 45.0, 80.0, 200.0, 1.80, 0.40, 0.30, 3500, 120, 6.8, 'google_trends', 0.80),

-- Email Copywriting niche
('skill.copywriting.email', 'AI email marketing',           'google',    '2026-02-12', 62, 20.0, 38.0, 70.0, 2.80, 0.70, 0.60, 5500, 200, 4.5, 'google_trends', 0.85),
('skill.copywriting.email', 'cold email AI',                'google',    '2026-02-12', 48, 30.0, 55.0, 110.0, 3.50, 0.55, 0.50, 2800, 90,  5.8, 'google_trends', 0.80),

-- Notion Templates niche
('product.template.notion', 'notion template gratis',       'google',    '2026-02-12', 70, 5.0,  10.0, 15.0, 0.60, 0.85, 0.40, 15000, 600, 3.2, 'google_trends', 0.85),
('product.template.notion', 'notion AI workspace',          'google',    '2026-02-12', 42, 40.0, 75.0, 180.0, 1.20, 0.50, 0.35, 2000, 80,  7.0, 'google_trends', 0.75)

ON CONFLICT (niche_id, keyword, platform, date) DO NOTHING;
