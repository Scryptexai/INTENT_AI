export interface QuickOption {
  id: string;
  emoji: string;
  label: string;
  hint?: string;
}

export interface QuickQuestion {
  id: string;
  title: string;
  subtitle?: string;
  multiSelect?: boolean;
  maxSelect?: number;
  isSlider?: boolean;
  sliderLabels?: string[];
  options: QuickOption[];
}

export interface QuickProfileResult {
  skills: string[];
  subSkill: string;
  experience: number;
  target: string;
  time: string;
  timeline: string;
  language: string;
  stage: string;
}

// Q1 — MINAT KERJA (Single select untuk fokus!)
export const Q_SKILLS: QuickQuestion = {
  id: "skills",
  title: "Minat kerja apa yang ingin kamu pelajari atau coba?",
  subtitle: "Pilih satu bidang utama. Q2 akan breakdown lebih spesifik.",
  multiSelect: false,
  maxSelect: 1,
  options: [
    // CREATIVE & DESIGN
    { id: "design", emoji: "🎨", label: "Design", hint: "Graphic, UI/UX, Illustration" },
    { id: "video_photo", emoji: "🎬", label: "Video & Photo", hint: "Editing, Photography, Motion" },

    // CONTENT & WRITING
    { id: "content_creator", emoji: "🎯", label: "Content Creator", hint: "Influencer, Personal Brand" },
    { id: "writing", emoji: "✍️", label: "Writing", hint: "Copywriting, Blog, Script" },

    // TECH & DATA
    { id: "tech", emoji: "💻", label: "Tech & Development", hint: "Web, App, AI, Data, No-code" },

    // MARKETING
    { id: "marketing", emoji: "📢", label: "Marketing", hint: "Social Media, SEO, Ads, Email" },

    // BUSINESS & OPS
    { id: "business", emoji: "💼", label: "Business & Ops", hint: "Project Mgmt, VA, Sales" },

    // EDUCATION
    { id: "education", emoji: "🎓", label: "Education & Coaching", hint: "Tutoring, Courses, Consulting" },
  ],
};

// Q2 — TURUNAN SKILL (BRANCHING dari Q1)
export const SUB_SKILLS: Record<string, QuickOption[]> = {
  // DESIGN
  design: [
    { id: "graphic_design", emoji: "🎨", label: "Graphic Design", hint: "Logo, branding, identity, print" },
    { id: "ui_ux_design", emoji: "🖥️", label: "UI/UX Design", hint: "Website & app interface" },
    { id: "illustration", emoji: "✏️", label: "Illustration", hint: "Digital art, character, vector" },
    { id: "social_media_design", emoji: "📱", label: "Social Media Design", hint: "Post, story, carousel" },
    { id: "presentation_design", emoji: "📊", label: "Presentation Design", hint: "Pitch deck, slides, infographic" },
    { id: "print_design", emoji: "📄", label: "Print Design", hint: "Brochure, packaging, merchandise" },
    { id: "motion_graphics", emoji: "✨", label: "Motion Graphics", hint: "Animation, intro, explainer" },
  ],

  // VIDEO & PHOTO
  video_photo: [
    { id: "video_editing_reels", emoji: "📱", label: "Short-Form Video", hint: "Reels, TikTok, Shorts" },
    { id: "video_editing_youtube", emoji: "🎬", label: "Long-Form Video", hint: "YouTube, documentary, vlog" },
    { id: "motion_graphics_video", emoji: "✨", label: "Motion Graphics", hint: "Animation, intro, explainer" },
    { id: "photography_product", emoji: "📷", label: "Product Photography", hint: "E-commerce, catalog, food" },
    { id: "photography_portrait", emoji: "📸", label: "Portrait Photography", hint: "Personal, corporate, events" },
    { id: "photo_editing", emoji: "🖼️", label: "Photo Editing", hint: "Retouching, color grading, manipulation" },
    { id: "live_streaming", emoji: "📺", label: "Live Streaming", hint: "Live selling, events, gaming" },
  ],

  // CONTENT CREATOR
  content_creator: [
    { id: "influencer_lifestyle", emoji: "✨", label: "Lifestyle Influencer", hint: "Daily life, fashion, travel" },
    { id: "influencer_edu", emoji: "🎓", label: "Education Creator", hint: "Tutorials, tips, how-to" },
    { id: "influencer_review", emoji: "⭐", label: "Review Creator", hint: "Product reviews, unboxing" },
    { id: "influencer_entertainment", emoji: "🎭", label: "Entertainment Creator", hint: "Comedy, skits, reactions" },
    { id: "influencer_business", emoji: "💼", label: "Business Creator", hint: "Entrepreneurship, money, career" },
    { id: "influencer_faceless", emoji: "🎨", label: "Faceless Creator", hint: "Without showing face, voiceover" },
    { id: "personal_brand", emoji: "🎯", label: "Personal Brand", hint: "Build authority in niche" },
  ],

  // WRITING
  writing: [
    { id: "copywriting_ads", emoji: "💰", label: "Copywriting", hint: "Ads, landing page, sales page" },
    { id: "email_copywriting", emoji: "📧", label: "Email Copywriting", hint: "Newsletter, sequences, automation" },
    { id: "blog_writing_seo", emoji: "📝", label: "Blog & SEO Writing", hint: "Articles, ranking content" },
    { id: "scriptwriting_video", emoji: "🎬", label: "Scriptwriting", hint: "YouTube, TikTok, podcast" },
    { id: "technical_writing", emoji: "📖", label: "Technical Writing", hint: "Documentation, manuals, SOPs" },
    { id: "creative_writing", emoji: "✍️", label: "Creative Writing", hint: "Stories, ebooks, fiction" },
    { id: "ghostwriting", emoji: "👻", label: "Ghostwriting", hint: "For others, under their name" },
    { id: "ux_writing", emoji: "💬", label: "UX Writing", hint: "Interface copy, microcopy" },
  ],

  // TECH
  tech: [
    { id: "web_dev_frontend", emoji: "🌐", label: "Frontend Dev", hint: "React, Vue, HTML/CSS/JS" },
    { id: "web_dev_backend", emoji: "⚙️", label: "Backend Dev", hint: "Node.js, Python, API" },
    { id: "web_dev_fullstack", emoji: "💻", label: "Fullstack Dev", hint: "Frontend + Backend" },
    { id: "app_dev_mobile", emoji: "📱", label: "Mobile App Dev", hint: "React Native, Flutter" },
    { id: "data_analysis", emoji: "📊", label: "Data Analysis", hint: "Excel, BI, insights" },
    { id: "ai_prompting", emoji: "🤖", label: "AI & Prompting", hint: "ChatGPT, Midjourney, automation" },
    { id: "nocode_builder", emoji: "🧩", label: "No-Code Builder", hint: "Bubble, Softr, Webflow" },
    { id: "wordpress_dev", emoji: "🎨", label: "WordPress Dev", hint: "Themes, plugins, Woo" },
  ],

  // MARKETING
  marketing: [
    { id: "social_media_marketing", emoji: "📱", label: "Social Media Marketing", hint: "Strategy, content, growth" },
    { id: "social_media_management", emoji: "📅", label: "Social Media Mgmt", hint: "Manage accounts, scheduling" },
    { id: "seo_specialist", emoji: "🔍", label: "SEO", hint: "Ranking, organic traffic, keywords" },
    { id: "paid_ads_meta", emoji: "📣", label: "Paid Ads (Meta)", hint: "Facebook & Instagram Ads" },
    { id: "paid_ads_google", emoji: "🎯", label: "Paid Ads (Google)", hint: "Search, Display, YouTube Ads" },
    { id: "email_marketing", emoji: "📧", label: "Email Marketing", hint: "Newsletter, flows, automation" },
    { id: "community_management", emoji: "👥", label: "Community Management", hint: "Engagement, moderation, growth" },
    { id: "influencer_marketing", emoji: "⭐", label: "Influencer Marketing", hint: "Collabs, partnerships" },
  ],

  // BUSINESS & OPS
  business: [
    { id: "project_management", emoji: "📋", label: "Project Management", hint: "Planning, coordination, tools" },
    { id: "virtual_assistant", emoji: "🗂️", label: "Virtual Assistant", hint: "Admin, support, operations" },
    { id: "customer_service", emoji: "💬", label: "Customer Service", hint: "Support, success, retention" },
    { id: "business_development", emoji: "📈", label: "Business Development", hint: "Sales, partnerships" },
    { id: "ecommerce_management", emoji: "🛒", label: "E-commerce Management", hint: "Store ops, inventory, logistics" },
    { id: "accounting_finance", emoji: "💰", label: "Accounting & Finance", hint: "Bookkeeping, reports" },
    { id: "hr_recruiting", emoji: "👥", label: "HR & Recruiting", hint: "Hiring, onboarding, people ops" },
  ],

  // EDUCATION & COACHING
  education: [
    { id: "online_tutoring", emoji: "🎓", label: "Online Tutoring", hint: "Academic subjects, skills" },
    { id: "course_creation", emoji: "📚", label: "Course Creation", hint: "Online courses, workshops" },
    { id: "consulting", emoji: "💼", label: "Consulting", hint: "Expert advice, strategy" },
    { id: "coaching_life", emoji: "🌟", label: "Life Coaching", hint: "Personal development, goals" },
    { id: "coaching_career", emoji: "💼", label: "Career Coaching", hint: "Job search, interviews" },
    { id: "coaching_fitness", emoji: "💪", label: "Fitness Coaching", hint: "Health, nutrition, training" },
    { id: "workshop_facilitation", emoji: "🎯", label: "Workshop Facilitation", hint: "Live training, events" },
  ],

  // DEFAULT (fallback)
  none: [
    { id: "explore_flexible", emoji: "🧭", label: "Flexible Exploration", hint: "Sistem pilihkan untuk saya" },
  ],
};

export function getSubSkillOptions(primarySkill: string): QuickOption[] {
  return SUB_SKILLS[primarySkill] || SUB_SKILLS.none;
}

// Q3 — PENGALAMAN (Slider 0-4)
export const Q_EXPERIENCE: QuickQuestion = {
  id: "experience",
  title: "",
  subtitle: "Geser sesuai level kamu.",
  isSlider: true,
  sliderLabels: [
    "Baru mulai belajar",
    "Pernah coba, belum mahir",
    "Bisa eksekusi sendiri",
    "Sudah mahir, punya hasil",
    "Expert, sudah dibayar",
  ],
  options: [],
};

// Q4 — GOAL + TIMELINE (Merged from Q4 + Q6 for efficiency)
export const Q_TARGET: QuickQuestion = {
  id: "target",
  title: "Apa target utama kamu dalam 3-6 bulan ke depan?",
  subtitle: "Ini menentukan strategi & milestones yang AI buat.",
  options: [
    { id: "quick_income", emoji: "⚡", label: "Income Cepat (30 hari)", hint: "Rp 500rb-2juta, fokus eksekusi cepat" },
    { id: "side_income", emoji: "💰", label: "Side Income (3 bulan)", hint: "Rp 2-5juta, sampingan kerja" },
    { id: "fulltime", emoji: "🏆", label: "Full-Time (6 bulan)", hint: "Rp 5-10juta, transition karir" },
    { id: "scale", emoji: "🚀", label: "Scale Business (6 bulan)", hint: "Rp 10juta+, growth existing income" },
    { id: "portfolio", emoji: "📁", label: "Bangun Portfolio", hint: "Skill dulu, fokus long-term" },
    { id: "brand", emoji: "⭐", label: "Personal Brand", hint: "Audience dulu, monetize later" },
    { id: "passive", emoji: "🤖", label: "Passive Income", hint: "Products, automation, systems" },
    { id: "agency", emoji: "🏢", label: "Scale with Team", hint: "Buat agency, hire team" },
  ],
};

// Q5 — WAKTU
export const Q_TIME: QuickQuestion = {
  id: "time",
  title: "Berapa waktu yang bisa kamu dedikasikan per hari?",
  options: [
    { id: "lt30m", emoji: "⚡", label: "< 30 menit", hint: "Sangat sibuk, weekend only" },
    { id: "30m-1h", emoji: "🕐", label: "30–60 menit", hint: "Sampingan santai" },
    { id: "1-2h", emoji: "🕑", label: "1–2 jam", hint: "Part-time serius" },
    { id: "2-4h", emoji: "🕒", label: "2–4 jam", hint: "Hampir full-time" },
    { id: "gt4h", emoji: "🕕", label: "4+ jam", hint: "Full-time commitment" },
    { id: "weekend", emoji: "📅", label: "Weekend only", hint: "Kerja weekday, belajar weekend" },
    { id: "flexible", emoji: "🔄", label: "Tidak menentu", hint: "Sesuaikan mingguan" },
  ],
};

// Q6 — TARGET JANGKA WAKTU (NEW!)
export const Q_TIMELINE: QuickQuestion = {
  id: "timeline",
  title: "Dalam berapa lama kamu mau mencapai target?",
  subtitle: "AI akan set milestones yang realistis.",
  options: [
    { id: "30_days", emoji: "🎯", label: "30 Hari", hint: "Sprint cepat, fokus eksekusi" },
    { id: "3_months", emoji: "📅", label: "3 Bulan", hint: "Build foundation + first income" },
    { id: "6_months", emoji: "🗓️", label: "6 Bulan", hint: "Comprehensive skill + consistent income" },
    { id: "12_months", emoji: "📈", label: "12 Bulan", hint: "Career transition, full mastery" },
  ],
};

// Q7 — MARKET REACH (Bahasa kerja)
export const Q_LANGUAGE: QuickQuestion = {
  id: "language",
  title: "Market mana yang bisa kamu jangkau?",
  subtitle: "Ini menentukan job & client yg tersedia.",
  options: [
    { id: "id_only", emoji: "🇮🇩", label: "Indonesia Only", hint: "Bahasa Indonesia, market lokal" },
    { id: "id_en_passive", emoji: "📖", label: "Bisa Baca Inggris", hint: "Consume English, produce Indo" },
    { id: "id_en_active", emoji: "💬", label: "Bisa Kerja dalam Inggris", hint: "Market lokal + global" },
    { id: "en_fluent", emoji: "🌍", label: "English Fluent", hint: "Full akses market global" },
  ],
};

// Q8 — KONDISI SEKARANG
export const Q_STAGE: QuickQuestion = {
  id: "stage",
  title: "Kondisi kamu sekarang?",
  subtitle: "AI akan pertimbangkan constraints kamu.",
  options: [
    { id: "student", emoji: "🎓", label: "Pelajar / Mahasiswa", hint: "Banyak waktu, minim modal" },
    { id: "fresh_grad", emoji: "🎓", label: "Fresh Graduate", hint: "Baru lulus, cari jalan" },
    { id: "employee", emoji: "👔", label: "Karyawan", hint: "Stabil, cari sampingan" },
    { id: "freelancer", emoji: "🧑‍💻", label: "Freelancer", hint: "Sudah di game, mau scale" },
    { id: "unemployed", emoji: "🔍", label: "Sedang cari kerja", hint: "Butuh income segera" },
    { id: "entrepreneur", emoji: "🚀", label: "Punya bisnis", hint: "Mau tambah stream" },
    { id: "parent", emoji: "🏠", label: "Dari rumah", hint: "Waktu fleksibel, cari income" },
    { id: "career_break", emoji: "🔄", label: "Career break", hint: "Istirahat, mau switch direction" },
    { id: "retiree", emoji: "🌴", label: "Pensiunan", hint: "Income tambahan di usia senja" },
  ],
};

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

import type { EconomicModelId } from "./branchingProfileConfig";
import type { PathId } from "./profilingConfig";

export function inferEconomicModel(target: string, skill: string, subSkill: string): EconomicModelId {
  if (target === "scale" && skill === "coding") return "automation_builder";
  if (target === "scale") return "digital_product";

  const skillModelMap: Record<string, EconomicModelId> = {
    writing: "skill_service",
    design: "skill_service",
    video: "audience_based",
    coding: "automation_builder",
    marketing: "skill_service",
    speaking: "audience_based",
    analysis: "data_research",
    selling: "commerce_arbitrage",
    none: "skill_service",
  };

  if (subSkill === "affiliate" || subSkill === "dropship" || subSkill === "marketplace") return "commerce_arbitrage";
  if (subSkill === "youtube_face" || subSkill === "podcast" || subSkill === "short_form" || subSkill === "faceless") return "audience_based";
  if (subSkill === "newsletter" || subSkill === "market_research") return "data_research";
  if (subSkill === "ai_tools" || subSkill === "automation" || subSkill === "nocode") return "automation_builder";
  if (subSkill === "template" || subSkill === "creative") return "digital_product";

  return skillModelMap[skill] || "skill_service";
}

export function inferSubSector(skill: string, subSkill: string): string {
  const map: Record<string, string> = {
    copywriting: "writing", seo_content: "writing", script: "writing",
    ghostwriting: "writing", technical: "writing", creative: "writing",
    social_media: "design", branding: "design", ui_ux: "design",
    thumbnail: "design", template: "template",
    short_form: "content_creator", long_form: "video", motion: "video",
    faceless: "niche_page", live: "content_creator",
    web_dev: "development", app_dev: "development", automation: "ai_workflow",
    ai_tools: "ai_operator", nocode: "nocode_builder",
    ads: "marketing", seo: "marketing", social_mgmt: "marketing",
    email: "marketing", funnel: "funnel_builder",
    youtube_face: "content_creator", podcast: "content_creator",
    live_selling: "tiktok_shop", coaching: "course_mini", mc_host: "content_creator",
    market_research: "trend_researcher", data_analysis: "market_analyst",
    newsletter: "newsletter_writer", crypto_finance: "crypto_analyst",
    ai_curation: "ai_curator",
    marketplace: "dropship", dropship: "dropship", affiliate: "affiliate",
    social_selling: "tiktok_shop", b2b_sales: "marketing",
    explore_content: "niche_page", explore_freelance: "writing",
    explore_selling: "dropship", explore_tech: "development",
    explore_anything: "writing",
  };
  return map[subSkill] || skill;
}

export function inferPlatform(skill: string, subSkill: string, language: string): string {
  if (language === "en_fluent" || language === "id_en_active") {
    if (skill === "writing" || skill === "design" || skill === "coding") return "upwork";
    if (skill === "marketing") return "linkedin";
  }
  const map: Record<string, string> = {
    short_form: "tiktok", long_form: "youtube", faceless: "tiktok",
    youtube_face: "youtube", podcast: "youtube", live_selling: "tiktok",
    social_media: "instagram", social_mgmt: "instagram", social_selling: "instagram",
    seo_content: "own_website", seo: "own_website", newsletter: "substack",
    marketplace: "shopee", dropship: "shopee", affiliate: "instagram",
    nocode: "direct_client", ai_tools: "upwork",
    writing: "fiverr", design: "fiverr", video: "tiktok",
    coding: "upwork", marketing: "linkedin", speaking: "youtube",
    analysis: "substack", selling: "shopee",
  };
  return map[subSkill] || map[skill] || "instagram";
}

export function inferLegacyPath(skill: string, subSkill: string, target: string): PathId {
  if (target === "scale" || subSkill === "template" || subSkill === "creative") return "digital_product";
  if (skill === "selling" || subSkill === "dropship" || subSkill === "affiliate" || subSkill === "marketplace") return "arbitrage_skill";
  if (skill === "video" || skill === "speaking" || subSkill === "short_form" || subSkill === "faceless") return "niche_content";
  if (skill === "analysis" || subSkill === "newsletter") return "freelance_upgrade";
  return "micro_service";
}

export function inferRisk(stage: string): number {
  const map: Record<string, number> = {
    student: 3, employee: 2, freelancer: 3,
    unemployed: 2, entrepreneur: 4, parent: 1,
  };
  return map[stage] || 2;
}

export function inferCapital(stage: string): number {
  const map: Record<string, number> = {
    student: 0, employee: 1, freelancer: 1,
    unemployed: 0, entrepreneur: 2, parent: 0,
  };
  return map[stage] || 0;
}

export function mapTimeToScore(time: string): number {
  const map: Record<string, number> = { "lt1h": 1, "1-2h": 2, "3-4h": 3, "gt4h": 4 };
  return map[time] || 2;
}

export function mapLanguageToScore(language: string): number {
  const map: Record<string, number> = { id_only: 0, id_en_passive: 1, id_en_active: 2, en_fluent: 3 };
  return map[language] || 0;
}

export function buildAnswerTags(p: QuickProfileResult): Record<string, string> {
  const model = inferEconomicModel(p.target, p.skills[0] || "none", p.subSkill);
  const subSector = inferSubSector(p.skills[0] || "none", p.subSkill);
  const platform = inferPlatform(p.skills[0] || "none", p.subSkill, p.language);

  return {
    economic_model: model,
    sub_sector: subSector,
    niche: subSector,
    platform: platform,
    workflow_id: `${model}__${subSector}__${p.subSkill}__${platform}`,
    skills: p.skills.join(","),
    sub_skill: p.subSkill,
    experience_level: String(p.experience),
    target: p.target,
    time: p.time,
    language_skill: p.language === "en_fluent" ? "fluent" :
                    p.language === "id_en_active" ? "moderate" :
                    p.language === "id_en_passive" ? "passive" : "none",
    current_stage: p.stage,
    skill_level: p.experience <= 1 ? "basic" : p.experience <= 2 ? "intermediate" : "advanced",
    capital: inferCapital(p.stage) === 0 ? "zero" : "lt50",
    risk: inferRisk(p.stage) <= 2 ? "low" : "medium",
    audience: "zero",
    income_target: p.target === "full_income" ? "5m-15m" :
                   p.target === "scale" ? "gt15m" :
                   p.target === "side_income" ? "2m-5m" :
                   p.target === "first_income" ? "500k-2m" : "2m-5m",
    biggest_challenge: p.experience === 0 ? "no_direction" : "no_time",
    profile_level: "quick",
  };
}

// ============================================================================
// LEVEL 2 UPGRADE
// ============================================================================

export interface UpgradeQuestion {
  id: string;
  title: string;
  subtitle?: string;
  options: QuickOption[];
}

export const UPGRADE_QUESTIONS: UpgradeQuestion[] = [
  {
    id: "digital_experience",
    title: "Pengalaman digital sebelumnya?",
    options: [
      { id: "never", emoji: "🆕", label: "Belum pernah" },
      { id: "tried", emoji: "😤", label: "Pernah coba, berhenti" },
      { id: "side", emoji: "🌙", label: "Pernah sampingan" },
      { id: "active", emoji: "💼", label: "Aktif di digital" },
      { id: "expert", emoji: "🏆", label: "Berpengalaman" },
    ],
  },
  {
    id: "tools_familiarity",
    title: "Tools digital yang dikuasai?",
    options: [
      { id: "none", emoji: "🚫", label: "Belum familiar" },
      { id: "basic", emoji: "📱", label: "Canva, Google Docs" },
      { id: "intermediate", emoji: "🔧", label: "Figma, Premiere, WordPress" },
      { id: "advanced", emoji: "⚡", label: "Coding, API, automation" },
    ],
  },
  {
    id: "weekly_commitment",
    title: "Berapa lama bisa komitmen?",
    options: [
      { id: "1_week", emoji: "⚡", label: "1 minggu coba" },
      { id: "2_weeks", emoji: "📅", label: "2 minggu" },
      { id: "1_month", emoji: "📆", label: "1 bulan" },
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
    title: "Sudah punya audience?",
    options: [
      { id: "zero", emoji: "🚫", label: "Belum ada" },
      { id: "micro", emoji: "🌱", label: "< 200" },
      { id: "small", emoji: "📱", label: "200 - 1.000" },
      { id: "medium", emoji: "👥", label: "1K - 5K" },
      { id: "large", emoji: "🌟", label: "> 5K" },
    ],
  },
];

export function shouldShowUpgradePrompt(
  answerTags: Record<string, string>,
  createdAt: string | Date
): boolean {
  if (answerTags.profile_level === "upgraded") return false;
  const created = new Date(createdAt);
  const now = new Date();
  const daysSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= 3;
}
