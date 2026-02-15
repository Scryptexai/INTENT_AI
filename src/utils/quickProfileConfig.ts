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
  language: string;
  stage: string;
}

// Q1 — SKILL UTAMA
export const Q_SKILLS: QuickQuestion = {
  id: "skills",
  title: "Skill apa yang kamu punya?",
  subtitle: "Pilih yang paling kuat. Boleh lebih dari satu.",
  multiSelect: true,
  maxSelect: 3,
  options: [
    { id: "writing", emoji: "✍️", label: "Menulis", hint: "Artikel, copy, script" },
    { id: "design", emoji: "🎨", label: "Desain", hint: "Visual, grafis, UI" },
    { id: "video", emoji: "🎬", label: "Video", hint: "Edit, rekam, motion" },
    { id: "coding", emoji: "💻", label: "Coding / Tech", hint: "Web, app, automation" },
    { id: "marketing", emoji: "📢", label: "Marketing", hint: "Ads, SEO, social media" },
    { id: "speaking", emoji: "🎤", label: "Ngomong / Tampil", hint: "Live, podcast, presentasi" },
    { id: "analysis", emoji: "📊", label: "Analisis / Riset", hint: "Data, trend, report" },
    { id: "selling", emoji: "🛒", label: "Jualan", hint: "Negosiasi, closing, marketplace" },
    { id: "none", emoji: "🌱", label: "Belum punya skill khusus", hint: "Sistem akan bantu temukan arah" },
  ],
};

// Q2 — TURUNAN SKILL (BRANCHING dari Q1)
export const SUB_SKILLS: Record<string, QuickOption[]> = {
  writing: [
    { id: "copywriting", emoji: "💰", label: "Copywriting / Sales", hint: "Landing page, email, ads" },
    { id: "seo_content", emoji: "🔍", label: "SEO & Blog", hint: "Artikel ranking Google" },
    { id: "script", emoji: "🎬", label: "Script Video", hint: "YouTube, TikTok, podcast" },
    { id: "ghostwriting", emoji: "👻", label: "Ghostwriting", hint: "Nulis untuk orang lain" },
    { id: "technical", emoji: "📝", label: "Technical Writing", hint: "Dokumentasi, SOP, tutorial" },
    { id: "creative", emoji: "📖", label: "Creative Writing", hint: "Cerita, ebook, narrative" },
  ],
  design: [
    { id: "social_media", emoji: "📱", label: "Social Media Design", hint: "Post, story, carousel" },
    { id: "branding", emoji: "🎨", label: "Branding & Logo", hint: "Identitas visual brand" },
    { id: "ui_ux", emoji: "🖥️", label: "UI/UX Design", hint: "Interface web & app" },
    { id: "thumbnail", emoji: "🖼️", label: "Thumbnail & Banner", hint: "YouTube, blog, ads" },
    { id: "template", emoji: "📋", label: "Template Design", hint: "Canva, Notion, PowerPoint" },
  ],
  video: [
    { id: "short_form", emoji: "📱", label: "Short-Form", hint: "Reels, TikTok, Shorts" },
    { id: "long_form", emoji: "🎬", label: "Long-Form Editing", hint: "YouTube, documentary" },
    { id: "motion", emoji: "✨", label: "Motion Graphics", hint: "Animasi, intro, explainer" },
    { id: "faceless", emoji: "🙈", label: "Faceless Content", hint: "Tanpa tampil muka" },
    { id: "live", emoji: "📺", label: "Live & Streaming", hint: "Live selling, podcast" },
  ],
  coding: [
    { id: "web_dev", emoji: "🌐", label: "Web Development", hint: "Website, landing page" },
    { id: "app_dev", emoji: "📱", label: "App Development", hint: "Mobile, cross-platform" },
    { id: "automation", emoji: "⚙️", label: "Automation & Bots", hint: "Scraper, workflow, API" },
    { id: "ai_tools", emoji: "🤖", label: "AI Tools / Agents", hint: "Chatbot, AI workflow" },
    { id: "nocode", emoji: "🧩", label: "No-Code Builder", hint: "Bubble, Softr, Glide" },
  ],
  marketing: [
    { id: "ads", emoji: "📢", label: "Ads / Paid Media", hint: "Meta, Google, TikTok Ads" },
    { id: "seo", emoji: "🔍", label: "SEO", hint: "Ranking di Google" },
    { id: "social_mgmt", emoji: "📱", label: "Social Media Management", hint: "Planning, posting, engage" },
    { id: "email", emoji: "📧", label: "Email Marketing", hint: "Newsletter, sequence, nurture" },
    { id: "funnel", emoji: "🔄", label: "Funnel & Conversion", hint: "Landing page, lead gen" },
  ],
  speaking: [
    { id: "youtube_face", emoji: "🎥", label: "YouTube / Face Content", hint: "Talking head, vlog" },
    { id: "podcast", emoji: "🎙️", label: "Podcast", hint: "Audio content, interview" },
    { id: "live_selling", emoji: "🛍️", label: "Live Selling", hint: "TikTok Live, Shopee Live" },
    { id: "coaching", emoji: "🎓", label: "Coaching / Mentoring", hint: "1-on-1, group session" },
    { id: "mc_host", emoji: "🎤", label: "MC / Host Online", hint: "Webinar, event online" },
  ],
  analysis: [
    { id: "market_research", emoji: "📈", label: "Market Research", hint: "Trend, kompetitor, opportunity" },
    { id: "data_analysis", emoji: "📊", label: "Data Analysis", hint: "Spreadsheet, dashboard, report" },
    { id: "newsletter", emoji: "📧", label: "Riset Newsletter", hint: "Curated insights, paid newsletter" },
    { id: "crypto_finance", emoji: "💰", label: "Finance / Crypto", hint: "Trading signals, analisis" },
    { id: "ai_curation", emoji: "🤖", label: "AI / Tech Curation", hint: "Review tools, tutorial AI" },
  ],
  selling: [
    { id: "marketplace", emoji: "🛒", label: "Marketplace Online", hint: "Shopee, Tokopedia, dll" },
    { id: "dropship", emoji: "📦", label: "Dropship / Reseller", hint: "Tanpa stok, supplier kirim" },
    { id: "affiliate", emoji: "🔗", label: "Affiliate Marketing", hint: "Komisi dari referral" },
    { id: "social_selling", emoji: "📱", label: "Social Commerce", hint: "Jualan via IG, TikTok Shop" },
    { id: "b2b_sales", emoji: "💼", label: "B2B / Corporate Sales", hint: "Jual ke bisnis" },
  ],
  none: [
    { id: "explore_content", emoji: "📱", label: "Coba buat konten", hint: "Mulai dari social media" },
    { id: "explore_freelance", emoji: "🛠️", label: "Coba jadi freelancer", hint: "Jual jasa sederhana" },
    { id: "explore_selling", emoji: "🛒", label: "Coba jualan online", hint: "Resell, dropship, affiliate" },
    { id: "explore_tech", emoji: "💻", label: "Belajar tech / coding", hint: "Masa depan di teknologi" },
    { id: "explore_anything", emoji: "🧭", label: "Apapun yang menghasilkan", hint: "Sistem pilihkan untuk saya" },
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

// Q4 — TARGET
export const Q_TARGET: QuickQuestion = {
  id: "target",
  title: "Apa target kamu dari skill ini?",
  options: [
    { id: "first_income", emoji: "💵", label: "Dapat income pertama", hint: "Belum pernah dapat uang dari ini" },
    { id: "side_income", emoji: "💰", label: "Tambahan income sampingan", hint: "Sudah kerja, mau tambahan" },
    { id: "full_income", emoji: "🏆", label: "Jadikan income utama", hint: "Mau full-time dari ini" },
    { id: "scale", emoji: "📈", label: "Scale / besarkan yang sudah ada", hint: "Sudah jalan, mau grow" },
    { id: "pivot", emoji: "🔄", label: "Pindah arah karir", hint: "Mau ganti bidang" },
  ],
};

// Q5 — WAKTU
export const Q_TIME: QuickQuestion = {
  id: "time",
  title: "Berapa waktu yang bisa kamu dedikasikan per hari?",
  options: [
    { id: "lt1h", emoji: "⏰", label: "Kurang dari 1 jam" },
    { id: "1-2h", emoji: "🕐", label: "1–2 jam" },
    { id: "3-4h", emoji: "🕒", label: "3–4 jam" },
    { id: "gt4h", emoji: "🕕", label: "Lebih dari 4 jam" },
  ],
};

// Q6 — BAHASA KERJA
export const Q_LANGUAGE: QuickQuestion = {
  id: "language",
  title: "Bahasa kerja kamu?",
  subtitle: "Ini menentukan market yang bisa dijangkau.",
  options: [
    { id: "id_only", emoji: "🇮🇩", label: "Indonesia saja", hint: "Market lokal" },
    { id: "id_en_passive", emoji: "📖", label: "Bisa baca Inggris", hint: "Consume English, produce Indo" },
    { id: "id_en_active", emoji: "💬", label: "Bisa kerja dalam Inggris", hint: "Market lokal + global" },
    { id: "en_fluent", emoji: "��", label: "Inggris lancar", hint: "Full akses market global" },
  ],
};

// Q7 — KONDISI SEKARANG
export const Q_STAGE: QuickQuestion = {
  id: "stage",
  title: "Kondisi kamu sekarang?",
  options: [
    { id: "student", emoji: "🎓", label: "Pelajar / Mahasiswa", hint: "Banyak waktu, minim modal" },
    { id: "employee", emoji: "👔", label: "Karyawan", hint: "Stabil, cari sampingan" },
    { id: "freelancer", emoji: "🧑‍💻", label: "Freelancer", hint: "Sudah di game, mau scale" },
    { id: "unemployed", emoji: "🔍", label: "Sedang cari kerja", hint: "Butuh income segera" },
    { id: "entrepreneur", emoji: "🚀", label: "Punya bisnis", hint: "Mau tambah stream" },
    { id: "parent", emoji: "🏠", label: "Dari rumah", hint: "Waktu fleksibel, cari income" },
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
