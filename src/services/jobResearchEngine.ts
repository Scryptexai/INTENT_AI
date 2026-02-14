/**
 * Job Research Engine — Layer 2: Data-Driven Job Matching
 * =========================================================
 * BUKAN rekomendasi generik. Ini sistem riset yang:
 * 1. Menganalisis profil user secara mendalam (dari Layer 1)
 * 2. FETCH DATA REAL dari internet (Google Trends, YouTube, TikTok, Google Search)
 * 3. Mencocokan dengan job/opportunity yang TEPAT berdasarkan data REAL
 * 4. Memberikan alasan berbasis evidence: trend, success rate, competitor analysis
 * 5. Setiap rekomendasi UNIK — tidak ada yang sama antar user
 *
 * Architecture:
 *   Deep Profile + Context → REAL API Data → AI Research Prompt → Structured Job Match
 *   Setiap output harus: presisi, data-backed dari internet, actionable
 *
 * APIs Used:
 *   - SerpAPI → Google Trends (search interest, rising queries)
 *   - YouTube Data API v3 → Video count, avg views, competition density
 *   - RapidAPI → TikTok engagement, IG market signal
 *   - Google Custom Search → Real job listings, salary data, market articles
 *
 * Trust dibangun di layer ini — karena data REAL, bukan halusinasi AI.
 */

import type { ContextScores, DeepProfileScores, EconomicModelId } from "@/utils/branchingProfileConfig";
import type { ProfileScores, PathId } from "@/utils/profilingConfig";

// ============================================================================
// TYPES
// ============================================================================

export interface JobRecommendation {
  /** Job/opportunity title — sangat spesifik */
  title: string;
  /** Kenapa job ini cocok untuk USER INI */
  whyThisJob: string;
  /** Data point: berdasarkan apa rekomendasi ini */
  evidence: string;
  /** Estimasi income range realistis per bulan */
  incomeRange: string;
  /** Demand level di market saat ini */
  demandLevel: "tinggi" | "sedang" | "rendah" | "niche_tapi_menguntungkan";
  /** Waktu yang dibutuhkan untuk income pertama */
  timeToFirstIncome: string;
  /** Tools yang dibutuhkan */
  requiredTools: string[];
  /** Platform terbaik untuk mulai */
  bestPlatform: string;
  /** Langkah pertama yang SANGAT spesifik */
  firstStep: string;
  /** Contoh nyata: orang lain yang sukses di job ini */
  successExample: string;
  /** Risiko dan mitigasinya */
  riskMitigation: string;
  /** Skill gap yang perlu diisi */
  skillGap: string;
  /** Competitive advantage user */
  competitiveAdvantage: string;
}

export interface JobResearchResult {
  /** Rekomendasi utama — paling cocok */
  primaryJob: JobRecommendation;
  /** Alternatif 1 */
  secondaryJob: JobRecommendation;
  /** Alternatif 2 — lebih experimental */
  exploratoryJob: JobRecommendation;
  /** Ringkasan analisis profil → job matching */
  profileAnalysis: string;
  /** Trend keywords yang relevan */
  trendKeywords: string[];
  /** Market context — situasi pasar saat ini */
  marketContext: string;
  /** Timestamp */
  generatedAt: string;
}

// ============================================================================
// AI CONFIG
// ============================================================================

const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || "";
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "https://api.z.ai/api/anthropic/v1";
const SERPAPI_KEY = import.meta.env.VITE_SERPAPI_KEY || "";
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || "";
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || "";
const GOOGLE_CSE_KEY = import.meta.env.VITE_GOOGLE_CSE_API_KEY || "";
const GOOGLE_CSE_CX = import.meta.env.VITE_GOOGLE_CSE_CX || "";

// ============================================================================
// REAL MARKET DATA TYPES — Data fetched from internet APIs
// ============================================================================

interface RealMarketIntel {
  // Google Trends
  googleTrendsInterest: number; // 0-100
  googleTrendDirection: "rising" | "stable" | "declining";
  risingQueries: string[];
  relatedTopics: string[];

  // YouTube
  youtubeVideoCount: number;
  youtubeAvgViews: number;
  youtubeTopChannels: string[];
  youtubeCompetitionLevel: string;

  // TikTok
  tiktokAvgViews: number;
  tiktokEngagementRate: string;
  tiktokSignal: string;

  // Instagram
  instagramSignal: string;

  // Google Search — real articles, job listings
  googleSearchResults: string[];
  jobListingSnippets: string[];
  salaryDataSnippets: string[];

  // Meta
  fetchedAt: string;
  dataQuality: "high" | "medium" | "low";
}

// ============================================================================
// LABEL DECODERS
// ============================================================================

const DIGITAL_EXPERIENCE_LABELS: Record<string, string> = {
  never: "Belum pernah kerja digital sama sekali",
  tried_failed: "Pernah coba digital tapi gagal/berhenti",
  side_project: "Pernah digital sebagai sampingan",
  working_digital: "Sekarang sudah kerja di bidang digital",
  experienced: "Berpengalaman & punya portfolio digital",
};

const CURRENT_STAGE_LABELS: Record<string, string> = {
  student: "Pelajar/Mahasiswa — banyak waktu, minim pengalaman",
  employee: "Karyawan — waktu terbatas, butuh side income",
  freelancer: "Freelancer aktif — mau scale/diversifikasi",
  unemployed: "Sedang tidak bekerja — butuh income ASAP",
  entrepreneur: "Pengusaha — mau tambah revenue stream digital",
  stay_home: "WFH/Ibu rumah tangga — cari income dari rumah",
};

const LANGUAGE_LABELS: Record<string, string> = {
  none: "Bahasa Indonesia only — market lokal",
  passive: "English pasif — bisa baca tapi tidak bisa produce",
  moderate: "English cukup — bisa komunikasi dasar dengan client global",
  fluent: "English fluent — bisa akses market global (Fiverr, Upwork, Medium)",
};

const TOOLS_LABELS: Record<string, string> = {
  none: "Belum familiar dengan tools profesional",
  basic: "Tools dasar (Canva, Google Docs, Notion)",
  intermediate: "Tools menengah (Figma, Premiere, WordPress, Mailchimp)",
  advanced: "Advanced (coding, API, automation, Git)",
};

const COMMITMENT_LABELS: Record<string, string> = {
  "1_week": "Komitmen 1 minggu — testing phase",
  "2_weeks": "Komitmen 2 minggu — serius tapi belum total",
  "1_month": "Komitmen 1 bulan penuh — dedicated",
  "3_months": "Komitmen 3 bulan+ — long-term builder",
};

const INCOME_TARGET_LABELS: Record<string, string> = {
  lt500k: "< Rp 500.000/bulan — uang jajan",
  "500k-2m": "Rp 500K–2 juta/bulan — lumayan sampingan",
  "2m-5m": "Rp 2–5 juta/bulan — setara part-time job",
  "5m-15m": "Rp 5–15 juta/bulan — income utama",
  gt15m: "> Rp 15 juta/bulan — full-time income",
};

const CHALLENGE_LABELS: Record<string, string> = {
  no_direction: "Tidak tahu harus mulai dari mana",
  no_skill: "Merasa belum punya skill yang bisa dijual",
  no_time: "Waktu sangat terbatas",
  no_confidence: "Kurang percaya diri / takut gagal",
  tried_failed: "Sudah coba tapi selalu gagal — butuh pendekatan baru",
};

const LEARNING_LABELS: Record<string, string> = {
  video: "Belajar lewat video tutorial",
  reading: "Belajar lewat baca artikel/dokumentasi",
  practice: "Belajar langsung praktek & trial error",
};

const MODEL_LABELS: Record<string, string> = {
  audience_based: "Bangun audience → monetisasi lewat konten",
  skill_service: "Jual skill/jasa langsung ke client",
  digital_product: "Buat & jual produk digital",
  commerce_arbitrage: "Jual produk/arbitrase online",
  data_research: "Riset & analisis data sebagai jasa/produk",
  automation_builder: "Bangun sistem otomasi untuk client",
};

const SKILL_LEVEL_LABELS: Record<string, string> = {
  beginner: "Pemula total",
  basic: "Tahu dasar — pernah coba",
  intermediate: "Intermediate — bisa eksekusi sendiri",
  advanced: "Advanced — sudah mahir",
  expert: "Expert — sudah punya portfolio",
};

const RISK_LABELS: Record<string, string> = {
  very_low: "Risiko sangat rendah — hanya yang proven",
  low: "Risiko rendah — proven dengan sedikit eksperimen",
  medium: "Risiko sedang — siap eksperimen terukur",
  high: "Risiko tinggi — gagal cepat pivot cepat",
};

// ============================================================================
// MAIN ENGINE: Generate Job Research — NOW WITH REAL DATA
// ============================================================================

export async function generateJobResearch(
  economicModel: EconomicModelId,
  subSector: string,
  niche: string,
  platform: string,
  contextScores: ContextScores,
  deepProfile: Record<string, string>,
  sectorAnswers: Record<string, string>
): Promise<JobResearchResult | null> {
  if (!AI_API_KEY) return null;

  // ── STEP 1: Fetch REAL market data from internet APIs ──
  console.log("[JobResearch] Fetching real market data from APIs...");
  const marketIntel = await fetchAllMarketIntel(niche, subSector, platform, economicModel);
  console.log("[JobResearch] Market intel fetched:", {
    trends: marketIntel.googleTrendsInterest,
    youtube: marketIntel.youtubeVideoCount,
    tiktok: marketIntel.tiktokSignal ? "yes" : "no",
    searchResults: marketIntel.googleSearchResults.length,
    quality: marketIntel.dataQuality,
  });

  // ── STEP 2: Build AI prompt WITH real data injected ──
  const prompt = buildJobResearchPrompt(
    economicModel, subSector, niche, platform,
    contextScores, deepProfile, sectorAnswers, marketIntel
  );

  // ── STEP 3: Call AI with real data context ──
  try {
    const response = await fetch(`${AI_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": AI_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        system: JOB_RESEARCH_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);

    const data = await response.json();
    const rawOutput = data.content?.[0]?.text || "";

    const jsonStr = rawOutput
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(jsonStr) as JobResearchResult;
    parsed.generatedAt = new Date().toISOString();
    return parsed;
  } catch (err) {
    console.error("[JobResearchEngine] Failed:", err);
    return null;
  }
}

// ============================================================================
// SYSTEM PROMPT — The brain of Layer 2
// ============================================================================

const JOB_RESEARCH_SYSTEM_PROMPT = `Kamu adalah Job Research Analyst untuk platform IntentAI. Tugas kamu BUKAN memberikan saran generik — tapi melakukan RISET MENDALAM dan memberikan rekomendasi job/opportunity yang PRESISI berdasarkan profil user DAN DATA MARKET REAL yang sudah di-fetch dari internet.

ATURAN FUNDAMENTAL:
1. SETIAP rekomendasi HARUS spesifik dan berbeda — tidak boleh template/generic
2. GUNAKAN DATA REAL yang diberikan (Google Trends, YouTube stats, TikTok engagement, Google Search results) — WAJIB reference data ini dalam evidence
3. Sebutkan ANGKA NYATA dari data yang diberikan: search interest score, video count, avg views, rising queries
4. Income estimate HARUS realistis berdasarkan: skill level, experience, market rate dari data real
5. JANGAN rekomendasikan sesuatu yang tidak cocok dengan KONDISI user (waktu, modal, skill, bahasa)
6. Setiap output harus UNIK — berdasarkan kombinasi profil user + data market yang berbeda
7. Jika ada job listing snippets dari Google Search, gunakan untuk income estimate dan demand validation

PRINSIP:
- Trust dibangun dari DATA REAL + PRESISI, bukan dari janji
- Setiap claim HARUS di-back oleh data yang disediakan
- Jika data menunjukkan trend declining, JUJUR bilang dan sarankan pivot
- Jika data menunjukkan niche terlalu crowded, bilang jujur dan cari angle
- Bahasa Indonesia natural, tanpa buzzword kosong

FORMAT OUTPUT: JSON sesuai schema yang diminta. Langsung output JSON, tanpa wrapper markdown.`;

// ============================================================================
// PROMPT BUILDER — Constructs rich research prompt from all profile data
// ============================================================================

function buildJobResearchPrompt(
  economicModel: EconomicModelId,
  subSector: string,
  niche: string,
  platform: string,
  ctx: ContextScores,
  deepProfile: Record<string, string>,
  sectorAnswers: Record<string, string>,
  market: RealMarketIntel
): string {
  const timeLabels = ["", "< 1 jam/hari", "1-2 jam/hari", "3-4 jam/hari", "> 4 jam/hari"];
  const capitalLabels = ["$0 — tanpa modal", "< $50", "$50-200", "$200-500"];
  const audienceLabels = ["Nol audience", "< 200 follower", "200-1K follower", "1K-5K follower", "> 5K follower"];

  const sections: string[] = [];

  // Section 1: Pilihan model ekonomi
  sections.push(`== PILIHAN USER ==
Model Ekonomi: ${MODEL_LABELS[economicModel] || economicModel}
Sub-Sektor: ${subSector}
Niche Pilihan: ${niche}
Platform Utama: ${platform}`);

  // Section 2: Kondisi dasar
  sections.push(`== KONDISI DASAR ==
Waktu tersedia: ${timeLabels[ctx.time] || 'unknown'}
Modal yang siap dikeluarkan: ${capitalLabels[ctx.capital] || 'unknown'}
Skill level di bidang ini: ${SKILL_LEVEL_LABELS[deepProfile.skill_level || ''] || `level ${ctx.skillLevel}`}
Toleransi risiko: ${RISK_LABELS[deepProfile.risk || ''] || `level ${ctx.risk}`}
Audience saat ini: ${audienceLabels[ctx.audience] || 'unknown'}`);

  // Section 3: Deep profile (Layer 1 enrichment)
  sections.push(`== PROFIL MENDALAM (Layer 1) ==
Pengalaman digital: ${DIGITAL_EXPERIENCE_LABELS[deepProfile.digital_experience] || 'unknown'}
Status sekarang: ${CURRENT_STAGE_LABELS[deepProfile.current_stage] || 'unknown'}
Kemampuan bahasa Inggris: ${LANGUAGE_LABELS[deepProfile.language_skill] || 'unknown'}
Tools yang dikuasai: ${TOOLS_LABELS[deepProfile.tools_familiarity] || 'unknown'}
Komitmen waktu: ${COMMITMENT_LABELS[deepProfile.weekly_commitment] || 'unknown'}
Target income: ${INCOME_TARGET_LABELS[deepProfile.income_target] || 'unknown'}
Cara belajar: ${LEARNING_LABELS[deepProfile.learning_style] || 'unknown'}
Hambatan terbesar: ${CHALLENGE_LABELS[deepProfile.biggest_challenge] || 'unknown'}`);

  // Section 4: Sector-specific answers
  if (Object.keys(sectorAnswers).length > 0) {
    const sectorLines = Object.entries(sectorAnswers)
      .map(([key, val]) => `  ${key}: ${val}`)
      .join("\n");
    sections.push(`== JAWABAN SEKTOR-SPESIFIK ==\n${sectorLines}`);
  }

  // Section 5: Research keywords derived from profile
  const keywords = deriveResearchKeywords(economicModel, subSector, niche, platform, deepProfile);
  sections.push(`== KATA KUNCI RISET (untuk search) ==\n${keywords.join(", ")}`);

  // Section 6: Constraints
  const constraints: string[] = [];
  if (ctx.capital === 0) constraints.push("ZERO MODAL — hanya tools gratis / free tier");
  if (ctx.time <= 1) constraints.push("WAKTU SANGAT TERBATAS — max 1 jam/hari, task harus micro");
  if (deepProfile.language_skill === "none") constraints.push("BAHASA INDONESIA ONLY — tidak bisa akses market global, fokus lokal");
  if (deepProfile.language_skill === "fluent") constraints.push("ENGLISH FLUENT — bisa akses market global (Fiverr, Upwork, Medium, dll)");
  if (deepProfile.current_stage === "unemployed") constraints.push("BUTUH INCOME ASAP — prioritaskan job yang bisa menghasilkan cepat");
  if (deepProfile.current_stage === "student") constraints.push("PELAJAR — banyak waktu, minim experience, prioritaskan skill building + quick wins");
  if (deepProfile.digital_experience === "never") constraints.push("ZERO PENGALAMAN DIGITAL — butuh guidance step-by-step dari nol");
  if (deepProfile.digital_experience === "experienced") constraints.push("BERPENGALAMAN — langsung ke level intermediate/advanced");
  if (deepProfile.biggest_challenge === "no_confidence") constraints.push("CONFIDENCE ISSUE — rekomendasi harus mulai dari low-stakes, build confidence dulu");
  if (deepProfile.biggest_challenge === "tried_failed") constraints.push("PERNAH GAGAL — butuh pendekatan yang BERBEDA dari yang sudah pernah dicoba");
  if (deepProfile.tools_familiarity === "advanced") constraints.push("TECH SAVVY — bisa leverage automation, API, coding untuk competitive advantage");

  if (constraints.length > 0) {
    sections.push(`== CONSTRAINTS PENTING ==\n${constraints.join("\n")}`);
  }

  // Section 7: REAL MARKET DATA dari internet (bukan halusinasi)
  const marketLines: string[] = [];
  marketLines.push(`== DATA MARKET REAL (dari internet — bukan perkiraan) ==`);
  marketLines.push(`Waktu fetch: ${market.fetchedAt}`);
  marketLines.push(`Kualitas data: ${market.dataQuality}`);
  marketLines.push(``);

  // Google Trends
  marketLines.push(`--- GOOGLE TRENDS (SerpAPI) ---`);
  marketLines.push(`Search interest score: ${market.googleTrendsInterest}/100`);
  marketLines.push(`Trend direction: ${market.googleTrendDirection.toUpperCase()}`);
  if (market.risingQueries.length > 0) {
    marketLines.push(`Rising queries: ${market.risingQueries.join(", ")}`);
  }
  if (market.relatedTopics.length > 0) {
    marketLines.push(`Related topics: ${market.relatedTopics.join(", ")}`);
  }

  // YouTube
  marketLines.push(``);
  marketLines.push(`--- YOUTUBE DATA (API v3) ---`);
  marketLines.push(`Total video count for keyword: ${market.youtubeVideoCount.toLocaleString()}`);
  marketLines.push(`Average views top 10 video: ${market.youtubeAvgViews.toLocaleString()}`);
  marketLines.push(`Competition level: ${market.youtubeCompetitionLevel}`);
  if (market.youtubeTopChannels.length > 0) {
    marketLines.push(`Top channels: ${market.youtubeTopChannels.join(", ")}`);
  }

  // TikTok
  if (market.tiktokSignal) {
    marketLines.push(``);
    marketLines.push(`--- TIKTOK (RapidAPI) ---`);
    marketLines.push(`${market.tiktokSignal}`);
    if (market.tiktokAvgViews > 0) marketLines.push(`Average views: ${market.tiktokAvgViews.toLocaleString()}`);
    if (market.tiktokEngagementRate !== "0") marketLines.push(`Engagement rate: ${market.tiktokEngagementRate}%`);
  }

  // Instagram
  if (market.instagramSignal) {
    marketLines.push(``);
    marketLines.push(`--- INSTAGRAM (RapidAPI) ---`);
    marketLines.push(`${market.instagramSignal}`);
  }

  // Google Search — job listings & salary
  if (market.googleSearchResults.length > 0) {
    marketLines.push(``);
    marketLines.push(`--- GOOGLE SEARCH RESULTS (real listings) ---`);
    market.googleSearchResults.forEach((r, i) => {
      marketLines.push(`${i + 1}. ${r}`);
    });
  }
  if (market.jobListingSnippets.length > 0) {
    marketLines.push(``);
    marketLines.push(`--- JOB LISTINGS FOUND ---`);
    market.jobListingSnippets.forEach((s) => marketLines.push(`• ${s}`));
  }
  if (market.salaryDataSnippets.length > 0) {
    marketLines.push(``);
    marketLines.push(`--- SALARY/RATE DATA ---`);
    market.salaryDataSnippets.forEach((s) => marketLines.push(`• ${s}`));
  }

  sections.push(marketLines.join("\n"));

  // Section 8: Task
  sections.push(`== TUGAS ==
Berdasarkan PROFIL USER + DATA MARKET REAL di atas, berikan 3 rekomendasi job/opportunity:

PENTING: Gunakan DATA REAL yang sudah di-fetch (Google Trends score, YouTube stats, TikTok engagement, job listings) sebagai DASAR rekomendasi. SETIAP evidence HARUS reference data real di atas — BUKAN data yang kamu tahu dari training.

1. PRIMARY JOB — paling cocok dengan kondisi user + data market menunjukkan demand
2. SECONDARY JOB — alternatif berdasarkan rising queries / related topics dari Google Trends
3. EXPLORATORY JOB — opsi based on gap di market (low competition tapi ada demand)

Untuk SETIAP job:
- Title harus SANGAT SPESIFIK (bukan "Freelancer" tapi misalnya "AI-Assisted SEO Content Writer untuk SaaS companies via Upwork")
- whyThisJob: hubungkan ke profil USER + data market real — sebutkan search interest, trend direction, competition level
- evidence: WAJIB sebutkan angka dari data real: "Google Trends interest 73/100, rising", "YouTube avg views 45K, competition sedang", "Rising query: X", dll
- incomeRange: realistis berdasarkan skill level + salary data dari Google Search jika ada
- requiredTools: tools KONKRET yang perlu dikuasai
- firstStep: 1 langkah SANGAT spesifik yang bisa dilakukan HARI INI
- successExample: nama orang/brand/channel REAL — jika ada dari YouTube top channels, sebutkan
- riskMitigation: apa yang bisa salah dan bagaimana handle-nya, based on market data
- skillGap: apa yang perlu dipelajari dan berapa lama
- competitiveAdvantage: keunggulan user INI based on data (low competition = advantage, rising trend = timing advantage, dll)

TAMBAHAN:
- profileAnalysis: 3-4 kalimat analisis tajam — hubungkan profil → market data → job match
- trendKeywords: ambil dari rising queries + related topics yang sudah di-fetch
- marketContext: 2-3 kalimat tentang kondisi market BERDASARKAN data real (Google Trends direction, YouTube competition, TikTok engagement)

FORMAT OUTPUT: JSON sesuai schema JobResearchResult. Langsung output JSON.`);

  return sections.join("\n\n");
}

// ============================================================================
// KEYWORD DERIVATION — Build search keywords from profile
// ============================================================================

function deriveResearchKeywords(
  model: EconomicModelId,
  subSector: string,
  niche: string,
  platform: string,
  deepProfile: Record<string, string>
): string[] {
  const keywords: string[] = [];

  // Model-based keywords
  const modelKeywords: Record<string, string[]> = {
    skill_service: ["freelance", "jasa digital", "client work", "remote work"],
    audience_based: ["content creator", "monetisasi konten", "brand deals", "adsense"],
    digital_product: ["digital product", "passive income", "online course", "template"],
    commerce_arbitrage: ["dropship", "affiliate marketing", "e-commerce", "reseller"],
    data_research: ["data analyst", "research", "newsletter", "insight"],
    automation_builder: ["no-code", "automation", "workflow", "SaaS builder"],
  };
  keywords.push(...(modelKeywords[model] || []));

  // Sub-sector & niche as keywords
  keywords.push(subSector.replace(/_/g, " "));
  keywords.push(niche.replace(/_/g, " "));

  // Platform keywords
  keywords.push(platform.replace(/_/g, " "));

  // Language-based market keywords
  if (deepProfile.language_skill === "fluent") {
    keywords.push("international freelance", "global remote work");
  } else {
    keywords.push("pasar Indonesia", "client lokal");
  }

  // Stage-based keywords
  if (deepProfile.current_stage === "student") keywords.push("side hustle mahasiswa");
  if (deepProfile.current_stage === "employee") keywords.push("side income karyawan");
  if (deepProfile.current_stage === "freelancer") keywords.push("scale freelance");

  // Remove duplicates
  return [...new Set(keywords)].slice(0, 12);
}

// ============================================================================
// QUICK ANALYSIS — Lighter version for Dashboard display
// ============================================================================

export async function generateQuickJobAnalysis(
  answerTags: Record<string, string>
): Promise<string> {
  if (!AI_API_KEY) return "";

  const prompt = `Berdasarkan profil user ini:
- Model: ${answerTags.economic_model || 'unknown'}
- Sub-sektor: ${answerTags.sub_sector || 'unknown'}
- Niche: ${answerTags.niche || 'unknown'}
- Platform: ${answerTags.platform || 'unknown'}
- Pengalaman digital: ${answerTags.digital_experience || 'unknown'}
- Status: ${answerTags.current_stage || 'unknown'}
- Bahasa: ${answerTags.language_skill || 'unknown'}
- Tools: ${answerTags.tools_familiarity || 'unknown'}
- Target income: ${answerTags.income_target || 'unknown'}
- Hambatan: ${answerTags.biggest_challenge || 'unknown'}

Tulis 3-4 kalimat analisis TAJAM tentang posisi user saat ini dan kenapa jalur yang dipilih cocok/tidak cocok. 
Harus spesifik, data-based, bukan motivasi generik.
Bahasa Indonesia natural. Tanpa heading.`;

  try {
    const response = await fetch(`${AI_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": AI_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) return "";
    const data = await response.json();
    return data.content?.[0]?.text || "";
  } catch {
    return "";
  }
}

// ============================================================================
// REAL MARKET DATA FETCHING — Fetch from ALL available APIs
// ============================================================================

async function fetchAllMarketIntel(
  niche: string,
  subSector: string,
  platform: string,
  economicModel: string
): Promise<RealMarketIntel> {
  const intel: RealMarketIntel = {
    googleTrendsInterest: 0,
    googleTrendDirection: "stable",
    risingQueries: [],
    relatedTopics: [],
    youtubeVideoCount: 0,
    youtubeAvgViews: 0,
    youtubeTopChannels: [],
    youtubeCompetitionLevel: "unknown",
    tiktokAvgViews: 0,
    tiktokEngagementRate: "0",
    tiktokSignal: "",
    instagramSignal: "",
    googleSearchResults: [],
    jobListingSnippets: [],
    salaryDataSnippets: [],
    fetchedAt: new Date().toISOString(),
    dataQuality: "low",
  };

  const keyword = niche.replace(/_/g, " ");
  const jobKeyword = `${keyword} ${economicModel.replace(/_/g, " ")}`;
  let sourcesLoaded = 0;

  // Run ALL API calls in parallel
  const promises: Promise<void>[] = [];

  // 1. Google Trends via SerpAPI
  if (SERPAPI_KEY) {
    promises.push(
      fetchJobGoogleTrends(keyword, intel).then(() => { sourcesLoaded++; }).catch((e) => console.warn("[JobResearch] Google Trends failed:", e))
    );
  }

  // 2. YouTube Data API v3
  if (YOUTUBE_API_KEY) {
    promises.push(
      fetchJobYouTubeData(keyword, intel).then(() => { sourcesLoaded++; }).catch((e) => console.warn("[JobResearch] YouTube failed:", e))
    );
  }

  // 3. TikTok via RapidAPI
  if (RAPIDAPI_KEY) {
    promises.push(
      fetchJobTikTokData(keyword, intel).then(() => { sourcesLoaded++; }).catch((e) => console.warn("[JobResearch] TikTok failed:", e))
    );
    // 4. Instagram via RapidAPI
    promises.push(
      fetchJobInstagramData(keyword, intel).then(() => { sourcesLoaded++; }).catch((e) => console.warn("[JobResearch] Instagram failed:", e))
    );
  }

  // 5. Google Custom Search — job listings & salary data
  if (GOOGLE_CSE_KEY && GOOGLE_CSE_CX) {
    promises.push(
      fetchJobGoogleSearch(jobKeyword, platform, intel).then(() => { sourcesLoaded++; }).catch((e) => console.warn("[JobResearch] Google Search failed:", e))
    );
  }

  await Promise.allSettled(promises);

  // Determine data quality
  intel.dataQuality = sourcesLoaded >= 3 ? "high" : sourcesLoaded >= 1 ? "medium" : "low";

  return intel;
}

// ── Google Trends via SerpAPI ──
async function fetchJobGoogleTrends(keyword: string, intel: RealMarketIntel): Promise<void> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_trends");
  url.searchParams.set("q", keyword);
  url.searchParams.set("geo", "ID");
  url.searchParams.set("data_type", "TIMESERIES");
  url.searchParams.set("date", "today 3-m");
  url.searchParams.set("api_key", SERPAPI_KEY);

  const resp = await fetch(url.toString());
  if (!resp.ok) return;
  const data = await resp.json();

  // Interest over time
  const timeline = data.interest_over_time?.timeline_data;
  if (timeline && timeline.length > 0) {
    const values = timeline.map((d: any) => d.values?.[0]?.extracted_value || 0);
    const recent = values.slice(-4);
    const older = values.slice(-8, -4);
    const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a: number, b: number) => a + b, 0) / older.length : recentAvg;

    intel.googleTrendsInterest = Math.round(recentAvg);
    intel.googleTrendDirection = recentAvg > olderAvg * 1.15 ? "rising" : recentAvg < olderAvg * 0.85 ? "declining" : "stable";
  }

  // Rising queries
  const rising = data.related_queries?.rising;
  if (rising) {
    intel.risingQueries = rising.slice(0, 8).map((q: any) => q.query || "").filter(Boolean);
  }

  // Related topics
  const topics = data.related_topics?.rising;
  if (topics) {
    intel.relatedTopics = topics.slice(0, 5).map((t: any) => t.topic?.title || "").filter(Boolean);
  }

  // Also fetch related queries separately for more data
  try {
    const rqUrl = new URL("https://serpapi.com/search.json");
    rqUrl.searchParams.set("engine", "google_trends");
    rqUrl.searchParams.set("q", keyword);
    rqUrl.searchParams.set("geo", "ID");
    rqUrl.searchParams.set("data_type", "RELATED_QUERIES");
    rqUrl.searchParams.set("api_key", SERPAPI_KEY);

    const rqResp = await fetch(rqUrl.toString());
    if (rqResp.ok) {
      const rqData = await rqResp.json();
      const topQueries = rqData.related_queries?.top;
      if (topQueries) {
        const topQ = topQueries.slice(0, 5).map((q: any) => q.query || "").filter(Boolean);
        intel.risingQueries = [...new Set([...intel.risingQueries, ...topQ])].slice(0, 10);
      }
    }
  } catch { /* non-critical */ }
}

// ── YouTube Data API v3 ──
async function fetchJobYouTubeData(keyword: string, intel: RealMarketIntel): Promise<void> {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", keyword);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "viewCount");
  searchUrl.searchParams.set("maxResults", "15");
  searchUrl.searchParams.set("publishedAfter", threeMonthsAgo.toISOString());
  searchUrl.searchParams.set("relevanceLanguage", "id");
  searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

  const resp = await fetch(searchUrl.toString());
  if (!resp.ok) return;
  const data = await resp.json();
  const items = data.items || [];

  intel.youtubeVideoCount = data.pageInfo?.totalResults || items.length;

  if (items.length === 0) {
    intel.youtubeCompetitionLevel = "Sangat rendah — hampir tidak ada video";
    return;
  }

  // Get channel names
  intel.youtubeTopChannels = items
    .slice(0, 5)
    .map((item: any) => item.snippet?.channelTitle || "")
    .filter(Boolean);

  // Get video stats
  const videoIds = items.map((item: any) => item.id?.videoId).filter(Boolean).join(",");
  if (!videoIds) return;

  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.searchParams.set("part", "statistics");
  statsUrl.searchParams.set("id", videoIds);
  statsUrl.searchParams.set("key", YOUTUBE_API_KEY);

  const statsResp = await fetch(statsUrl.toString());
  if (!statsResp.ok) return;
  const statsData = await statsResp.json();
  const videos = statsData.items || [];

  if (videos.length > 0) {
    const views = videos.map((v: any) => parseInt(v.statistics?.viewCount || "0"));
    intel.youtubeAvgViews = Math.round(views.reduce((a: number, b: number) => a + b, 0) / views.length);

    intel.youtubeCompetitionLevel = intel.youtubeVideoCount > 50000
      ? "Tinggi — banyak creator, butuh diferensiasi kuat"
      : intel.youtubeVideoCount > 10000
        ? "Sedang — ada space tapi butuh angle unik"
        : intel.youtubeVideoCount > 1000
          ? "Rendah-Sedang — peluang bagus untuk early mover"
          : "Rendah — niche terbuka, potensi jadi pioneer";
  }
}

// ── TikTok via RapidAPI ──
async function fetchJobTikTokData(keyword: string, intel: RealMarketIntel): Promise<void> {
  const resp = await fetch(
    `https://tiktok-scraper7.p.rapidapi.com/feed/search?keywords=${encodeURIComponent(keyword)}&count=15&region=ID`,
    {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",
      },
    }
  );

  if (!resp.ok) return;
  const data = await resp.json();
  const videos = data.data?.videos || data.data || [];

  if (Array.isArray(videos) && videos.length > 0) {
    const totalViews = videos.reduce((sum: number, v: any) => sum + (v.play_count || v.stats?.playCount || 0), 0);
    intel.tiktokAvgViews = Math.round(totalViews / videos.length);

    const totalLikes = videos.reduce((sum: number, v: any) => sum + (v.digg_count || v.stats?.diggCount || 0), 0);
    intel.tiktokEngagementRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : "0";

    if (intel.tiktokAvgViews > 500000) {
      intel.tiktokSignal = `Viral potential TINGGI — rata-rata ${fmtNum(intel.tiktokAvgViews)} views per video, engagement ${intel.tiktokEngagementRate}%. Market sangat aktif.`;
    } else if (intel.tiktokAvgViews > 50000) {
      intel.tiktokSignal = `Demand BAGUS di TikTok — rata-rata ${fmtNum(intel.tiktokAvgViews)} views, engagement ${intel.tiktokEngagementRate}%. Ada audience yang aktif searching.`;
    } else if (intel.tiktokAvgViews > 5000) {
      intel.tiktokSignal = `Niche market di TikTok — rata-rata ${fmtNum(intel.tiktokAvgViews)} views. Low competition, cocok untuk positioning.`;
    } else {
      intel.tiktokSignal = `Micro niche di TikTok — rata-rata ${fmtNum(intel.tiktokAvgViews)} views. Peluang jadi first mover tapi audience masih kecil.`;
    }
  }
}

// ── Instagram via RapidAPI ──
async function fetchJobInstagramData(keyword: string, intel: RealMarketIntel): Promise<void> {
  try {
    // Use Instagram hashtag search via RapidAPI
    const resp = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag?hashtag=${encodeURIComponent(keyword.replace(/\s+/g, ""))}`,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com",
        },
      }
    );

    if (!resp.ok) {
      // Try alternative IG API
      const altResp = await fetch(
        `https://instagram-scraper-2022.p.rapidapi.com/ig/hashtag/?hashtag=${encodeURIComponent(keyword.replace(/\s+/g, ""))}`,
        {
          headers: {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": "instagram-scraper-2022.p.rapidapi.com",
          },
        }
      );
      if (!altResp.ok) return;

      const altData = await altResp.json();
      const postCount = altData.data?.media_count || altData.media_count || 0;
      if (postCount > 0) {
        intel.instagramSignal = `Instagram hashtag #${keyword.replace(/\s+/g, "")}: ${fmtNum(postCount)} posts. ${
          postCount > 1000000 ? "Market BESAR tapi crowded." :
          postCount > 100000 ? "Market aktif, competition moderate." :
          postCount > 10000 ? "Niche tapi ada community." :
          "Micro niche — bisa jadi pioneer."
        }`;
      }
      return;
    }

    const data = await resp.json();
    const postCount = data.data?.media_count || data.media_count || 0;
    if (postCount > 0) {
      intel.instagramSignal = `Instagram hashtag #${keyword.replace(/\s+/g, "")}: ${fmtNum(postCount)} posts. ${
        postCount > 1000000 ? "Market BESAR — banyak creator, butuh diferensiasi." :
        postCount > 100000 ? "Market aktif — competition moderate, ada peluang." :
        postCount > 10000 ? "Niche community — low competition, bisa build authority." :
        "Micro niche — potensi first mover advantage."
      }`;
    }
  } catch {
    // Instagram APIs can be flaky
  }
}

// ── Google Custom Search — Job listings & salary data ──
async function fetchJobGoogleSearch(
  jobKeyword: string,
  platform: string,
  intel: RealMarketIntel
): Promise<void> {
  // Search 1: Job listings & opportunities
  const jobSearchUrl = new URL("https://www.googleapis.com/customsearch/v1");
  jobSearchUrl.searchParams.set("key", GOOGLE_CSE_KEY);
  jobSearchUrl.searchParams.set("cx", GOOGLE_CSE_CX);
  jobSearchUrl.searchParams.set("q", `${jobKeyword} lowongan kerja freelance income 2025`);
  jobSearchUrl.searchParams.set("num", "5");
  jobSearchUrl.searchParams.set("gl", "id");
  jobSearchUrl.searchParams.set("lr", "lang_id");

  try {
    const resp = await fetch(jobSearchUrl.toString());
    if (resp.ok) {
      const data = await resp.json();
      const items = data.items || [];
      intel.googleSearchResults = items.map(
        (item: any) => `${item.title} — ${item.snippet || ""}`
      ).slice(0, 5);

      // Extract job-related snippets
      items.forEach((item: any) => {
        const snippet = (item.snippet || "").toLowerCase();
        if (snippet.includes("gaji") || snippet.includes("salary") || snippet.includes("income") || snippet.includes("rate") || snippet.includes("harga") || snippet.includes("bayaran")) {
          intel.salaryDataSnippets.push(`${item.title}: ${item.snippet}`);
        }
        if (snippet.includes("lowongan") || snippet.includes("hiring") || snippet.includes("dicari") || snippet.includes("vacancy") || snippet.includes("freelance")) {
          intel.jobListingSnippets.push(`${item.title}: ${item.snippet}`);
        }
      });
    }
  } catch { /* non-critical */ }

  // Search 2: Platform-specific rates/income
  try {
    const rateUrl = new URL("https://www.googleapis.com/customsearch/v1");
    rateUrl.searchParams.set("key", GOOGLE_CSE_KEY);
    rateUrl.searchParams.set("cx", GOOGLE_CSE_CX);
    rateUrl.searchParams.set("q", `${jobKeyword} ${platform} rate harga tarif per project 2025`);
    rateUrl.searchParams.set("num", "3");
    rateUrl.searchParams.set("gl", "id");

    const rateResp = await fetch(rateUrl.toString());
    if (rateResp.ok) {
      const rateData = await rateResp.json();
      (rateData.items || []).forEach((item: any) => {
        intel.salaryDataSnippets.push(`${item.title}: ${item.snippet}`);
      });
    }
  } catch { /* non-critical */ }

  // Deduplicate
  intel.salaryDataSnippets = [...new Set(intel.salaryDataSnippets)].slice(0, 5);
  intel.jobListingSnippets = [...new Set(intel.jobListingSnippets)].slice(0, 5);
}

// ── Helpers ──
function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
