/**
 * Job Research Engine — Layer 2: Data-Driven Job Matching
 * =========================================================
 * BUKAN rekomendasi generik. Ini sistem riset yang:
 * 1. Menganalisis profil user secara mendalam (dari Layer 1)
 * 2. Mencocokan dengan job/opportunity yang TEPAT berdasarkan data
 * 3. Memberikan alasan berbasis evidence: trend, success rate, competitor analysis
 * 4. Setiap rekomendasi UNIK — tidak ada yang sama antar user
 *
 * Architecture:
 *   Deep Profile + Context → AI Research Prompt → Structured Job Match
 *   Setiap output harus: presisi, data-backed, actionable
 *
 * Trust dibangun di layer ini.
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
// MAIN ENGINE: Generate Job Research
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

  const prompt = buildJobResearchPrompt(
    economicModel, subSector, niche, platform,
    contextScores, deepProfile, sectorAnswers
  );

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

    // Parse JSON response
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

const JOB_RESEARCH_SYSTEM_PROMPT = `Kamu adalah Job Research Analyst untuk platform IntentAI. Tugas kamu BUKAN memberikan saran generik — tapi melakukan RISET MENDALAM dan memberikan rekomendasi job/opportunity yang PRESISI berdasarkan profil user.

ATURAN FUNDAMENTAL:
1. SETIAP rekomendasi HARUS spesifik dan berbeda — tidak boleh template/generic
2. Hubungkan SETIAP rekomendasi ke data nyata: platform demand, trend 2024-2025, success rate orang lain
3. Sebutkan CONTOH NYATA orang/brand yang sukses di job tersebut sebagai benchmark
4. Income estimate HARUS realistis berdasarkan: skill level, experience, market rate aktual
5. JANGAN rekomendasikan sesuatu yang tidak cocok dengan KONDISI user (waktu, modal, skill, bahasa)
6. Setiap output harus UNIK — berdasarkan kombinasi profil user yang berbeda

PRINSIP:
- Trust dibangun dari PRESISI, bukan dari janji
- Lebih baik 1 rekomendasi tajam daripada 5 rekomendasi generic
- Setiap claim harus bisa di-verify user
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
  sectorAnswers: Record<string, string>
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

  // Section 7: Task
  sections.push(`== TUGAS ==
Berdasarkan SEMUA data di atas, lakukan RISET JOB/OPPORTUNITY dan berikan 3 rekomendasi:

1. PRIMARY JOB — paling cocok dengan kondisi & skill user saat ini
2. SECONDARY JOB — alternatif yang sedikit berbeda tapi masih feasible
3. EXPLORATORY JOB — opsi yang lebih experimental, higher upside tapi butuh effort lebih

Untuk SETIAP job:
- Title harus SANGAT SPESIFIK (bukan "Freelancer" tapi misalnya "AI-Assisted SEO Content Writer untuk SaaS companies via Upwork")
- whyThisJob: hubungkan ke profil USER INI secara spesifik — sebutkan kondisi, skill, platform mereka
- evidence: data real — platform demand, job listing count, market rate, growth trend 2024-2025
- incomeRange: realistis berdasarkan skill level user — jangan oversell
- requiredTools: tools KONKRET yang perlu dikuasai
- firstStep: 1 langkah SANGAT spesifik yang bisa dilakukan HARI INI (bukan "buat portfolio" tapi "buat 3 sample X di Y tool dan post di Z")
- successExample: nama orang/brand/channel yang sukses di job ini — bisa di-research user
- riskMitigation: apa yang bisa salah dan bagaimana handle-nya
- skillGap: apa yang perlu dipelajari dan berapa lama
- competitiveAdvantage: keunggulan user INI dibanding orang lain

TAMBAHAN:
- profileAnalysis: 3-4 kalimat analisis tajam — hubungkan profil → job match
- trendKeywords: 5-8 kata kunci trend yang relevan untuk riset lanjutan
- marketContext: 2-3 kalimat tentang kondisi market saat ini yang relevan

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
