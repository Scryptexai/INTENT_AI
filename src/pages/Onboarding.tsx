/**
 * Onboarding Page — Profiling → AI Processing → Path Result → Start
 * ====================================================================
 * Core UX flow:
 *   1. 6 questions, 1 per screen, button-click
 *   2. Constraint engine eliminates + scores (rule-based)
 *   3. Save to Supabase → Call AI for why-text + custom tasks + niche
 *   4. Result: 1 primary path + 1 alternative, AI-personalized
 *   5. "Mulai Jalur Ini" → navigate to /path/:pathId
 *
 * Architecture: 70% rule-based, 30% AI personalization
 * Data: Saved to Supabase (NOT localStorage)
 */

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Compass, Loader2, Sparkles, Brain } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfilingFlow from "@/components/ProfilingFlow";
import PathResult from "@/components/PathResult";
import { useAuth } from "@/contexts/AuthContext";
import {
  PROFILING_QUESTIONS,
  ProfilingQuestionId,
  runProfilingEngine,
  getTotalQuestions,
  type ProfileResult,
} from "@/utils/profilingConfig";
import { getPathTemplate } from "@/utils/pathTemplates";
import type { PathId } from "@/utils/profilingConfig";
import {
  saveProfilingResult,
  generateAIWhyText,
  generateAICustomTasks,
  generateAINicheSuggestion,
  loadActiveProfile,
} from "@/services/profileService";
import { canReprofile, canUseAIPersonalization, type PlanType } from "@/services/planGating";
import { generateSubSpecialization, type SubSpecialization } from "@/utils/pathSpecialization";
import UpgradePrompt from "@/components/UpgradePrompt";

type OnboardingPhase = "profiling" | "processing" | "result";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();

  const [phase, setPhase] = useState<OnboardingPhase>("profiling");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<
    Record<ProfilingQuestionId, string>
  >({} as Record<ProfilingQuestionId, string>);
  const [profileResult, setProfileResult] = useState<ProfileResult | null>(null);
  const [aiWhyText, setAiWhyText] = useState<string>("");
  const [aiNiche, setAiNiche] = useState<string>("");
  const [subSpec, setSubSpec] = useState<SubSpecialization | null>(null);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [gateBlock, setGateBlock] = useState<string | null>(null); // upgrade feature key if blocked
  const profileIdRef = useRef<string>("");

  const currentQuestion = PROFILING_QUESTIONS[currentQuestionIdx];
  const totalQuestions = getTotalQuestions();

  // ──────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────

  const handleSelect = useCallback(
    (questionId: ProfilingQuestionId, value: string) => {
      const newAnswers = { ...answers, [questionId]: value };
      setAnswers(newAnswers);

      // Auto-advance after 300ms delay for UX feedback
      setTimeout(() => {
        if (currentQuestionIdx < PROFILING_QUESTIONS.length - 1) {
          setCurrentQuestionIdx((i) => i + 1);
        } else {
          // Last question → run engine + save + AI
          processProfile(newAnswers as Record<ProfilingQuestionId, string>);
        }
      }, 300);
    },
    [answers, currentQuestionIdx]
  );

  const processProfile = async (finalAnswers: Record<ProfilingQuestionId, string>) => {
    if (!user) return;

    const userPlan = (authProfile?.plan || "free") as PlanType;

    // CHECK: Can user re-profile? (free = max 1 re-profiling)
    const reprofileGate = await canReprofile(user.id, userPlan);
    if (!reprofileGate.allowed) {
      setGateBlock(reprofileGate.upgradeFeature || "unlimited_reprofiling");
      return;
    }

    // Phase 1: Rule-based engine (instant)
    setPhase("processing");
    setProcessingStep("Menjalankan constraint engine...");

    const result = runProfilingEngine(finalAnswers);
    setProfileResult(result);

    // Generate sub-specialization (instant, rule-based)
    const spec = generateSubSpecialization(result.primaryPath, result.scores, finalAnswers);
    setSubSpec(spec);

    // Phase 2: Save to Supabase
    setProcessingStep("Menyimpan profil ke database...");
    const { profileId, error } = await saveProfilingResult(
      user.id,
      finalAnswers,
      result.scores,
      result.segment,
      result.primaryPath,
      result.alternatePath,
      result.eliminatedPaths,
      result.pathScores,
      result.answerTags
    );

    if (error || !profileId) {
      console.error("Failed to save profile:", error);
      // Fallback: show results anyway with static text
      setAiWhyText(buildFallbackWhyText(result));
      setPhase("result");
      return;
    }

    profileIdRef.current = profileId;
    const primaryPath = getPathTemplate(result.primaryPath);
    if (!primaryPath) {
      setPhase("result");
      return;
    }

    // CHECK: Can user use AI personalization? (free = no)
    const aiGate = canUseAIPersonalization(userPlan);
    if (!aiGate.allowed) {
      // Free user — skip AI, use fallback text
      setProcessingStep("Membuat rekomendasi...");
      setAiWhyText(buildFallbackWhyText(result));
      setAiNiche("");
      setPhase("result");
      return;
    }

    // Phase 3: AI Personalization (parallel calls) — PRO ONLY
    setProcessingStep("AI sedang menganalisis profil kamu...");

    const [whyText, , niche] = await Promise.all([
      generateAIWhyText(user.id, profileId, result.scores, result.segment, primaryPath),
      generateAICustomTasks(user.id, profileId, result.scores, result.segment, primaryPath),
      generateAINicheSuggestion(user.id, profileId, result.scores, result.segment, primaryPath),
    ]);

    setAiWhyText(whyText || buildFallbackWhyText(result));
    setAiNiche(niche || "");
    setPhase("result");
  };

  const buildFallbackWhyText = (result: ProfileResult): string => {
    const path = getPathTemplate(result.primaryPath);
    if (!path) return "";
    const { scores } = result;
    const parts: string[] = [];
    if (scores.time <= 2) parts.push("Dengan waktu terbatas");
    else parts.push("Dengan waktu yang cukup");
    if (scores.capital === 0) parts.push("tanpa modal awal");
    else if (scores.capital <= 1) parts.push("modal minimal");
    else parts.push("modal yang tersedia");
    if (scores.risk <= 1) parts.push("preferensi risiko rendah");
    else if (scores.risk >= 3) parts.push("kesiapan mengambil risiko tinggi");
    if (scores.skill_primary >= 2) parts.push(`skill ${scores.skill_primary >= 4 ? 'teknis kuat' : 'yang bisa di-leverage'}`);
    return `${parts.join(", ")} — ${path.title} adalah jalur yang paling realistis untuk kamu. ${path.description.split(".").slice(0, 2).join(".")}.`;
  };

  const handleBack = useCallback(() => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((i) => i - 1);
    }
  }, [currentQuestionIdx]);

  const handleStartPath = useCallback(
    (pathId: PathId) => {
      navigate(`/path/${pathId}`);
    },
    [navigate]
  );

  const handleReset = useCallback(() => {
    setPhase("profiling");
    setCurrentQuestionIdx(0);
    setAnswers({} as Record<ProfilingQuestionId, string>);
    setProfileResult(null);
    setAiWhyText("");
    setAiNiche("");
    setSubSpec(null);
    setGateBlock(null);
    profileIdRef.current = "";
  }, []);

  // ──────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        {/* Gate Block — upgrade prompt */}
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

        {!gateBlock && phase === "profiling" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-lg mx-auto"
          >
            {/* Intro (only on first question) */}
            {currentQuestionIdx === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-4">
                  <Compass className="w-3.5 h-3.5" />
                  PROFILING
                </div>
                <p className="text-sm text-muted-foreground/70">
                  11 pertanyaan cepat. Klik saja. Tidak perlu mikir lama.
                </p>
              </motion.div>
            )}

            <ProfilingFlow
              question={currentQuestion}
              totalQuestions={totalQuestions}
              selectedValue={answers[currentQuestion.id]}
              onSelect={handleSelect}
              onBack={handleBack}
              canGoBack={currentQuestionIdx > 0}
            />
          </motion.div>
        )}

        {/* AI Processing Phase */}
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
              Menganalisis Profilmu...
            </h2>
            <p className="text-muted-foreground/70 text-sm mb-6">
              AI sedang membuat rekomendasi yang dipersonalisasi untukmu
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-primary/60">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {processingStep}
            </div>

            {/* Processing steps indicator */}
            <div className="mt-8 max-w-xs mx-auto space-y-2">
              {[
                "Constraint engine — eliminasi jalur",
                "Scoring — ranking jalur tersisa",
                "AI — personalisasi rekomendasi",
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

        {!gateBlock && phase === "result" && profileResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PathResult
              primaryPath={getPathTemplate(profileResult.primaryPath)!}
              alternatePath={
                profileResult.alternatePath
                  ? getPathTemplate(profileResult.alternatePath) || null
                  : null
              }
              eliminatedPaths={profileResult.eliminatedPaths}
              scores={profileResult.scores}
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

export default Onboarding;
