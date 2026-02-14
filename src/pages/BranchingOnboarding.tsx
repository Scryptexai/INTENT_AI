/**
 * BranchingOnboarding — 5-Level Branching Profiling Flow
 * ========================================================
 * Replaces flat 11-question profiling with branching tree:
 *
 * Flow:
 *   1. Economic Model (6 choices)
 *   2. Sub-sector (dynamic based on model)
 *   3. Niche (dynamic based on sub-sector)
 *   4. Platform (dynamic based on model)
 *   5. Context questions (time, capital, risk, skill, audience)
 *   6. Sector-specific questions (2-3 extra based on model)
 *   → Process → Result
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Compass, Loader2, Sparkles, Brain, Check, ArrowLeft, ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
  ECONOMIC_MODELS,
  CONTEXT_QUESTIONS,
  DEEP_PROFILE_QUESTIONS,
  getSubSectors,
  getNiches,
  getPlatforms,
  getSectorQuestions,
  generateWorkflowId,
  mapToLegacyPathId,
  mapToLegacyScores,
  mapToLegacySegment,
  type EconomicModelId,
  type BranchOption,
  type BranchQuestion,
  type BranchingProfileResult,
  type ContextScores,
  type DeepProfileScores,
} from "@/utils/branchingProfileConfig";
import type { PathId } from "@/utils/profilingConfig";
import { getPathTemplate } from "@/utils/pathTemplates";
import {
  saveProfilingResult,
  generateAIWhyText,
  generateAINicheSuggestion,
  generateAICustomTasks,
  loadActiveProfile,
} from "@/services/profileService";
import { canReprofile, canUseAIPersonalization, type PlanType } from "@/services/planGating";
import { generateSubSpecialization, type SubSpecialization } from "@/utils/pathSpecialization";
import { generateJobResearch, type JobResearchResult } from "@/services/jobResearchEngine";
import { saveJobResearchToDB } from "@/services/aiCompanion";
import { fetchRealMarketContext } from "@/services/realMarketData";
import { runFullPipeline } from "@/services/trendPipelineScheduler";
import { hasAnyDataSource } from "@/services/trendDataFetcher";
import UpgradePrompt from "@/components/UpgradePrompt";
import BranchingResult from "@/components/BranchingResult";

// ============================================================================
// STEP TYPES
// ============================================================================

type StepType =
  | "economic_model"
  | "sub_sector"
  | "niche"
  | "platform"
  | "context"
  | "sector_specific"
  | "deep_profile"
  | "processing"
  | "result";

interface Step {
  type: StepType;
  title: string;
  subtitle: string;
  options: BranchOption[];
  questionId?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const BranchingOnboarding = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();

  // ── SELECTIONS ──
  const [selectedModel, setSelectedModel] = useState<EconomicModelId | null>(null);
  const [selectedSubSector, setSelectedSubSector] = useState<string | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [contextAnswers, setContextAnswers] = useState<Record<string, string>>({});
  const [sectorAnswers, setSectorAnswers] = useState<Record<string, string>>({});
  const [deepProfileAnswers, setDeepProfileAnswers] = useState<Record<string, string>>({});

  // ── NAVIGATION ──
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [phase, setPhase] = useState<"profiling" | "processing" | "result">("profiling");

  // ── RESULT ──
  const [profileResult, setProfileResult] = useState<BranchingProfileResult | null>(null);
  const [aiWhyText, setAiWhyText] = useState<string>("");
  const [aiNiche, setAiNiche] = useState<string>("");
  const [subSpec, setSubSpec] = useState<SubSpecialization | null>(null);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [gateBlock, setGateBlock] = useState<string | null>(null);

  // ── BUILD STEPS ──
  const steps = useMemo((): Step[] => {
    const allSteps: Step[] = [];

    // Step 1: Economic Model
    allSteps.push({
      type: "economic_model",
      title: "Model ekonomi mana yang paling cocok untuk kamu?",
      subtitle: "Pilih bagaimana kamu ingin menghasilkan uang",
      options: ECONOMIC_MODELS,
    });

    // Step 2: Sub-sector (dynamic)
    if (selectedModel) {
      const subSectors = getSubSectors(selectedModel);
      allSteps.push({
        type: "sub_sector",
        title: "Bidang spesifik mana yang kamu minati?",
        subtitle: `Di dalam ${ECONOMIC_MODELS.find((m) => m.id === selectedModel)?.label || "model ini"}`,
        options: subSectors,
      });
    }

    // Step 3: Niche (dynamic)
    if (selectedSubSector) {
      const niches = getNiches(selectedSubSector);
      if (niches.length > 0) {
        allSteps.push({
          type: "niche",
          title: "Niche spesifik apa yang mau kamu fokuskan?",
          subtitle: "Semakin spesifik, semakin mudah monetisasi",
          options: niches,
        });
      }
    }

    // Step 4: Platform (dynamic)
    if (selectedModel && (selectedNiche || selectedSubSector)) {
      const platforms = getPlatforms(selectedModel);
      allSteps.push({
        type: "platform",
        title: "Di platform mana kamu mau mulai?",
        subtitle: "Fokus 1 platform dulu untuk 30 hari pertama",
        options: platforms,
      });
    }

    // Step 5+: Context questions (time, capital, risk, skill, audience)
    if (selectedPlatform || (selectedModel && !getPlatforms(selectedModel).length)) {
      CONTEXT_QUESTIONS.forEach((q) => {
        allSteps.push({
          type: "context",
          title: q.title,
          subtitle: q.subtitle,
          options: q.options,
          questionId: q.id,
        });
      });
    }

    // Step N+: Sector-specific questions
    if (selectedModel && Object.keys(contextAnswers).length >= CONTEXT_QUESTIONS.length) {
      const sectorQs = getSectorQuestions(selectedModel, selectedSubSector || undefined);
      sectorQs.forEach((q) => {
        allSteps.push({
          type: "sector_specific",
          title: q.title,
          subtitle: q.subtitle,
          options: q.options,
          questionId: q.id,
        });
      });
    }

    // Step N+: Deep profile questions (Layer 1 — profil bio mendalam)
    const sectorQCount = selectedModel ? getSectorQuestions(selectedModel, selectedSubSector || undefined).length : 0;
    if (selectedModel && Object.keys(sectorAnswers).length >= sectorQCount && Object.keys(contextAnswers).length >= CONTEXT_QUESTIONS.length) {
      DEEP_PROFILE_QUESTIONS.forEach((q) => {
        allSteps.push({
          type: "deep_profile",
          title: q.title,
          subtitle: q.subtitle,
          options: q.options,
          questionId: q.id,
        });
      });
    }

    return allSteps;
  }, [selectedModel, selectedSubSector, selectedNiche, selectedPlatform, contextAnswers]);

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIdx];
  const isLastStep = currentStepIdx >= totalSteps - 1;

  // ── GET CURRENT SELECTION VALUE ──
  const getCurrentValue = useCallback((): string | undefined => {
    if (!currentStep) return undefined;
    switch (currentStep.type) {
      case "economic_model": return selectedModel || undefined;
      case "sub_sector": return selectedSubSector || undefined;
      case "niche": return selectedNiche || undefined;
      case "platform": return selectedPlatform || undefined;
      case "context": return currentStep.questionId ? contextAnswers[currentStep.questionId] : undefined;
      case "sector_specific": return currentStep.questionId ? sectorAnswers[currentStep.questionId] : undefined;
      case "deep_profile": return currentStep.questionId ? deepProfileAnswers[currentStep.questionId] : undefined;
      default: return undefined;
    }
  }, [currentStep, selectedModel, selectedSubSector, selectedNiche, selectedPlatform, contextAnswers, sectorAnswers, deepProfileAnswers]);

  // ── HANDLE SELECT ──
  const handleSelect = useCallback(
    (value: string) => {
      if (!currentStep) return;

      switch (currentStep.type) {
        case "economic_model":
          setSelectedModel(value as EconomicModelId);
          // Reset downstream selections
          setSelectedSubSector(null);
          setSelectedNiche(null);
          setSelectedPlatform(null);
          setContextAnswers({});
          setSectorAnswers({});
          break;
        case "sub_sector":
          setSelectedSubSector(value);
          setSelectedNiche(null);
          setSelectedPlatform(null);
          break;
        case "niche":
          setSelectedNiche(value);
          setSelectedPlatform(null);
          break;
        case "platform":
          setSelectedPlatform(value);
          break;
        case "context":
          if (currentStep.questionId) {
            setContextAnswers((prev) => ({ ...prev, [currentStep.questionId!]: value }));
          }
          break;
        case "sector_specific":
          if (currentStep.questionId) {
            setSectorAnswers((prev) => ({ ...prev, [currentStep.questionId!]: value }));
          }
          break;
        case "deep_profile":
          if (currentStep.questionId) {
            setDeepProfileAnswers((prev) => ({ ...prev, [currentStep.questionId!]: value }));
          }
          break;
      }

      // Auto-advance after delay
      setTimeout(() => {
        if (isLastStep) {
          processProfile();
        } else {
          setCurrentStepIdx((i) => i + 1);
        }
      }, 300);
    },
    [currentStep, isLastStep]
  );

  // ── HANDLE BACK ──
  const handleBack = useCallback(() => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((i) => i - 1);
    }
  }, [currentStepIdx]);

  // ── PROCESS PROFILE ──
  const processProfile = async () => {
    if (!user || !selectedModel || !selectedSubSector) return;

    const userPlan = (authProfile?.plan || "free") as PlanType;

    // Check reprofiling gate
    const reprofileGate = await canReprofile(user.id, userPlan);
    if (!reprofileGate.allowed) {
      setGateBlock(reprofileGate.upgradeFeature || "unlimited_reprofiling");
      return;
    }

    setPhase("processing");
    setProcessingStep("Membangun profil dari pilihan kamu...");

    const nicheValue = selectedNiche || selectedSubSector;
    const platformValue = selectedPlatform || "direct_client";
    const workflowId = generateWorkflowId(selectedModel, selectedSubSector, nicheValue, platformValue);

    // Map context answers to ContextScores
    const timeMap: Record<string, number> = { "lt1h": 1, "1-2h": 2, "3-4h": 3, "gt4h": 4 };
    const capitalMap: Record<string, number> = { "zero": 0, "lt50": 1, "50-200": 2, "200-500": 3 };
    const riskMap: Record<string, number> = { "very_low": 1, "low": 2, "medium": 3, "high": 4 };
    const skillMap: Record<string, number> = { "beginner": 0, "basic": 1, "intermediate": 2, "advanced": 3, "expert": 4 };
    const audienceMap: Record<string, number> = { "zero": 0, "micro": 1, "small": 2, "medium": 3, "large": 4 };

    const contextScores: ContextScores = {
      time: timeMap[contextAnswers.time] || 2,
      capital: capitalMap[contextAnswers.capital] || 0,
      risk: riskMap[contextAnswers.risk] || 2,
      skillLevel: skillMap[contextAnswers.skill_level] || 1,
      audience: audienceMap[contextAnswers.audience] || 0,
    };

    // Map to legacy system for DB compat
    const legacyPathId = mapToLegacyPathId(selectedModel, selectedSubSector);
    const legacyScores = mapToLegacyScores(contextScores, sectorAnswers, selectedModel, selectedSubSector, platformValue, nicheValue);

    // Build answer tags for AI context
    const answerTags: Record<string, string> = {
      economic_model: selectedModel,
      sub_sector: selectedSubSector,
      niche: nicheValue,
      platform: platformValue,
      workflow_id: workflowId,
      ...contextAnswers,
      ...sectorAnswers,
      ...deepProfileAnswers,
    };

    // Build legacy answers for DB — map from branching selections
    // Map niche to legacy interest_market value
    const nicheToMarketValue: Record<string, string> = {
      "health_content": "health", "education": "education", "gaming_content": "gaming",
      "finance_content": "finance", "tech_content": "tech", "lifestyle": "creative",
      "selfimprovement": "education", "health_affiliate": "health", "finance_affiliate": "finance",
      "software_affiliate": "tech", "education_affiliate": "education", "gadget_affiliate": "tech",
      "copywriting": "business", "seo_content": "business", "script_writing": "creative",
      "technical_writing": "tech", "ui_ux": "tech", "branding": "business",
      "social_media_design": "creative", "thumbnail_design": "creative",
    };
    const subSectorToMarketValue: Record<string, string> = {
      "writing": "business", "design": "creative", "video": "creative",
      "development": "tech", "marketing": "business", "ai_operator": "tech",
      "content_creator": "business", "micro_influencer": "business",
      "niche_page": "creative", "community_builder": "education",
      "ebook": "education", "template": "business", "prompt_pack": "tech",
      "course_mini": "education", "dropship": "ecommerce", "affiliate": "business",
      "trend_researcher": "business", "newsletter_writer": "business",
      "ai_curator": "tech", "nocode_builder": "tech", "ai_workflow": "tech",
    };
    const marketValue = nicheToMarketValue[nicheValue] || subSectorToMarketValue[selectedSubSector] || "business";

    // Map sub-sector to work_style value with camera_comfort override
    let workStyleValue = "silent_build";
    const workStyleFromSubSector: Record<string, string> = {
      "writing": "longform_write", "design": "video_edit", "video": "video_edit",
      "development": "silent_build", "marketing": "research",
      "ai_operator": "silent_build", "content_creator": "video_face",
      "micro_influencer": "shortform", "niche_page": "silent_build",
      "community_builder": "people",
    };
    workStyleValue = workStyleFromSubSector[selectedSubSector] || "silent_build";
    // Override based on camera comfort
    if (sectorAnswers.camera_comfort) {
      if (sectorAnswers.camera_comfort === "no_face") workStyleValue = "silent_build";
      else if (sectorAnswers.camera_comfort === "prefer_no") workStyleValue = "shortform";
    }

    // Map platform to legacy value
    const platformToLegacy: Record<string, string> = {
      "tiktok": "tiktok_reels", "instagram": "tiktok_reels", "youtube": "youtube",
      "twitter_x": "twitter", "linkedin": "linkedin", "substack": "own_website",
      "fiverr": "marketplace", "upwork": "marketplace", "gumroad": "own_website",
      "direct_client": "marketplace", "shopee": "marketplace", "own_website": "own_website",
      "substack_dr": "own_website", "linkedin_dr": "linkedin", "linkedin_auto": "linkedin",
      "podcast": "youtube", "own_blog": "own_website",
    };
    const legacyPlatform = platformToLegacy[platformValue] || "marketplace";

    // Map skill answer to legacy value
    const skillToLegacy: Record<string, string> = {
      "beginner": "none", "basic": "writing", "intermediate": "writing",
      "advanced": "marketing", "expert": "marketing",
    };

    const legacyAnswers: Record<string, string> = {
      time: contextAnswers.time || "1-2h",
      capital: contextAnswers.capital || "zero",
      target_speed: contextScores.skillLevel >= 3 ? "2w" : "1mo",
      work_style: workStyleValue,
      risk: contextAnswers.risk || "low",
      skill_primary: skillToLegacy[contextAnswers.skill_level] || "none",
      skill_secondary: contextScores.skillLevel >= 2 ? "social_media" : "none",
      interest_market: marketValue,
      audience_access: contextAnswers.audience || "zero",
      daily_routine: contextScores.time <= 2 ? "evening" : "flexible",
      preferred_platform: legacyPlatform,
    };

    // Build deep profile scores
    const deepExpMap: Record<string, number> = { never: 0, tried_failed: 1, side_project: 2, working_digital: 3, experienced: 4 };
    const deepStageMap: Record<string, number> = { student: 0, employee: 1, freelancer: 2, unemployed: 1, entrepreneur: 3, stay_home: 1 };
    const deepLangMap: Record<string, number> = { none: 0, passive: 1, moderate: 2, fluent: 3 };
    const deepToolsMap: Record<string, number> = { none: 0, basic: 1, intermediate: 2, advanced: 3 };
    const deepCommitMap: Record<string, number> = { "1_week": 1, "2_weeks": 2, "1_month": 3, "3_months": 4 };
    const deepIncomeMap: Record<string, number> = { lt500k: 1, "500k-2m": 2, "2m-5m": 3, "5m-15m": 4, gt15m: 5 };
    const deepLearnMap: Record<string, number> = { video: 1, reading: 2, practice: 3 };
    const deepChallengeMap: Record<string, number> = { no_direction: 1, no_skill: 2, no_time: 3, no_confidence: 4, tried_failed: 5 };

    const deepProfileScores: DeepProfileScores = {
      digitalExperience: deepExpMap[deepProfileAnswers.digital_experience] || 0,
      currentStage: deepStageMap[deepProfileAnswers.current_stage] || 0,
      languageSkill: deepLangMap[deepProfileAnswers.language_skill] || 0,
      toolsFamiliarity: deepToolsMap[deepProfileAnswers.tools_familiarity] || 0,
      weeklyCommitment: deepCommitMap[deepProfileAnswers.weekly_commitment] || 1,
      incomeTarget: deepIncomeMap[deepProfileAnswers.income_target] || 1,
      learningStyle: deepLearnMap[deepProfileAnswers.learning_style] || 1,
      biggestChallenge: deepChallengeMap[deepProfileAnswers.biggest_challenge] || 1,
    };

    const result: BranchingProfileResult = {
      economicModel: selectedModel,
      subSector: selectedSubSector,
      niche: nicheValue,
      platform: platformValue,
      workflowId,
      contextScores,
      sectorAnswers,
      deepProfile: deepProfileAnswers,
      deepProfileScores,
      legacyPathId,
      legacyScores,
      legacySegment: mapToLegacySegment(selectedModel, contextScores),
      answerTags,
    };

    setProfileResult(result);

    // Generate sub-specialization
    const spec = generateSubSpecialization(legacyPathId, legacyScores, legacyAnswers as any);
    setSubSpec(spec);

    // Save to Supabase (using legacy format for DB compat)
    setProcessingStep("Menyimpan profil ke database...");
    const { profileId, error } = await saveProfilingResult(
      user.id,
      legacyAnswers as any,
      legacyScores,
      mapToLegacySegment(selectedModel, contextScores),
      legacyPathId,
      null,
      [],
      { [legacyPathId]: 10 },
      answerTags
    );

    if (error || !profileId) {
      console.error("Failed to save profile:", error);
      navigate("/dashboard");
      return;
    }

    const primaryPath = getPathTemplate(legacyPathId);
    if (!primaryPath) {
      navigate("/dashboard");
      return;
    }

    // Check AI gate
    const aiGate = canUseAIPersonalization(userPlan);
    if (!aiGate.allowed) {
      setProcessingStep("Membuat rekomendasi...");
      // Start pipeline even without AI personalization
      if (hasAnyDataSource()) {
        runFullPipeline(legacyPathId, result.niche, result.subSector).catch((err) =>
          console.warn("[BranchingOnboarding] Background pipeline failed:", err)
        );
      }
      navigate("/dashboard");
      return;
    }

    // AI Personalization
    setProcessingStep("AI sedang menganalisis profil kamu...");

    // Pre-fetch real market data in background so AI context is richer
    const marketDataPromise = fetchRealMarketContext(nicheValue, platformValue).catch(() => null);

    // Run ALL AI personalization in parallel
    setProcessingStep("AI personal sedang riset profil, job & roadmap kamu...");

    const segment = mapToLegacySegment(selectedModel, contextScores);

    await Promise.all([
      // 1. AI Why Text — kenapa jalur ini cocok
      generateAIWhyText(user.id, profileId, legacyScores, segment, primaryPath),
      // 2. AI Niche Suggestion — niche super spesifik
      generateAINicheSuggestion(user.id, profileId, legacyScores, segment, primaryPath),
      // 3. AI Custom Tasks — personalized roadmap (BUKAN template!)
      generateAICustomTasks(user.id, profileId, legacyScores, segment, primaryPath),
      // 4. Layer 2: Job Research — data-driven job matching
      generateJobResearch(
        selectedModel,
        selectedSubSector,
        nicheValue,
        platformValue,
        contextScores,
        deepProfileAnswers,
        sectorAnswers
      ).then(async (jobResult) => {
        if (jobResult) {
          // Save to Supabase (persistent) + localStorage (fallback)
          await saveJobResearchToDB(profileId, user.id, jobResult);
        }
      }).catch((err) => console.warn("[BranchingOnboarding] Job research failed:", err)),
      // 5. Pre-fetch market data for Dashboard
      marketDataPromise,
    ]);

    // Fire-and-forget: start fetching market data in background
    // so Dashboard has data when user arrives
    if (hasAnyDataSource()) {
      runFullPipeline(legacyPathId, result.niche, result.subSector).catch((err) =>
        console.warn("[BranchingOnboarding] Background pipeline failed:", err)
      );
    }

    navigate("/dashboard");
  };

  const buildFallbackWhyText = (result: BranchingProfileResult): string => {
    const modelInfo = ECONOMIC_MODELS.find((m) => m.id === result.economicModel);
    const subSectors = getSubSectors(result.economicModel);
    const subSectorInfo = subSectors.find((s) => s.id === result.subSector);

    const parts: string[] = [];
    if (result.contextScores.time <= 2) parts.push("Dengan waktu terbatas");
    else parts.push("Dengan waktu yang cukup");
    if (result.contextScores.capital === 0) parts.push("tanpa modal awal");
    else parts.push("modal yang tersedia");
    if (result.contextScores.skillLevel >= 2) parts.push("skill yang bisa di-leverage");

    return `${parts.join(", ")} — model ${modelInfo?.label || result.economicModel} di bidang ${subSectorInfo?.label || result.subSector} adalah jalur yang paling realistis untuk kamu. Fokus di niche ${result.niche} dan mulai eksekusi di platform ${result.platform}.`;
  };

  const handleStartPath = useCallback(
    (pathId: PathId) => {
      navigate(`/path/${pathId}`);
    },
    [navigate]
  );

  const handleReset = useCallback(() => {
    setPhase("profiling");
    setCurrentStepIdx(0);
    setSelectedModel(null);
    setSelectedSubSector(null);
    setSelectedNiche(null);
    setSelectedPlatform(null);
    setContextAnswers({});
    setSectorAnswers({});
    setDeepProfileAnswers({});
    setProfileResult(null);
    setAiWhyText("");
    setAiNiche("");
    setSubSpec(null);
    setGateBlock(null);
  }, []);

  // ── STEP LABEL for progress ──
  const getStepLabel = (): string => {
    if (!currentStep) return "";
    switch (currentStep.type) {
      case "economic_model": return "Model Ekonomi";
      case "sub_sector": return "Bidang";
      case "niche": return "Niche";
      case "platform": return "Platform";
      case "context": return "Profil";
      case "sector_specific": return "Detail";
      case "deep_profile": return "Bio Profil";
      default: return "";
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        {/* Gate Block */}
        {gateBlock && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto py-10"
          >
            <UpgradePrompt
              feature={gateBlock}
              onDismiss={() => {
                setGateBlock(null);
                navigate("/dashboard");
              }}
            />
          </motion.div>
        )}

        {/* PROFILING PHASE */}
        {!gateBlock && phase === "profiling" && currentStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-lg mx-auto"
          >
            {/* Intro (first step only) */}
            {currentStepIdx === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-4">
                  <Compass className="w-3.5 h-3.5" />
                  SMART PROFILING
                </div>
                <h1 className="text-2xl font-black mb-2">Temukan Jalur Income Kamu</h1>
                <p className="text-sm text-muted-foreground/70">
                  Jawab beberapa pertanyaan. Sistem akan menentukan model bisnis, niche, dan workflow terbaik untuk kamu.
                </p>
              </motion.div>
            )}

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                  {getStepLabel()}
                </span>
                <span className="text-xs font-bold text-primary/80">
                  {currentStepIdx + 1}/{totalSteps}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentStepIdx + 1) / totalSteps) * 100}%`,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>

              {/* Breadcrumb */}
              <div className="flex items-center gap-1 mt-3 flex-wrap">
                {selectedModel && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                    {ECONOMIC_MODELS.find((m) => m.id === selectedModel)?.emoji}{" "}
                    {ECONOMIC_MODELS.find((m) => m.id === selectedModel)?.label?.split(" ").slice(0, 2).join(" ")}
                  </span>
                )}
                {selectedSubSector && (
                  <>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-500/10 text-[10px] font-bold text-slate-400">
                      {getSubSectors(selectedModel!).find((s) => s.id === selectedSubSector)?.label?.split(" ").slice(0, 2).join(" ")}
                    </span>
                  </>
                )}
                {selectedNiche && (
                  <>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                      {getNiches(selectedSubSector!).find((n) => n.id === selectedNiche)?.label?.split(" ").slice(0, 2).join(" ")}
                    </span>
                  </>
                )}
                {selectedPlatform && (
                  <>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                      {getPlatforms(selectedModel!).find((p) => p.id === selectedPlatform)?.label}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${currentStepIdx}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="text-center mb-8"
              >
                <h2 className="text-2xl md:text-3xl font-black mb-2">
                  {currentStep.title}
                </h2>
                <p className="text-sm text-muted-foreground/70">
                  {currentStep.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Options */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`opts-${currentStepIdx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {currentStep.options.map((opt, idx) => {
                  const selectedValue = getCurrentValue();
                  const isSelected = selectedValue === opt.id;

                  return (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => handleSelect(opt.id)}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 group ${
                        isSelected
                          ? "bg-primary/10 border-primary/50 shadow-md shadow-primary/10"
                          : "bg-card/50 border-border/30 hover:border-primary/30 hover:bg-primary/5"
                      }`}
                    >
                      <span className="text-2xl shrink-0">{opt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-base font-semibold ${
                            isSelected ? "text-foreground" : "text-foreground/80"
                          }`}
                        >
                          {opt.label}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {opt.subtitle}
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/20 group-hover:border-primary/40"
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Back */}
            {currentStepIdx > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center"
              >
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* PROCESSING PHASE */}
        {!gateBlock && phase === "processing" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center py-20"
          >
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <Brain className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-amber-400 animate-bounce" />
              </div>
            </div>

            <h2 className="text-2xl font-black mb-3">
              Membangun Workflow Kamu...
            </h2>
            <p className="text-muted-foreground/70 text-sm mb-6">
              AI sedang menyusun rekomendasi berdasarkan profil branching kamu
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-primary/60">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {processingStep}
            </div>

            <div className="mt-8 max-w-xs mx-auto space-y-2">
              {[
                "Mapping model ekonomi → sub-sektor → niche",
                "Menganalisis profil mendalam (bio user)",
                "Riset job & opportunity yang tepat",
                "AI personalisasi rekomendasi",
                "Menyusun workspace eksekusi",
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 1.2 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground/40"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                  {step}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* RESULT PHASE */}
        {!gateBlock && phase === "result" && profileResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BranchingResult
              profile={profileResult}
              whyText={aiWhyText}
              nicheSuggestion={aiNiche}
              subSpec={subSpec}
              onStartPath={handleStartPath}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BranchingOnboarding;
