/**
 * Profile Service — Supabase CRUD + AI Personalization
 * ======================================================
 * This is the REAL data layer. NOT localStorage.
 * 
 * Responsibilities:
 *   1. Save profiling results to Supabase (user_profiles_intent)
 *   2. Initialize task rows in user_path_progress
 *   3. Call Claude AI to generate personalized "why text"
 *   4. Call Claude AI to generate customized weekly tasks
 *   5. Load/save task completion state from Supabase
 *   6. Handle weekly checkpoints
 *
 * Architecture (from NEW_KONSEP XII-E):
 *   AI receives STRUCTURED state, not raw text.
 *   AI does NOT determine path. AI personalizes WITHIN the chosen path.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { ProfileScores, PathId, SegmentTag, ProfilingQuestionId } from "@/utils/profilingConfig";
import { getPathTemplate, type PathTemplate } from "@/utils/pathTemplates";
import { generateSubSpecialization } from "@/utils/pathSpecialization";

// ============================================================================
// TYPES
// ============================================================================

export interface SavedProfile {
  id: string;
  user_id: string;
  primary_path: string;
  alternate_path: string | null;
  segment_tag: string;
  eliminated_paths: string[];
  scores: ProfileScores;
  ai_why_text: string | null;
  ai_custom_tasks: CustomTaskSet | null;
  ai_niche_suggestion: string | null;
  current_week: number;
  is_active: boolean;
  created_at: string;
}

export interface TaskProgress {
  path_id: string;
  week_number: number;
  task_index: number;
  task_text: string;
  is_completed: boolean;
  completed_at: string | null;
}

export interface CustomTaskSet {
  weeks: Array<{
    week: number;
    theme: string;
    tasks: string[];
  }>;
}

// ============================================================================
// AI CONFIGURATION
// ============================================================================

const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || "";
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "https://api.z.ai/api/anthropic/v1";

// ============================================================================
// 1. SAVE PROFILE TO SUPABASE
// ============================================================================

export async function saveProfilingResult(
  userId: string,
  answers: Record<ProfilingQuestionId, string>,
  scores: ProfileScores,
  segment: SegmentTag,
  primaryPath: PathId,
  alternatePath: PathId | null,
  eliminatedPaths: PathId[],
  pathScores: Record<string, number>,
  answerTags?: Record<string, string>
): Promise<{ profileId: string; error: string | null }> {
  // Deactivate any existing active profile
  await supabase
    .from("user_profiles_intent")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_active", true);

  // Insert new profile
  const { data, error } = await supabase
    .from("user_profiles_intent")
    .insert({
      user_id: userId,
      answer_time: answers.time,
      answer_capital: answers.capital,
      answer_target_speed: answers.target_speed,
      answer_comfort: answers.work_style,           // DB column kept as "comfort", maps to work_style
      answer_risk: answers.risk,
      answer_skill: answers.skill_primary,           // DB column kept as "skill", maps to skill_primary
      answer_skill_secondary: answers.skill_secondary || "",
      answer_interest_market: answers.interest_market || "",
      answer_audience_access: answers.audience_access || "",
      answer_daily_routine: answers.daily_routine || "",
      answer_preferred_platform: answers.preferred_platform || "",
      score_time: scores.time,
      score_capital: scores.capital,
      score_target_speed: scores.target_speed,
      score_comfort: scores.work_style,              // DB column kept as "comfort", maps to work_style
      score_risk: scores.risk,
      score_skill: scores.skill_primary,             // DB column kept as "skill", maps to skill_primary
      score_skill_secondary: scores.skill_secondary,
      score_interest_market: scores.interest_market,
      score_audience_access: scores.audience_access,
      score_daily_routine: scores.daily_routine,
      score_preferred_platform: scores.preferred_platform,
      segment_tag: segment,
      primary_path: primaryPath,
      alternate_path: alternatePath,
      eliminated_paths: eliminatedPaths,
      path_scores: pathScores,
      answer_tags: (answerTags || {}) as unknown as Json,
      is_active: true,
      current_week: 1,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save profile:", error);
    return { profileId: "", error: error.message };
  }

  const profileId = data.id;

  // Initialize task rows
  const pathTemplate = getPathTemplate(primaryPath);
  if (pathTemplate) {
    await initializeTaskProgress(userId, profileId, pathTemplate);
  }

  return { profileId, error: null };
}

// ============================================================================
// 2. INITIALIZE TASK PROGRESS ROWS
// ============================================================================

async function initializeTaskProgress(
  userId: string,
  profileId: string,
  path: PathTemplate
): Promise<void> {
  const rows = path.weeklyPlan.flatMap((week) =>
    week.tasks.map((task, idx) => ({
      user_id: userId,
      profile_id: profileId,
      path_id: path.id,
      week_number: week.week,
      task_index: idx,
      task_text: task.text,
      is_completed: false,
    }))
  );

  const { error } = await supabase.from("user_path_progress").insert(rows);
  if (error) {
    console.error("Failed to initialize tasks:", error);
  }
}

// ============================================================================
// 3. AI — GENERATE PERSONALIZED "WHY TEXT"
// ============================================================================

export async function generateAIWhyText(
  userId: string,
  profileId: string,
  scores: ProfileScores,
  segment: SegmentTag,
  path: PathTemplate
): Promise<string> {
  const structuredContext = {
    segment,
    primary_path: path.id,
    path_title: path.title,
    path_description: path.description,
    user_scores: {
      time: scores.time,
      capital: scores.capital,
      target_speed: scores.target_speed,
      work_style: scores.work_style,
      risk: scores.risk,
      skill_primary: scores.skill_primary,
      skill_secondary: scores.skill_secondary,
      interest_market: scores.interest_market,
      audience_access: scores.audience_access,
      daily_routine: scores.daily_routine,
      preferred_platform: scores.preferred_platform,
    },
    path_money_source: path.moneySource,
    path_time_to_test: path.timeToTest,
    path_risk_if_fail: path.riskIfFail,
    path_ideal_for: path.idealFor,
  };

  // Generate sub-specialization for richer context
  const subSpec = generateSubSpecialization(path.id as PathId, scores, {} as Record<ProfilingQuestionId, string>);

  const prompt = `Kamu adalah AI Workflow Architect untuk platform IntentAI. User sudah menyelesaikan profiling mendalam dan sistem rule-based telah memilih jalur "${path.title}" sebagai jalur utama mereka.

SUB-SPESIALISASI YANG DIHASILKAN:
- Title: ${subSpec.title}
- Description: ${subSpec.description}
- Target Audience: ${subSpec.targetAudience}
- Income Estimate: ${subSpec.incomeEstimate}

PROFIL USER (structured state):
${JSON.stringify(structuredContext, null, 2)}

MAPPING SKOR:
- time: 1=<1jam, 2=1-2jam, 3=3-4jam, 4=>4jam per hari
- capital: 0=tanpa modal, 1=<$50, 2=$50-200, 3=$200-500
- target_speed: 1=dalam 7 hari, 2=dalam 2 minggu, 3=dalam 1 bulan, 4=1-3 bulan
- work_style: 1=tampil di kamera, 2=edit video tanpa muka, 3=menulis panjang, 4=konten pendek, 5=riset/analisa, 6=komunikasi/negosiasi, 7=kerja sendiri diam-diam
- risk: 1=sangat rendah, 2=rendah, 3=sedang, 4=tinggi
- skill_primary: 0=belum ada, 1=writing, 2=design, 3=marketing, 4=programming, 5=video production, 6=sales
- skill_secondary: 0=tidak ada, 1=basic writing, 2=basic design, 3=basic data, 4=social media savvy, 5=bahasa Inggris aktif
- interest_market: 1=health/fitness, 2=business, 3=education, 4=finance, 5=parenting, 6=gaming, 7=ecommerce, 8=real estate, 9=creative arts, 10=tech/SaaS
- audience_access: 0=nol, 1=<200, 2=200-1K, 3=1K-5K, 4=>5K
- daily_routine: 1=pagi awal, 2=pagi-siang, 3=siang-sore, 4=malam, 5=fleksibel
- preferred_platform: 1=TikTok/Reels, 2=YouTube, 3=Twitter/X, 4=LinkedIn, 5=Marketplace, 6=Website sendiri

TUGAS:
Tulis penjelasan 5-7 kalimat tentang KENAPA sub-spesialisasi "${subSpec.title}" paling cocok untuk user ini.
- Harus SPESIFIK merujuk profil mereka — sebutkan gaya kerja, skill, market interest, platform pilihan, dan kondisi mereka
- Jelaskan koneksi logis antara profil → sub-spesialisasi → potensi income
- Sebutkan keuntungan kompetitif user berdasarkan kombinasi UNIK skill + market + platform mereka
- Berikan 1-2 insight spesifik yang membuat user merasa "ini memang untuk saya"
- Jika user belum punya pengalaman digital, acknowledge itu dan jelaskan kenapa jalur ini tetap bisa dimulai
- Jika user punya hambatan (waktu terbatas, takut gagal, dll), address itu secara langsung
- Bahasa Indonesia natural, nada percaya diri tapi realistis
- JANGAN mulai dengan "Berdasarkan profil kamu" — langsung ke insight tajam

OUTPUT: Hanya teks penjelasan. Tanpa heading, tanpa markdown.`;

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
        model: "claude-3-sonnet-20240229",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json();
    const whyText = data.content?.[0]?.text || "";
    const processingTime = Date.now() - startTime;

    // Save to profile
    await supabase
      .from("user_profiles_intent")
      .update({ ai_why_text: whyText, updated_at: new Date().toISOString() })
      .eq("id", profileId);

    // Log AI call
    await supabase.from("ai_personalization_log").insert({
      user_id: userId,
      profile_id: profileId,
      request_type: "why_text",
      ai_input: structuredContext as unknown as Json,
      ai_output: whyText,
      processing_time_ms: processingTime,
    });

    return whyText;
  } catch (err) {
    console.error("AI why text generation failed:", err);
    return "";
  }
}

// ============================================================================
// 4. AI — GENERATE PERSONALIZED WEEKLY TASKS
// ============================================================================

export async function generateAICustomTasks(
  userId: string,
  profileId: string,
  scores: ProfileScores,
  segment: SegmentTag,
  path: PathTemplate
): Promise<CustomTaskSet | null> {
  // Helper: decode work_style score to label
  const workStyleLabels: Record<number, string> = {
    1: "tampil di kamera", 2: "edit video tanpa muka", 3: "menulis panjang",
    4: "konten pendek/viral", 5: "riset & analisa", 6: "komunikasi & negosiasi", 7: "kerja sendiri diam-diam",
  };
  const skillLabels: Record<number, string> = {
    0: "pemula total", 1: "writing/copywriting", 2: "design/visual", 3: "marketing/ads",
    4: "programming/tech", 5: "video production", 6: "sales/komunikasi",
  };
  const marketLabels: Record<number, string> = {
    1: "health & fitness", 2: "business & entrepreneurship", 3: "education & learning",
    4: "personal finance", 5: "parenting & family", 6: "gaming & entertainment",
    7: "e-commerce & produk fisik", 8: "real estate & properti", 9: "creative arts & design",
    10: "tech, SaaS & software",
  };

  const platformLabels: Record<number, string> = {
    1: "TikTok/Instagram Reels", 2: "YouTube", 3: "Twitter/X",
    4: "LinkedIn", 5: "Marketplace (Fiverr/Upwork)", 6: "Website/Blog sendiri",
  };

  // Generate sub-specialization for task context
  const subSpec = generateSubSpecialization(path.id as PathId, scores, {} as Record<ProfilingQuestionId, string>);

  const structuredContext = {
    segment,
    primary_path: path.id,
    path_title: path.title,
    sub_specialization: subSpec.title,
    user_scores: {
      time: scores.time,
      capital: scores.capital,
      target_speed: scores.target_speed,
      work_style: scores.work_style,
      risk: scores.risk,
      skill_primary: scores.skill_primary,
      skill_secondary: scores.skill_secondary,
      interest_market: scores.interest_market,
      audience_access: scores.audience_access,
      daily_routine: scores.daily_routine,
      preferred_platform: scores.preferred_platform,
    },
    base_weekly_plan: path.weeklyPlan,
    path_examples: path.examples,
    path_avoid: path.avoid,
  };

  const prompt = `Kamu adalah AI Workflow Architect untuk IntentAI. User dipilihkan jalur "${path.title}" dengan sub-spesialisasi "${subSpec.title}" oleh constraint engine.

SUB-SPESIALISASI USER:
- Title: ${subSpec.title}
- Deskripsi: ${subSpec.description}
- Contoh deliverable: ${subSpec.examples.join(", ")}
- Tools: ${subSpec.tools.join(", ")}
- Target audience: ${subSpec.targetAudience}
- Income estimate: ${subSpec.incomeEstimate}

PROFIL LENGKAP USER:
${JSON.stringify(structuredContext.user_scores, null, 2)}

DECODED PROFIL:
- Waktu: ${scores.time <= 2 ? 'terbatas (' + scores.time + ')' : 'cukup (' + scores.time + ')'}
- Modal: ${scores.capital === 0 ? 'nol' : scores.capital <= 1 ? 'minimal' : 'tersedia'}
- Gaya kerja: ${workStyleLabels[scores.work_style] || 'general'}
- Skill utama: ${skillLabels[scores.skill_primary] || 'general'}
- Market interest: ${marketLabels[scores.interest_market] || 'general'}
- Platform pilihan: ${platformLabels[scores.preferred_platform] || 'general'}
- Audience: ${scores.audience_access === 0 ? 'belum ada' : scores.audience_access <= 2 ? 'kecil' : 'sudah ada'}
- Waktu kerja: ${scores.daily_routine === 1 ? 'pagi awal' : scores.daily_routine === 2 ? 'pagi-siang' : scores.daily_routine === 3 ? 'siang-sore' : scores.daily_routine === 4 ? 'malam' : 'fleksibel'}

TEMPLATE DASAR ROADMAP (untuk referensi struktur):
${JSON.stringify(path.weeklyPlan.map(w => ({ week: w.week, title: w.title, task_count: w.tasks.length })), null, 2)}

TUGAS:
Personalisasi roadmap 30 hari berdasarkan sub-spesialisasi "${subSpec.title}" dan PROFIL SPESIFIK user ini.

ATURAN KETAT:
1. Tetap 4 minggu, masing-masing 4-5 task
2. SEMUA task harus dalam konteks sub-spesialisasi "${subSpec.title}" — bukan generic
3. Task harus SANGAT SPESIFIK — sebutkan:
   - Tool/platform KONKRET (contoh: "Buat 3 carousel di Canva", bukan "Buat konten")
   - ANGKA TARGET (contoh: "Outreach ke 15 prospect", bukan "Hubungi calon client")
   - NICHE SPESIFIK sesuai: ${marketLabels[scores.interest_market] || 'general'}
   - PLATFORM UTAMA: ${platformLabels[scores.preferred_platform] || 'general'}
4. Sesuaikan dengan waktu: ${scores.time <= 1 ? 'SANGAT TERBATAS — setiap task max 30 menit' : scores.time <= 2 ? 'TERBATAS — setiap task max 1 jam' : 'CUKUP — task bisa lebih detail'}
5. Sesuaikan dengan gaya kerja: ${workStyleLabels[scores.work_style] || 'general'} — task harus sesuai style ini
6. Sesuaikan dengan skill: ${skillLabels[scores.skill_primary] || 'pemula'} — leverage skill ini
7. Modal ${scores.capital === 0 ? 'NOL — hanya tool gratis' : scores.capital <= 1 ? 'minimal — tool murah/free tier only' : 'tersedia — boleh tool berbayar'}
8. Audience ${scores.audience_access === 0 ? 'NOL — include task build audience' : 'SUDAH ADA — langsung monetize'}
9. Setiap task harus bisa diselesaikan dalam 1 sesi kerja
10. Task week 1 harus onboarding/setup SPESIFIK untuk "${subSpec.title}"

FORMAT OUTPUT (strict JSON only, tanpa markdown wrapper):
{
  "weeks": [
    { "week": 1, "theme": "...", "tasks": ["task1 yang sangat spesifik", "task2", "task3", "task4"] },
    { "week": 2, "theme": "...", "tasks": ["task1", "task2", "task3", "task4"] },
    { "week": 3, "theme": "...", "tasks": ["task1", "task2", "task3", "task4"] },
    { "week": 4, "theme": "...", "tasks": ["task1", "task2", "task3", "task4"] }
  ]
}`;

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
        model: "claude-3-sonnet-20240229",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json();
    const rawOutput = data.content?.[0]?.text || "";
    const processingTime = Date.now() - startTime;

    // Parse JSON from AI output (handle potential markdown wrapping)
    let customTasks: CustomTaskSet;
    try {
      const jsonStr = rawOutput.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      customTasks = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI tasks JSON:", rawOutput);
      return null;
    }

    // Save to profile
    await supabase
      .from("user_profiles_intent")
      .update({ ai_custom_tasks: customTasks as unknown as Json, updated_at: new Date().toISOString() })
      .eq("id", profileId);

    // Update task rows with AI-personalized text
    for (const week of customTasks.weeks) {
      for (let i = 0; i < week.tasks.length; i++) {
        await supabase
          .from("user_path_progress")
          .update({ task_text: week.tasks[i] })
          .eq("profile_id", profileId)
          .eq("week_number", week.week)
          .eq("task_index", i);
      }
    }

    // Log AI call
    await supabase.from("ai_personalization_log").insert({
      user_id: userId,
      profile_id: profileId,
      request_type: "custom_tasks",
      ai_input: structuredContext as unknown as Json,
      ai_output: rawOutput,
      processing_time_ms: processingTime,
    });

    return customTasks;
  } catch (err) {
    console.error("AI custom tasks generation failed:", err);
    return null;
  }
}

// ============================================================================
// 5. AI — GENERATE NICHE SUGGESTION
// ============================================================================

export async function generateAINicheSuggestion(
  userId: string,
  profileId: string,
  scores: ProfileScores,
  segment: SegmentTag,
  path: PathTemplate
): Promise<string> {
  // Helper labels for readable prompt
  const workStyleLabels: Record<number, string> = {
    1: "tampil di kamera", 2: "edit video tanpa muka", 3: "menulis panjang",
    4: "konten pendek/viral", 5: "riset & analisa", 6: "komunikasi & negosiasi", 7: "kerja sendiri diam-diam",
  };
  const skillLabels: Record<number, string> = {
    0: "pemula", 1: "writing", 2: "design", 3: "marketing", 4: "programming", 5: "video production", 6: "sales",
  };
  const marketLabels: Record<number, string> = {
    1: "health & fitness", 2: "business", 3: "education", 4: "personal finance",
    5: "parenting", 6: "gaming", 7: "e-commerce", 8: "real estate", 9: "creative arts", 10: "tech/SaaS",
  };

  const platformLabelsNiche: Record<number, string> = {
    1: "TikTok/Instagram Reels", 2: "YouTube", 3: "Twitter/X",
    4: "LinkedIn", 5: "Marketplace (Fiverr/Upwork)", 6: "Website/Blog sendiri",
  };

  // Generate sub-specialization for niche context
  const subSpecNiche = generateSubSpecialization(path.id as PathId, scores, {} as Record<ProfilingQuestionId, string>);

  const prompt = `Kamu adalah AI Workflow Architect untuk IntentAI. User dipilihkan jalur "${path.title}" dengan sub-spesialisasi "${subSpecNiche.title}".

SUB-SPESIALISASI YANG DIHASILKAN SISTEM:
- Title: ${subSpecNiche.title}
- Deskripsi: ${subSpecNiche.description}
- Contoh: ${subSpecNiche.examples.join(", ")}

PROFIL LENGKAP:
- Waktu: ${scores.time} (1=<1jam, 4=>4jam)
- Modal: ${scores.capital} (0=nol, 3=$200-500)
- Gaya kerja: ${workStyleLabels[scores.work_style] || 'general'}
- Skill utama: ${skillLabels[scores.skill_primary] || 'pemula'}
- Skill tambahan: ${scores.skill_secondary > 0 ? 'ada' : 'tidak ada'}
- Market interest: ${marketLabels[scores.interest_market] || 'general'}
- Platform pilihan: ${platformLabelsNiche[scores.preferred_platform] || 'general'}
- Audience: ${scores.audience_access === 0 ? 'nol' : scores.audience_access <= 2 ? 'kecil' : 'sudah ada'}
- Risk: ${scores.risk} (1=sangat rendah, 4=tinggi)
- Segment: ${segment}
- Waktu kerja: ${scores.daily_routine === 1 ? 'pagi awal' : scores.daily_routine === 2 ? 'pagi-siang' : scores.daily_routine === 3 ? 'siang-sore' : scores.daily_routine === 4 ? 'malam' : 'fleksibel'}

CONTOH YANG BISA DIKERJAKAN DI JALUR INI:
${path.examples.join(", ")}

TUGAS: Rekomendasikan 1 NICHE SUPER SPESIFIK yang lebih tajam dari "${subSpecNiche.title}".

ATURAN:
- HARUS sangat spesifik — bukan "${subSpecNiche.title}" tapi SUB-NICHE dari itu
  Contoh: jika sub-spesialisasi = "AI Health Copywriter", maka niche = "AI Copywriter khusus landing page supplement protein & pre-workout untuk brand fitness Indonesia"
- Niche harus KOMBINASI dari: market interest (${marketLabels[scores.interest_market]}) + gaya kerja (${workStyleLabels[scores.work_style]}) + platform (${platformLabelsNiche[scores.preferred_platform] || 'any'}) + jalur (${path.title})
- Jelaskan KENAPA niche ini cocok: hubungkan skill, waktu, modal, dan platform user
- Sebutkan 3 LANGKAH PERTAMA yang bisa dilakukan HARI INI (super actionable, tool-specific, platform-specific)
- Estimasi potensi income bulan pertama (range realistis)
- Sebutkan 1 kompetitor/contoh sukses di niche ini sebagai benchmark

FORMAT: 4 paragraf pendek. Bahasa Indonesia. Tanpa heading/markdown.`;

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
        model: "claude-3-sonnet-20240229",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json();
    const suggestion = data.content?.[0]?.text || "";
    const processingTime = Date.now() - startTime;

    await supabase
      .from("user_profiles_intent")
      .update({ ai_niche_suggestion: suggestion, updated_at: new Date().toISOString() })
      .eq("id", profileId);

    await supabase.from("ai_personalization_log").insert({
      user_id: userId,
      profile_id: profileId,
      request_type: "niche_suggestion",
      ai_input: { scores, segment, path_id: path.id } as unknown as Json,
      ai_output: suggestion,
      processing_time_ms: processingTime,
    });

    return suggestion;
  } catch (err) {
    console.error("AI niche suggestion failed:", err);
    return "";
  }
}

// ============================================================================
// 6. LOAD ACTIVE PROFILE FROM SUPABASE
// ============================================================================

// ── DEV MODE: must match AuthContext DEV_BYPASS_AUTH ──
const DEV_BYPASS_AUTH = false;

const DEV_MOCK_SAVED_PROFILE: SavedProfile = {
  id: "dev-profile-00000000",
  user_id: "dev-user-00000000-0000-0000-0000-000000000000",
  primary_path: "freelance_upgrade",
  alternate_path: "micro_service",
  segment_tag: "skill_leverage",
  eliminated_paths: ["high_risk_speculative"],
  scores: {
    time: 3, capital: 2, target_speed: 3, work_style: 4,
    risk: 2, skill_primary: 4, skill_secondary: 3,
    interest_market: 3, audience_access: 1,
    daily_routine: 2, preferred_platform: 3,
  },
  ai_why_text: "Berdasarkan profil kamu — skill design yang sudah ada di level intermediate, pengalaman 2+ tahun freelance, dan target income Rp 5-15 juta/bulan — jalur AI Freelance Upgrade adalah pilihan paling realistis. Kamu tidak perlu belajar skill baru. Yang perlu dilakukan adalah memperkuat workflow yang sudah ada dengan AI tools sehingga bisa menaikkan harga 2-3x sambil memangkas waktu delivery. Dengan waktu 1-2 jam per hari, kamu bisa mulai uji coba di minggu pertama tanpa mengganggu project yang sedang berjalan.",
  ai_custom_tasks: null,
  ai_niche_suggestion: "Fokus di sub-niche 'AI-Enhanced Brand Identity Design' — demand tinggi, kompetisi masih rendah di Indonesia. Target client: startup & UMKM yang butuh branding profesional tapi budget terbatas. Kamu bisa tawarkan package brand identity (logo + guidelines + social media templates) dengan harga Rp 3-5 juta per package, delivery 3-5 hari dengan bantuan AI.",
  current_week: 1,
  is_active: true,
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
};

// Attach answer_tags as extra property (Dashboard reads it via `as any`)
(DEV_MOCK_SAVED_PROFILE as any).answer_tags = {
  profile_level: "quick",
  economic_model: "skill_service",
  niche: "design",
  sub_sector: "brand_identity",
  platform: "instagram",
  current_stage: "freelancer",
  digital_experience: "intermediate",
  language_skill: "bilingual",
  income_target: "5_15jt",
  tools_familiarity: "intermediate",
  biggest_challenge: "no_direction",
  weekly_commitment: "1_2_hours",
  learning_style: "practice",
};

export async function loadActiveProfile(userId: string): Promise<SavedProfile | null> {
  // DEV MODE: return mock profile so dashboard renders fully
  if (DEV_BYPASS_AUTH) {
    return DEV_MOCK_SAVED_PROFILE;
  }

  const { data, error } = await supabase
    .from("user_profiles_intent")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    primary_path: data.primary_path,
    alternate_path: data.alternate_path,
    segment_tag: data.segment_tag,
    eliminated_paths: data.eliminated_paths || [],
    scores: {
      time: data.score_time,
      capital: data.score_capital,
      target_speed: data.score_target_speed,
      work_style: data.score_comfort,           // DB column "comfort" maps to work_style
      risk: data.score_risk,
      skill_primary: data.score_skill,           // DB column "skill" maps to skill_primary
      skill_secondary: data.score_skill_secondary ?? 0,
      interest_market: data.score_interest_market ?? 1,
      audience_access: data.score_audience_access ?? 0,
      daily_routine: data.score_daily_routine ?? 1,
      preferred_platform: data.score_preferred_platform ?? 1,
    },
    ai_why_text: data.ai_why_text,
    ai_custom_tasks: data.ai_custom_tasks as unknown as CustomTaskSet | null,
    ai_niche_suggestion: data.ai_niche_suggestion,
    current_week: data.current_week,
    is_active: data.is_active,
    created_at: data.created_at,
  };
}

// ============================================================================
// 7. LOAD TASK PROGRESS FROM SUPABASE
// ============================================================================

export async function loadTaskProgress(
  profileId: string
): Promise<TaskProgress[]> {
  // DEV MODE: generate tasks from the path template
  if (DEV_BYPASS_AUTH) {
    const pathTemplate = getPathTemplate(DEV_MOCK_SAVED_PROFILE.primary_path as any);
    if (!pathTemplate) return [];
    return pathTemplate.weeklyPlan.flatMap((week) =>
      week.tasks.map((task, idx) => ({
        path_id: pathTemplate.id,
        week_number: week.week,
        task_index: idx,
        task_text: task.text,
        is_completed: false,
        completed_at: null,
      }))
    );
  }

  const { data, error } = await supabase
    .from("user_path_progress")
    .select("path_id, week_number, task_index, task_text, is_completed, completed_at")
    .eq("profile_id", profileId)
    .order("week_number", { ascending: true })
    .order("task_index", { ascending: true });

  if (error || !data) return [];
  return data as TaskProgress[];
}

// ============================================================================
// 8. TOGGLE TASK COMPLETION (with auto-advance)
// ============================================================================

export async function toggleTaskCompletion(
  profileId: string,
  weekNumber: number,
  taskIndex: number,
  isCompleted: boolean
): Promise<{ advanced: boolean; newWeek: number | null }> {
  // DEV MODE: just return success without DB write
  if (DEV_BYPASS_AUTH) {
    return { advanced: false, newWeek: null };
  }

  const { error } = await supabase
    .from("user_path_progress")
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq("profile_id", profileId)
    .eq("week_number", weekNumber)
    .eq("task_index", taskIndex);

  if (error) {
    console.error("Failed to toggle task:", error);
    return { advanced: false, newWeek: null };
  }

  // Auto-advance check: if marking as complete, check if all tasks in week are done
  if (isCompleted) {
    const result = await checkAndAdvanceWeek(profileId, weekNumber);
    return result;
  }

  return { advanced: false, newWeek: null };
}

// ============================================================================
// 8b. AUTO-ADVANCE WEEK ENGINE
// ============================================================================

export async function checkAndAdvanceWeek(
  profileId: string,
  weekNumber: number
): Promise<{ advanced: boolean; newWeek: number | null }> {
  // Get all tasks for this week
  const { data: weekTasks, error } = await supabase
    .from("user_path_progress")
    .select("is_completed")
    .eq("profile_id", profileId)
    .eq("week_number", weekNumber);

  if (error || !weekTasks || weekTasks.length === 0) {
    return { advanced: false, newWeek: null };
  }

  const allComplete = weekTasks.every((t) => t.is_completed);
  if (!allComplete) {
    return { advanced: false, newWeek: null };
  }

  // All tasks in this week are complete — get current profile week
  const { data: profile } = await supabase
    .from("user_profiles_intent")
    .select("current_week")
    .eq("id", profileId)
    .single();

  if (!profile) return { advanced: false, newWeek: null };

  // Only advance if the completed week is the current active week, and not beyond week 4
  if (weekNumber === profile.current_week && profile.current_week < 4) {
    const newWeek = profile.current_week + 1;
    await supabase
      .from("user_profiles_intent")
      .update({ current_week: newWeek, updated_at: new Date().toISOString() })
      .eq("id", profileId);

    return { advanced: true, newWeek };
  }

  return { advanced: false, newWeek: null };
}

// ============================================================================
// 8c. RISK CONTROL — Psychological Safety Helpers
// ============================================================================

export interface RiskSignals {
  daysSinceStart: number;
  isDay25Warning: boolean;           // 30-day no-validation warning at day 25
  noMarketWeeks: number;             // consecutive weeks with market_response = false
  shouldSuggestPivot: boolean;       // market_response = false for 2+ weeks
  isRealityCheckWeek: boolean;       // week 3-4 → show reality check
  currentWeek: number;
  completionRate: number;
  hasAnyMarketResponse: boolean;     // ever got a positive market response
}

export function computeRiskSignals(
  profile: SavedProfile,
  tasks: TaskProgress[],
  checkpoints: CheckpointHistory[]
): RiskSignals {
  // Days since profile creation
  const createdAt = new Date(profile.created_at);
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // Check if any checkpoint ever had positive market response
  const hasAnyMarketResponse = checkpoints.some((cp) => cp.market_response === true);

  // 30-day warning: day >= 25 and never got market validation
  const isDay25Warning = daysSinceStart >= 25 && !hasAnyMarketResponse;

  // Count consecutive weeks with market_response = false (from most recent)
  let noMarketWeeks = 0;
  for (let i = checkpoints.length - 1; i >= 0; i--) {
    if (checkpoints[i].market_response === false) {
      noMarketWeeks++;
    } else break;
  }

  // Pivot suggestion if 2+ weeks with no market response
  const shouldSuggestPivot = noMarketWeeks >= 2;

  // Reality check at week 3-4
  const isRealityCheckWeek = profile.current_week >= 3;

  // Overall completion rate
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.is_completed).length;
  const completionRate = totalTasks > 0 ? completedCount / totalTasks : 0;

  return {
    daysSinceStart,
    isDay25Warning,
    noMarketWeeks,
    shouldSuggestPivot,
    isRealityCheckWeek,
    currentWeek: profile.current_week,
    completionRate,
    hasAnyMarketResponse,
  };
}

// Anti-sunk cost messages — rotated based on context
export const ANTI_SUNK_COST_MESSAGES = [
  {
    title: "Pivoting ≠ Gagal",
    message: "70% pengusaha sukses melakukan pivot setidaknya sekali. Yang penting bukan berapa kali kamu ganti arah, tapi seberapa cepat kamu belajar dari setiap percobaan.",
    emoji: "🔄",
  },
  {
    title: "Waktu yang Sudah Dihabiskan Bukan Alasan untuk Tetap Bertahan",
    message: "Sunk cost fallacy adalah jebakan. 2 minggu effort di jalur yang salah lebih baik di-cut daripada 2 bulan lagi di jalur yang sama tanpa hasil.",
    emoji: "⏰",
  },
  {
    title: "Data > Perasaan",
    message: "Keputusan switch path bukan soal 'menyerah'. Ini soal membaca data: market belum merespon, skill gap terlalu besar, atau timing tidak tepat. Itu semua data valid.",
    emoji: "📊",
  },
  {
    title: "Setiap Path Memberi Skill Transferable",
    message: "Apapun yang sudah kamu pelajari di jalur ini — riset market, buat konten, setup tools — semuanya transferable ke jalur baru. Nothing is wasted.",
    emoji: "💡",
  },
];

export function getAntiSunkCostMessage(weekNumber: number): typeof ANTI_SUNK_COST_MESSAGES[0] {
  return ANTI_SUNK_COST_MESSAGES[weekNumber % ANTI_SUNK_COST_MESSAGES.length];
}

// ============================================================================
// 8d. LOAD PREVIOUS CHECKPOINTS (for adaptation context)
// ============================================================================

export async function loadPreviousCheckpoints(
  profileId: string
): Promise<CheckpointHistory[]> {
  // DEV MODE: return empty — no checkpoint history yet
  if (DEV_BYPASS_AUTH) return [];

  const { data, error } = await supabase
    .from("weekly_checkpoints")
    .select("week_number, completion_rate, self_report_status, stuck_area, market_response, system_adjustment, ai_feedback, created_at")
    .eq("profile_id", profileId)
    .order("week_number", { ascending: true });

  if (error || !data) return [];
  return data as CheckpointHistory[];
}

export interface CheckpointHistory {
  week_number: number;
  completion_rate: number;
  self_report_status: string | null;
  stuck_area: string | null;
  market_response: boolean | null;
  system_adjustment: string | null;
  ai_feedback: string | null;
  created_at: string;
}

// ============================================================================
// 8e. COMPUTE SYSTEM ADJUSTMENT
// ============================================================================

export type SystemAdjustment = "continue" | "simplify" | "accelerate" | "adjust_niche" | "pivot_path";

export interface AdaptationResult {
  adjustment: SystemAdjustment;
  reason: string;
  suggestion: string;
}

export function computeSystemAdjustment(
  currentCompletion: number,
  selfReport: "on_track" | "stuck" | "ahead",
  previousCheckpoints: CheckpointHistory[],
  marketResponse?: boolean
): AdaptationResult {
  const stuckWeeks = previousCheckpoints.filter(
    (cp) => cp.self_report_status === "stuck" || (cp.completion_rate < 0.5)
  ).length;

  const consecutiveStuck = (() => {
    let count = 0;
    for (let i = previousCheckpoints.length - 1; i >= 0; i--) {
      if (previousCheckpoints[i].self_report_status === "stuck" || previousCheckpoints[i].completion_rate < 0.5) {
        count++;
      } else break;
    }
    // Include current if stuck
    if (selfReport === "stuck" || currentCompletion < 0.5) count++;
    return count;
  })();

  // RULE 1: Stuck for 2+ consecutive weeks → suggest pivot
  if (consecutiveStuck >= 2) {
    return {
      adjustment: "pivot_path",
      reason: `Stuck selama ${consecutiveStuck} minggu berturut-turut`,
      suggestion: "Pertimbangkan untuk pivot ke jalur alternatif. Mungkin jalur ini tidak cocok dengan situasi kamu saat ini. Kamu bisa re-profiling atau switch ke jalur alternatif yang sudah disarankan.",
    };
  }

  // RULE 2: Completion < 50% → suggest simplification
  if (currentCompletion < 0.5) {
    return {
      adjustment: "simplify",
      reason: `Completion rate rendah (${Math.round(currentCompletion * 100)}%)`,
      suggestion: "Task minggu ini mungkin terlalu berat. Fokus ke 2 task paling penting dulu, skip yang lain. Kualitas > kuantitas di tahap ini.",
    };
  }

  // RULE 3: Completion > 90% + ahead → suggest acceleration
  if (currentCompletion > 0.9 && selfReport === "ahead") {
    return {
      adjustment: "accelerate",
      reason: `Progress sangat bagus (${Math.round(currentCompletion * 100)}%) dan kamu merasa ahead`,
      suggestion: "Kamu di atas rata-rata! Pertimbangkan untuk mulai task minggu depan lebih awal, atau eksplorasi niche yang lebih spesifik untuk meningkatkan income potential.",
    };
  }

  // RULE 4: Market response negative for 2+ weeks → suggest niche adjustment
  const noMarketResponse = previousCheckpoints.filter((cp) => cp.market_response === false).length;
  if (marketResponse === false && noMarketResponse >= 1) {
    return {
      adjustment: "adjust_niche",
      reason: "Belum ada respon market selama 2+ minggu",
      suggestion: "Market belum merespon. Coba tweak niche: ubah angle, target audience yang lebih spesifik, atau coba platform berbeda. Jangan ganti jalur total — cukup sesuaikan sudut pandang.",
    };
  }

  // DEFAULT: Continue as normal
  return {
    adjustment: "continue",
    reason: `Progress on track (${Math.round(currentCompletion * 100)}%)`,
    suggestion: "Tetap konsisten. Progress kamu sudah di jalur yang benar.",
  };
}

// ============================================================================
// 9. RESET PROFILE (deactivate current, allow new profiling)
// ============================================================================

export async function resetProfile(userId: string): Promise<void> {
  // DEV MODE: no-op
  if (DEV_BYPASS_AUTH) return;

  const { error } = await supabase
    .from("user_profiles_intent")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    console.error("Failed to reset profile:", error);
  }
}

// ============================================================================
// 10. SAVE WEEKLY CHECKPOINT (with adaptation engine)
// ============================================================================

export async function saveWeeklyCheckpoint(
  userId: string,
  profileId: string,
  weekNumber: number,
  completionRate: number,
  selfReport: "on_track" | "stuck" | "ahead",
  stuckArea?: string,
  marketResponse?: boolean
): Promise<{ feedback: string; adaptation: AdaptationResult }> {
  // DEV MODE: return mock feedback without DB write
  if (DEV_BYPASS_AUTH) {
    const adaptation: AdaptationResult = { adjustment: "continue", reason: "Dev mode", suggestion: "Lanjutkan eksekusi sesuai rencana." };
    return {
      feedback: "DEV MODE — Checkpoint diterima. Progress kamu di jalur yang benar. Lanjutkan eksekusi minggu ini, fokus pada task yang belum selesai. Pastikan setiap deliverable ter-dokumentasi.",
      adaptation,
    };
  }

  // Load previous checkpoints for context
  const previousCheckpoints = await loadPreviousCheckpoints(profileId);

  // Compute system adjustment
  const adaptation = computeSystemAdjustment(
    completionRate, selfReport, previousCheckpoints, marketResponse
  );

  // Save checkpoint with system_adjustment
  const { error } = await supabase
    .from("weekly_checkpoints")
    .upsert({
      user_id: userId,
      profile_id: profileId,
      week_number: weekNumber,
      completion_rate: completionRate,
      self_report_status: selfReport,
      stuck_area: stuckArea || null,
      market_response: marketResponse ?? null,
      system_adjustment: adaptation.adjustment,
    });

  if (error) {
    console.error("Failed to save checkpoint:", error);
    return { feedback: "", adaptation };
  }

  // Generate AI feedback with adaptation context + previous checkpoints
  const feedback = await generateWeeklyFeedback(
    userId, profileId, weekNumber, completionRate, selfReport, stuckArea, previousCheckpoints, adaptation
  );

  return { feedback, adaptation };
}

// ============================================================================
// 11. AI — WEEKLY FEEDBACK (with adaptation context)
// ============================================================================

async function generateWeeklyFeedback(
  userId: string,
  profileId: string,
  weekNumber: number,
  completionRate: number,
  selfReport: string,
  stuckArea?: string,
  previousCheckpoints?: CheckpointHistory[],
  adaptation?: AdaptationResult
): Promise<string> {
  const profile = await loadActiveProfile(userId);
  if (!profile) return "";

  const path = getPathTemplate(profile.primary_path as PathId);
  if (!path) return "";

  // Build previous weeks summary for AI context
  const historyContext = (previousCheckpoints && previousCheckpoints.length > 0)
    ? `\nHISTORI CHECKPOINT SEBELUMNYA:\n${previousCheckpoints.map(cp =>
        `- Minggu ${cp.week_number}: completion ${Math.round(cp.completion_rate * 100)}%, status: ${cp.self_report_status || 'N/A'}${cp.stuck_area ? `, stuck di: ${cp.stuck_area}` : ''}${cp.market_response !== null ? `, market response: ${cp.market_response ? 'ada' : 'belum'}` : ''}${cp.system_adjustment ? `, adjustment: ${cp.system_adjustment}` : ''}`
      ).join('\n')}`
    : '';

  // Build adaptation context
  const adaptationContext = adaptation
    ? `\nSYSTEM ADAPTATION DECISION:
- Adjustment: ${adaptation.adjustment}
- Alasan: ${adaptation.reason}
- Saran sistem: ${adaptation.suggestion}`
    : '';

  const prompt = `User sedang menjalani jalur "${path.title}", sekarang di minggu ${weekNumber} dari 4.

STATUS MINGGU INI:
- Completion rate: ${Math.round(completionRate * 100)}%
- Self-report: ${selfReport}
${stuckArea ? `- Stuck di: ${stuckArea}` : ""}
${historyContext}
${adaptationContext}

PROFIL USER:
- Waktu: ${profile.scores.time}/4, Modal: ${profile.scores.capital}/3, Risk: ${profile.scores.risk}/3
- Work style: ${profile.scores.work_style}/7, Skill: ${profile.scores.skill_primary}/6
- Market interest: ${profile.scores.interest_market}/10, Platform: ${profile.scores.preferred_platform}/6

TUGAS: Berikan feedback yang ADAPTIVE (4-5 kalimat):
1. Acknowledge progress mereka dengan konteks histori (jika ada pattern stuck/improving)
2. ${adaptation?.adjustment === 'simplify' ? 'User struggling — sarankan SIMPLIFIKASI: fokus 2 task utama, drop sisanya' : ''}
${adaptation?.adjustment === 'accelerate' ? 'User ahead — sarankan AKSELERASI: mulai task minggu depan atau eksplorasi niche lebih dalam' : ''}
${adaptation?.adjustment === 'pivot_path' ? 'User stuck terlalu lama — SARANKAN PIVOT: pertimbangkan jalur alternatif, jelaskan ini NORMAL dan bukan kegagalan' : ''}
${adaptation?.adjustment === 'adjust_niche' ? 'Market belum merespon — sarankan ADJUST NICHE: tweak sudut pandang, audience lebih spesifik, atau platform berbeda' : ''}
${adaptation?.adjustment === 'continue' ? 'User on track — berikan encouragement + hint spesifik untuk minggu depan' : ''}
3. Berikan 1 action item KONKRET yang bisa dilakukan HARI INI
4. Jika ada histori, referensikan perkembangan dari minggu ke minggu (improving/declining)
5. Sebutkan konteks jalur "${path.title}" — jangan generik

Bahasa Indonesia, nada supportive tapi realistis dan ACTIONABLE. Tanpa heading/markdown.`;

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
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);
    const data = await response.json();
    const feedback = data.content?.[0]?.text || "";
    const processingTime = Date.now() - startTime;

    // Save feedback to checkpoint
    await supabase
      .from("weekly_checkpoints")
      .update({ ai_feedback: feedback })
      .eq("profile_id", profileId)
      .eq("week_number", weekNumber);

    // Log
    await supabase.from("ai_personalization_log").insert({
      user_id: userId,
      profile_id: profileId,
      request_type: "weekly_feedback",
      ai_input: {
        weekNumber, completionRate, selfReport, stuckArea,
        previousCheckpoints: previousCheckpoints?.length || 0,
        adaptation: adaptation?.adjustment || "none",
      } as unknown as Json,
      ai_output: feedback,
      processing_time_ms: processingTime,
    });

    return feedback;
  } catch (err) {
    console.error("AI weekly feedback failed:", err);
    return "";
  }
}
