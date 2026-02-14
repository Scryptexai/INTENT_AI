/**
 * QuickOnboarding — Level 1 Quick Mapping (2–4 menit)
 * =====================================================
 * 6 pertanyaan, 1 per layar, progress bar jelas.
 * Bahasa sederhana. Tidak ada jargon. Tidak ada "tes kompetensi".
 *
 * User merasa: "Sistem cepat memahami saya."
 *
 * Hidden strategy: Dari 6 pertanyaan, sistem mendapat:
 *   skill_category, interest_cluster, confidence_bias,
 *   intent_direction, time_availability, current_stage
 *
 * Setelah selesai → langsung ke Dashboard dengan preview arah awal.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Check, Loader2, Compass,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  QUICK_QUESTIONS,
  buildAnswerTags,
  mapDirectionToModel,
  mapToSubSector,
  mapToPlatform,
  mapQuickToLegacyPath,
  inferSkillLevel,
  mapTimeToScore,
  inferRiskFromStage,
  type QuickProfileResult,
  type QuickQuestion,
} from "@/utils/quickProfileConfig";
import {
  mapToLegacyScores,
  mapToLegacySegment,
  generateWorkflowId,
  type ContextScores,
} from "@/utils/branchingProfileConfig";
import type { PathId } from "@/utils/profilingConfig";
import { getPathTemplate } from "@/utils/pathTemplates";
import {
  saveProfilingResult,
  generateAIWhyText,
  generateAINicheSuggestion,
  generateAICustomTasks,
} from "@/services/profileService";
import { canReprofile, canUseAIPersonalization, type PlanType } from "@/services/planGating";
import { generateSubSpecialization } from "@/utils/pathSpecialization";
import { generateJobResearch } from "@/services/jobResearchEngine";
import { saveJobResearchToDB } from "@/services/aiCompanion";
import { fetchRealMarketContext } from "@/services/realMarketData";
import { runFullPipeline } from "@/services/trendPipelineScheduler";
import { hasAnyDataSource } from "@/services/trendDataFetcher";

// ============================================================================
// COMPONENT
// ============================================================================

const QuickOnboarding = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();

  // ── STATE ──
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [phase, setPhase] = useState<"questions" | "processing">("questions");
  const [processingStep, setProcessingStep] = useState("");

  const totalSteps = QUICK_QUESTIONS.length;
  const question = QUICK_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // ── GET CURRENT ANSWER ──
  const getCurrentAnswer = useCallback((): string | string[] | undefined => {
    return answers[question?.id];
  }, [answers, question]);

  // ── HANDLE SINGLE SELECT ──
  const handleSelect = useCallback((optionId: string) => {
    if (!question) return;

    if (question.multiSelect) {
      // Multi-select: toggle
      const current = (answers[question.id] as string[]) || [];
      const maxSelect = question.maxSelect || 99;

      let updated: string[];
      if (optionId === "none") {
        // "Belum punya skill" — deselect everything else
        updated = current.includes("none") ? [] : ["none"];
      } else {
        // Remove "none" if selecting a real skill
        const withoutNone = current.filter(id => id !== "none");
        if (withoutNone.includes(optionId)) {
          updated = withoutNone.filter(id => id !== optionId);
        } else if (withoutNone.length < maxSelect) {
          updated = [...withoutNone, optionId];
        } else {
          return; // max reached
        }
      }

      setAnswers(prev => ({ ...prev, [question.id]: updated }));
    } else {
      // Single select: set and auto-advance
      setAnswers(prev => ({ ...prev, [question.id]: optionId }));

      setTimeout(() => {
        if (currentStep < totalSteps - 1) {
          setCurrentStep(i => i + 1);
        } else {
          processProfile({ ...answers, [question.id]: optionId });
        }
      }, 250);
    }
  }, [question, answers, currentStep, totalSteps]);

  // ── MULTI-SELECT NEXT ──
  const handleMultiNext = useCallback(() => {
    const selected = (answers[question?.id] as string[]) || [];
    if (selected.length === 0) return;

    if (currentStep < totalSteps - 1) {
      setCurrentStep(i => i + 1);
    } else {
      processProfile(answers);
    }
  }, [answers, question, currentStep, totalSteps]);

  // ── BACK ──
  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep(i => i - 1);
  }, [currentStep]);

  // ── PROCESS PROFILE ──
  const processProfile = async (finalAnswers: Record<string, string | string[]>) => {
    if (!user) return;

    const userPlan = (authProfile?.plan || "free") as PlanType;

    // Check reprofiling gate
    const reprofileGate = await canReprofile(user.id, userPlan);
    if (!reprofileGate.allowed) {
      navigate("/dashboard");
      return;
    }

    setPhase("processing");
    setProcessingStep("Memahami profil kamu...");

    // Build QuickProfileResult
    const skills = (finalAnswers.skills as string[]) || ["none"];
    const direction = (finalAnswers.direction as string) || "unsure";
    const time = (finalAnswers.time as string) || "1-2h";
    const stage = (finalAnswers.stage as string) || "employee";
    const incomeTarget = (finalAnswers.income_target as string) || "500k-2m";
    const challenge = (finalAnswers.challenge as string) || "no_direction";

    const quickProfile: QuickProfileResult = {
      skills, direction, time, stage, incomeTarget, challenge,
    };

    // Build answer tags (maps to all downstream systems)
    const answerTags = buildAnswerTags(quickProfile);

    // Derived values
    const economicModel = mapDirectionToModel(direction);
    const subSector = mapToSubSector(direction, skills);
    const niche = subSector; // Level 1 uses sub-sector as niche
    const platform = mapToPlatform(direction, skills);
    const legacyPathId = mapQuickToLegacyPath(direction);
    const skillLevel = inferSkillLevel(skills);
    const timeScore = mapTimeToScore(time);
    const riskScore = inferRiskFromStage(stage);

    // Context scores for downstream
    const contextScores: ContextScores = {
      time: timeScore,
      capital: 0,
      risk: riskScore,
      skillLevel: skillLevel,
      audience: 0,
    };

    // Legacy scores for DB compat
    const legacyScores = mapToLegacyScores(
      contextScores,
      {},
      economicModel,
      subSector,
      platform,
      niche
    );
    const segment = mapToLegacySegment(economicModel, contextScores);

    // Legacy answers format
    const legacyAnswers: Record<string, string> = {
      time: time,
      capital: "zero",
      target_speed: skillLevel >= 2 ? "2w" : "1mo",
      work_style: "silent_build",
      risk: riskScore <= 2 ? "low" : "medium",
      skill_primary: skillLevel <= 1 ? "none" : "writing",
      skill_secondary: "none",
      interest_market: "business",
      audience_access: "zero",
      daily_routine: timeScore <= 2 ? "evening" : "flexible",
      preferred_platform: "marketplace",
    };

    // Save to Supabase
    setProcessingStep("Menyimpan profil...");
    const { profileId, error } = await saveProfilingResult(
      user.id,
      legacyAnswers as any,
      legacyScores,
      segment,
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

    // Sub-specialization
    generateSubSpecialization(legacyPathId, legacyScores, legacyAnswers as any);

    // Check AI gate
    const aiGate = canUseAIPersonalization(userPlan);
    if (!aiGate.allowed) {
      if (hasAnyDataSource()) {
        runFullPipeline(legacyPathId, niche, subSector).catch(console.warn);
      }
      navigate("/dashboard");
      return;
    }

    // AI Personalization (parallel)
    setProcessingStep("Menyusun rekomendasi personal...");

    const marketDataPromise = fetchRealMarketContext(niche, platform).catch(() => null);

    // Build deep profile placeholder for job research
    const deepProfileForResearch: Record<string, string> = {
      skill_level: answerTags.skill_level || "basic",
      risk: answerTags.risk || "low",
      digital_experience: "never", // Level 1 default
      current_stage: stage,
      language_skill: "passive", // Level 1 default
      tools_familiarity: "basic", // Level 1 default
      weekly_commitment: timeScore >= 3 ? "1_month" : "2_weeks",
      income_target: incomeTarget,
      learning_style: "practice", // Level 1 default
      biggest_challenge: challenge,
    };

    await Promise.all([
      generateAIWhyText(user.id, profileId, legacyScores, segment, primaryPath),
      generateAINicheSuggestion(user.id, profileId, legacyScores, segment, primaryPath),
      generateAICustomTasks(user.id, profileId, legacyScores, segment, primaryPath),
      generateJobResearch(
        economicModel, subSector, niche, platform,
        contextScores, deepProfileForResearch, {}
      ).then(async (jobResult) => {
        if (jobResult) {
          await saveJobResearchToDB(profileId, user.id, jobResult);
        }
      }).catch(console.warn),
      marketDataPromise,
    ]);

    // Fire-and-forget: background pipeline
    if (hasAnyDataSource()) {
      runFullPipeline(legacyPathId, niche, subSector).catch(console.warn);
    }

    navigate("/dashboard");
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-20 pb-16 px-4">
        {/* QUESTIONS PHASE */}
        {phase === "questions" && question && (
          <div className="max-w-md mx-auto">
            {/* Header — only on first question */}
            {currentStep === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
              >
                <div className="inline-flex items-center gap-2 mb-4">
                  <Compass className="w-4 h-4 text-foreground/40" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 font-medium">
                    Quick Mapping
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/50">
                  6 pertanyaan. 2 menit. Sistem langsung paham arah kamu.
                </p>
              </motion.div>
            )}

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 font-medium">
                  {currentStep + 1} dari {totalSteps}
                </span>
                <span className="text-[10px] text-muted-foreground/30">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-[3px] bg-border/20 overflow-hidden">
                <motion.div
                  className="h-full bg-foreground/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`q-${currentStep}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Title */}
                <h2 className="text-xl font-bold text-foreground mb-1 leading-tight">
                  {question.title}
                </h2>
                {question.subtitle && (
                  <p className="text-xs text-muted-foreground/50 mb-6">
                    {question.subtitle}
                  </p>
                )}
                {!question.subtitle && <div className="mb-6" />}

                {/* Multi-select hint */}
                {question.multiSelect && (
                  <p className="text-[10px] text-muted-foreground/40 mb-4 uppercase tracking-wider">
                    Pilih {question.maxSelect ? `maks ${question.maxSelect}` : "beberapa"}
                  </p>
                )}

                {/* Options */}
                <div className="space-y-2">
                  {question.options.map((opt, idx) => {
                    const currentAnswer = getCurrentAnswer();
                    const isSelected = question.multiSelect
                      ? (currentAnswer as string[] || []).includes(opt.id)
                      : currentAnswer === opt.id;

                    return (
                      <motion.button
                        key={opt.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => handleSelect(opt.id)}
                        className={`w-full text-left px-4 py-3 border transition-all duration-150 flex items-center gap-3 group ${
                          isSelected
                            ? "bg-foreground/5 border-foreground/30"
                            : "bg-transparent border-border/30 hover:border-foreground/20"
                        }`}
                      >
                        {/* Emoji */}
                        <span className="text-lg shrink-0">{opt.emoji}</span>

                        {/* Label + Hint */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            isSelected ? "text-foreground" : "text-foreground/70"
                          }`}>
                            {opt.label}
                          </p>
                          {opt.hint && (
                            <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                              {opt.hint}
                            </p>
                          )}
                        </div>

                        {/* Checkbox / Radio */}
                        <div className={`w-5 h-5 shrink-0 border flex items-center justify-center transition-all ${
                          question.multiSelect ? "rounded" : "rounded-full"
                        } ${
                          isSelected
                            ? "bg-foreground border-foreground"
                            : "border-muted-foreground/20"
                        }`}>
                          {isSelected && (
                            <Check className="w-3 h-3 text-background" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Multi-select: Next button */}
                {question.multiSelect && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6"
                  >
                    <button
                      onClick={handleMultiNext}
                      disabled={((answers[question.id] as string[]) || []).length === 0}
                      className="w-full py-3 text-sm font-medium border border-foreground/20 hover:border-foreground/40 text-foreground/70 hover:text-foreground transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      Lanjut →
                    </button>
                  </motion.div>
                )}

                {/* Back */}
                {currentStep > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-center"
                  >
                    <button
                      onClick={handleBack}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/40 hover:text-foreground/60 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Kembali
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* PROCESSING PHASE */}
        {phase === "processing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-sm mx-auto text-center py-24"
          >
            <div className="mb-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/30 mx-auto" />
            </div>

            <p className="text-sm font-medium text-foreground/70 mb-2">
              {processingStep}
            </p>
            <p className="text-[10px] text-muted-foreground/30 uppercase tracking-wider">
              Membangun workspace personal kamu
            </p>

            <div className="mt-10 space-y-1.5 max-w-xs mx-auto">
              {[
                "Menganalisis skill & arah",
                "Riset peluang dari internet",
                "Menyusun rekomendasi personal",
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 1.5 }}
                  className="flex items-center gap-2 text-[10px] text-muted-foreground/30"
                >
                  <div className="w-1 h-1 rounded-full bg-foreground/20" />
                  {step}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default QuickOnboarding;
