/**
 * Smart Profiling Form
 * ===================
 * Single-page form with conditional reveal logic
 * User-friendly, fast completion (2-3 min)
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  INTEREST_CATEGORIES,
  GOAL_OPTIONS,
  TIME_COMMITMENT_OPTIONS,
  AI_EXPERIENCE_OPTIONS,
  AI_CHALLENGE_OPTIONS,
  getSkillsForInterest,
  interestIdToPathId,
} from "@/utils/smartProfilingConfig";
import { useAuth } from "@/contexts/AuthContext";
import { saveProfilingResult } from "@/services/profileService";
import FormSection from "./FormSection";
import InterestCard from "./InterestCard";
import SkillSelector from "./SkillSelector";
import ExperienceSlider from "./ExperienceSlider";
import GoalSelector from "./GoalSelector";
import TimeCommitmentSelector from "./TimeCommitmentSelector";
import AIExperienceSelector from "./AIExperienceSelector";
import AIChallengeSelector from "./AIChallengeSelector";
import SubmitSection from "./SubmitSection";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ProfilingFormData {
  username: string;
  mainInterest: string | null;
  skills: string[];
  experienceYears: number;
  goal: string | null;
  timeCommitment: string | null;
  aiExperience: string | null;
  aiChallenge: string | null;
  agreedToTerms: boolean;
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

const SmartProfilingForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ─────── STATE ───────

  const [formData, setFormData] = useState<ProfilingFormData>({
    username: "",
    mainInterest: null,
    skills: [],
    experienceYears: 0,
    goal: null,
    timeCommitment: null,
    aiExperience: null,
    aiChallenge: null,
    agreedToTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─────── HANDLERS ───────

  /**
   * Update a single field in form data
   */
  const updateField = useCallback(<K extends keyof ProfilingFormData>(
    field: K,
    value: ProfilingFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handle interest category selection
   * Clears skills when interest changes
   */
  const handleInterestSelect = useCallback((interestId: string) => {
    setFormData(prev => ({
      ...prev,
      mainInterest: interestId,
      skills: [], // Clear skills when interest changes
    }));

    // Smooth scroll to skills section after selection
    setTimeout(() => {
      const skillsSection = document.getElementById('skills');
      if (skillsSection) {
        skillsSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 300);
  }, []);

  /**
   * Handle skill selection (multi-select, max 3)
   */
  const handleSkillToggle = useCallback((skillId: string) => {
    setFormData(prev => {
      const isSelected = prev.skills.includes(skillId);

      if (isSelected) {
        // Remove skill
        return {
          ...prev,
          skills: prev.skills.filter(s => s !== skillId)
        };
      } else {
        // Add skill (max 3)
        if (prev.skills.length >= 3) {
          return prev; // Don't add if already at max
        }
        return {
          ...prev,
          skills: [...prev.skills, skillId]
        };
      }
    });
  }, []);

  /**
   * Calculate form completion percentage
   */
  const calculateProgress = useCallback((): number => {
    const requiredFields = [
      formData.username,
      formData.mainInterest,
      formData.skills.length > 0,
      formData.goal,
      formData.timeCommitment,
      formData.aiExperience,
      formData.agreedToTerms
    ];

    const completed = requiredFields.filter(Boolean).length;
    const total = requiredFields.length;

    return Math.round((completed / total) * 100);
  }, [formData]);

  /**
   * Validate form
   */
  const isFormValid = useCallback((): boolean => {
    return (
      formData.username.trim() !== "" &&
      formData.mainInterest !== null &&
      formData.skills.length > 0 &&
      formData.experienceYears >= 0 &&
      formData.goal !== null &&
      formData.timeCommitment !== null &&
      formData.aiExperience !== null &&
      formData.agreedToTerms === true
    );
  }, [formData]);

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!user || !isFormValid()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert smart form data to legacy format (for compatibility)
      const pathId = interestIdToPathId(formData.mainInterest!);

      // Build legacy answers
      const answers = {
        time: formData.timeCommitment || '2-4hr',
        capital: '0', // Default: no capital
        target_speed: formData.goal === 'quick_income' ? 'fast' :
                      formData.goal === 'side_income' ? 'moderate' :
                      formData.goal === 'fulltime' ? 'steady' : 'long_term',
        work_style: 'flexible',
        risk: 'medium',
        skill_primary: formData.mainInterest || 'tech',
        skill_secondary: formData.skills[0] || '',
        interest_market: formData.mainInterest || 'tech',
        audience_access: 'organic',
        daily_routine: 'flexible',
        preferred_platform: 'remote'
      };

      // Build legacy scores
      const scores = {
        time: 3,
        capital: 0,
        target_speed: 3,
        work_style: 3,
        risk: 3,
        skill_primary: 3,
        skill_secondary: formData.skills.length > 0 ? 3 : 0,
        interest_market: 3,
        audience_access: 3,
        daily_routine: 3,
        preferred_platform: 3
      };

      // Build other required params
      const segment = 'digital_practitioner' as const;
      const primaryPath = pathId as any;
      const alternatePath = null;
      const eliminatedPaths: any[] = [];
      const pathScores = { [pathId]: 90 };

      // Build answer tags (include new smart profiling fields)
      const answerTags = {
        username: formData.username,
        skills: formData.skills.join(','),
        experience_level: formData.experienceYears.toString(),
        goal: formData.goal,
        time_commitment: formData.timeCommitment,
        ai_experience: formData.aiExperience,
        ai_challenge: formData.aiChallenge || '',
        timeline: formData.goal === 'quick_income' ? '1_month' :
                 formData.goal === 'side_income' ? '3_months' :
                 formData.goal === 'fulltime' ? '6_months' : '12_months'
      };

      // Save to Supabase using legacy function
      await saveProfilingResult(
        user.id,
        answers,
        scores,
        segment,
        primaryPath,
        alternatePath,
        eliminatedPaths,
        pathScores,
        answerTags
      );

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting profiling:", error);
      setSubmitError("Failed to save your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────── RENDER ───────

  return (
    <div className="smart-profiling-form">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-3"
        >
          Build Your AI-Powered System
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-600"
        >
          Tell us about yourself, we'll create your personalized roadmap.
        </motion.p>
      </div>

      {/* Form Sections */}
      <div className="space-y-6">

        {/* ────── SECTION 1: USERNAME ────── */}
        <FormSection id="username" title="👤 Basic Info">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value)}
              />
            </div>
          </div>
        </FormSection>

        {/* ────── SECTION 2: MAIN INTEREST ────── */}
        <FormSection id="main-interest" title="🎯 What's your main interest?">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.values(INTEREST_CATEGORIES).map(category => (
              <InterestCard
                key={category.id}
                emoji={category.emoji}
                label={category.label}
                selected={formData.mainInterest === category.id}
                onClick={() => handleInterestSelect(category.id)}
              />
            ))}
          </div>
        </FormSection>

        {/* ────── SECTION 3: SKILLS (Conditional) ────── */}
        <AnimatePresence>
          {formData.mainInterest && (
            <FormSection
              id="skills"
              title={`${INTEREST_CATEGORIES[formData.mainInterest].emoji} ${INTEREST_CATEGORIES[formData.mainInterest].label} Skills`}
              subtitle="Select up to 3"
            >
              <SkillSelector
                skills={getSkillsForInterest(formData.mainInterest)}
                selected={formData.skills}
                onToggle={handleSkillToggle}
              />
            </FormSection>
          )}
        </AnimatePresence>

        {/* ────── SECTION 4: EXPERIENCE LEVEL ────── */}
        <FormSection id="experience" title="📊 Experience Level">
          <ExperienceSlider
            value={formData.experienceYears}
            onChange={(value) => updateField('experienceYears', value)}
          />
        </FormSection>

        {/* ────── SECTION 5: GOAL & TIMELINE ────── */}
        <FormSection id="goal" title="🎯 What's your goal?">
          <GoalSelector
            options={GOAL_OPTIONS}
            selected={formData.goal}
            onSelect={(goalId) => updateField('goal', goalId)}
          />
        </FormSection>

        {/* ────── SECTION 6: TIME COMMITMENT ────── */}
        <FormSection id="time" title="⏱️ Time Commitment">
          <TimeCommitmentSelector
            options={TIME_COMMITMENT_OPTIONS}
            selected={formData.timeCommitment}
            onSelect={(value) => updateField('timeCommitment', value)}
          />
        </FormSection>

        {/* ────── SECTION 7: AI EXPERIENCE ────── */}
        <FormSection id="ai-experience" title="🤖 AI Experience" subtitle="Help us customize your AI workflows">
          <AIExperienceSelector
            options={AI_EXPERIENCE_OPTIONS}
            selected={formData.aiExperience}
            onSelect={(value) => updateField('aiExperience', value)}
          />
        </FormSection>

        {/* ────── SECTION 8: AI CHALLENGE (Conditional) ────── */}
        <AnimatePresence>
          {formData.aiExperience && formData.aiExperience !== 'never' && (
            <FormSection id="ai-challenge" title="💡 What's your biggest AI challenge?">
              <AIChallengeSelector
                options={AI_CHALLENGE_OPTIONS}
                selected={formData.aiChallenge}
                onSelect={(value) => updateField('aiChallenge', value)}
              />
            </FormSection>
          )}
        </AnimatePresence>

        {/* ────── SUBMIT SECTION ────── */}
        <SubmitSection
          progress={calculateProgress()}
          agreedToTerms={formData.agreedToTerms}
          isFormValid={isFormValid}
          isSubmitting={isSubmitting}
          onTermsChange={(checked) => updateField('agreedToTerms', checked)}
          onSubmit={handleSubmit}
          error={submitError}
        />

      </div>
    </div>
  );
};

export default SmartProfilingForm;
