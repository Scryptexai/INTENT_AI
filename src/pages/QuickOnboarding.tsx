import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Compass } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  Q_SKILLS,
  Q_EXPERIENCE,
  Q_TARGET,
  Q_TIME,
  Q_LANGUAGE,
  Q_STAGE,
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

const TOTAL_STEPS = 7;

type StepId =
  | "skills"
  | "sub_skill"
  | "experience"
  | "target"
  | "time"
  | "language"
  | "stage";

const STEP_IDS: StepId[] = [
  "skills",
  "sub_skill",
  "experience",
  "target",
  "time",
  "language",
  "stage",
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
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("");
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
          title: `Lebih spesifik di ${primaryLabel}?`,
          subtitle: "Pilih yang paling mendekati.",
          options: subSkillOptions,
        };
      }
      case "experience":
        return { ...Q_EXPERIENCE, title: experienceTitle };
      case "target":
        return Q_TARGET;
      case "time":
        return Q_TIME;
      case "language":
        return Q_LANGUAGE;
      case "stage":
        return Q_STAGE;
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
          setTimeout(goNext, 250);
          break;
        case "language":
          setSelectedLanguage(optionId);
          setTimeout(goNext, 250);
          break;
        case "stage":
          setSelectedStage(optionId);
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
        case "language":
          return selectedLanguage === optionId;
        case "stage":
          return selectedStage === optionId;
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
      selectedLanguage,
      selectedStage,
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
      target: selectedTarget || "first_income",
      time: selectedTime || "1-2h",
      language: selectedLanguage || "id_only",
      stage: selectedStage || "employee",
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
      <Navbar />

      <main className="pt-20 pb-16 px-4">
        {phase === "questions" && (
          <div className="max-w-md mx-auto">
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
                  7 pertanyaan. 2 menit. Sistem langsung paham arah kamu.
                </p>
              </motion.div>
            )}

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 font-medium">
                  {currentStep + 1} dari {TOTAL_STEPS}
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

            <AnimatePresence mode="wait">
              <motion.div
                key={`q-${currentStep}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-bold text-foreground mb-1 leading-tight">
                  {currentQuestion.title}
                </h2>
                {currentQuestion.subtitle && (
                  <p className="text-xs text-muted-foreground/50 mb-6">
                    {currentQuestion.subtitle}
                  </p>
                )}
                {!currentQuestion.subtitle && <div className="mb-6" />}

                {isSlider && (
                  <div className="space-y-6">
                    <div className="px-2">
                      <input
                        type="range"
                        min={0}
                        max={4}
                        step={1}
                        value={experienceLevel}
                        onChange={(e) =>
                          setExperienceLevel(Number(e.target.value))
                        }
                        className="w-full h-2 bg-border/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:cursor-pointer"
                      />
                      <div className="flex justify-between mt-1 px-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              i <= experienceLevel
                                ? "bg-foreground/50"
                                : "bg-border/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <motion.div
                      key={`exp-${experienceLevel}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center p-4 border border-foreground/15 bg-foreground/[0.02]"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {Q_EXPERIENCE.sliderLabels?.[experienceLevel] || ""}
                      </p>
                      <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-wider">
                        Level {experienceLevel}/4
                      </p>
                    </motion.div>

                    <div className="space-y-1">
                      {Q_EXPERIENCE.sliderLabels?.map((label, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 text-[10px] transition-all ${
                            i === experienceLevel
                              ? "text-foreground font-medium"
                              : "text-muted-foreground/30"
                          }`}
                        >
                          <div
                            className={`w-1 h-1 rounded-full ${
                              i === experienceLevel
                                ? "bg-foreground"
                                : "bg-muted-foreground/20"
                            }`}
                          />
                          {label}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={goNext}
                      className="w-full py-3 text-sm font-medium border border-foreground/20 hover:border-foreground/40 text-foreground/70 hover:text-foreground transition-all"
                    >
                      Lanjut →
                    </button>
                  </div>
                )}

                {!isSlider && (
                  <>
                    {isMultiSelect && (
                      <p className="text-[10px] text-muted-foreground/40 mb-4 uppercase tracking-wider">
                        Pilih maks {Q_SKILLS.maxSelect || 3}
                      </p>
                    )}

                    <div className="space-y-2">
                      {currentQuestion.options.map(
                        (opt: QuickOption, idx: number) => {
                          const selected = isOptionSelected(opt.id);
                          return (
                            <motion.button
                              key={opt.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              onClick={() => handleSelect(opt.id)}
                              className={`w-full text-left px-4 py-3 border transition-all duration-150 flex items-center gap-3 group ${
                                selected
                                  ? "bg-foreground/5 border-foreground/30"
                                  : "bg-transparent border-border/30 hover:border-foreground/20"
                              }`}
                            >
                              <span className="text-lg shrink-0">
                                {opt.emoji}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium ${
                                    selected
                                      ? "text-foreground"
                                      : "text-foreground/70"
                                  }`}
                                >
                                  {opt.label}
                                </p>
                                {opt.hint && (
                                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                                    {opt.hint}
                                  </p>
                                )}
                              </div>
                              <div
                                className={`w-5 h-5 shrink-0 border flex items-center justify-center transition-all ${
                                  isMultiSelect ? "rounded" : "rounded-full"
                                } ${
                                  selected
                                    ? "bg-foreground border-foreground"
                                    : "border-muted-foreground/20"
                                }`}
                              >
                                {selected && (
                                  <Check className="w-3 h-3 text-background" />
                                )}
                              </div>
                            </motion.button>
                          );
                        }
                      )}
                    </div>

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
                          className="w-full py-3 text-sm font-medium border border-foreground/20 hover:border-foreground/40 text-foreground/70 hover:text-foreground transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          Lanjut →
                        </button>
                      </motion.div>
                    )}

                    {stepId === "stage" && selectedStage && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6"
                      >
                        <button
                          onClick={processProfile}
                          className="w-full py-3 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-all"
                        >
                          Selesai — Lihat Hasil →
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
