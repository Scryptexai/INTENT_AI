/**
 * Market Signal Service — Real Market Signal Layer
 * ===================================================
 * Generates market signals from REAL trend data, NOT manual seeds.
 *
 * Architecture:
 *   1. Reads scored trend data from `trend_scores` table
 *   2. Converts top-scored keywords into market signals
 *   3. Detects rising/falling/stable directions from growth data
 *   4. Auto-generates actionable suggestions based on lifecycle + score
 *   5. Persists to `market_signals` table for Dashboard consumption
 *
 * Signal Sources:
 *   - trend_scores (from trendIntelligenceEngine)
 *   - trend_data_points (raw data for growth direction)
 *
 * Flow: trendDataFetcher → trendIntelligenceEngine → THIS SERVICE
 */

import { supabase } from "@/integrations/supabase/client";
import type { TrendScore, LifecycleStage } from "./trendIntelligenceEngine";

// ============================================================================
// TYPES
// ============================================================================

export interface MarketSignal {
  id: string;
  path_id: string;
  category: string;
  keyword: string;
  trend_score: number;
  trend_direction: "rising" | "falling" | "stable";
  source: string;
  confidence: number;
  is_hot: boolean;
  suggestion: string | null;
  metadata: Record<string, unknown> | null;
  last_updated: string;
  created_at: string;
}

export interface PathMarketFocus {
  path_id: string;
  top_keyword: string;
  trend_score: number;
  trend_direction: "rising" | "falling" | "stable";
  suggestion: string | null;
  hot_count: number;
  total_signals: number;
  heat_score: number;
}

export interface TrendingNiche {
  keyword: string;
  path_id: string;
  trend_score: number;
  trend_direction: "rising" | "falling" | "stable";
  suggestion: string | null;
  is_hot: boolean;
}

// Path-to-category mapping for signal classification
const PATH_CATEGORIES: Record<string, string> = {
  "content-creator": "content",
  "freelancer": "freelance",
  "digital-product": "product",
  "ecommerce": "product",
  "service-business": "service",
  "trading-investment": "trading",
};

// ============================================================================
// 1. LOAD SIGNALS
// ============================================================================

export async function loadPathSignals(pathId: string): Promise<MarketSignal[]> {
  const { data, error } = await supabase
    .from("market_signals")
    .select("*")
    .eq("path_id", pathId)
    .order("trend_score", { ascending: false });

  if (error) {
    console.error("Failed to load market signals:", error);
    return [];
  }

  return (data || []) as MarketSignal[];
}

// ============================================================================
// 2. GET ALL "HOT" TRENDING NICHES
// ============================================================================

export async function loadHotNiches(): Promise<TrendingNiche[]> {
  const { data, error } = await supabase
    .from("market_signals")
    .select("keyword, path_id, trend_score, trend_direction, suggestion, is_hot")
    .eq("is_hot", true)
    .order("trend_score", { ascending: false });

  if (error) {
    console.error("Failed to load hot niches:", error);
    return [];
  }

  return (data || []) as TrendingNiche[];
}

// ============================================================================
// 3. PATH MARKET FOCUS — Computed from real signals
// ============================================================================

export async function getPathMarketFocus(pathId: string): Promise<PathMarketFocus | null> {
  const signals = await loadPathSignals(pathId);
  if (signals.length === 0) return null;

  const top = signals[0];
  const hotCount = signals.filter((s) => s.is_hot).length;
  const totalConfidence = signals.reduce((sum, s) => sum + s.confidence, 0);
  const weightedSum = signals.reduce((sum, s) => sum + s.trend_score * s.confidence, 0);
  const heatScore = totalConfidence > 0
    ? Math.round((weightedSum / totalConfidence) * 100)
    : 0;

  return {
    path_id: pathId,
    top_keyword: top.keyword,
    trend_score: top.trend_score,
    trend_direction: top.trend_direction as "rising" | "falling" | "stable",
    suggestion: top.suggestion,
    hot_count: hotCount,
    total_signals: signals.length,
    heat_score: heatScore,
  };
}

// ============================================================================
// 4. ALL PATHS MARKET FOCUS (batch)
// ============================================================================

export async function getAllPathMarketFocus(): Promise<Record<string, PathMarketFocus>> {
  const { data, error } = await supabase
    .from("market_signals")
    .select("*")
    .order("trend_score", { ascending: false });

  if (error || !data) return {};

  const grouped: Record<string, MarketSignal[]> = {};
  for (const signal of data as MarketSignal[]) {
    if (!grouped[signal.path_id]) grouped[signal.path_id] = [];
    grouped[signal.path_id].push(signal);
  }

  const result: Record<string, PathMarketFocus> = {};
  for (const [pathId, signals] of Object.entries(grouped)) {
    const top = signals[0];
    const hotCount = signals.filter((s) => s.is_hot).length;
    const totalConfidence = signals.reduce((sum, s) => sum + s.confidence, 0);
    const weightedSum = signals.reduce((sum, s) => sum + s.trend_score * s.confidence, 0);
    const heatScore = totalConfidence > 0
      ? Math.round((weightedSum / totalConfidence) * 100)
      : 0;

    result[pathId] = {
      path_id: pathId,
      top_keyword: top.keyword,
      trend_score: top.trend_score,
      trend_direction: top.trend_direction as "rising" | "falling" | "stable",
      suggestion: top.suggestion,
      hot_count: hotCount,
      total_signals: signals.length,
      heat_score: heatScore,
    };
  }

  return result;
}

// ============================================================================
// 5. GENERATE SIGNALS FROM REAL TREND SCORES
// ============================================================================

/**
 * Convert scored trend data into market signals.
 * This is the REAL signal generator — reads from `trend_scores` table.
 *
 * @param pathId - The economic path (e.g., "content-creator")
 * @param nicheId - The niche ID from niche taxonomy
 * @returns Number of signals created/updated
 */
export async function generateSignalsFromTrendScores(
  pathId: string,
  nicheId: string,
): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };

  // Load scored trends for this niche
  const { data: scores, error } = await supabase
    .from("trend_scores" as any)
    .select("*")
    .eq("niche_id", nicheId)
    .order("opportunity_score", { ascending: false })
    .limit(20); // Top 20 keywords

  if (error || !scores || scores.length === 0) {
    result.errors.push(`No trend scores found for niche ${nicheId}`);
    return result;
  }

  const category = PATH_CATEGORIES[pathId] || "content";

  for (const score of scores as unknown as TrendScore[]) {
    try {
      const direction = detectDirection(score);
      const suggestion = generateSuggestion(score, direction);
      const normalizedTrendScore = score.opportunity_score / 100; // 0-1 range

      const signalData = {
        path_id: pathId,
        category,
        keyword: score.keyword,
        trend_score: normalizedTrendScore,
        trend_direction: direction,
        source: "trend_intelligence_engine",
        confidence: getConfidenceFromScore(score),
        is_hot: score.is_hot || score.opportunity_score >= 60,
        suggestion,
        metadata: {
          opportunity_score: score.opportunity_score,
          lifecycle_stage: score.lifecycle_stage,
          trend_momentum: score.trend_momentum,
          monetization_score: score.monetization_score,
          supply_gap_score: score.supply_gap_score,
          competition_score: score.competition_score,
          risk_level: score.risk_level,
          sustainability_window: score.sustainability_window,
          is_breakout: score.is_breakout,
          data_points_count: score.data_points_count,
          generated_at: new Date().toISOString(),
        },
        last_updated: new Date().toISOString(),
      };

      // Upsert (update if exists, insert if new)
      const { error: upsertError } = await supabase
        .from("market_signals")
        .upsert(signalData as any, { onConflict: "path_id,keyword" })
        .select();

      if (upsertError) {
        // If upsert fails (no unique constraint), try insert
        const { error: insertError } = await supabase
          .from("market_signals")
          .insert(signalData as any);

        if (insertError) {
          result.errors.push(`Signal save failed for "${score.keyword}": ${insertError.message}`);
          continue;
        }
      }

      result.created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Signal generation failed for "${score.keyword}": ${msg}`);
    }
  }

  return result;
}

/**
 * Refresh signals for ALL paths from their niche data.
 * Call this after a trend data refresh + scoring cycle.
 */
export async function refreshAllSignals(): Promise<{
  total_created: number;
  total_errors: number;
  path_results: Record<string, { created: number; errors: string[] }>;
}> {
  const pathResults: Record<string, { created: number; errors: string[] }> = {};
  let totalCreated = 0;
  let totalErrors = 0;

  // Load all unique niche_ids from trend_scores
  const { data: niches, error } = await supabase
    .from("trend_scores" as any)
    .select("niche_id")
    .limit(100);

  if (error || !niches) {
    return { total_created: 0, total_errors: 1, path_results: {} };
  }

  const uniqueNiches = [...new Set((niches as any[]).map(n => n.niche_id))];

  for (const nicheId of uniqueNiches) {
    // Determine pathId from niche_id (first part of the niche path)
    const pathId = nicheId.split(".")[0] || nicheId;

    const result = await generateSignalsFromTrendScores(pathId, nicheId);
    totalCreated += result.created;
    totalErrors += result.errors.length;

    pathResults[nicheId] = {
      created: result.created,
      errors: result.errors,
    };
  }

  return { total_created: totalCreated, total_errors: totalErrors, path_results: pathResults };
}

// ============================================================================
// 6. DIRECTION DETECTION — From real score data
// ============================================================================

function detectDirection(score: TrendScore): "rising" | "falling" | "stable" {
  // Use momentum + lifecycle to determine direction
  if (score.trend_momentum > 50) return "rising";
  if (score.trend_momentum < 20) return "falling";

  // Lifecycle-based fallback
  switch (score.lifecycle_stage) {
    case "emerging":
    case "early_growth":
      return "rising";
    case "declining":
      return "falling";
    case "peak":
    case "saturating":
      return score.trend_momentum > 30 ? "stable" : "falling";
    default:
      return "stable";
  }
}

// ============================================================================
// 7. SUGGESTION GENERATOR — Actionable insights from real data
// ============================================================================

function generateSuggestion(score: TrendScore, direction: "rising" | "falling" | "stable"): string {
  const { lifecycle_stage, opportunity_score, risk_level, is_breakout, sustainability_window } = score;

  // Breakout alert
  if (is_breakout) {
    return `🚨 BREAKOUT detected! "${score.keyword}" menunjukkan lonjakan drastis. Window ~${sustainability_window} hari. Segera buat konten sebelum kompetitor masuk.`;
  }

  // Lifecycle-based suggestions with real score data
  switch (lifecycle_stage) {
    case "emerging":
      if (opportunity_score > 40) {
        return `🌱 Keyword "${score.keyword}" mulai muncul (opportunity ${opportunity_score}/100). Waktu ideal untuk early mover advantage. Buat konten edukatif sekarang.`;
      }
      return `🌱 "${score.keyword}" masih early stage. Monitor dalam 1-2 minggu untuk konfirmasi tren.`;

    case "early_growth":
      return `🚀 SWEET SPOT! "${score.keyword}" di fase growth (${opportunity_score}/100). Supply gap masih terbuka. Fokus konten intensive di keyword ini ~${sustainability_window} hari ke depan.`;

    case "peak":
      if (risk_level === "high") {
        return `⚡ "${score.keyword}" sedang peak tapi risiko tinggi. Monetisasi sekarang, tapi siapkan pivot ke keyword lain.`;
      }
      return `⚡ "${score.keyword}" di puncak tren (${opportunity_score}/100). Masih profitable ~${sustainability_window} hari. Maksimalkan monetisasi sekarang.`;

    case "saturating":
      return `📊 "${score.keyword}" mulai saturasi (competition ${score.competition_score}/100). Cari angle unik atau pivot ke sub-niche yang lebih spesifik.`;

    case "declining":
      return `📉 "${score.keyword}" sedang menurun. Tidak direkomendasikan untuk konten baru kecuali sudah punya audience di niche ini.`;

    default:
      if (direction === "rising") {
        return `📈 "${score.keyword}" menunjukkan tren naik (momentum ${score.trend_momentum}/100). Worth exploring.`;
      }
      return `➡️ "${score.keyword}" stabil (${opportunity_score}/100). Cocok untuk konten evergreen.`;
  }
}

function getConfidenceFromScore(score: TrendScore): number {
  // Confidence based on data quality + multi-source coverage
  let base = 0.5;

  if (score.data_points_count >= 4) base += 0.2;
  else if (score.data_points_count >= 2) base += 0.1;

  if (score.risk_level === "low") base += 0.1;
  if (score.lifecycle_stage === "early_growth" || score.lifecycle_stage === "emerging") base += 0.1;

  return Math.min(0.95, base);
}

// ============================================================================
// 8. TREND DIRECTION HELPERS (UI display)
// ============================================================================

export function trendDirectionLabel(direction: string): string {
  switch (direction) {
    case "rising": return "📈 Naik";
    case "falling": return "📉 Turun";
    default: return "➡️ Stabil";
  }
}

export function trendDirectionColor(direction: string): { bg: string; text: string } {
  switch (direction) {
    case "rising": return { bg: "bg-emerald-500/10", text: "text-emerald-400" };
    case "falling": return { bg: "bg-red-500/10", text: "text-red-400" };
    default: return { bg: "bg-blue-500/10", text: "text-blue-400" };
  }
}

// ============================================================================
// 9. CLEANUP — Remove stale signals
// ============================================================================

/**
 * Remove signals older than N days that haven't been refreshed.
 * Prevents stale data from polluting the dashboard.
 */
export async function cleanupStaleSignals(maxAgeDays: number = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  const { data, error } = await supabase
    .from("market_signals")
    .delete()
    .lt("last_updated", cutoff.toISOString())
    .select("id");

  if (error) {
    console.error("Failed to cleanup stale signals:", error);
    return 0;
  }

  return data?.length || 0;
}
