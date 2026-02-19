/**
 * AI Challenge Selector Component
 * ===============================
 * List of options for selecting biggest AI challenge
 * Radio button style selection
 */

import { motion } from "framer-motion";

interface AIChallengeSelectorProps {
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}

const AIChallengeSelector = ({ options, selected, onSelect }: AIChallengeSelectorProps) => {
  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <motion.button
          key={index}
          type="button"
          onClick={() => onSelect(option)}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className={`
            challenge-option w-full p-4 rounded-lg border text-left transition-all duration-200
            flex items-center gap-3
            ${selected === option
              ? 'border-teal-500 bg-teal-50'
              : 'border-gray-200 bg-white hover:border-teal-300'
            }
          `}
        >
          {/* Radio indicator */}
          <div className={`
            w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
            ${selected === option ? 'border-teal-500' : 'border-gray-300'}
          `}>
            {selected === option && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-3 h-3 bg-teal-500 rounded-full"
              />
            )}
          </div>

          {/* Option text */}
          <span className={`font-medium ${selected === option ? 'text-teal-700' : 'text-gray-700'}`}>
            {option}
          </span>
        </motion.button>
      ))}
    </div>
  );
};

export default AIChallengeSelector;
