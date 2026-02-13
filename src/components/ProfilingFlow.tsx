/**
 * ProfilingFlow — 1 question per screen, klik cepat, progress bar
 * ==================================================================
 * Durasi ideal: 60-90 detik.
 * Tidak ada textarea.
 * Tidak ada skip.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowLeft } from "lucide-react";
import type { ProfilingQuestion, ProfilingQuestionId } from "@/utils/profilingConfig";

interface ProfilingFlowProps {
  question: ProfilingQuestion;
  totalQuestions: number;
  selectedValue: string | undefined;
  onSelect: (questionId: ProfilingQuestionId, value: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

const ProfilingFlow = ({
  question,
  totalQuestions,
  selectedValue,
  onSelect,
  onBack,
  canGoBack,
}: ProfilingFlowProps) => {
  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
            Profiling
          </span>
          <span className="text-xs font-bold text-primary/80">
            {question.number}/{totalQuestions}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{
              width: `${(question.number / totalQuestions) * 100}%`,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-black mb-2">
            {question.title}
          </h2>
          <p className="text-sm text-muted-foreground/70">
            {question.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Options — buttons */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id + "-opts"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {question.options.map((opt, idx) => {
            const isSelected = selectedValue === opt.value;

            return (
              <motion.button
                key={opt.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                onClick={() => onSelect(question.id, opt.value)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${
                  isSelected
                    ? "bg-primary/10 border-primary/50 shadow-md shadow-primary/10"
                    : "bg-card/50 border-border/30 hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <span
                  className={`text-base font-semibold ${
                    isSelected ? "text-foreground" : "text-foreground/80"
                  }`}
                >
                  {opt.label}
                </span>
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

      {/* Back button */}
      {canGoBack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-center"
        >
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ProfilingFlow;
