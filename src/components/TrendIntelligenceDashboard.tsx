/**
 * Trend Intelligence Dashboard — Real Data UI
 * ================================================
 * Menampilkan data trend REAL dengan angka, skor, lifecycle.
 * BUKAN opini — tapi fakta data terukur.
 *
 * Sections:
 *   1. Overview: Opportunity score, lifecycle, risk meter
 *   2. Keyword Table: All scored keywords with full breakdown
 *   3. Lifecycle Map: Visual pipeline of keyword stages
 *   4. AI Insight: AI interpretation based on scores
 *   5. Refresh: Trigger data update
 */

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle,
  RefreshCw, ChevronDown, ChevronUp, Target, Zap,
  Shield, Clock, Database, BarChart3, Search,
  ArrowUpRight, ArrowDownRight, Minus, Flame,
  Loader2, Info, ExternalLink, Eye, EyeOff,
} from "lucide-react";
import {
  computeTrendInsight,
  generateAIBrief,
  formatBriefForPrompt,
  LIFECYCLE_LABELS,
  RISK_LABELS,
  type TrendInsight,
  type TrendScore,
  type LifecycleStage,
  type AIReadableTrendBrief,
} from "@/services/trendIntelligenceEngine";
import { resolveUserNiche, getNichesForPath } from "@/services/nicheTaxonomy";
import { getDataSourceStatus, hasAnyDataSource } from "@/services/trendDataFetcher";
import {
  runFullPipeline,
  checkPipelineHealth,
  type PipelineProgress,
  type PipelineResult,
} from "@/services/trendPipelineScheduler";

// ============================================================================
// PROPS
// ============================================================================

interface TrendIntelligenceDashboardProps {
  pathId: string;
  interestMarket?: string;
  subSector?: string;
  compact?: boolean;
  onTrendBriefReady?: (brief: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function TrendIntelligenceDashboard({
  pathId,
  interestMarket,
  subSector,
  compact = false,
  onTrendBriefReady,
}: TrendIntelligenceDashboardProps) {
  const [insight, setInsight] = useState<TrendInsight | null>(null);
  const [aiBrief, setAiBrief] = useState<AIReadableTrendBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState<PipelineProgress | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const [showRawBrief, setShowRawBrief] = useState(false);
  const [showApiStatus, setShowApiStatus] = useState(false);

  // Load trend data
  const loadTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await computeTrendInsight(pathId, interestMarket, subSector);
      setInsight(result);
      
      const brief = generateAIBrief(result);
      setAiBrief(brief);
      
      // Notify parent with formatted brief for AI prompt injection
      if (onTrendBriefReady) {
        const formatted = formatBriefForPrompt(brief);
        onTrendBriefReady(formatted);
      }
    } catch (err) {
      console.error("[TrendDashboard] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load trend data");
    } finally {
      setLoading(false);
    }
  }, [pathId, interestMarket, subSector, onTrendBriefReady]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  // Refresh data — runs the full pipeline
  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshProgress(null);
    setPipelineResult(null);
    try {
      const result = await runFullPipeline(
        pathId,
        interestMarket,
        subSector,
        (progress) => setRefreshProgress(progress),
      );
      setPipelineResult(result);
      await loadTrends();
    } catch (err) {
      console.error("[TrendDashboard] Pipeline error:", err);
      setRefreshProgress({
        step: "error",
        message: err instanceof Error ? err.message : "Pipeline failed",
        progress: 0,
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-gray-400">Loading Trend Intelligence...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <span className="text-red-300 text-sm">{error}</span>
        <button onClick={loadTrends} className="ml-auto text-red-400 hover:text-red-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!insight || insight.scores.length === 0) {
    const health = checkPipelineHealth();
    return (
      <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Database className="w-5 h-5 text-gray-500" />
          <h3 className="text-gray-400 font-medium">Trend Intelligence</h3>
        </div>
        <p className="text-gray-500 text-sm mb-3">
          Belum ada data trend untuk niche ini. Klik refresh untuk fetch data real dari API.
        </p>

        {/* API Status */}
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
          <p className="text-xs text-gray-400 mb-2 font-medium">
            📡 Data Sources ({health.apis_configured}/{health.apis_total} configured)
          </p>
          {health.sources.map((src) => (
            <div key={src.name} className="flex items-center gap-2 text-xs py-0.5">
              <span className={src.available ? "text-emerald-400" : "text-red-400"}>
                {src.available ? "✅" : "❌"}
              </span>
              <span className={src.available ? "text-gray-300" : "text-gray-500"}>{src.name}</span>
              {!src.available && src.reason && (
                <span className="text-gray-600 ml-auto">{src.reason}</span>
              )}
            </div>
          ))}
          {!health.has_minimum_setup && (
            <p className="text-yellow-400 text-xs mt-2">
              ⚠️ Tambahkan minimal 1 API key ke file .env untuk data real
            </p>
          )}
        </div>

        {/* Pipeline Progress */}
        {refreshing && refreshProgress && (
          <div className="mb-3 p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span className="text-blue-300 text-xs">{refreshProgress.message}</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${refreshProgress.progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleRefresh}
          disabled={refreshing || !health.has_minimum_setup}
          className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm hover:bg-primary/15 flex items-center gap-2 disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {refreshing ? "Fetching Real Data..." : "Fetch Data Trend"}
        </button>
      </div>
    );
  }

  if (compact) {
    return <CompactView insight={insight} onExpand={() => {}} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Trend Intelligence</h2>
              <p className="text-gray-400 text-sm">
                {insight.nicheLabel} • {insight.dataPointsTotal} data points • {insight.scores.length} keywords
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-sm hover:bg-gray-700 flex items-center gap-2"
          >
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            label="Avg Opportunity"
            value={insight.avgOpportunityScore}
            suffix="/100"
            icon={<Target className="w-4 h-4" />}
            color={getOpportunityColor(insight.avgOpportunityScore)}
          />
          <StatCard
            label="Hot Keywords"
            value={insight.hotKeywords.length}
            suffix={`/${insight.scores.length}`}
            icon={<Flame className="w-4 h-4" />}
            color="text-orange-400"
          />
          <StatCard
            label="Breakouts"
            value={insight.breakoutKeywords.length}
            icon={<Zap className="w-4 h-4" />}
            color="text-yellow-400"
          />
          <StatCard
            label="Dominant Stage"
            value={getDominantLifecycleLabel(insight.lifecycleSummary)}
            icon={<Activity className="w-4 h-4" />}
            color={getDominantLifecycleColor(insight.lifecycleSummary)}
            isText
          />
          <StatCard
            label="Data Points"
            value={insight.dataPointsTotal}
            icon={<Database className="w-4 h-4" />}
            color="text-gray-400"
          />
        </div>
      </div>

      {/* Top Opportunity Highlight */}
      {insight.topOpportunity && (
        <TopOpportunityCard score={insight.topOpportunity} />
      )}

      {/* Lifecycle Pipeline */}
      <LifecyclePipeline summary={insight.lifecycleSummary} scores={insight.scores} />

      {/* Keyword Scores Table */}
      <KeywordScoresTable
        scores={insight.scores}
        showAll={showAllKeywords}
        expandedKeyword={expandedKeyword}
        onToggleExpand={setExpandedKeyword}
        onToggleShowAll={() => setShowAllKeywords(!showAllKeywords)}
      />

      {/* AI Brief (debug/transparency view) */}
      {aiBrief && (
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
          <button
            onClick={() => setShowRawBrief(!showRawBrief)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-300 text-sm w-full"
          >
            {showRawBrief ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>AI Trend Brief (data yang dikirim ke AI)</span>
            {showRawBrief ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
          </button>
          <AnimatePresence>
            {showRawBrief && (
              <motion.pre
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 p-3 bg-gray-950 rounded-lg text-xs text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap"
              >
                {formatBriefForPrompt(aiBrief)}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function CompactView({ insight }: { insight: TrendInsight; onExpand: () => void }) {
  const top = insight.topOpportunity;
  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">Trend: {insight.nicheLabel}</span>
            <span className={`text-xs ${getOpportunityColor(insight.avgOpportunityScore)}`}>
              {insight.avgOpportunityScore}/100
            </span>
          </div>
          {top && (
            <p className="text-gray-400 text-xs mt-0.5">
              Top: "{top.keyword}" ({top.opportunity_score}/100, {LIFECYCLE_LABELS[top.lifecycle_stage].emoji} {top.lifecycle_stage})
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {insight.hotKeywords.length > 0 && (
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
              🔥 {insight.hotKeywords.length} hot
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, icon, color, isText }: {
  label: string;
  value: number | string;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-gray-500 text-xs">{label}</span>
      </div>
      <div className={`${isText ? "text-sm" : "text-xl"} font-bold ${color}`}>
        {value}{suffix && <span className="text-sm font-normal text-gray-500">{suffix}</span>}
      </div>
    </div>
  );
}

function TopOpportunityCard({ score }: { score: TrendScore }) {
  const lifecycle = LIFECYCLE_LABELS[score.lifecycle_stage];
  const risk = RISK_LABELS[score.risk_level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary/[0.06] border border-primary/15 rounded-xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-primary/80 text-xs font-medium uppercase tracking-wider">Top Opportunity</span>
          </div>
          <h3 className="text-white text-lg font-bold">"{score.keyword}"</h3>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-sm flex items-center gap-1 ${lifecycle.color}`}>
              {lifecycle.emoji} {lifecycle.label}
            </span>
            <span className={`text-sm flex items-center gap-1 ${risk.color}`}>
              {risk.emoji} {risk.label}
            </span>
            <span className="text-gray-400 text-sm flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ~{score.sustainability_window}d window
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getOpportunityColor(score.opportunity_score)}`}>
            {score.opportunity_score}
          </div>
          <div className="text-gray-500 text-xs">/100 score</div>
        </div>
      </div>

      {/* Score Breakdown Bar */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <ScoreBar label="Momentum" value={score.trend_momentum} color="bg-emerald-500" />
        <ScoreBar label="Monetisasi" value={score.monetization_score} color="bg-amber-500" />
        <ScoreBar label="Supply Gap" value={score.supply_gap_score} color="bg-blue-500" />
        <ScoreBar label="Kompetisi" value={score.competition_score} color="bg-red-500" inverted />
      </div>
    </motion.div>
  );
}

function ScoreBar({ label, value, color, inverted }: {
  label: string;
  value: number;
  color: string;
  inverted?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-400 text-xs">{label}</span>
        <span className="text-white text-xs font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${inverted ? "bg-red-500/70" : color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function LifecyclePipeline({ summary, scores }: {
  summary: Record<LifecycleStage, number>;
  scores: TrendScore[];
}) {
  const stages: LifecycleStage[] = ["emerging", "early_growth", "peak", "saturating", "declining"];
  const total = Object.values(summary).reduce((s, v) => s + v, 0);

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
      <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        Lifecycle Pipeline
      </h3>
      <div className="flex items-center gap-1">
        {stages.map((stage) => {
          const count = summary[stage];
          const pct = total > 0 ? (count / total) * 100 : 0;
          const info = LIFECYCLE_LABELS[stage];

          return (
            <div
              key={stage}
              className="flex-1 group relative"
              title={`${info.label}: ${count} keywords`}
            >
              <div className={`h-8 rounded-md flex items-center justify-center ${
                count > 0 ? getLifecycleBgColor(stage) : "bg-gray-800"
              } transition-all hover:scale-105`}>
                {count > 0 && (
                  <span className="text-xs font-medium text-white">
                    {info.emoji} {count}
                  </span>
                )}
              </div>
              <div className={`text-center text-xs mt-1 ${info.color}`}>
                {info.label}
              </div>
              <div className="text-center text-xs text-gray-500">
                {pct > 0 ? `${Math.round(pct)}%` : "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KeywordScoresTable({ scores, showAll, expandedKeyword, onToggleExpand, onToggleShowAll }: {
  scores: TrendScore[];
  showAll: boolean;
  expandedKeyword: string | null;
  onToggleExpand: (keyword: string | null) => void;
  onToggleShowAll: () => void;
}) {
  const displayed = showAll ? scores : scores.slice(0, 5);

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white text-sm font-medium flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Keyword Scores
          <span className="text-gray-500 text-xs ml-1">({scores.length} keywords)</span>
        </h3>
      </div>

      <div className="divide-y divide-gray-800/50">
        {displayed.map((score) => {
          const lifecycle = LIFECYCLE_LABELS[score.lifecycle_stage];
          const risk = RISK_LABELS[score.risk_level];
          const isExpanded = expandedKeyword === score.keyword;

          return (
            <div key={score.keyword} className="hover:bg-gray-800/30 transition-colors">
              <button
                onClick={() => onToggleExpand(isExpanded ? null : score.keyword)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left"
              >
                {/* Opportunity Score */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                  getOpportunityBg(score.opportunity_score)
                } ${getOpportunityColor(score.opportunity_score)}`}>
                  {score.opportunity_score}
                </div>

                {/* Keyword */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium truncate">{score.keyword}</span>
                    {score.is_hot && <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                    {score.is_breakout && <Zap className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs ${lifecycle.color}`}>{lifecycle.emoji} {lifecycle.label}</span>
                    <span className={`text-xs ${risk.color}`}>{risk.emoji}</span>
                    <span className="text-gray-500 text-xs">~{score.sustainability_window}d</span>
                  </div>
                </div>

                {/* Mini Bars */}
                <div className="hidden md:flex items-center gap-2">
                  <MiniScore label="M" value={score.trend_momentum} />
                  <MiniScore label="$" value={score.monetization_score} />
                  <MiniScore label="G" value={score.supply_gap_score} />
                  <MiniScore label="C" value={score.competition_score} inverted />
                </div>

                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <KeywordDetail score={score} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {scores.length > 5 && (
        <button
          onClick={onToggleShowAll}
          className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-300 flex items-center justify-center gap-1 border-t border-gray-800/50"
        >
          {showAll ? "Show Less" : `Show All (${scores.length})`}
          {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function MiniScore({ label, value, inverted }: { label: string; value: number; inverted?: boolean }) {
  const color = inverted
    ? (value > 60 ? "text-red-400" : value > 30 ? "text-yellow-400" : "text-emerald-400")
    : (value > 60 ? "text-emerald-400" : value > 30 ? "text-yellow-400" : "text-gray-500");

  return (
    <div className="text-center">
      <div className="text-gray-600 text-[10px]">{label}</div>
      <div className={`text-xs font-medium ${color}`}>{value}</div>
    </div>
  );
}

function KeywordDetail({ score }: { score: TrendScore }) {
  const breakdown = score.score_breakdown;

  return (
    <div className="px-4 pb-4 space-y-3">
      {/* Score Breakdown */}
      <div className="bg-gray-800/50 rounded-lg p-3">
        <h4 className="text-gray-400 text-xs font-medium mb-2">Score Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DetailMetric
            label="Trend Momentum"
            value={score.trend_momentum}
            weight="×0.35"
            details={[
              `7d growth: ${breakdown.momentum.growth_7d_raw.toFixed(1)}%`,
              `30d growth: ${breakdown.momentum.growth_30d_raw.toFixed(1)}%`,
              `Volume weight: ${(breakdown.momentum.search_volume_weight * 100).toFixed(0)}%`,
            ]}
            color="text-emerald-400"
          />
          <DetailMetric
            label="Monetization"
            value={score.monetization_score}
            weight="×0.30"
            details={[
              `CPC: $${breakdown.monetization.cpc_raw.toFixed(2)}`,
              `Affiliate: ${(breakdown.monetization.affiliate_density_raw * 100).toFixed(0)}%`,
              `Ads: ${(breakdown.monetization.ads_density_raw * 100).toFixed(0)}%`,
            ]}
            color="text-yellow-400"
          />
          <DetailMetric
            label="Supply Gap"
            value={score.supply_gap_score}
            weight="×0.25"
            details={[
              `Demand: ${breakdown.supply_gap.demand_signal}`,
              `Content: ${breakdown.supply_gap.content_density_raw.toLocaleString()}`,
              `Creators: ${breakdown.supply_gap.creator_density_raw.toLocaleString()}`,
            ]}
            color="text-blue-400"
          />
          <DetailMetric
            label="Competition"
            value={score.competition_score}
            weight="-0.10"
            details={[
              `Content/creator: ${breakdown.competition.content_per_creator}`,
              `Engagement: ${breakdown.competition.engagement_velocity_raw.toFixed(1)}%`,
            ]}
            color="text-red-400"
          />
        </div>
      </div>

      {/* Risk Factors */}
      {score.risk_factors.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
          {score.risk_factors.map((factor) => (
            <span key={factor} className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">
              {formatRiskFactor(factor)}
            </span>
          ))}
        </div>
      )}

      {/* Formula */}
      <div className="text-xs text-gray-500 font-mono bg-gray-950/50 rounded p-2">
        opportunity = ({score.trend_momentum}×0.35) + ({score.monetization_score}×0.30) + ({score.supply_gap_score}×0.25) - ({score.competition_score}×0.10) = <span className="text-white font-bold">{score.opportunity_score}</span>
      </div>
    </div>
  );
}

function DetailMetric({ label, value, weight, details, color }: {
  label: string;
  value: number;
  weight: string;
  details: string[];
  color: string;
}) {
  return (
    <div className="bg-gray-900/50 rounded p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500 text-xs">{label}</span>
        <span className="text-gray-600 text-[10px]">{weight}</span>
      </div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="mt-1 space-y-0.5">
        {details.map((d, i) => (
          <div key={i} className="text-gray-500 text-[10px]">{d}</div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getOpportunityColor(score: number): string {
  if (score >= 60) return "text-emerald-400";
  if (score >= 40) return "text-yellow-400";
  if (score >= 20) return "text-orange-400";
  return "text-red-400";
}

function getOpportunityBg(score: number): string {
  if (score >= 60) return "bg-emerald-500/20";
  if (score >= 40) return "bg-yellow-500/20";
  if (score >= 20) return "bg-orange-500/20";
  return "bg-red-500/20";
}

function getLifecycleBgColor(stage: LifecycleStage): string {
  const colors: Record<LifecycleStage, string> = {
    emerging: "bg-blue-600/40",
    early_growth: "bg-emerald-600/40",
    peak: "bg-yellow-600/40",
    saturating: "bg-orange-600/40",
    declining: "bg-red-600/40",
  };
  return colors[stage];
}

function getDominantLifecycleLabel(summary: Record<LifecycleStage, number>): string {
  const sorted = Object.entries(summary).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  if (!top || top[1] === 0) return "—";
  return LIFECYCLE_LABELS[top[0] as LifecycleStage].label;
}

function getDominantLifecycleColor(summary: Record<LifecycleStage, number>): string {
  const sorted = Object.entries(summary).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  if (!top || top[1] === 0) return "text-gray-500";
  return LIFECYCLE_LABELS[top[0] as LifecycleStage].color;
}

function formatRiskFactor(factor: string): string {
  const labels: Record<string, string> = {
    data_limited: "Data Terbatas",
    high_competition: "Kompetisi Tinggi",
    market_saturating: "Pasar Jenuh",
    market_declining: "Pasar Menurun",
    volatile_spike: "Spike Volatil",
    low_monetization_signal: "Monetisasi Rendah",
  };
  return labels[factor] || factor;
}
