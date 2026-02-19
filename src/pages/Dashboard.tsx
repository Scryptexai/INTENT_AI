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
  Brain, Sparkles, Zap, Copy, Check,
  ExternalLink, BookOpen, Wrench, Layout, Compass, Star,
  ArrowUpRight, ArrowDownRight, Minus, CalendarCheck, Search,
  Target, BadgeCheck, Briefcase,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPathTemplate } from "@/utils/pathTemplates";
import type { PathTemplate, TaskDetail, TaskResource } from "@/utils/pathTemplates";
import type { PathId } from "@/utils/profilingConfig";
import {
  loadActiveProfile,
  loadTaskProgress,
  loadPreviousCheckpoints,
  toggleTaskCompletion,
  resetProfile,
  saveWeeklyCheckpoint,
  computeRiskSignals,
  type SavedProfile,
  type TaskProgress,
  type RiskSignals,
  type CheckpointHistory,
} from "@/services/profileService";
import { canUseAIWeeklyFeedback, canReprofile, type PlanType } from "@/services/planGating";
import {
  Day25Warning,
  PivotSuggestion,
  RealityCheck,
  AntiSunkCostCard,
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
  decodeLabel,
  type CompanionContext,
} from "@/services/aiCompanion";
import ProfileUpgradePrompt from "@/components/ProfileUpgradePrompt";
import { shouldShowUpgradePrompt } from "@/utils/quickProfileConfig";
import { toast } from "sonner";

// ============================================================================
// HELPERS
// ============================================================================

function TrendIcon({ direction, className = "w-3 h-3" }: { direction: string; className?: string }) {
  switch (direction) {
    case "rising": return <ArrowUpRight className={`${className} text-foreground/70`} />;
    case "falling": return <ArrowDownRight className={`${className} text-foreground/70`} />;
    default: return <Minus className={`${className} text-muted-foreground/80`} />;
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
// TAB NAV - Clear A-Z Flow Structure
// ============================================================================

const tabs = [
  { icon: LayoutDashboard, label: "Overview", key: "overview", hint: "Ringkasan profil, job match & task minggu ini" },
  { icon: Briefcase, label: "Jobs", key: "jobs", hint: "Detail job match, market signals & calendar" },
  { icon: Map, label: "Roadmap", key: "roadmap", hint: "Rencana lengkap 30 hari (minggu 1-4)" },
  { icon: Zap, label: "Tools", key: "tools", hint: "Generator materials eksekusi" },
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
  // const [checkpointStatus, setCheckpointStatus] = useState<"on_track" | "stuck" | "ahead">("on_track");
  // const [stuckArea, setStuckArea] = useState("");
  // const [marketResponse, setMarketResponse] = useState<boolean | null>(null);
  const [checkpointFeedback, setCheckpointFeedback] = useState("");
  // const [submittingCheckpoint, setSubmittingCheckpoint] = useState(false);
  const [adaptationResult, setAdaptationResult] = useState<AdaptationResult | null>(null);
  const [checkpointHistory, setCheckpointHistory] = useState<CheckpointHistory[]>([]);
  // const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);
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
  // const [trendBrief, setTrendBrief] = useState("");  // Moved to Jobs tab component

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

        // Load checkpoint history for risk signals & feedback
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

  // Removed: handleSubmitCheckpoint (unused after checkpoint UI removal)

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

  // Removed: getTemplateTaskDetail (unused function)

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
                <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/70 mb-8">Belum terkalibrasi</p>
                <h1 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">Sistem butuh data Anda.</h1>
                <p className="text-sm text-muted-foreground mb-4 max-w-md leading-relaxed">
                  Tanpa profiling, tidak ada arah yang bisa diberikan. Jawab beberapa pertanyaan untuk memulai kalibrasi.
                </p>
                <p className="text-xs text-muted-foreground/80 mb-8 max-w-md leading-relaxed">
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

        {/* ── Tab strip - Simplified ── */}
        <div className="sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="max-w-[1100px] mx-auto px-6 md:px-10">
            <div className="flex items-center gap-6">
              {/* Simple 2-tab navigation */}
              <div className="flex items-center gap-1">
                {tabs.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
                        isActive
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button onClick={handleResetProfile} className="text-[10px] px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors">
                  <RotateCcw className="w-3 h-3 inline mr-1" /> Ubah Jalur
                </button>
                <button onClick={handleSignOut} className="text-[10px] p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <main className="max-w-[1100px] mx-auto px-6 md:px-10 py-8 md:py-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

            {/* HEADER */}
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/70 mb-2">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"} — Jalur aktif
              </p>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-1">{pathData.title}</h1>
              <p className="text-xs text-muted-foreground/60 max-w-lg leading-relaxed">{pathData.description}</p>
              <p className="text-[10px] text-muted-foreground/80 mt-2 max-w-lg leading-relaxed">
                {answerTags.profile_level === "quick"
                  ? `Workspace ini disusun dari ${Object.keys(answerTags).length} data profil cepat. Tingkatkan profil untuk kalibrasi lebih presisi.`
                  : `Workspace ini dikalibrasi dari 7 data profil kamu — model ekonomi, skill, kondisi, hingga tantangan. Semua rekomendasi bersifat personal.`
                }
              </p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="w-full h-px bg-border relative">
                <div className="absolute top-0 left-0 h-px bg-primary/70 transition-all duration-500" style={{ width: `${progress.percent}%` }} />
                <div className="absolute -top-1 w-2 h-2 bg-primary border border-background transition-all duration-500" style={{ left: `${progress.percent}%`, transform: "translateX(-50%)" }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-muted-foreground/80">Minggu {progress.currentWeek} dari 4</span>
                <span className="text-[10px] text-muted-foreground/80">{progress.done}/{progress.total} tugas — {progress.percent}%</span>
              </div>
            </div>

            {/* Key metrics — dihitung berdasarkan jalur & profil */}
            <div className="mb-1">
              <p className="text-[10px] text-muted-foreground/70 mb-2">Estimasi berdasarkan jalur & kondisi kamu saat ini:</p>
            </div>
            <div className="grid grid-cols-3 gap-px bg-border mb-8">
              <div className="bg-background py-3 px-4">
                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/80">Sumber income</p>
                <p className="text-xs text-foreground/80 mt-1">{pathData.moneySource || "Bayaran per project/task dari client langsung"}</p>
              </div>
              <div className="bg-background py-3 px-4">
                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/80">Waktu test</p>
                <p className="text-xs text-foreground/80 mt-1">{pathData.timeToTest || "7–14 hari untuk income pertama"}</p>
              </div>
              <div className="bg-background py-3 px-4">
                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/80">Risiko</p>
                <p className="text-xs text-foreground/80 mt-1">{pathData.riskIfFail || "Rendah — waktu terbuang tapi tidak ada kerugian finansial"}</p>
              </div>
            </div>


            {/* ═══════════════════════════════
                TAB 1: OVERVIEW (Summary + Current Week Only)
            ═══════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* ═══════════════════════════════════════════════════════════════════════════
                    LAYER 1: WELCOME & PERSONALIZED SUMMARY
                    Make the user feel seen and understood from the first glance
                    ═══════════════════════════════════════════════════════════════════════════ */}
                {savedProfile.ai_why_text && (
                  <div className="bg-gradient-to-br from-primary/5 via-background to-background border-2 border-primary/20">
                    <div className="py-6 px-6">
                      {/* Personalized greeting */}
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-lg font-semibold text-foreground mb-1">
                            {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Halo'}, ini jalur karir terbaik untuk kamu
                          </h2>
                          <p className="text-xs text-muted-foreground/80 leading-relaxed">
                            Berdasarkan analisis mendalam terhadap profil kamu — termasuk background,
                            kondisi saat ini, hambatan yang dihadapi, dan target income — berikut adalah
                            peluang yang paling realistis dan cocok untuk situasi unik kamu.
                          </p>
                        </div>
                      </div>

                      {/* AI Insight with emphasis */}
                      <div className="bg-white/50 rounded-lg p-4 border border-border/50">
                        <div className="flex items-start gap-3">
                          <Brain className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-2">
                              Kenapa jalur ini cocok untuk kamu (bukan untuk orang lain)
                            </p>
                            <p className="text-sm text-foreground/90 leading-relaxed">
                              {savedProfile.ai_why_text}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════════════════
                    LAYER 2: YOUR UNIQUE PROFILE — Visual Snapshot
                    Show who they are in a compelling, scannable way
                    ═══════════════════════════════════════════════════════════════════════════ */}
                {(answerTags.digital_experience || answerTags.current_stage || answerTags.income_target) && (
                  <div className="border border-border bg-card">
                    <div className="py-4 px-6 border-b border-border bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.15em] text-foreground font-semibold mb-1">
                            Profil unik kamu
                          </p>
                          <p className="text-xs text-muted-foreground/80">
                            Semua rekomendasi di bawah dipersonalisasi berdasarkan data profil ini
                          </p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-[10px] text-muted-foreground/70 bg-background px-3 py-1.5 rounded-full border border-border">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          <span>8 data points terverifikasi</span>
                        </div>
                      </div>
                    </div>

                    {/* Profile snapshot - more visual and emphasized */}
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Status - highlight card */}
                        {answerTags.current_stage && (
                          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                            <div className="flex items-center gap-2 mb-2">
                              <BadgeCheck className="w-4 h-4 text-primary" />
                              <p className="text-[9px] uppercase tracking-[0.12em] text-foreground/70">Status saat ini</p>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              {decodeLabel("current_stage", answerTags.current_stage)}
                            </p>
                          </div>
                        )}

                        {/* Experience */}
                        {answerTags.digital_experience && (
                          <div className="bg-muted/20 rounded-lg p-4 border border-border">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">Pengalaman digital</p>
                            <p className="text-sm font-semibold text-foreground">
                              {decodeLabel("digital_experience", answerTags.digital_experience)}
                            </p>
                          </div>
                        )}

                        {/* Income Target - emphasized */}
                        {answerTags.income_target && (
                          <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg p-4 border border-secondary/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-4 h-4 text-secondary" />
                              <p className="text-[9px] uppercase tracking-[0.12em] text-foreground/70">Target income</p>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              {decodeLabel("income_target", answerTags.income_target)}
                            </p>
                          </div>
                        )}

                        {/* Tools */}
                        {answerTags.tools_familiarity && (
                          <div className="bg-muted/20 rounded-lg p-4 border border-border">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">Familiarity tools</p>
                            <p className="text-sm font-semibold text-foreground">
                              {decodeLabel("tools_familiarity", answerTags.tools_familiarity)}
                            </p>
                          </div>
                        )}

                        {/* Language */}
                        {answerTags.language_skill && (
                          <div className="bg-muted/20 rounded-lg p-4 border border-border">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">Kemampuan bahasa</p>
                            <p className="text-sm font-semibold text-foreground">
                              {decodeLabel("language_skill", answerTags.language_skill)}
                            </p>
                          </div>
                        )}

                        {/* Challenge */}
                        {answerTags.biggest_challenge && (
                          <div className="bg-muted/20 rounded-lg p-4 border border-border">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">Hambatan terbesar</p>
                            <p className="text-sm font-semibold text-foreground">
                              {decodeLabel("biggest_challenge", answerTags.biggest_challenge)}
                            </p>
                          </div>
                        )}

                        {/* Commitment */}
                        {answerTags.weekly_commitment && (
                          <div className="bg-muted/20 rounded-lg p-4 border border-border">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">Komitmen mingguan</p>
                            <p className="text-sm font-semibold text-foreground">
                              {decodeLabel("weekly_commitment", answerTags.weekly_commitment)}
                            </p>
                          </div>
                        )}

                        {/* Learning Style */}
                        {answerTags.learning_style && (
                          <div className="bg-muted/20 rounded-lg p-4 border border-border">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">Gaya belajar</p>
                            <p className="text-sm font-semibold text-foreground">
                              {decodeLabel("learning_style", answerTags.learning_style)}
                            </p>
                          </div>
                        )}
                      </div>
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

                {/* ═══════════════════════════════════════════════════════════════════════════
                    LAYER 3: YOUR PERSONALIZED JOB MATCH
                    Show why THIS job is perfect for THIS user specifically
                    ═══════════════════════════════════════════════════════════════════════════ */}
                {jobResearch && (
                  <div className="border-2 border-primary/30 bg-gradient-to-b from-primary/[0.02] to-background">
                    {/* Section header - more personal */}
                    <div className="py-5 px-6 border-b border-border">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Search className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-foreground mb-2">
                            Pekerjaan yang paling cocok untuk kamu
                          </h3>
                          <p className="text-xs text-muted-foreground/80 leading-relaxed mb-3">
                            Ini bukan rekomendasi generik. Setiap pekerjaan di bawah sudah dicocokkan dengan
                            <span className="text-foreground font-medium"> status kamu</span> ({decodeLabel("current_stage", answerTags.current_stage || "employee")}),
                            <span className="text-foreground font-medium"> skill digital</span> ({decodeLabel("digital_experience", answerTags.digital_experience || "basic")}),
                            dan <span className="text-foreground font-medium">hambatan</span> ({decodeLabel("biggest_challenge", answerTags.biggest_challenge || "umum")}).
                            Data real dari Google Trends, YouTube, TikTok, dan Google Search digunakan untuk memvalidasi peluang.
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                            <span>3 sumber data diverifikasi • Updated {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TOP JOB HIGHLIGHT — Only primary job with CTA */}
                    {jobResearch?.primaryJob && (
                      <div className="p-6 bg-gradient-to-r from-primary/5 to-background border-b-2 border-primary/30">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-xs font-semibold text-primary mb-1">⭐ Rekomendasi Utama untuk Kamu</p>
                            <p className="text-[10px] text-muted-foreground/70">90% match dengan profil kamu</p>
                          </div>
                          {jobResearch.primaryJob.demandLevel && (
                            <span className="text-[9px] px-2.5 py-1 rounded-full shrink-0 font-medium bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30">
                              🔥 Demand: {jobResearch.primaryJob.demandLevel}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-3">{jobResearch.primaryJob.title}</h3>
                        <p className="text-sm text-foreground/80 leading-relaxed mb-4">{jobResearch.primaryJob.whyThisJob}</p>
                        <button
                          onClick={() => setActiveTab("jobs")}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                        >
                          Lihat Semua Rekomendasi Job →
                        </button>
                      </div>
                    )}

                    {/* Quick links to other tabs */}
                    <div className="grid grid-cols-2 gap-3 p-4">
                      <button onClick={() => setActiveTab("jobs")} className="flex items-center justify-center gap-2 py-3 border border-border hover:border-secondary/50 hover:bg-secondary/5 rounded-lg transition-colors group">
                        <Briefcase className="w-4 h-4 text-muted-foreground/70 group-hover:text-secondary" />
                        <span className="text-xs text-foreground/80 group-hover:text-secondary">Lihat Market Data</span>
                      </button>
                      <button onClick={() => setActiveTab("roadmap")} className="flex items-center justify-center gap-2 py-3 border border-border hover:border-accent/50 hover:bg-accent/5 rounded-lg transition-colors group">
                        <Map className="w-4 h-4 text-muted-foreground/70 group-hover:text-accent" />
                        <span className="text-xs text-foreground/80 group-hover:text-accent">Lihat Roadmap</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Market data loading */}
                {fetchingTrends && !marketFocus && (
                  <div className="py-4 px-5 border border-border flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/70">Mengambil data market</p>
                      <p className="text-xs text-muted-foreground/70">Mengambil data dari Google Trends, YouTube, TikTok...</p>
                    </div>
                  </div>
                )}
                {marketFocus && <MarketFocusCard focus={marketFocus} pathTitle={pathData.title} />}

                {/* Niche recommendation — saran AI super spesifik */}
                {savedProfile.ai_niche_suggestion && (
                  <div className="py-5 px-5 border border-border">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/70 mb-1">Rekomendasi niche spesifik</p>
                        <p className="text-[10px] text-muted-foreground/70 mb-2">AI menyarankan niche yang lebih tajam agar kamu tidak bersaing di market terlalu luas</p>
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

                {/* ═══════════════════════════════════════════════════════════════════════════
                    LAYER 4: YOUR WEEKLY FOCUS — Current Week Progress
                    Motivate action with progress visualization and momentum
                    ═══════════════════════════════════════════════════════════════════════════ */}
                <div className="border-2 border-primary/20 bg-gradient-to-br from-primary/[0.03] to-background">
                  {/* Progress header with momentum */}
                  <div className="py-5 px-6 border-b border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                          <CalendarCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-foreground mb-1">
                            Minggu {progress.currentWeek}: {pathData.weeklyPlan[progress.currentWeek - 1]?.title || 'Loading...'}
                          </h3>
                          <p className="text-xs text-muted-foreground/80">
                            Langkah kecil hari ini membawa kamu mendekati target income {decodeLabel("income_target", answerTags.income_target || "2m_5m")}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => document.getElementById('roadmap-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-[10px] uppercase tracking-wider text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1">
                        Lihat roadmap lengkap <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Progress bar */}
                    {currentWeekTasks.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground/70">Progress minggu ini</span>
                          <span className="font-semibold text-foreground">
                            {currentWeekTasks.filter(t => t.is_completed).length} dari {currentWeekTasks.length} selesai
                          </span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                            style={{ width: `${(currentWeekTasks.filter(t => t.is_completed).length / currentWeekTasks.length) * 100}%` }}
                          />
                        </div>
                        {currentWeekTasks.filter(t => t.is_completed).length === currentWeekTasks.length && (
                          <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 py-2 px-3 rounded-lg border border-primary/20">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="font-medium">Minggu ini selesai! Bagus sekali — lanjut ke minggu depan dengan momentum ini 🚀</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Task list with better visual hierarchy */}
                  <div className="divide-y divide-border/50">
                    {currentWeekTasks.length > 0
                      ? currentWeekTasks.map((task, ti) => {
                          const isCompleted = task.is_completed;
                          return (
                            <div key={ti} className={`group ${isCompleted ? "opacity-40" : ""}`}>
                              <div className="flex items-start gap-4 py-4 px-6 hover:bg-muted/5 transition-colors">
                                <button
                                  onClick={() => handleToggleTask(task.week_number, task.task_index, task.is_completed)}
                                  className="mt-0.5 shrink-0 transition-all hover:scale-110"
                                  disabled={togglingTask === `${task.week_number}-${task.task_index}`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm leading-relaxed ${isCompleted ? "line-through text-muted-foreground" : "text-foreground/90"}`}>
                                    {task.task_text}
                                  </p>
                                  {!isCompleted && ti === currentWeekTasks.filter(t => !t.is_completed).indexOf(task) && (
                                    <p className="text-[10px] text-primary mt-1">↑ Fokus di ini dulu</p>
                                  )}
                                </div>
                                {isCompleted && <span className="text-[9px] text-green-600 dark:text-green-400 font-medium">Selesai</span>}
                              </div>
                            </div>
                          );
                        })
                      : pathData.weeklyPlan[progress.currentWeek - 1]?.tasks.map((task, ti) => (
                          <div key={ti} className="flex items-start gap-4 py-4 px-6">
                            <Circle className="w-5 h-5 text-muted-foreground/60 mt-0.5 shrink-0" />
                            <p className="text-sm text-foreground/80">{task.text}</p>
                          </div>
                        ))
                    }
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════════════════
                    GENERATOR CTA — Action-oriented with clear benefit
                    ═══════════════════════════════════════════════════════════════════════════ */}
                <button
                  onClick={() => setActiveTab("tools")}
                  className="w-full group relative overflow-hidden bg-gradient-to-r from-secondary/10 via-secondary/5 to-background border-2 border-secondary/30 hover:border-secondary/50 transition-all rounded-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <div className="relative flex items-center justify-between py-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-orange-600 flex items-center justify-center shadow-lg shadow-secondary/20 group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-secondary transition-colors">
                          Butuh material eksekusi? Generate di sini
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          Caption, hook, script, bio — semua dipersonalisasi untuk jalur & profil kamu
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/70 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                  </div>
                </button>

                {riskSignals && riskSignals.currentWeek >= 2 && <AntiSunkCostCard weekNumber={riskSignals.currentWeek} />}

                {/* ═══════════════════════════════════════════════════════════════════════════
                    AVOID & EXAMPLES — Guided focus to prevent overwhelm
                    ═══════════════════════════════════════════════════════════════════════════ */}
                {(pathData.avoid?.length > 0 || pathData.examples?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* AVOID - What to ignore */}
                    {pathData.avoid && pathData.avoid.length > 0 && (
                      <div className="border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <span className="text-red-600 dark:text-red-400 text-sm font-bold">✕</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Hindari ini</p>
                            <p className="text-[10px] text-red-600/70 dark:text-red-400/70">Jangan buang waktu di sini</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {pathData.avoid.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-red-700/80 dark:text-red-300/80 leading-relaxed">
                              <span className="text-red-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EXAMPLES - What to start with */}
                    {pathData.examples && pathData.examples.length > 0 && (
                      <div className="border border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/10 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Mulai dari sini</p>
                            <p className="text-[10px] text-green-600/70 dark:text-green-400/70">Inspirasi cepat untuk mulai</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pathData.examples.map((ex, i) => (
                            <span key={i} className="text-xs px-3 py-1.5 bg-background border border-green-500/20 text-green-700 dark:text-green-300 rounded-full hover:bg-green-500/10 transition-colors cursor-default">
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════
                TAB 2: JOBS & MARKET (Job Match + Signals + Calendar)
            ═══════════════════════════════ */}
            {activeTab === "jobs" && (
              <div className="space-y-6">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-secondary/10 via-secondary/5 to-transparent border-l-4 border-secondary rounded-r-xl py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-secondary to-orange-600 rounded-xl shadow-md">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Job Research & Market</h2>
                      <p className="text-xs text-foreground/90 mt-0.5">Detail job match, market signals & calendar</p>
                    </div>
                  </div>
                </div>

                {/* Full Job Match Detail (moved from overview) */}
                {jobResearch && (
                  <div className="border-2 border-secondary/30 bg-gradient-to-b from-secondary/[0.02] to-background">
                    <div className="py-4 px-6 border-b border-border">
                      <h3 className="text-sm font-bold text-foreground mb-2">Rekomendasi Job Lengkap</h3>
                      <p className="text-xs text-muted-foreground/80">Semua rekomendasi job dengan detail lengkap</p>
                    </div>
                    {[
                      { job: jobResearch.primaryJob, tier: "primary", tierLabel: "⭐ Paling cocok untuk kamu", tierDesc: "90% match dengan profil kamu" },
                      { job: jobResearch.secondaryJob, tier: "secondary", tierLabel: "🔄 Alternatif solid", tierDesc: "75% match dengan profil kamu" },
                      { job: jobResearch.exploratoryJob, tier: "exploratory", tierLabel: "🔍 Worth exploring", tierDesc: "Peluang baru dengan upside potensial" },
                    ].map(({ job, tier, tierLabel, tierDesc }) => job && (
                      <div key={tier} className={`p-6 ${tier === "primary" ? "bg-gradient-to-r from-secondary/5 to-background border-b-2 border-secondary/30" : tier === "secondary" ? "bg-muted/10 border-b border-border/50" : "border-b-0 border-border/50"}`}>
                        {/* [Job match content same as overview - keeping it detailed] */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className={`text-xs font-semibold mb-1 ${tier === "primary" ? "text-secondary" : "text-foreground/80"}`}>
                              {tierLabel}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70">{tierDesc}</p>
                          </div>
                          {job.demandLevel && (
                            <span className={`text-[9px] px-2.5 py-1 rounded-full shrink-0 font-medium ${
                              job.demandLevel === "tinggi" ? "bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30" :
                              job.demandLevel === "sedang" ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30" :
                              "bg-muted/30 text-muted-foreground/80 border border-border"
                            }`}>
                              🔥 Demand: {job.demandLevel}
                            </span>
                          )}
                        </div>
                        <h3 className={`text-lg font-bold mb-4 ${tier === "primary" ? "text-foreground" : "text-foreground/90"}`}>
                          {job.title}
                        </h3>
                        <div className="mb-4 p-4 rounded-lg bg-background border-l-4 border-secondary">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-secondary font-semibold mb-2">
                            Kenapa {job.title} cocok untuk KAMU secara spesifik
                          </p>
                          <p className="text-sm text-foreground/90 leading-relaxed font-medium">{job.whyThisJob}</p>
                        </div>
                        {job.evidence && (
                          <div className="mb-4">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-1">Data yang mendukung rekomendasi ini</p>
                            <p className="text-xs text-muted-foreground/80 leading-relaxed">{job.evidence}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-secondary/5 rounded-lg p-3 border border-secondary/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="w-3.5 h-3.5 text-secondary" />
                              <p className="text-[9px] uppercase tracking-[0.12em] text-foreground/70">Potensi income</p>
                            </div>
                            <p className="text-sm font-bold text-foreground">{job.incomeRange}</p>
                          </div>
                          <div className="bg-accent/5 rounded-lg p-3 border border-accent/20">
                            <div className="flex items-center gap-2 mb-1">
                              <CalendarCheck className="w-3.5 h-3.5 text-accent" />
                              <p className="text-[9px] uppercase tracking-[0.12em] text-foreground/70">Timeline</p>
                            </div>
                            <p className="text-sm font-bold text-foreground">{job.timeToFirstIncome}</p>
                          </div>
                        </div>
                        {job.competitiveAdvantage && (
                          <div className="mb-4">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-1">
                              Keunggulan spesifik yang KAMU miliki di bidang ini
                            </p>
                            <p className="text-xs text-foreground/80 leading-relaxed">{job.competitiveAdvantage}</p>
                          </div>
                        )}
                        <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg p-4 border border-secondary/20">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                              <span className="text-white font-bold text-sm">1</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] uppercase tracking-[0.12em] text-secondary font-semibold mb-1">
                                Langkah pertama yang bisa KAMU lakukan hari ini
                              </p>
                              <p className="text-sm text-foreground/90 leading-relaxed font-medium">{job.firstStep}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Market Signals (moved from overview) */}
                {marketSignals.length > 0 && (
                  <div className="border border-border bg-card">
                    <div className="py-3 px-5 border-b border-border">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-foreground font-semibold">{marketSignals.length} Sinyal Market Terpantau</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">Keyword yang sedang trending di niche kamu</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
                      {marketSignals.slice(0, 12).map((signal, i) => (
                        <div key={i} className="bg-background py-3 px-4 flex items-center gap-3">
                          <TrendIcon direction={signal.trend_direction || "stable"} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-foreground/80 truncate">{signal.keyword}</p>
                            <p className="text-[10px] text-muted-foreground/80">{signal.trend_score || 0}%</p>
                          </div>
                          {signal.is_hot && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-foreground/10 text-foreground/90">HOT</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════
                TAB 3: ROADMAP — Fokus 30 Hari
            ═══════════════════════════════ */}
            {activeTab === "roadmap" && (
              <div id="roadmap-section" className="space-y-6">
                {/* Section Header - Blue */}
                <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border-l-4 border-accent rounded-r-xl py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-accent to-blue-700 rounded-xl shadow-md">
                      <Map className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Roadmap Eksekusi</h2>
                      <p className="text-xs text-foreground/90 mt-0.5">Fokus 30 hari — aksi konkret minggu 1-4</p>
                    </div>
                  </div>
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
                          <span className="text-[10px] font-bold text-muted-foreground/80 bg-muted/10 px-2 py-1 w-8 text-center">M{week.week}</span>
                          {isCurrentWeek && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-foreground/10 text-foreground/90">AKTIF</span>}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-foreground/80">{week.title}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {weekSignals.length > 0 && <span className="text-[10px] text-muted-foreground/80">{weekSignals.length} trend</span>}
                          <span className="text-[10px] text-muted-foreground/80">{wCompleted}/{wTasks.length}</span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/70" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/70" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            {weekSignals.length > 0 && (
                              <div className="mx-5 mb-4 py-3 px-4 border border-border/50 bg-muted/5">
                                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/80 mb-1">Konteks market minggu ini</p>
                                <p className="text-[10px] text-muted-foreground/70 mb-2">Data real dari Google Trends — gunakan keyword ini untuk konten/eksekusi minggu ini</p>
                                <div className="flex flex-wrap gap-3">
                                  {weekSignals.map((signal, si) => (
                                    <div key={si} className="flex items-center gap-1.5">
                                      <TrendIcon direction={signal.trend_direction || "stable"} />
                                      <span className="text-xs text-foreground/70">{signal.keyword}</span>
                                      <span className="text-[10px] text-muted-foreground/80">{signal.trend_score || 0}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {week.tasks.map((task, idx) => {
                              const taskProgress = wTasks[idx];
                              const isTaskExpanded = expandedTasks.has(`${week.week}-${idx}`);
                              return (
                                <div key={idx} className={`border-b border-border last:border-b-0`}>
                                  <div
                                    onClick={() => { if (taskProgress?.completed) return; const expanded = new Set(expandedTasks); if (expanded.has(`${week.week}-${idx}`)) expanded.delete(`${week.week}-${idx}`); else expanded.add(`${week.week}-${idx}`); setExpandedTasks(expanded); }}
                                    className={`w-full flex items-start gap-3 py-3 px-5 cursor-pointer ${!taskProgress?.completed ? 'hover:bg-muted/5' : ''} transition-colors`}
                                  >
                                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                                      {taskProgress?.completed ? (
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-muted-foreground/70" />
                                      )}
                                      <span className="text-[10px] font-bold text-muted-foreground/80 bg-muted/10 px-2 py-0.5">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-foreground/80 font-medium">{task.text}</p>
                                      {task.resources && task.resources.length > 0 && (
                                        <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                                          Resources: {task.resources.map((r, ri) => (
                                            <Link key={ri} to={r.url} target="_blank" className="text-foreground/80 hover:text-foreground underline" rel="noreferrer">
                                              {resourceIcon(r.type)}
                                            </Link>
                                          ))}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {task.resources && task.resources.length > 0 && (
                                        <button className="text-[10px] text-primary hover:underline px-2 py-1" onClick={(e) => { e.stopPropagation(); }}>
                                          Resources
                                        </button>
                                      )}
                                      {isTaskExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/70" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/70" />}
                                    </div>
                                  </div>
                                  {isTaskExpanded && task.resources && task.resources.length > 0 && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity:0 }} className="mx-5 mb-4">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {task.resources.map((r, ri) => (
                                          <a key={ri} href={r.url} target="_blank" rel="noreferrer" className="block py-2 px-3 border border-border hover:border-primary/30 transition-all group">
                                            <div className="flex items-center gap-2 mb-1">
                                              {resourceIcon(r.type)}
                                              <span className="text-[9px] font-semibold text-foreground/70">{r.label}</span>
                                            </div>
                                            <p className="text-[9px] text-muted-foreground/80 line-clamp-2">{r.label}</p>
                                          </a>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    );
                })}
              </div>
            )}

            {/* ═══════════════════════════════
                TAB: TOOLS
            ═══════════════════════════════ */}
            {activeTab === "tools" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/70 mb-2">Tools & Resources</p>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Content Generator</h2>
                  <p className="text-xs text-muted-foreground/60 max-w-lg leading-relaxed">
                    Generate caption, hook, script, dan content materials lainnya yang sudah dipersonalisasi dengan profil kamu.
                  </p>
                </div>

                {/* Generator - always expanded, no animation needed */}
                <div className="border-2 border-warning/30 bg-warning/5 rounded-xl p-6">
                  <div className="mb-4">
                        <div className="mb-4">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80 mb-1">Konteks profil:</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-1 border border-warning/30 bg-white rounded">{humanizeKey(economicModel)}</span>
                            <span className="text-muted-foreground/70">→</span>
                            <span className="text-xs px-2 py-1 border border-warning/30 bg-white rounded">{humanizeKey(subSector)}</span>
                            <span className="text-muted-foreground/70">→</span>
                            <span className="text-xs px-2 py-1 border border-warning/30 bg-white rounded">{humanizeKey(niche)}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {availableGenerators.filter(g => g !== "content_calendar").map((genType) => {
                            const label = GENERATOR_LABELS[genType];
                            const isActive = activeGenerator === genType;
                            const hasContent = !!generatedContent[genType];
                            return (
                              <button key={genType} onClick={() => setActiveGenerator(isActive ? null : genType)} className={`bg-white py-3 px-3 text-left border transition-all ${isActive ? "border-warning/50 bg-warning/5" : "border-border hover:border-warning/30"}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-mono">{label.emoji}</span>
                                  {hasContent && <Check className="w-3 h-3 text-warning" />}
                                </div>
                                <p className="text-xs font-medium text-foreground/80">{label.label}</p>
                              </button>
                            );
                          })}
                        </div>
                        {activeGenerator && (
                          <div className="mt-4 border-t border-warning/20 pt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-mono">{GENERATOR_LABELS[activeGenerator].emoji}</span>
                              <p className="text-sm font-medium">{GENERATOR_LABELS[activeGenerator].label}</p>
                            </div>
                            <input
                              type="text"
                              value={generatorInput}
                              onChange={(e) => setGeneratorInput(e.target.value)}
                              placeholder="Topik / konteks (opsional)..."
                              className="w-full px-4 py-2.5 bg-white border border-border text-sm mb-3 focus:outline-none focus:border-warning/50"
                            />
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleGenerate(activeGenerator)} disabled={isGenerating} className="cmd-primary text-xs disabled:opacity-40">
                                {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate</>}
                              </button>
                              {generatedContent[activeGenerator] && (
                                <button onClick={() => copyToClipboard(generatedContent[activeGenerator], activeGenerator)} className="cmd-ghost text-xs">
                                  {copiedKey === activeGenerator ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                </button>
                              )}
                            </div>
                            {generatedContent[activeGenerator] && (
                              <div className="mt-4 p-4 bg-white border border-warning/20 rounded text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                                {generatedContent[activeGenerator]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                </div>
              </div>
            )}



          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
