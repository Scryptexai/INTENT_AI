/**
 * Mock Trend Data — For Development & Demo
 * ==========================================
 * Use this when API keys are not configured yet.
 * Provides realistic-looking trend data for UI testing.
 */

import type { TrendInsight, TrendScore, LifecycleStage } from "./trendIntelligenceEngine";

// Mock trend scores by niche
const MOCK_TRENDS: Record<string, TrendScore[]> = {
  default: [
    {
      keyword: "AI automation",
      score: 85,
      searchVolume: 50000,
      competition: 0.3,
      growth: 0.45,
      lifecycle: "growth" as LifecycleStage,
      risk: "low",
      lastUpdated: new Date().toISOString(),
    },
    {
      keyword: "no-code tools",
      score: 78,
      searchVolume: 35000,
      competition: 0.4,
      growth: 0.35,
      lifecycle: "growth" as LifecycleStage,
      risk: "low",
      lastUpdated: new Date().toISOString(),
    },
    {
      keyword: "virtual assistant",
      score: 72,
      searchVolume: 40000,
      competition: 0.5,
      growth: 0.25,
      lifecycle: "growth" as LifecycleStage,
      risk: "medium",
      lastUpdated: new Date().toISOString(),
    },
    {
      keyword: "content creation",
      score: 80,
      searchVolume: 60000,
      competition: 0.6,
      growth: 0.30,
      lifecycle: "mature" as LifecycleStage,
      risk: "medium",
      lastUpdated: new Date().toISOString(),
    },
    {
      keyword: "social media marketing",
      score: 75,
      searchVolume: 80000,
      competition: 0.7,
      growth: 0.20,
      lifecycle: "mature" as LifecycleStage,
      risk: "medium",
      lastUpdated: new Date().toISOString(),
    },
    {
      keyword: "ChatGPT prompts",
      score: 90,
      searchVolume: 100000,
      competition: 0.5,
      growth: 0.65,
      lifecycle: "growth" as LifecycleStage,
      risk: "low",
      lastUpdated: new Date().toISOString(),
    },
  ],

  // Writing niche
  writing: [
    {
      keyword: "blog writing",
      score: 70,
      searchVolume: 45000,
      competition: 0.5,
      growth: 0.20,
      lifecycle: "mature" as LifecycleStage,
      risk: "medium",
      lastUpdated: new Date().toISOString(),
    },
    {
      keyword: "copywriting",
      score: 75,
      searchVolume: 40000,
      competition: 0.6,
      growth: 0.25,
      lifecycle: "mature" as LifecycleStage,
      risk: "medium",
      lastUpdated: new Date().toISOString(),
    },
    {
      keyword: "SEO content",
      score: 82,
      searchVolume: 55000,
      competition: 0.4,
      growth: 0.35,
      lifecycle: "growth" as LifecycleStage,
      risk: "low",
      lastUpdated: new Date().toISOString(),
    },
  ],

  // Design niche
  design: [
    {
      keyword: "UI design",
      score: 78,
      searchVolume: 50000,
      competition: 0.5,
      growth: 0.28,
      lifecycle: "mature" as LifecycleStage,
      risk: "medium",
      lastUpdated: new Date().toISOString(),
    },
    {
      keyword: "Canva templates",
      score: 85,
      searchVolume: 70000,
      competition: 0.4,
      growth: 0.40,
      lifecycle: "growth" as LifecycleStage,
      risk: "low",
      lastUpdated: new Date().toISOString(),
    },
    {
      keyword: "social media design",
      score: 76,
      searchVolume: 60000,
      competition: 0.6,
      growth: 0.25,
      lifecycle: "mature" as LifecycleStage,
      risk: "medium",
      lastUpdated: new Date().toISOString(),
    },
  ],

  // Tech/Dev niche
  tech: [
    {
      keyword: "web development",
      score: 80,
      searchVolume: 80000,
      competition: 0.6,
      growth: 0.22,
      lifecycle: "mature" as LifecycleStage,
      risk: "medium",
      lastUpdated: new Date().toISOString(),
    },
    {
      keyword: "frontend developer",
      score: 75,
      searchVolume: 45000,
      competition: 0.5,
      growth: 0.20,
      lifecycle: "mature" as LifecycleStage,
      risk: "medium",
      lastUpdated: new Date().toISOString(),
    },
    {
      keyword: "React tutorials",
      score: 85,
      searchVolume: 55000,
      competition: 0.4,
      growth: 0.38,
      lifecycle: "growth" as LifecycleStage,
      risk: "low",
      lastUpdated: new Date().toISOString(),
    },
  ],
};

/**
 * Get mock trend insight for a niche
 */
export function getMockTrendInsight(
  pathId: string,
  niche?: string
): TrendInsight {
  // Determine which mock data to use
  const nicheKey = niche?.toLowerCase().split(" ")[0] || "default";
  const scores = MOCK_TRENDS[nicheKey as keyof typeof MOCK_TRENDS] || MOCK_TRENDS.default;

  // Calculate overall metrics
  const avgScore = Math.round(
    scores.reduce((sum, s) => sum + s.score, 0) / scores.length
  );
  const totalVolume = scores.reduce((sum, s) => sum + s.searchVolume, 0);
  const growthKeywords = scores.filter((s) => s.lifecycle === "growth").length;

  return {
    pathId,
    nicheLabel: niche || "General",
    scores,
    overallScore: avgScore,
    dataPointsTotal: totalVolume,
    growthKeywords,
    matureKeywords: scores.length - growthKeywords,
    lastUpdated: new Date().toISOString(),
    dataSource: "mock_demo",
  };
}

/**
 * Check if mock data should be used (for demo/fallback)
 */
export function shouldUseMockData(hasRealApi: boolean): boolean {
  // Use mock if:
  // 1. No real API configured
  // 2. User explicitly chose demo mode
  return !hasRealApi;
}

/**
 * Get all available mock niches
 */
export function getMockNiches(): string[] {
  return Object.keys(MOCK_TRENDS);
}
