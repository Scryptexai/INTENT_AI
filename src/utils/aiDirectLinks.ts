/**
 * AI Direct Link Utility
 * Generates deep-link URLs that open AI chatbots with a prompt pre-filled.
 *
 * Supported platforms:
 * - ChatGPT (chat.openai.com)
 * - Google Gemini (gemini.google.com)
 * - Grok / xAI (grok.com)
 * - Claude (claude.ai)
 * - Microsoft Copilot (copilot.microsoft.com)
 * - Perplexity (perplexity.ai)
 * - Meta AI (meta.ai)
 * - HuggingChat (huggingface.co)
 * - Stable Diffusion (via Clipdrop / stability.ai)
 * - Midjourney (Discord invite — no direct prompt URL)
 * - DALL-E (via ChatGPT with model selector)
 */

export interface AITarget {
  id: string;
  name: string;
  icon: string;           // emoji or short label
  color: string;          // tailwind bg/text classes
  /** Some platforms don't support direct prompt injection (e.g. Midjourney) */
  supportsDirectPrompt: boolean;
  /** Build a URL that opens this AI with the prompt text. */
  buildUrl: (promptText: string) => string;
}

const enc = (text: string) => encodeURIComponent(text);

export const AI_TARGETS: AITarget[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: "🤖",
    color: "bg-[#10a37f]/15 text-[#10a37f] hover:bg-[#10a37f]/25 border-[#10a37f]/30",
    supportsDirectPrompt: true,
    buildUrl: (text) => `https://chat.openai.com/?q=${enc(text)}`,
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: "✨",
    color: "bg-[#4285f4]/15 text-[#4285f4] hover:bg-[#4285f4]/25 border-[#4285f4]/30",
    supportsDirectPrompt: true,
    buildUrl: (text) => `https://gemini.google.com/app?text=${enc(text)}`,
  },
  {
    id: "claude",
    name: "Claude",
    icon: "🧠",
    color: "bg-[#cc785c]/15 text-[#cc785c] hover:bg-[#cc785c]/25 border-[#cc785c]/30",
    supportsDirectPrompt: true,
    buildUrl: (text) => `https://claude.ai/new?q=${enc(text)}`,
  },
  {
    id: "grok",
    name: "Grok",
    icon: "⚡",
    color: "bg-[#1da1f2]/15 text-[#1da1f2] hover:bg-[#1da1f2]/25 border-[#1da1f2]/30",
    supportsDirectPrompt: true,
    buildUrl: (text) => `https://grok.com/?q=${enc(text)}`,
  },
  {
    id: "copilot",
    name: "Copilot",
    icon: "🪟",
    color: "bg-[#7b68ee]/15 text-[#7b68ee] hover:bg-[#7b68ee]/25 border-[#7b68ee]/30",
    supportsDirectPrompt: true,
    buildUrl: (text) => `https://copilot.microsoft.com/?q=${enc(text)}`,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: "🔍",
    color: "bg-[#20b2aa]/15 text-[#20b2aa] hover:bg-[#20b2aa]/25 border-[#20b2aa]/30",
    supportsDirectPrompt: true,
    buildUrl: (text) => `https://www.perplexity.ai/search?q=${enc(text)}`,
  },
  {
    id: "meta",
    name: "Meta AI",
    icon: "Ⓜ️",
    color: "bg-[#0668E1]/15 text-[#0668E1] hover:bg-[#0668E1]/25 border-[#0668E1]/30",
    supportsDirectPrompt: true,
    buildUrl: (text) => `https://www.meta.ai/?q=${enc(text)}`,
  },
  {
    id: "huggingchat",
    name: "HuggingChat",
    icon: "🤗",
    color: "bg-[#ff9d00]/15 text-[#ff9d00] hover:bg-[#ff9d00]/25 border-[#ff9d00]/30",
    supportsDirectPrompt: true,
    buildUrl: (text) => `https://huggingface.co/chat/?message=${enc(text)}`,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🐋",
    color: "bg-[#4d6bfe]/15 text-[#4d6bfe] hover:bg-[#4d6bfe]/25 border-[#4d6bfe]/30",
    supportsDirectPrompt: true,
    buildUrl: (text) => `https://chat.deepseek.com/?q=${enc(text)}`,
  },
];

/**
 * Get the recommended AI targets for a specific tool name from the prompt.
 * Puts the matching platform first, then others.
 */
export function getOrderedTargets(aiTool?: string): AITarget[] {
  if (!aiTool) return AI_TARGETS;

  const normalised = aiTool.toLowerCase().replace(/\s+/g, "");
  const matchMap: Record<string, string> = {
    chatgpt: "chatgpt",
    openai: "chatgpt",
    "gpt-4": "chatgpt",
    "gpt4": "chatgpt",
    gemini: "gemini",
    google: "gemini",
    claude: "claude",
    anthropic: "claude",
    grok: "grok",
    xai: "grok",
    copilot: "copilot",
    microsoft: "copilot",
    perplexity: "perplexity",
    meta: "meta",
    llama: "meta",
    huggingface: "huggingchat",
    huggingchat: "huggingchat",
    deepseek: "deepseek",
  };

  const matchedId = matchMap[normalised];
  if (!matchedId) return AI_TARGETS;

  const matched = AI_TARGETS.find((t) => t.id === matchedId);
  if (!matched) return AI_TARGETS;

  return [matched, ...AI_TARGETS.filter((t) => t.id !== matchedId)];
}

/**
 * Get the primary (best-match) target for a prompt's ai_tool field.
 */
export function getPrimaryTarget(aiTool?: string): AITarget {
  return getOrderedTargets(aiTool)[0];
}
