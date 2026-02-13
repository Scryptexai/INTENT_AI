/**
 * AI Provider Configuration Utility
 * ==================================
 * Single provider: Claude via z.ai
 * This platform creates prompts — it doesn't need multiple AI backends.
 */

import { AIProvider, getAvailableProviders, isProviderAvailable } from "@/services/multiLLMGenerator";

export interface ProviderInfo {
  name: AIProvider;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  isAvailable: boolean;
  models: string[];
}

export const PROVIDER_INFO: Record<string, ProviderInfo> = {
  claude: {
    name: "claude",
    displayName: "Claude (z.ai)",
    description: "High-quality prompt generation powered by Claude 3 Sonnet",
    icon: "🧠",
    color: "from-purple-500 to-pink-600",
    isAvailable: isProviderAvailable("claude"),
    models: ["Claude 3 Sonnet"],
  },
  default: {
    name: "default",
    displayName: "Auto",
    description: "Uses the configured AI provider",
    icon: "⚡",
    color: "from-blue-500 to-cyan-600",
    isAvailable: isProviderAvailable("default"),
    models: ["Auto"],
  },
};

export function getAvailableProvidersInfo(): ProviderInfo[] {
  const configs = getAvailableProviders();
  return configs.map((c) => PROVIDER_INFO[c.name] || PROVIDER_INFO.default);
}

export function formatProviderName(provider: AIProvider): string {
  return PROVIDER_INFO[provider]?.displayName || provider;
}

export function getProviderStatus(provider: AIProvider): string {
  return isProviderAvailable(provider) ? "Available" : "Not Configured";
}

export function getProviderDescription(provider: AIProvider): string {
  return PROVIDER_INFO[provider]?.description || "";
}

export function getProviderIcon(provider: AIProvider): string {
  return PROVIDER_INFO[provider]?.icon || "🧠";
}

export function getProviderGradient(provider: AIProvider): string {
  return PROVIDER_INFO[provider]?.color || "from-gray-500 to-gray-600";
}
