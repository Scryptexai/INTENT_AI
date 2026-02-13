/**
 * Trend Intelligence Engine — Deterministic Scoring
 * ======================================================
 * Layer kritis platform Intent: SEMUA skor dihitung deterministik.
 * AI TIDAK menghitung skor. AI hanya MEMBACA hasil skor.
 *
 * Formula (dari DATA_TREND_INTEL.md):
 *   opportunity_score = (trend_momentum × 0.35) 
 *                     + (monetization_score × 0.30) 
 *                     + (supply_gap_score × 0.25)
 *                     - (competition_score × 0.10)
 *
 * Lifecycle Detection:
 *   Phase 1: Social spike (TikTok/IG engagement ↑ > 50%, search masih rendah)
 *   Phase 2: Search increase (Google Trends ↑ > 20%, CPC mulai naik)        ← SWEET SPOT
 *   Phase 3: Affiliate flood (CPC tinggi, banyak affiliate content)
 *   Phase 4: Market saturation (content density tinggi, engagement ↓)
 *   Phase 5: Margin collapse (CPC ↓, engagement ↓, supply >> demand)
 *
 * Data source: Supabase `trend_data_points` table
 * Output: Supabase `trend_scores` table
 */

import { supabase } from "@/integrations/supabase/client";
import { resolveUserNiche, type NicheResolverResult } from "./nicheTaxonomy";

// ============================================================================
// TYPES — semua numerik, transparan, bisa diaudit
// ============================================================================

export interface TrendDataPoint {
  id: string;
  niche_id: string;
  keyword: string;
  platform: string;
  date: string;
  search_volume: number;
  search_volume_source: string;
  growth_rate_7d: number;
  growth_rate_30d: number;
  growth_rate_90d: number;
  cpc: number;
  affiliate_density: number;
  ads_density: number;
  content_density: number;
  creator_density: number;
  engagement_velocity: number;
  source: string;
  confidence: number;
  raw_data?: Record<string, unknown>;
}

export interface TrendScore {
  id?: string;
  niche_id: string;
  keyword: string;
  // Composite scores (0-100)
  opportunity_score: number;
  trend_momentum: number;
  monetization_score: number;
  supply_gap_score: number;
  competition_score: number;
  // Lifecycle
  lifecycle_stage: LifecycleStage;
  // Risk
  risk_level: RiskLevel;
  risk_factors: string[];
  // Detection
  is_breakout: boolean;
  is_hot: boolean;
  breakout_detected_at?: string;
  sustainability_window: number; // days
  // Meta
  data_points_count: number;
  last_calculated: string;
  calculation_version: string;
  score_breakdown: ScoreBreakdown;
}

export type LifecycleStage = 
  | "emerging"        // Phase 1: Social spike, search rendah
  | "early_growth"    // Phase 2: Search naik, sweet spot ← TARGET
  | "peak"            // Phase 3: Semua tinggi, affiliate masuk
  | "saturating"      // Phase 4: Content density tinggi, engagement turun
  | "declining";      // Phase 5: Semua turun

export type RiskLevel = "low" | "medium" | "high";

export interface ScoreBreakdown {
  momentum: {
    growth_7d_raw: number;
    growth_30d_raw: number;
    growth_90d_raw: number;
    search_volume_weight: number;
    final: number;
  };
  monetization: {
    cpc_raw: number;
    affiliate_density_raw: number;
    ads_density_raw: number;
    final: number;
  };
  supply_gap: {
    demand_signal: number;
    content_density_raw: number;
    creator_density_raw: number;
    ratio: number;
    final: number;
  };
  competition: {
    content_per_creator: number;
    engagement_velocity_raw: number;
    final: number;
  };
  weights: {
    momentum: 0.35;
    monetization: 0.30;
    supply_gap: 0.25;
    competition: 0.10;
  };
}

export interface TrendInsight {
  nicheId: string;
  nicheLabel: string;
  scores: TrendScore[];
  topOpportunity: TrendScore | null;
  avgOpportunityScore: number;
  hotKeywords: string[];
  breakoutKeywords: string[];
  lifecycleSummary: Record<LifecycleStage, number>;
  lastRefreshed: string;
  dataPointsTotal: number;
}

// For AI interpretation
export interface AIReadableTrendBrief {
  nicheId: string;
  nicheLabel: string;
  generatedAt: string;
  dataPointsUsed: number;
  topKeywords: Array<{
    keyword: string;
    opportunity_score: number;
    lifecycle: string;
    trend_momentum: number;
    monetization: number;
    supply_gap: number;
    competition: number;
    risk: string;
    sustainability_days: number;
  }>;
  marketSummary: {
    avgOpportunity: number;
    hotCount: number;
    breakoutCount: number;
    dominantLifecycle: string;
    overallRisk: string;
  };
}

// ============================================================================
// SCORING CONSTANTS
// ============================================================================

const SCORING_VERSION = "v1.0";

// Normalization bounds
const MAX_GROWTH_7D = 100;   // % — anything above = capped at 100
const MAX_GROWTH_30D = 200;
const MAX_CPC = 5.0;         // USD
const MAX_CONTENT_DENSITY = 50000;
const MAX_CREATOR_DENSITY = 2000;
const MAX_ENGAGEMENT = 10.0; // % engagement rate

// Weights
const W_MOMENTUM = 0.35;
const W_MONETIZATION = 0.30;
const W_SUPPLY_GAP = 0.25;
const W_COMPETITION = 0.10;

// Breakout thresholds
const BREAKOUT_GROWTH_7D = 200; // % — 7d growth above this = breakout
const HOT_PERCENTILE = 0.80;    // top 20% = hot

// ============================================================================
// CORE SCORING FUNCTIONS — Deterministic, no AI
// ============================================================================

/** Clamp value between 0 and max, then normalize to 0-100 */
function normalize(value: number, max: number): number {
  return Math.min(100, Math.max(0, (Math.abs(value) / max) * 100));
}

/** Calculate trend momentum score (0-100) */
function calcMomentum(point: TrendDataPoint): { score: number; breakdown: ScoreBreakdown["momentum"] } {
  // Weight recent growth more heavily
  const g7d = normalize(point.growth_rate_7d, MAX_GROWTH_7D);
  const g30d = normalize(point.growth_rate_30d, MAX_GROWTH_30D);
  const g90d = normalize(point.growth_rate_90d, 300);
  
  // Search volume bonus (higher volume = more reliable signal)
  const volumeWeight = Math.min(1.0, point.search_volume / 80); // 80+ search interest = full weight
  
  // Weighted: 50% 7d, 30% 30d, 20% 90d — recent matters more
  const raw = (g7d * 0.50) + (g30d * 0.30) + (g90d * 0.20);
  const final = Math.round(raw * (0.5 + 0.5 * volumeWeight)); // volume modulates

  return {
    score: final,
    breakdown: {
      growth_7d_raw: point.growth_rate_7d,
      growth_30d_raw: point.growth_rate_30d,
      growth_90d_raw: point.growth_rate_90d,
      search_volume_weight: volumeWeight,
      final,
    },
  };
}

/** Calculate monetization score (0-100) */
function calcMonetization(point: TrendDataPoint): { score: number; breakdown: ScoreBreakdown["monetization"] } {
  const cpcScore = normalize(point.cpc, MAX_CPC);
  const affiliateScore = point.affiliate_density * 100; // already 0-1
  const adsScore = point.ads_density * 100;

  // CPC is strongest signal (40%), affiliate (35%), ads (25%)
  const final = Math.round((cpcScore * 0.40) + (affiliateScore * 0.35) + (adsScore * 0.25));

  return {
    score: final,
    breakdown: {
      cpc_raw: point.cpc,
      affiliate_density_raw: point.affiliate_density,
      ads_density_raw: point.ads_density,
      final,
    },
  };
}

/** Calculate supply gap score (0-100) — high = gap exists = opportunity */
function calcSupplyGap(point: TrendDataPoint): { score: number; breakdown: ScoreBreakdown["supply_gap"] } {
  const demandSignal = point.search_volume; // relative demand
  const contentDensity = normalize(point.content_density, MAX_CONTENT_DENSITY);
  const creatorDensity = normalize(point.creator_density, MAX_CREATOR_DENSITY);

  // Supply = average of content + creator density
  const supply = (contentDensity + creatorDensity) / 2;

  // Gap = demand relative to supply (higher = more gap = more opportunity)
  // If demand is high but supply is low → high score
  const demandNorm = normalize(demandSignal, 100);
  const ratio = supply > 0 ? demandNorm / (supply * 0.01 + 1) : demandNorm;
  const final = Math.round(Math.min(100, ratio * 1.5));

  return {
    score: final,
    breakdown: {
      demand_signal: demandSignal,
      content_density_raw: point.content_density,
      creator_density_raw: point.creator_density,
      ratio: Math.round(ratio * 100) / 100,
      final,
    },
  };
}

/** Calculate competition score (0-100) — high = saturated = BAD */
function calcCompetition(point: TrendDataPoint): { score: number; breakdown: ScoreBreakdown["competition"] } {
  const contentPerCreator = point.creator_density > 0
    ? point.content_density / point.creator_density
    : point.content_density;
  
  // High content per creator = established competition
  const cpCreatorScore = normalize(contentPerCreator, 100);
  
  // Low engagement = saturated market (inverse)
  const engagementInverse = point.engagement_velocity > 0
    ? 100 - normalize(point.engagement_velocity, MAX_ENGAGEMENT)
    : 50;

  const final = Math.round((cpCreatorScore * 0.60) + (engagementInverse * 0.40));

  return {
    score: final,
    breakdown: {
      content_per_creator: Math.round(contentPerCreator * 100) / 100,
      engagement_velocity_raw: point.engagement_velocity,
      final,
    },
  };
}

/** Detect lifecycle stage based on data signals */
function detectLifecycle(point: TrendDataPoint, momentum: number, monetization: number, competition: number): LifecycleStage {
  const g7d = point.growth_rate_7d;
  const g30d = point.growth_rate_30d;
  const engVel = point.engagement_velocity;
  const contentDens = point.content_density;
  const cpc = point.cpc;

  // Phase 1: Emerging — high social engagement, low search, low monetization
  if (engVel > 5 && point.search_volume < 40 && monetization < 30) {
    return "emerging";
  }

  // Phase 5: Declining — negative growth, low engagement
  if (g7d < -10 && g30d < -15 && engVel < 2) {
    return "declining";
  }

  // Phase 4: Saturating — high content density, engagement dropping
  if (contentDens > 15000 && competition > 60 && g7d < 5) {
    return "saturating";
  }

  // Phase 3: Peak — high everything, affiliate flooding in
  if (monetization > 50 && momentum > 40 && point.affiliate_density > 0.5) {
    return "peak";
  }

  // Phase 2: Early growth — sweet spot ← TARGET
  if (g7d > 10 || g30d > 20) {
    return "early_growth";
  }

  // Default
  if (momentum > 30) return "early_growth";
  return "emerging";
}

/** Detect risk level */
function detectRisk(point: TrendDataPoint, lifecycle: LifecycleStage, competition: number): { level: RiskLevel; factors: string[] } {
  const factors: string[] = [];
  let riskScore = 0;

  // Data confidence risk
  if (point.confidence < 0.5) {
    factors.push("data_limited");
    riskScore += 20;
  }

  // Competition risk
  if (competition > 70) {
    factors.push("high_competition");
    riskScore += 25;
  }

  // Lifecycle risk
  if (lifecycle === "saturating") {
    factors.push("market_saturating");
    riskScore += 30;
  } else if (lifecycle === "declining") {
    factors.push("market_declining");
    riskScore += 40;
  }

  // Volatile growth risk (very high 7d but low 30d = spike)
  if (point.growth_rate_7d > 80 && point.growth_rate_30d < 20) {
    factors.push("volatile_spike");
    riskScore += 15;
  }

  // Low monetization risk
  if (point.cpc < 0.3 && point.affiliate_density < 0.2) {
    factors.push("low_monetization_signal");
    riskScore += 10;
  }

  const level: RiskLevel = riskScore >= 40 ? "high" : riskScore >= 20 ? "medium" : "low";
  return { level, factors };
}

/** Estimate sustainability window (days) */
function estimateSustainability(lifecycle: LifecycleStage, momentum: number, competition: number): number {
  const baseWindows: Record<LifecycleStage, number> = {
    emerging: 90,
    early_growth: 60,
    peak: 30,
    saturating: 14,
    declining: 7,
  };

  let window = baseWindows[lifecycle];
  
  // High momentum extends window
  if (momentum > 60) window += 15;
  
  // High competition shortens window
  if (competition > 50) window -= 10;

  return Math.max(7, window);
}

// ============================================================================
// MAIN SCORING PIPELINE
// ============================================================================

/** Score a single data point → TrendScore */
export function scoreSinglePoint(point: TrendDataPoint): TrendScore {
  const momentum = calcMomentum(point);
  const monetization = calcMonetization(point);
  const supplyGap = calcSupplyGap(point);
  const competition = calcCompetition(point);

  // Master formula
  const opportunityScore = Math.round(
    (momentum.score * W_MOMENTUM) +
    (monetization.score * W_MONETIZATION) +
    (supplyGap.score * W_SUPPLY_GAP) -
    (competition.score * W_COMPETITION)
  );

  const lifecycle = detectLifecycle(point, momentum.score, monetization.score, competition.score);
  const risk = detectRisk(point, lifecycle, competition.score);
  const sustainability = estimateSustainability(lifecycle, momentum.score, competition.score);
  const isBreakout = point.growth_rate_7d > BREAKOUT_GROWTH_7D;

  return {
    niche_id: point.niche_id,
    keyword: point.keyword,
    opportunity_score: Math.max(0, Math.min(100, opportunityScore)),
    trend_momentum: momentum.score,
    monetization_score: monetization.score,
    supply_gap_score: supplyGap.score,
    competition_score: competition.score,
    lifecycle_stage: lifecycle,
    risk_level: risk.level,
    risk_factors: risk.factors,
    is_breakout: isBreakout,
    is_hot: false, // set after all scores computed
    breakout_detected_at: isBreakout ? new Date().toISOString() : undefined,
    sustainability_window: sustainability,
    data_points_count: 1,
    last_calculated: new Date().toISOString(),
    calculation_version: SCORING_VERSION,
    score_breakdown: {
      momentum: momentum.breakdown,
      monetization: monetization.breakdown,
      supply_gap: supplyGap.breakdown,
      competition: competition.breakdown,
      weights: { momentum: 0.35, monetization: 0.30, supply_gap: 0.25, competition: 0.10 },
    },
  };
}

/** 
 * Aggregate scores for same keyword across platforms
 * (e.g., combine Google + YouTube + TikTok data for "investasi pemula")
 */
export function aggregateScores(scores: TrendScore[]): TrendScore {
  if (scores.length === 0) throw new Error("Cannot aggregate empty scores");
  if (scores.length === 1) return scores[0];

  const total = scores.length;
  const avgOpp = scores.reduce((s, sc) => s + sc.opportunity_score, 0) / total;
  const avgMom = scores.reduce((s, sc) => s + sc.trend_momentum, 0) / total;
  const avgMon = scores.reduce((s, sc) => s + sc.monetization_score, 0) / total;
  const avgGap = scores.reduce((s, sc) => s + sc.supply_gap_score, 0) / total;
  const avgComp = scores.reduce((s, sc) => s + sc.competition_score, 0) / total;

  // Pick the most prevalent lifecycle
  const lifecycleCounts: Record<string, number> = {};
  for (const s of scores) {
    lifecycleCounts[s.lifecycle_stage] = (lifecycleCounts[s.lifecycle_stage] || 0) + 1;
  }
  const dominantLifecycle = Object.entries(lifecycleCounts)
    .sort((a, b) => b[1] - a[1])[0][0] as LifecycleStage;

  // Aggregate risk
  const allFactors = [...new Set(scores.flatMap((s) => s.risk_factors))];
  const maxRisk = scores.some((s) => s.risk_level === "high") ? "high"
    : scores.some((s) => s.risk_level === "medium") ? "medium" : "low";

  const isBreakout = scores.some((s) => s.is_breakout);
  const maxSustainability = Math.max(...scores.map((s) => s.sustainability_window));

  return {
    niche_id: scores[0].niche_id,
    keyword: scores[0].keyword,
    opportunity_score: Math.round(avgOpp),
    trend_momentum: Math.round(avgMom),
    monetization_score: Math.round(avgMon),
    supply_gap_score: Math.round(avgGap),
    competition_score: Math.round(avgComp),
    lifecycle_stage: dominantLifecycle,
    risk_level: maxRisk as RiskLevel,
    risk_factors: allFactors,
    is_breakout: isBreakout,
    is_hot: false,
    breakout_detected_at: isBreakout ? new Date().toISOString() : undefined,
    sustainability_window: maxSustainability,
    data_points_count: total,
    last_calculated: new Date().toISOString(),
    calculation_version: SCORING_VERSION,
    score_breakdown: scores[0].score_breakdown, // use first as representative
  };
}

/** Mark top N% of scores as "hot" */
export function markHotScores(scores: TrendScore[], percentile = HOT_PERCENTILE): TrendScore[] {
  if (scores.length === 0) return scores;
  
  const sorted = [...scores].sort((a, b) => b.opportunity_score - a.opportunity_score);
  const cutoffIdx = Math.floor(sorted.length * (1 - percentile));
  const cutoffScore = sorted[cutoffIdx]?.opportunity_score || 0;

  return scores.map((s) => ({
    ...s,
    is_hot: s.opportunity_score >= cutoffScore,
  }));
}

// ============================================================================
// SUPABASE DATA ACCESS
// ============================================================================

/** Load raw data points for a niche from Supabase */
export async function loadDataPoints(nicheId: string): Promise<TrendDataPoint[]> {
  const { data, error } = await supabase
    .from("trend_data_points" as any)
    .select("*")
    .eq("niche_id", nicheId)
    .order("date", { ascending: false });

  if (error) {
    console.error(`[TrendEngine] Failed to load data points for ${nicheId}:`, error);
    return [];
  }

  return (data || []) as unknown as TrendDataPoint[];
}

/** Load data points for multiple niches */
export async function loadDataPointsForNiches(nicheIds: string[]): Promise<TrendDataPoint[]> {
  const { data, error } = await supabase
    .from("trend_data_points" as any)
    .select("*")
    .in("niche_id", nicheIds)
    .order("date", { ascending: false });

  if (error) {
    console.error(`[TrendEngine] Failed to load data points:`, error);
    return [];
  }

  return (data || []) as unknown as TrendDataPoint[];
}

/** Load existing trend scores from Supabase */
export async function loadTrendScores(nicheId: string): Promise<TrendScore[]> {
  const { data, error } = await supabase
    .from("trend_scores" as any)
    .select("*")
    .eq("niche_id", nicheId)
    .order("opportunity_score", { ascending: false });

  if (error) {
    console.error(`[TrendEngine] Failed to load trend scores for ${nicheId}:`, error);
    return [];
  }

  return (data || []) as unknown as TrendScore[];
}

/** Save computed trend scores to Supabase */
export async function saveTrendScores(scores: TrendScore[]): Promise<void> {
  if (scores.length === 0) return;

  const rows = scores.map((s) => ({
    niche_id: s.niche_id,
    keyword: s.keyword,
    opportunity_score: s.opportunity_score,
    trend_momentum: s.trend_momentum,
    monetization_score: s.monetization_score,
    supply_gap_score: s.supply_gap_score,
    competition_score: s.competition_score,
    lifecycle_stage: s.lifecycle_stage,
    risk_level: s.risk_level,
    risk_factors: s.risk_factors,
    is_breakout: s.is_breakout,
    is_hot: s.is_hot,
    breakout_detected_at: s.breakout_detected_at || null,
    sustainability_window: s.sustainability_window,
    data_points_count: s.data_points_count,
    last_calculated: s.last_calculated,
    calculation_version: s.calculation_version,
    score_breakdown: s.score_breakdown,
  }));

  const { error } = await supabase
    .from("trend_scores" as any)
    .upsert(rows as any, { onConflict: "niche_id,keyword" });

  if (error) {
    console.error(`[TrendEngine] Failed to save trend scores:`, error);
  }
}

// ============================================================================
// HIGH-LEVEL API — Used by UI and other services
// ============================================================================

/**
 * Full pipeline: Load data → Score → Aggregate → Mark hot → Save → Return
 * This is the main entry point for the Trend Intelligence Engine.
 */
export async function computeTrendInsight(
  pathId: string,
  interestMarket?: string,
  subSector?: string,
): Promise<TrendInsight> {
  // 1. Resolve user profile to niche
  const niche = resolveUserNiche(pathId, interestMarket, subSector);
  
  // 2. Get all niche IDs in the subtree
  const nicheIds = [niche.nicheId];
  // Also try parent
  const parts = niche.nicheId.split(".");
  for (let i = 1; i < parts.length; i++) {
    nicheIds.push(parts.slice(0, i).join("."));
  }
  // Deduplicate
  const uniqueNicheIds = [...new Set(nicheIds)];

  // 3. Load data points
  const dataPoints = await loadDataPointsForNiches(uniqueNicheIds);
  
  if (dataPoints.length === 0) {
    // Try loading pre-computed scores
    const existingScores = await loadTrendScores(niche.nicheId);
    if (existingScores.length > 0) {
      return buildInsightFromScores(niche, existingScores, 0);
    }
    
    return {
      nicheId: niche.nicheId,
      nicheLabel: niche.label,
      scores: [],
      topOpportunity: null,
      avgOpportunityScore: 0,
      hotKeywords: [],
      breakoutKeywords: [],
      lifecycleSummary: { emerging: 0, early_growth: 0, peak: 0, saturating: 0, declining: 0 },
      lastRefreshed: new Date().toISOString(),
      dataPointsTotal: 0,
    };
  }

  // 4. Score each data point
  const rawScores = dataPoints.map(scoreSinglePoint);

  // 5. Aggregate per keyword (combine cross-platform data)
  const byKeyword: Record<string, TrendScore[]> = {};
  for (const score of rawScores) {
    if (!byKeyword[score.keyword]) byKeyword[score.keyword] = [];
    byKeyword[score.keyword].push(score);
  }
  const aggregated = Object.values(byKeyword).map(aggregateScores);

  // 6. Mark hot
  const finalScores = markHotScores(aggregated);

  // 7. Save to Supabase
  try {
    await saveTrendScores(finalScores);
  } catch (e) {
    console.warn("[TrendEngine] Failed to persist scores:", e);
  }

  // 8. Build insight
  return buildInsightFromScores(niche, finalScores, dataPoints.length);
}

function buildInsightFromScores(
  niche: NicheResolverResult,
  scores: TrendScore[],
  dataPointsTotal: number,
): TrendInsight {
  const sorted = [...scores].sort((a, b) => b.opportunity_score - a.opportunity_score);
  const topOpp = sorted[0] || null;
  const avgOpp = scores.length > 0
    ? Math.round(scores.reduce((s, sc) => s + sc.opportunity_score, 0) / scores.length)
    : 0;

  const hotKeywords = scores.filter((s) => s.is_hot).map((s) => s.keyword);
  const breakoutKeywords = scores.filter((s) => s.is_breakout).map((s) => s.keyword);

  const lifecycleSummary: Record<LifecycleStage, number> = {
    emerging: 0, early_growth: 0, peak: 0, saturating: 0, declining: 0,
  };
  for (const s of scores) {
    lifecycleSummary[s.lifecycle_stage]++;
  }

  return {
    nicheId: niche.nicheId,
    nicheLabel: niche.label,
    scores: sorted,
    topOpportunity: topOpp,
    avgOpportunityScore: avgOpp,
    hotKeywords,
    breakoutKeywords,
    lifecycleSummary,
    lastRefreshed: scores[0]?.last_calculated || new Date().toISOString(),
    dataPointsTotal,
  };
}

// ============================================================================
// AI-READABLE BRIEF — What AI receives (scores, not raw data)
// ============================================================================

/**
 * Generate a brief that AI can read to make recommendations.
 * AI receives SCORES and FACTS, not raw data.
 * "AI jadi reasoning engine, bukan predictor"
 */
export function generateAIBrief(insight: TrendInsight): AIReadableTrendBrief {
  const topKeywords = insight.scores.slice(0, 10).map((s) => ({
    keyword: s.keyword,
    opportunity_score: s.opportunity_score,
    lifecycle: s.lifecycle_stage,
    trend_momentum: s.trend_momentum,
    monetization: s.monetization_score,
    supply_gap: s.supply_gap_score,
    competition: s.competition_score,
    risk: s.risk_level,
    sustainability_days: s.sustainability_window,
  }));

  const dominantLifecycle = Object.entries(insight.lifecycleSummary)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

  const overallRisk = insight.scores.length > 0
    ? (insight.scores.filter((s) => s.risk_level === "high").length / insight.scores.length > 0.5
        ? "high"
        : insight.scores.filter((s) => s.risk_level === "medium").length / insight.scores.length > 0.5
          ? "medium"
          : "low")
    : "unknown";

  return {
    nicheId: insight.nicheId,
    nicheLabel: insight.nicheLabel,
    generatedAt: new Date().toISOString(),
    dataPointsUsed: insight.dataPointsTotal,
    topKeywords,
    marketSummary: {
      avgOpportunity: insight.avgOpportunityScore,
      hotCount: insight.hotKeywords.length,
      breakoutCount: insight.breakoutKeywords.length,
      dominantLifecycle,
      overallRisk,
    },
  };
}

/**
 * Format AI brief as a string block for injection into AI prompts.
 * This is what gets appended to Content Calendar / other AI prompts.
 */
export function formatBriefForPrompt(brief: AIReadableTrendBrief): string {
  if (brief.topKeywords.length === 0) {
    return "[TREND DATA] Belum ada data trend tersedia untuk niche ini.";
  }

  const lines: string[] = [
    `\n[TREND INTELLIGENCE DATA — ${brief.nicheLabel}]`,
    `Generated: ${brief.generatedAt.split("T")[0]}`,
    `Data points analyzed: ${brief.dataPointsUsed}`,
    `Average opportunity score: ${brief.marketSummary.avgOpportunity}/100`,
    `Hot keywords: ${brief.marketSummary.hotCount} | Breakout: ${brief.marketSummary.breakoutCount}`,
    `Dominant lifecycle: ${brief.marketSummary.dominantLifecycle}`,
    `Overall risk: ${brief.marketSummary.overallRisk}`,
    ``,
    `TOP KEYWORD SCORES (ordered by opportunity):`,
  ];

  for (const kw of brief.topKeywords) {
    lines.push(
      `• "${kw.keyword}" — Opportunity: ${kw.opportunity_score}/100 ` +
      `(Momentum: ${kw.trend_momentum}, Monetization: ${kw.monetization}, ` +
      `Supply Gap: ${kw.supply_gap}, Competition: ${kw.competition}) ` +
      `[${kw.lifecycle}] [Risk: ${kw.risk}] [~${kw.sustainability_days}d window]`
    );
  }

  lines.push(``);
  lines.push(`INSTRUKSI: Semua saran konten HARUS merujuk data di atas.`);
  lines.push(`Prioritaskan keyword dengan opportunity_score > 40 dan lifecycle "early_growth".`);
  lines.push(`Hindari keyword dengan lifecycle "declining" atau "saturating" kecuali ada angle baru.`);
  lines.push(`Setiap rekomendasi WAJIB menyebut angka opportunity_score sebagai justifikasi.`);

  return lines.join("\n");
}

// ============================================================================
// LIFECYCLE LABELS (UI display)
// ============================================================================

export const LIFECYCLE_LABELS: Record<LifecycleStage, { label: string; emoji: string; color: string; description: string }> = {
  emerging: {
    label: "Emerging",
    emoji: "🌱",
    color: "text-blue-400",
    description: "Social spike terdeteksi, search volume masih rendah. Waktu ideal untuk masuk awal.",
  },
  early_growth: {
    label: "Early Growth",
    emoji: "🚀",
    color: "text-emerald-400",
    description: "Search naik, monetisasi mulai muncul. SWEET SPOT — masuk sekarang.",
  },
  peak: {
    label: "Peak",
    emoji: "⚡",
    color: "text-yellow-400",
    description: "Semua metrik tinggi, affiliate masuk. Masih profitable tapi window menyempit.",
  },
  saturating: {
    label: "Saturating",
    emoji: "📊",
    color: "text-orange-400",
    description: "Content density tinggi, engagement mulai turun. Butuh angle unik.",
  },
  declining: {
    label: "Declining",
    emoji: "📉",
    color: "text-red-400",
    description: "Semua metrik menurun. Tidak direkomendasikan kecuali sudah punya audience.",
  },
};

export const RISK_LABELS: Record<RiskLevel, { label: string; emoji: string; color: string }> = {
  low: { label: "Low Risk", emoji: "🟢", color: "text-emerald-400" },
  medium: { label: "Medium Risk", emoji: "🟡", color: "text-yellow-400" },
  high: { label: "High Risk", emoji: "🔴", color: "text-red-400" },
};
