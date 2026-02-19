/**
 * Time Commitment Selector Component
 * ==================================
 * Cards for selecting time commitment level
 */

import { motion } from "framer-motion";
import { TimeOption } from "@/utils/smartProfilingConfig";

interface TimeCommitmentSelectorProps {
  options: TimeOption[];
  selected: string | null;
  onSelect: (value: string) => void;
}

const TimeCommitmentSelector = ({ options, selected, onSelect }: TimeCommitmentSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {options.map(option => (
        <motion.button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`
            time-card p-4 rounded-xl border-2 text-center transition-all duration-200
            ${selected === option.id
              ? 'border-teal-500 bg-teal-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm'
            }
          `}
        >
          {/* Label */}
          <div className="font-bold text-gray-900 text-base mb-1">
            {option.label}
          </div>

          {/* Hint */}
          <div className="text-xs text-gray-600">
            {option.hint}
          </div>

          {/* Selection indicator */}
          {selected === option.id && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mt-2 text-teal-600 font-semibold text-sm"
            >
              ✓ Selected
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default TimeCommitmentSelector;
