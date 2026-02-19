/**
 * Interest Card Component
 * =======================
 * Clickable card for selecting main interest category
 * Shows emoji, label, and selection state
 */

import { motion } from "framer-motion";

interface InterestCardProps {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

const InterestCard = ({ emoji, label, selected, onClick }: InterestCardProps) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`
        interest-card relative p-4 md:p-6 rounded-xl border-2 transition-all duration-200
        ${selected
          ? 'border-teal-500 bg-teal-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm'
        }
      `}
    >
      {/* Emoji */}
      <div className="text-4xl md:text-5xl mb-3 text-center">
        {emoji}
      </div>

      {/* Label */}
      <div className="text-sm md:text-base font-semibold text-center text-gray-900">
        {label}
      </div>

      {/* Selection Indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
};

export default InterestCard;
