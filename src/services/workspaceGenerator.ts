/**
 * Workspace Generator Service — AI Content Generation Engine
 * =============================================================
 * Generates execution content inside the platform:
 * - Caption generator
 * - Hook generator
 * - Script generator (video/podcast)
 * - Visual prompt generator (for Grok/DALL-E/Midjourney/SD)
 * - Hashtag generator
 * - CTA generator
 * - Bio generator
 * - Content pillars generator
 * - Content calendar generator
 *
 * Uses Claude via z.ai proxy API
 */

// ============================================================================
// CONFIG
// ============================================================================

const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || "";
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "https://api.z.ai/api/anthropic/v1";

// ============================================================================
// TYPES
// ============================================================================

export type GeneratorType =
  | "caption"
  | "hook"
  | "script"
  | "visual_prompt"
  | "hashtag"
  | "cta"
  | "bio"
  | "content_pillars"
  | "content_calendar"
  | "first_post";

export interface GeneratorInput {
  type: GeneratorType;
  niche: string;
  subSector: string;
  platform: string;
  economicModel: string;
  tone?: string;
  topic?: string;
  targetAudience?: string;
  language?: string;
  additionalContext?: string;
}

export interface GeneratorOutput {
  type: GeneratorType;
  content: string;
  variants?: string[];
  metadata?: Record<string, string>;
}

// ============================================================================
// SYSTEM PROMPTS PER GENERATOR TYPE
// ============================================================================

const SYSTEM_PROMPTS: Record<GeneratorType, string> = {
  caption: `Kamu adalah AI caption writer profesional. Tugas kamu:
- Buat caption yang engaging dan conversion-focused
- Sesuaikan tone dengan platform dan niche
- Sertakan hook di baris pertama
- Sertakan CTA di akhir
- Format: Bahasa Indonesia, casual professional
- Output: 3 variasi caption (pendek, sedang, panjang)`,

  hook: `Kamu adalah AI hook writer. Tugas kamu:
- Buat 5 hook (kalimat pembuka) yang bikin orang berhenti scroll
- Pattern: curiosity, controversy, number, question, shock
- Sesuaikan dengan niche dan platform
- Bahasa Indonesia, punchy, to the point
- Output: 5 hook berbeda dengan label pattern-nya`,

  script: `Kamu adalah AI script writer untuk video/podcast. Tugas kamu:
- Buat script yang structured: Hook → Problem → Solution → CTA
- Durasi target: 60 detik untuk short-form, 5 menit untuk long-form
- Include timing markers
- Bahasa Indonesia, conversational
- Output: Full script dengan section markers`,

  visual_prompt: `Kamu adalah AI visual prompt engineer. Tugas kamu:
- Buat prompt untuk AI image generation (Midjourney/DALL-E/Grok/Stable Diffusion)
- Prompt harus detail: subject, style, lighting, composition, mood, color palette
- Sesuaikan visual style dengan niche dan brand
- Output: 3 prompt variants (untuk thumbnail, post visual, story visual)
- Format: English prompts (karena AI image tools pakai English)`,

  hashtag: `Kamu adalah AI hashtag researcher. Tugas kamu:
- Generate hashtag set yang optimal untuk reach dan engagement
- Mix: 5 high-volume + 5 medium + 5 niche-specific
- Sesuaikan dengan platform (IG max 30, TikTok max 5, Twitter max 3)
- Output: hashtag set dengan grouping dan usage tips`,

  cta: `Kamu adalah AI CTA (Call to Action) writer. Tugas kamu:
- Buat 5 CTA yang berbeda untuk skenario berbeda
- Types: follow, comment, save, share, click link, DM
- Sesuaikan dengan niche dan audience psychology
- Bahasa Indonesia, persuasive tapi tidak pushy
- Output: 5 CTA dengan label konteks penggunaan`,

  bio: `Kamu adalah AI bio writer untuk social media. Tugas kamu:
- Buat bio yang optimal untuk platform yang ditentukan
- Include: value proposition, niche clarity, social proof hint, CTA
- Format sesuai platform (IG 150 chars, TikTok, YouTube, LinkedIn)
- Output: 3 variasi bio dengan analisis`,

  content_pillars: `Kamu adalah AI content strategist. Tugas kamu:
- Tentukan 4-5 content pillars untuk niche yang diberikan
- Setiap pillar: nama, deskripsi, 3 contoh topik
- Seimbangkan: educational, entertaining, inspiring, promotional
- Sesuaikan dengan platform algorithm
- Output: 4-5 pillars dengan breakdown lengkap`,

  content_calendar: `Kamu adalah AI content planner. Tugas kamu:
- Buat content calendar 7 hari (1 minggu)
- Setiap hari: tipe konten, topik, content pillar, jam posting optimal
- Sesuaikan dengan niche, platform, dan audience timezone
- Mix format: carousel, video, story, text post
- Output: Tabel 7 hari dengan detail lengkap`,

  first_post: `Kamu adalah AI content creator assistant. Tugas kamu:
- Buat FIRST POST yang sempurna untuk akun baru
- Harus: introduce diri/brand, set expectation, create curiosity
- Include: caption + visual direction + hashtags
- Tone: confident tapi approachable
- Output: Full first post package (caption + visual prompt + hashtags)`,
};

// ============================================================================
// GENERATOR ENGINE
// ============================================================================

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!AI_API_KEY) {
    return "[AI API key belum dikonfigurasi. Set VITE_AI_API_KEY di .env]";
  }

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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return "[Gagal generate konten. Coba lagi nanti.]";
    }

    const data = await response.json();
    return data.content?.[0]?.text || "[Tidak ada output dari AI]";
  } catch (err) {
    console.error("AI call failed:", err);
    return "[Error koneksi ke AI. Periksa internet kamu.]";
  }
}

function buildUserPrompt(input: GeneratorInput): string {
  const parts: string[] = [];
  parts.push(`Niche: ${input.niche}`);
  parts.push(`Sub-sektor: ${input.subSector}`);
  parts.push(`Platform: ${input.platform}`);
  parts.push(`Model ekonomi: ${input.economicModel}`);

  if (input.topic) parts.push(`Topik spesifik: ${input.topic}`);
  if (input.targetAudience) parts.push(`Target audience: ${input.targetAudience}`);
  if (input.tone) parts.push(`Tone: ${input.tone}`);
  if (input.language) parts.push(`Bahasa: ${input.language}`);
  if (input.additionalContext) parts.push(`Konteks tambahan: ${input.additionalContext}`);

  return parts.join("\n");
}

/** Main generator function */
export async function generateContent(input: GeneratorInput): Promise<GeneratorOutput> {
  const systemPrompt = SYSTEM_PROMPTS[input.type];
  const userPrompt = buildUserPrompt(input);
  const content = await callAI(systemPrompt, userPrompt);

  return {
    type: input.type,
    content,
    metadata: {
      niche: input.niche,
      platform: input.platform,
      generatedAt: new Date().toISOString(),
    },
  };
}

/** Generate Day-1 Setup Package */
export async function generateDay1Setup(
  niche: string,
  subSector: string,
  platform: string,
  economicModel: string
): Promise<Record<GeneratorType, string>> {
  const baseInput: Omit<GeneratorInput, "type"> = {
    niche,
    subSector,
    platform,
    economicModel,
  };

  // Generate bio, content pillars, and first post in parallel
  const [bio, pillars, firstPost] = await Promise.all([
    generateContent({ ...baseInput, type: "bio" }),
    generateContent({ ...baseInput, type: "content_pillars" }),
    generateContent({ ...baseInput, type: "first_post" }),
  ]);

  return {
    bio: bio.content,
    content_pillars: pillars.content,
    first_post: firstPost.content,
    // These will be generated on-demand
    caption: "",
    hook: "",
    script: "",
    visual_prompt: "",
    hashtag: "",
    cta: "",
    content_calendar: "",
  };
}

/** Get available generator types for a given economic model */
export function getAvailableGenerators(economicModel: string): GeneratorType[] {
  const baseGenerators: GeneratorType[] = ["bio", "content_pillars", "first_post"];

  const modelGenerators: Record<string, GeneratorType[]> = {
    audience_based: ["caption", "hook", "script", "visual_prompt", "hashtag", "cta", "content_calendar"],
    skill_service: ["bio", "cta", "caption"],
    digital_product: ["caption", "hook", "cta", "content_calendar", "visual_prompt"],
    commerce_arbitrage: ["caption", "hook", "hashtag", "cta", "visual_prompt"],
    data_research: ["hook", "caption", "cta", "content_calendar"],
    automation_builder: ["bio", "cta", "caption"],
  };

  const extra = modelGenerators[economicModel] || [];
  const combined = new Set([...baseGenerators, ...extra]);
  return Array.from(combined);
}

/** Labels for generator types */
export const GENERATOR_LABELS: Record<GeneratorType, { emoji: string; label: string; description: string }> = {
  caption: { emoji: "✍️", label: "Caption Generator", description: "Buat caption engaging untuk posting" },
  hook: { emoji: "🪝", label: "Hook Generator", description: "Kalimat pembuka yang bikin stop scroll" },
  script: { emoji: "🎬", label: "Script Generator", description: "Script video/podcast terstruktur" },
  visual_prompt: { emoji: "🎨", label: "Visual Prompt", description: "Prompt untuk AI image generator" },
  hashtag: { emoji: "#️⃣", label: "Hashtag Generator", description: "Set hashtag optimal per platform" },
  cta: { emoji: "📢", label: "CTA Generator", description: "Call to Action yang persuasif" },
  bio: { emoji: "👤", label: "Bio Generator", description: "Bio optimized untuk platform" },
  content_pillars: { emoji: "🏛️", label: "Content Pillars", description: "4-5 pilar konten strategis" },
  content_calendar: { emoji: "📅", label: "Content Calendar", description: "Kalender posting 1 minggu" },
  first_post: { emoji: "🚀", label: "First Post", description: "Package post pertama sempurna" },
};
