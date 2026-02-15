/**
 * Dashboard — Unified Workspace Command Center
 * ===============================================
 * Single-page workspace: roadmap + market data + generators + tasks.
 * After profiling → user lands HERE directly.
 * No intermediate result page. Everything in one place.
 *
 * Design: structural monochrome, axis-driven, no cards/glass.
 */

import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Map, RotateCcw, LogOut, Loader2,
  CheckCircle2, Circle, ChevronRight, ChevronDown,
  Brain, Sparkles, MessageSquare, Zap, Copy, Check, RefreshCw,
  ExternalLink, BookOpen, Wrench, Layout, Compass, Star,
  ArrowUpRight, ArrowDownRight, Minus, CalendarCheck, Search,
  Info, Globe,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPathTemplate } from "@/utils/pathTemplates";
import type { PathTemplate, TaskDetail, TaskResource } from "@/utils/pathTemplates";
import type { PathId } from "@/utils/profilingConfig";
import {
  loadActiveProfile,
  loadTaskProgress,
  toggleTaskCompletion,
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
  loadPathSignals,
  type PathMarketFocus,
  type MarketSignal,
} from "@/services/marketSignalService";
import { MarketFocusCard } from "@/components/MarketSignalBadge";
import { runFullPipeline } from "@/services/trendPipelineScheduler";
import { hasAnyDataSource } from "@/services/trendDataFetcher";
import {
  generateContent,
  getAvailableGenerators,
  GENERATOR_LABELS,
  type GeneratorType,
  type GeneratorInput,
} from "@/services/workspaceGenerator";
import { type JobResearchResult } from "@/services/jobResearchEngine";
import {
  buildCompanionContext,
  companionAICall,
  decodeLabel,
  decodeAllLabels,
  type CompanionContext,
} from "@/services/aiCompanion";
import ContentCalendarView from "@/components/ContentCalendar";
import TrendIntelligenceDashboard from "@/components/TrendIntelligenceDashboard";
import ProfileUpgradePrompt from "@/components/ProfileUpgradePrompt";
import { shouldShowUpgradePrompt } from "@/utils/quickProfileConfig";
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

// Decode raw profile keys to human-readable labels
function humanizeKey(key: string): string {
  const MAP: Record<string, string> = {
    skill_service: "Jual Skill & Jasa", audience_based: "Bangun Audience", digital_product: "Produk Digital",
    commerce_arbitrage: "Jualan & Arbitrase", data_research: "Riset & Data", automation_builder: "Otomasi & Sistem",
    writing: "Writing", design: "Design", video: "Video Production", development: "Development",
    marketing: "Marketing", ai_operator: "AI Operator", content_creator: "Content Creator",
    micro_influencer: "Micro Influencer", niche_page: "Niche Page", community_builder: "Community Builder",
    ebook: "Ebook", template: "Template", prompt_pack: "Prompt Pack", course_mini: "Mini Course",
    dropship: "Dropship", affiliate: "Affiliate", trend_researcher: "Trend Researcher",
    newsletter_writer: "Newsletter Writer", ai_curator: "AI Curator", nocode_builder: "NoCode Builder",
    ai_workflow: "AI Workflow", tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube",
    twitter_x: "Twitter/X", linkedin: "LinkedIn", substack: "Substack", fiverr: "Fiverr",
    upwork: "Upwork", gumroad: "Gumroad", shopee: "Shopee", own_website: "Website Sendiri",
  };
  return MAP[key] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
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
// TAB NAV
// ============================================================================

const tabs = [
  { icon: LayoutDashboard, label: "Overview", key: "overview", hint: "Ringkasan profil & progress kamu" },
  { icon: Search, label: "Job Match", key: "job_research", hint: "Riset pekerjaan cocok dari data internet" },
  { icon: Map, label: "Roadmap", key: "roadmap", hint: "Rencana aksi 30 hari, minggu per minggu" },
  { icon: Zap, label: "Generator", key: "generator", hint: "Buat konten personal sesuai profil" },
  { icon: CalendarCheck, label: "Kalender", key: "calendar", hint: "Jadwal konten & trend intelligence" },
  { icon: MessageSquare, label: "Checkpoint", key: "checkpoint", hint: "Evaluasi mingguan & feedback AI" },
];

// ============================================================================
// COMPONENT
// ============================================================================

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [pathData, setPathData] = useState<PathTemplate | null>(null);
  const [tasks, setTasks] = useState<TaskProgress[]>([]);

  // Roadmap
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [togglingTask, setTogglingTask] = useState<string | null>(null);

  // Checkpoint
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
  const [marketSignals, setMarketSignals] = useState<MarketSignal[]>([]);
  const [fetchingTrends, setFetchingTrends] = useState(false);
  const pipelineTriggered = useRef(false);

  // Generator
  const [activeGenerator, setActiveGenerator] = useState<GeneratorType | null>(null);
  const [generatorInput, setGeneratorInput] = useState("");
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [trendBrief, setTrendBrief] = useState("");

  // Job Research (Layer 2)
  const [jobResearch, setJobResearch] = useState<JobResearchResult | null>(null);

  // AI Companion (personal context for all AI calls)
  const [companionCtx, setCompanionCtx] = useState<CompanionContext | null>(null);

  // Profile upgrade prompt (Level 2)
  const [upgradePromptDismissed, setUpgradePromptDismissed] = useState(false);

  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Profile context
  const answerTags = (savedProfile as any)?.answer_tags as Record<string, string> || {};
  const niche = answerTags.niche || answerTags.interest_market || "general";
  const subSector = answerTags.sub_sector || "general";
  const platform = answerTags.platform || answerTags.preferred_platform || "instagram";
  const economicModel = answerTags.economic_model || "skill_service";
  const availableGenerators = getAvailableGenerators(economicModel);

  // ── Load all data ──
  useEffect(() => {
    const loadData = async () => {
      if (!user) { setLoading(false); return; }

      const profileData = await loadActiveProfile(user.id);
      if (profileData) {
        setSavedProfile(profileData);
        const template = getPathTemplate(profileData.primary_path as PathId);
        setPathData(template || null);

        const taskData = await loadTaskProgress(profileData.id);
        setTasks(taskData);

        if (profileData.current_week) {
          setExpandedWeeks(new Set([profileData.current_week]));
        }

        const history = await loadPreviousCheckpoints(profileData.id);
        setCheckpointHistory(history);
        const signals = computeRiskSignals(profileData, taskData, history);
        setRiskSignals(signals);

        const focus = await getPathMarketFocus(profileData.primary_path);
        setMarketFocus(focus);
        const pathSignals = await loadPathSignals(profileData.primary_path);
        setMarketSignals(pathSignals);

        if (!focus && hasAnyDataSource() && !pipelineTriggered.current) {
          pipelineTriggered.current = true;
          setFetchingTrends(true);
          runFullPipeline(profileData.primary_path).then(async () => {
            const newFocus = await getPathMarketFocus(profileData.primary_path);
            setMarketFocus(newFocus);
            const ns = await loadPathSignals(profileData.primary_path);
            setMarketSignals(ns);
            setFetchingTrends(false);
          }).catch(() => setFetchingTrends(false));
        }

        const currentCp = history.find(cp => cp.week_number === profileData.current_week);
        if (currentCp?.ai_feedback) {
          setCheckpointFeedback(currentCp.ai_feedback);
          if (currentCp.system_adjustment) {
            setAdaptationResult({
              adjustment: currentCp.system_adjustment as AdaptationResult["adjustment"],
              reason: "", suggestion: "",
            });
          }
        }
      }

      // Load companion context (includes job research from Supabase)
      try {
        const ctx = await buildCompanionContext(user.id);
        if (ctx) {
          setCompanionCtx(ctx);
          if (ctx.jobResearch) {
            setJobResearch(ctx.jobResearch);
          }
        }
      } catch (e) {
        console.warn("Failed to build companion context:", e);
        // Fallback: load job research from localStorage
        try {
          const jobResearchStr = localStorage.getItem("intent_job_research");
          if (jobResearchStr) {
            setJobResearch(JSON.parse(jobResearchStr));
          }
        } catch { /* ignore parse errors */ }
      }

      setLoading(false);
    };
    loadData();
  }, [user]);

  // ── Actions ──
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const handleResetProfile = async () => {
    if (!user) return;
    const userPlan = (profile?.plan || "free") as PlanType;
    const gate = await canReprofile(user.id, userPlan);
    if (!gate.allowed) { setUpgradeFeature(gate.upgradeFeature || "unlimited_reprofiling"); return; }
    await resetProfile(user.id);
    setSavedProfile(null); setPathData(null); setTasks([]);
    navigate("/onboarding");
  };

  const handleToggleTask = useCallback(async (weekNumber: number, taskIndex: number, currentlyCompleted: boolean) => {
    if (!savedProfile) return;
    const taskKey = `${weekNumber}-${taskIndex}`;
    setTogglingTask(taskKey);
    setTasks((prev) => prev.map((t) =>
      t.week_number === weekNumber && t.task_index === taskIndex ? { ...t, is_completed: !currentlyCompleted } : t
    ));
    const { advanced, newWeek } = await toggleTaskCompletion(savedProfile.id, weekNumber, taskIndex, !currentlyCompleted);
    setTogglingTask(null);
    if (advanced && newWeek) {
      setSavedProfile((prev) => prev ? { ...prev, current_week: newWeek } : prev);
      toast.success(`Minggu ${weekNumber} selesai — lanjut ke Minggu ${newWeek}`);
      setExpandedWeeks((prev) => { const next = new Set(prev); next.add(newWeek); return next; });
    }
  }, [savedProfile]);

  const handleSubmitCheckpoint = useCallback(async () => {
    if (!user || !savedProfile) return;
    const userPlan = (profile?.plan || "free") as PlanType;
    const gate = canUseAIWeeklyFeedback(userPlan);
    if (!gate.allowed) { setUpgradeFeature(gate.upgradeFeature || "ai_weekly_feedback"); return; }
    setSubmittingCheckpoint(true);
    const completionRate = tasks.length > 0 ? tasks.filter((t) => t.is_completed).length / tasks.length : 0;
    const { feedback, adaptation } = await saveWeeklyCheckpoint(
      user.id, savedProfile.id, savedProfile.current_week, completionRate,
      checkpointStatus, stuckArea || undefined, marketResponse ?? undefined
    );
    setCheckpointFeedback(feedback);
    setAdaptationResult(adaptation);
    setSubmittingCheckpoint(false);
  }, [user, savedProfile, profile, tasks, checkpointStatus, stuckArea, marketResponse]);

  const handleGenerate = useCallback(async (type: GeneratorType) => {
    setIsGenerating(true);
    try {
      const input: GeneratorInput = {
        type, niche, subSector, platform, economicModel,
        topic: generatorInput || undefined,
        // Pass deep profile context to make generators personal
        language: answerTags.language_skill ? decodeLabel("language_skill", answerTags.language_skill) : undefined,
        additionalContext: companionCtx
          ? `User profile: ${companionCtx.strengthSummary}. Tantangan: ${companionCtx.weaknessSummary}. Situasi: ${companionCtx.situationSummary}. Tools: ${decodeLabel("tools_familiarity", answerTags.tools_familiarity || "basic")}. Gaya belajar: ${decodeLabel("learning_style", answerTags.learning_style || "practice")}.`
          : undefined,
      };
      const output = await generateContent(input);
      setGeneratedContent((prev) => ({ ...prev, [type]: output.content }));
    } catch (err) { console.error("Generation failed:", err); }
    setIsGenerating(false);
  }, [niche, subSector, platform, economicModel, generatorInput, answerTags, companionCtx]);

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  // ── Derived ──
  const progress = useMemo(() => {
    if (!pathData || tasks.length === 0) return { total: 0, done: 0, percent: 0, currentWeek: savedProfile?.current_week || 1 };
    const total = tasks.length;
    const done = tasks.filter((t) => t.is_completed).length;
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0, currentWeek: savedProfile?.current_week || 1 };
  }, [pathData, tasks, savedProfile]);

  const weeklyTasks: Record<number, Array<{ text: string; completed: boolean; index: number }>> = {};
  if (tasks.length > 0) {
    tasks.forEach((t) => {
      if (!weeklyTasks[t.week_number]) weeklyTasks[t.week_number] = [];
      weeklyTasks[t.week_number].push({ text: t.task_text, completed: t.is_completed, index: t.task_index });
    });
  } else if (pathData) {
    pathData.weeklyPlan.forEach((week) => {
      weeklyTasks[week.week] = week.tasks.map((task, i) => ({ text: task.text, completed: false, index: i }));
    });
  }

  const currentWeekTasks = useMemo(() => tasks.filter((t) => t.week_number === progress.currentWeek), [tasks, progress.currentWeek]);

  const signalsPerWeek = (week: number): MarketSignal[] => {
    if (marketSignals.length === 0) return [];
    const perWeek = Math.ceil(marketSignals.length / 4);
    return marketSignals.slice((week - 1) * perWeek, (week - 1) * perWeek + perWeek);
  };

  const getTemplateTaskDetail = (weekNumber: number, taskIndex: number): TaskDetail | null => {
    if (!pathData) return null;
    const week = pathData.weeklyPlan.find((w) => w.week === weekNumber);
    if (!week || taskIndex >= week.tasks.length) return null;
    return week.tasks[taskIndex];
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-8">Belum terkalibrasi</p>
                <h1 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">Sistem butuh data Anda.</h1>
                <p className="text-sm text-muted-foreground mb-4 max-w-md leading-relaxed">
                  Tanpa profiling, tidak ada arah yang bisa diberikan. Jawab beberapa pertanyaan untuk memulai kalibrasi.
                </p>
                <p className="text-xs text-muted-foreground/40 mb-8 max-w-md leading-relaxed">
                  Proses profiling hanya 7 pertanyaan singkat: bidang skill → sub-spesialisasi → pengalaman → target → waktu → bahasa → status. Setelah selesai, AI akan menyusun workspace eksekusi personal lengkap dengan riset peluang dari internet.
                </p>
                <Link to="/onboarding" className="cmd-primary group">
                  Mulai Kalibrasi <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN WORKSPACE
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 relative">
        <div className="absolute left-[10%] md:left-[8%] top-0 bottom-0 w-px bg-border/20" />

        {/* ── Tab strip ── */}
        <div className="sticky top-12 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="max-w-[1100px] mx-auto px-6 md:px-10">
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  title={item.hint}
                  className={`flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-wider whitespace-nowrap border-b-2 transition-all duration-150 ${
                    activeTab === item.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <button onClick={handleResetProfile} className="cmd-ghost text-[10px]"><RotateCcw className="w-3 h-3" /> Ubah Jalur</button>
                <button onClick={handleSignOut} className="cmd-ghost text-[10px] text-muted-foreground/40"><LogOut className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <main className="max-w-[1100px] mx-auto px-6 md:px-10 py-8 md:py-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

            {/* HEADER */}
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"} — Jalur aktif
              </p>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-1">{pathData.title}</h1>
              <p className="text-xs text-muted-foreground/60 max-w-lg leading-relaxed">{pathData.description}</p>
              <p className="text-[10px] text-muted-foreground/40 mt-2 max-w-lg leading-relaxed">
                {answerTags.profile_level === "quick"
                  ? `Workspace ini disusun dari ${Object.keys(answerTags).length} data profil cepat. Tingkatkan profil setelah beberapa hari untuk rekomendasi lebih presisi.`
                  : `Workspace ini disusun berdasarkan ${Object.keys(answerTags).length} data profil kamu — dari model ekonomi, skill, kondisi, hingga tantangan terbesar. Semua rekomendasi bersifat personal.`
                }
              </p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="w-full h-px bg-border relative">
                <div className="absolute top-0 left-0 h-px bg-foreground/50 transition-all duration-500" style={{ width: `${progress.percent}%` }} />
                <div className="absolute -top-1 w-2 h-2 bg-foreground border border-background transition-all duration-500" style={{ left: `${progress.percent}%`, transform: "translateX(-50%)" }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-muted-foreground/40">Minggu {progress.currentWeek} dari 4</span>
                <span className="text-[10px] text-muted-foreground/40">{progress.done}/{progress.total} tasks — {progress.percent}%</span>
              </div>
            </div>

            {/* Key metrics — dihitung berdasarkan jalur & profil */}
            <div className="mb-1">
              <p className="text-[10px] text-muted-foreground/30 mb-2">Estimasi berdasarkan jalur & kondisi kamu saat ini:</p>
            </div>
            <div className="grid grid-cols-3 gap-px bg-border mb-8">
              <div className="bg-background py-3 px-4">
                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40">Sumber income</p>
                <p className="text-xs text-foreground/80 mt-1">{pathData.moneySource || "Bayaran per project/task dari client langsung"}</p>
              </div>
              <div className="bg-background py-3 px-4">
                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40">Waktu test</p>
                <p className="text-xs text-foreground/80 mt-1">{pathData.timeToTest || "7–14 hari untuk income pertama"}</p>
              </div>
              <div className="bg-background py-3 px-4">
                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40">Risiko</p>
                <p className="text-xs text-foreground/80 mt-1">{pathData.riskIfFail || "Rendah — waktu terbuang tapi tidak ada kerugian finansial"}</p>
              </div>
            </div>


            {/* ═══════════════════════════════
                TAB: OVERVIEW
            ═══════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* AI Insight */}
                {savedProfile.ai_why_text && (
                  <div className="py-5 px-5 border border-border">
                    <div className="flex items-start gap-3">
                      <Brain className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">Analisis AI — kenapa jalur ini cocok untuk kamu</p>
                        <p className="text-[10px] text-muted-foreground/30 mb-2">Digenerate berdasarkan 8 data profil mendalam (skill, kondisi, hambatan, target income, dll)</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{savedProfile.ai_why_text}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deep Profile Summary — data dari jawaban profiling kamu */}
                {(answerTags.digital_experience || answerTags.current_stage || answerTags.income_target) && (
                  <div className="border border-border">
                    <div className="py-3 px-5 border-b border-border">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">Profil lengkap anda</p>
                      <p className="text-[10px] text-muted-foreground/30 mt-0.5">Data ini diambil dari jawaban kamu saat profiling — semua rekomendasi dibentuk berdasarkan ini</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
                      {answerTags.current_stage && (
                        <div className="bg-background py-3 px-4">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">Status</p>
                          <p className="text-xs text-foreground/70 mt-0.5">{decodeLabel("current_stage", answerTags.current_stage)}</p>
                        </div>
                      )}
                      {answerTags.digital_experience && (
                        <div className="bg-background py-3 px-4">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">Exp. Digital</p>
                          <p className="text-xs text-foreground/70 mt-0.5">{decodeLabel("digital_experience", answerTags.digital_experience)}</p>
                        </div>
                      )}
                      {answerTags.language_skill && (
                        <div className="bg-background py-3 px-4">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">Bahasa</p>
                          <p className="text-xs text-foreground/70 mt-0.5">{decodeLabel("language_skill", answerTags.language_skill)}</p>
                        </div>
                      )}
                      {answerTags.income_target && (
                        <div className="bg-background py-3 px-4">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">Target income</p>
                          <p className="text-xs text-foreground/70 mt-0.5">{decodeLabel("income_target", answerTags.income_target)}</p>
                        </div>
                      )}
                      {answerTags.tools_familiarity && (
                        <div className="bg-background py-3 px-4">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">Tools</p>
                          <p className="text-xs text-foreground/70 mt-0.5">{decodeLabel("tools_familiarity", answerTags.tools_familiarity)}</p>
                        </div>
                      )}
                      {answerTags.biggest_challenge && (
                        <div className="bg-background py-3 px-4">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">Hambatan</p>
                          <p className="text-xs text-foreground/70 mt-0.5">{decodeLabel("biggest_challenge", answerTags.biggest_challenge)}</p>
                        </div>
                      )}
                      {answerTags.weekly_commitment && (
                        <div className="bg-background py-3 px-4">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">Komitmen</p>
                          <p className="text-xs text-foreground/70 mt-0.5">{decodeLabel("weekly_commitment", answerTags.weekly_commitment)}</p>
                        </div>
                      )}
                      {answerTags.learning_style && (
                        <div className="bg-background py-3 px-4">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">Belajar</p>
                          <p className="text-xs text-foreground/70 mt-0.5">{decodeLabel("learning_style", answerTags.learning_style)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── LEVEL 2: Profile Upgrade Prompt ── */}
                {savedProfile && !upgradePromptDismissed && user &&
                  answerTags.profile_level !== "upgraded" &&
                  shouldShowUpgradePrompt(answerTags, savedProfile.created_at || new Date().toISOString()) && (
                  <ProfileUpgradePrompt
                    profileId={savedProfile.id}
                    userId={user.id}
                    currentAnswerTags={answerTags}
                    onComplete={(updatedTags) => {
                      // Refresh profile data with new tags
                      setSavedProfile(prev => prev ? { ...prev, answer_tags: updatedTags } as any : prev);
                      toast.success("Profil ditingkatkan! Rekomendasi akan lebih presisi.");
                    }}
                    onDismiss={() => setUpgradePromptDismissed(true)}
                  />
                )}

                {/* ── JOB MATCH SUMMARY — structured overview ── */}
                {jobResearch && (
                  <div className="border border-border">
                    {/* Section header */}
                    <div className="py-4 px-5 border-b border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">Hasil riset pekerjaan & peluang</p>
                      </div>
                      <p className="text-xs text-muted-foreground/40 leading-relaxed">
                        Rekomendasi di bawah bukan saran generik. Sistem menganalisis data profil kamu
                        (status: {decodeLabel("current_stage", answerTags.current_stage || "employee")},
                        skill: {decodeLabel("tools_familiarity", answerTags.tools_familiarity || "basic")},
                        hambatan: {decodeLabel("biggest_challenge", answerTags.biggest_challenge || "no_direction")})
                        dan mencocokkan dengan data real dari Google Trends, YouTube, TikTok, dan Google Search
                        untuk menemukan peluang yang realistis sesuai kondisi kamu.
                      </p>
                    </div>

                    {/* 3 Job Cards — inline in overview */}
                    {[
                      { job: jobResearch.primaryJob, tier: "primary", tierLabel: "Rekomendasi utama", tierDesc: "Paling cocok dengan kondisi & skill kamu saat ini" },
                      { job: jobResearch.secondaryJob, tier: "secondary", tierLabel: "Alternatif", tierDesc: "Opsi kedua jika rekomendasi utama belum terasa pas" },
                      { job: jobResearch.exploratoryJob, tier: "exploratory", tierLabel: "Eksploratif", tierDesc: "Peluang baru yang bisa dieksplorasi sambil jalan" },
                    ].map(({ job, tier, tierLabel, tierDesc }) => job && (
                      <div key={tier} className={`py-5 px-5 ${tier !== "exploratory" ? "border-b border-border/50" : ""}`}>
                        {/* Tier label */}
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className={`text-[9px] uppercase tracking-[0.15em] ${tier === "primary" ? "text-foreground/50" : "text-muted-foreground/40"}`}>
                              {tierLabel}
                            </p>
                            <p className="text-[10px] text-muted-foreground/30">{tierDesc}</p>
                          </div>
                          {job.demandLevel && (
                            <span className={`text-[9px] px-2 py-0.5 shrink-0 ${
                              job.demandLevel === "tinggi" ? "bg-foreground/10 text-foreground/70" :
                              job.demandLevel === "sedang" ? "bg-muted/20 text-muted-foreground/60" :
                              "bg-muted/10 text-muted-foreground/40"
                            }`}>
                              Demand: {job.demandLevel}
                            </span>
                          )}
                        </div>

                        {/* Job title */}
                        <h3 className={`text-sm font-semibold mb-2 ${tier === "primary" ? "text-foreground" : "text-foreground/80"}`}>
                          {job.title}
                        </h3>

                        {/* WHY — kenapa cocok */}
                        <div className="mb-3">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">Kenapa cocok untuk kamu</p>
                          <p className="text-xs text-foreground/70 leading-relaxed">{job.whyThisJob}</p>
                        </div>

                        {/* EVIDENCE — berdasarkan apa */}
                        {job.evidence && (
                          <div className="mb-3">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">Berdasarkan data</p>
                            <p className="text-xs text-muted-foreground/60 leading-relaxed">{job.evidence}</p>
                          </div>
                        )}

                        {/* Key numbers — income + timeline */}
                        <div className="grid grid-cols-2 gap-px bg-border mb-3">
                          <div className="bg-background py-2 px-3">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">Estimasi income</p>
                            <p className="text-xs text-foreground/70 mt-0.5">{job.incomeRange}</p>
                          </div>
                          <div className="bg-background py-2 px-3">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">Waktu ke income pertama</p>
                            <p className="text-xs text-foreground/70 mt-0.5">{job.timeToFirstIncome}</p>
                          </div>
                        </div>

                        {/* Competitive advantage */}
                        {job.competitiveAdvantage && (
                          <div className="mb-3">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">Keunggulan kamu di bidang ini</p>
                            <p className="text-xs text-muted-foreground/60 leading-relaxed">{job.competitiveAdvantage}</p>
                          </div>
                        )}

                        {/* First step — actionable */}
                        <div className="py-2.5 px-3 border-l-2 border-foreground/15 bg-muted/5">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">Langkah pertama yang bisa dilakukan hari ini</p>
                          <p className="text-xs text-foreground/70 leading-relaxed">{job.firstStep}</p>
                        </div>
                      </div>
                    ))}

                    {/* CTA to full detail */}
                    <button onClick={() => setActiveTab("job_research")} className="w-full flex items-center justify-center gap-2 py-3 border-t border-border hover:bg-muted/5 transition-colors group">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 group-hover:text-foreground transition-colors">
                        Lihat detail lengkap (tools, skill gap, contoh sukses, mitigasi risiko)
                      </p>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                    </button>
                  </div>
                )}

                {/* Market data loading */}
                {fetchingTrends && !marketFocus && (
                  <div className="py-4 px-5 border border-border flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">Mengambil data market</p>
                      <p className="text-xs text-muted-foreground/70">Fetching Google Trends, YouTube, SerpAPI...</p>
                    </div>
                  </div>
                )}
                {marketFocus && <MarketFocusCard focus={marketFocus} pathTitle={pathData.title} />}

                {/* Market signals grid — data real dari internet */}
                {marketSignals.length > 0 && (
                  <div className="border border-border">
                    <div className="py-3 px-5 border-b border-border">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">{marketSignals.length} sinyal market terpantau</p>
                      <p className="text-[10px] text-muted-foreground/30 mt-0.5">Keyword yang sedang trending di niche kamu — angka = skor popularitas (0-100%)</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
                      {marketSignals.slice(0, 9).map((signal, i) => (
                        <div key={i} className="bg-background py-3 px-4 flex items-center gap-3">
                          <TrendIcon direction={signal.trend_direction || "stable"} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-foreground/80 truncate">{signal.keyword}</p>
                            <p className="text-[10px] text-muted-foreground/40">{signal.trend_score || 0}%</p>
                          </div>
                          {signal.is_hot && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-foreground/10 text-foreground/60">HOT</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Niche recommendation — saran AI super spesifik */}
                {savedProfile.ai_niche_suggestion && (
                  <div className="py-5 px-5 border border-border">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">Rekomendasi niche spesifik</p>
                        <p className="text-[10px] text-muted-foreground/30 mb-2">AI menyarankan niche yang lebih tajam agar kamu tidak bersaing di market terlalu luas</p>
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{savedProfile.ai_niche_suggestion}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk banners */}
                {riskSignals && (
                  <div className="space-y-4">
                    {riskSignals.isDay25Warning && !day25Dismissed && (
                      <Day25Warning daysSinceStart={riskSignals.daysSinceStart} onDismiss={() => setDay25Dismissed(true)} />
                    )}
                    {riskSignals.shouldSuggestPivot && (
                      <PivotSuggestion noMarketWeeks={riskSignals.noMarketWeeks} alternatePath={savedProfile?.alternate_path} onSwitchPath={handleResetProfile} />
                    )}
                    {riskSignals.isRealityCheckWeek && (
                      <RealityCheck currentWeek={riskSignals.currentWeek} completionRate={riskSignals.completionRate} hasAnyMarketResponse={riskSignals.hasAnyMarketResponse} daysSinceStart={riskSignals.daysSinceStart} />
                    )}
                  </div>
                )}

                {/* Current week tasks — checklist eksekusi kamu */}
                <div className="border border-border">
                  <div className="py-3 px-5 border-b border-border flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">Minggu {progress.currentWeek} — Tasks</p>
                      <p className="text-[10px] text-muted-foreground/30 mt-0.5">Klik lingkaran untuk tandai selesai · Semua task sudah disesuaikan profil kamu</p>
                    </div>
                    <button onClick={() => setActiveTab("roadmap")} className="text-[10px] uppercase tracking-wider text-muted-foreground/40 hover:text-foreground transition-colors">
                      Lihat semua →
                    </button>
                  </div>
                  <div>
                    {currentWeekTasks.length > 0
                      ? currentWeekTasks.map((task, ti) => (
                          <div key={ti} className={`flex items-start gap-3 py-3 px-5 border-b border-border/30 ${task.is_completed ? "opacity-40" : ""}`}>
                            <button onClick={() => handleToggleTask(task.week_number, task.task_index, task.is_completed)} className="mt-0.5 shrink-0" disabled={togglingTask === `${task.week_number}-${task.task_index}`}>
                              {task.is_completed ? <CheckCircle2 className="w-4 h-4 text-foreground/40" /> : <Circle className="w-4 h-4 text-muted-foreground/40 hover:text-foreground transition-colors" />}
                            </button>
                            <span className={`text-sm ${task.is_completed ? "line-through text-muted-foreground" : "text-foreground/80"}`}>{task.task_text}</span>
                          </div>
                        ))
                      : pathData.weeklyPlan[progress.currentWeek - 1]?.tasks.map((task, ti) => (
                          <div key={ti} className="flex items-start gap-3 py-3 px-5 border-b border-border/30">
                            <Circle className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                            <span className="text-sm text-foreground/80">{task.text}</span>
                          </div>
                        ))
                    }
                  </div>
                </div>

                {/* Generator CTA — buat konten personal */}
                <button onClick={() => setActiveTab("generator")} className="w-full flex items-center justify-between py-4 px-5 border border-border hover:border-foreground/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-xs font-medium text-foreground">Content Generator</p>
                      <p className="text-[10px] text-muted-foreground/60">Generate caption, hook, script, bio — hasil sudah disesuaikan niche & profil kamu</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground transition-all" />
                </button>

                {riskSignals && riskSignals.currentWeek >= 2 && <AntiSunkCostCard weekNumber={riskSignals.currentWeek} />}

                {pathData.avoid && pathData.avoid.length > 0 && (
                  <div className="py-5 px-5 border border-border/50">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Yang harus diabaikan</p>
                    <p className="text-[10px] text-muted-foreground/30 mb-3">Hindari hal-hal ini agar tidak membuang waktu & energi — fokus di apa yang sudah ada di roadmap</p>
                    <div className="space-y-2">
                      {pathData.avoid.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground/60">
                          <span className="text-muted-foreground/30">✕</span> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pathData.examples && pathData.examples.length > 0 && (
                  <div className="py-5 px-5 border border-border/50">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Contoh yang bisa dimulai</p>
                    <p className="text-[10px] text-muted-foreground/30 mb-3">Inspirasi awal — kamu bisa mulai dari salah satu ini, atau bikin versi sendiri</p>
                    <div className="flex flex-wrap gap-2">
                      {pathData.examples.map((ex, i) => (
                        <span key={i} className="text-xs px-3 py-1.5 border border-border text-foreground/60">{ex}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════
                TAB: JOB RESEARCH (Layer 2)
            ═══════════════════════════════ */}
            {activeTab === "job_research" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Riset pekerjaan & peluang</p>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Rekomendasi Job & Opportunity</h2>
                  <p className="text-xs text-muted-foreground/60 max-w-lg leading-relaxed">
                    Bukan saran generik — ini hasil riset dari profil lengkap kamu (skill, kondisi, hambatan, target) + data real dari internet.
                  </p>
                </div>

                {/* Data source transparency */}
                <div className="py-3 px-5 border border-border/50 bg-muted/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">Sumber data riset</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground/50">📊 Google Trends</span>
                    <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground/50">🎬 YouTube Data</span>
                    <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground/50">🎵 TikTok Trends</span>
                    <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground/50">🔍 Google Search</span>
                    <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground/50">🤖 AI Analysis</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/30 mt-2">Data di-fetch saat profiling. AI menganalisis data ini + profil kamu untuk memberikan rekomendasi yang akurat.</p>
                </div>

                {!jobResearch ? (
                  <div className="py-12 text-center border border-border">
                    <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground/60 mb-2">Belum ada data job research</p>
                    <p className="text-xs text-muted-foreground/40 max-w-sm mx-auto leading-relaxed">
                      Sistem perlu menjalankan riset ulang untuk mencocokkan profil kamu dengan peluang kerja di internet.
                      Klik re-profiling untuk memulai proses riset dari Google Trends, YouTube, TikTok & Google Search.
                    </p>
                    <button onClick={handleResetProfile} className="cmd-primary text-xs mt-4">
                      <RotateCcw className="w-3 h-3" /> Re-profiling
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Profile Analysis */}
                    {jobResearch.profileAnalysis && (
                      <div className="py-5 px-5 border border-border">
                        <div className="flex items-start gap-3">
                          <Brain className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">Analisis profil → kenapa job ini cocok</p>
                            <p className="text-[10px] text-muted-foreground/30 mb-2">AI membaca data profil kamu (status, skill, tantangan, target) dan mencocokkan dengan data market</p>
                            <p className="text-sm text-foreground/80 leading-relaxed">{jobResearch.profileAnalysis}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Market Context */}
                    {jobResearch.marketContext && (
                      <div className="py-4 px-5 border border-border/50">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Konteks market saat ini</p>
                        <p className="text-[10px] text-muted-foreground/30 mb-2">Kondisi pasar berdasarkan data Google Trends & search volume terbaru</p>
                        <p className="text-xs text-foreground/60 leading-relaxed">{jobResearch.marketContext}</p>
                      </div>
                    )}

                    {/* Trend Keywords — keyword trending terkait niche kamu */}
                    {jobResearch.trendKeywords && jobResearch.trendKeywords.length > 0 && (
                      <div className="py-3">
                        <p className="text-[10px] text-muted-foreground/30 mb-2">Keyword trending terkait niche kamu:</p>
                        <div className="flex flex-wrap gap-2">
                          {jobResearch.trendKeywords.map((kw, i) => (
                            <span key={i} className="text-[10px] px-2 py-1 border border-border text-muted-foreground/60">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Job Cards — 3 tingkat rekomendasi */}
                    {[
                      { job: jobResearch.primaryJob, label: "Rekomendasi utama — paling cocok dengan profil kamu", tier: "primary" },
                      { job: jobResearch.secondaryJob, label: "Alternatif — opsi kedua yang juga relevan", tier: "secondary" },
                      { job: jobResearch.exploratoryJob, label: "Eksploratif — peluang baru yang bisa dieksplorasi", tier: "exploratory" },
                    ].map(({ job, label, tier }) => job && (
                      <div key={tier} className={`border ${tier === "primary" ? "border-foreground/30" : "border-border"}`}>
                        <div className={`py-3 px-5 border-b ${tier === "primary" ? "border-foreground/20 bg-foreground/5" : "border-border"}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">{label}</p>
                            {job.demandLevel && (
                              <span className={`text-[9px] px-2 py-0.5 ${
                                job.demandLevel === "tinggi" ? "bg-foreground/10 text-foreground/70" :
                                job.demandLevel === "sedang" ? "bg-muted/20 text-muted-foreground/60" :
                                "bg-muted/10 text-muted-foreground/40"
                              }`}>
                                Demand: {job.demandLevel}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-foreground mt-1">{job.title}</h3>
                        </div>
                        <div className="py-4 px-5 space-y-4">
                          {/* Why this job */}
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Kenapa cocok untuk kamu</p>
                            <p className="text-xs text-foreground/70 leading-relaxed">{job.whyThisJob}</p>
                          </div>

                          {/* Evidence */}
                          {job.evidence && (
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Data & evidence</p>
                              <p className="text-xs text-foreground/60 leading-relaxed">{job.evidence}</p>
                            </div>
                          )}

                          {/* Key metrics */}
                          <div className="grid grid-cols-2 gap-px bg-border">
                            <div className="bg-background py-2.5 px-3">
                              <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">Income range</p>
                              <p className="text-xs text-foreground/70 mt-0.5">{job.incomeRange}</p>
                            </div>
                            <div className="bg-background py-2.5 px-3">
                              <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">Waktu ke income pertama</p>
                              <p className="text-xs text-foreground/70 mt-0.5">{job.timeToFirstIncome}</p>
                            </div>
                          </div>

                          {/* Competitive advantage */}
                          {job.competitiveAdvantage && (
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Keunggulan kamu</p>
                              <p className="text-xs text-foreground/60 leading-relaxed">{job.competitiveAdvantage}</p>
                            </div>
                          )}

                          {/* First step */}
                          <div className="py-3 px-4 border-l-2 border-foreground/20">
                            <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Langkah pertama — bisa dilakukan HARI INI</p>
                            <p className="text-xs text-foreground/70 leading-relaxed">{job.firstStep}</p>
                          </div>

                          {/* Tools & platform */}
                          <div className="flex flex-wrap gap-2">
                            {job.requiredTools && job.requiredTools.map((tool, ti) => (
                              <span key={ti} className="text-[10px] px-2 py-1 border border-border text-muted-foreground/60">
                                <Wrench className="w-2.5 h-2.5 inline mr-1" />{tool}
                              </span>
                            ))}
                            {job.bestPlatform && (
                              <span className="text-[10px] px-2 py-1 border border-foreground/20 text-foreground/60">
                                <Compass className="w-2.5 h-2.5 inline mr-1" />{job.bestPlatform}
                              </span>
                            )}
                          </div>

                          {/* Success example — benchmark dari orang yang sudah berhasil */}
                          {job.successExample && (
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Contoh sukses (bisa jadi benchmark kamu)</p>
                              <p className="text-xs text-muted-foreground/50 leading-relaxed">{job.successExample}</p>
                            </div>
                          )}

                          {/* Skill gap & risk */}
                          <div className="grid grid-cols-2 gap-4">
                            {job.skillGap && (
                              <div>
                                <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">Skill gap</p>
                                <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{job.skillGap}</p>
                              </div>
                            )}
                            {job.riskMitigation && (
                              <div>
                                <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">Mitigasi risiko</p>
                                <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{job.riskMitigation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ═══════════════════════════════
                TAB: ROADMAP
            ═══════════════════════════════ */}
            {activeTab === "roadmap" && (
              <div className="space-y-0">
                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
                    Roadmap 30 hari — disesuaikan profil kamu
                  </p>
                  <p className="text-[10px] text-muted-foreground/30 max-w-lg leading-relaxed">
                    Setiap task dibuat berdasarkan skill level, waktu luang, dan kondisi kamu saat ini.
                    Klik task untuk lihat detail langkah aksi + resource. Tandai selesai kalau sudah dikerjakan.
                    {marketSignals.length > 0 && " Data market real juga ditampilkan per minggu untuk konteks eksekusi."}
                  </p>
                </div>

                {pathData.weeklyPlan.map((week) => {
                  const isExpanded = expandedWeeks.has(week.week);
                  const wTasks = weeklyTasks[week.week] || [];
                  const wCompleted = wTasks.filter((t) => t.completed).length;
                  const isCurrentWeek = week.week === progress.currentWeek;
                  const weekSignals = signalsPerWeek(week.week);

                  return (
                    <div key={week.week} className={`border-t border-border ${isCurrentWeek ? "border-l-2 border-l-foreground/30" : ""}`}>
                      <button
                        onClick={() => { setExpandedWeeks((prev) => { const next = new Set(prev); if (next.has(week.week)) next.delete(week.week); else next.add(week.week); return next; }); }}
                        className="w-full flex items-center gap-4 py-4 px-5 hover:bg-muted/5 transition-colors"
                      >
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold text-muted-foreground/40 bg-muted/10 px-2 py-1 w-8 text-center">W{week.week}</span>
                          {isCurrentWeek && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-foreground/10 text-foreground/60">AKTIF</span>}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-foreground/80">{week.title}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {weekSignals.length > 0 && <span className="text-[10px] text-muted-foreground/40">{weekSignals.length} trend</span>}
                          <span className="text-[10px] text-muted-foreground/40">{wCompleted}/{wTasks.length}</span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/30" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            {weekSignals.length > 0 && (
                              <div className="mx-5 mb-4 py-3 px-4 border border-border/50 bg-muted/5">
                                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Konteks market minggu ini</p>
                                <p className="text-[10px] text-muted-foreground/30 mb-2">Data real dari Google Trends — gunakan keyword ini untuk konten/eksekusi minggu ini</p>
                                <div className="flex flex-wrap gap-3">
                                  {weekSignals.map((signal, si) => (
                                    <div key={si} className="flex items-center gap-1.5">
                                      <TrendIcon direction={signal.trend_direction || "stable"} />
                                      <span className="text-xs text-foreground/70">{signal.keyword}</span>
                                      <span className="text-[10px] text-muted-foreground/40">{signal.trend_score || 0}%</span>
                                    </div>
                                  ))}
                                </div>
                                {weekSignals[0]?.suggestion && (
                                  <p className="text-xs text-muted-foreground/60 mt-2 leading-relaxed">📊 {weekSignals[0].suggestion}</p>
                                )}
                              </div>
                            )}

                            <div className="border-t border-border/30">
                              {wTasks.map((task, ti) => {
                                const taskKey = `${week.week}-${task.index}`;
                                const isTaskExpanded = expandedTasks.has(taskKey);
                                const detail = getTemplateTaskDetail(week.week, task.index);

                                return (
                                  <div key={ti} className={`border-b border-border/20 ${task.completed ? "opacity-40" : ""}`}>
                                    <div className="flex items-start gap-3 py-3 px-5">
                                      <button onClick={() => handleToggleTask(week.week, task.index, task.completed)} className="mt-0.5 shrink-0" disabled={togglingTask === taskKey}>
                                        {task.completed ? <CheckCircle2 className="w-4 h-4 text-foreground/40" /> : <Circle className="w-4 h-4 text-muted-foreground/40 hover:text-foreground transition-colors" />}
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <button onClick={() => { setExpandedTasks((prev) => { const next = new Set(prev); if (next.has(taskKey)) next.delete(taskKey); else next.add(taskKey); return next; }); }} className="text-left w-full group">
                                          <p className={`text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground/80"}`}>{task.text}</p>
                                          {detail && (
                                            <div className="flex items-center gap-3 mt-1">
                                              {detail.time_estimate && <span className="text-[10px] text-muted-foreground/40">{detail.time_estimate}</span>}
                                              {detail.difficulty && <span className="text-[10px] text-muted-foreground/40">{detail.difficulty}</span>}
                                              <span className="text-[10px] text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">{isTaskExpanded ? "tutup" : "detail →"}</span>
                                            </div>
                                          )}
                                        </button>

                                        <AnimatePresence>
                                          {isTaskExpanded && detail && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                              <div className="mt-3 space-y-3">
                                                {detail.action_guide && (
                                                  <div>
                                                    <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-2">Langkah aksi</p>
                                                    <ol className="space-y-1.5">
                                                      {detail.action_guide.split('\n').filter(s => s.trim()).map((step, si) => (
                                                        <li key={si} className="text-xs text-muted-foreground/60 leading-relaxed pl-4">{step}</li>
                                                      ))}
                                                    </ol>
                                                  </div>
                                                )}
                                                {detail.deliverable && (
                                                  <div>
                                                    <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Deliverable</p>
                                                    <p className="text-xs text-foreground/60">{detail.deliverable}</p>
                                                  </div>
                                                )}
                                                {detail.resources && detail.resources.length > 0 && (
                                                  <div>
                                                    <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-2">Resources</p>
                                                    <div className="flex flex-wrap gap-2">
                                                      {detail.resources.map((r, ri) => (
                                                        <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors px-2 py-1 border border-border/30">
                                                          {resourceIcon(r.type)} {r.label}
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
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ═══════════════════════════════
                TAB: GENERATOR
            ═══════════════════════════════ */}
            {activeTab === "generator" && (
              <div className="space-y-6">
                {/* Intro context */}
                <div className="mb-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Content generator personal</p>
                  <p className="text-[10px] text-muted-foreground/30 max-w-lg leading-relaxed">
                    Semua konten yang di-generate sudah disesuaikan dengan niche, platform, dan gaya komunikasi kamu.
                    Pilih jenis konten, masukkan topik (opsional), lalu klik Generate.
                  </p>
                </div>

                {/* Profile bar — konteks profil yang digunakan generator */}
                <div className="py-3 px-5 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-3 h-3 text-muted-foreground/40" />
                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">Konteks profil yang digunakan:</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 border border-border text-foreground/60">{humanizeKey(economicModel)}</span>
                    <span className="text-muted-foreground/20">→</span>
                    <span className="text-[10px] px-2 py-0.5 border border-border text-foreground/60">{humanizeKey(subSector)}</span>
                    <span className="text-muted-foreground/20">→</span>
                    <span className="text-[10px] px-2 py-0.5 border border-border text-foreground/60">{humanizeKey(niche)}</span>
                    <span className="text-muted-foreground/20">→</span>
                    <span className="text-[10px] px-2 py-0.5 border border-foreground/20 text-foreground/70">{humanizeKey(platform)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-border">
                  {availableGenerators.filter(g => g !== "content_calendar").map((genType) => {
                    const label = GENERATOR_LABELS[genType];
                    const isActive = activeGenerator === genType;
                    const hasContent = !!generatedContent[genType];
                    return (
                      <button key={genType} onClick={() => setActiveGenerator(isActive ? null : genType)} className={`bg-background py-4 px-4 text-left transition-all ${isActive ? "bg-muted/10 border-l-2 border-l-foreground/30" : "hover:bg-muted/5"}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-lg">{label.emoji}</span>
                          {hasContent && <Check className="w-3.5 h-3.5 text-foreground/40" />}
                        </div>
                        <p className="text-xs font-medium text-foreground/80">{label.label}</p>
                        <p className="text-[10px] text-muted-foreground/40 mt-0.5">{label.description}</p>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {activeGenerator && (
                    <motion.div key={activeGenerator} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <div className="border border-border">
                        <div className="py-3 px-5 border-b border-border flex items-center gap-2">
                          <span className="text-lg">{GENERATOR_LABELS[activeGenerator].emoji}</span>
                          <p className="text-sm font-medium text-foreground">{GENERATOR_LABELS[activeGenerator].label}</p>
                        </div>
                        <div className="py-5 px-5 space-y-4">
                          <div>
                            <label className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1.5 block">Topik / Konteks (opsional)</label>
                            <input type="text" value={generatorInput} onChange={(e) => setGeneratorInput(e.target.value)} placeholder="e.g. tips produktivitas WFH, review AI tool..."
                              className="w-full px-4 py-2.5 bg-transparent border border-border text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/30" />
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleGenerate(activeGenerator)} disabled={isGenerating} className="cmd-primary text-xs disabled:opacity-40">
                              {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate</>}
                            </button>
                            {generatedContent[activeGenerator] && (
                              <button onClick={() => handleGenerate(activeGenerator)} disabled={isGenerating} className="cmd-ghost text-xs disabled:opacity-40">
                                <RefreshCw className="w-3 h-3" /> Re-generate
                              </button>
                            )}
                          </div>
                          {generatedContent[activeGenerator] && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40">Result</p>
                                <button onClick={() => copyToClipboard(generatedContent[activeGenerator], activeGenerator)} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors">
                                  {copiedKey === activeGenerator ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                </button>
                              </div>
                              <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed py-4 px-5 border border-border/50 bg-muted/5 max-h-80 overflow-y-auto">
                                {generatedContent[activeGenerator]}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ═══════════════════════════════
                TAB: CALENDAR
            ═══════════════════════════════ */}
            {activeTab === "calendar" && (
              <div className="space-y-6">
                {/* Intro context */}
                <div className="mb-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Trend intelligence & kalender konten</p>
                  <p className="text-[10px] text-muted-foreground/30 max-w-lg leading-relaxed">
                    Dashboard ini menampilkan trend terbaru di niche kamu dari berbagai sumber (Google Trends, YouTube, dll).
                    Kalender konten dibawahnya otomatis disusun berdasarkan trend + profil kamu — tinggal eksekusi.
                  </p>
                </div>
                <TrendIntelligenceDashboard pathId={economicModel} interestMarket={niche} subSector={subSector} onTrendBriefReady={setTrendBrief} />
                <ContentCalendarView economicModel={economicModel} subSector={subSector} niche={niche} platform={platform} trendBrief={trendBrief} />
              </div>
            )}

            {/* ═══════════════════════════════
                TAB: CHECKPOINT
            ═══════════════════════════════ */}
            {activeTab === "checkpoint" && (
              <div className="space-y-6">
                {/* Intro context */}
                <div className="mb-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Evaluasi & feedback mingguan</p>
                  <p className="text-[10px] text-muted-foreground/30 max-w-lg leading-relaxed">
                    Submit checkpoint di akhir setiap minggu untuk mendapatkan feedback dari AI.
                    Sistem akan menganalisis progress kamu dan memberikan saran adaptasi — apakah perlu lanjut, simplifikasi, atau pivot.
                  </p>
                </div>

                <div className="border border-border">
                  <div className="py-4 px-5 border-b border-border flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">Checkpoint — Minggu {progress.currentWeek}</p>
                      <p className="text-[10px] text-muted-foreground/30 mt-0.5">
                        {checkpointFeedback ? "Feedback sudah diterima — lihat analisis AI di bawah" : "Pilih status progress, lalu submit untuk analisis AI"}
                      </p>
                    </div>
                  </div>
                  <div className="py-5 px-5">
                    {checkpointFeedback ? (
                      <div className="space-y-5">
                        {adaptationResult && adaptationResult.adjustment !== "continue" && (
                          <div className="py-4 px-4 border-l-2 border-foreground/30">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
                              {adaptationResult.adjustment === "pivot_path" ? "⚠️ Sinyal: Pivot jalur — data menunjukkan perlu ganti arah" : adaptationResult.adjustment === "simplify" ? "📉 Sinyal: Simplifikasi — kurangi scope agar lebih fokus" : adaptationResult.adjustment === "accelerate" ? "🚀 Sinyal: Akselerasi — kamu ahead, bisa percepat!" : "🔄 Sinyal: Adjust niche — perlu re-focus di niche lebih spesifik"}
                            </p>
                            <p className="text-sm text-foreground/70 leading-relaxed">{adaptationResult.suggestion}</p>
                            {adaptationResult.adjustment === "pivot_path" && <button onClick={handleResetProfile} className="mt-3 cmd-ghost text-xs"><RotateCcw className="w-3 h-3" /> Re-profiling</button>}
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <Brain className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">Feedback AI — berdasarkan progress & profil kamu</p>
                            <p className="text-[10px] text-muted-foreground/30 mb-2">AI menganalisis completion rate, status, dan data profil kamu untuk memberikan saran yang tepat</p>
                            <p className="text-sm text-foreground/80 leading-relaxed">{checkpointFeedback}</p>
                          </div>
                        </div>
                        {checkpointHistory.length > 1 && (
                          <div className="pt-4 border-t border-border/50">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Histori checkpoint</p>
                            <p className="text-[10px] text-muted-foreground/30 mb-3">Persentase = task yang selesai per minggu. Semakin tinggi → semakin on-track.</p>
                            <div className="flex gap-3">
                              {checkpointHistory.map((cp) => (
                                <div key={cp.week_number} className="text-center">
                                  <div className="text-[10px] text-muted-foreground/40 mb-1">W{cp.week_number}</div>
                                  <div className={`text-xs font-medium ${cp.completion_rate >= 0.9 ? "text-foreground" : cp.completion_rate >= 0.5 ? "text-muted-foreground" : "text-muted-foreground/40"}`}>{Math.round(cp.completion_rate * 100)}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">Status progress</p>
                          <p className="text-[10px] text-muted-foreground/30 mb-3">Pilih yang paling menggambarkan kondisi kamu minggu ini</p>
                          <div className="flex gap-2">
                            {(["on_track", "stuck", "ahead"] as const).map((status) => (
                              <button key={status} onClick={() => setCheckpointStatus(status)} className={`px-4 py-2 text-xs transition-all border ${checkpointStatus === status ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:border-foreground/30"}`}>
                                {status === "on_track" ? "🟢 On Track" : status === "stuck" ? "🔴 Stuck" : "🔵 Ahead"}
                              </button>
                            ))}
                          </div>
                        </div>
                        {checkpointStatus === "stuck" && (
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">Area yang stuck</p>
                            <p className="text-[10px] text-muted-foreground/30 mb-2">Tulis spesifik — semakin detail, semakin tajam feedback AI</p>
                            <input type="text" value={stuckArea} onChange={(e) => setStuckArea(e.target.value)} placeholder="e.g. Cari niche, belum ada client..."
                              className="w-full px-4 py-2.5 bg-transparent border border-border text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/30" />
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">Respon market</p>
                          <p className="text-[10px] text-muted-foreground/30 mb-3">Apakah sudah ada orang yang merespon hasil kerja kamu? (like, comment, client, lead, dll)</p>
                          <div className="flex gap-2">
                            <button onClick={() => setMarketResponse(true)} className={`px-4 py-2 text-xs transition-all border ${marketResponse === true ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:border-foreground/30"}`}>Sudah ada</button>
                            <button onClick={() => setMarketResponse(false)} className={`px-4 py-2 text-xs transition-all border ${marketResponse === false ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:border-foreground/30"}`}>Belum</button>
                          </div>
                        </div>
                        <button onClick={handleSubmitCheckpoint} disabled={submittingCheckpoint} className="cmd-primary text-xs disabled:opacity-40">
                          {submittingCheckpoint ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menganalisis...</> : <><Brain className="w-3.5 h-3.5" /> Submit Checkpoint</>}
                        </button>
                        {upgradeFeature && <UpgradePrompt feature={upgradeFeature} compact onDismiss={() => setUpgradeFeature(null)} />}
                      </div>
                    )}
                  </div>
                </div>
                {savedProfile && savedProfile.current_week >= 2 && <SwitchPathButton onSwitch={handleResetProfile} alternatePath={savedProfile.alternate_path} />}
              </div>
            )}

          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
