/**
 * MarketSignalBadge — Market Trend UI Components
 * =================================================
 * Structural monochrome design — no rounded-xl, no colored pills.
 * Data-driven: all content comes from real API fetches, not AI opinions.
 *
 * Components:
 *   - HotBadge: Small structural "Hot" indicator
 *   - MarketFocusCard: Current market focus for a path
 *   - TrendingNichesList: List of trending niches with scores
 *   - PathHeatBadge: Aggregate heat score badge for a path
 */

import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
} from "lucide-react";
import type { PathMarketFocus, MarketSignal } from "@/services/marketSignalService";
import { trendDirectionLabel } from "@/services/marketSignalService";

// ============================================================================
// HOT BADGE — small structural indicator
// ============================================================================

export function HotBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.15em] border border-foreground/20 text-foreground/60 ${className}`}
    >
      HOT
    </span>
  );
}

// ============================================================================
// PATH HEAT BADGE — aggregate heat score for a path
// ============================================================================

export function PathHeatBadge({
  heatScore,
  hotCount,
  compact = false,
}: {
  heatScore: number;
  hotCount: number;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
        <BarChart3 className="w-3 h-3" />
        {heatScore}%
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border">
      <BarChart3 className="w-3.5 h-3.5" />
      <span>Heat {heatScore}%</span>
      {hotCount > 0 && (
        <span className="text-[10px] text-muted-foreground/50">({hotCount} trending)</span>
      )}
    </div>
  );
}

// ============================================================================
// TREND DIRECTION ICON
// ============================================================================

function TrendIcon({ direction, className = "w-3 h-3" }: { direction: string; className?: string }) {
  switch (direction) {
    case "rising":
      return <ArrowUpRight className={`${className} text-foreground/70`} />;
    case "falling":
      return <ArrowDownRight className={`${className} text-muted-foreground/50`} />;
    default:
      return <Minus className={`${className} text-muted-foreground/40`} />;
  }
}

// ============================================================================
// MARKET FOCUS CARD — current market focus for a path (structural)
// ============================================================================

export function MarketFocusCard({
  focus,
  pathTitle,
}: {
  focus: PathMarketFocus;
  pathTitle?: string;
}) {
  return (
    <div className="border border-border">
      {/* Header */}
      <div className="py-3 px-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
            Market focus — Data real
          </p>
        </div>
        <PathHeatBadge heatScore={focus.heat_score} hotCount={focus.hot_count} compact />
      </div>

      {/* Content */}
      <div className="py-4 px-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-semibold text-foreground">{focus.top_keyword}</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <TrendIcon direction={focus.trend_direction} />
            {trendDirectionLabel(focus.trend_direction)} · {Math.round(focus.trend_score * 100)}%
          </span>
        </div>

        {focus.suggestion && (
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            {focus.suggestion}
          </p>
        )}

        {pathTitle && (
          <p className="text-[10px] text-muted-foreground/30 mt-3">
            {pathTitle} · {focus.total_signals} sinyal terpantau
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TRENDING NICHES LIST — all trending signals for a path (structural)
// ============================================================================

export function TrendingNichesList({
  signals,
  maxItems = 5,
}: {
  signals: MarketSignal[];
  maxItems?: number;
}) {
  const displayed = signals.slice(0, maxItems);

  return (
    <div className="border-t border-border">
      {displayed.map((signal, idx) => (
        <div
          key={signal.id || idx}
          className="flex items-center justify-between py-3 px-0 border-b border-border/50"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <TrendIcon direction={signal.trend_direction} className="w-3.5 h-3.5 shrink-0" />
            <span className="text-sm text-foreground/80 truncate">
              {signal.keyword}
            </span>
            {signal.is_hot && <HotBadge />}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Minimal bar */}
            <div className="w-12 h-px bg-border relative">
              <div
                className="absolute top-0 left-0 h-px bg-foreground/40 transition-all"
                style={{ width: `${Math.round(signal.trend_score * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">
              {Math.round(signal.trend_score * 100)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// INLINE HOT INDICATOR — for path cards/lists
// ============================================================================

export function InlineHotIndicator({
  focus,
}: {
  focus: PathMarketFocus | null;
}) {
  if (!focus || focus.hot_count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 font-medium">
      <ArrowUpRight className="w-3 h-3" />
      {focus.hot_count} trending
    </span>
  );
}
