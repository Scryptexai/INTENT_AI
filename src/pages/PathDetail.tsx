/**
 * PathDetail — 30-Day Roadmap (Structural / Data-Driven)
 * ========================================================
 * Architecture: axis-driven monochrome, no cards/glass/rounded-xl.
 * Data: Real market signals from SerpAPI, YouTube, Google Trends
 *       injected into each week's context — NOT AI opinions.
 *
 * Flow:
 *   1. Load user profile + tasks from Supabase
 *   2. Load real market_signals for this path
 *   3. Auto-trigger pipeline if no data exists
 *   4. Render 4-week roadmap with trend context per week
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
  Brain,
  ExternalLink,
  BookOpen,
  Wrench,
  Layout,
  Compass,
  Star,
  Zap,
  Timer,
  Package,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPathTemplate, type PathTemplate, type TaskDetail, type TaskResource } from "@/utils/pathTemplates";
import type { PathId } from "@/utils/profilingConfig";
import { useAuth } from "@/contexts/AuthContext";
import {
  loadActiveProfile,
  loadTaskProgress,
  toggleTaskCompletion,
  loadPreviousCheckpoints,
  computeRiskSignals,
  type SavedProfile,
  type TaskProgress,
  type RiskSignals,
} from "@/services/profileService";
import {
  Day25Warning,
  PivotSuggestion,
  RealityCheck,
  AntiSunkCostCard,
  SwitchPathButton,
} from "@/components/RiskControlBanner";
import {
  getPathMarketFocus,
  loadPathSignals,
  type PathMarketFocus,
  type MarketSignal,
} from "@/services/marketSignalService";
import { runFullPipeline } from "@/services/trendPipelineScheduler";
import { hasAnyDataSource } from "@/services/trendDataFetcher";
import { toast } from "sonner";

// ============================================================================
// HELPERS
// ============================================================================

function TrendIcon({ direction, className = "w-3 h-3" }: { direction: string; className?: string }) {
  switch (direction) {
    case "rising": return <ArrowUpRight className={`${className} text-foreground/70`} />;
    case "falling": return <ArrowDownRight className={`${className} text-muted-foreground/50`} />;
    default: return <Minus className={`${className} text-muted-foreground/40`} />;
  }
}

function resourceIcon(type: TaskResource["type"]) {
  switch (type) {
    case "tool": return <Wrench className="w-3 h-3" />;
    case "template": return <Layout className="w-3 h-3" />;
    case "guide": return <BookOpen className="w-3 h-3" />;
    case "platform": return <Compass className="w-3 h-3" />;
    case "example": return <Star className="w-3 h-3" />;
    default: return <ExternalLink className="w-3 h-3" />;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

const PathDetail = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const path = getPathTemplate(pathId as PathId);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SavedProfile | null>(null);
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [togglingTask, setTogglingTask] = useState<string | null>(null);
  const [riskSignals, setRiskSignals] = useState<RiskSignals | null>(null);
  const [day25Dismissed, setDay25Dismissed] = useState(false);
  const [marketFocus, setMarketFocus] = useState<PathMarketFocus | null>(null);
  const [marketSignals, setMarketSignals] = useState<MarketSignal[]>([]);
  const [fetchingTrends, setFetchingTrends] = useState(false);
  const pipelineTriggered = useRef(false);

  // ── Load data ──
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);

      const savedProfile = await loadActiveProfile(user.id);
      if (savedProfile) {
        setProfile(savedProfile);
        const taskData = await loadTaskProgress(savedProfile.id);
        setTasks(taskData);

        const checkpoints = await loadPreviousCheckpoints(savedProfile.id);
        const signals = computeRiskSignals(savedProfile, taskData, checkpoints);
        setRiskSignals(signals);

        // Load market signals
        const focus = await getPathMarketFocus(savedProfile.primary_path);
        setMarketFocus(focus);
        const pathSignals = await loadPathSignals(savedProfile.primary_path);
        setMarketSignals(pathSignals);

        // AUTO-TRIGGER pipeline if no data exists
        if (!focus && hasAnyDataSource() && !pipelineTriggered.current) {
          pipelineTriggered.current = true;
          setFetchingTrends(true);
          runFullPipeline(savedProfile.primary_path).then(async () => {
            const newFocus = await getPathMarketFocus(savedProfile.primary_path);
            setMarketFocus(newFocus);
            const newSignals = await loadPathSignals(savedProfile.primary_path);
            setMarketSignals(newSignals);
            setFetchingTrends(false);
          }).catch(() => {
            setFetchingTrends(false);
          });
        }
      }

      setLoading(false);
    };

    loadData();
  }, [user]);

  // ── Actions ──
  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  };

  const toggleTaskExpand = (taskKey: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskKey)) next.delete(taskKey);
      else next.add(taskKey);
      return next;
    });
  };

  const getTemplateTaskDetail = (weekNumber: number, taskIndex: number): TaskDetail | null => {
    if (!path) return null;
    const week = path.weeklyPlan.find((w) => w.week === weekNumber);
    if (!week || taskIndex >= week.tasks.length) return null;
    return week.tasks[taskIndex];
  };

  const handleToggleTask = useCallback(
    async (weekNumber: number, taskIndex: number, currentlyCompleted: boolean) => {
      if (!profile) return;
      const taskKey = `${weekNumber}-${taskIndex}`;
      setTogglingTask(taskKey);

      setTasks((prev) =>
        prev.map((t) =>
          t.week_number === weekNumber && t.task_index === taskIndex
            ? { ...t, is_completed: !currentlyCompleted }
            : t
        )
      );

      const { advanced, newWeek } = await toggleTaskCompletion(profile.id, weekNumber, taskIndex, !currentlyCompleted);
      setTogglingTask(null);

      if (advanced && newWeek) {
        setProfile((prev) => prev ? { ...prev, current_week: newWeek } : prev);
        toast.success(`Minggu ${weekNumber} selesai — lanjut ke Minggu ${newWeek}`, {
          duration: 5000,
        });
        setExpandedWeeks((prev) => {
          const next = new Set(prev);
          next.add(newWeek);
          return next;
        });
      }
    },
    [profile]
  );

  // ── Derived ──
  const weeklyTasks: Record<number, Array<{ text: string; completed: boolean; index: number }>> = {};
  if (tasks.length > 0) {
    tasks.forEach((t) => {
      if (!weeklyTasks[t.week_number]) weeklyTasks[t.week_number] = [];
      weeklyTasks[t.week_number].push({
        text: t.task_text,
        completed: t.is_completed,
        index: t.task_index,
      });
    });
  } else if (path) {
    path.weeklyPlan.forEach((week) => {
      weeklyTasks[week.week] = week.tasks.map((task, i) => ({
        text: task.text,
        completed: false,
        index: i,
      }));
    });
  }

  const totalTasks = tasks.length > 0 ? tasks.length : (path?.weeklyPlan.reduce((s, w) => s + w.tasks.length, 0) || 0);
  const completedCount = tasks.length > 0 ? tasks.filter((t) => t.is_completed).length : 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Group signals by relevance to each week (distribute evenly)
  const signalsPerWeek = (week: number): MarketSignal[] => {
    if (marketSignals.length === 0) return [];
    const perWeek = Math.ceil(marketSignals.length / 4);
    const start = (week - 1) * perWeek;
    return marketSignals.slice(start, start + perWeek);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ── Not Found ──
  if (!path) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="relative">
          <div className="absolute left-[10%] md:left-[8%] top-0 bottom-0 w-px bg-border/20" />
          <div className="max-w-[1000px] mx-auto px-6 md:px-10 pt-24 pb-16">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">Error</p>
            <h1 className="text-xl font-semibold mb-4">Path tidak ditemukan</h1>
            <Link to="/onboarding" className="cmd-primary text-xs">
              <ArrowLeft className="w-3 h-3" /> Kembali ke profiling
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Render ──
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16 relative">
        {/* Structural axis */}
        <div className="absolute left-[10%] md:left-[8%] top-0 bottom-0 w-px bg-border/20" />

        <main className="max-w-[1000px] mx-auto px-6 md:px-10 py-8 md:py-12">
          {/* Back nav */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/40 hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-3 h-3" />
            Kembali
          </button>

          {/* ═══════════════════════════════════════════════════════════
              HEADER — Path identity + progress
          ═══════════════════════════════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
                Blueprint 30 hari
              </p>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-1">
                {path.title}
              </h1>
              <p className="text-xs text-muted-foreground/60 max-w-lg leading-relaxed">
                {path.description}
              </p>
              {profile?.current_week && (
                <p className="text-[10px] text-muted-foreground/40 mt-2">
                  Minggu {profile.current_week} dari 4 — {progressPercent}% selesai
                </p>
              )}
            </div>

            {/* Progress bar — structural, thin */}
            <div className="mb-10">
              <div className="w-full h-px bg-border relative">
                <div
                  className="absolute top-0 left-0 h-px bg-foreground/50 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute -top-1 w-2 h-2 bg-foreground border border-background transition-all duration-500"
                  style={{ left: `${progressPercent}%`, transform: "translateX(-50%)" }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-muted-foreground/40">Mulai</span>
                <span className="text-[10px] text-muted-foreground/40">{completedCount}/{totalTasks} tasks</span>
                <span className="text-[10px] text-muted-foreground/40">Selesai</span>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                KEY METRICS — structural row, not colored cards
            ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-3 gap-0 mb-10 border border-border">
              <div className="py-4 px-4 border-r border-border">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Sumber income</p>
                <p className="text-xs font-medium text-foreground/80">{path.moneySource}</p>
              </div>
              <div className="py-4 px-4 border-r border-border">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Waktu test</p>
                <p className="text-xs font-medium text-foreground/80">{path.timeToTest}</p>
              </div>
              <div className="py-4 px-4">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Risiko</p>
                <p className="text-xs font-medium text-foreground/80">{path.riskIfFail}</p>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                MARKET DATA — Real trend signals (NOT AI opinions)
            ═══════════════════════════════════════════════════════ */}
            {fetchingTrends && !marketFocus && (
              <div className="mb-8 py-4 px-5 border border-border flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">Mengambil data market</p>
                  <p className="text-xs text-muted-foreground/70">Fetching Google Trends, YouTube, SerpAPI...</p>
                </div>
              </div>
            )}

            {marketFocus && (
              <div className="mb-8 border border-border">
                <div className="py-3 px-5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
                      Kondisi market saat ini — Data real-time
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/40">
                    {marketFocus.total_signals} sinyal
                  </span>
                </div>
                <div className="py-4 px-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-foreground">{marketFocus.top_keyword}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <TrendIcon direction={marketFocus.trend_direction} />
                      {Math.round(marketFocus.trend_score * 100)}%
                    </span>
                    {marketFocus.hot_count > 0 && (
                      <span className="text-[9px] uppercase tracking-[0.15em] border border-foreground/20 text-foreground/60 px-1.5 py-px">
                        {marketFocus.hot_count} HOT
                      </span>
                    )}
                  </div>
                  {marketFocus.suggestion && (
                    <p className="text-xs text-muted-foreground/60 leading-relaxed">
                      {marketFocus.suggestion}
                    </p>
                  )}
                </div>

                {/* All signals list */}
                {marketSignals.length > 0 && (
                  <div className="border-t border-border">
                    <div className="py-2 px-5">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40">
                        Semua sinyal terpantau
                      </p>
                    </div>
                    {marketSignals.slice(0, 8).map((signal, idx) => (
                      <div
                        key={signal.id || idx}
                        className="flex items-center justify-between py-2.5 px-5 border-t border-border/30"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <TrendIcon direction={signal.trend_direction} className="w-3 h-3 shrink-0" />
                          <span className="text-xs text-foreground/70 truncate">{signal.keyword}</span>
                          {signal.is_hot && (
                            <span className="text-[9px] uppercase tracking-wider border border-foreground/15 text-foreground/50 px-1 py-px">HOT</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-10 h-px bg-border relative">
                            <div className="absolute top-0 left-0 h-px bg-foreground/30" style={{ width: `${Math.round(signal.trend_score * 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground/50 w-7 text-right">
                            {Math.round(signal.trend_score * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No data state */}
            {!fetchingTrends && !marketFocus && (
              <div className="mb-8 py-4 px-5 border border-border/50">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/30 mb-1">Data market</p>
                <p className="text-xs text-muted-foreground/50">
                  Belum ada data trend. Buka Dashboard untuk trigger pipeline, atau pastikan API keys sudah dikonfigurasi.
                </p>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                AI ANALYSIS — from profiling (labeled clearly)
            ═══════════════════════════════════════════════════════ */}
            {profile?.ai_why_text && (
              <div className="mb-8 py-5 px-5 border border-border">
                <div className="flex items-start gap-3">
                  <Brain className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">Analisis profil</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{profile.ai_why_text}</p>
                  </div>
                </div>
              </div>
            )}

            {profile?.ai_niche_suggestion && (
              <div className="mb-8 py-5 px-5 border border-border">
                <div className="flex items-start gap-3">
                  <Zap className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">Rekomendasi niche</p>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{profile.ai_niche_suggestion}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                30-DAY ROADMAP — Structural, data-driven
            ═══════════════════════════════════════════════════════ */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">
                    Roadmap 30 hari
                  </p>
                  {tasks.length > 0 && (
                    <p className="text-[10px] text-muted-foreground/30">
                      AI-personalized berdasarkan profil
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-0">
                {path.weeklyPlan.map((week) => {
                  const isExpanded = expandedWeeks.has(week.week);
                  const wTasks = weeklyTasks[week.week] || [];
                  const weekCompleted = wTasks.filter((t) => t.completed).length;
                  const weekTotal = wTasks.length;
                  const weekDone = weekCompleted === weekTotal && weekTotal > 0;
                  const weekSignals = signalsPerWeek(week.week);
                  const isCurrentWeek = profile?.current_week === week.week;

                  return (
                    <div key={week.week} className="border border-border mb-[-1px]">
                      {/* Week header */}
                      <button
                        onClick={() => toggleWeek(week.week)}
                        className="w-full flex items-center justify-between py-4 px-5 text-left hover:bg-muted/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] uppercase tracking-[0.15em] font-semibold w-14 ${
                            weekDone ? "text-foreground/40" : isCurrentWeek ? "text-foreground" : "text-muted-foreground/50"
                          }`}>
                            W{week.week}
                          </span>
                          <div>
                            <span className={`text-sm font-medium ${weekDone ? "text-foreground/40" : "text-foreground/80"}`}>
                              {week.title}
                            </span>
                            {isCurrentWeek && (
                              <span className="ml-2 text-[9px] uppercase tracking-[0.15em] border border-foreground/20 text-foreground/60 px-1.5 py-px">
                                AKTIF
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {weekSignals.length > 0 && (
                            <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {weekSignals.length} trend
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground/40">
                            {weekCompleted}/{weekTotal}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/30" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
                          )}
                        </div>
                      </button>

                      {/* Week content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-border">
                              {/* Trend context for this week (REAL DATA) */}
                              {weekSignals.length > 0 && (
                                <div className="py-3 px-5 border-b border-border/50">
                                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-2">
                                    Konteks market minggu ini — data real
                                  </p>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    {weekSignals.map((s, si) => (
                                      <span key={si} className="inline-flex items-center gap-1.5 text-xs text-foreground/60">
                                        <TrendIcon direction={s.trend_direction} className="w-3 h-3" />
                                        {s.keyword}
                                        <span className="text-[10px] text-muted-foreground/40">
                                          {Math.round(s.trend_score * 100)}%
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                  {weekSignals[0]?.suggestion && (
                                    <p className="text-[10px] text-muted-foreground/50 mt-1.5 leading-relaxed">
                                      {weekSignals[0].suggestion}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Tasks */}
                              <div className="divide-y divide-border/30">
                                {wTasks.map((task) => {
                                  const taskKey = `${week.week}-${task.index}`;
                                  const isToggling = togglingTask === taskKey;
                                  const isTaskExpanded = expandedTasks.has(taskKey);
                                  const detail = getTemplateTaskDetail(week.week, task.index);

                                  return (
                                    <div key={taskKey}>
                                      {/* Task row */}
                                      <div className="flex items-start gap-3 py-3.5 px-5">
                                        <button
                                          onClick={() => handleToggleTask(week.week, task.index, task.completed)}
                                          disabled={isToggling}
                                          className={`mt-0.5 shrink-0 transition-opacity ${isToggling ? "opacity-30" : ""}`}
                                        >
                                          {task.completed ? (
                                            <CheckCircle2 className="w-4 h-4 text-foreground/40" />
                                          ) : (
                                            <Circle className="w-4 h-4 text-muted-foreground/30 hover:text-foreground/50 transition-colors" />
                                          )}
                                        </button>

                                        <div
                                          className="flex-1 cursor-pointer min-w-0"
                                          onClick={() => detail && toggleTaskExpand(taskKey)}
                                        >
                                          <span className={`text-sm leading-snug ${
                                            task.completed ? "line-through text-muted-foreground/30" : "text-foreground/80"
                                          }`}>
                                            {task.text}
                                          </span>

                                          {detail && (
                                            <div className="flex items-center gap-3 mt-1.5">
                                              <span className="text-[10px] text-muted-foreground/30 flex items-center gap-1">
                                                <Timer className="w-2.5 h-2.5" />
                                                {detail.time_estimate}
                                              </span>
                                              <span className="text-[10px] text-muted-foreground/30">
                                                {detail.difficulty}
                                              </span>
                                              {!isTaskExpanded && (
                                                <span className="text-[10px] text-muted-foreground/20 ml-auto">
                                                  detail →
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {detail && (
                                          <button onClick={() => toggleTaskExpand(taskKey)} className="shrink-0 mt-0.5">
                                            {isTaskExpanded ? (
                                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/30" />
                                            ) : (
                                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
                                            )}
                                          </button>
                                        )}
                                      </div>

                                      {/* Expanded detail */}
                                      <AnimatePresence>
                                        {isTaskExpanded && detail && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="px-5 pb-4 ml-7 space-y-3">
                                              {/* Action guide */}
                                              <div className="py-3 px-4 border-l-2 border-border">
                                                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1.5 flex items-center gap-1">
                                                  <BookOpen className="w-3 h-3" /> Langkah aksi
                                                </p>
                                                <p className="text-xs text-foreground/60 leading-relaxed whitespace-pre-line">
                                                  {detail.action_guide}
                                                </p>
                                              </div>

                                              {/* Deliverable */}
                                              <div className="py-3 px-4 border-l-2 border-border">
                                                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1 flex items-center gap-1">
                                                  <Package className="w-3 h-3" /> Deliverable
                                                </p>
                                                <p className="text-xs text-foreground/60">{detail.deliverable}</p>
                                              </div>

                                              {/* Resources */}
                                              {detail.resources.length > 0 && (
                                                <div>
                                                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-2 flex items-center gap-1">
                                                    <ExternalLink className="w-3 h-3" /> Resources
                                                  </p>
                                                  <div className="flex flex-wrap gap-2">
                                                    {detail.resources.map((res, ri) => (
                                                      <a
                                                        key={ri}
                                                        href={res.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-[10px] text-muted-foreground/60 hover:text-foreground hover:border-foreground/20 transition-all"
                                                      >
                                                        {resourceIcon(res.type)}
                                                        {res.label}
                                                      </a>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                WHAT TO AVOID — structural
            ═══════════════════════════════════════════════════════ */}
            <div className="mb-8 border border-border">
              <div className="py-3 px-5 border-b border-border">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
                  Yang harus diabaikan
                </p>
              </div>
              <div className="py-4 px-5 space-y-2">
                {path.avoid.map((item, i) => (
                  <p key={i} className="text-xs text-muted-foreground/50 flex items-start gap-2">
                    <span className="text-muted-foreground/20 mt-px">✕</span>
                    {item}
                  </p>
                ))}
              </div>
            </div>

            {/* Examples */}
            <div className="mb-8 border border-border">
              <div className="py-3 px-5 border-b border-border">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
                  Contoh yang bisa dimulai
                </p>
              </div>
              <div className="py-4 px-5 flex flex-wrap gap-2">
                {path.examples.map((ex, i) => (
                  <span key={i} className="px-3 py-1.5 border border-border text-xs text-foreground/60">
                    {ex}
                  </span>
                ))}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                RISK SIGNALS
            ═══════════════════════════════════════════════════════ */}
            {riskSignals && (
              <div className="space-y-4 mb-8">
                {riskSignals.isDay25Warning && !day25Dismissed && (
                  <Day25Warning
                    daysSinceStart={riskSignals.daysSinceStart}
                    onDismiss={() => setDay25Dismissed(true)}
                  />
                )}
                {riskSignals.shouldSuggestPivot && (
                  <PivotSuggestion
                    noMarketWeeks={riskSignals.noMarketWeeks}
                    alternatePath={profile?.alternate_path}
                    onSwitchPath={() => navigate("/onboarding")}
                  />
                )}
                {riskSignals.isRealityCheckWeek && (
                  <RealityCheck
                    currentWeek={riskSignals.currentWeek}
                    completionRate={riskSignals.completionRate}
                    hasAnyMarketResponse={riskSignals.hasAnyMarketResponse}
                    daysSinceStart={riskSignals.daysSinceStart}
                  />
                )}
                {profile && profile.current_week >= 2 && (
                  <AntiSunkCostCard weekNumber={profile.current_week} />
                )}
                {profile && profile.current_week >= 2 && (
                  <SwitchPathButton
                    onSwitch={() => navigate("/onboarding")}
                    alternatePath={profile.alternate_path}
                  />
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                ACTIONS
            ═══════════════════════════════════════════════════════ */}
            <div className="pt-6 border-t border-border">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-4">
                Aksi
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/dashboard" className="cmd-primary text-xs">
                  Dashboard
                </Link>
                <button
                  onClick={() => navigate("/workspace")}
                  className="cmd-ghost text-xs"
                >
                  <Zap className="w-3 h-3" /> Workspace
                </button>
                <button
                  onClick={() => navigate("/onboarding")}
                  className="cmd-ghost text-xs"
                >
                  <RotateCcw className="w-3 h-3" /> Profiling Ulang
                </button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PathDetail;
