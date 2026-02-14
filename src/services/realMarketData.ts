/**
 * Real Market Data Fetcher — Live API Data for AI Context
 * =========================================================
 * Fetches REAL data from available APIs to enrich AI context.
 * Uses: SerpAPI (Google Trends), YouTube Data API, RapidAPI (TikTok).
 *
 * This is NOT for scoring/display — it's for giving AI REAL market context
 * so every recommendation is data-backed, not guesswork.
 *
 * Caching: 6 hours per niche to avoid excessive API calls.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MarketContext {
  niche: string;
  platform: string;
  fetchedAt: string;
  
  // Google Trends (SerpAPI)
  trendingKeywords: string[];
  searchInterest: number; // 0-100
  risingQueries: string[];
  trendDirection: "rising" | "stable" | "declining";

  // YouTube Data API
  youtubeInsight: string;
  youtubeVideoCount: number;
  youtubeAvgViews: number;

  // Competition density
  competitorDensity: string;
  
  // Social signal
  socialSignal: string;
  
  // Overall demand
  demandSignal: string;
}

// ============================================================================
// CONFIG
// ============================================================================

const SERPAPI_KEY = import.meta.env.VITE_SERPAPI_KEY || "";
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || "";
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || "";

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours
const cache = new Map<string, { data: MarketContext; timestamp: number }>();

// ============================================================================
// MAIN FUNCTION — Fetch all available market data
// ============================================================================

export async function fetchRealMarketContext(
  niche: string,
  platform: string
): Promise<MarketContext | null> {
  const cacheKey = `${niche}:${platform}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }

  const keywords = generateSearchKeywords(niche, platform);
  
  const context: MarketContext = {
    niche,
    platform,
    fetchedAt: new Date().toISOString(),
    trendingKeywords: [],
    searchInterest: 0,
    risingQueries: [],
    trendDirection: "stable",
    youtubeInsight: "",
    youtubeVideoCount: 0,
    youtubeAvgViews: 0,
    competitorDensity: "",
    socialSignal: "",
    demandSignal: "",
  };

  // Fetch from all available sources in parallel
  const promises: Promise<void>[] = [];

  if (SERPAPI_KEY) {
    promises.push(fetchGoogleTrendsData(keywords[0], context).catch(() => {}));
  }
  if (YOUTUBE_API_KEY) {
    promises.push(fetchYouTubeData(keywords[0], context).catch(() => {}));
  }
  if (RAPIDAPI_KEY) {
    promises.push(fetchTikTokData(keywords[0], context).catch(() => {}));
  }

  await Promise.allSettled(promises);

  // Compute overall demand signal
  context.demandSignal = computeDemandSignal(context);

  // Cache result
  cache.set(cacheKey, { data: context, timestamp: Date.now() });

  return context;
}

// ============================================================================
// GOOGLE TRENDS via SerpAPI
// ============================================================================

async function fetchGoogleTrendsData(keyword: string, ctx: MarketContext): Promise<void> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_trends");
  url.searchParams.set("q", keyword);
  url.searchParams.set("geo", "ID");
  url.searchParams.set("data_type", "TIMESERIES");
  url.searchParams.set("date", "today 3-m");
  url.searchParams.set("api_key", SERPAPI_KEY);

  const resp = await fetch(url.toString());
  if (!resp.ok) return;

  const data = await resp.json();

  // Extract interest over time
  const timelineData = data.interest_over_time?.timeline_data;
  if (timelineData && timelineData.length > 0) {
    const values = timelineData.map((d: any) => d.values?.[0]?.extracted_value || 0);
    const recent = values.slice(-4);
    const older = values.slice(-8, -4);
    
    const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a: number, b: number) => a + b, 0) / older.length : recentAvg;
    
    ctx.searchInterest = Math.round(recentAvg);
    ctx.trendDirection = recentAvg > olderAvg * 1.15 ? "rising" : recentAvg < olderAvg * 0.85 ? "declining" : "stable";
  }

  // Extract related queries
  const relatedQueries = data.related_queries?.rising;
  if (relatedQueries) {
    ctx.risingQueries = relatedQueries
      .slice(0, 5)
      .map((q: any) => q.query || "")
      .filter(Boolean);
    ctx.trendingKeywords = ctx.risingQueries.slice(0, 3);
  }

  // Also try related topics
  const relatedTopics = data.related_topics?.rising;
  if (relatedTopics && ctx.trendingKeywords.length < 3) {
    const topics = relatedTopics
      .slice(0, 3)
      .map((t: any) => t.topic?.title || "")
      .filter(Boolean);
    ctx.trendingKeywords = [...ctx.trendingKeywords, ...topics].slice(0, 5);
  }
}

// ============================================================================
// YOUTUBE DATA API v3
// ============================================================================

async function fetchYouTubeData(keyword: string, ctx: MarketContext): Promise<void> {
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", keyword);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "viewCount");
  searchUrl.searchParams.set("maxResults", "10");
  searchUrl.searchParams.set("publishedAfter", getThreeMonthsAgo());
  searchUrl.searchParams.set("relevanceLanguage", "id");
  searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

  const resp = await fetch(searchUrl.toString());
  if (!resp.ok) return;

  const data = await resp.json();
  const items = data.items || [];
  
  ctx.youtubeVideoCount = data.pageInfo?.totalResults || items.length;

  if (items.length === 0) {
    ctx.youtubeInsight = `Sangat sedikit video tentang "${keyword}" di YouTube — peluang low competition`;
    return;
  }

  // Get video stats for top results
  const videoIds = items.map((item: any) => item.id?.videoId).filter(Boolean).join(",");
  if (!videoIds) return;

  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.searchParams.set("part", "statistics");
  statsUrl.searchParams.set("id", videoIds);
  statsUrl.searchParams.set("key", YOUTUBE_API_KEY);

  const statsResp = await fetch(statsUrl.toString());
  if (!statsResp.ok) return;

  const statsData = await statsResp.json();
  const videos = statsData.items || [];

  if (videos.length > 0) {
    const views = videos.map((v: any) => parseInt(v.statistics?.viewCount || "0"));
    ctx.youtubeAvgViews = Math.round(views.reduce((a: number, b: number) => a + b, 0) / views.length);

    if (ctx.youtubeAvgViews > 100000) {
      ctx.youtubeInsight = `High demand di YouTube — top 10 video rata-rata ${formatNumber(ctx.youtubeAvgViews)} views. Market besar tapi kompetisi tinggi.`;
    } else if (ctx.youtubeAvgViews > 10000) {
      ctx.youtubeInsight = `Medium demand — rata-rata ${formatNumber(ctx.youtubeAvgViews)} views. Sweet spot: cukup audience, belum terlalu crowded.`;
    } else {
      ctx.youtubeInsight = `Niche market — rata-rata ${formatNumber(ctx.youtubeAvgViews)} views. Low competition, cocok untuk newbie yang mau build authority.`;
    }

    ctx.competitorDensity = ctx.youtubeVideoCount > 50000 
      ? "Tinggi — banyak creator, butuh diferensiasi kuat"
      : ctx.youtubeVideoCount > 10000
        ? "Sedang — ada space tapi butuh angle unik"
        : "Rendah — peluang jadi early mover";
  }
}

// ============================================================================
// TIKTOK via RapidAPI
// ============================================================================

async function fetchTikTokData(keyword: string, ctx: MarketContext): Promise<void> {
  try {
    const resp = await fetch(`https://tiktok-scraper7.p.rapidapi.com/feed/search?keywords=${encodeURIComponent(keyword)}&count=10&region=ID`, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",
      },
    });

    if (!resp.ok) return;

    const data = await resp.json();
    const videos = data.data?.videos || data.data || [];

    if (Array.isArray(videos) && videos.length > 0) {
      const totalViews = videos.reduce((sum: number, v: any) => sum + (v.play_count || v.stats?.playCount || 0), 0);
      const avgViews = Math.round(totalViews / videos.length);
      const totalLikes = videos.reduce((sum: number, v: any) => sum + (v.digg_count || v.stats?.diggCount || 0), 0);
      const engagementRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : "0";

      if (avgViews > 500000) {
        ctx.socialSignal = `TikTok: Viral potential tinggi — rata-rata ${formatNumber(avgViews)} views, engagement ${engagementRate}%`;
      } else if (avgViews > 50000) {
        ctx.socialSignal = `TikTok: Demand bagus — rata-rata ${formatNumber(avgViews)} views, engagement ${engagementRate}%`;
      } else {
        ctx.socialSignal = `TikTok: Niche tapi ada audience — rata-rata ${formatNumber(avgViews)} views`;
      }
    }
  } catch {
    // TikTok API can be flaky, skip gracefully
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function generateSearchKeywords(niche: string, platform: string): string[] {
  const base = niche.replace(/_/g, " ");
  return [
    base,
    `${base} Indonesia`,
    `${base} ${platform}`,
    `cara ${base}`,
    `${base} 2025`,
  ];
}

function computeDemandSignal(ctx: MarketContext): string {
  const signals: string[] = [];

  if (ctx.trendDirection === "rising") signals.push("Google Trends NAIK — timing bagus");
  if (ctx.trendDirection === "declining") signals.push("Google Trends TURUN — hati-hati");
  if (ctx.youtubeAvgViews > 50000) signals.push("YouTube demand tinggi");
  if (ctx.socialSignal) signals.push("Ada traction di social media");
  if (ctx.risingQueries.length > 3) signals.push(`${ctx.risingQueries.length} rising queries terdeteksi`);

  if (signals.length === 0) return "Data market belum cukup — perlu waktu untuk validasi";
  return signals.join(". ");
}

function getThreeMonthsAgo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString();
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
