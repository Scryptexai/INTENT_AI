/**
 * ProfileUpgradePrompt — Level 2 Profile Enhancement
 * ====================================================
 * Shows after 3-7 days of use.
 * "Ingin arah lebih presisi? Tingkatkan profil Anda."
 *
 * Not forced. Logical upsell. User already experienced value.
 * This is "penyempurnaan arah", NOT "validasi" or "tes".
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, ArrowLeft, Sparkles, X,
} from "lucide-react";
import { UPGRADE_QUESTIONS, type QuickQuestion } from "@/utils/quickProfileConfig";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  profileId: string;
  userId: string;
  currentAnswerTags: Record<string, string>;
  onComplete: (updatedTags: Record<string, string>) => void;
  onDismiss: () => void;
}

const ProfileUpgradePrompt = ({
  profileId, userId, currentAnswerTags, onComplete, onDismiss,
}: Props) => {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const question = UPGRADE_QUESTIONS[currentStep];
  const totalSteps = UPGRADE_QUESTIONS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // ── HANDLE SELECT ──
  const handleSelect = async (optionId: string) => {
    if (!question) return;

    const updated = { ...answers, [question.id]: optionId };
    setAnswers(updated);

    if (currentStep < totalSteps - 1) {
      setTimeout(() => setCurrentStep(i => i + 1), 200);
    } else {
      // Save all upgrade answers
      setSaving(true);
      const mergedTags = {
        ...currentAnswerTags,
        ...updated,
        profile_level: "upgraded",
      };

      try {
        await supabase
          .from("profiling_results")
          .update({ answer_tags: mergedTags })
          .eq("id", profileId);

        onComplete(mergedTags);
      } catch (err) {
        console.error("Failed to save upgrade:", err);
        onComplete(mergedTags); // still update locally
      }
    }
  };

  // ── INITIAL PROMPT (before starting) ──
  if (!started) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-foreground/10 bg-foreground/[0.02] p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 border border-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-foreground/40" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                Penyempurnaan Arah
              </p>
              <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                Jawab {totalSteps} pertanyaan lagi untuk rekomendasi yang lebih presisi — berdasarkan pengalaman, tools, dan kondisi spesifik kamu.
              </p>
              <button
                onClick={() => setStarted(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground/70 hover:text-foreground border border-foreground/15 hover:border-foreground/30 px-3 py-1.5 transition-all"
              >
                Tingkatkan Profil
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-muted-foreground/30 hover:text-foreground/50 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    );
  }

  // ── SAVING ──
  if (saving) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border border-foreground/10 p-5 text-center"
      >
        <Sparkles className="w-5 h-5 text-foreground/30 mx-auto mb-2 animate-pulse" />
        <p className="text-xs text-muted-foreground/50">
          Menyimpan penyempurnaan profil...
        </p>
      </motion.div>
    );
  }

  // ── QUESTIONS FLOW ──
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border border-foreground/10 bg-foreground/[0.02]"
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-foreground/5 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40">
          Penyempurnaan {currentStep + 1}/{totalSteps}
        </span>
        <div className="w-20 h-[2px] bg-border/20 overflow-hidden">
          <motion.div
            className="h-full bg-foreground/40"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`upgrade-${currentStep}`}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.15 }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {question.title}
            </h3>
            {question.subtitle && (
              <p className="text-[10px] text-muted-foreground/40 mb-4">
                {question.subtitle}
              </p>
            )}
            {!question.subtitle && <div className="mb-4" />}

            <div className="space-y-1.5">
              {question.options.map((opt, idx) => {
                const isSelected = answers[question.id] === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full text-left px-3 py-2.5 border transition-all flex items-center gap-2 text-xs ${
                      isSelected
                        ? "bg-foreground/5 border-foreground/25"
                        : "border-border/20 hover:border-foreground/15"
                    }`}
                  >
                    <span className="text-sm">{opt.emoji}</span>
                    <span className={isSelected ? "text-foreground font-medium" : "text-foreground/60"}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-foreground/50 ml-auto" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(i => i - 1)}
                className="mt-3 inline-flex items-center gap-1 text-[10px] text-muted-foreground/30 hover:text-foreground/50 transition-colors"
              >
                <ArrowLeft className="w-2.5 h-2.5" />
                Kembali
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ProfileUpgradePrompt;
