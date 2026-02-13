-- ============================================================================
-- PHASE 18 — Market Signal Layer (Basic)
-- ============================================================================
-- Table: market_signals
-- Stores market trend data per path/niche for dynamic sub-strategy adjustment.
-- Source: Manual seed + future API integration (Google Trends, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.market_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id TEXT NOT NULL,                          -- e.g. "micro_service", "content_monetization"
    category TEXT NOT NULL,                          -- "content" | "service" | "trading" | "tools" | "product" | "freelance"
    keyword TEXT NOT NULL,                           -- trending keyword/niche
    trend_score REAL DEFAULT 0.5 NOT NULL,           -- 0.0 to 1.0 normalized score
    trend_direction TEXT DEFAULT 'stable' NOT NULL,  -- "rising" | "falling" | "stable"
    source TEXT DEFAULT 'manual' NOT NULL,           -- "manual" | "google_trends" | "x_trending" | "reddit" | "youtube"
    confidence REAL DEFAULT 0.7 NOT NULL,            -- 0.0 to 1.0 — how reliable is this signal
    is_hot BOOLEAN DEFAULT FALSE NOT NULL,           -- flag for UI "Hot" indicator
    suggestion TEXT,                                  -- optional: sub-strategy suggestion tied to this signal
    metadata JSONB DEFAULT '{}'::jsonb,               -- extra data from source
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for fast lookup by path
CREATE INDEX IF NOT EXISTS idx_market_signals_path_id ON public.market_signals(path_id);
CREATE INDEX IF NOT EXISTS idx_market_signals_is_hot ON public.market_signals(is_hot) WHERE is_hot = true;
CREATE INDEX IF NOT EXISTS idx_market_signals_trend_score ON public.market_signals(trend_score DESC);

-- RLS: Allow public read, authenticated insert/update
ALTER TABLE public.market_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_signals_public_read" ON public.market_signals
    FOR SELECT USING (true);

CREATE POLICY "market_signals_auth_write" ON public.market_signals
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- SEED: Initial market signal data for all 6 paths
-- ============================================================================

INSERT INTO public.market_signals (path_id, category, keyword, trend_score, trend_direction, source, confidence, is_hot, suggestion) VALUES
-- Micro AI Service
('micro_service', 'service', 'AI Hook Writer', 0.85, 'rising', 'manual', 0.8, true, 'Fokus ke hook optimization untuk shortform creators — demand tinggi di TikTok/Reels.'),
('micro_service', 'service', 'AI Resume Optimizer', 0.72, 'rising', 'manual', 0.75, false, 'Resume rewrite dengan AI sedang naik karena job market shifting. Target fresh graduate.'),
('micro_service', 'service', 'AI Thumbnail Design', 0.68, 'stable', 'manual', 0.7, false, 'YouTube thumbnail AI masih konsisten demand-nya.'),
('micro_service', 'service', 'AI Email Copywriting', 0.78, 'rising', 'manual', 0.8, true, 'Email marketing sedang comeback. Banyak UMKM cari AI copywriter murah.'),
('micro_service', 'service', 'AI Subtitle/Caption', 0.60, 'stable', 'manual', 0.65, false, 'Demand stabil tapi margin rendah. Cocok untuk volume.'),

-- Niche Content Monetization
('content_monetization', 'content', 'AI Tutorial Content', 0.88, 'rising', 'manual', 0.85, true, 'Tutorial AI tools paling dicari. Fokus ke specific use case, bukan review umum.'),
('content_monetization', 'content', 'Faceless YouTube Channel', 0.82, 'rising', 'manual', 0.8, true, 'Faceless content dengan AI voiceover trending. Niche: finance, motivation, tech.'),
('content_monetization', 'content', 'AI Newsletter', 0.70, 'stable', 'manual', 0.7, false, 'Newsletter AI masih growing tapi saturasi mulai terasa. Butuh angle unik.'),
('content_monetization', 'content', 'Short-form AI Content', 0.75, 'rising', 'manual', 0.75, false, 'Reels/TikTok tentang AI tips selalu perform. Volume game.'),

-- AI Freelance Upgrade
('freelance_upgrade', 'freelance', 'AI-Powered Copywriting', 0.80, 'rising', 'manual', 0.8, true, 'Freelancer yang integrate AI ke workflow-nya bisa charge 2-3x. Highlight speed + quality.'),
('freelance_upgrade', 'freelance', 'AI Data Analysis', 0.73, 'rising', 'manual', 0.7, false, 'Data analysis dengan AI tools makin dicari di Upwork. Python + AI combo.'),
('freelance_upgrade', 'freelance', 'AI Design Assistant', 0.65, 'stable', 'manual', 0.65, false, 'Midjourney/DALL-E masih niche. Demand ada tapi client belum fully trust AI design.'),

-- Arbitrage Skill
('arbitrage_skill', 'service', 'AI Translation Service', 0.77, 'rising', 'manual', 0.75, true, 'AI translation + human review = high margin arbitrage. Target e-commerce cross-border.'),
('arbitrage_skill', 'service', 'AI Content Repurposing', 0.82, 'rising', 'manual', 0.8, true, 'Ubah 1 long-form jadi 10 short-form dengan AI. Banyak creator butuh ini.'),
('arbitrage_skill', 'service', 'AI Chatbot Setup', 0.68, 'stable', 'manual', 0.7, false, 'Chatbot masih demand tapi mulai komoditas. Perlu value-add (custom personality, integration).'),

-- Digital Product Lite
('digital_product', 'product', 'AI Prompt Packs', 0.74, 'stable', 'manual', 0.7, false, 'Prompt pack market mulai saturasi. Butuh niche super spesifik untuk standout.'),
('digital_product', 'product', 'AI Workflow Templates', 0.83, 'rising', 'manual', 0.8, true, 'Notion/Airtable template + AI workflow sedang naik. Target solopreneur.'),
('digital_product', 'product', 'AI Mini Course', 0.79, 'rising', 'manual', 0.75, true, 'Mini course tentang specific AI skill (< 2 jam) perform lebih baik dari course panjang.'),

-- High Risk Speculative
('speculative', 'trading', 'AI Token Trading', 0.55, 'falling', 'manual', 0.5, false, 'AI token hype sudah menurun. High risk, timing dependent.'),
('speculative', 'trading', 'AI Tool Flipping', 0.65, 'stable', 'manual', 0.6, false, 'Beli lifetime deal AI tool lalu resell. Margin tipis tapi konsisten.'),
('speculative', 'trading', 'AI Micro-SaaS', 0.72, 'rising', 'manual', 0.7, false, 'Build micro-SaaS dengan AI — risky tapi high reward jika product-market fit.');
