/**
 * Profiling Configuration v2 — Market-Driven Deep Profiling
 * ============================================================
 * KONSEP: Rule-based + AI hybrid recommendation engine.
 *
 * UPGRADE: 10 pertanyaan (dari 6) — lebih tajam, lebih spesifik.
 *
 * Profiling → Score Mapping → Constraint Engine → Path Scoring → AI Personalization
 *
 * 10 pertanyaan klik cepat. Tidak ada textarea.
 * Setiap jawaban punya weight numerik + metadata tag.
 * Sistem eliminasi path yang tidak realistis SEBELUM AI bekerja.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ProfilingOption {
  label: string;
  value: string;
  score: number;
  /** Tag for AI context — helps AI understand the nuance beyond numeric score */
  tag?: string;
}

export interface ProfilingQuestion {
  id: ProfilingQuestionId;
  number: number;
  title: string;
  subtitle: string;
  options: ProfilingOption[];
}

export type ProfilingQuestionId =
  | "time"
  | "capital"
  | "target_speed"
  | "work_style"
  | "risk"
  | "skill_primary"
  | "skill_secondary"
  | "interest_market"
  | "audience_access"
  | "daily_routine"
  | "preferred_platform";

export interface ProfileScores {
  time: number;               // 1-4
  capital: number;             // 0-3
  target_speed: number;        // 1-4
  work_style: number;          // 1-7
  risk: number;                // 1-4
  skill_primary: number;       // 0-6
  skill_secondary: number;     // 0-5
  interest_market: number;     // 1-10
  audience_access: number;     // 0-4
  daily_routine: number;       // 1-5
  preferred_platform: number;  // 1-6
}

export type SegmentTag =
  | "zero_capital_builder"
  | "low_capital_experimenter"
  | "skill_leverager"
  | "risk_taker"
  | "long_term_builder"
  | "audience_builder"
  | "service_executor";

export type PathId =
  | "micro_service"
  | "niche_content"
  | "freelance_upgrade"
  | "arbitrage_skill"
  | "digital_product"
  | "high_risk_speculative";

export interface ProfileResult {
  scores: ProfileScores;
  segment: SegmentTag;
  primaryPath: PathId;
  alternatePath: PathId | null;
  eliminatedPaths: PathId[];
  pathScores: Record<string, number>;
  /** Raw answer tags for AI context — richer than numeric scores */
  answerTags: Record<string, string>;
}

// ============================================================================
// 10 PROFILING QUESTIONS — Market-Driven Deep Profiling
// ============================================================================

export const PROFILING_QUESTIONS: ProfilingQuestion[] = [
  // ─── Q1: WAKTU ───────────────────────────────────────────────
  {
    id: "time",
    number: 1,
    title: "Berapa waktu luang kamu per hari?",
    subtitle: "Waktu yang BENAR-BENAR bisa kamu dedikasikan tanpa gangguan",
    options: [
      { label: "⏰ < 1 jam (sangat terbatas)", value: "lt1h", score: 1, tag: "micro_time" },
      { label: "🕐 1–2 jam (sebelum/sesudah kerja)", value: "1-2h", score: 2, tag: "limited_time" },
      { label: "🕒 3–4 jam (punya waktu cukup)", value: "3-4h", score: 3, tag: "moderate_time" },
      { label: "🕕 > 4 jam (full dedikasi)", value: "gt4h", score: 4, tag: "full_time" },
    ],
  },

  // ─── Q2: MODAL ───────────────────────────────────────────────
  {
    id: "capital",
    number: 2,
    title: "Berapa modal yang siap kamu keluarkan?",
    subtitle: "Untuk tools, iklan, domain, atau setup awal",
    options: [
      { label: "🚫 $0 — tidak bisa keluar uang sama sekali", value: "zero", score: 0, tag: "zero_capital" },
      { label: "💵 < $50 — bisa langganan 1-2 tool", value: "lt50", score: 1, tag: "micro_capital" },
      { label: "💰 $50–200 — cukup untuk setup & ads kecil", value: "50-200", score: 2, tag: "low_capital" },
      { label: "🏦 $200–500 — bisa investasi tools & ads", value: "200-500", score: 3, tag: "medium_capital" },
    ],
  },

  // ─── Q3: TARGET KECEPATAN (expanded → 4 opsi) ────────────────
  {
    id: "target_speed",
    number: 3,
    title: "Seberapa cepat kamu butuh income pertama?",
    subtitle: "Ini menentukan apakah kamu masuk jalur cepat atau jalur asset",
    options: [
      { label: "⚡ Dalam 7 hari — butuh cepat banget", value: "7d", score: 1, tag: "ultra_fast" },
      { label: "📅 Dalam 2 minggu — realistis cepat", value: "2w", score: 2, tag: "fast" },
      { label: "🗓️ Dalam 1 bulan — wajar, build dulu", value: "1mo", score: 3, tag: "moderate_speed" },
      { label: "🌱 1–3 bulan — bangun fondasi, income nanti", value: "1-3mo", score: 4, tag: "patient_builder" },
    ],
  },

  // ─── Q4: GAYA KERJA (expanded → 7 opsi spesifik) ────────────
  {
    id: "work_style",
    number: 4,
    title: "Gaya kerja apa yang paling cocok dengan kamu?",
    subtitle: "Pilih yang paling menggambarkan cara kamu bekerja",
    options: [
      { label: "🎥 Tampil di depan kamera & bicara", value: "video_face", score: 1, tag: "video_personality" },
      { label: "🎬 Editing video tanpa tampil muka", value: "video_edit", score: 2, tag: "video_behind" },
      { label: "✍️ Menulis panjang & mendalam (artikel/blog)", value: "longform_write", score: 3, tag: "deep_writer" },
      { label: "📱 Bikin konten pendek & catchy (reels/shorts)", value: "shortform", score: 4, tag: "short_content" },
      { label: "📊 Riset, analisa data & strategi", value: "research", score: 5, tag: "analyst" },
      { label: "🤝 Komunikasi & negosiasi dengan orang", value: "people", score: 6, tag: "communicator" },
      { label: "🔧 Kerja sendiri, diam-diam, behind the scene", value: "silent_build", score: 7, tag: "silent_builder" },
    ],
  },

  // ─── Q5: RISIKO (expanded → 4 opsi) ──────────────────────────
  {
    id: "risk",
    number: 5,
    title: "Seberapa besar risiko yang siap kamu tanggung?",
    subtitle: "Kalau hasilnya tidak sesuai harapan dalam 30 hari",
    options: [
      { label: "🛡️ Sangat rendah — hanya yang 100% aman", value: "very_low", score: 1, tag: "ultra_safe" },
      { label: "⚖️ Rendah — mau yang proven, sedikit eksperimen", value: "low", score: 2, tag: "risk_averse" },
      { label: "🎯 Sedang — siap eksperimen terukur, bisa gagal", value: "medium", score: 3, tag: "calculated_risk" },
      { label: "🔥 Tinggi — gagal cepat, pivot cepat, go big", value: "high", score: 4, tag: "high_risk_taker" },
    ],
  },

  // ─── Q6: SKILL UTAMA (expanded → 7 opsi) ────────────────────
  {
    id: "skill_primary",
    number: 6,
    title: "Skill utama apa yang sudah kamu punya?",
    subtitle: "Pilih yang paling kuat — ini menentukan jalur tercepat kamu",
    options: [
      { label: "🆕 Belum ada skill khusus", value: "none", score: 0, tag: "beginner" },
      { label: "✍️ Writing / copywriting", value: "writing", score: 1, tag: "writer" },
      { label: "🎨 Design / visual editing", value: "design", score: 2, tag: "designer" },
      { label: "📈 Marketing / ads / funnel", value: "marketing", score: 3, tag: "marketer" },
      { label: "💻 Programming / tech / automation", value: "tech", score: 4, tag: "techie" },
      { label: "🎥 Video editing / produksi konten", value: "video_prod", score: 5, tag: "video_producer" },
      { label: "🗣️ Sales / komunikasi / public speaking", value: "sales", score: 6, tag: "salesperson" },
    ],
  },

  // ─── Q7: SKILL PENDUKUNG (NEW) ──────────────────────────────
  {
    id: "skill_secondary",
    number: 7,
    title: "Skill tambahan apa yang bisa mendukung?",
    subtitle: "Yang sudah pernah kamu lakukan walaupun belum mahir",
    options: [
      { label: "❌ Tidak ada skill tambahan", value: "none", score: 0, tag: "single_skill" },
      { label: "📝 Bisa menulis basic content", value: "basic_write", score: 1, tag: "can_write" },
      { label: "📸 Bisa edit foto / canva / visual dasar", value: "basic_design", score: 2, tag: "can_design" },
      { label: "📊 Bisa spreadsheet / data entry sederhana", value: "basic_data", score: 3, tag: "can_data" },
      { label: "🌐 Paham social media & cara kerja algoritma", value: "social_media", score: 4, tag: "social_savvy" },
      { label: "💬 Bisa bahasa Inggris aktif (baca/tulis)", value: "english", score: 5, tag: "english_capable" },
    ],
  },

  // ─── Q8: AREA MARKET YANG DIMINATI (NEW — KRUSIAL) ──────────
  {
    id: "interest_market",
    number: 8,
    title: "Area market mana yang paling menarik buatmu?",
    subtitle: "Ini menentukan niche dan target audience yang akan kamu garap",
    options: [
      { label: "🏋️ Health, fitness & wellness", value: "health", score: 1, tag: "health_market" },
      { label: "💼 Business & entrepreneurship", value: "business", score: 2, tag: "business_market" },
      { label: "📚 Education & online learning", value: "education", score: 3, tag: "education_market" },
      { label: "💰 Personal finance & investing", value: "finance", score: 4, tag: "finance_market" },
      { label: "👨‍👩‍👧 Parenting & family", value: "parenting", score: 5, tag: "parenting_market" },
      { label: "🎮 Gaming & entertainment", value: "gaming", score: 6, tag: "gaming_market" },
      { label: "🛍️ E-commerce & produk fisik", value: "ecommerce", score: 7, tag: "ecommerce_market" },
      { label: "🏠 Real estate & properti", value: "realestate", score: 8, tag: "realestate_market" },
      { label: "🎨 Creative arts & design", value: "creative", score: 9, tag: "creative_market" },
      { label: "💻 Tech, SaaS & software", value: "tech", score: 10, tag: "tech_market" },
    ],
  },

  // ─── Q9: AKSES KE AUDIENCE (expanded → 5 opsi) ───────────────
  {
    id: "audience_access",
    number: 9,
    title: "Apakah kamu sudah punya audience atau network?",
    subtitle: "Ini menentukan strategi: build audience dulu atau langsung eksekusi",
    options: [
      { label: "🚫 Nol — tidak ada follower / kontak bisnis", value: "zero", score: 0, tag: "no_audience" },
      { label: "🌱 Baru mulai — < 200 follower, belum engage", value: "micro", score: 1, tag: "micro_audience" },
      { label: "📱 Kecil — 200-1K follower, mulai ada interaksi", value: "small", score: 2, tag: "small_audience" },
      { label: "👥 Sedang — 1K-5K follower / email list kecil", value: "medium", score: 3, tag: "medium_audience" },
      { label: "🌟 Besar — > 5K follower / network profesional aktif", value: "large", score: 4, tag: "large_audience" },
    ],
  },

  // ─── Q10: WAKTU KERJA TERBAIK (expanded → 5 opsi) ───────────
  {
    id: "daily_routine",
    number: 10,
    title: "Kapan waktu terbaik kamu untuk fokus kerja?",
    subtitle: "Ini mempengaruhi jenis task dan platform yang optimal",
    options: [
      { label: "🌅 Pagi hari (5-8 AM) — sebelum semua orang bangun", value: "early_morning", score: 1, tag: "early_bird" },
      { label: "☀️ Pagi-siang (9 AM-12 PM) — di awal hari kerja", value: "morning", score: 2, tag: "morning_worker" },
      { label: "🌤️ Siang-sore (12-5 PM) — di sela waktu luang", value: "afternoon", score: 3, tag: "afternoon_worker" },
      { label: "🌙 Malam hari (8 PM-12 AM) — setelah semua selesai", value: "evening", score: 4, tag: "evening_worker" },
      { label: "🎲 Tidak tentu — jadwal berubah-ubah tiap hari", value: "flexible", score: 5, tag: "flexible_schedule" },
    ],
  },

  // ─── Q11: PLATFORM PREFERENSI (NEW — PENTING UNTUK SUB-PATH) ──
  {
    id: "preferred_platform",
    number: 11,
    title: "Platform mana yang paling nyaman buat kamu?",
    subtitle: "Pilih yang sudah kamu pakai atau paling familiar",
    options: [
      { label: "📱 TikTok / Instagram Reels — short video", value: "tiktok_reels", score: 1, tag: "short_video_platform" },
      { label: "▶️ YouTube — long/short form video", value: "youtube", score: 2, tag: "youtube_platform" },
      { label: "🐦 Twitter/X — thread & microblog", value: "twitter", score: 3, tag: "twitter_platform" },
      { label: "💼 LinkedIn — profesional & B2B", value: "linkedin", score: 4, tag: "linkedin_platform" },
      { label: "🛒 Marketplace (Fiverr/Upwork/Tokopedia)", value: "marketplace", score: 5, tag: "marketplace_platform" },
      { label: "🌐 Website/Blog/Newsletter sendiri", value: "own_website", score: 6, tag: "own_platform" },
    ],
  },
];

// ============================================================================
// PATH REQUIREMENT MATRIX (Constraint Engine)
// ============================================================================

interface PathRequirements {
  pathId: PathId;
  minTime: number;
  minCapital: number;
  minRisk: number;
  minSkillPrimary: number;
}

const PATH_REQUIREMENTS: PathRequirements[] = [
  { pathId: "micro_service",         minTime: 1, minCapital: 0, minRisk: 1, minSkillPrimary: 0 },
  { pathId: "niche_content",         minTime: 2, minCapital: 0, minRisk: 1, minSkillPrimary: 0 },
  { pathId: "freelance_upgrade",     minTime: 2, minCapital: 0, minRisk: 1, minSkillPrimary: 2 },
  { pathId: "arbitrage_skill",       minTime: 2, minCapital: 1, minRisk: 2, minSkillPrimary: 0 },
  { pathId: "digital_product",       minTime: 3, minCapital: 1, minRisk: 2, minSkillPrimary: 1 },
  { pathId: "high_risk_speculative", minTime: 2, minCapital: 2, minRisk: 3, minSkillPrimary: 1 },
];

// ============================================================================
// PATH SCORING WEIGHTS (v2 — includes work_style & market bonuses)
// ============================================================================

interface PathWeights {
  pathId: PathId;
  wTime: number;
  wCapital: number;
  wRisk: number;
  wSkillPrimary: number;
  wSkillSecondary: number;
  wAudience: number;
  /** work_style score values that give bonus for this path */
  workStyleBonus: number[];
  /** Market interest values that align with this path */
  marketBonus: string[];
  /** Platform values that align with this path */
  platformBonus: string[];
}

const PATH_WEIGHTS: PathWeights[] = [
  {
    pathId: "micro_service",
    wTime: 0.15, wCapital: 0.05, wRisk: 0.15, wSkillPrimary: 0.35, wSkillSecondary: 0.15, wAudience: 0.05,
    workStyleBonus: [7, 5, 6],       // silent_build, research, people
    marketBonus: ["business", "tech", "ecommerce"],
    platformBonus: ["marketplace", "linkedin"],
  },
  {
    pathId: "niche_content",
    wTime: 0.2, wCapital: 0.05, wRisk: 0.1, wSkillPrimary: 0.25, wSkillSecondary: 0.15, wAudience: 0.15,
    workStyleBonus: [1, 2, 3, 4],    // video_face, video_edit, longform_write, shortform
    marketBonus: ["health", "parenting", "finance", "education", "gaming"],
    platformBonus: ["tiktok_reels", "youtube", "own_website"],
  },
  {
    pathId: "freelance_upgrade",
    wTime: 0.15, wCapital: 0.05, wRisk: 0.1, wSkillPrimary: 0.4, wSkillSecondary: 0.15, wAudience: 0.1,
    workStyleBonus: [3, 7, 5],       // longform_write, silent_build, research
    marketBonus: ["business", "tech", "creative"],
    platformBonus: ["marketplace", "linkedin", "own_website"],
  },
  {
    pathId: "arbitrage_skill",
    wTime: 0.2, wCapital: 0.15, wRisk: 0.2, wSkillPrimary: 0.1, wSkillSecondary: 0.1, wAudience: 0.15,
    workStyleBonus: [6, 4],          // people, shortform
    marketBonus: ["ecommerce", "business", "realestate"],
    platformBonus: ["marketplace", "tiktok_reels", "twitter"],
  },
  {
    pathId: "digital_product",
    wTime: 0.2, wCapital: 0.1, wRisk: 0.1, wSkillPrimary: 0.25, wSkillSecondary: 0.15, wAudience: 0.15,
    workStyleBonus: [3, 7, 5],       // longform_write, silent_build, research
    marketBonus: ["education", "business", "finance", "tech", "creative"],
    platformBonus: ["own_website", "youtube", "twitter"],
  },
  {
    pathId: "high_risk_speculative",
    wTime: 0.15, wCapital: 0.2, wRisk: 0.25, wSkillPrimary: 0.15, wSkillSecondary: 0.1, wAudience: 0.05,
    workStyleBonus: [5, 4, 6],       // research, shortform, people
    marketBonus: ["finance", "tech", "ecommerce", "gaming"],
    platformBonus: ["twitter", "youtube", "tiktok_reels"],
  },
];

// ============================================================================
// SCORING ENGINE
// ============================================================================

/**
 * Convert raw profiling answers to numeric scores
 */
export function answersToScores(
  answers: Record<ProfilingQuestionId, string>
): ProfileScores {
  const scores: ProfileScores = {
    time: 1,
    capital: 0,
    target_speed: 1,
    work_style: 1,
    risk: 1,
    skill_primary: 0,
    skill_secondary: 0,
    interest_market: 1,
    audience_access: 0,
    daily_routine: 1,
    preferred_platform: 1,
  };

  for (const q of PROFILING_QUESTIONS) {
    const answer = answers[q.id];
    if (answer) {
      const opt = q.options.find((o) => o.value === answer);
      if (opt) {
        scores[q.id] = opt.score;
      }
    }
  }

  return scores;
}

/**
 * Extract answer tags for AI context (richer than numeric scores)
 */
export function extractAnswerTags(
  answers: Record<ProfilingQuestionId, string>
): Record<string, string> {
  const tags: Record<string, string> = {};

  for (const q of PROFILING_QUESTIONS) {
    const answer = answers[q.id];
    if (answer) {
      const opt = q.options.find((o) => o.value === answer);
      if (opt) {
        tags[q.id] = opt.tag || opt.value;
        tags[`${q.id}_label`] = opt.label.replace(/^[^\s]+\s/, ""); // strip emoji prefix
      }
    }
  }

  return tags;
}

/**
 * Classify user into internal segment based on scores (v2)
 * Now with wider distribution across all 7 segments
 */
export function classifySegment(scores: ProfileScores): SegmentTag {
  // Priority-based classification with broader thresholds
  if (scores.risk >= 3 && scores.capital >= 2) return "risk_taker";
  if (scores.audience_access >= 3) return "audience_builder";
  if (scores.skill_primary >= 3 && scores.time >= 3) return "service_executor";
  if (scores.skill_primary >= 2 && scores.capital <= 1) return "skill_leverager";
  if (scores.time >= 3 && scores.risk <= 2) return "long_term_builder";
  if (scores.capital <= 1 && scores.risk <= 2) return "low_capital_experimenter";
  if (scores.capital === 0) return "zero_capital_builder";
  return "long_term_builder";
}

/**
 * Constraint Engine — eliminate paths user doesn't qualify for
 */
export function eliminatePaths(scores: ProfileScores): PathId[] {
  const eliminated: PathId[] = [];

  for (const req of PATH_REQUIREMENTS) {
    if (
      scores.time < req.minTime ||
      scores.capital < req.minCapital ||
      scores.risk < req.minRisk ||
      scores.skill_primary < req.minSkillPrimary
    ) {
      eliminated.push(req.pathId);
    }
  }

  return eliminated;
}

/**
 * Score remaining paths (v2 — with work_style & market bonuses)
 */
export function scorePaths(
  scores: ProfileScores,
  eliminated: PathId[],
  answers: Record<ProfilingQuestionId, string>
): Array<{ pathId: PathId; score: number }> {
  const results: Array<{ pathId: PathId; score: number }> = [];

  for (const pw of PATH_WEIGHTS) {
    if (eliminated.includes(pw.pathId)) continue;

    // Base score from weighted dimensions
    let score =
      pw.wTime * scores.time +
      pw.wCapital * scores.capital +
      pw.wRisk * scores.risk +
      pw.wSkillPrimary * scores.skill_primary +
      pw.wSkillSecondary * scores.skill_secondary +
      pw.wAudience * scores.audience_access;

    // Work style bonus: +0.8 if user's style matches path DNA
    if (pw.workStyleBonus.includes(scores.work_style)) {
      score += 0.8;
    }

    // Market interest bonus: +0.6 if user's interest aligns with path
    const marketAnswer = answers.interest_market;
    if (marketAnswer && pw.marketBonus.includes(marketAnswer)) {
      score += 0.6;
    }

    // Platform bonus: +0.5 if user's preferred platform aligns
    const platformAnswer = answers.preferred_platform;
    if (platformAnswer && pw.platformBonus.includes(platformAnswer)) {
      score += 0.5;
    }

    // Speed-path alignment penalties (updated for 4-point scale)
    if (scores.target_speed >= 4 && (pw.pathId === "micro_service" || pw.pathId === "arbitrage_skill")) {
      score -= 0.3; // Patient builders don't need fast-cash paths
    }
    if (scores.target_speed === 1 && (pw.pathId === "digital_product" || pw.pathId === "niche_content")) {
      score -= 0.4; // Ultra-fast seekers can't wait for asset building
    }

    results.push({ pathId: pw.pathId, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Full profiling pipeline:
 * Answers → Scores → Segment → Eliminate → Rank → Pick top 2
 */
export function runProfilingEngine(
  answers: Record<ProfilingQuestionId, string>
): ProfileResult {
  const scores = answersToScores(answers);
  const segment = classifySegment(scores);
  const eliminated = eliminatePaths(scores);
  const ranked = scorePaths(scores, eliminated, answers);
  const answerTags = extractAnswerTags(answers);

  const pathScoresMap: Record<string, number> = {};
  ranked.forEach((r) => {
    pathScoresMap[r.pathId] = r.score;
  });

  return {
    scores,
    segment,
    primaryPath: ranked[0]?.pathId || "micro_service",
    alternatePath: ranked[1]?.pathId || null,
    eliminatedPaths: eliminated,
    pathScores: pathScoresMap,
    answerTags,
  };
}

/**
 * Get total number of profiling questions
 */
export function getTotalQuestions(): number {
  return PROFILING_QUESTIONS.length;
}
