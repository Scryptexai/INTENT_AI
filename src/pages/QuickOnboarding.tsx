import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, Compass } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Q_SKILLS,
  Q_EXPERIENCE,
  Q_TARGET,
  Q_TIME,
  getSubSkillOptions,
  buildAnswerTags,
  inferEconomicModel,
  inferSubSector,
  inferPlatform,
  inferLegacyPath,
  inferRisk,
  inferCapital,
  mapTimeToScore,
  type QuickProfileResult,
  type QuickOption,
} from "@/utils/quickProfileConfig";
import {
  mapToLegacyScores,
  mapToLegacySegment,
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

const TOTAL_STEPS = 5;

type StepId =
  | "skills"
  | "sub_skill"
  | "experience"
  | "target"
  | "time";

const STEP_IDS: StepId[] = [
  "skills",
  "sub_skill",
  "experience",
  "target",
  "time",
];

const QuickOnboarding = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedSubSkill, setSelectedSubSkill] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<number>(1);
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  // Moved to Level 2: timeline, language, stage
  // const [selectedTimeline, setSelectedTimeline] = useState<string>("");
  // const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  // const [selectedStage, setSelectedStage] = useState<string>("");
  const [phase, setPhase] = useState<"questions" | "processing">("questions");
  const [processingStep, setProcessingStep] = useState("");

  const stepId = STEP_IDS[currentStep];
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  // Q2 options BRANCH from Q1
  const subSkillOptions = useMemo(() => {
    const primarySkill = selectedSkills[0] || "none";
    return getSubSkillOptions(primarySkill);
  }, [selectedSkills]);

  // Q3 title includes sub-skill name from Q2
  const experienceTitle = useMemo(() => {
    if (!selectedSubSkill) return "Berapa lama pengalaman kamu?";
    const primarySkill = selectedSkills[0] || "none";
    const options = getSubSkillOptions(primarySkill);
    const found = options.find((o) => o.id === selectedSubSkill);
    return found
      ? `Berapa lama pengalaman kamu di ${found.label}?`
      : "Berapa lama pengalaman kamu?";
  }, [selectedSubSkill, selectedSkills]);

  // Current question config — changes per step
  const currentQuestion = useMemo(() => {
    switch (stepId) {
      case "skills":
        return { ...Q_SKILLS };
      case "sub_skill": {
        const primaryLabel =
          Q_SKILLS.options.find((o) => o.id === selectedSkills[0])?.label ||
          "skill ini";
        return {
          id: "sub_skill",
          title: `Job role apa dalam ${primaryLabel}?`,
          subtitle: "AI akan susun roadmap berdasarkan job ini.",
          options: subSkillOptions,
        };
      }
      case "experience":
        return { ...Q_EXPERIENCE, title: experienceTitle };
      case "target":
        return Q_TARGET;
      case "time":
        return Q_TIME;
      default:
        return Q_SKILLS;
    }
  }, [stepId, selectedSkills, subSkillOptions, experienceTitle]);

  const isMultiSelect = stepId === "skills";
  const isSlider = stepId === "experience";

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((i) => i + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleSelect = useCallback(
    (optionId: string) => {
      switch (stepId) {
        case "skills": {
          setSelectedSkills((prev) => {
            if (optionId === "none") {
              return prev.includes("none") ? [] : ["none"];
            }
            const withoutNone = prev.filter((id) => id !== "none");
            if (withoutNone.includes(optionId)) {
              return withoutNone.filter((id) => id !== optionId);
            }
            if (withoutNone.length < (Q_SKILLS.maxSelect || 3)) {
              return [...withoutNone, optionId];
            }
            return prev;
          });
          break;
        }
        case "sub_skill":
          setSelectedSubSkill(optionId);
          setTimeout(goNext, 250);
          break;
        case "target":
          setSelectedTarget(optionId);
          setTimeout(goNext, 250);
          break;
        case "time":
          setSelectedTime(optionId);
          // Last question — auto-process after brief animation
          setTimeout(() => processProfile(), 350);
          break;
      }
    },
    [stepId, goNext]
  );

  const handleMultiNext = useCallback(() => {
    if (selectedSkills.length === 0) return;
    goNext();
  }, [selectedSkills, goNext]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      if (stepId === "sub_skill") {
        setSelectedSubSkill("");
      }
      setCurrentStep((i) => i - 1);
    }
  }, [currentStep, stepId]);

  const isOptionSelected = useCallback(
    (optionId: string): boolean => {
      switch (stepId) {
        case "skills":
          return selectedSkills.includes(optionId);
        case "sub_skill":
          return selectedSubSkill === optionId;
        case "target":
          return selectedTarget === optionId;
        case "time":
          return selectedTime === optionId;
        default:
          return false;
      }
    },
    [
      stepId,
      selectedSkills,
      selectedSubSkill,
      selectedTarget,
      selectedTime,
    ]
  );

  // ── PROCESS PROFILE ──
  const processProfile = async () => {
    if (!user) return;

    const userPlan = (authProfile?.plan || "free") as PlanType;

    const reprofileGate = await canReprofile(user.id, userPlan);
    if (!reprofileGate.allowed) {
      navigate("/dashboard");
      return;
    }

    setPhase("processing");
    setProcessingStep("Memahami profil kamu...");

    const skills = selectedSkills.length > 0 ? selectedSkills : ["none"];
    const quickProfile: QuickProfileResult = {
      skills,
      subSkill: selectedSubSkill || "explore_anything",
      experience: experienceLevel,
      target: selectedTarget || "side_income",
      time: selectedTime || "1-2h",
      timeline: "3_months",  // Default (merged into Q4)
      language: "id_only",   // Default (moved to Level 2)
      stage: "employee",     // Default (moved to Level 2)
    };

    const answerTags = buildAnswerTags(quickProfile);

    const primarySkill = skills[0] || "none";
    const economicModel = inferEconomicModel(
      quickProfile.target,
      primarySkill,
      quickProfile.subSkill
    );
    const subSector = inferSubSector(primarySkill, quickProfile.subSkill);
    const niche = subSector;
    const platform = inferPlatform(
      primarySkill,
      quickProfile.subSkill,
      quickProfile.language
    );
    const legacyPathId = inferLegacyPath(
      primarySkill,
      quickProfile.subSkill,
      quickProfile.target
    );
    const timeScore = mapTimeToScore(quickProfile.time);
    const riskScore = inferRisk(quickProfile.stage);
    const capitalScore = inferCapital(quickProfile.stage);

    const contextScores: ContextScores = {
      time: timeScore,
      capital: capitalScore,
      risk: riskScore,
      skillLevel: quickProfile.experience,
      audience: 0,
    };

    const legacyScores = mapToLegacyScores(
      contextScores,
      {},
      economicModel,
      subSector,
      platform,
      niche
    );
    const segment = mapToLegacySegment(economicModel, contextScores);

    const legacyAnswers: Record<string, string> = {
      time: quickProfile.time,
      capital: capitalScore === 0 ? "zero" : "lt50",
      target_speed: quickProfile.experience >= 2 ? "2w" : "1mo",
      work_style: "silent_build",
      risk: riskScore <= 2 ? "low" : "medium",
      skill_primary: primarySkill === "none" ? "none" : primarySkill,
      skill_secondary: skills[1] || "none",
      interest_market: "business",
      audience_access: "zero",
      daily_routine: timeScore <= 2 ? "evening" : "flexible",
      preferred_platform: platform,
    };

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

    generateSubSpecialization(
      legacyPathId,
      legacyScores,
      legacyAnswers as any
    );

    const aiGate = canUseAIPersonalization(userPlan);
    if (!aiGate.allowed) {
      if (hasAnyDataSource()) {
        runFullPipeline(legacyPathId, niche, subSector).catch(console.warn);
      }
      navigate("/dashboard");
      return;
    }

    setProcessingStep("Menyusun rekomendasi personal...");

    const marketDataPromise = fetchRealMarketContext(niche, platform).catch(
      () => null
    );

    const deepProfileForResearch: Record<string, string> = {
      skill_level: answerTags.skill_level || "basic",
      risk: answerTags.risk || "low",
      digital_experience: "never",
      current_stage: quickProfile.stage,
      language_skill: answerTags.language_skill || "passive",
      tools_familiarity: "basic",
      weekly_commitment: timeScore >= 3 ? "1_month" : "2_weeks",
      income_target: answerTags.income_target || "500k-2m",
      learning_style: "practice",
      biggest_challenge: answerTags.biggest_challenge || "no_direction",
    };

    await Promise.all([
      generateAIWhyText(
        user.id,
        profileId,
        legacyScores,
        segment,
        primaryPath
      ),
      generateAINicheSuggestion(
        user.id,
        profileId,
        legacyScores,
        segment,
        primaryPath
      ),
      generateAICustomTasks(
        user.id,
        profileId,
        legacyScores,
        segment,
        primaryPath
      ),
      generateJobResearch(
        economicModel,
        subSector,
        niche,
        platform,
        contextScores,
        deepProfileForResearch,
        {}
      )
        .then(async (jobResult) => {
          if (jobResult) {
            await saveJobResearchToDB(profileId, user.id, jobResult);
          }
        })
        .catch(console.warn),
      marketDataPromise,
    ]);

    if (hasAnyDataSource()) {
      runFullPipeline(legacyPathId, niche, subSector).catch(console.warn);
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal header — just a mark, not full navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-6 md:px-10">
        <Link to="/" className="flex items-center gap-2 text-foreground hover:text-foreground/80 transition-colors">
          <img src="/logo.jpg" alt="INTENT" className="h-7 w-auto" />
          <span className="text-xs font-bold uppercase tracking-wider">INTENT</span>
        </Link>
      </div>

      <main className="pt-16 pb-8 px-4 h-screen flex flex-col">
        {phase === "questions" && (
          <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] section-label">
                  {currentStep + 1} dari {TOTAL_STEPS}
                </span>
                <span className="text-[10px] font-bold text-teal-600">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`q-${currentStep}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <h2 className="text-lg font-bold text-foreground mb-1 leading-tight">
                  {currentQuestion.title}
                </h2>
                {currentQuestion.subtitle && (
                  <p className="text-xs text-muted-foreground/50 mb-4">
                    {currentQuestion.subtitle}
                  </p>
                )}
                {!currentQuestion.subtitle && <div className="mb-4" />}

                {isSlider && (
                  <div className="space-y-6">
                    {/* Active Level Display - Large */}
                    <motion.div
                      key={`exp-${experienceLevel}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center p-6 border border-gray-200 bg-gray-50 rounded-xl"
                    >
                      <p className="text-lg font-bold text-gray-900">
                        {Q_EXPERIENCE.sliderLabels?.[experienceLevel] || ""}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                        Level {experienceLevel}/4
                      </p>
                    </motion.div>

                    {/* Slider Track */}
                    <div className="px-2">
                      <div className="relative">
                        <input
                          type="range"
                          min={0}
                          max={4}
                          step={1}
                          value={experienceLevel}
                          onChange={(e) =>
                            setExperienceLevel(Number(e.target.value))
                          }
                          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gray-900 [&::-moz-range-thumb]:border-3 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
                        />
                      </div>
                      {/* Position Indicators */}
                      <div className="flex justify-between mt-2 px-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${
                              i === experienceLevel
                                ? "bg-gray-900 scale-110"
                                : i < experienceLevel
                                ? "bg-teal-500"
                                : "bg-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* All Level Labels */}
                    <div className="space-y-2">
                      {Q_EXPERIENCE.sliderLabels?.map((label, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 text-sm transition-all ${
                            i === experienceLevel
                              ? "text-gray-900 font-semibold"
                              : "text-gray-400"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              i === experienceLevel
                                ? "bg-gray-900"
                                : "bg-gray-300"
                            }`}
                          />
                          {label}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={goNext}
                      className="w-full py-3 text-sm font-medium border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all rounded-xl"
                    >
                      Lanjut →
                    </button>
                  </div>
                )}

                {!isSlider && (
                  <>
                    {isMultiSelect && currentStep === 0 && (
                      <p className="text-[10px] text-muted-foreground/40 mb-4 uppercase tracking-wider">
                        Pilih satu bidang utama
                      </p>
                    )}

                    {/* Q1: Domain Selection - Standard cards with hint */}
                    {currentStep === 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 flex-1 overflow-y-auto">
                        {currentQuestion.options.map(
                          (opt: QuickOption, idx: number) => {
                            const selected = isOptionSelected(opt.id);
                            return (
                              <motion.button
                                key={opt.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.01 }}
                                onClick={() => handleSelect(opt.id)}
                                className={`text-left p-4 flex flex-col gap-2 group relative overflow-hidden rounded-xl bg-white border transition-all h-[140px] ${
                                  selected
                                    ? 'border-[3px] border-teal-500 bg-teal-50 shadow-md'
                                    : 'border-[2px] border-gray-200 hover:border-teal-300'
                                }`}
                              >
                                {selected && (
                                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}

                                <div className="text-3xl">
                                  {opt.emoji}
                                </div>

                                <div className="flex-1">
                                  <p className={`text-sm font-bold mb-1 leading-snug ${
                                    selected
                                      ? 'text-teal-700'
                                      : 'text-gray-900'
                                  }`}>
                                    {opt.label}
                                  </p>
                                  {opt.hint && (
                                    <p className="text-[10px] text-gray-500 leading-snug">
                                      {opt.hint}
                                    </p>
                                  )}
                                </div>
                              </motion.button>
                            );
                          }
                        )}
                      </div>
                    )}

                    {/* Q2: Job Role - Same size as all other cards */}
                    {currentStep === 1 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 flex-1 overflow-y-auto">
                        {currentQuestion.options.map(
                          (opt: QuickOption, idx: number) => {
                            const selected = isOptionSelected(opt.id);
                            return (
                              <motion.button
                                key={opt.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.01 }}
                                onClick={() => handleSelect(opt.id)}
                                className={`text-left p-4 flex flex-col gap-2 group relative overflow-hidden rounded-xl bg-white border transition-all h-[140px] ${
                                  selected
                                    ? 'border-[3px] border-teal-500 bg-teal-50 shadow-md'
                                    : 'border-[2px] border-gray-200 hover:border-teal-300'
                                }`}
                              >
                                {selected && (
                                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}

                                <div className="text-3xl">
                                  {opt.emoji}
                                </div>

                                <div className="flex-1">
                                  <p className={`text-sm font-bold leading-snug ${
                                    selected
                                      ? 'text-teal-700'
                                      : 'text-gray-900'
                                  }`}>
                                    {opt.label}
                                  </p>
                                </div>
                              </motion.button>
                            );
                          }
                        )}
                      </div>
                    )}

                    {/* Q4-Q8: Standard cards with different grid layouts */}
                    {currentStep >= 3 && (
                      <div className={`grid gap-3 flex-1 overflow-y-auto ${
                        // Q4: 6 options → 2/3 columns
                        currentStep === 3 ? 'grid-cols-2 md:grid-cols-3' :
                        // Q5: 8 options → 2/3/4 columns
                        currentStep === 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
                        // Q6: 4 options → 2/4 columns (wide cards)
                        currentStep === 5 ? 'grid-cols-2 lg:grid-cols-4' :
                        // Q7: 4 options → 2/4 columns
                        currentStep === 6 ? 'grid-cols-2 lg:grid-cols-4' :
                        // Q8: 9 options → 2/3/5 columns
                        'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
                      }`}>
                        {currentQuestion.options.map(
                          (opt: QuickOption, idx: number) => {
                            const selected = isOptionSelected(opt.id);
                            return (
                              <motion.button
                                key={opt.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.01 }}
                                onClick={() => handleSelect(opt.id)}
                                className={`text-left p-4 flex flex-col gap-2 group relative overflow-hidden rounded-xl bg-white border transition-all h-[140px] ${
                                  selected
                                    ? 'border-[3px] border-teal-500 bg-teal-50 shadow-md'
                                    : 'border-[2px] border-gray-200 hover:border-teal-300'
                                }`}
                              >
                                {selected && (
                                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}

                                <div className="text-3xl">
                                  {opt.emoji}
                                </div>

                                <div className="flex-1">
                                  <p className={`text-sm font-bold mb-1 leading-snug ${
                                    selected
                                      ? 'text-teal-700'
                                      : 'text-gray-900'
                                  }`}>
                                    {opt.label}
                                  </p>
                                  {opt.hint && (
                                    <p className="text-[10px] text-gray-500 leading-snug">
                                      {opt.hint}
                                    </p>
                                  )}
                                </div>
                              </motion.button>
                            );
                          }
                        )}
                      </div>
                    )}

                    {isMultiSelect && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6"
                      >
                        <button
                          onClick={handleMultiNext}
                          disabled={selectedSkills.length === 0}
                          className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          Lanjut
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </motion.div>
                    )}
                  </>
                )}

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
              Menyiapkan workspace personal kamu
            </p>
            <div className="mt-10 space-y-1.5 max-w-xs mx-auto">
              {[
                "Menganalisis gap skill kamu",
                "Menyusun roadmap belajar",
                "Generate rencana eksekusi 30 hari",
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
