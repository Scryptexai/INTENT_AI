/**
 * AI Workflow Architect Service
 * ==============================
 * AI-powered personalization service for IntentAI platform.
 *
 * This service uses Claude via z.ai to personalize side income recommendations
 * based on user profiles. It provides path-specific guidance, task breakdowns,
 * and actionable advice tailored to user constraints.
 *
 * Data flow:
 *   1. User completes 6-question profiling (modal, skill, waktu, risk, prioritas, tipe kerja)
 *   2. Constraint engine eliminates + scores paths (rule-based)
 *   3. This service provides AI personalization on top of rule-based results
 *   4. Results saved to Supabase if user is authenticated
 *
 * Environment variables (VITE_ prefix required for Vite frontend):
 *   VITE_AI_API_KEY    — API key for Claude/z.ai
 *   VITE_AI_BASE_URL   — Base URL (default: https://api.z.ai/api/anthropic)
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TYPES
// ============================================================================

export type AIProvider = "claude" | "default";
export type AIModel = "claude-3-sonnet" | "claude-3-haiku";

export interface GenerationParams {
  title: string;
  description: string;
  category: string;
  tool?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  language?: string;
  tone?: string;
  provider?: AIProvider;
  model?: AIModel;
}

export interface GenerationResult {
  id: string;
  title: string;
  prompt: string;
  provider: AIProvider;
  model: AIModel;
  timestamp: string;
  success: boolean;
  error?: string;
  metadata?: {
    tokens_used?: number;
    processing_time?: number;
    model_version?: string;
  };
}

export interface ProviderConfig {
  name: AIProvider;
  apiKey: string;
  baseUrl: string;
  models: AIModel[];
  isAvailable: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || "";
const AI_BASE_URL =
  import.meta.env.VITE_AI_BASE_URL || "https://api.z.ai/api/anthropic/v1";

function getProviderConfigs(): ProviderConfig[] {
  return [
    {
      name: "claude",
      apiKey: AI_API_KEY,
      baseUrl: AI_BASE_URL,
      models: ["claude-3-sonnet", "claude-3-haiku"],
      isAvailable: !!AI_API_KEY,
    },
  ];
}

// ============================================================================
// SYSTEM PROMPT — The meta-prompt engineer
// ============================================================================

const SYSTEM_PROMPT = `You are the AI engine behind INTENT — an Adaptive Direction System. Your role is to generate actionable execution content based on the user's calibrated profile and active direction path.

CONTEXT:
The user has completed deep profiling (11 questions) covering:
1. Waktu (available daily hours: <1h, 1-2h, 3-4h, >4h)
2. Modal (capital: $0, <$50, $50-200, $200-500)
3. Target Kecepatan (7 hari, 2 minggu, 1 bulan, 1-3 bulan)
4. Gaya Kerja (kamera, editing, menulis, konten pendek, riset, komunikasi, diam-diam)
5. Risk Tolerance (sangat rendah, rendah, sedang, tinggi)
6. Skill Utama (writing, design, marketing, tech, video, sales, none)
7. Skill Pendukung (basic write, design, data, social media, English)
8. Area Market (health, business, education, finance, parenting, gaming, ecommerce, realestate, creative, tech)
9. Audience Access (nol, micro, small, medium, large)
10. Daily Routine (pagi awal, pagi-siang, siang-sore, malam, fleksibel)
11. Platform Pilihan (TikTok/Reels, YouTube, Twitter/X, LinkedIn, Marketplace, Website)

A constraint + scoring engine has selected the best direction path. AI does NOT determine path — AI personalizes WITHIN the chosen path.

YOUR RULES:
1. Always respond in Bahasa Indonesia unless specifically asked otherwise.
2. Be SPECIFIC and ACTIONABLE — no generic advice.
3. Reference the user's actual constraints (modal, waktu, skill, platform, market) in your response.
4. Give concrete examples, tools, and steps — not vague recommendations.
5. If asked about a specific task, break it down into sub-steps with tools and time estimates.
6. Never suggest paths that conflict with the user's constraints.
7. Keep responses concise but valuable. No filler. No motivational quotes.
8. Format with clear markdown when appropriate.
9. This is a direction system, not a suggestion engine. Be definitive.`;

// ============================================================================
// CLAUDE API CALL
// ============================================================================

async function callClaudeAPI(
  params: GenerationParams,
  apiKey: string,
  baseUrl: string
): Promise<{ title: string; prompt: string }> {
  const userMessage = `Berdasarkan profil user berikut, berikan panduan yang dipersonalisasi:

${params.description}

---
**Kategori:** ${params.category}
**Tone:** ${params.tone || "Helpful & practical"}
${params.difficulty ? `**Level User:** ${params.difficulty}` : ""}
${params.language ? `**Bahasa:** ${params.language}` : ""}

Berikan output yang spesifik, actionable, dan langsung bisa dieksekusi. Gunakan Bahasa Indonesia.`;

  const response = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMsg =
      errorBody?.error?.message ||
      errorBody?.message ||
      `API error ${response.status}`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const promptText = data.content?.[0]?.text || "";

  if (!promptText) {
    throw new Error("Empty response from AI");
  }

  // Extract a title from the first line if it looks like one, else use the input
  const firstLine = promptText.split("\n")[0].replace(/^[#*]+\s*/, "").trim();
  const title =
    firstLine.length > 10 && firstLine.length < 100
      ? firstLine
      : params.title || params.description.substring(0, 80);

  return { title, prompt: promptText };
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generate a prompt using Claude AI.
 * Saves to Supabase generations table if userId is provided.
 */
export async function generatePrompt(
  params: GenerationParams,
  userId?: string
): Promise<GenerationResult> {
  const startTime = Date.now();
  const providers = getProviderConfigs();
  const provider = providers.find((p) => p.isAvailable);

  if (!provider) {
    return {
      id: "",
      title: params.title,
      prompt: "",
      provider: "claude",
      model: "claude-3-sonnet",
      timestamp: new Date().toISOString(),
      success: false,
      error:
        "AI API key not configured. Add VITE_AI_API_KEY to your .env file.",
    };
  }

  try {
    const result = await callClaudeAPI(params, provider.apiKey, provider.baseUrl);
    const processingTime = Date.now() - startTime;

    const generationResult: GenerationResult = {
      id: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      title: result.title,
      prompt: result.prompt,
      provider: "claude",
      model: "claude-3-sonnet",
      timestamp: new Date().toISOString(),
      success: true,
      metadata: {
        processing_time: processingTime,
        model_version: "claude-3-sonnet-20240229",
      },
    };

    // Save to database
    if (userId) {
      try {
        await saveGeneration(generationResult, userId, params);
      } catch (dbError) {
        console.warn("Generation saved but DB write failed:", dbError);
      }
    }

    return generationResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Generation failed:", message);

    return {
      id: "",
      title: params.title,
      prompt: "",
      provider: "claude",
      model: "claude-3-sonnet",
      timestamp: new Date().toISOString(),
      success: false,
      error: message,
    };
  }
}

// ============================================================================
// DATABASE OPERATIONS (all via Supabase)
// ============================================================================

/**
 * Save generation to Supabase generations table
 */
async function saveGeneration(
  result: GenerationResult,
  userId: string,
  params: GenerationParams
): Promise<void> {
  const { error } = await supabase.from("generations").insert({
    user_id: userId,
    ai_tool: params.tool || "AI",
    category: params.category,
    input_description: params.description,
    settings: {
      provider: result.provider,
      model: result.model,
      tone: params.tone,
      language: params.language,
      difficulty: params.difficulty,
    },
    generated_prompts: {
      title: result.title,
      prompt: result.prompt,
      metadata: result.metadata,
    },
  });

  if (error) {
    throw new Error(`DB save failed: ${error.message}`);
  }
}

/**
 * Get user's generation history from Supabase
 */
export async function getGenerationHistory(
  userId: string,
  limit = 50,
  offset = 0
): Promise<GenerationResult[]> {
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`History fetch failed: ${error.message}`);
  }

  return (data || []).map((item) => {
    const settings = (item.settings as Record<string, any>) || {};
    const prompts = (item.generated_prompts as Record<string, any>) || {};

    return {
      id: item.id,
      title: prompts.title || item.category,
      prompt: prompts.prompt || item.input_description,
      provider: (settings.provider as AIProvider) || "claude",
      model: (item.ai_tool as AIModel) || "claude-3-sonnet",
      timestamp: item.created_at,
      success: true,
      metadata: prompts.metadata,
    };
  });
}

/**
 * Delete a generation from Supabase
 */
export async function deleteGeneration(generationId: string): Promise<void> {
  const { error } = await supabase
    .from("generations")
    .delete()
    .eq("id", generationId);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export function getAvailableProviders(): ProviderConfig[] {
  return getProviderConfigs().filter((p) => p.isAvailable);
}

export function getAvailableModels(_provider: AIProvider): AIModel[] {
  return ["claude-3-sonnet", "claude-3-haiku"];
}

export function isProviderAvailable(provider: AIProvider): boolean {
  if (provider === "default") return !!AI_API_KEY;
  const config = getProviderConfigs().find((p) => p.name === provider);
  return config?.isAvailable || false;
}

export function exportGeneration(result: GenerationResult): string {
  return `Title: ${result.title}\nProvider: ${result.provider}\nModel: ${result.model}\nGenerated: ${result.timestamp}\n\n${result.prompt}`;
}

/**
 * Refine an existing prompt with feedback
 */
export async function refineGeneration(
  originalTitle: string,
  originalPrompt: string,
  feedback: string,
  userId?: string
): Promise<GenerationResult> {
  return generatePrompt(
    {
      title: `${originalTitle} (Refined)`,
      description: `Improve this existing prompt based on the following feedback.\n\nORIGINAL PROMPT:\n${originalPrompt}\n\nFEEDBACK:\n${feedback}`,
      category: "refinement",
    },
    userId
  );
}

/**
 * Batch generate
 */
export async function generateBatch(
  paramsList: GenerationParams[],
  userId?: string
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  for (const params of paramsList) {
    results.push(await generatePrompt(params, userId));
  }
  return results;
}
