/**
 * Trend Pipeline Scheduler — Full Data→Score→Signal Pipeline
 * ==============================================================
 * Orchestrates the complete trend intelligence pipeline:
 *
 *   1. FETCH: Real data from Google Trends + YouTube + Google CSE + TikTok
 *   2. SCORE: Run deterministic scoring engine on all data points
 *   3. SIGNAL: Generate market signals from scored keywords
 *   4. CLEANUP: Remove stale data older than 30 days
 *
 * Triggered by:
 *   - User clicking "Refresh" on TrendIntelligenceDashboard
 *   - Future: Supabase Edge Function cron (1x/day)
 *
 * This is the single entry point for the entire pipeline.
 */

import { refreshNicheData, getDataSourceStatus, hasAnyDataSource, mergeDataPoints } from "./trendDataFetcher";
import { computeTrendInsight, type TrendInsight } from "./trendIntelligenceEngine";
import { generateSignalsFromTrendScores, cleanupStaleSignals } from "./marketSignalService";
import { resolveUserNiche, getNichesForPath } from "./nicheTaxonomy";

// ============================================================================
// TYPES
// ============================================================================

export interface PipelineResult {
  status: "success" | "partial" | "failed" | "no_api";
  // Step 1: Fetch
  fetchResults: {
    sources_attempted: number;
    sources_succeeded: number;
    total_data_points: number;
    errors: string[];
  };
  // Step 2: Score
  scoreResults: {
    keywords_scored: number;
    hot_keywords: number;
    breakout_keywords: number;
    avg_opportunity: number;
  };
  // Step 3: Signal
  signalResults: {
    signals_created: number;
    errors: string[];
  };
  // Step 4: Cleanup
  cleanupResults: {
    stale_removed: number;
  };
  // Meta
  duration_ms: number;
  timestamp: string;
  data_sources: ReturnType<typeof getDataSourceStatus>;
}

export interface PipelineProgress {
  step: "checking" | "fetching" | "scoring" | "signaling" | "cleanup" | "done" | "error";
  message: string;
  progress: number; // 0-100
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Run the full trend intelligence pipeline for a user's niche.
 *
 * @param pathId - Economic path (e.g., "content-creator")
 * @param interestMarket - User's interest/market area
 * @param subSector - User's sub-sector
 * @param onProgress - Optional callback for UI progress updates
 * @returns Full pipeline result with all step outcomes
 */
export async function runFullPipeline(
  pathId: string,
  interestMarket?: string,
  subSector?: string,
  onProgress?: (progress: PipelineProgress) => void,
): Promise<PipelineResult> {
  const startTime = Date.now();
  const dataSources = getDataSourceStatus();

  const result: PipelineResult = {
    status: "failed",
    fetchResults: { sources_attempted: 0, sources_succeeded: 0, total_data_points: 0, errors: [] },
    scoreResults: { keywords_scored: 0, hot_keywords: 0, breakout_keywords: 0, avg_opportunity: 0 },
    signalResults: { signals_created: 0, errors: [] },
    cleanupResults: { stale_removed: 0 },
    duration_ms: 0,
    timestamp: new Date().toISOString(),
    data_sources: dataSources,
  };

  // Pre-check: Do we have any API configured?
  if (!hasAnyDataSource()) {
    onProgress?.({
      step: "error",
      message: "No data source API configured. Add API keys to .env file.",
      progress: 0,
    });
    result.status = "no_api";
    result.fetchResults.errors.push(
      "No API keys configured. Required: at least one of VITE_SERPAPI_KEY, VITE_YOUTUBE_API_KEY, VITE_GOOGLE_CSE_API_KEY, or VITE_RAPIDAPI_KEY"
    );
    result.duration_ms = Date.now() - startTime;
    return result;
  }

  try {
    // Resolve user niche
    const niche = resolveUserNiche(pathId, interestMarket, subSector);

    // ====================================================================
    // STEP 1: FETCH — Real data from all available APIs
    // ====================================================================
    onProgress?.({
      step: "fetching",
      message: `Fetching real market data for "${niche.label}"...`,
      progress: 10,
    });

    const fetchResults = await refreshNicheData(niche.nicheId, niche.keywords);

    let sourcesAttempted = 0;
    let sourcesSucceeded = 0;
    let totalDataPoints = 0;
    const fetchErrors: string[] = [];

    for (const fr of fetchResults) {
      if (fr.source === "throttled") {
        fetchErrors.push("Refresh throttled — wait 24h between refreshes");
        continue;
      }
      if (fr.source === "no_api_configured") {
        fetchErrors.push(...fr.errors);
        continue;
      }
      if (fr.source === "data_merge") {
        totalDataPoints += fr.dataPointsCreated;
        continue;
      }

      sourcesAttempted++;
      if (fr.keywordsFetched > 0) sourcesSucceeded++;
      totalDataPoints += fr.dataPointsCreated;
      fetchErrors.push(...fr.errors);
    }

    result.fetchResults = {
      sources_attempted: sourcesAttempted,
      sources_succeeded: sourcesSucceeded,
      total_data_points: totalDataPoints,
      errors: fetchErrors,
    };

    onProgress?.({
      step: "fetching",
      message: `Fetched ${totalDataPoints} data points from ${sourcesSucceeded}/${sourcesAttempted} sources`,
      progress: 40,
    });

    // ====================================================================
    // STEP 2: SCORE — Deterministic scoring engine
    // ====================================================================
    onProgress?.({
      step: "scoring",
      message: "Running deterministic scoring engine...",
      progress: 50,
    });

    let insight: TrendInsight;
    try {
      insight = await computeTrendInsight(pathId, interestMarket, subSector);

      result.scoreResults = {
        keywords_scored: insight.scores.length,
        hot_keywords: insight.hotKeywords.length,
        breakout_keywords: insight.breakoutKeywords.length,
        avg_opportunity: insight.avgOpportunityScore,
      };

      onProgress?.({
        step: "scoring",
        message: `Scored ${insight.scores.length} keywords — Avg opportunity: ${insight.avgOpportunityScore}/100`,
        progress: 70,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.fetchResults.errors.push(`Scoring failed: ${msg}`);
      onProgress?.({
        step: "error",
        message: `Scoring failed: ${msg}`,
        progress: 50,
      });
      result.duration_ms = Date.now() - startTime;
      return result;
    }

    // ====================================================================
    // STEP 3: SIGNAL — Generate market signals from scores
    // ====================================================================
    onProgress?.({
      step: "signaling",
      message: "Generating market signals from scored data...",
      progress: 80,
    });

    try {
      const signalResult = await generateSignalsFromTrendScores(pathId, niche.nicheId);
      result.signalResults = {
        signals_created: signalResult.created,
        errors: signalResult.errors,
      };

      onProgress?.({
        step: "signaling",
        message: `Generated ${signalResult.created} market signals`,
        progress: 90,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.signalResults.errors.push(`Signal generation failed: ${msg}`);
    }

    // ====================================================================
    // STEP 4: CLEANUP — Remove stale data
    // ====================================================================
    onProgress?.({
      step: "cleanup",
      message: "Cleaning up stale data...",
      progress: 95,
    });

    try {
      const staleRemoved = await cleanupStaleSignals(30);
      result.cleanupResults = { stale_removed: staleRemoved };
    } catch {
      // Non-critical, ignore
    }

    // ====================================================================
    // DONE
    // ====================================================================
    result.duration_ms = Date.now() - startTime;
    result.status = sourcesSucceeded === sourcesAttempted && result.fetchResults.errors.length === 0
      ? "success"
      : sourcesSucceeded > 0
        ? "partial"
        : "failed";

    onProgress?.({
      step: "done",
      message: `Pipeline complete in ${(result.duration_ms / 1000).toFixed(1)}s — ${totalDataPoints} data points, ${insight.scores.length} scores, ${result.signalResults.signals_created} signals`,
      progress: 100,
    });

    return result;

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.fetchResults.errors.push(`Pipeline crashed: ${msg}`);
    result.duration_ms = Date.now() - startTime;

    onProgress?.({
      step: "error",
      message: `Pipeline error: ${msg}`,
      progress: 0,
    });

    return result;
  }
}

// ============================================================================
// QUICK REFRESH — Lightweight version, score-only (no new data fetch)
// ============================================================================

/**
 * Re-score existing data without fetching new data.
 * Useful when scoring algorithm is updated.
 */
export async function rescoreExistingData(
  pathId: string,
  interestMarket?: string,
  subSector?: string,
): Promise<TrendInsight> {
  const insight = await computeTrendInsight(pathId, interestMarket, subSector);
  const niche = resolveUserNiche(pathId, interestMarket, subSector);

  // Re-generate signals from new scores
  await generateSignalsFromTrendScores(pathId, niche.nicheId);

  return insight;
}

// ============================================================================
// STATUS CHECK — For UI to show pipeline health
// ============================================================================

export interface PipelineHealth {
  apis_configured: number;
  apis_total: number;
  sources: ReturnType<typeof getDataSourceStatus>;
  has_minimum_setup: boolean;
  missing_keys: string[];
  recommendations: string[];
}

export function checkPipelineHealth(): PipelineHealth {
  const sources = getDataSourceStatus();
  const configured = sources.filter(s => s.available).length;
  const missing = sources.filter(s => !s.available).map(s => s.key);

  const recommendations: string[] = [];

  if (!sources.find(s => s.name.includes("YouTube"))?.available) {
    recommendations.push("Enable YouTube Data API v3 — free 10,000 units/day, best ROI for engagement data");
  }

  if (!sources.find(s => s.name.includes("SerpAPI"))?.available) {
    recommendations.push("Add SerpAPI key — essential for Google Trends search interest data ($50/mo)");
  }

  if (!sources.find(s => s.name.includes("Google Custom"))?.available) {
    recommendations.push("Enable Google Custom Search — provides competition & affiliate density signals");
  }

  if (!sources.find(s => s.name.includes("TikTok"))?.available) {
    recommendations.push("Add RapidAPI key — TikTok social velocity enhances lifecycle detection");
  }

  return {
    apis_configured: configured,
    apis_total: sources.length,
    sources,
    has_minimum_setup: configured >= 1,
    missing_keys: missing,
    recommendations: configured >= 4 ? ["All APIs configured! Pipeline at full capacity."] : recommendations,
  };
}
