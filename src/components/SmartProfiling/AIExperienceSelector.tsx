/**
 * AI Experience Selector Component
 * ================================
 * Cards for selecting AI experience level
 * Shows progression from beginner to advanced
 */

import { motion } from "framer-motion";
import { AIExperienceOption } from "@/utils/smartProfilingConfig";

interface AIExperienceSelectorProps {
  options: AIExperienceOption[];
  selected: string | null;
  onSelect: (value: string) => void;
}

const AIExperienceSelector = ({ options, selected, onSelect }: AIExperienceSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map(option => (
        <motion.button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`
            ai-exp-card p-5 rounded-xl border-2 text-left transition-all duration-200
            ${selected === option.id
              ? 'border-teal-500 bg-teal-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm'
            }
          `}
        >
          {/* Icon & Label */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{option.icon}</span>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-lg">
                {option.label}
              </div>
            </div>

            {/* Selection indicator */}
            {selected === option.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </div>

          {/* Hint */}
          <div className="text-sm text-gray-600 pl-14">
            {option.hint}
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default AIExperienceSelector;
