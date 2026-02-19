/**
 * AI Analysis Engine — Hyper-Personalization System
 * ===================================================
 *
 * This engine reads user profile data (Q1-Q8 from quick profiling) and generates
 * hyper-personalized insights that make users say "This is ME!"
 *
 * Core Principles:
 * 1. Deep Profile Decoding - Infer hidden variables from visible inputs
 * 2. Specific Direction Setting - NOT generic roadmaps, but specific strategies
 * 3. Contextual Personalization - Every piece of content references their choices
 *
 * From: DASHBOARD_CONTENT_STRATEGY.md
 */

import type { QuickProfileResult } from "@/utils/quickProfileConfig";

// ============================================================================
// PROFILE EXTRACTION HELPERS
// ============================================================================

/**
 * Extract QuickProfileResult from answerTags (stored in SavedProfile)
 * This reverses the buildAnswerTags function to reconstruct the profile
 */
export function extractQuickProfileFromAnswerTags(answerTags: Record<string, any>): QuickProfileResult | null {
  if (!answerTags || answerTags.profile_level !== "quick") {
    return null;
  }

  // Extract from answerTags - these are set by buildAnswerTags in quickProfileConfig
  return {
    skills: answerTags.skill_primary ? [answerTags.skill_primary] : ["none"],
    subSkill: answerTags.niche || answerTags.sub_sector || "explore_anything",
    experience: answerTags.skill_level || 0, // in months
    target: extractTargetFromAnswerTags(answerTags),
    time: extractTimeFromAnswerTags(answerTags),
    timeline: answerTags.target_speed || "3_months",
    language: answerTags.language_skill || "indonesia",
    stage: answerTags.current_stage || "employee",
  };
}

function extractTargetFromAnswerTags(answerTags: Record<string, any>): string {
  const income = answerTags.income_target || "";
  // Map income target to target ID
  if (income.includes("500") || income.includes("1 juta")) return "500k_1m";
  if (income.includes("1-2") || income.includes("2 juta")) return "1m_2m";
  if (income.includes("2-5") || income.includes("5 juta")) return "2m_5m";
  if (income.includes("5-10") || income.includes("10 juta")) return "5m_10m";
  if (income.includes("10+") || income.includes("lebih")) return "10m+";
  return "2m_5m"; // default
}

function extractTimeFromAnswerTags(answerTags: Record<string, any>): string {
  const commitment = answerTags.weekly_commitment || "";
  if (commitment.includes("1-5") || commitment.includes("5 jam")) return "1-5h";
  if (commitment.includes("5-10") || commitment.includes("10 jam")) return "5-10h";
  if (commitment.includes("10-20") || commitment.includes("20 jam")) return "10-20h";
  if (commitment.includes("20-30") || commitment.includes("30 jam")) return "20-30h";
  if (commitment.includes("30+") || commitment.includes("30+")) return "30+h";
  return "10-20h"; // default
}

// ============================================================================
// TYPES
// ============================================================================

export interface AIAnalysis {
  // User's decoded situation
  readinessLevel: ReadinessLevel;
  economicModel: EconomicModel;
  urgency: UrgencyLevel;
  advantage: string;
  gaps: string[];
  opportunity: string;
  risk: string;

  // Personalized messaging
  welcomeMessage: string;
  todayFocus: string;
  strategySummary: string;

  // Specific targets
  targetMarket: string;
  pricingStrategy: string;
  incomePotential: string;
  timeline: string;

  // First actionable step
  firstStep: string;
}

export type ReadinessLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type EconomicModel = "skill_service" | "audience_builder" | "product_creator" | "arbitrage";
export type UrgencyLevel = "low" | "medium" | "high";

// ============================================================================
// PROFILE DECODING ENGINE
// ============================================================================

/**
 * Decodes user profile from 8 questions into actionable insights
 */
export function analyzeQuickProfile(profile: QuickProfileResult): AIAnalysis {
  // Decode each dimension
  const readinessLevel = determineReadinessLevel(profile);
  const economicModel = determineEconomicModel(profile);
  const urgency = determineUrgency(profile);
  const advantage = identifyAdvantage(profile);
  const gaps = identifyGaps(profile, readinessLevel);
  const opportunity = findOpportunity(profile);
  const risk = assessRisk(profile);

  // Generate personalized messaging
  const welcomeMessage = generateWelcomeMessage(profile, readinessLevel, advantage);
  const todayFocus = generateTodayFocus(profile, readinessLevel, gaps);
  const strategySummary = generateStrategySummary(profile, economicModel, opportunity);

  // Specific targets
  const targetMarket = defineTargetMarket(profile);
  const pricingStrategy = definePricingStrategy(profile, readinessLevel);
  const incomePotential = projectIncome(profile, readinessLevel);
  const timeline = defineTimeline(profile);

  // First step
  const firstStep = defineFirstStep(profile, readinessLevel);

  return {
    readinessLevel,
    economicModel,
    urgency,
    advantage,
    gaps,
    opportunity,
    risk,
    welcomeMessage,
    todayFocus,
    strategySummary,
    targetMarket,
    pricingStrategy,
    incomePotential,
    timeline,
    firstStep,
  };
}

// ============================================================================
// DECODING FUNCTIONS
// ============================================================================

function determineReadinessLevel(profile: QuickProfileResult): ReadinessLevel {
  // Based on experience (Q3)
  const exp = profile.experience;

  if (exp <= 6) return "beginner"; // 0-6 months
  if (exp <= 24) return "intermediate"; // 6-24 months
  if (exp <= 60) return "advanced"; // 2-5 years
  return "expert"; // 5+ years
}

function determineEconomicModel(profile: QuickProfileResult): EconomicModel {
  const domain = profile.skills[0];
  const subSkill = profile.subSkill;

  // Design & Writing = skill service
  if (["design", "writing", "video_photo"].includes(domain)) {
    return "skill_service";
  }

  // Content Creator = audience builder
  if (domain === "content_creator") {
    if (subSkill.includes("influencer") || subSkill.includes("personal_brand")) {
      return "audience_builder";
    }
    return "skill_service";
  }

  // Tech could be either
  if (domain === "tech") {
    if (subSkill.includes("course") || subSkill.includes("education")) {
      return "product_creator";
    }
    return "skill_service";
  }

  // Marketing = skill service
  if (domain === "marketing") {
    return "skill_service";
  }

  // Business = skill service
  if (domain === "business") {
    return "skill_service";
  }

  // Education = product or service
  if (domain === "education") {
    if (subSkill.includes("course") || subSkill.includes("workshop")) {
      return "product_creator";
    }
    return "skill_service";
  }

  return "skill_service";
}

function determineUrgency(profile: QuickProfileResult): UrgencyLevel {
  // Based on timeline (Q6) and time commitment (Q5)
  const timeline = profile.timeline;
  const time = profile.time;

  if (timeline === "30_days") return "high";
  if (timeline === "3_months" && (time === "20-30h" || time === "30+h")) return "high";
  if (timeline === "3_months") return "medium";
  if (timeline === "6_months") return "medium";
  return "low"; // 12 months
}

function identifyAdvantage(profile: QuickProfileResult): string {
  const domain = profile.skills[0];
  const experience = profile.experience;
  const language = profile.language;

  let advantages: string[] = [];

  // Experience-based advantage
  if (experience >= 24) {
    advantages.push("sudah punya pengalaman eksekusi — tinggal buktikan dengan portofolio");
  } else if (experience >= 6) {
    advantages.push("paham dasar-dasar — bisa langsung lompat ke portofolio & client");
  } else {
    advantages.push("fresh perspective — bisa belajar dari awal tanpa bad habits");
  }

  // Language advantage
  if (language === "id_en_active" || language === "english_fluent") {
    advantages.push("bisa kerja dengan client internasional (bayaran 3-5x lebih tinggi)");
  } else if (language === "indonesia") {
    advantages.push("paham pasar lokal Indonesia — niche yang kurang dilirik freelancer global");
  }

  // Domain-specific advantages
  if (domain === "tech") {
    advantages.push("skill tech high-demand — banyak business butuh tapi sedikit yang bisa");
  }
  if (domain === "writing") {
    advantages.push("kemampuan menulis = universal skill — berguna di SEMUA bidang bisnis");
  }
  if (domain === "design") {
    advantages.push("visual skill yang langsung terlihat — mudah showcase di portofolio");
  }

  return advantages.join(" + ");
}

function identifyGaps(profile: QuickProfileResult, _readiness: ReadinessLevel): string[] {
  let gaps: string[] = [];

  const exp = profile.experience;
  const stage = profile.stage;

  // Experience-based gaps
  if (exp < 6) {
    gaps.push("butuh foundational skills — belum bisa eksekusi mandiri");
  } else if (exp < 24) {
    gaps.push("portofolio kosong — client tidak percaya tanpa bukti");
    gaps.push("belum ada pricing strategy — cenderu undercharge");
  } else {
    gaps.push("portofolio tidak terstruktur — sulit positioning sebagai expert");
    gaps.push("belum sistematis — masih pegang semua sendiri, belum bisa scale");
  }

  // Situation-based gaps
  if (stage === "employee") {
    gaps.push("waktu terbatas — harus manage side hustle sambil kerja");
  } else if (stage === "student") {
    gaps.push("budget terbatas — tidak bisa keluar uang untuk tools/iklan");
  } else if (stage === "freelancer") {
    gaps.push("income tidak stabil — perlu sistem untuk consistent clients");
  }

  // Language gap
  if (profile.language === "indonesia") {
    gaps.push("terbatas ke pasar lokal — competition bisa lebih tight");
  }

  return gaps;
}

function findOpportunity(profile: QuickProfileResult): string {
  const domain = profile.skills[0];
  const subSkill = profile.subSkill;
  const language = profile.language;

  // Domain-specific opportunities
  if (domain === "writing") {
    if (subSkill.includes("seo")) {
      return "90% UMKM Indonesia butuh content SEO-optimized, tapi hanya 10% freelancer yang bisa buktikan hasil ranking";
    }
    if (subSkill.includes("copywriting")) {
      return "UMKM Indonesia spent Rp 50T/year di iklan, tapi kebanyakan copywriting jelek — conversion rate bisa 2-3x dengan copy yang baik";
    }
  }

  if (domain === "design") {
    return "Indonesian SME social media spend growing 25% YoY — massive demand untuk visual content yang convert";
  }

  if (domain === "tech") {
    if (subSkill.includes("web") || subSkill.includes("app")) {
      return "Digital transformation in Indonesia — 40M+ MSMEs need online presence, hanya 15% yang sudah go digital";
    }
    if (subSkill.includes("ai") || subSkill.includes("prompting")) {
      return "AI adoption early stage — first movers who understand AI tools bisa charge premium untuk implementasi";
    }
  }

  if (domain === "marketing") {
    if (subSkill.includes("social_media")) {
      return "Indonesian social media users 190M+ — brands need help managing & growing presence, tapi kebanyakan posting tanpa strategy";
    }
    if (subSkill.includes("ads")) {
      return "Ad spend in Indonesia growing — businesses need people who understand ROAS, CAC, LTV, bukan sekedar 'boost post'";
    }
  }

  if (domain === "content_creator") {
    if (language === "id_en_active" || language === "english_fluent") {
      return "Global creator economy $100B+ — Indonesian creators with English skills bisa tap international market dengan less competition";
    }
    return "Indonesian creator ecosystem growing — local brands increasing influencer marketing budget 30-40% YoY";
  }

  // Default opportunity
  return "Indonesian digital economy growing fast — early entrants in spesifik niche bisa capture market share sebelum crowded";
}

function assessRisk(profile: QuickProfileResult): string {
  const experience = profile.experience;
  const stage = profile.stage;
  const target = profile.target;

  // Overpricing risk for experienced
  if (experience >= 24 && target === "10m+") {
    return "cenderu overpricing di awal — butuh bukti portofolio dulu sebelum charge premium";
  }

  // Underpricing risk for beginners
  if (experience < 6) {
    return "cenderu undercharge karena kurang confident — atau sebaliknya, overpricing tanpa bukti";
  }

  // Employee risk
  if (stage === "employee") {
    return "burnout risk — kerja side hustle sambil full-time bisa exhausting jika tidak manage energi baik";
  }

  // Student risk
  if (stage === "student") {
    return "fokus terbagi — harus balance antara study dan income generation";
  }

  return "generic freelance risk — inconsistent income di awal sampai build reputation";
}

// ============================================================================
// PERSONALIZED CONTENT GENERATION
// ============================================================================

function generateWelcomeMessage(
  profile: QuickProfileResult,
  readiness: ReadinessLevel,
  advantage: string
): string {
  const name = ""; // Would come from user profile
  const subSkill = getSubSkillLabel(profile.subSkill);
  const expYears = (profile.experience / 12).toFixed(1);

  let message = `Hai${name ? " " + name : ""}! 👋\n\n`;

  // Readiness-specific messaging
  if (readiness === "beginner") {
    message += `Sebagai ${subSkill} pemula, kamu berada di posisi yang SANGAT STRATEGIS untuk belajar skill yang high-demand.\n\n`;
    message += `Keunggulan kamu: ${advantage}.`;
  } else if (readiness === "intermediate") {
    message += `Sebagai ${subSkill} dengan ${expYears} tahun pengalaman, kamu BERADA di sweet spot.\n\n`;
    message += `Keunggulan kamu: ${advantage}.`;
  } else if (readiness === "advanced") {
    message += `Sebagai ${subSkill} dengan ${expYears} tahun pengalaman, kamu SIAP untuk leveling up.\n\n`;
    message += `Keunggulan kamu: ${advantage}.`;
  } else {
    message += `Sebagai ${subSkill} expert, kamu berada di posisi untuk LEAD.\n\n`;
    message += `Keunggulan kamu: ${advantage}.`;
  }

  return message;
}

function generateTodayFocus(
  _profile: QuickProfileResult,
  readinessLevel: ReadinessLevel,
  _gaps: string[]
): string {
  const todayTasks: Record<ReadinessLevel, string> = {
    beginner: "Fokus hari ini: Pelajari fundamental skill + buat 1 portofolio piece pertama (meskipun sederhana).",
    intermediate: "Fokus hari ini: Optimasi portofolio + mulai pitching ke 3 potential client.",
    advanced: "Fokus hari ini: Review positioning + naikkan rate + pitch ke higher-value clients.",
    expert: "Fokus hari ini: Delegasi tasks + fokus di high-leverage activities (strategy, partnerships).",
  };

  return todayTasks[readinessLevel];
}

function generateStrategySummary(
  profile: QuickProfileResult,
  economicModel: EconomicModel,
  opportunity: string
): string {
  const timeline = getTimelineLabel(profile.timeline);
  const target = getTargetLabel(profile.target);

  let summary = `🎯 TARGET ${timeline.toUpperCase()}:\n`;

  summary += `• Income target: ${target} per bulan\n`;
  summary += `• Economic model: ${getEconomicModelLabel(economicModel)}\n`;
  summary += `• Opportunity: ${opportunity}\n\n`;

  summary += `⚠️ GAP YANG PERLU DITUTUP:\n`;
  const gaps = identifyGaps(profile, determineReadinessLevel(profile));
  gaps.slice(0, 3).forEach((gap) => {
    summary += `• ${gap}\n`;
  });

  return summary;
}

function defineTargetMarket(profile: QuickProfileResult): string {
  const skillDomain = profile.skills[0];
  const language = profile.language;

  // English speakers can target global
  if (language === "id_en_active" || language === "english_fluent") {
    if (skillDomain === "tech") return "US/Europe startups & SMEs yang butuh affordable tech talent";
    if (skillDomain === "writing") return "International brands needing English content (blog, copy, email)";
    if (skillDomain === "design") return "Global businesses needing visual assets (social media, branding)";
  }

  // Indonesia-focused markets
  if (skillDomain === "writing") {
    return "Indonesian SMEs di: health, fashion, F&B, education — businesses yang aktif di social media tapi website sepi";
  }
  if (skillDomain === "design") {
    return "Indonesian D2C brands & SMEs — e-commerce, F&B, fashion, beauty brands yang aktif di IG/TikTok";
  }
  if (skillDomain === "tech") {
    return "Indonesian MSMEs (40M+ businesses) yang need go digital — website, app, systems";
  }
  if (skillDomain === "marketing") {
    return "Indonesian businesses dengan ad budget butuh ROAS optimization — e-commerce, D2C brands, startups";
  }
  if (skillDomain === "content_creator") {
    return "Indonesian audience di niche spesifik — education, entertainment, lifestyle, business";
  }

  return "Indonesian digital economy — businesses going online need various services";
}

function definePricingStrategy(_profile: QuickProfileResult, readiness: ReadinessLevel): string {
  const pricing: Record<ReadinessLevel, string> = {
    beginner: "START: Rp 300-500K/project → AFTER 3 portfolio pieces: Rp 1-2M/project",
    intermediate: "START: Rp 1-2M/project → AFTER 5 client testimonials: Rp 2-4M/project",
    advanced: "START: Rp 3-5M/project → AFTER case studies: Rp 5-10M/project",
    expert: "START: Rp 10M+/project atau retainer model — charge based on value, not hours",
  };

  return pricing[readiness];
}

function projectIncome(_profile: QuickProfileResult, readiness: ReadinessLevel): string {
  const income: Record<ReadinessLevel, string> = {
    beginner: "Rp 2-5 Juta dalam 3-6 bulan (setelah build portofolio + dapat beberapa client)",
    intermediate: "Rp 3-7 Juta dalam 1-3 bulan (skill sudah ada, tinggal portofolio + pitching)",
    advanced: "Rp 5-10 Juta dalam 1 bulan (bisa dapat segera jika portofolio solid)",
    expert: "Rp 10+ Juta atau lebih — tergantung positioning & value yang kamu deliver",
  };

  return income[readiness];
}

function defineTimeline(profile: QuickProfileResult): string {
  return getTimelineLabel(profile.timeline);
}

function defineFirstStep(profile: QuickProfileResult, readiness: ReadinessLevel): string {
  const skillDomain = getDomainLabel(profile.skills[0]);

  const firstSteps: Record<ReadinessLevel, string> = {
    beginner: `Pelajari fundamental ${skillDomain} dari free resources (YouTube, blog) + buat 1 sample work untuk portofolio.`,
    intermediate: `Update portofolio dengan 3-5 best works + buat LinkedIn/Instagram profile + list 20 potential clients untuk pitching.`,
    advanced: `Create case studies dari previous works + update pricing + pitch to 5 higher-value clients.`,
    expert: `Review business model — delegate lower-value tasks, fokus di strategy & partnerships.`,
  };

  return firstSteps[readiness];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDomainLabel(domainId: string): string {
  const labels: Record<string, string> = {
    design: "Designer",
    video_photo: "Video/Photo Creator",
    content_creator: "Content Creator",
    writing: "Writer",
    tech: "Tech Professional",
    marketing: "Marketing Professional",
    business: "Business Professional",
    education: "Education Professional",
  };
  return labels[domainId] || domainId;
}

function getSubSkillLabel(subSkillId: string): string {
  // Convert snake_case to Title Case
  return subSkillId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getTimelineLabel(timelineId: string): string {
  const labels: Record<string, string> = {
    "30_days": "30 Hari",
    "3_months": "3 Bulan",
    "6_months": "6 Bulan",
    "12_months": "12 Bulan",
  };
  return labels[timelineId] || timelineId;
}

function getTargetLabel(targetId: string): string {
  const labels: Record<string, string> = {
    "500k_1m": "Rp 500K - 1 Juta",
    "1m_2m": "Rp 1-2 Juta",
    "2m_5m": "Rp 2-5 Juta",
    "5m_10m": "Rp 5-10 Juta",
    "10m+": "Rp 10+ Juta",
  };
  return labels[targetId] || targetId;
}

function getEconomicModelLabel(model: EconomicModel): string {
  const labels: Record<EconomicModel, string> = {
    skill_service: "Jual Skill & Jasa",
    audience_builder: "Bangun Audience",
    product_creator: "Buat Produk Digital",
    arbitrage: "Arbitrage & Reseller",
  };
  return labels[model];
}
