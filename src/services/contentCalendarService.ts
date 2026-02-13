/**
 * Content Calendar Service — AI-Powered Daily Content Planner
 * ==============================================================
 * P1 MAXIMAL: Bukan sekadar "generate 7 hari" — tapi:
 *
 * 1. Niche-aware calendar (konten match dengan branching profile)
 * 2. Platform-specific format (IG = carousel/reel, TikTok = short, YT = long, etc.)
 * 3. Action plan per hari (bukan cuma "post ini" — tapi "step 1, step 2, step 3")
 * 4. Execution template siap pakai (copy-paste langsung ke platform)
 * 5. "Hari Ini" highlight + daily suggestion
 * 6. Week progression (minggu 1 = foundation, minggu 2 = growth, dst)
 * 7. Save/load dari localStorage (persist across refresh)
 * 8. Re-generate individual days
 *
 * Uses Claude via z.ai proxy API
 */

import { supabase } from "@/integrations/supabase/client";
import {
  loadPathSignals,
  loadHotNiches,
  type MarketSignal,
  type TrendingNiche,
} from "@/services/marketSignalService";

// ============================================================================
// TYPES
// ============================================================================

export interface DailyPlan {
  day: number;              // 1-7 (Senin-Minggu)
  dayName: string;          // "Senin", "Selasa", etc.
  date: string;             // ISO date string
  contentType: ContentFormat;
  pillar: string;           // content pillar category
  topic: string;            // specific topic
  hook: string;             // opening hook
  caption: string;          // full caption/script
  hashtags: string;         // hashtag set
  visualDirection: string;  // visual/thumbnail prompt
  cta: string;              // call to action
  bestTime: string;         // optimal posting time
  actionSteps: ActionStep[];// step-by-step execution
  executionTemplate: string;// copy-paste ready template
  status: "pending" | "done" | "skipped";
  notes?: string;
}

export interface ActionStep {
  step: number;
  action: string;
  tool?: string;
  timeEstimate: string;
  tip?: string;
}

export type ContentFormat =
  | "carousel"
  | "reel_short"
  | "reel_long"
  | "story"
  | "text_post"
  | "thread"
  | "video_long"
  | "video_short"
  | "live"
  | "newsletter"
  | "blog_post"
  | "podcast_ep"
  | "pin"
  | "listing";

export interface WeeklyCalendar {
  weekNumber: number;
  weekTheme: string;
  weekGoal: string;
  startDate: string;
  days: DailyPlan[];
  generatedAt: string;
  profileContext: CalendarProfileContext;
}

export interface CalendarProfileContext {
  economicModel: string;
  subSector: string;
  niche: string;
  platform: string;
  contentPillars?: string[];
}

// ============================================================================
// CONTENT FORMAT MAPPING PER PLATFORM
// ============================================================================

export const PLATFORM_FORMATS: Record<string, ContentFormat[]> = {
  instagram:    ["carousel", "reel_short", "story", "text_post"],
  tiktok:       ["reel_short", "reel_long", "live"],
  youtube:      ["video_long", "video_short", "live"],
  twitter_x:    ["text_post", "thread"],
  substack:     ["newsletter", "blog_post"],
  podcast:      ["podcast_ep"],
  linkedin:     ["text_post", "carousel", "newsletter"],
  pinterest:    ["pin", "carousel"],
  // Marketplace/commerce
  fiverr:       ["listing", "text_post"],
  upwork:       ["listing", "text_post"],
  gumroad:      ["listing", "text_post", "newsletter"],
  shopee:       ["listing", "reel_short", "live"],
  tokopedia:    ["listing", "reel_short"],
  tiktok_shop:  ["reel_short", "live"],
  own_website:  ["blog_post", "newsletter"],
  medium:       ["blog_post"],
  // Default for unlisted platforms
  default:      ["text_post", "carousel", "reel_short"],
};

export const FORMAT_LABELS: Record<ContentFormat, { emoji: string; label: string; duration: string }> = {
  carousel:     { emoji: "📸", label: "Carousel", duration: "5-10 slide" },
  reel_short:   { emoji: "🎬", label: "Short Video/Reel", duration: "15-60 detik" },
  reel_long:    { emoji: "🎥", label: "Long Reel/Video", duration: "1-3 menit" },
  story:        { emoji: "📱", label: "Story", duration: "15 detik" },
  text_post:    { emoji: "✍️", label: "Text Post", duration: "~200 kata" },
  thread:       { emoji: "🧵", label: "Thread", duration: "5-10 tweet" },
  video_long:   { emoji: "📹", label: "Video Panjang", duration: "8-15 menit" },
  video_short:  { emoji: "⚡", label: "YouTube Shorts", duration: "30-60 detik" },
  live:         { emoji: "🔴", label: "Live Stream", duration: "30-60 menit" },
  newsletter:   { emoji: "📧", label: "Newsletter", duration: "~800 kata" },
  blog_post:    { emoji: "📝", label: "Blog Post", duration: "~1500 kata" },
  podcast_ep:   { emoji: "🎙️", label: "Podcast Episode", duration: "15-30 menit" },
  pin:          { emoji: "📌", label: "Pin", duration: "1 image + desc" },
  listing:      { emoji: "🛒", label: "Product Listing", duration: "Title + desc + images" },
};

// ============================================================================
// DAY NAMES
// ============================================================================

const DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// ============================================================================
// WEEK THEMES PER ECONOMIC MODEL (progression-based)
// ============================================================================

const WEEK_THEMES: Record<string, string[]> = {
  skill_service: [
    "Foundation: Portfolio & Positioning",
    "Outreach: Cold DM & Proposal Sprint",
    "Authority: Case Study & Social Proof",
    "Scale: Upsell & Recurring Revenue",
  ],
  audience_based: [
    "Foundation: Niche Clarity & Content Setup",
    "Growth Sprint: Volume + Engagement",
    "Monetization: Affiliate & Sponsorship Setup",
    "Optimization: Double Down on Winners",
  ],
  digital_product: [
    "Research: Validate Demand & Outline",
    "Build: Create MVP Product",
    "Launch: Sales Page & Promotion",
    "Scale: Upsell & Passive Income",
  ],
  commerce_arbitrage: [
    "Setup: Store & Product Selection",
    "Listing Sprint: 10-20 Products Live",
    "Marketing: Ads & Organic Traffic",
    "Optimize: Margins & Repeat Winners",
  ],
  data_research: [
    "Foundation: Research System & Niche",
    "Content Sprint: First 5 Publications",
    "Audience: Build & Engage Readers",
    "Monetization: Paid Tier & Consulting",
  ],
  automation_builder: [
    "Skill Up: Tools & First Automation",
    "Portfolio: Build 3 Demo Projects",
    "Outreach: Find First Clients",
    "Deliver & Scale: Productize Service",
  ],
};

// ============================================================================
// NICHE-SPECIFIC ACTION PLAN TEMPLATES
// ============================================================================

export function getActionStepsForFormat(format: ContentFormat, platform: string): ActionStep[] {
  const steps: Record<ContentFormat, ActionStep[]> = {
    carousel: [
      { step: 1, action: "Buka Canva/Figma → pilih template carousel ukuran platform", tool: "Canva", timeEstimate: "5 menit", tip: "Gunakan template yang sudah ada, jangan mulai dari nol" },
      { step: 2, action: "Tulis outline: Hook (slide 1) → 3-5 poin inti → CTA (slide terakhir)", tool: "ChatGPT/Claude", timeEstimate: "10 menit", tip: "Slide pertama harus bikin orang SAVE/SWIPE" },
      { step: 3, action: "Design setiap slide — konsisten font, warna, spacing", tool: "Canva", timeEstimate: "20-30 menit" },
      { step: 4, action: "Tulis caption + hashtags (copy dari template di bawah)", timeEstimate: "5 menit" },
      { step: 5, action: "Schedule/posting di jam optimal", tool: "Later/Buffer", timeEstimate: "2 menit", tip: "Jam 12.00 atau 18.00-20.00 biasanya terbaik" },
    ],
    reel_short: [
      { step: 1, action: "Tulis script 60 detik: Hook (3 detik) → Content (50 detik) → CTA (7 detik)", tool: "ChatGPT/Claude", timeEstimate: "10 menit", tip: "3 detik pertama = 80% keputusan scroll/stay" },
      { step: 2, action: "Setup kamera/HP — landscape atau portrait sesuai platform", timeEstimate: "5 menit", tip: "Gunakan natural light dari jendela" },
      { step: 3, action: "Record dalam 1-3 take — jangan perfeksionis", tool: "HP Camera", timeEstimate: "15 menit" },
      { step: 4, action: "Edit: tambah caption text, music, transitions", tool: "CapCut", timeEstimate: "15-20 menit" },
      { step: 5, action: "Upload + caption + hashtags + cover thumbnail", timeEstimate: "5 menit" },
    ],
    reel_long: [
      { step: 1, action: "Outline video: Hook → Problem → 3 Solutions → CTA", tool: "ChatGPT/Claude", timeEstimate: "15 menit" },
      { step: 2, action: "Record video — bisa split jadi beberapa segment", tool: "HP/Kamera", timeEstimate: "20-30 menit" },
      { step: 3, action: "Edit: cut dead air, tambah B-roll/text overlay, music", tool: "CapCut/DaVinci", timeEstimate: "30-45 menit" },
      { step: 4, action: "Buat thumbnail yang eye-catching", tool: "Canva", timeEstimate: "10 menit" },
      { step: 5, action: "Upload dengan caption, hashtags, dan engaging description", timeEstimate: "5 menit" },
    ],
    story: [
      { step: 1, action: "Pilih format: poll, quiz, behind-the-scenes, atau tip singkat", timeEstimate: "2 menit" },
      { step: 2, action: "Record/design story — casual, authentic feel", tool: "HP/Canva", timeEstimate: "5 menit" },
      { step: 3, action: "Tambah sticker interaktif: poll, question, slider", timeEstimate: "2 menit" },
      { step: 4, action: "Post dan reply setiap respons dalam 1 jam", timeEstimate: "ongoing" },
    ],
    text_post: [
      { step: 1, action: "Tulis hook yang bikin berhenti scroll (1 kalimat powerful)", tool: "AI Generator", timeEstimate: "5 menit" },
      { step: 2, action: "Body: 3-5 paragraf pendek, 1 ide per paragraf", timeEstimate: "10 menit" },
      { step: 3, action: "CTA: ajak comment/share/save", timeEstimate: "2 menit" },
      { step: 4, action: "Review + posting di jam optimal", timeEstimate: "3 menit" },
    ],
    thread: [
      { step: 1, action: "Tweet 1: Hook yang HARUS bikin orang klik 'Show more'", tool: "AI Generator", timeEstimate: "10 menit", tip: "Bisa mulai dengan 'Saya habis [X] dan ini hasilnya:'" },
      { step: 2, action: "Tweet 2-8: 1 insight per tweet, gunakan number/bullet", timeEstimate: "15 menit" },
      { step: 3, action: "Tweet 9: Summary/recap", timeEstimate: "5 menit" },
      { step: 4, action: "Tweet 10: CTA + retweet tweet pertama", timeEstimate: "3 menit" },
      { step: 5, action: "Posting dan reply ke komentar dalam 1 jam pertama", timeEstimate: "ongoing" },
    ],
    video_long: [
      { step: 1, action: "Research: cari 3 referensi video di topik yang sama", tool: "YouTube", timeEstimate: "15 menit" },
      { step: 2, action: "Script: Hook (30 detik) → Intro → 3 Sections → Outro + CTA", tool: "ChatGPT/Claude", timeEstimate: "30 menit" },
      { step: 3, action: "Record — setup lighting, audio, background", timeEstimate: "30-45 menit" },
      { step: 4, action: "Edit: cut, B-roll, text overlay, music, SFX", tool: "DaVinci/Premiere", timeEstimate: "1-2 jam" },
      { step: 5, action: "Thumbnail + title optimization (keyword-rich)", tool: "Canva + TubeBuddy", timeEstimate: "15 menit" },
      { step: 6, action: "Upload: description, tags, cards, end screen", timeEstimate: "10 menit" },
    ],
    video_short: [
      { step: 1, action: "Script 30-60 detik: 1 ide, 1 hook, 1 CTA", tool: "AI Generator", timeEstimate: "5 menit" },
      { step: 2, action: "Record vertikal (9:16)", tool: "HP", timeEstimate: "10 menit" },
      { step: 3, action: "Edit cepat: caption, music, cut", tool: "CapCut", timeEstimate: "10 menit" },
      { step: 4, action: "Upload sebagai YouTube Shorts", timeEstimate: "3 menit" },
    ],
    live: [
      { step: 1, action: "Prep: tentukan topik + 5 talking points", timeEstimate: "10 menit" },
      { step: 2, action: "Announce di feed/story: 'LIVE jam [X], kita bahas [topik]'", timeEstimate: "5 menit" },
      { step: 3, action: "Setup: lighting, audio, stable tripod", timeEstimate: "5 menit" },
      { step: 4, action: "Go LIVE: hook → content → Q&A → CTA", timeEstimate: "30-60 menit" },
      { step: 5, action: "Save replay + post highlights sebagai konten baru", timeEstimate: "10 menit" },
    ],
    newsletter: [
      { step: 1, action: "Pilih 1 topik yang timely + valuable untuk audience", timeEstimate: "10 menit" },
      { step: 2, action: "Subject line: gunakan curiosity gap atau specific number", tool: "AI Generator", timeEstimate: "5 menit" },
      { step: 3, action: "Write: Hook → Insight → 3 Key Points → Resource Links → CTA", tool: "ChatGPT/Claude", timeEstimate: "30-45 menit" },
      { step: 4, action: "Preview test: kirim ke diri sendiri, cek formatting", tool: "Substack/Beehiiv", timeEstimate: "5 menit" },
      { step: 5, action: "Schedule kirim di Selasa/Kamis pagi (open rate tertinggi)", timeEstimate: "2 menit" },
    ],
    blog_post: [
      { step: 1, action: "Keyword research: cari keyword dengan volume & low competition", tool: "Ubersuggest/Ahrefs", timeEstimate: "15 menit" },
      { step: 2, action: "Outline: H1 + 5-7 H2 subheadings", tool: "ChatGPT/Claude", timeEstimate: "10 menit" },
      { step: 3, action: "Write 1500+ kata: intro hook, body sections, conclusion + CTA", tool: "AI + editing manual", timeEstimate: "1-2 jam" },
      { step: 4, action: "SEO: meta title, meta desc, internal links, alt text images", timeEstimate: "15 menit" },
      { step: 5, action: "Publish + share ke social media", timeEstimate: "10 menit" },
    ],
    podcast_ep: [
      { step: 1, action: "Outline episode: Intro → 3 segments → Outro + CTA", timeEstimate: "15 menit" },
      { step: 2, action: "Record audio — quiet room, mic close to mouth", tool: "Riverside/Zencastr", timeEstimate: "20-40 menit" },
      { step: 3, action: "Edit: cut uhm/silence, add intro/outro music", tool: "Descript/Audacity", timeEstimate: "20 menit" },
      { step: 4, action: "Upload ke hosting + write show notes + timestamps", tool: "Spotify for Podcasters", timeEstimate: "10 menit" },
    ],
    pin: [
      { step: 1, action: "Design pin: 1000x1500px, bold text, eye-catching visual", tool: "Canva", timeEstimate: "10 menit" },
      { step: 2, action: "Write pin title + description dengan keywords", timeEstimate: "5 menit" },
      { step: 3, action: "Link ke blog/product/affiliate", timeEstimate: "2 menit" },
      { step: 4, action: "Pin ke 2-3 relevant boards", tool: "Tailwind", timeEstimate: "3 menit" },
    ],
    listing: [
      { step: 1, action: "Product title: keyword-rich, benefit-first", tool: "AI Generator", timeEstimate: "10 menit" },
      { step: 2, action: "Description: feature → benefit → social proof → CTA", timeEstimate: "15 menit" },
      { step: 3, action: "Photos/mockup: 5-7 images, variasi angle", tool: "Canva/Placeit", timeEstimate: "20 menit" },
      { step: 4, action: "Pricing: riset kompetitor, positioning", timeEstimate: "10 menit" },
      { step: 5, action: "Publish + optimize tags/category", timeEstimate: "5 menit" },
    ],
  };

  return steps[format] || steps.text_post;
}

// ============================================================================
// EXECUTION TEMPLATE BUILDER — Copy-paste ready
// ============================================================================

export function buildExecutionTemplate(
  day: Pick<DailyPlan, "contentType" | "topic" | "hook" | "caption" | "hashtags" | "cta" | "visualDirection">,
  platform: string,
): string {
  const lines: string[] = [];

  lines.push(`═══════════════════════════════════════`);
  lines.push(`📋 EXECUTION TEMPLATE — ${FORMAT_LABELS[day.contentType]?.label || day.contentType}`);
  lines.push(`Platform: ${platform}`);
  lines.push(`═══════════════════════════════════════\n`);

  // Section 1: Hook
  lines.push(`🪝 HOOK (baris pertama):`);
  lines.push(`${day.hook}\n`);

  // Section 2: Full Caption/Script
  lines.push(`✍️ CAPTION/SCRIPT:`);
  lines.push(`${day.caption}\n`);

  // Section 3: CTA
  lines.push(`📢 CTA:`);
  lines.push(`${day.cta}\n`);

  // Section 4: Hashtags
  if (day.hashtags) {
    lines.push(`#️⃣ HASHTAGS:`);
    lines.push(`${day.hashtags}\n`);
  }

  // Section 5: Visual Direction
  if (day.visualDirection) {
    lines.push(`🎨 VISUAL / THUMBNAIL:`);
    lines.push(`${day.visualDirection}\n`);
  }

  lines.push(`═══════════════════════════════════════`);

  return lines.join("\n");
}

// ============================================================================
// TOLERANT JSON PARSER — handles AI quirks (stray #, trailing commas, comments)
// ============================================================================

function tolerantParseJson(raw: string): any {
  // 1) Quick try
  try { return JSON.parse(raw); } catch { /* fallthrough */ }

  let s = raw;

  // 2) Remove comment lines starting with # or //
  s = s.replace(/(^|\n)\s*(#.*|\/\/.*)(?=\n|$)/g, "\n");

  // 3) Wrap standalone hashtags like #milenial inside quotes
  s = s.replace(/(\s|:|,|\[|\{|^)#([A-Za-z0-9_\-]+)/g, (_, p1, p2) => `${p1}"#${p2}"`);

  // 4) Remove trailing commas before ] or }
  s = s.replace(/,\s*(\]|\})/g, "$1");

  try { return JSON.parse(s); } catch { /* fallthrough */ }

  // 5) Aggressive: fix unescaped quotes inside string values
  function fixUnescapedQuotes(input: string): string {
    let result = "";
    let inString = false;
    for (let i = 0; i < input.length; i++) {
      const c = input[i];
      const prev = i > 0 ? input[i - 1] : "";
      if (c === '"' && prev !== "\\") {
        if (!inString) {
          inString = true;
          result += c;
        } else {
          let j = i + 1;
          while (j < input.length && (input[j] === " " || input[j] === "\t")) j++;
          const next = j < input.length ? input[j] : "";
          if (next === ":" || next === "," || next === "}" || next === "]" || next === "" || next === "\n") {
            inString = false;
            result += c;
          } else {
            result += '\\"';
          }
        }
      } else {
        result += c;
      }
    }
    return result;
  }

  const fixed = fixUnescapedQuotes(s);
  try { return JSON.parse(fixed); } catch { /* fallthrough */ }

  // 6) Final fallback: extract outermost [ ... ] or { ... }
  const firstBracket = fixed.indexOf("[");
  const lastBracket = fixed.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    try { return JSON.parse(fixed.substring(firstBracket, lastBracket + 1)); } catch { /* fallthrough */ }
  }
  const firstBrace = fixed.indexOf("{");
  const lastBrace = fixed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try { return JSON.parse(fixed.substring(firstBrace, lastBrace + 1)); } catch { /* fallthrough */ }
  }

  console.error("tolerantParseJson: all parse attempts failed");
  return null;
}

// ============================================================================
// AI CALENDAR GENERATOR — Full week with all details
// ============================================================================

const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || "";
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "https://api.z.ai/api/anthropic/v1";

async function callCalendarAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!AI_API_KEY) return "[]";

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
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) return "[]";
    const data = await response.json();
    return data.content?.[0]?.text || "[]";
  } catch {
    return "[]";
  }
}

const CALENDAR_SYSTEM_PROMPT = `Kamu adalah AI Content Calendar Strategist yang membuat kalender konten 7 hari HYPER-SPESIFIK.

ATURAN OUTPUT:
- Output HARUS berupa JSON array dengan 7 object
- TIDAK ADA text di luar JSON — langsung mulai dengan [ dan akhiri dengan ]
- Setiap object memiliki field: day, contentType, pillar, topic, hook, caption, hashtags, visualDirection, cta, bestTime
- Bahasa Indonesia untuk semua teks konten
- Hook harus 1 kalimat yang bikin stop-scroll
- Caption harus 100-200 kata, siap copy-paste
- Hashtags: 5 relevant hashtags
- visualDirection: deskripsi visual/thumbnail dalam 1-2 kalimat
- bestTime: jam posting optimal (format "HH:MM WIB")

CONTENT MIX per minggu:
- 2 educational (value-heavy, tips, how-to)
- 2 entertaining/relatable (personal story, behind the scenes, meme-style)
- 1 inspiring (transformation, mindset, success story)
- 1 promotional (soft sell, CTA to product/service)
- 1 engagement (poll, question, challenge, collab)

JSON FIELD TYPES:
- day: number 1-7
- contentType: salah satu dari content format yang diberikan
- pillar: string (kategori content pillar)
- topic: string (topik spesifik)
- hook: string (1 kalimat pembuka)
- caption: string (full caption 100-200 kata)
- hashtags: string (5 hashtags dengan #)
- visualDirection: string (deskripsi visual)
- cta: string (call to action)
- bestTime: string (jam optimal)`;

export async function generateWeeklyCalendar(
  context: CalendarProfileContext,
  weekNumber: number = 1,
  trendIntelligenceBrief?: string,
): Promise<WeeklyCalendar> {
  const model = context.economicModel;
  const themes = WEEK_THEMES[model] || WEEK_THEMES.audience_based;
  const weekTheme = themes[(weekNumber - 1) % themes.length];

  // Get available formats for this platform
  const platformKey = Object.keys(PLATFORM_FORMATS).find(k => 
    context.platform.toLowerCase().includes(k)
  ) || "default";
  const availableFormats = PLATFORM_FORMATS[platformKey] || PLATFORM_FORMATS.default;
  const formatLabels = availableFormats.map(f => FORMAT_LABELS[f]?.label || f).join(", ");

  // ── TREND INTELLIGENCE: Inject scored market data into AI prompt ──
  let trendBlock = "";
  if (trendIntelligenceBrief) {
    // Use pre-computed Trend Intelligence Engine brief (real scored data)
    trendBlock = trendIntelligenceBrief;
  } else {
    // Fallback: basic market signals (legacy)
    try {
      const pathId = context.economicModel;
      const signals = await loadPathSignals(pathId);
      const hotNiches = await loadHotNiches();

      const relevantSignals = signals.filter(s => s.trend_score >= 0.6);
      const hotKeywords = hotNiches.slice(0, 5).map(n => n.keyword);

      if (relevantSignals.length > 0 || hotKeywords.length > 0) {
        trendBlock = `\n\nMARKET TRENDS (gunakan untuk menambah relevansi topik):`;
        if (relevantSignals.length > 0) {
          trendBlock += `\n- Trending di path "${pathId}": ${relevantSignals.map(s => `${s.keyword} (${s.trend_direction})`).join(", ")}`;
        }
        if (hotKeywords.length > 0) {
          trendBlock += `\n- Hot keywords saat ini: ${hotKeywords.join(", ")}`;
        }
        trendBlock += `\n- Sisipkan 1-2 topik kalender yang menyentuh trend ini agar konten lebih timely dan discoverable`;
      }
    } catch {
      // Market signals unavailable — proceed without
    }
  }

  const userPrompt = `Buat content calendar 7 hari (Senin-Minggu) untuk:

MODEL EKONOMI: ${context.economicModel}
SUB-SEKTOR: ${context.subSector}
NICHE: ${context.niche}
PLATFORM: ${context.platform}
CONTENT PILLARS: ${context.contentPillars?.join(", ") || "education, entertainment, inspiration, promotion, engagement"}

MINGGU KE-${weekNumber}: TEMA "${weekTheme}"

FORMAT KONTEN YANG TERSEDIA (pilih sesuai mix): ${formatLabels}
Content type values yang valid: ${availableFormats.join(", ")}

PENTING:
- Topik harus SUPER SPESIFIK untuk niche "${context.niche}" — bukan generic
- Hook harus bikin orang berhenti scroll
- Caption harus siap di copy-paste langsung ke ${context.platform}
- Mix format yang berbeda setiap hari
- Progresif sesuai tema minggu ini
${trendBlock}

Output JSON array saja, tanpa penjelasan tambahan.`;

  const raw = await callCalendarAI(CALENDAR_SYSTEM_PROMPT, userPrompt);

  // Parse AI response with tolerant parser
  let aiDays: any[] = [];
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = tolerantParseJson(jsonMatch[0]);
      if (Array.isArray(parsed)) aiDays = parsed;
    }
  } catch (e) {
    console.error("Failed to parse calendar AI response:", e);
  }

  // Build calendar with action steps
  const startDate = getNextMondayDate();
  const days: DailyPlan[] = [];

  for (let i = 0; i < 7; i++) {
    const aiDay = aiDays[i] || {};
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + i);

    // Validate content type
    let contentType: ContentFormat = aiDay.contentType || availableFormats[i % availableFormats.length];
    if (!availableFormats.includes(contentType)) {
      contentType = availableFormats[i % availableFormats.length];
    }

    const plan: DailyPlan = {
      day: i + 1,
      dayName: DAY_NAMES[i],
      date: dayDate.toISOString().split("T")[0],
      contentType,
      pillar: aiDay.pillar || "education",
      topic: aiDay.topic || `Topik hari ${i + 1} untuk ${context.niche}`,
      hook: aiDay.hook || `Hook placeholder untuk hari ${i + 1}`,
      caption: aiDay.caption || "",
      hashtags: aiDay.hashtags || "",
      visualDirection: aiDay.visualDirection || "",
      cta: aiDay.cta || "",
      bestTime: aiDay.bestTime || "18:00 WIB",
      actionSteps: getActionStepsForFormat(contentType, context.platform),
      executionTemplate: "",
      status: "pending",
    };

    // Build execution template
    plan.executionTemplate = buildExecutionTemplate(plan, context.platform);

    days.push(plan);
  }

  return {
    weekNumber,
    weekTheme,
    weekGoal: `Selesaikan 7 konten sesuai tema "${weekTheme}" untuk ${context.niche}`,
    startDate: startDate.toISOString().split("T")[0],
    days,
    generatedAt: new Date().toISOString(),
    profileContext: context,
  };
}

// ============================================================================
// SINGLE DAY RE-GENERATE
// ============================================================================

export async function regenerateSingleDay(
  context: CalendarProfileContext,
  dayNumber: number,
  weekTheme: string,
): Promise<DailyPlan | null> {
  const platformKey = Object.keys(PLATFORM_FORMATS).find(k =>
    context.platform.toLowerCase().includes(k)
  ) || "default";
  const availableFormats = PLATFORM_FORMATS[platformKey] || PLATFORM_FORMATS.default;

  const userPrompt = `Buat 1 konten untuk HARI ${DAY_NAMES[dayNumber - 1]} dengan konteks:

NICHE: ${context.niche}
PLATFORM: ${context.platform}
TEMA MINGGU: ${weekTheme}
FORMAT TERSEDIA: ${availableFormats.join(", ")}

Output 1 JSON object (bukan array) dengan field: day, contentType, pillar, topic, hook, caption, hashtags, visualDirection, cta, bestTime

Buat topik yang BERBEDA dari biasanya — fresh angle, unexpected take.`;

  const raw = await callCalendarAI(CALENDAR_SYSTEM_PROMPT, userPrompt);

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const aiDay = tolerantParseJson(jsonMatch[0]);
    if (!aiDay) return null;

    let contentType: ContentFormat = aiDay.contentType || availableFormats[0];
    if (!availableFormats.includes(contentType)) {
      contentType = availableFormats[0];
    }

    const plan: DailyPlan = {
      day: dayNumber,
      dayName: DAY_NAMES[dayNumber - 1],
      date: new Date().toISOString().split("T")[0],
      contentType,
      pillar: aiDay.pillar || "education",
      topic: aiDay.topic || `Fresh topic for day ${dayNumber}`,
      hook: aiDay.hook || "",
      caption: aiDay.caption || "",
      hashtags: aiDay.hashtags || "",
      visualDirection: aiDay.visualDirection || "",
      cta: aiDay.cta || "",
      bestTime: aiDay.bestTime || "18:00 WIB",
      actionSteps: getActionStepsForFormat(contentType, context.platform),
      executionTemplate: "",
      status: "pending",
    };

    plan.executionTemplate = buildExecutionTemplate(plan, context.platform);
    return plan;
  } catch {
    return null;
  }
}

// ============================================================================
// PERSISTENCE — Supabase (primary) + localStorage (fallback/offline)
// ============================================================================

const STORAGE_KEY = "intentai_content_calendar";

/** Save calendar: Supabase first, then localStorage as fallback */
export async function saveCalendar(calendar: WeeklyCalendar, userId?: string): Promise<void> {
  // Always save to localStorage for offline access
  try {
    const existing = loadAllCalendarsLocal();
    const idx = existing.findIndex(c => c.weekNumber === calendar.weekNumber);
    if (idx >= 0) existing[idx] = calendar;
    else existing.push(calendar);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to save calendar to localStorage:", e);
  }

  // Also persist to Supabase if user is logged in
  if (!userId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch { /* no user session */ }
  }

  if (userId) {
    try {
      await supabase.from("content_calendars" as any).upsert({
        user_id: userId,
        week_number: calendar.weekNumber,
        week_theme: calendar.weekTheme,
        week_goal: calendar.weekGoal,
        start_date: calendar.startDate,
        calendar_data: calendar.days,
        profile_context: calendar.profileContext,
        generated_at: calendar.generatedAt,
        updated_at: new Date().toISOString(),
      } as any, {
        onConflict: "user_id,week_number",
      });
    } catch (e) {
      console.error("Failed to save calendar to Supabase:", e);
    }
  }
}

/** Load all calendars from localStorage */
function loadAllCalendarsLocal(): WeeklyCalendar[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function loadAllCalendars(): WeeklyCalendar[] {
  return loadAllCalendarsLocal();
}

/** Load calendar: try Supabase first, fallback to localStorage */
export async function loadCalendarAsync(weekNumber: number, userId?: string): Promise<WeeklyCalendar | null> {
  // Try Supabase first
  if (!userId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch { /* no session */ }
  }

  if (userId) {
    try {
      const { data, error } = await supabase
        .from("content_calendars" as any)
        .select("*")
        .eq("user_id", userId)
        .eq("week_number", weekNumber)
        .single();

      if (!error && data) {
        const row = data as any;
        const calendar: WeeklyCalendar = {
          weekNumber: row.week_number,
          weekTheme: row.week_theme,
          weekGoal: row.week_goal || "",
          startDate: row.start_date || "",
          days: row.calendar_data || [],
          generatedAt: row.generated_at,
          profileContext: row.profile_context || {},
        };
        // Sync to localStorage
        try {
          const existing = loadAllCalendarsLocal();
          const idx = existing.findIndex(c => c.weekNumber === weekNumber);
          if (idx >= 0) existing[idx] = calendar;
          else existing.push(calendar);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
        } catch { /* ignore */ }
        return calendar;
      }
    } catch {
      // Supabase unavailable — fall through to localStorage
    }
  }

  // Fallback to localStorage
  return loadCalendar(weekNumber);
}

/** Load calendar from localStorage (sync — for backwards compatibility) */
export function loadCalendar(weekNumber: number): WeeklyCalendar | null {
  const all = loadAllCalendarsLocal();
  return all.find(c => c.weekNumber === weekNumber) || null;
}

export function updateDayStatus(weekNumber: number, dayNumber: number, status: "pending" | "done" | "skipped"): void {
  const all = loadAllCalendarsLocal();
  const cal = all.find(c => c.weekNumber === weekNumber);
  if (!cal) return;
  const day = cal.days.find(d => d.day === dayNumber);
  if (day) day.status = status;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  // Also update in Supabase (fire-and-forget)
  (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id && cal) {
        await supabase.from("content_calendars" as any).upsert({
          user_id: user.id,
          week_number: weekNumber,
          week_theme: cal.weekTheme,
          week_goal: cal.weekGoal,
          start_date: cal.startDate,
          calendar_data: cal.days,
          profile_context: cal.profileContext,
          generated_at: cal.generatedAt,
          updated_at: new Date().toISOString(),
        } as any, {
          onConflict: "user_id,week_number",
        });
      }
    } catch { /* non-critical */ }
  })();
}

// ============================================================================
// HELPERS
// ============================================================================

function getNextMondayDate(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysUntilMonday);
  return monday;
}

/** Get today's plan from calendar */
export function getTodayPlan(calendar: WeeklyCalendar): DailyPlan | null {
  const today = new Date().toISOString().split("T")[0];
  return calendar.days.find(d => d.date === today) || null;
}

/** Get today's day index (1-7, Monday=1) */
export function getTodayDayIndex(): number {
  const day = new Date().getDay(); // 0=Sun, 1=Mon
  return day === 0 ? 7 : day;
}

/** Calculate week completion rate */
export function getWeekCompletionRate(calendar: WeeklyCalendar): number {
  const done = calendar.days.filter(d => d.status === "done").length;
  return Math.round((done / 7) * 100);
}

/** Get pillar distribution */
export function getPillarDistribution(calendar: WeeklyCalendar): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const day of calendar.days) {
    dist[day.pillar] = (dist[day.pillar] || 0) + 1;
  }
  return dist;
}
