/**
 * Submit Section Component
 * =======================
 * Progress bar, terms checkbox, and submit button
 * Shows validation state and submission status
 */

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface SubmitSectionProps {
  progress: number;
  agreedToTerms: boolean;
  isFormValid: () => boolean;
  isSubmitting: boolean;
  onTermsChange: (checked: boolean) => void;
  onSubmit: () => void;
  error: string | null;
}

const SubmitSection = ({
  progress,
  agreedToTerms,
  isFormValid,
  isSubmitting,
  onTermsChange,
  onSubmit,
  error
}: SubmitSectionProps) => {
  return (
    <div className="submit-section space-y-6">
      {/* ────── PROGRESS BAR ────── */}
      <div className="progress-wrapper">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Profile Completion</span>
          <span className="font-bold text-teal-600">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* ────── TERMS CHECKBOX ────── */}
      <label className="terms-checkbox flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => onTermsChange(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
        />
        <span className="text-sm text-gray-700">
          I agree to build my career with <span className="font-semibold">AI-powered insights & data-driven guidance</span>. I understand this is a personalized system based on my goals and constraints.
        </span>
      </label>

      {/* ────── ERROR MESSAGE ────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────── SUBMIT BUTTON ────── */}
      <motion.button
        type="button"
        onClick={onSubmit}
        disabled={!isFormValid() || isSubmitting}
        whileHover={isFormValid() && !isSubmitting ? { scale: 1.02, y: -2 } : {}}
        whileTap={isFormValid() && !isSubmitting ? { scale: 0.98 } : {}}
        className={`
          submit-button w-full py-4 px-6 rounded-xl font-bold text-lg
          flex items-center justify-center gap-3 transition-all duration-200
          ${isFormValid() && !isSubmitting
            ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg hover:shadow-xl'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Building Your System...</span>
          </>
        ) : (
          <>
            <span>BUILD MY SYSTEM →</span>
          </>
        )}
      </motion.button>

      {/* ────── VALIDATION MESSAGE ────── */}
      {!isFormValid() && !isSubmitting && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-amber-600"
        >
          Please complete all required fields to continue
        </motion.p>
      )}

      {/* ────── TRUST BADGES ────── */}
      <div className="trust-badges flex flex-wrap justify-center gap-4 pt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Secure & Private</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Data-Driven Insights</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>AI-Powered System</span>
        </div>
      </div>
    </div>
  );
};

export default SubmitSection;
