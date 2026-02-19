/**
 * Micro Scenario Test — Level 2 Profiling
 * ========================================
 * Fungsi: Validasi skill user dengan test praktis, bukan hanya self-assessment.
 * Tujuan: "Penyempurnaan skill" dan "Validasi kedalaman" dari INTENT_DOC.txt.
 *
 * Concept:
 * - User diberikan mini-scenario untuk dikerjakan
 * - System auto-score hasilnya
 * - Hasil dipakai untuk upgrade profil ke Level 2
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// ============================================================================
// TYPES
// ============================================================================

export interface ScenarioTest {
  id: string;
  /** Economic model yang sedang dijalankan user */
  economicModel: string;
  /** Sub-sektor user */
  subSector: string;
  /** Scenario yang harus diselesaikan */
  scenario: string;
  /** Instructions detail */
  instructions: string[];
  /** Resources yang disediakan */
  resources: ScenarioResource[];
  /** Batas waktu (menit) */
  timeLimitMinutes: number;
  /** Criteria untuk penilaian */
  evaluationCriteria: EvaluationCriterion[];
  /** Contoh jawaban yang baik */
  exampleAnswer?: string;
}

export interface ScenarioResource {
  type: "link" | "template" | "tool" | "guide";
  title: string;
  url?: string;
  content?: string;
}

export interface EvaluationCriterion {
  /** Aspect yang dinilai */
  aspect: string;
  /** Bobot (0-1) */
  weight: number;
  /** Cara menilai */
  rubric: {
    poor: string; // 0-40%
    fair: string; // 40-60%
    good: string; // 60-80%
    excellent: string; // 80-100%
  };
}

export interface ScenarioSubmission {
  userId: string;
  profileId: string;
  scenarioId: string;
  /** Jawaban user */
  answer: string;
  /** Waktu yang dipakai (detik) */
  timeTakenSeconds: number;
  /** Self-score (1-5) */
  selfScore: number;
  /** Timestamp */
  submittedAt: string;
}

export interface ScenarioEvaluation {
  submissionId: string;
  /** Score per aspect (0-100) */
  aspectScores: Record<string, number>;
  /** Total score (0-100) */
  totalScore: number;
  /** Feedback per aspect */
  feedback: Record<string, string>;
  /** Overall feedback */
  overallFeedback: string;
  /** Level recommendation */
  levelRecommendation: "beginner" | "intermediate" | "advanced" | "expert";
  /** Skill adjustments */
  skillAdjustments: {
    /** Skill yang terbukti kuat */
    provenStrengths: string[];
    /** Skill yang perlu ditingkatkan */
    skillGaps: string[];
  };
  /** Evaluated at */
  evaluatedAt: string;
}

// ============================================================================
// SCENARIO TEMPLATES — Per economic model
// ============================================================================

export function getScenarioTest(
  economicModel: string,
  subSector: string
): ScenarioTest | null {
  const scenarios: Record<string, ScenarioTest> = {
    // === SKILL SERVICE ===
    skill_service_design: {
      id: "ss_design_01",
      economicModel: "skill_service",
      subSector: "design",
      scenario: "Buat 3 konsep logo untuk startup 'FoodieGo' (app delivery food local)",
      instructions: [
        "Baca brief: FoodieGo adalah app delivery makanan lokal dengan target gen Z",
        "Target audience: 18-25 tahun, suka visual bold & colorful",
        "Buat 3 konsep logo berbeda dengan penjelasan singkat",
        "Upload hasil dalam format gambar atau tuliskan deskripsi detail",
      ],
      resources: [
        {
          type: "guide",
          title: "Panduan desain logo untuk startup",
          content: "Tips: Mulai dari keywords: food, speed, local, bold. Gunakan warna yang menarik untuk gen Z.",
        },
        {
          type: "tool",
          title: "Canva (free tier)",
          url: "https://www.canva.com",
        },
      ],
      timeLimitMinutes: 45,
      evaluationCriteria: [
        {
          aspect: "Kreativitas & orisinalitas",
          weight: 0.3,
          rubric: {
            poor: "Konsep generik, mirip logo lain",
            fair: "Ada ide menarik tapi belum kuat",
            good: "Konsep original dengan twist menarik",
            excellent: "Sangat kreatif, unexpected dan memorable",
          },
        },
        {
          aspect: "Relevansi dengan brand",
          weight: 0.3,
          rubric: {
            poor: "Tidak sesuai dengan brief sama sekali",
            fair: "Cukup sesuai tapi kurang mendalam",
            good: "Sesuai dengan brief & target audience",
            excellent: "Sangat relevan, capture brand essence dengan sempurna",
          },
        },
        {
          aspect: "Eksekusi visual",
          weight: 0.2,
          rubric: {
            poor: "Eksekusi kasar, tidak rapi",
            fair: "Eksekusi lumayan tapi belum professional",
            good: "Eksekusi rapi dan presentable",
            excellent: "Eksekusi professional, siap pakai",
          },
        },
        {
          aspect: "Presentasi & penjelasan",
          weight: 0.2,
          rubric: {
            poor: "Tidak ada penjelasan atau tidak jelas",
            fair: "Penjelasan singkat kurang detail",
            good: "Penjelasan jelas dengan reasoning",
            excellent: "Penjelasan sangat jelas, reasoned, dan persuasive",
          },
        },
      ],
    },

    skill_service_writing: {
      id: "ss_writing_01",
      economicModel: "skill_service",
      subSector: "writing",
      scenario: "Buat caption Instagram untuk brand skincare 'GlowUp' yang akan launch produk baru",
      instructions: [
        "Produk: Vitamin C Serum dengan harga Rp 150k",
        "Target: Wanita 20-30 tahun, concern dengan dark spot & glowing skin",
        "Buat 3 opsi caption dengan gaya berbeda (educational, emotional, promotional)",
        "Include hook, body, dan CTA",
      ],
      resources: [
        {
          type: "guide",
          title: "Template caption Instagram yang convert",
          content: "Hook: 3秒 grab attention. Body: Educational/storytelling. CTA: Clear & specific.",
        },
        {
          type: "link",
          title: "Contoh caption skincare brand yang baik",
          url: "https://www.instagram.com/somebrand/",
        },
      ],
      timeLimitMinutes: 30,
      evaluationCriteria: [
        {
          aspect: "Hook strength",
          weight: 0.3,
          rubric: {
            poor: "Hook lemah, tidak menarik perhatian",
            fair: "Hook cukup menarik tapi generic",
            good: "Hook kuat & relevant",
            excellent: "Hook sangat kuat, membuat orang ingin lanjut baca",
          },
        },
        {
          aspect: "Copywriting skill",
          weight: 0.3,
          rubric: {
            poor: "Copy kaku, tidak natural",
            fair: "Copy cukup oke tapi kurang engaging",
            good: "Copy engaging & on-brand",
            excellent: "Copy sangat engaging, persuasive, & memorable",
          },
        },
        {
          aspect: "Brand voice consistency",
          weight: 0.2,
          rubric: {
            poor: "Tidak ada brand voice yang jelas",
            fair: "Brand voice kurang konsisten",
            good: "Brand voice cukup konsisten",
            excellent: "Brand voice sangat konsisten & unique",
          },
        },
        {
          aspect: "CTA effectiveness",
          weight: 0.2,
          rubric: {
            poor: "CTA lemah atau tidak ada",
            fair: "CTA ada tapi kurang spesifik",
            good: "CTA jelas & spesifik",
            excellent: "CTA sangat compelling & actionable",
          },
        },
      ],
    },

    // === AUDIENCE BASED ===
    audience_based_content: {
      id: "ab_content_01",
      economicModel: "audience_based",
      subSector: "content_creator",
      scenario: "Buat outline video TikTok 60 detik tentang '5 Tips Belajar Efektif'",
      instructions: [
        "Target: Pelajar SMA/kuliah yang ingin belajar lebih efisien",
        "Buat outline dengan: hook (3 detik), poin utama (5 tips), dan CTA",
        "Tambahkan catatan visual/audio di setiap bagian",
      ],
      resources: [
        {
          type: "guide",
          title: "Struktur video TikTok yang viral",
          content: "Hook: Pattern interrupt, question, atau bold statement. Body: Fast-paced info. CTA: Follow untuk tips lain.",
        },
      ],
      timeLimitMinutes: 25,
      evaluationCriteria: [
        {
          aspect: "Hook quality",
          weight: 0.35,
          rubric: {
            poor: "Hook tidak menarik",
            fair: "Hook cukup menarik",
            good: "Hook kuat & stop-the-scroll",
            excellent: "Hook sangat kuat, impossible to scroll past",
          },
        },
        {
          aspect: "Content value",
          weight: 0.35,
          rubric: {
            poor: "Tips kurang berharga",
            fair: "Tips cukup berguna",
            good: "Tips sangat berguna & actionable",
            excellent: "Tips sangat valuable & belum banyak diketahui",
          },
        },
        {
          aspect: "Production planning",
          weight: 0.3,
          rubric: {
            poor: "Tidak ada planning visual/audio",
            fair: "Planning ada tapi kurang detail",
            good: "Planning cukup detail",
            excellent: "Planning sangat detail & professional",
          },
        },
      ],
    },

    // === DIGITAL PRODUCT ===
    digital_product_template: {
      id: "dp_template_01",
      economicModel: "digital_product",
      subSector: "template",
      scenario: "Buat struktur outline untuk ebook '30 Days Content Calendar for Small Business'",
      instructions: [
        "Target: Small business owners yang tidak punya waktu untuk content planning",
        "Buat outline lengkap: dari intro, 30 hari konten ide, hingga resources",
        "Jelaskan value proposition dari ebook ini",
      ],
      resources: [
        {
          type: "guide",
          title: "Cara buat ebook outline yang sell",
          content: "Structure: Problem → Solution → Action Plan → Resources. Make it actionable.",
        },
      ],
      timeLimitMinutes: 40,
      evaluationCriteria: [
        {
          aspect: "Structure & organization",
          weight: 0.4,
          rubric: {
            poor: "Struktur berantakan",
            fair: "Struktur cukup oke",
            good: "Struktur jelas & logical",
            excellent: "Struktur sangat solid & easy to follow",
          },
        },
        {
          aspect: "Value & uniqueness",
          weight: 0.3,
          rubric: {
            poor: "Tidak ada value yang jelas",
            fair: "Value cukup tapi generic",
            good: "Value jelas & useful",
            excellent: "Value sangat tinggi & unique di market",
          },
        },
        {
          aspect: "Actionability",
          weight: 0.3,
          rubric: {
            poor: "Konten tidak actionable",
            fair: "Cukup actionable tapi kurang detail",
            good: "Sangat actionable & praktis",
            excellent: "Extremely actionable, plug & play",
          },
        },
      ],
    },
  };

  const key = `${economicModel}_${subSector}`;
  return scenarios[key] || null;
}

// ============================================================================
// SUBMIT SCENARIO ANSWER
// ============================================================================

export async function submitScenarioAnswer(
  userId: string,
  profileId: string,
  scenarioId: string,
  answer: string,
  timeTakenSeconds: number,
  selfScore: number
): Promise<{ success: boolean; error?: string; submissionId?: string }> {
  try {
    const { data, error } = await supabase
      .from("scenario_submissions")
      .insert({
        user_id: userId,
        profile_id: profileId,
        scenario_id: scenarioId,
        answer,
        time_taken_seconds: timeTakenSeconds,
        self_score: selfScore,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, submissionId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================================================
// EVALUATE SCENARIO ANSWER (AI-Powered)
// ============================================================================

export async function evaluateScenarioAnswer(
  submissionId: string,
  scenarioId: string,
  answer: string,
  economicModel: string,
  subSector: string
): Promise<ScenarioEvaluation | null> {
  const scenario = getScenarioTest(economicModel, subSector);
  if (!scenario) return null;

  const apiKey = import.meta.env.VITE_AI_API_KEY || "";
  const baseUrl = import.meta.env.VITE_AI_BASE_URL || "https://api.z.ai/api/anthropic/v1";

  if (!apiKey) return null;

  // Build evaluation prompt
  const criteriaPrompt = scenario.evaluationCriteria
    .map((c, i) => `
${i + 1}. ${c.aspect} (weight: ${c.weight * 100}%)
   - Poor (0-40%): ${c.rubric.poor}
   - Fair (40-60%): ${c.rubric.fair}
   - Good (60-80%): ${c.rubric.good}
   - Excellent (80-100%): ${c.rubric.excellent}
  `).join("\n");

  const prompt = `Kamu adalah assesor ahli untuk skill test di platform IntentAI.

SCENARIO:
${scenario.scenario}

INSTRUCTIONS:
${scenario.instructions.map((inst, i) => `${i + 1}. ${inst}`).join("\n")}

USER ANSWER:
${answer}

EVALUATION CRITERIA:
${criteriaPrompt}

TASK:
Evaluasi jawaban user berdasarkan kriteria di atas.

OUTPUT FORMAT (JSON only):
{
  "aspectScores": {
    "${scenario.evaluationCriteria[0].aspect}": 75,
    "${scenario.evaluationCriteria[1].aspect}": 80,
    ...
  },
  "totalScore": 77,
  "feedback": {
    "${scenario.evaluationCriteria[0].aspect}": "Feedback spesifik...",
    "${scenario.evaluationCriteria[1].aspect}": "Feedback spesifik...",
    ...
  },
  "overallFeedback": "2-3 kalimat overall feedback yang constructive & actionable",
  "levelRecommendation": "beginner" | "intermediate" | "advanced" | "expert",
  "skillAdjustments": {
    "provenStrengths": ["skill1", "skill2"],
    "skillGaps": ["skill1", "skill2"]
  }
}

PENTING:
- Score harus sesuai dengan rubric yang diberikan
- Feedback harus spesifik & constructive, bukan generic
- Level recommendation harus realistis berdasarkan total score
- Skill adjustments harus berdasarkan evidence dari jawaban
- Output JSON only, no markdown wrapper`;

  try {
    const response = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("[ScenarioTest] AI evaluation failed:", response.status);
      return null;
    }

    const data = await response.json();
    const rawOutput = data.content?.[0]?.text || "";

    // Parse JSON
    let evaluation: ScenarioEvaluation;
    try {
      const jsonStr = rawOutput.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      evaluation = JSON.parse(jsonStr);
    } catch {
      console.error("[ScenarioTest] Failed to parse AI evaluation:", rawOutput);
      return null;
    }

    // Save to database
    const { error: saveError } = await supabase
      .from("scenario_evaluations")
      .insert({
        submission_id: submissionId,
        aspect_scores: evaluation.aspectScores as unknown as Json,
        total_score: evaluation.totalScore,
        feedback: evaluation.feedback as unknown as Json,
        overall_feedback: evaluation.overallFeedback,
        level_recommendation: evaluation.levelRecommendation,
        skill_adjustments: evaluation.skillAdjustments as unknown as Json,
        evaluated_at: new Date().toISOString(),
      });

    if (saveError) {
      console.error("[ScenarioTest] Failed to save evaluation:", saveError);
    }

    return evaluation;
  } catch (err) {
    console.error("[ScenarioTest] Evaluation error:", err);
    return null;
  }
}

// ============================================================================
// GET USER'S SCENARIO HISTORY
// ============================================================================

export async function getUserScenarioHistory(
  userId: string
): Promise<Array<{
  submissionId: string;
  scenarioId: string;
  totalScore: number;
  levelRecommendation: string;
  submittedAt: string;
}> | null> {
  try {
    const { data, error } = await supabase
      .from("scenario_evaluations")
      .select(`
        submission_id,
        scenario_id,
        total_score,
        level_recommendation,
        scenario_submissions!inner(
          submitted_at
        )
      `)
      .eq("scenario_submissions.user_id", userId)
      .order("scenario_submissions.submitted_at", { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      submissionId: row.submission_id,
      scenarioId: row.scenario_id,
      totalScore: row.total_score,
      levelRecommendation: row.level_recommendation,
      submittedAt: row.scenario_submissions.submitted_at,
    }));
  } catch (err) {
    console.error("[ScenarioTest] Failed to get history:", err);
    return null;
  }
}
