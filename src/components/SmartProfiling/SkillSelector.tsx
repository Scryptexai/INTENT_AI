/**
 * Skill Selector Component
 * =======================
 * Multi-select chips for choosing skills
 * Max 3 selection, visual feedback
 */

import { motion } from "framer-motion";
import { Skill } from "@/utils/smartProfilingConfig";

interface SkillSelectorProps {
  skills: Skill[];
  selected: string[];
  onToggle: (skillId: string) => void;
}

const SkillSelector = ({ skills, selected, onToggle }: SkillSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map(skill => {
        const isSelected = selected.includes(skill.id);

        return (
          <motion.button
            key={skill.id}
            type="button"
            onClick={() => onToggle(skill.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!isSelected && selected.length >= 3}
            className={`
              skill-chip px-4 py-2 rounded-full border-2 font-medium text-sm
              flex items-center gap-2 transition-all duration-200
              ${isSelected
                ? 'border-teal-500 bg-teal-500 text-white'
                : selected.length >= 3
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-teal-300'
              }
            `}
          >
            {/* Icon */}
            <span className="text-base">{skill.icon}</span>

            {/* Label */}
            <span>{skill.label}</span>

            {/* Selection checkmark */}
            {isSelected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-1"
              >
                ✓
              </motion.span>
            )}
          </motion.button>
        );
      })}

      {/* Max reached warning */}
      {selected.length >= 3 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full text-sm text-amber-600 mt-2"
        >
          ✓ Maximum 3 skills selected
        </motion.p>
      )}
    </div>
  );
};

export default SkillSelector;
