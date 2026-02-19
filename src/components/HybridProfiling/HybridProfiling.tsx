/**
 * Hybrid Profiling - COMPREHENSIVE VERSION
 * ========================================
 * Modal overlay with detailed profiling questions
 * Collects rich user data for accurate system customization
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { saveProfilingResult } from "@/services/profileService";
import {
  AI_EXPERIENCE_OPTIONS,
  AI_CHALLENGE_OPTIONS,
} from "@/utils/smartProfilingConfig";
import {
  Q_SKILLS,
  getSubSkillOptions,
  Q_EXPERIENCE,
  Q_TARGET,
  Q_TIME,
  Q_TIMELINE,
  Q_LANGUAGE,
  Q_STAGE,
} from "@/utils/quickProfileConfig";

interface FormData {
  // Main profiling
  mainSkill: string | null;
  subSkill: string | null;
  experience: number;
  target: string | null;
  time: string | null;
  timeline: string | null;
  language: string | null;
  stage: string | null;

  // AI experience
  aiExperience: string | null;
  aiChallenges: string[];

  // Personal
  username: string;
}

const HybridProfiling = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    mainSkill: null,
    subSkill: null,
    experience: 0,
    target: null,
    time: null,
    timeline: null,
    language: null,
    stage: null,
    aiExperience: null,
    aiChallenges: [],
    username: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 11;

  // Close modal
  const closeModal = () => {
    setIsOpen(false);
    navigate("/");
  };

  // Next step
  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  // Previous step
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Update field
  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle challenge toggle
  const handleChallengeToggle = useCallback((challenge: string) => {
    setFormData(prev => {
      const isSelected = prev.aiChallenges.includes(challenge);
      if (isSelected) {
        return { ...prev, aiChallenges: prev.aiChallenges.filter(c => c !== challenge) };
      } else {
        return { ...prev, aiChallenges: [...prev.aiChallenges, challenge] };
      }
    });
  }, []);

  // Handle submit
  const handleSubmit = async () => {
    // Validation
    if (!formData.username) {
      alert("Silakan masukkan nama kamu");
      return;
    }
    if (!formData.mainSkill) {
      alert("Silakan pilih minat utama");
      return;
    }
    if (!formData.target) {
      alert("Silakan pilih target");
      return;
    }

    if (!user) {
      alert("Silakan login terlebih dahulu");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    console.log("🚀 Submitting profile for user:", user.id);
    console.log("📊 Form data:", formData);

    try {
      // Map skill ID to proper path ID
      let pathId: string;
      const skillToPathMap: Record<string, string> = {
        design: "ui_designer",
        video_photo: "content_creator",
        content_creator: "niche_content",
        writing: "micro_service",
        tech: "freelance_upgrade",
        marketing: "freelance_upgrade",
        business: "digital_product",
        education: "digital_product",
      };
      pathId = skillToPathMap[formData.mainSkill!] || "micro_service";

      console.log("🎯 Mapped pathId:", pathId);

      // Build answers object matching ProfilingQuestionId type
      const answers = {
        time: formData.time || "1-2h",
        capital: "0",
        target_speed: "moderate",
        work_style: "flexible",
        risk: "medium",
        skill_primary: formData.mainSkill || "tech",
        skill_secondary: formData.subSkill || "",
        interest_market: formData.mainSkill || "tech",
        audience_access: formData.language === "en_fluent" ? "global" : "organic",
        daily_routine: "flexible",
        preferred_platform: "remote",
      };

      // Build scores object
      const timeScoreMap: Record<string, number> = {
        "lt30m": 1,
        "30m-1h": 1,
        "1-2h": 2,
        "2-4h": 3,
        "gt4h": 4,
        "weekend": 1,
        "flexible": 2,
      };

      const scores = {
        time: timeScoreMap[formData.time || "1-2h"] || 2,
        capital: 0,
        target_speed: 3,
        work_style: 3,
        risk: 3,
        skill_primary: 3,
        skill_secondary: formData.subSkill ? 3 : 0,
        interest_market: 3,
        audience_access: formData.language === "en_fluent" ? 4 : 3,
        daily_routine: 3,
        preferred_platform: 3,
      };

      const answerTags = {
        username: formData.username,
        main_skill: formData.mainSkill || "",
        sub_skill: formData.subSkill || "",
        experience_level: String(formData.experience),
        target: formData.target || "",
        time_commitment: formData.time || "",
        timeline: formData.timeline || "",
        language: formData.language || "",
        current_stage: formData.stage || "",
        ai_experience: formData.aiExperience || "",
        ai_challenges: formData.aiChallenges.join(","),
      };

      console.log("💾 Saving profile with:", { answers, scores, pathId });

      const result = await saveProfilingResult(
        user.id,
        answers,
        scores,
        "skill_leverager" as const,
        pathId as any,
        null,
        [],
        { [pathId]: 90 },
        answerTags
      );

      if (result.error) {
        console.error("❌ Error saving profile:", result.error);
        alert("Gagal menyimpan profil: " + result.error);
        setIsSubmitting(false);
        return;
      }

      console.log("✅ Profile saved successfully:", result.profileId);

      // Close modal and navigate
      setIsOpen(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Error submitting:", error);
      alert("Terjadi kesalahan: " + (error as Error).message);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* BACKDROP BLUR */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={closeModal}>
        {/* Modal */}
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Step</span>
                <span className="text-sm font-bold text-teal-600">{step}</span>
                <span className="text-sm text-gray-400">of {totalSteps}</span>
              </div>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-surface-alt rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-surface-deep">
              <div
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* STEP 1: Main Skill */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {Q_SKILLS.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {Q_SKILLS.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {Q_SKILLS.options.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          updateField("mainSkill", option.id);
                          setTimeout(() => nextStep(), 200);
                        }}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          formData.mainSkill === option.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-border hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{option.emoji}</span>
                          <span className="font-semibold text-foreground">{option.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{option.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Sub-Skill */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Pilih spesialisasi {Q_SKILLS.options.find(s => s.id === formData.mainSkill)?.label}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Lebih spesifik akan lebih akurat rekomendasinya
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {getSubSkillOptions(formData.mainSkill || "none").map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          updateField("subSkill", option.id);
                          setTimeout(() => nextStep(), 200);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          formData.subSkill === option.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-border hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{option.emoji}</span>
                          <span className="font-semibold text-sm text-foreground">{option.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{option.hint}</div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (formData.subSkill) {
                        setTimeout(() => nextStep(), 200);
                      }
                    }}
                    disabled={!formData.subSkill}
                    className={`w-full py-3 rounded-lg font-semibold text-sm text-white transition-all ${
                      formData.subSkill
                        ? "bg-teal-500 hover:bg-teal-600"
                        : "bg-muted cursor-not-allowed"
                    }`}
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* STEP 3: Experience Level */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Seberapa berpengalaman kamu di bidang ini?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {Q_EXPERIENCE.subtitle}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {Q_EXPERIENCE.sliderLabels?.map((label, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          updateField("experience", index);
                          setTimeout(() => nextStep(), 200);
                        }}
                        className={`w-full p-4 rounded-lg border text-left transition-all ${
                          formData.experience === index
                            ? "border-teal-500 bg-teal-50"
                            : "border-border hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{label}</span>
                          {formData.experience === index && (
                            <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-card" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Target/Goal */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {Q_TARGET.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {Q_TARGET.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {Q_TARGET.options.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          updateField("target", option.id);
                          setTimeout(() => nextStep(), 200);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          formData.target === option.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-border hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{option.emoji}</span>
                          <span className="font-semibold text-sm text-foreground">{option.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{option.hint}</div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (formData.target) {
                        setTimeout(() => nextStep(), 200);
                      }
                    }}
                    disabled={!formData.target}
                    className={`w-full py-3 rounded-lg font-semibold text-sm text-white transition-all ${
                      formData.target
                        ? "bg-teal-500 hover:bg-teal-600"
                        : "bg-muted cursor-not-allowed"
                    }`}
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* STEP 5: Time Commitment */}
              {step === 5 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {Q_TIME.title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {Q_TIME.options.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          updateField("time", option.id);
                          setTimeout(() => nextStep(), 200);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          formData.time === option.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-border hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{option.emoji}</span>
                          <span className="font-semibold text-sm text-foreground">{option.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{option.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 6: Timeline */}
              {step === 6 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {Q_TIMELINE.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {Q_TIMELINE.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {Q_TIMELINE.options.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          updateField("timeline", option.id);
                          setTimeout(() => nextStep(), 200);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          formData.timeline === option.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-border hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{option.emoji}</span>
                          <span className="font-semibold text-sm text-foreground">{option.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{option.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 7: Language/Market */}
              {step === 7 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {Q_LANGUAGE.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {Q_LANGUAGE.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {Q_LANGUAGE.options.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          updateField("language", option.id);
                          setTimeout(() => nextStep(), 200);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          formData.language === option.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-border hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{option.emoji}</span>
                          <span className="font-semibold text-sm text-foreground">{option.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{option.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 8: Current Stage */}
              {step === 8 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {Q_STAGE.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {Q_STAGE.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {Q_STAGE.options.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          updateField("stage", option.id);
                          setTimeout(() => nextStep(), 200);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          formData.stage === option.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-border hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{option.emoji}</span>
                          <span className="font-semibold text-sm text-foreground">{option.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{option.hint}</div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (formData.stage) {
                        setTimeout(() => nextStep(), 200);
                      }
                    }}
                    disabled={!formData.stage}
                    className={`w-full py-3 rounded-lg font-semibold text-sm text-white transition-all ${
                      formData.stage
                        ? "bg-teal-500 hover:bg-teal-600"
                        : "bg-muted cursor-not-allowed"
                    }`}
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* STEP 9: AI Experience */}
              {step === 9 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Seberapa berpengalaman kamu dengan AI tools?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Seperti ChatGPT, Claude, Midjourney, dll.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {AI_EXPERIENCE_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          updateField("aiExperience", option.id);
                          setTimeout(() => nextStep(), 200);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          formData.aiExperience === option.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-border hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{option.icon}</span>
                          <span className="font-semibold text-sm text-foreground">{option.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{option.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 10: AI Challenges (conditional) */}
              {step === 10 && formData.aiExperience !== "never" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Tantangan apa yang kamu hadapi dengan AI?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Pilih semua yang berlaku
                    </p>
                  </div>

                  <div className="space-y-2">
                    {AI_CHALLENGE_OPTIONS.map(challenge => (
                      <button
                        key={challenge}
                        onClick={() => handleChallengeToggle(challenge)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          formData.aiChallenges.includes(challenge)
                            ? "border-teal-500 bg-teal-50"
                            : "border-border hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{challenge}</span>
                          {formData.aiChallenges.includes(challenge) && (
                            <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-card" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setTimeout(() => nextStep(), 200)}
                    className={`w-full py-3 rounded-lg font-semibold text-sm text-white transition-all bg-teal-500 hover:bg-teal-600`}
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* STEP 10: Skip for new AI users */}
              {step === 10 && formData.aiExperience === "never" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Bagus! Kamu akan belajar AI dari dasar
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Sistem akan mengajarkanmu cara menggunakan AI tools dengan efektif
                    </p>
                  </div>

                  <button
                    onClick={() => setTimeout(() => nextStep(), 200)}
                    className="w-full py-3 rounded-lg font-semibold text-sm text-white bg-teal-500 hover:bg-teal-600"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* STEP 11: Username & Submit */}
              {step === 11 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Terakhir, nama kami panggil apa?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Ini akan muncul di dashboard dan rekomendasi sistem
                    </p>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => updateField("username", e.target.value)}
                      placeholder="Masukkan nama kamu"
                      className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-surface-alt rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-foreground">Ringkasan Profilmu:</h3>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Minat: {Q_SKILLS.options.find(s => s.id === formData.mainSkill)?.label}</div>
                      <div>• Spesialisasi: {getSubSkillOptions(formData.mainSkill || "none").find(s => s.id === formData.subSkill)?.label}</div>
                      <div>• Target: {Q_TARGET.options.find(t => t.id === formData.target)?.label}</div>
                      <div>• Waktu: {Q_TIME.options.find(t => t.id === formData.time)?.label}</div>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!formData.username || !formData.mainSkill || isSubmitting}
                    className={`w-full py-3 rounded-lg font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 ${
                      !formData.username || !formData.mainSkill || isSubmitting
                        ? "bg-muted cursor-not-allowed"
                        : "bg-teal-500 hover:bg-teal-600"
                    }`}
                  >
                    {isSubmitting ? "Building..." : (
                      <>
                        Build My System
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-alt">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                  Back
                </button>
              )}
              <div className="flex-1" />
              <div className="text-xs text-muted-foreground">
                Question {step} of {totalSteps}
              </div>
              <div className="w-16" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HybridProfiling;
