/**
 * Dashboard — User's personal mission control
 * ==============================================
 * Data source: Supabase (NOT localStorage)
 * Shows: active path, progress, AI insights, weekly checkpoint
 */

import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Map, CalendarCheck, RotateCcw, LogOut, Loader2,
  CheckCircle2, Circle, ChevronRight, Compass, Settings, CreditCard,
  Brain, Sparkles, MessageSquare, Crown, Zap,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPathTemplate } from "@/utils/pathTemplates";
import type { PathTemplate } from "@/utils/pathTemplates";
import type { PathId } from "@/utils/profilingConfig";
import {
  loadActiveProfile,
  loadTaskProgress,
  resetProfile,
  saveWeeklyCheckpoint,
  loadPreviousCheckpoints,
  computeRiskSignals,
  type SavedProfile,
  type TaskProgress,
  type AdaptationResult,
  type CheckpointHistory,
  type RiskSignals,
} from "@/services/profileService";
import { canUseAIWeeklyFeedback, canReprofile, type PlanType } from "@/services/planGating";
import UpgradePrompt from "@/components/UpgradePrompt";
import {
  Day25Warning,
  PivotSuggestion,
  RealityCheck,
  AntiSunkCostCard,
  SwitchPathButton,
} from "@/components/RiskControlBanner";
import {
  getPathMarketFocus,
  type PathMarketFocus,
} from "@/services/marketSignalService";
import { MarketFocusCard, PathHeatBadge } from "@/components/MarketSignalBadge";
import { runFullPipeline } from "@/services/trendPipelineScheduler";
import { hasAnyDataSource } from "@/services/trendDataFetcher";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", key: "overview" },
  { icon: Zap, label: "Workspace", key: "workspace" },
  { icon: Map, label: "Jalur Saya", key: "path" },
  { icon: CalendarCheck, label: "Weekly Plan", key: "weekly" },
  { icon: MessageSquare, label: "Checkpoint", key: "checkpoint" },
  { icon: Settings, label: "Settings", key: "settings" },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [pathData, setPathData] = useState<PathTemplate | null>(null);
  const [tasks, setTasks] = useState<TaskProgress[]>([]);

  // Checkpoint state
  const [checkpointStatus, setCheckpointStatus] = useState<"on_track" | "stuck" | "ahead">("on_track");
  const [stuckArea, setStuckArea] = useState("");
  const [marketResponse, setMarketResponse] = useState<boolean | null>(null);
  const [checkpointFeedback, setCheckpointFeedback] = useState("");
  const [submittingCheckpoint, setSubmittingCheckpoint] = useState(false);
  const [adaptationResult, setAdaptationResult] = useState<AdaptationResult | null>(null);
  const [checkpointHistory, setCheckpointHistory] = useState<CheckpointHistory[]>([]);
  const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);
  const [riskSignals, setRiskSignals] = useState<RiskSignals | null>(null);
  const [day25Dismissed, setDay25Dismissed] = useState(false);
  const [marketFocus, setMarketFocus] = useState<PathMarketFocus | null>(null);
  const [fetchingTrends, setFetchingTrends] = useState(false);
  const pipelineTriggered = useRef(false);

  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const profileData = await loadActiveProfile(user.id);
      if (profileData) {
        setSavedProfile(profileData);
        const template = getPathTemplate(profileData.primary_path as PathId);
        setPathData(template || null);

        const taskData = await loadTaskProgress(profileData.id);
        setTasks(taskData);

        // Load checkpoint history
        const history = await loadPreviousCheckpoints(profileData.id);
        setCheckpointHistory(history);

        // Compute risk signals
        const signals = computeRiskSignals(profileData, taskData, history);
        setRiskSignals(signals);

        // Load market focus for this path
        const focus = await getPathMarketFocus(profileData.primary_path);
        setMarketFocus(focus);

        // AUTO-TRIGGER: If no market data exists AND APIs are configured,
        // fetch real trend data in the background (first visit after onboarding)
        if (!focus && hasAnyDataSource() && !pipelineTriggered.current) {
          pipelineTriggered.current = true;
          setFetchingTrends(true);
          // Run in background — don't block dashboard load
          runFullPipeline(profileData.primary_path).then(async () => {
            // Re-load market focus after pipeline finishes
            const newFocus = await getPathMarketFocus(profileData.primary_path);
            setMarketFocus(newFocus);
            setFetchingTrends(false);
          }).catch(() => {
            setFetchingTrends(false);
          });
        }

        // If there's a recent checkpoint with feedback, show it
        const currentCheckpoint = history.find(cp => cp.week_number === profileData.current_week);
        if (currentCheckpoint?.ai_feedback) {
          setCheckpointFeedback(currentCheckpoint.ai_feedback);
          if (currentCheckpoint.system_adjustment) {
            setAdaptationResult({
              adjustment: currentCheckpoint.system_adjustment as AdaptationResult["adjustment"],
              reason: "",
              suggestion: "",
            });
          }
        }
      }

      setLoading(false);
    };

    loadData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleResetProfile = async () => {
    if (!user) return;
    const userPlan = (profile?.plan || "free") as PlanType;
    const gate = await canReprofile(user.id, userPlan);
    if (!gate.allowed) {
      setUpgradeFeature(gate.upgradeFeature || "unlimited_reprofiling");
      return;
    }
    await resetProfile(user.id);
    setSavedProfile(null);
    setPathData(null);
    setTasks([]);
    navigate("/onboarding");
  };

  const handleSubmitCheckpoint = useCallback(async () => {
    if (!user || !savedProfile) return;

    // CHECK: Can user use AI weekly feedback?
    const userPlan = (profile?.plan || "free") as PlanType;
    const gate = canUseAIWeeklyFeedback(userPlan);
    if (!gate.allowed) {
      setUpgradeFeature(gate.upgradeFeature || "ai_weekly_feedback");
      return;
    }

    setSubmittingCheckpoint(true);

    const completionRate = tasks.length > 0
      ? tasks.filter((t) => t.is_completed).length / tasks.length
      : 0;

    const { feedback, adaptation } = await saveWeeklyCheckpoint(
      user.id,
      savedProfile.id,
      savedProfile.current_week,
      completionRate,
      checkpointStatus,
      stuckArea || undefined,
      marketResponse ?? undefined
    );

    setCheckpointFeedback(feedback);
    setAdaptationResult(adaptation);
    setSubmittingCheckpoint(false);
  }, [user, savedProfile, profile, tasks, checkpointStatus, stuckArea, marketResponse]);

  const progress = useMemo(() => {
    if (!pathData || tasks.length === 0) return { total: 0, done: 0, percent: 0, currentWeek: savedProfile?.current_week || 1 };

    const total = tasks.length;
    const done = tasks.filter((t) => t.is_completed).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percent, currentWeek: savedProfile?.current_week || 1 };
  }, [pathData, tasks, savedProfile]);

  // Get tasks for current week
  const currentWeekTasks = useMemo(() => {
    return tasks.filter((t) => t.week_number === progress.currentWeek);
  }, [tasks, progress.currentWeek]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!savedProfile || !pathData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="relative">
          <div className="absolute left-[10%] md:left-[15%] top-0 bottom-0 w-px bg-border/30" />
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-16">
            <div className="ml-[10%] md:ml-[15%] pl-8 md:pl-12 border-l border-border/30">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-8">
                  Belum terkalibrasi
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
                  Sistem butuh data Anda.
                </h1>
                <p className="text-sm text-muted-foreground mb-8 max-w-md leading-relaxed">
                  Tanpa profiling, tidak ada arah yang bisa diberikan.
                  Jawab beberapa pertanyaan untuk memulai kalibrasi.
                </p>
                <Link to="/onboarding" className="cmd-primary group">
                  Mulai Kalibrasi
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 relative">
        {/* Structural axis */}
        <div className="absolute left-[10%] md:left-[8%] top-0 bottom-0 w-px bg-border/20" />

        {/* Context switch strip — state-based nav, not a sidebar */}
        <div className="sticky top-12 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.key === "workspace") {
                      navigate("/workspace");
                    } else {
                      setActiveTab(item.key);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-wider whitespace-nowrap border-b-2 transition-all duration-150 ${
                    activeTab === item.key
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content — no sidebar, axis-aligned */}
        <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 md:py-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Status header — not greeting, system state */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
                  Jalur aktif
                </p>
                <h1 className="text-xl md:text-2xl font-semibold text-foreground">
                  {pathData.title}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Minggu {progress.currentWeek} dari 4 — {progress.percent}% selesai
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={handleResetProfile} className="cmd-ghost text-xs">
                  <RotateCcw className="w-3 h-3" /> Ubah Jalur
                </button>
                <button onClick={handleSignOut} className="cmd-ghost text-xs text-muted-foreground/50">
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              </div>
            </div>

            {/* Progress bar — structural, thin */}
            <div className="mb-10">
              <div className="w-full h-px bg-border relative">
                <div
                  className="absolute top-0 left-0 h-px bg-foreground/50 transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
                <div
                  className="absolute -top-1 w-2 h-2 bg-foreground border border-background transition-all duration-500"
                  style={{ left: `${progress.percent}%`, transform: "translateX(-50%)" }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-muted-foreground/40">Mulai</span>
                <span className="text-[10px] text-muted-foreground/40">{progress.done}/{progress.total} tasks</span>
                <span className="text-[10px] text-muted-foreground/40">Selesai</span>
              </div>
            </div>

            {/* Workspace link — subtle, not a banner */}
            <div className="mb-8">
              <button
                onClick={() => navigate("/workspace")}
                className="w-full flex items-center justify-between py-4 px-5 border border-border hover:border-foreground/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-xs font-medium text-foreground">Execution Workspace</p>
                    <p className="text-[10px] text-muted-foreground/60">Generate konten, eksekusi blueprint</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground transition-all" />
              </button>
            </div>

              {/* AI Insight — structural panel, not card */}
              {savedProfile.ai_why_text && (
                <div className="mb-8 py-5 px-5 border border-border">
                  <div className="flex items-start gap-3">
                    <Brain className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">Analisis sistem</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{savedProfile.ai_why_text}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Market Focus — Real trending data for this path */}
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.39 }} className="mb-8">
                  <MarketFocusCard focus={marketFocus} pathTitle={pathData.title} />
                </motion.div>
              )}

              {/* Risk Control Banners */}
              {riskSignals && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} className="space-y-4 mb-8">
                  {/* Day 25 Warning */}
                  {riskSignals.isDay25Warning && !day25Dismissed && (
                    <Day25Warning
                      daysSinceStart={riskSignals.daysSinceStart}
                      onDismiss={() => setDay25Dismissed(true)}
                    />
                  )}

                  {/* Pivot Suggestion */}
                  {riskSignals.shouldSuggestPivot && (
                    <PivotSuggestion
                      noMarketWeeks={riskSignals.noMarketWeeks}
                      alternatePath={savedProfile?.alternate_path}
                      onSwitchPath={handleResetProfile}
                    />
                  )}

                  {/* Reality Check — week 3-4 */}
                  {riskSignals.isRealityCheckWeek && (
                    <RealityCheck
                      currentWeek={riskSignals.currentWeek}
                      completionRate={riskSignals.completionRate}
                      hasAnyMarketResponse={riskSignals.hasAnyMarketResponse}
                      daysSinceStart={riskSignals.daysSinceStart}
                    />
                  )}

                  {/* Anti-Sunk Cost — show from week 2+ */}
                  {riskSignals.currentWeek >= 2 && (
                    <AntiSunkCostCard weekNumber={riskSignals.currentWeek} />
                  )}
                </motion.div>
              )}

              {/* Niche Recommendation — subtle panel */}
              {savedProfile.ai_niche_suggestion && (
                <div className="mb-8 py-5 px-5 border border-border">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">Rekomendasi niche</p>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{savedProfile.ai_niche_suggestion}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Week Tasks — structured list, not cards */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
                    Minggu {progress.currentWeek} — Tasks
                  </p>
                  <Link to={`/path/${pathData.id}`} className="text-[10px] uppercase tracking-wider text-muted-foreground/40 hover:text-foreground transition-colors">
                    Lihat semua →
                  </Link>
                </div>
                <div className="space-y-0 border-t border-border">
                  {currentWeekTasks.length > 0
                    ? currentWeekTasks.map((task, ti) => (
                        <div key={ti} className={`flex items-start gap-3 py-3 border-b border-border/50 ${task.is_completed ? "opacity-40" : ""}`}>
                          {task.is_completed ? (
                            <CheckCircle2 className="w-4 h-4 text-foreground/40 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${task.is_completed ? "line-through text-muted-foreground" : "text-foreground/80"}`}>
                            {task.task_text}
                          </span>
                        </div>
                      ))
                    : pathData.weeklyPlan[progress.currentWeek - 1]?.tasks.map((task, ti) => (
                        <div key={ti} className="flex items-start gap-3 py-3 border-b border-border/50">
                          <Circle className="w-4 h-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground/80">{task.text}</span>
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* Weekly Checkpoint */}
              {/* Weekly Checkpoint — structural panel */}
              <div className="mb-8 border border-border">
                <div className="py-4 px-5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
                      Checkpoint — Minggu {progress.currentWeek}
                    </p>
                  </div>
                </div>

                <div className="py-5 px-5">
                  {checkpointFeedback ? (
                    <div className="space-y-5">
                      {/* Adaptation Signal */}
                      {adaptationResult && adaptationResult.adjustment !== "continue" && (
                        <div className="py-4 px-4 border-l-2 border-foreground/30">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
                            {adaptationResult.adjustment === "pivot_path" ? "Sinyal: Pivot jalur" :
                             adaptationResult.adjustment === "simplify" ? "Sinyal: Simplifikasi" :
                             adaptationResult.adjustment === "accelerate" ? "Sinyal: Akselerasi" : "Sinyal: Adjust niche"}
                          </p>
                          <p className="text-sm text-foreground/70 leading-relaxed">{adaptationResult.suggestion}</p>
                          {adaptationResult.adjustment === "pivot_path" && (
                            <button
                              onClick={handleResetProfile}
                              className="mt-3 cmd-ghost text-xs"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Re-profiling
                            </button>
                          )}
                        </div>
                      )}

                      {/* AI Feedback */}
                      <div className="flex items-start gap-3">
                        <Brain className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">Feedback sistem</p>
                          <p className="text-sm text-foreground/80 leading-relaxed">{checkpointFeedback}</p>
                        </div>
                      </div>

                      {/* Checkpoint History */}
                      {checkpointHistory.length > 1 && (
                        <div className="pt-4 border-t border-border/50">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-3">
                            Histori
                          </p>
                          <div className="flex gap-3">
                            {checkpointHistory.map((cp) => (
                              <div key={cp.week_number} className="text-center">
                                <div className="text-[10px] text-muted-foreground/40 mb-1">W{cp.week_number}</div>
                                <div className={`text-xs font-medium ${
                                  cp.completion_rate >= 0.9 ? "text-foreground" :
                                  cp.completion_rate >= 0.5 ? "text-muted-foreground" :
                                  "text-muted-foreground/40"
                                }`}>
                                  {Math.round(cp.completion_rate * 100)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Status selection */}
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-3">
                          Status progress
                        </p>
                        <div className="flex gap-2">
                          {(["on_track", "stuck", "ahead"] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => setCheckpointStatus(status)}
                              className={`px-4 py-2 text-xs transition-all border ${
                                checkpointStatus === status
                                  ? "border-foreground text-foreground"
                                  : "border-border text-muted-foreground hover:border-foreground/30"
                              }`}
                            >
                              {status === "on_track" ? "On Track" : status === "stuck" ? "Stuck" : "Ahead"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stuck detail */}
                      {checkpointStatus === "stuck" && (
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">
                            Area yang stuck
                          </p>
                          <input
                            type="text"
                            value={stuckArea}
                            onChange={(e) => setStuckArea(e.target.value)}
                            placeholder="e.g. Cari niche, belum ada client..."
                            className="w-full px-4 py-2.5 bg-transparent border border-border text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/30"
                          />
                        </div>
                      )}

                      {/* Market response */}
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-3">
                          Respon market
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setMarketResponse(true)}
                            className={`px-4 py-2 text-xs transition-all border ${
                              marketResponse === true ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:border-foreground/30"
                            }`}
                          >
                            Sudah ada
                          </button>
                          <button
                            onClick={() => setMarketResponse(false)}
                            className={`px-4 py-2 text-xs transition-all border ${
                              marketResponse === false ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:border-foreground/30"
                            }`}
                          >
                            Belum
                          </button>
                        </div>
                      </div>

                      {/* Submit */}
                      <button
                        onClick={handleSubmitCheckpoint}
                        disabled={submittingCheckpoint}
                        className="cmd-primary text-xs disabled:opacity-40"
                      >
                        {submittingCheckpoint ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Menganalisis...
                          </>
                        ) : (
                          <>
                            <Brain className="w-3.5 h-3.5" />
                            Submit Checkpoint
                          </>
                        )}
                      </button>

                      {/* Upgrade Prompt */}
                      {upgradeFeature && (
                        <div className="mt-3">
                          <UpgradePrompt
                            feature={upgradeFeature}
                            compact
                            onDismiss={() => setUpgradeFeature(null)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions — commands, not marketing buttons */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-4">
                  Aksi
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to={`/path/${pathData.id}`} className="cmd-primary text-xs">
                    <Map className="w-3.5 h-3.5" /> Lihat Blueprint 30 Hari
                  </Link>
                  <button onClick={handleResetProfile} className="cmd-ghost text-xs">
                    <RotateCcw className="w-3.5 h-3.5" /> Ubah Jalur
                  </button>
                </div>

                {savedProfile && savedProfile.current_week >= 2 && (
                  <div className="mt-4">
                    <SwitchPathButton
                      onSwitch={handleResetProfile}
                      alternatePath={savedProfile.alternate_path}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </main>
        </div>
      </div>
  );
};

export default Dashboard;
