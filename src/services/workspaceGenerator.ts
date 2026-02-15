/**
 * Workspace Generator Service — Execution Material Engine
 * =============================================================
 * Generates execution materials inside the workspace:
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
  caption: `Kamu adalah content creator Indonesia yang sudah berpengalaman menghasilkan uang dari konten digital.

ATURAN WAJIB:
- Tulis dalam Bahasa Indonesia sehari-hari yang natural — bukan bahasa AI, bukan bahasa marketing textbook
- JANGAN pakai kata-kata template AI seperti "di era digital", "memanfaatkan", "mengoptimalkan", "mari kita", "dalam konteks"
- Tulis seperti orang Indonesia asli posting di platform tersebut
- Hook di baris pertama HARUS bikin orang berhenti scroll — gunakan pattern curiosity/shock/relatable
- Sesuaikan panjang dan gaya dengan platform (IG caption beda dari Twitter thread)
- CTA di akhir harus spesifik, bukan generic "like dan follow ya"
- Pakai bahasa yang RELATABLE — campur sedikit bahasa gaul/slang yang sesuai audience

OUTPUT: 3 variasi caption (pendek 2-3 baris, sedang 5-7 baris, panjang 10+ baris). Langsung tulis captionnya tanpa penjelasan.`,

  hook: `Kamu adalah copywriter Indonesia yang paham psikologi scroll behavior.

ATURAN WAJIB:
- Buat 5 hook (kalimat pembuka) yang bikin orang BERHENTI scroll
- Pakai Bahasa Indonesia natural, BUKAN bahasa formal/AI
- JANGAN pakai: "Tahukah kamu...", "Di era...", "Pernahkah kamu..."
- Pattern yang work: angka spesifik, kontras, cerita personal, pertanyaan provokatif, fakta mengejutkan
- Setiap hook max 2 baris — punchy, langsung kena
- Sesuaikan tone dengan platform dan audience

OUTPUT: 5 hook berbeda, masing-masing dengan label pattern-nya. Langsung tulis hooknya.`,

  script: `Kamu adalah scriptwriter untuk konten video/podcast Indonesia.

ATURAN WAJIB:
- Tulis script yang conversational — seperti ngobrol sama teman, bukan presentasi
- Bahasa Indonesia natural, boleh campur bahasa gaul sesuai audience
- Struktur: Hook (5 detik) → Problem/Relatable (15 detik) → Value/Solution (30 detik) → CTA (10 detik)
- JANGAN mulai dengan "Halo guys" atau "Selamat datang" — langsung masuk hook
- Include timing markers dan instruksi visual/gesture sederhana
- Durasi target: 60 detik untuk short-form

OUTPUT: Full script dengan timing markers. Langsung tulis scriptnya.`,

  visual_prompt: `You are an expert AI image prompt engineer.

RULES:
- Create detailed prompts for AI image generation (Midjourney/DALL-E/Stable Diffusion)
- Each prompt MUST include: subject, art style, lighting, composition, mood, color palette
- Match the visual style to the niche and target audience
- Make it specific and unique — not generic stock-photo style
- Prompts in English (AI image tools use English)

OUTPUT: 3 prompt variants (thumbnail, feed post, story) — write prompts directly.`,

  hashtag: `Kamu adalah social media strategist Indonesia yang paham algoritma platform.

ATURAN WAJIB:
- Generate hashtag set yang optimal untuk REACH dan ENGAGEMENT
- Mix: 5 high-volume (100K+ posts) + 5 medium (10K-100K) + 5 niche-specific (<10K)
- Sesuaikan jumlah dengan platform: IG max 15-20 relevant, TikTok max 5, Twitter max 3
- Include hashtag Indonesia DAN English yang relevan
- JANGAN include hashtag yang terlalu generic (#fyp, #viral) kecuali memang platform butuh

OUTPUT: Hashtag set dengan grouping (high/medium/niche) dan tips penggunaan singkat.`,

  cta: `Kamu adalah conversion copywriter Indonesia.

ATURAN WAJIB:
- Buat 5 CTA yang natural dan tidak pushy
- Bahasa Indonesia casual — bukan bahasa iklan/marketing formal
- Setiap CTA untuk skenario berbeda: follow, comment, save, share, klik link
- Pakai urgency yang natural, bukan fake scarcity
- Harus SPESIFIK tentang apa yang audience dapat

OUTPUT: 5 CTA dengan label konteks penggunaan. Langsung tulis CTA-nya.`,

  bio: `Kamu adalah personal branding expert Indonesia.

ATURAN WAJIB:
- Buat bio yang JELAS tentang siapa kamu dan apa value yang kamu tawarkan
- Bahasa Indonesia natural, boleh campur English untuk terms yang lebih catchy
- JANGAN pakai buzzword kosong ("passionate", "enthusiast", "guru")
- Include: apa yang kamu lakukan + untuk siapa + proof/credibility singkat + CTA
- Sesuaikan panjang dengan platform (IG 150 chars, TikTok 80 chars, LinkedIn 120 words)

OUTPUT: 3 variasi bio sesuai platform yang diminta. Langsung tulis bionya.`,

  content_pillars: `Kamu adalah content strategist Indonesia yang paham monetisasi konten.

ATURAN WAJIB:
- Tentukan 4-5 content pillars yang STRATEGIS untuk niche ini
- Setiap pillar harus ada: nama pillar, kenapa penting untuk audience, 3 contoh topik spesifik
- Seimbangkan: educational (30%), entertaining (25%), inspiring (20%), promotional (15%), personal (10%)
- Pikirkan dari sudut pandang AUDIENCE — apa yang mereka butuhkan, bukan apa yang kamu mau posting
- Sesuaikan dengan algoritma platform

OUTPUT: 4-5 pillars dengan breakdown lengkap. Langsung tulis pillarsnya.`,

  content_calendar: `Kamu adalah content planner Indonesia yang paham timing dan algoritma.

ATURAN WAJIB:
- Buat content calendar 7 hari (Senin-Minggu)
- Setiap hari: tipe konten, topik spesifik, content pillar, jam posting optimal (WIB)
- Mix format sesuai platform: carousel, video pendek, story, text post
- Jam posting optimal untuk audience Indonesia: pagi 07-08, siang 12-13, malam 19-21
- Weekend boleh lebih santai/personal content

OUTPUT: Tabel 7 hari dengan detail lengkap dalam format yang rapi.`,

  first_post: `Kamu adalah mentor konten kreator Indonesia.

ATURAN WAJIB:
- Buat FIRST POST yang sempurna untuk akun baru atau rebranding
- Harus: introduce siapa kamu, set expectation (posting tentang apa), create curiosity (kenapa harus follow)
- Tone: percaya diri tapi BUKAN sombong, approachable
- Bahasa Indonesia natural — bukan template
- Include: caption lengkap + arah visual + hashtags

OUTPUT: Full first post package (caption + instruksi visual + hashtags). Langsung tulis semuanya.`,
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
        max_tokens: 2500,
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

  // Rich context — not just labels, but meaning
  const platformNames: Record<string, string> = {
    tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube",
    twitter_x: "Twitter/X", linkedin: "LinkedIn", substack: "Substack",
    own_website: "Website/Blog sendiri", podcast: "Podcast",
    tiktok_reels: "TikTok & Instagram Reels", own_blog: "Blog",
  };

  const modelNames: Record<string, string> = {
    audience_based: "Bangun audience → monetisasi lewat konten",
    skill_service: "Jual skill/jasa langsung ke client",
    digital_product: "Buat & jual produk digital",
    commerce_arbitrage: "Jual produk/arbitrase online",
    data_research: "Riset & analisis data sebagai jasa",
    automation_builder: "Bangun sistem otomasi untuk client",
  };

  parts.push(`NICHE/BIDANG: ${input.niche}`);
  parts.push(`SUB-SEKTOR: ${input.subSector}`);
  parts.push(`PLATFORM UTAMA: ${platformNames[input.platform] || input.platform}`);
  parts.push(`MODEL BISNIS: ${modelNames[input.economicModel] || input.economicModel}`);
  parts.push(`TARGET AUDIENCE: Orang Indonesia yang tertarik dengan ${input.niche}`);

  if (input.language) parts.push(`\nKEMAMPUAN BAHASA USER: ${input.language}`);
  if (input.topic) parts.push(`\nTOPIK SPESIFIK YANG DIMINTA: ${input.topic}`);
  if (input.targetAudience) parts.push(`TARGET AUDIENCE SPESIFIK: ${input.targetAudience}`);
  if (input.tone) parts.push(`TONE: ${input.tone}`);
  if (input.additionalContext) parts.push(`\nKONTEKS PERSONAL USER:\n${input.additionalContext}`);

  parts.push(`\nINGAT: Output harus sesuai dengan profil di atas. Jangan generic. Sesuaikan bahasa & kompleksitas dengan kemampuan user. Tulis langsung hasilnya tanpa pengantar.`);

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
  caption: { emoji: "01", label: "Caption", description: "Caption untuk posting sesuai profil" },
  hook: { emoji: "02", label: "Hook", description: "Kalimat pembuka yang menghentikan scroll" },
  script: { emoji: "03", label: "Script", description: "Script video/podcast terstruktur" },
  visual_prompt: { emoji: "04", label: "Visual Prompt", description: "Prompt untuk AI image generator" },
  hashtag: { emoji: "05", label: "Hashtag Set", description: "Hashtag optimal per platform" },
  cta: { emoji: "06", label: "CTA", description: "Call to Action yang presisi" },
  bio: { emoji: "07", label: "Bio", description: "Bio yang dikalibrasi untuk platform" },
  content_pillars: { emoji: "08", label: "Content Pillars", description: "Pilar konten strategis" },
  content_calendar: { emoji: "09", label: "Jadwal Eksekusi", description: "Jadwal posting 1 minggu" },
  first_post: { emoji: "10", label: "First Post", description: "Material post pertama" },
};
