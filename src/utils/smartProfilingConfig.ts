/**
 * Smart Profiling Configuration
 * =============================
 * Single-page form structure with conditional reveal
 * Data structures for interest categories, goals, AI experience, etc.
 */

export interface InterestCategory {
  id: string;
  emoji: string;
  label: string;
  skills: Skill[];
}

export interface Skill {
  id: string;
  label: string;
  icon: string;
}

export interface GoalOption {
  id: string;
  emoji: string;
  label: string;
  hint: string;
  timeline: string;
}

export interface TimeOption {
  id: string;
  label: string;
  hint: string;
}

export interface AIExperienceOption {
  id: string;
  label: string;
  hint: string;
  icon: string;
}

// ─────────────────────────────────────────────────────────────
// INTEREST CATEGORIES (Main paths)
// ─────────────────────────────────────────────────────────────

export const INTEREST_CATEGORIES: Record<string, InterestCategory> = {
  content_creation: {
    id: 'content_creation',
    emoji: '🎬',
    label: 'Content Creation',
    skills: [
      { id: 'video_editing', label: 'Video Editing', icon: '🎥' },
      { id: 'scriptwriting', label: 'Scriptwriting', icon: '✍️' },
      { id: 'graphic_design', label: 'Graphic Design', icon: '🎨' },
      { id: 'seo', label: 'SEO', icon: '📊' },
      { id: 'photography', label: 'Photography', icon: '📸' },
      { id: 'public_speaking', label: 'Public Speaking', icon: '🎤' }
    ]
  },

  design: {
    id: 'design',
    emoji: '🎨',
    label: 'Design',
    skills: [
      { id: 'ui_design', label: 'UI Design', icon: '📱' },
      { id: 'ux_design', label: 'UX Design', icon: '🔬' },
      { id: 'graphic_design', label: 'Graphic Design', icon: '🎨' },
      { id: 'illustration', label: 'Illustration', icon: '✏️' },
      { id: 'motion_design', label: 'Motion Design', icon: '🎬' },
      { id: 'branding', label: 'Branding', icon: '✨' }
    ]
  },

  tech: {
    id: 'tech',
    emoji: '💻',
    label: 'Tech',
    skills: [
      { id: 'frontend', label: 'Frontend Dev', icon: '🌐' },
      { id: 'backend', label: 'Backend Dev', icon: '⚙️' },
      { id: 'mobile', label: 'Mobile Dev', icon: '📱' },
      { id: 'data_science', label: 'Data Science', icon: '📊' },
      { id: 'ai_ml', label: 'AI/ML', icon: '🤖' },
      { id: 'devops', label: 'DevOps', icon: '🔧' }
    ]
  },

  business: {
    id: 'business',
    emoji: '💼',
    label: 'Business',
    skills: [
      { id: 'ecommerce', label: 'E-commerce', icon: '🛒' },
      { id: 'course_creation', label: 'Course Creation', icon: '📚' },
      { id: 'agency', label: 'Agency', icon: '🏢' },
      { id: 'consulting', label: 'Consulting', icon: '💡' },
      { id: 'marketing', label: 'Marketing', icon: '📣' },
      { id: 'sales', label: 'Sales', icon: '💰' }
    ]
  },

  trading: {
    id: 'trading',
    emoji: '📈',
    label: 'Trading',
    skills: [
      { id: 'crypto', label: 'Crypto', icon: '₿' },
      { id: 'stocks', label: 'Stocks', icon: '📊' },
      { id: 'forex', label: 'Forex', icon: '💱' },
      { id: 'options', label: 'Options', icon: '📈' },
      { id: 'technical_analysis', label: 'Technical Analysis', icon: '📉' },
      { id: 'risk_management', label: 'Risk Management', icon: '🛡️' }
    ]
  }
};

// ─────────────────────────────────────────────────────────────
// GOAL OPTIONS (What user wants to achieve)
// ─────────────────────────────────────────────────────────────

export const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'quick_income',
    emoji: '⚡',
    label: 'Quick Income',
    hint: 'First $100-300 in 30 days',
    timeline: '1 month'
  },
  {
    id: 'side_income',
    emoji: '💰',
    label: 'Side Income',
    hint: 'Stable $500-1000/month in 3 months',
    timeline: '3 months'
  },
  {
    id: 'fulltime',
    emoji: '🚀',
    label: 'Full-Time',
    hint: 'Replace job income in 6 months',
    timeline: '6 months'
  },
  {
    id: 'scale',
    emoji: '💎',
    label: 'Scale Business',
    hint: '2x-5x revenue in 6-12 months',
    timeline: '12 months'
  }
];

// ─────────────────────────────────────────────────────────────
// TIME COMMITMENT OPTIONS
// ─────────────────────────────────────────────────────────────

export const TIME_COMMITMENT_OPTIONS: TimeOption[] = [
  { id: '<1hr', label: '<1 hr/day', hint: 'Light commitment' },
  { id: '1-2hr', label: '1-2 hr/day', hint: 'Moderate pace' },
  { id: '2-4hr', label: '2-4 hr/day', hint: 'Serious focus' },
  { id: '4hr+', label: '4+ hr/day', hint: 'Full-time effort' }
];

// ─────────────────────────────────────────────────────────────
// AI EXPERIENCE LEVEL (New section)
// ─────────────────────────────────────────────────────────────

export const AI_EXPERIENCE_OPTIONS: AIExperienceOption[] = [
  {
    id: 'never',
    label: 'Never',
    hint: 'New to AI, excited to learn!',
    icon: '🌱'
  },
  {
    id: 'basic',
    label: 'Basic',
    hint: 'Tried ChatGPT a few times',
    icon: '🌿'
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    hint: 'Use ChatGPT/Claude regularly',
    icon: '🌳'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    hint: 'AI power user, want to optimize',
    icon: '🚀'
  }
];

// ─────────────────────────────────────────────────────────────
// AI CHALLENGE OPTIONS (Conditional: only if AI experience != never)
// ─────────────────────────────────────────────────────────────

export const AI_CHALLENGE_OPTIONS: string[] = [
  "Don't know what to prompt",
  "AI gives generic answers",
  "Too many tools, don't know which to use",
  "No system, every day is different",
  "Can't measure if AI is helping"
];

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Get interest category by ID
 */
export function getInterestCategory(interestId: string): InterestCategory | null {
  return INTEREST_CATEGORIES[interestId] || null;
}

/**
 * Get skills for a specific interest category
 */
export function getSkillsForInterest(interestId: string): Skill[] {
  const category = getInterestCategory(interestId);
  return category?.skills || [];
}

/**
 * Get goal option by ID
 */
export function getGoalOption(goalId: string): GoalOption | null {
  return GOAL_OPTIONS.find(g => g.id === goalId) || null;
}

/**
 * Map interest ID to path ID (for compatibility with existing system)
 */
export function interestIdToPathId(interestId: string): string {
  const mapping: Record<string, string> = {
    'content_creation': 'content_creator',
    'design': 'ui_designer',
    'tech': 'frontend_dev',
    'business': 'digital_business',
    'trading': 'crypto_trader'
  };
  return mapping[interestId] || interestId;
}
