/**
 * Quick Profile Configuration — Level 1 Quick Mapping (2–4 menit)
 * ================================================================
 * MVP profiling: 6 pertanyaan → output arah awal.
 *
 * Hidden strategy — dari 6 pertanyaan, sistem sudah dapat:
 *   1. Skill category (multi-select)
 *   2. Interest cluster / arah (intent direction)
 *   3. Time availability
 *   4. Current stage / kondisi
 *   5. Target income (confidence bias)
 *   6. Biggest challenge
 *
 * Cukup untuk MVP. Level 2 (upgrade profil) muncul setelah 3-7 hari.
 *
 * UI rules:
 *   - 1 pertanyaan per layar
 *   - Progress bar jelas
 *   - Bahasa sederhana
 *   - Tidak ada teks panjang
 *   - Tidak ada istilah teknis
 *   - Tidak ada "tes kompetensi" atau "validasi"
 */

// ============================================================================
// TYPES
// ============================================================================

export interface QuickOption {
  id: string;
  emoji: string;
  label: string;
  hint?: string; // short contextual hint, max 1 line
}

export interface QuickQuestion {
  id: string;
  title: string;        // simple, direct
  subtitle?: string;    // max 1 short sentence
  multiSelect?: boolean; // allow multiple selections
  maxSelect?: number;    // max items if multi-select
  options: QuickOption[];
}

export interface QuickProfileResult {
  skills: string[];           // multi-select skill IDs
  direction: string;          // intent direction ID
  time: string;               // time availability ID
  stage: string;              // current life stage ID
  incomeTarget: string;       // income target ID
  challenge: string;          // biggest challenge ID
}

// ============================================================================
// QUESTION 1 — SKILL UTAMA (multi-select, max 3)
// ============================================================================
// Hidden output: skill_category + interest_cluster partial

export const Q_SKILLS: QuickQuestion = {
  id: "skills",
  title: "Skill apa yang kamu punya?",
  subtitle: "Pilih yang paling kuat. Boleh lebih dari satu.",
  multiSelect: true,
  maxSelect: 3,
  options: [
    { id: "writing", emoji: "✍️", label: "Menulis", hint: "Artikel, copywriting, script" },
    { id: "design", emoji: "🎨", label: "Desain", hint: "Canva, Figma, visual" },
    { id: "video", emoji: "🎬", label: "Video", hint: "Edit, rekam, motion" },
    { id: "coding", emoji: "💻", label: "Coding / Tech", hint: "Web, app, automation" },
    { id: "marketing", emoji: "📢", label: "Marketing", hint: "Ads, SEO, socmed" },
    { id: "speaking", emoji: "🎤", label: "Ngomong / Presentasi", hint: "Live, podcast, video" },
    { id: "analysis", emoji: "📊", label: "Analisis / Riset", hint: "Data, trend, report" },
    { id: "selling", emoji: "🛒", label: "Jualan", hint: "Online, offline, negosiasi" },
    { id: "none", emoji: "🌱", label: "Belum punya skill khusus", hint: "Tidak masalah, kita mulai dari sini" },
  ],
};

// ============================================================================
// QUESTION 2 — ARAH / INTENT DIRECTION
// ============================================================================
// Hidden output: intent_direction → determines economic model mapping

export const Q_DIRECTION: QuickQuestion = {
  id: "direction",
  title: "Kamu mau ke arah mana?",
  subtitle: "Pilih yang paling menarik sekarang.",
  options: [
    { id: "freelance", emoji: "🛠️", label: "Jual skill jadi jasa", hint: "Freelance, client-based" },
    { id: "content", emoji: "📱", label: "Bangun audience & konten", hint: "YouTube, TikTok, Instagram" },
    { id: "product", emoji: "📦", label: "Buat & jual produk digital", hint: "Ebook, template, course" },
    { id: "commerce", emoji: "🛒", label: "Jualan online", hint: "Dropship, affiliate, marketplace" },
    { id: "automate", emoji: "⚙️", label: "Bangun sistem otomatis", hint: "No-code, AI, automation" },
    { id: "unsure", emoji: "🧭", label: "Belum tahu — bantu saya", hint: "Sistem akan arahkan berdasarkan skill kamu" },
  ],
};

// ============================================================================
// QUESTION 3 — WAKTU TERSEDIA
// ============================================================================
// Hidden output: time_availability (affects intensity & model fit)

export const Q_TIME: QuickQuestion = {
  id: "time",
  title: "Berapa waktu luang kamu per hari?",
  subtitle: "Waktu yang benar-benar bisa kamu pakai.",
  options: [
    { id: "lt1h", emoji: "⏰", label: "Kurang dari 1 jam" },
    { id: "1-2h", emoji: "🕐", label: "1–2 jam" },
    { id: "3-4h", emoji: "🕒", label: "3–4 jam" },
    { id: "gt4h", emoji: "🕕", label: "Lebih dari 4 jam" },
  ],
};

// ============================================================================
// QUESTION 4 — STATUS / KONDISI SEKARANG
// ============================================================================
// Hidden output: current_stage (affects risk tolerance, intensity, urgency)

export const Q_STAGE: QuickQuestion = {
  id: "stage",
  title: "Apa situasi kamu sekarang?",
  options: [
    { id: "student", emoji: "🎓", label: "Pelajar / Mahasiswa" },
    { id: "employee", emoji: "👔", label: "Karyawan" },
    { id: "freelancer", emoji: "🧑‍💻", label: "Freelancer" },
    { id: "unemployed", emoji: "🔍", label: "Belum kerja / cari kerja" },
    { id: "entrepreneur", emoji: "🚀", label: "Punya bisnis sendiri" },
    { id: "parent", emoji: "🏠", label: "Ibu/Bapak rumah tangga" },
  ],
};

// ============================================================================
// QUESTION 5 — TARGET INCOME
// ============================================================================
// Hidden output: income_target (confidence bias indicator)

export const Q_INCOME: QuickQuestion = {
  id: "income_target",
  title: "Target income per bulan dari ini?",
  subtitle: "Jangan terlalu rendah, jangan terlalu tinggi.",
  options: [
    { id: "lt500k", emoji: "🪙", label: "< Rp 500 ribu", hint: "Uang jajan tambahan" },
    { id: "500k-2m", emoji: "💵", label: "Rp 500rb – 2 juta", hint: "Sampingan lumayan" },
    { id: "2m-5m", emoji: "💰", label: "Rp 2 – 5 juta", hint: "Setara part-time" },
    { id: "5m-15m", emoji: "🏆", label: "Rp 5 – 15 juta", hint: "Income utama" },
    { id: "gt15m", emoji: "🚀", label: "> Rp 15 juta", hint: "Full-time digital" },
  ],
};

// ============================================================================
// QUESTION 6 — HAMBATAN TERBESAR
// ============================================================================
// Hidden output: biggest_challenge (determines coaching approach)

export const Q_CHALLENGE: QuickQuestion = {
  id: "challenge",
  title: "Hambatan terbesar kamu sekarang?",
  subtitle: "Jujur saja. Ini penting.",
  options: [
    { id: "no_direction", emoji: "🧭", label: "Tidak tahu harus mulai dari mana" },
    { id: "no_skill", emoji: "🎯", label: "Merasa belum punya skill" },
    { id: "no_time", emoji: "⏰", label: "Waktu sangat terbatas" },
    { id: "no_confidence", emoji: "😰", label: "Kurang percaya diri" },
    { id: "tried_failed", emoji: "😤", label: "Sudah coba tapi gagal" },
  ],
};

// ============================================================================
// ALL QUESTIONS IN ORDER
// ============================================================================

export const QUICK_QUESTIONS: QuickQuestion[] = [
  Q_SKILLS,
  Q_DIRECTION,
  Q_TIME,
  Q_STAGE,
  Q_INCOME,
  Q_CHALLENGE,
];

// ============================================================================
// MAPPING: Quick Profile → Economic Model + Sub-sector
// ============================================================================

import type { EconomicModelId } from "./branchingProfileConfig";
import type { PathId } from "./profilingConfig";

/** Map direction → economic model */
export function mapDirectionToModel(direction: string): EconomicModelId {
  const map: Record<string, EconomicModelId> = {
    freelance: "skill_service",
    content: "audience_based",
    product: "digital_product",
    commerce: "commerce_arbitrage",
    automate: "automation_builder",
    unsure: "skill_service", // default safe choice
  };
  return map[direction] || "skill_service";
}

/** Map direction + skills → best sub-sector */
export function mapToSubSector(direction: string, skills: string[]): string {
  // If direction is "unsure", infer from skills
  if (direction === "unsure") {
    if (skills.includes("writing")) return "writing";
    if (skills.includes("design")) return "design";
    if (skills.includes("video")) return "content_creator";
    if (skills.includes("coding")) return "development";
    if (skills.includes("marketing")) return "marketing";
    if (skills.includes("speaking")) return "content_creator";
    if (skills.includes("analysis")) return "trend_researcher";
    if (skills.includes("selling")) return "dropship";
    return "writing"; // safest default
  }

  const skillPriority = skills[0] || "none";

  const directionSkillMap: Record<string, Record<string, string>> = {
    freelance: {
      writing: "writing",
      design: "design",
      video: "video",
      coding: "development",
      marketing: "marketing",
      speaking: "marketing",
      analysis: "ai_operator",
      selling: "marketing",
      none: "writing",
    },
    content: {
      writing: "niche_page",
      design: "niche_page",
      video: "content_creator",
      coding: "content_creator",
      marketing: "micro_influencer",
      speaking: "content_creator",
      analysis: "niche_page",
      selling: "micro_influencer",
      none: "niche_page",
    },
    product: {
      writing: "ebook",
      design: "template",
      video: "course_mini",
      coding: "saas_micro",
      marketing: "course_mini",
      speaking: "course_mini",
      analysis: "ebook",
      selling: "template",
      none: "ebook",
    },
    commerce: {
      writing: "affiliate",
      design: "print_on_demand",
      video: "tiktok_shop",
      coding: "digital_resell",
      marketing: "affiliate",
      speaking: "tiktok_shop",
      analysis: "affiliate",
      selling: "dropship",
      none: "dropship",
    },
    automate: {
      writing: "funnel_builder",
      design: "nocode_builder",
      video: "ai_workflow",
      coding: "ai_workflow",
      marketing: "zapier_automation",
      speaking: "funnel_builder",
      analysis: "ai_workflow",
      selling: "crm_setup",
      none: "nocode_builder",
    },
  };

  return directionSkillMap[direction]?.[skillPriority] ||
         directionSkillMap[direction]?.none ||
         "writing";
}

/** Map to best niche based on direction + skills + sub-sector */
export function mapToNiche(direction: string, skills: string[], subSector: string): string {
  // Use sub-sector as niche for Quick Mapping (Level 1)
  // Detailed niche drilling happens in Level 2
  return subSector;
}

/** Map direction to default platform */
export function mapToPlatform(direction: string, skills: string[]): string {
  const map: Record<string, string> = {
    freelance: skills.includes("coding") ? "upwork" : "fiverr",
    content: skills.includes("video") ? "tiktok" : "instagram",
    product: "gumroad",
    commerce: skills.includes("selling") ? "shopee" : "tiktok_shop_plat",
    automate: "linkedin_auto",
    unsure: "instagram",
  };
  return map[direction] || "instagram";
}

/** Map quick profile to legacy PathId */
export function mapQuickToLegacyPath(direction: string): PathId {
  const map: Record<string, PathId> = {
    freelance: "micro_service",
    content: "niche_content",
    product: "digital_product",
    commerce: "arbitrage_skill",
    automate: "freelance_upgrade",
    unsure: "micro_service",
  };
  return map[direction] || "micro_service";
}

/** Map quick profile to skill level (simplified) */
export function inferSkillLevel(skills: string[]): number {
  if (skills.includes("none") || skills.length === 0) return 0;
  if (skills.length === 1) return 1;
  if (skills.length === 2) return 2;
  return 3; // 3 skills = intermediate+
}

/** Map time to numeric */
export function mapTimeToScore(time: string): number {
  const map: Record<string, number> = { "lt1h": 1, "1-2h": 2, "3-4h": 3, "gt4h": 4 };
  return map[time] || 2;
}

/** Map stage to risk tolerance (hidden) */
export function inferRiskFromStage(stage: string): number {
  const map: Record<string, number> = {
    student: 3,       // lots of time, can experiment
    employee: 2,      // safe job, low risk preference
    freelancer: 3,    // already in game, moderate risk
    unemployed: 2,    // needs safe income fast
    entrepreneur: 4,  // used to risk
    parent: 1,        // very risk-averse
  };
  return map[stage] || 2;
}

/** Build complete answer tags from quick profile */
export function buildAnswerTags(profile: QuickProfileResult): Record<string, string> {
  const model = mapDirectionToModel(profile.direction);
  const subSector = mapToSubSector(profile.direction, profile.skills);
  const niche = mapToNiche(profile.direction, profile.skills, subSector);
  const platform = mapToPlatform(profile.direction, profile.skills);

  return {
    // Core mappings
    economic_model: model,
    sub_sector: subSector,
    niche: niche,
    platform: platform,
    workflow_id: `${model}__${subSector}__${niche}__${platform}`,
    // Quick profile answers (raw)
    skills: profile.skills.join(","),
    direction: profile.direction,
    time: profile.time,
    current_stage: profile.stage,
    income_target: profile.incomeTarget,
    biggest_challenge: profile.challenge,
    // Inferred values (hidden strategy)
    skill_level: inferSkillLevel(profile.skills) <= 1 ? "basic" : "intermediate",
    capital: "zero", // default for MVP, refined in Level 2
    risk: inferRiskFromStage(profile.stage) <= 2 ? "low" : "medium",
    audience: "zero", // default, refined in Level 2
    // Level 2 placeholders (will be filled when user upgrades profile)
    profile_level: "quick", // "quick" | "upgraded"
  };
}

// ============================================================================
// LEVEL 2 — UPGRADE PROFIL QUESTIONS (shown after 3-7 days)
// ============================================================================

export const UPGRADE_QUESTIONS: QuickQuestion[] = [
  {
    id: "digital_experience",
    title: "Pengalaman digital kamu sebelumnya?",
    options: [
      { id: "never", emoji: "🆕", label: "Belum pernah sama sekali" },
      { id: "tried_failed", emoji: "😤", label: "Pernah coba tapi berhenti" },
      { id: "side_project", emoji: "🌙", label: "Pernah sebagai sampingan" },
      { id: "working_digital", emoji: "💼", label: "Sekarang kerja di digital" },
      { id: "experienced", emoji: "🏆", label: "Sudah berpengalaman" },
    ],
  },
  {
    id: "language_skill",
    title: "Kemampuan bahasa Inggris?",
    subtitle: "Ini membuka akses ke market global.",
    options: [
      { id: "none", emoji: "🇮🇩", label: "Indonesia saja" },
      { id: "passive", emoji: "📖", label: "Bisa baca, sulit nulis" },
      { id: "moderate", emoji: "💬", label: "Cukup untuk komunikasi" },
      { id: "fluent", emoji: "🌍", label: "Lancar" },
    ],
  },
  {
    id: "tools_familiarity",
    title: "Tools digital yang kamu kuasai?",
    options: [
      { id: "none", emoji: "🚫", label: "Belum familiar" },
      { id: "basic", emoji: "📱", label: "Canva, Google Docs" },
      { id: "intermediate", emoji: "🔧", label: "Figma, Premiere, WordPress" },
      { id: "advanced", emoji: "⚡", label: "Coding, API, automation" },
    ],
  },
  {
    id: "weekly_commitment",
    title: "Berapa lama kamu bisa komitmen?",
    options: [
      { id: "1_week", emoji: "⚡", label: "1 minggu — coba dulu" },
      { id: "2_weeks", emoji: "📅", label: "2 minggu" },
      { id: "1_month", emoji: "📆", label: "1 bulan penuh" },
      { id: "3_months", emoji: "🏔️", label: "3 bulan+" },
    ],
  },
  {
    id: "learning_style",
    title: "Cara belajar paling efektif?",
    options: [
      { id: "video", emoji: "🎬", label: "Nonton video" },
      { id: "reading", emoji: "📖", label: "Baca artikel" },
      { id: "practice", emoji: "🛠️", label: "Langsung praktek" },
    ],
  },
  {
    id: "audience",
    title: "Sudah punya audience / followers?",
    options: [
      { id: "zero", emoji: "🚫", label: "Belum ada" },
      { id: "micro", emoji: "🌱", label: "< 200" },
      { id: "small", emoji: "📱", label: "200–1.000" },
      { id: "medium", emoji: "👥", label: "1.000–5.000" },
      { id: "large", emoji: "🌟", label: "> 5.000" },
    ],
  },
  {
    id: "capital",
    title: "Modal yang siap dikeluarkan?",
    options: [
      { id: "zero", emoji: "🚫", label: "$0 — gratis" },
      { id: "lt50", emoji: "💵", label: "< $50" },
      { id: "50-200", emoji: "💰", label: "$50–200" },
      { id: "200-500", emoji: "🏦", label: "$200–500" },
    ],
  },
];

// ============================================================================
// PROFILE LEVEL CHECK
// ============================================================================

/** Check if user should see Level 2 upgrade prompt */
export function shouldShowUpgradePrompt(
  answerTags: Record<string, string>,
  createdAt: string | Date
): boolean {
  // Already upgraded
  if (answerTags.profile_level === "upgraded") return false;

  // Check if 3+ days have passed since profiling
  const created = new Date(createdAt);
  const now = new Date();
  const daysSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

  return daysSince >= 3;
}

/** Get human-readable label for upgrade benefit */
export function getUpgradeBenefit(): string {
  return "Tingkatkan profil untuk rekomendasi yang lebih presisi — berdasarkan pengalaman, tools, dan kondisi spesifik kamu.";
}
