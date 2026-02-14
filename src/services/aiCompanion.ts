/**
 * AI Companion — 1 User = 1 Personal AI Context
 * =================================================
 * Setiap user punya SATU AI companion yang tahu SEMUA tentang mereka.
 * Tidak ada AI call yang "anonymous" — semua diberi konteks lengkap.
 *
 * Data sources:
 *   1. Supabase profile (deep profile, scores, answer_tags)
 *   2. Job research result (Supabase)
 *   3. Real market data (SerpAPI, YouTube, RapidAPI)
 *   4. Task progress & checkpoint history
 *
 * Setiap output AI akan SANGAT personal — karena konteks lengkap selalu disertakan.
 */

import { supabase } from "@/integrations/supabase/client";
import type { ProfileScores, PathId } from "@/utils/profilingConfig";
import type { PathTemplate } from "@/utils/pathTemplates";
import { getPathTemplate } from "@/utils/pathTemplates";
import type { SavedProfile, TaskProgress, CheckpointHistory } from "./profileService";
import { loadActiveProfile, loadTaskProgress, loadPreviousCheckpoints } from "./profileService";
import type { JobResearchResult } from "./jobResearchEngine";
import { fetchRealMarketContext, type MarketContext } from "./realMarketData";

// ============================================================================
// TYPES
// ============================================================================

export interface CompanionContext {
  // User identity
  userId: string;
  userName: string;

  // Deep profile (Layer 1)
  profile: SavedProfile;
  pathData: PathTemplate;
  answerTags: Record<string, string>;
  deepProfileLabels: Record<string, string>; // Human-readable labels

  // Job research (Layer 2)
  jobResearch: JobResearchResult | null;

  // Progress
  tasks: TaskProgress[];
  checkpoints: CheckpointHistory[];
  currentWeek: number;
  completionRate: number;

  // Real market data
  marketContext: MarketContext | null;

  // Computed
  strengthSummary: string;
  weaknessSummary: string;
  situationSummary: string;
}

// ============================================================================
// LABEL DECODERS — Transform raw keys to human-readable text
// ============================================================================

export const DEEP_PROFILE_LABELS: Record<string, Record<string, string>> = {
  digital_experience: {
    never: "Belum pernah kerja digital sama sekali",
    tried_failed: "Pernah coba digital tapi gagal/berhenti",
    side_project: "Pernah digital sebagai sampingan",
    working_digital: "Sekarang sudah kerja di bidang digital",
    experienced: "Berpengalaman & punya portfolio digital",
  },
  current_stage: {
    student: "Pelajar/Mahasiswa",
    employee: "Karyawan — butuh side income",
    freelancer: "Freelancer aktif",
    unemployed: "Sedang tidak bekerja — butuh income ASAP",
    entrepreneur: "Pengusaha — mau tambah revenue stream",
    stay_home: "WFH/Ibu rumah tangga",
  },
  language_skill: {
    none: "Bahasa Indonesia only",
    passive: "English pasif — bisa baca tapi tidak bisa produce",
    moderate: "English cukup — bisa komunikasi dasar",
    fluent: "English fluent — bisa akses market global",
  },
  tools_familiarity: {
    none: "Belum familiar dengan tools profesional",
    basic: "Tools dasar (Canva, Google Docs, Notion)",
    intermediate: "Tools menengah (Figma, Premiere, WordPress)",
    advanced: "Advanced (coding, API, automation, Git)",
  },
  weekly_commitment: {
    "1_week": "Testing phase — 1 minggu",
    "2_weeks": "Serius tapi belum total — 2 minggu",
    "1_month": "Dedicated — 1 bulan penuh",
    "3_months": "Long-term builder — 3 bulan+",
  },
  income_target: {
    lt500k: "< Rp 500K/bulan",
    "500k-2m": "Rp 500K–2 juta/bulan",
    "2m-5m": "Rp 2–5 juta/bulan",
    "5m-15m": "Rp 5–15 juta/bulan",
    gt15m: "> Rp 15 juta/bulan",
  },
  learning_style: {
    video: "Belajar lewat video tutorial",
    reading: "Belajar lewat baca artikel/dokumentasi",
    practice: "Belajar langsung praktek & trial error",
  },
  biggest_challenge: {
    no_direction: "Tidak tahu harus mulai dari mana",
    no_skill: "Merasa belum punya skill yang bisa dijual",
    no_time: "Waktu sangat terbatas",
    no_confidence: "Kurang percaya diri / takut gagal",
    tried_failed: "Sudah coba tapi selalu gagal",
  },
  economic_model: {
    skill_service: "Jual Skill & Jasa",
    audience_based: "Bangun Audience & Monetisasi",
    digital_product: "Jual Produk Digital",
    commerce_arbitrage: "E-Commerce & Arbitrage",
    data_research: "Riset & Operator Data",
    automation_builder: "Automation & System Builder",
  },
  time: {
    lt1h: "< 1 jam/hari",
    "1-2h": "1-2 jam/hari",
    "3-4h": "3-4 jam/hari",
    gt4h: "> 4 jam/hari",
  },
  capital: {
    zero: "Tanpa modal ($0)",
    lt50: "< $50",
    "50-200": "$50-200",
    "200-500": "$200-500",
  },
  risk: {
    very_low: "Sangat rendah — hanya yang proven",
    low: "Rendah — proven + sedikit eksperimen",
    medium: "Sedang — siap eksperimen terukur",
    high: "Tinggi — gagal cepat pivot cepat",
  },
  skill_level: {
    beginner: "Pemula total",
    basic: "Tahu dasar",
    intermediate: "Intermediate — bisa eksekusi sendiri",
    advanced: "Advanced — sudah mahir",
    expert: "Expert — sudah punya portfolio",
  },
  audience: {
    zero: "Nol audience",
    micro: "< 200 follower",
    small: "200-1K follower",
    medium: "1K-5K follower",
    large: "> 5K follower",
  },
};

/**
 * Decode a raw answer tag key to human-readable label
 */
export function decodeLabel(field: string, value: string): string {
  return DEEP_PROFILE_LABELS[field]?.[value] || value.replace(/_/g, " ");
}

/**
 * Decode all answer tags to human-readable labels
 */
export function decodeAllLabels(tags: Record<string, string>): Record<string, string> {
  const decoded: Record<string, string> = {};
  for (const [key, val] of Object.entries(tags)) {
    decoded[key] = decodeLabel(key, val);
  }
  return decoded;
}

// ============================================================================
// BUILD COMPANION CONTEXT — Load everything about this user
// ============================================================================

export async function buildCompanionContext(userId: string, userName?: string): Promise<CompanionContext | null> {
  const profile = await loadActiveProfile(userId);
  if (!profile) return null;

  const pathData = getPathTemplate(profile.primary_path as PathId);
  if (!pathData) return null;

  const answerTags = (profile as any)?.answer_tags as Record<string, string> || {};
  const deepProfileLabels = decodeAllLabels(answerTags);

  // Load parallel data
  const [tasks, checkpoints, jobResearchRow] = await Promise.all([
    loadTaskProgress(profile.id),
    loadPreviousCheckpoints(profile.id),
    loadJobResearchFromDB(profile.id),
  ]);

  const completedCount = tasks.filter(t => t.is_completed).length;
  const completionRate = tasks.length > 0 ? completedCount / tasks.length : 0;

  // Compute summaries from profile data
  const strengthSummary = computeStrengths(answerTags, profile.scores);
  const weaknessSummary = computeWeaknesses(answerTags, profile.scores);
  const situationSummary = computeSituation(answerTags, profile);

  // Fetch real market data (non-blocking, use cached if available)
  let marketContext: MarketContext | null = null;
  try {
    const niche = answerTags.niche || answerTags.sub_sector || "digital";
    const platform = answerTags.platform || "instagram";
    marketContext = await fetchRealMarketContext(niche, platform);
  } catch {
    // Market data is enrichment, not critical
  }

  return {
    userId,
    userName: userName || "User",
    profile,
    pathData,
    answerTags,
    deepProfileLabels,
    jobResearch: jobResearchRow,
    tasks,
    checkpoints,
    currentWeek: profile.current_week,
    completionRate,
    marketContext,
    strengthSummary,
    weaknessSummary,
    situationSummary,
  };
}

// ============================================================================
// COMPANION SYSTEM PROMPT — Always injected into every AI call
// ============================================================================

export function buildCompanionSystemPrompt(ctx: CompanionContext): string {
  const tags = ctx.answerTags;
  const labels = ctx.deepProfileLabels;

  return `Kamu adalah AI Companion personal untuk user "${ctx.userName}" di platform IntentAI.
Kamu SANGAT kenal user ini. Setiap output kamu harus merujuk data profil mereka secara spesifik.

== PROFIL LENGKAP USER ==
Model Ekonomi: ${labels.economic_model || tags.economic_model || "?"}
Sub-Sektor: ${labels.sub_sector || tags.sub_sector || "?"}
Niche: ${labels.niche || tags.niche || "?"}
Platform Utama: ${tags.platform || "?"}

== KONDISI USER ==
Status: ${labels.current_stage || "?"}
Pengalaman Digital: ${labels.digital_experience || "?"}
Bahasa: ${labels.language_skill || "?"}
Tools: ${labels.tools_familiarity || "?"}
Waktu Tersedia: ${labels.time || tags.time || "?"}
Modal: ${labels.capital || tags.capital || "?"}
Toleransi Risiko: ${labels.risk || tags.risk || "?"}
Skill Level: ${labels.skill_level || tags.skill_level || "?"}
Audience Saat Ini: ${labels.audience || tags.audience || "?"}

== TARGET & MOTIVASI ==
Target Income: ${labels.income_target || "?"}
Komitmen: ${labels.weekly_commitment || "?"}
Hambatan Terbesar: ${labels.biggest_challenge || "?"}
Cara Belajar: ${labels.learning_style || "?"}

== JALUR AKTIF ==
Path: ${ctx.pathData.title} — ${ctx.pathData.description}
Sumber Income: ${ctx.pathData.moneySource}
Waktu ke Income Pertama: ${ctx.pathData.timeToTest}
Minggu ke: ${ctx.currentWeek}/4
Progress: ${Math.round(ctx.completionRate * 100)}% tasks selesai

== KEKUATAN USER ==
${ctx.strengthSummary}

== KELEMAHAN/TANTANGAN ==
${ctx.weaknessSummary}

== SITUASI SAAT INI ==
${ctx.situationSummary}

${ctx.marketContext ? `== DATA MARKET REAL (dari API) ==
${formatMarketContext(ctx.marketContext)}` : ""}

${ctx.jobResearch ? `== JOB RESEARCH RESULT ==
Primary Job: ${ctx.jobResearch.primaryJob?.title || "?"}
Secondary Job: ${ctx.jobResearch.secondaryJob?.title || "?"}
Profile Analysis: ${ctx.jobResearch.profileAnalysis || "?"}` : ""}

== ATURAN KOMUNIKASI ==
1. SELALU merujuk data profil user — sebutkan kondisi spesifik mereka
2. Bahasa Indonesia natural, nada supportive tapi jujur
3. JANGAN generic — setiap output harus UNIK untuk user ini
4. Jika user punya hambatan, ADDRESS itu langsung
5. Setiap saran harus ACTIONABLE dengan tool/platform KONKRET
6. Income estimate REALISTIS berdasarkan skill + experience level user
7. Panggil user dengan "kamu", bukan "Anda"`;
}

function formatMarketContext(mc: MarketContext): string {
  const lines: string[] = [];
  if (mc.trendingKeywords.length > 0) {
    lines.push(`Trending Keywords: ${mc.trendingKeywords.join(", ")}`);
  }
  if (mc.youtubeInsight) lines.push(`YouTube: ${mc.youtubeInsight}`);
  if (mc.competitorDensity) lines.push(`Kompetisi: ${mc.competitorDensity}`);
  if (mc.demandSignal) lines.push(`Demand Signal: ${mc.demandSignal}`);
  if (mc.socialSignal) lines.push(`Social Signal: ${mc.socialSignal}`);
  return lines.join("\n") || "Data market sedang dimuat...";
}

// ============================================================================
// AI CALL WITH COMPANION CONTEXT — Use this for ALL AI calls
// ============================================================================

const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || "";
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "https://api.z.ai/api/anthropic/v1";

export async function companionAICall(
  ctx: CompanionContext,
  userPrompt: string,
  options?: {
    model?: "sonnet" | "haiku";
    maxTokens?: number;
    requestType?: string;
  }
): Promise<string> {
  if (!AI_API_KEY) return "";

  const model = options?.model === "haiku"
    ? "claude-3-haiku-20240307"
    : "claude-3-sonnet-20240229";
  const maxTokens = options?.maxTokens || 800;

  const systemPrompt = buildCompanionSystemPrompt(ctx);

  try {
    const startTime = Date.now();
    const response = await fetch(`${AI_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": AI_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json();
    const output = data.content?.[0]?.text || "";
    const processingTime = Date.now() - startTime;

    // Log AI call (non-blocking)
    if (options?.requestType) {
      try {
        void supabase.from("ai_personalization_log").insert({
          user_id: ctx.userId,
          profile_id: ctx.profile.id,
          request_type: options.requestType,
          ai_input: { prompt_length: userPrompt.length, model, context_size: systemPrompt.length } as any,
          ai_output: output,
          processing_time_ms: processingTime,
        });
      } catch { /* ignore log errors */ }
    }

    return output;
  } catch (err) {
    console.error("[AICompanion] Call failed:", err);
    return "";
  }
}

// ============================================================================
// HELPERS — Compute user summaries from profile data
// ============================================================================

function computeStrengths(tags: Record<string, string>, scores: ProfileScores): string {
  const strengths: string[] = [];

  if (tags.digital_experience === "experienced" || tags.digital_experience === "working_digital") {
    strengths.push("Sudah punya pengalaman digital — bisa skip fase belajar dasar");
  }
  if (tags.language_skill === "fluent") {
    strengths.push("English fluent — bisa akses market global (Fiverr, Upwork, Medium)");
  }
  if (tags.tools_familiarity === "advanced") {
    strengths.push("Tech-savvy — bisa leverage automation & tools canggih");
  }
  if (scores.skill_primary >= 3) {
    strengths.push("Punya skill utama yang bisa langsung dijual");
  }
  if (scores.audience_access >= 3) {
    strengths.push("Sudah punya audience — bisa langsung monetisasi");
  }
  if (tags.weekly_commitment === "3_months" || tags.weekly_commitment === "1_month") {
    strengths.push("Komitmen kuat — ini kunci utama kesuksesan");
  }
  if (scores.time >= 3) {
    strengths.push("Waktu cukup untuk eksekusi serius (3-4+ jam/hari)");
  }

  return strengths.length > 0 ? strengths.join("\n") : "Belum teridentifikasi kekuatan spesifik — tapi semua orang bisa mulai dari nol";
}

function computeWeaknesses(tags: Record<string, string>, scores: ProfileScores): string {
  const weaknesses: string[] = [];

  if (tags.digital_experience === "never") {
    weaknesses.push("Zero pengalaman digital — butuh guidance step-by-step dari nol");
  }
  if (tags.language_skill === "none") {
    weaknesses.push("Bahasa Indonesia only — market terbatas pada lokal");
  }
  if (tags.biggest_challenge === "no_confidence") {
    weaknesses.push("Kurang percaya diri — mulai dari low-stakes tasks dulu");
  }
  if (tags.biggest_challenge === "tried_failed") {
    weaknesses.push("Pernah gagal sebelumnya — butuh pendekatan yang BERBEDA");
  }
  if (tags.biggest_challenge === "no_time") {
    weaknesses.push("Waktu sangat terbatas — task harus micro & efficient");
  }
  if (scores.capital === 0) {
    weaknesses.push("Zero modal — hanya bisa pakai tools gratis/free tier");
  }
  if (scores.time <= 1) {
    weaknesses.push("Waktu sangat terbatas (< 1 jam/hari) — harus sangat fokus");
  }

  return weaknesses.length > 0 ? weaknesses.join("\n") : "Tidak ada kelemahan signifikan teridentifikasi";
}

function computeSituation(tags: Record<string, string>, profile: SavedProfile): string {
  const parts: string[] = [];

  if (tags.current_stage === "unemployed") {
    parts.push("Sedang tidak bekerja — BUTUH INCOME SECEPATNYA");
  } else if (tags.current_stage === "employee") {
    parts.push("Karyawan — ini side project, waktu terbatas setelah kerja");
  } else if (tags.current_stage === "student") {
    parts.push("Pelajar/mahasiswa — punya waktu tapi minim pengalaman");
  } else if (tags.current_stage === "stay_home") {
    parts.push("WFH/rumah tangga — cari income dari rumah, waktu fleksibel tapi bisa terganggu");
  }

  parts.push(`Target income: ${DEEP_PROFILE_LABELS.income_target?.[tags.income_target] || tags.income_target || "?"}`);
  parts.push(`Minggu ke-${profile.current_week} dari 4 — ${profile.current_week === 1 ? "baru mulai" : profile.current_week >= 3 ? "sudah di fase eksekusi" : "fase build"}`);

  return parts.join(". ");
}

// ============================================================================
// LOAD/SAVE JOB RESEARCH FROM SUPABASE (not localStorage)
// ============================================================================

export async function saveJobResearchToDB(
  profileId: string,
  userId: string,
  jobResearch: JobResearchResult
): Promise<void> {
  // Load existing path_scores, merge with job_research
  const { data: existing } = await supabase
    .from("user_profiles_intent")
    .select("path_scores")
    .eq("id", profileId)
    .single();

  const existingScores = (existing?.path_scores && typeof existing.path_scores === "object")
    ? existing.path_scores as Record<string, unknown>
    : {};

  await supabase
    .from("user_profiles_intent")
    .update({
      path_scores: { ...existingScores, job_research: jobResearch } as any,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  // Also keep localStorage as fallback
  try {
    localStorage.setItem("intent_job_research", JSON.stringify(jobResearch));
  } catch {}
}

async function loadJobResearchFromDB(profileId: string): Promise<JobResearchResult | null> {
  try {
    const { data } = await supabase
      .from("user_profiles_intent")
      .select("path_scores")
      .eq("id", profileId)
      .single();

    const pathScores = data?.path_scores as any;
    if (pathScores?.job_research) {
      return pathScores.job_research as JobResearchResult;
    }
  } catch {}

  // Fallback to localStorage
  try {
    const cached = localStorage.getItem("intent_job_research");
    if (cached) return JSON.parse(cached);
  } catch {}

  return null;
}
