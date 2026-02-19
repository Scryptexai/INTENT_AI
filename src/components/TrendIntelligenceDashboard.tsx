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
      <div className="border border-border p-6 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-foreground/40" />
        <span className="text-muted-foreground">Loading Trend Intelligence...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-foreground/20 p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-foreground/50" />
        <span className="text-foreground/60 text-sm">{error}</span>
        <button onClick={loadTrends} className="ml-auto text-foreground/40 hover:text-foreground/60">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // HIDE technical details - if no data, don't show anything
  // Users shouldn't see API errors or .env instructions
  if (!insight || insight.scores.length === 0) {
    return null;
  }

  if (compact) {
    return <CompactView insight={insight} onExpand={() => {}} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-border flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-foreground/50" />
            </div>
            <div>
              <h2 className="text-foreground font-semibold text-lg">Trend Intelligence</h2>
              <p className="text-muted-foreground text-sm">
                {insight.nicheLabel} · {insight.dataPointsTotal} data points · {insight.scores.length} keywords
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="cmd-ghost text-xs"
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
            color="text-foreground/60"
          />
          <StatCard
            label="Breakouts"
            value={insight.breakoutKeywords.length}
            icon={<Zap className="w-4 h-4" />}
            color="text-foreground/60"
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
            color="text-muted-foreground"
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
        <div className="border border-border p-4">
          <button
            onClick={() => setShowRawBrief(!showRawBrief)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground/70 text-sm w-full"
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
                className="mt-3 p-3 bg-background border border-border text-xs text-muted-foreground font-mono overflow-x-auto whitespace-pre-wrap"
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
    <div className="border border-border p-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-5 h-5 text-foreground/50" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-medium">Trend: {insight.nicheLabel}</span>
            <span className={`text-xs ${getOpportunityColor(insight.avgOpportunityScore)}`}>
              {insight.avgOpportunityScore}/100
            </span>
          </div>
          {top && (
            <p className="text-muted-foreground text-xs mt-0.5">
              Top: "{top.keyword}" ({top.opportunity_score}/100, {LIFECYCLE_LABELS[top.lifecycle_stage].emoji} {top.lifecycle_stage})
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {insight.hotKeywords.length > 0 && (
            <span className="text-xs border border-border text-foreground/50 px-2 py-0.5">
              {insight.hotKeywords.length} hot
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
    <div className="border border-border p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-muted-foreground text-xs">{label}</span>
      </div>
      <div className={`${isText ? "text-sm" : "text-xl"} font-bold ${color}`}>
        {value}{suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
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
      className="border border-foreground/15 p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-foreground/50" />
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40">Top Opportunity</span>
          </div>
          <h3 className="text-foreground text-lg font-bold">"{score.keyword}"</h3>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-sm flex items-center gap-1 text-foreground/60">
              {lifecycle.emoji} {lifecycle.label}
            </span>
            <span className="text-sm flex items-center gap-1 text-foreground/50">
              {risk.emoji} {risk.label}
            </span>
            <span className="text-muted-foreground text-sm flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ~{score.sustainability_window}d window
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getOpportunityColor(score.opportunity_score)}`}>
            {score.opportunity_score}
          </div>
          <div className="text-muted-foreground text-xs">/100 score</div>
        </div>
      </div>

      {/* Score Breakdown Bar */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <ScoreBar label="Momentum" value={score.trend_momentum} color="bg-foreground/30" />
        <ScoreBar label="Monetisasi" value={score.monetization_score} color="bg-foreground/25" />
        <ScoreBar label="Supply Gap" value={score.supply_gap_score} color="bg-foreground/20" />
        <ScoreBar label="Kompetisi" value={score.competition_score} color="bg-foreground/15" inverted />
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
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="text-foreground text-xs font-medium">{value}</span>
      </div>
      <div className="h-px bg-border overflow-hidden">
        <div
          className={`h-full ${inverted ? "bg-foreground/20" : color}`}
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
    <div className="border border-border p-4">
      <h3 className="text-foreground text-sm font-medium mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-foreground/50" />
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
              <div className={`h-8 flex items-center justify-center border ${
                count > 0 ? "border-foreground/20 bg-foreground/5" : "border-border bg-background"
              } transition-all hover:bg-foreground/10`}>
                {count > 0 && (
                  <span className="text-xs font-medium text-foreground/70">
                    {info.emoji} {count}
                  </span>
                )}
              </div>
              <div className="text-center text-xs mt-1 text-foreground/50">
                {info.label}
              </div>
              <div className="text-center text-xs text-muted-foreground">
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
    <div className="border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-foreground text-sm font-medium flex items-center gap-2">
          <Search className="w-4 h-4 text-foreground/50" />
          Keyword Scores
          <span className="text-muted-foreground text-xs ml-1">({scores.length} keywords)</span>
        </h3>
      </div>

      <div className="divide-y divide-border">
        {displayed.map((score) => {
          const lifecycle = LIFECYCLE_LABELS[score.lifecycle_stage];
          const risk = RISK_LABELS[score.risk_level];
          const isExpanded = expandedKeyword === score.keyword;

          return (
            <div key={score.keyword} className="hover:bg-foreground/[0.03] transition-colors">
              <button
                onClick={() => onToggleExpand(isExpanded ? null : score.keyword)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left"
              >
                {/* Opportunity Score */}
                <div className={`w-10 h-10 border border-border flex items-center justify-center font-bold text-sm ${
                  getOpportunityColor(score.opportunity_score)
                }`}>
                  {score.opportunity_score}
                </div>

                {/* Keyword */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-medium truncate">{score.keyword}</span>
                    {score.is_hot && <Flame className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0" />}
                    {score.is_breakout && <Zap className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-foreground/50">{lifecycle.emoji} {lifecycle.label}</span>
                    <span className="text-xs text-foreground/40">{risk.emoji}</span>
                    <span className="text-muted-foreground text-xs">~{score.sustainability_window}d</span>
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
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
          className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground/70 flex items-center justify-center gap-1 border-t border-border"
        >
          {showAll ? "Show Less" : `Show All (${scores.length})`}
          {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function MiniScore({ label, value, inverted }: { label: string; value: number; inverted?: boolean }) {
  const color = value > 60 ? "text-foreground/70" : value > 30 ? "text-foreground/50" : "text-foreground/30";

  return (
    <div className="text-center">
      <div className="text-muted-foreground/40 text-[10px]">{label}</div>
      <div className={`text-xs font-medium ${color}`}>{value}</div>
    </div>
  );
}

function KeywordDetail({ score }: { score: TrendScore }) {
  const breakdown = score.score_breakdown;

  return (
    <div className="px-4 pb-4 space-y-3">
      {/* Score Breakdown */}
      <div className="border border-border p-3">
        <h4 className="text-muted-foreground text-xs font-medium mb-2">Score Breakdown</h4>
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
            color="text-foreground/70"
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
            color="text-foreground/60"
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
            color="text-foreground/50"
          />
          <DetailMetric
            label="Competition"
            value={score.competition_score}
            weight="-0.10"
            details={[
              `Content/creator: ${breakdown.competition.content_per_creator}`,
              `Engagement: ${breakdown.competition.engagement_velocity_raw.toFixed(1)}%`,
            ]}
            color="text-foreground/40"
          />
        </div>
      </div>

      {/* Risk Factors */}
      {score.risk_factors.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <AlertTriangle className="w-3.5 h-3.5 text-foreground/40" />
          {score.risk_factors.map((factor) => (
            <span key={factor} className="text-xs border border-border text-foreground/50 px-2 py-0.5">
              {formatRiskFactor(factor)}
            </span>
          ))}
        </div>
      )}

      {/* Formula */}
      <div className="text-xs text-muted-foreground font-mono bg-background border border-border p-2">
        opportunity = ({score.trend_momentum}×0.35) + ({score.monetization_score}×0.30) + ({score.supply_gap_score}×0.25) - ({score.competition_score}×0.10) = <span className="text-foreground font-bold">{score.opportunity_score}</span>
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
    <div className="border border-border p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="text-muted-foreground/40 text-[10px]">{weight}</span>
      </div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="mt-1 space-y-0.5">
        {details.map((d, i) => (
          <div key={i} className="text-muted-foreground text-[10px]">{d}</div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getOpportunityColor(score: number): string {
  if (score >= 60) return "text-foreground/80";
  if (score >= 40) return "text-foreground/60";
  if (score >= 20) return "text-foreground/40";
  return "text-foreground/25";
}

function getOpportunityBg(score: number): string {
  if (score >= 60) return "bg-foreground/10";
  if (score >= 40) return "bg-foreground/7";
  if (score >= 20) return "bg-foreground/5";
  return "bg-foreground/3";
}

function getLifecycleBgColor(stage: LifecycleStage): string {
  return "bg-foreground/5";
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
  if (!top || top[1] === 0) return "text-muted-foreground";
  return "text-foreground/60";
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
