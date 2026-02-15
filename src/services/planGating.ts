/**
 * Plan Gating Service — Freemium Access Control
 * ================================================
 * Controls what features are available based on user's plan.
 * 
 * Plans:
 *   - free:   1 re-profiling, NO AI personalization, template roadmap only
 *   - pro:    unlimited re-profiling, full AI (why-text, custom tasks, niche, weekly feedback)
 *   - agency: everything in pro + future advanced features
 *
 * This service:
 *   1. Checks if a feature is available for a given plan
 *   2. Counts re-profiling attempts
 *   3. Tracks AI usage (credits)
 *   4. Returns upgrade reasons for gated features
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TYPES
// ============================================================================

export type PlanType = "free" | "pro" | "agency";

export interface PlanLimits {
  maxReprofiles: number;        // max times user can re-profile (free=1, pro/agency=Infinity)
  aiPersonalization: boolean;   // AI why-text, custom tasks, niche suggestion
  aiWeeklyFeedback: boolean;    // weekly checkpoint AI feedback
  aiAdaptation: boolean;        // progress adaptation engine with AI
  unlimitedReprofiling: boolean;
}

export interface GateResult {
  allowed: boolean;
  reason?: string;
  upgradeFeature?: string;
}

// ============================================================================
// PLAN LIMITS CONFIGURATION
// ============================================================================

// DEV MODE: All plans unlocked for testing. Revert for production.
const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxReprofiles: Infinity,
    aiPersonalization: true,
    aiWeeklyFeedback: true,
    aiAdaptation: true,
    unlimitedReprofiling: true,
  },
  pro: {
    maxReprofiles: Infinity,
    aiPersonalization: true,
    aiWeeklyFeedback: true,
    aiAdaptation: true,
    unlimitedReprofiling: true,
  },
  agency: {
    maxReprofiles: Infinity,
    aiPersonalization: true,
    aiWeeklyFeedback: true,
    aiAdaptation: true,
    unlimitedReprofiling: true,
  },
};

// ============================================================================
// GET PLAN LIMITS
// ============================================================================

export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

// ============================================================================
// CHECK: CAN USER RE-PROFILE?
// ============================================================================

export async function canReprofile(userId: string, plan: PlanType): Promise<GateResult> {
  const limits = getPlanLimits(plan);

  if (limits.unlimitedReprofiling) {
    return { allowed: true };
  }

  // Count how many profiles user has created (including inactive)
  const { count, error } = await supabase
    .from("user_profiles_intent")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error counting profiles:", error);
    return { allowed: true }; // fail-open
  }

  const profileCount = count || 0;

  // Free plan: max 1 re-profiling (they get initial + 1 more = 2 total profiles)
  if (profileCount > limits.maxReprofiles) {
    return {
      allowed: false,
      reason: `Free plan hanya mendapat ${limits.maxReprofiles}x re-profiling. Upgrade ke Pro untuk unlimited re-profiling.`,
      upgradeFeature: "unlimited_reprofiling",
    };
  }

  return { allowed: true };
}

// ============================================================================
// CHECK: CAN USE AI PERSONALIZATION?
// ============================================================================

export function canUseAIPersonalization(plan: PlanType): GateResult {
  const limits = getPlanLimits(plan);

  if (limits.aiPersonalization) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "AI personalization (custom tasks, niche recommendation, why-text) hanya tersedia di Pro plan.",
    upgradeFeature: "ai_personalization",
  };
}

// ============================================================================
// CHECK: CAN USE AI WEEKLY FEEDBACK?
// ============================================================================

export function canUseAIWeeklyFeedback(plan: PlanType): GateResult {
  const limits = getPlanLimits(plan);

  if (limits.aiWeeklyFeedback) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "AI weekly feedback & coaching hanya tersedia di Pro plan. Upgrade untuk dapatkan feedback personal dari AI setiap minggu.",
    upgradeFeature: "ai_weekly_feedback",
  };
}

// ============================================================================
// CHECK: CAN USE ADAPTATION ENGINE?
// ============================================================================

export function canUseAdaptation(plan: PlanType): GateResult {
  const limits = getPlanLimits(plan);

  if (limits.aiAdaptation) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Progress adaptation engine (simplifikasi, akselerasi, pivot suggestions) hanya tersedia di Pro plan.",
    upgradeFeature: "ai_adaptation",
  };
}

// ============================================================================
// DEDUCT CREDITS (for future usage-based billing)
// ============================================================================

export async function deductCredit(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("credits_remaining")
    .eq("user_id", userId)
    .single();

  if (error || !data) return true; // fail-open

  if (data.credits_remaining <= 0) {
    return false; // no credits left
  }

  await supabase
    .from("profiles")
    .update({
      credits_remaining: data.credits_remaining - 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return true;
}

// ============================================================================
// GET USER USAGE STATS (for dashboard display)
// ============================================================================

export async function getUserUsageStats(userId: string): Promise<{
  totalProfiles: number;
  totalAICalls: number;
  totalCheckpoints: number;
}> {
  const [profileRes, aiRes, checkpointRes] = await Promise.all([
    supabase
      .from("user_profiles_intent")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("ai_personalization_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("weekly_checkpoints")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    totalProfiles: profileRes.count || 0,
    totalAICalls: aiRes.count || 0,
    totalCheckpoints: checkpointRes.count || 0,
  };
}

// ============================================================================
// FEATURE LABELS (for upgrade prompts)
// ============================================================================

export const UPGRADE_FEATURES: Record<string, { title: string; description: string; icon: string }> = {
  unlimited_reprofiling: {
    title: "Unlimited Re-profiling",
    description: "Ubah jawaban dan dapatkan jalur baru kapan saja. Eksperimen tanpa batas.",
    icon: "🔄",
  },
  ai_personalization: {
    title: "AI Personalization",
    description: "Custom tasks, niche recommendation, dan analisis 'kenapa jalur ini cocok' dari AI.",
    icon: "🧠",
  },
  ai_weekly_feedback: {
    title: "AI Weekly Feedback",
    description: "Feedback personal dari AI setiap checkpoint. Termasuk saran simplifikasi atau akselerasi.",
    icon: "💬",
  },
  ai_adaptation: {
    title: "Progress Adaptation",
    description: "Engine yang otomatis menyesuaikan roadmap berdasarkan progressmu.",
    icon: "⚡",
  },
};
