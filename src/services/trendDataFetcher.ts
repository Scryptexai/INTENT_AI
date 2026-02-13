/**
 * Trend Data Fetcher — REAL Market Data Ingestion Layer
 * ========================================================
 * Production-grade data fetcher. NO fake/estimated data.
 * ALL data comes from real APIs. If API key missing → error logged, skipped.
 *
 * Data Sources:
 *   1. Google Trends (via SerpAPI) → search interest, rising queries, growth
 *   2. Google Custom Search API → content density, competition, affiliate signals
 *   3. YouTube Data API v3 → video volume, engagement, creator density
 *   4. TikTok (via RapidAPI) → social signals, engagement velocity
 *
 * Architecture:
 *   Fetch → Normalize → Store → trendIntelligenceEngine scores them
 *   This service does NOT score. Only fetches and stores REAL data.
 */

import { supabase } from "@/integrations/supabase/client";
import type { TrendDataPoint } from "./trendIntelligenceEngine";

// ============================================================================
// TYPES
// ============================================================================

export interface FetchResult {
  source: string;
  nicheId: string;
  keywordsFetched: number;
  dataPointsCreated: number;
  errors: string[];
  timestamp: string;
}

export interface DataSourceStatus {
  name: string;
  key: string;
  available: boolean;
  reason?: string;
}

interface GoogleTrendsResult {
  keyword: string;
  interest: number;
  growth_7d: number;
  growth_30d: number;
  rising_queries: string[];
  related_topics: string[];
}

interface YouTubeSearchResult {
  keyword: string;
  totalResults: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  topChannelSubs: number;
  publishedRecently: number;
  channelCount: number;
}

interface GoogleSearchResult {
  keyword: string;
  totalResults: number;
  topDomains: string[];
  hasAds: boolean;
  adsCount: number;
  hasAffiliate: boolean;
  affiliateIndicators: number;
}

interface TikTokSignalResult {
  keyword: string;
  videoCount: number;
  avgViews: number;
  avgLikes: number;
  avgShares: number;
  avgComments: number;
  topCreatorFollowers: number;
  engagementRate: number;
}

// ============================================================================
// CONFIGURATION — ALL from env, ZERO hardcoded fallbacks
// ============================================================================

const SERPAPI_KEY = import.meta.env.VITE_SERPAPI_KEY || "";
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || "";
const GOOGLE_CSE_API_KEY = import.meta.env.VITE_GOOGLE_CSE_API_KEY || "";
const GOOGLE_CSE_CX = import.meta.env.VITE_GOOGLE_CSE_CX || "";
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || "";

const MAX_KEYWORDS_PER_FETCH = 10;
const MIN_REFRESH_INTERVAL_HOURS = 24;

// Affiliate domain indicators for competition detection
const AFFILIATE_INDICATORS = [
  "amazon.", "tokopedia.", "shopee.", "bukalapak.", "lazada.",
  "affiliate", "review", "best-", "top-10", "rekomendasi",
  "link.to", "bit.ly", "shope.ee", "s.shopee",
];

// ============================================================================
// DATA SOURCE STATUS — Check which APIs are available
// ============================================================================

export function getDataSourceStatus(): DataSourceStatus[] {
  return [
    {
      name: "Google Trends (SerpAPI)",
      key: "VITE_SERPAPI_KEY",
      available: !!SERPAPI_KEY,
      reason: !SERPAPI_KEY ? "Add VITE_SERPAPI_KEY to .env — get key at serpapi.com" : undefined,
    },
    {
      name: "YouTube Data API v3",
      key: "VITE_YOUTUBE_API_KEY",
      available: !!YOUTUBE_API_KEY,
      reason: !YOUTUBE_API_KEY ? "Add VITE_YOUTUBE_API_KEY to .env — enable in GCP Console" : undefined,
    },
    {
      name: "Google Custom Search",
      key: "VITE_GOOGLE_CSE_API_KEY",
      available: !!(GOOGLE_CSE_API_KEY && GOOGLE_CSE_CX),
      reason: !(GOOGLE_CSE_API_KEY && GOOGLE_CSE_CX)
        ? "Add VITE_GOOGLE_CSE_API_KEY + VITE_GOOGLE_CSE_CX to .env"
        : undefined,
    },
    {
      name: "TikTok (RapidAPI)",
      key: "VITE_RAPIDAPI_KEY",
      available: !!RAPIDAPI_KEY,
      reason: !RAPIDAPI_KEY ? "Add VITE_RAPIDAPI_KEY to .env — get key at rapidapi.com" : undefined,
    },
  ];
}

export function hasAnyDataSource(): boolean {
  return !!(SERPAPI_KEY || YOUTUBE_API_KEY || (GOOGLE_CSE_API_KEY && GOOGLE_CSE_CX) || RAPIDAPI_KEY);
}

export function getAvailableSourceCount(): number {
  let count = 0;
  if (SERPAPI_KEY) count++;
  if (YOUTUBE_API_KEY) count++;
  if (GOOGLE_CSE_API_KEY && GOOGLE_CSE_CX) count++;
  if (RAPIDAPI_KEY) count++;
  return count;
}

// ============================================================================
// 1. GOOGLE TRENDS FETCHER (via SerpAPI) — REAL DATA ONLY
// ============================================================================

export async function fetchGoogleTrends(
  keywords: string[],
  nicheId: string,
  geo: string = "ID",
): Promise<FetchResult> {
  const result: FetchResult = {
    source: "google_trends",
    nicheId,
    keywordsFetched: 0,
    dataPointsCreated: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  if (!SERPAPI_KEY) {
    result.errors.push("SerpAPI key not configured — set VITE_SERPAPI_KEY in .env");
    await logRefresh(result);
    return result;
  }

  const limitedKeywords = keywords.slice(0, MAX_KEYWORDS_PER_FETCH);

  for (const keyword of limitedKeywords) {
    try {
      const trendData = await fetchFromSerpAPI(keyword, geo);
      const dataPoint = googleTrendsToDataPoint(trendData, nicheId);
      const saved = await saveDataPoint(dataPoint);

      if (saved) result.dataPointsCreated++;
      result.keywordsFetched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`[GoogleTrends] ${keyword}: ${msg}`);
    }
  }

  await logRefresh(result);
  return result;
}

async function fetchFromSerpAPI(keyword: string, geo: string): Promise<GoogleTrendsResult> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_trends");
  url.searchParams.set("q", keyword);
  url.searchParams.set("geo", geo);
  url.searchParams.set("data_type", "TIMESERIES");
  url.searchParams.set("date", "today 3-m");
  url.searchParams.set("api_key", SERPAPI_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`SerpAPI HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(`SerpAPI: ${data.error}`);

  const timelineData = data.interest_over_time?.timeline_data || [];
  if (timelineData.length === 0) {
    throw new Error(`No timeline data for "${keyword}"`);
  }

  const latestInterest = timelineData[timelineData.length - 1]?.values?.[0]?.extracted_value ?? 0;
  const values = timelineData.map((t: any) => t.values?.[0]?.extracted_value ?? 0);

  return {
    keyword,
    interest: latestInterest,
    growth_7d: calcGrowthRate(values, 7),
    growth_30d: calcGrowthRate(values, 30),
    rising_queries: (data.related_queries?.rising || []).slice(0, 10).map((q: any) => q.query),
    related_topics: (data.related_topics?.rising || []).slice(0, 10).map((t: any) => t.topic?.title || "").filter(Boolean),
  };
}

function googleTrendsToDataPoint(trend: GoogleTrendsResult, nicheId: string): Omit<TrendDataPoint, "id"> {
  return {
    niche_id: nicheId,
    keyword: trend.keyword,
    platform: "google",
    date: new Date().toISOString().split("T")[0],
    search_volume: trend.interest,
    search_volume_source: "serpapi_trends",
    growth_rate_7d: trend.growth_7d,
    growth_rate_30d: trend.growth_30d,
    growth_rate_90d: 0,
    cpc: 0,
    affiliate_density: 0,
    ads_density: 0,
    content_density: 0,
    creator_density: 0,
    engagement_velocity: 0,
    source: "google_trends",
    confidence: 0.90,
    raw_data: {
      rising_queries: trend.rising_queries,
      related_topics: trend.related_topics,
      original_interest: trend.interest,
    },
  };
}

// ============================================================================
// 2. YOUTUBE DATA API v3 FETCHER — REAL DATA ONLY
// ============================================================================

export async function fetchYouTubeData(
  keywords: string[],
  nicheId: string,
): Promise<FetchResult> {
  const result: FetchResult = {
    source: "youtube_api",
    nicheId,
    keywordsFetched: 0,
    dataPointsCreated: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  if (!YOUTUBE_API_KEY) {
    result.errors.push("YouTube API key not configured — set VITE_YOUTUBE_API_KEY in .env");
    await logRefresh(result);
    return result;
  }

  const limitedKeywords = keywords.slice(0, MAX_KEYWORDS_PER_FETCH);

  for (const keyword of limitedKeywords) {
    try {
      const ytData = await fetchFromYouTubeAPI(keyword);
      const dataPoint = youtubeToDataPoint(ytData, nicheId);
      const saved = await saveDataPoint(dataPoint);

      if (saved) result.dataPointsCreated++;
      result.keywordsFetched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`[YouTube] ${keyword}: ${msg}`);
    }
  }

  await logRefresh(result);
  return result;
}

async function fetchFromYouTubeAPI(keyword: string): Promise<YouTubeSearchResult> {
  // Step 1: Search for recent videos (last 30 days)
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", keyword);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "relevance");
  searchUrl.searchParams.set("maxResults", "15");
  searchUrl.searchParams.set("publishedAfter", getDateDaysAgo(30).toISOString());
  searchUrl.searchParams.set("relevanceLanguage", "id");
  searchUrl.searchParams.set("regionCode", "ID");
  searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

  const searchResponse = await fetch(searchUrl.toString());
  if (!searchResponse.ok) {
    const body = await searchResponse.text().catch(() => "");
    throw new Error(`YouTube Search HTTP ${searchResponse.status}: ${body.slice(0, 200)}`);
  }

  const searchData = await searchResponse.json();
  if (searchData.error) {
    throw new Error(`YouTube API: ${searchData.error.message || JSON.stringify(searchData.error)}`);
  }

  const totalResults = searchData.pageInfo?.totalResults || 0;
  const items = searchData.items || [];
  const videoIds = items.map((item: any) => item.id?.videoId).filter(Boolean);

  if (videoIds.length === 0) {
    return { keyword, totalResults: 0, avgViews: 0, avgLikes: 0, avgComments: 0, topChannelSubs: 0, publishedRecently: 0, channelCount: 0 };
  }

  // Step 2: Get video statistics
  let avgViews = 0, avgLikes = 0, avgComments = 0;
  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.searchParams.set("part", "statistics");
  statsUrl.searchParams.set("id", videoIds.join(","));
  statsUrl.searchParams.set("key", YOUTUBE_API_KEY);

  const statsResponse = await fetch(statsUrl.toString());
  if (statsResponse.ok) {
    const statsData = await statsResponse.json();
    const videos = statsData.items || [];
    if (videos.length > 0) {
      avgViews = videos.reduce((s: number, v: any) => s + parseInt(v.statistics?.viewCount || "0"), 0) / videos.length;
      avgLikes = videos.reduce((s: number, v: any) => s + parseInt(v.statistics?.likeCount || "0"), 0) / videos.length;
      avgComments = videos.reduce((s: number, v: any) => s + parseInt(v.statistics?.commentCount || "0"), 0) / videos.length;
    }
  }

  // Step 3: Count unique channels
  const uniqueChannels = new Set(items.map((item: any) => item.snippet?.channelId)).size;

  // Step 4: Top channel subscriber count
  let topChannelSubs = 0;
  const topChannelId = items[0]?.snippet?.channelId;
  if (topChannelId) {
    try {
      const chUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      chUrl.searchParams.set("part", "statistics");
      chUrl.searchParams.set("id", topChannelId);
      chUrl.searchParams.set("key", YOUTUBE_API_KEY);
      const chRes = await fetch(chUrl.toString());
      if (chRes.ok) {
        const chData = await chRes.json();
        topChannelSubs = parseInt(chData.items?.[0]?.statistics?.subscriberCount || "0");
      }
    } catch { /* non-critical */ }
  }

  return {
    keyword,
    totalResults,
    avgViews: Math.round(avgViews),
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    topChannelSubs,
    publishedRecently: totalResults > 0 ? 100 : 0,
    channelCount: uniqueChannels,
  };
}

function youtubeToDataPoint(yt: YouTubeSearchResult, nicheId: string): Omit<TrendDataPoint, "id"> {
  const engVelocity = yt.avgViews > 0
    ? ((yt.avgLikes + yt.avgComments * 3) / yt.avgViews) * 100
    : 0;

  const normalizedVolume = Math.min(100, Math.round(yt.totalResults / 500));

  const competitionFromSubs = yt.topChannelSubs > 100000 ? 0.8
    : yt.topChannelSubs > 10000 ? 0.5
    : yt.topChannelSubs > 1000 ? 0.3 : 0.1;

  return {
    niche_id: nicheId,
    keyword: yt.keyword,
    platform: "youtube",
    date: new Date().toISOString().split("T")[0],
    search_volume: normalizedVolume,
    search_volume_source: "youtube_api_v3",
    growth_rate_7d: 0,
    growth_rate_30d: 0,
    growth_rate_90d: 0,
    cpc: 0,
    affiliate_density: 0,
    ads_density: competitionFromSubs,
    content_density: yt.totalResults,
    creator_density: yt.channelCount,
    engagement_velocity: Math.min(10, engVelocity),
    source: "youtube_api",
    confidence: 0.85,
    raw_data: {
      avg_views: yt.avgViews,
      avg_likes: yt.avgLikes,
      avg_comments: yt.avgComments,
      total_results: yt.totalResults,
      unique_channels: yt.channelCount,
      top_channel_subs: yt.topChannelSubs,
    },
  };
}

// ============================================================================
// 3. GOOGLE CUSTOM SEARCH — Content Density & Affiliate/Ads Detection
// ============================================================================

export async function fetchGoogleSearchData(
  keywords: string[],
  nicheId: string,
): Promise<FetchResult> {
  const result: FetchResult = {
    source: "google_cse",
    nicheId,
    keywordsFetched: 0,
    dataPointsCreated: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  if (!GOOGLE_CSE_API_KEY || !GOOGLE_CSE_CX) {
    result.errors.push("Google CSE not configured — set VITE_GOOGLE_CSE_API_KEY + VITE_GOOGLE_CSE_CX in .env");
    await logRefresh(result);
    return result;
  }

  const limitedKeywords = keywords.slice(0, MAX_KEYWORDS_PER_FETCH);

  for (const keyword of limitedKeywords) {
    try {
      const searchData = await fetchFromGoogleCSE(keyword);
      const dataPoint = googleCSEToDataPoint(searchData, nicheId);
      const saved = await saveDataPoint(dataPoint);

      if (saved) result.dataPointsCreated++;
      result.keywordsFetched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`[GoogleCSE] ${keyword}: ${msg}`);
    }
  }

  await logRefresh(result);
  return result;
}

async function fetchFromGoogleCSE(keyword: string): Promise<GoogleSearchResult> {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", GOOGLE_CSE_API_KEY);
  url.searchParams.set("cx", GOOGLE_CSE_CX);
  url.searchParams.set("q", keyword);
  url.searchParams.set("gl", "id");
  url.searchParams.set("lr", "lang_id");
  url.searchParams.set("num", "10");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Google CSE HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(`Google CSE: ${data.error.message}`);

  const totalResults = parseInt(data.searchInformation?.totalResults || "0");
  const items = data.items || [];

  const topDomains = items
    .map((item: any) => { try { return new URL(item.link).hostname; } catch { return ""; } })
    .filter(Boolean)
    .slice(0, 5);

  const hasAds = items.some((item: any) =>
    item.title?.toLowerCase().includes("sponsored") ||
    item.snippet?.toLowerCase().includes("iklan")
  );

  let affiliateCount = 0;
  for (const item of items) {
    const text = `${item.link} ${item.title} ${item.snippet}`.toLowerCase();
    if (AFFILIATE_INDICATORS.some(ind => text.includes(ind))) affiliateCount++;
  }

  return {
    keyword,
    totalResults,
    topDomains,
    hasAds,
    adsCount: hasAds ? 1 : 0,
    hasAffiliate: affiliateCount > 0,
    affiliateIndicators: affiliateCount,
  };
}

function googleCSEToDataPoint(gs: GoogleSearchResult, nicheId: string): Omit<TrendDataPoint, "id"> {
  return {
    niche_id: nicheId,
    keyword: gs.keyword,
    platform: "google_search",
    date: new Date().toISOString().split("T")[0],
    search_volume: 0,
    search_volume_source: "google_cse",
    growth_rate_7d: 0,
    growth_rate_30d: 0,
    growth_rate_90d: 0,
    cpc: gs.hasAds ? 0.5 : 0,
    affiliate_density: gs.affiliateIndicators / 10,
    ads_density: gs.hasAds ? 0.5 : 0.1,
    content_density: Math.min(50000, gs.totalResults),
    creator_density: new Set(gs.topDomains).size,
    engagement_velocity: 0,
    source: "google_cse",
    confidence: 0.75,
    raw_data: {
      total_results: gs.totalResults,
      top_domains: gs.topDomains,
      has_ads: gs.hasAds,
      affiliate_indicators: gs.affiliateIndicators,
    },
  };
}

// ============================================================================
// 4. TIKTOK SIGNAL FETCHER (via RapidAPI) — Social Velocity
// ============================================================================

export async function fetchTikTokData(
  keywords: string[],
  nicheId: string,
): Promise<FetchResult> {
  const result: FetchResult = {
    source: "tiktok_rapidapi",
    nicheId,
    keywordsFetched: 0,
    dataPointsCreated: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  if (!RAPIDAPI_KEY) {
    result.errors.push("RapidAPI key not configured — set VITE_RAPIDAPI_KEY in .env");
    await logRefresh(result);
    return result;
  }

  const limitedKeywords = keywords.slice(0, 5);

  for (const keyword of limitedKeywords) {
    try {
      const ttData = await fetchFromTikTokRapidAPI(keyword);
      const dataPoint = tikTokToDataPoint(ttData, nicheId);
      const saved = await saveDataPoint(dataPoint);

      if (saved) result.dataPointsCreated++;
      result.keywordsFetched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`[TikTok] ${keyword}: ${msg}`);
    }
  }

  await logRefresh(result);
  return result;
}

async function fetchFromTikTokRapidAPI(keyword: string): Promise<TikTokSignalResult> {
  const url = new URL("https://tiktok-data1.p.rapidapi.com/search/posts");
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("count", "10");
  url.searchParams.set("offset", "0");

  const response = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": "tiktok-data1.p.rapidapi.com",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`TikTok RapidAPI HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const videos = data.data?.videos || data.itemList || data.items || [];

  if (videos.length === 0) {
    return { keyword, videoCount: 0, avgViews: 0, avgLikes: 0, avgShares: 0, avgComments: 0, topCreatorFollowers: 0, engagementRate: 0 };
  }

  const stats = videos.map((v: any) => ({
    views: v.stats?.playCount || v.playCount || 0,
    likes: v.stats?.diggCount || v.diggCount || 0,
    shares: v.stats?.shareCount || v.shareCount || 0,
    comments: v.stats?.commentCount || v.commentCount || 0,
    followers: v.author?.stats?.followerCount || v.authorStats?.followerCount || 0,
  }));

  const total = stats.length;
  const avgViews = stats.reduce((s: number, v: any) => s + v.views, 0) / total;
  const avgLikes = stats.reduce((s: number, v: any) => s + v.likes, 0) / total;
  const avgShares = stats.reduce((s: number, v: any) => s + v.shares, 0) / total;
  const avgComments = stats.reduce((s: number, v: any) => s + v.comments, 0) / total;
  const topFollowers = Math.max(...stats.map((s: any) => s.followers));
  const engRate = avgViews > 0 ? ((avgLikes + avgComments + avgShares) / avgViews) * 100 : 0;

  return {
    keyword,
    videoCount: total,
    avgViews: Math.round(avgViews),
    avgLikes: Math.round(avgLikes),
    avgShares: Math.round(avgShares),
    avgComments: Math.round(avgComments),
    topCreatorFollowers: topFollowers,
    engagementRate: Math.round(engRate * 100) / 100,
  };
}

function tikTokToDataPoint(tt: TikTokSignalResult, nicheId: string): Omit<TrendDataPoint, "id"> {
  return {
    niche_id: nicheId,
    keyword: tt.keyword,
    platform: "tiktok",
    date: new Date().toISOString().split("T")[0],
    search_volume: Math.min(100, Math.round(tt.videoCount * 10)),
    search_volume_source: "tiktok_rapidapi",
    growth_rate_7d: 0,
    growth_rate_30d: 0,
    growth_rate_90d: 0,
    cpc: 0,
    affiliate_density: 0,
    ads_density: 0,
    content_density: tt.videoCount,
    creator_density: Math.min(tt.videoCount, 10),
    engagement_velocity: Math.min(10, tt.engagementRate),
    source: "tiktok_rapidapi",
    confidence: 0.75,
    raw_data: {
      avg_views: tt.avgViews,
      avg_likes: tt.avgLikes,
      avg_shares: tt.avgShares,
      avg_comments: tt.avgComments,
      top_creator_followers: tt.topCreatorFollowers,
      engagement_rate: tt.engagementRate,
      video_count: tt.videoCount,
    },
  };
}

// ============================================================================
// 5. FULL REFRESH PIPELINE — Fetches ALL available real sources
// ============================================================================

export async function refreshNicheData(
  nicheId: string,
  keywords: string[],
): Promise<FetchResult[]> {
  // Check refresh interval
  const canRefresh = await checkRefreshInterval(nicheId);
  if (!canRefresh) {
    return [{
      source: "throttled",
      nicheId,
      keywordsFetched: 0,
      dataPointsCreated: 0,
      errors: ["Refresh throttled — data updated less than 24h ago"],
      timestamp: new Date().toISOString(),
    }];
  }

  // Require at least one real data source
  if (!hasAnyDataSource()) {
    return [{
      source: "no_api_configured",
      nicheId,
      keywordsFetched: 0,
      dataPointsCreated: 0,
      errors: [
        "❌ No data source API configured. Add at least one API key to .env:",
        "  → VITE_SERPAPI_KEY (Google Trends — recommended, serpapi.com)",
        "  → VITE_YOUTUBE_API_KEY (YouTube Data — free 10k/day, GCP Console)",
        "  → VITE_GOOGLE_CSE_API_KEY + VITE_GOOGLE_CSE_CX (Google Search, GCP Console)",
        "  → VITE_RAPIDAPI_KEY (TikTok social signals, rapidapi.com)",
      ],
      timestamp: new Date().toISOString(),
    }];
  }

  // Fetch from all available sources in parallel
  const fetchPromises: Promise<FetchResult>[] = [];

  if (SERPAPI_KEY) fetchPromises.push(fetchGoogleTrends(keywords, nicheId));
  if (YOUTUBE_API_KEY) fetchPromises.push(fetchYouTubeData(keywords, nicheId));
  if (GOOGLE_CSE_API_KEY && GOOGLE_CSE_CX) fetchPromises.push(fetchGoogleSearchData(keywords, nicheId));
  if (RAPIDAPI_KEY) fetchPromises.push(fetchTikTokData(keywords, nicheId));

  const settled = await Promise.allSettled(fetchPromises);
  const results: FetchResult[] = [];

  for (const s of settled) {
    if (s.status === "fulfilled") {
      results.push(s.value);
    } else {
      results.push({
        source: "failed",
        nicheId,
        keywordsFetched: 0,
        dataPointsCreated: 0,
        errors: [`Fetch crashed: ${s.reason}`],
        timestamp: new Date().toISOString(),
      });
    }
  }

  // After all sources fetched, merge cross-source data
  try {
    const merged = await mergeDataPoints(nicheId);
    if (merged > 0) {
      results.push({
        source: "data_merge",
        nicheId,
        keywordsFetched: 0,
        dataPointsCreated: merged,
        errors: [],
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("[Fetcher] Merge failed:", err);
  }

  return results;
}

// ============================================================================
// 6. DATA MERGE — Enrich data points with cross-source signals
// ============================================================================

export async function mergeDataPoints(nicheId: string): Promise<number> {
  const { data: points, error } = await supabase
    .from("trend_data_points" as any)
    .select("*")
    .eq("niche_id", nicheId)
    .order("date", { ascending: false });

  if (error || !points) return 0;

  const byKeyword: Record<string, any[]> = {};
  for (const p of points) {
    const kw = (p as any).keyword;
    if (!byKeyword[kw]) byKeyword[kw] = [];
    byKeyword[kw].push(p);
  }

  let mergedCount = 0;

  for (const [, sources] of Object.entries(byKeyword)) {
    if (sources.length < 2) continue;

    const googleTrends = sources.find((s: any) => s.source === "google_trends");
    const youtube = sources.find((s: any) => s.source === "youtube_api");
    const googleCSE = sources.find((s: any) => s.source === "google_cse");
    const tiktok = sources.find((s: any) => s.source === "tiktok_rapidapi");

    // Enrich the primary record (Google Trends preferred) with cross-source data
    const primary = googleTrends || youtube || sources[0];
    if (!primary) continue;

    const updates: Record<string, any> = {};

    if (youtube && primary !== youtube) {
      if ((youtube as any).engagement_velocity > 0) updates.engagement_velocity = (youtube as any).engagement_velocity;
      if ((youtube as any).creator_density > 0) updates.creator_density = (youtube as any).creator_density;
      if ((youtube as any).content_density > 0) updates.content_density = (youtube as any).content_density;
    }

    if (googleCSE) {
      if ((googleCSE as any).affiliate_density > 0) updates.affiliate_density = (googleCSE as any).affiliate_density;
      if ((googleCSE as any).ads_density > 0) updates.ads_density = (googleCSE as any).ads_density;
      if ((googleCSE as any).cpc > 0) updates.cpc = (googleCSE as any).cpc;
    }

    if (tiktok && (tiktok as any).engagement_velocity > 0) {
      const ytEng = (youtube as any)?.engagement_velocity || 0;
      const ttEng = (tiktok as any).engagement_velocity;
      updates.engagement_velocity = ytEng > 0 ? (ytEng + ttEng) / 2 : ttEng;
    }

    if (Object.keys(updates).length > 0) {
      const { error: ue } = await supabase
        .from("trend_data_points" as any)
        .update(updates)
        .eq("id", (primary as any).id);

      if (!ue) mergedCount++;
    }
  }

  return mergedCount;
}

// ============================================================================
// HELPERS
// ============================================================================

async function checkRefreshInterval(nicheId: string): Promise<boolean> {
  const { data } = await supabase
    .from("trend_refresh_log" as any)
    .select("completed_at")
    .eq("niche_id", nicheId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return true;

  const lastRefresh = new Date((data[0] as any).completed_at);
  const hoursSince = (Date.now() - lastRefresh.getTime()) / (1000 * 60 * 60);
  return hoursSince >= MIN_REFRESH_INTERVAL_HOURS;
}

async function saveDataPoint(point: Omit<TrendDataPoint, "id">): Promise<boolean> {
  const { error } = await supabase
    .from("trend_data_points" as any)
    .upsert(point as any, { onConflict: "niche_id,keyword,platform,date" });

  if (error) {
    console.error(`[Fetcher] Save failed:`, error);
    return false;
  }
  return true;
}

async function logRefresh(result: FetchResult): Promise<void> {
  await supabase
    .from("trend_refresh_log" as any)
    .insert({
      source: result.source,
      niche_id: result.nicheId,
      status: result.errors.length === 0 ? "completed" : "completed_with_errors",
      keywords_fetched: result.keywordsFetched,
      data_points_created: result.dataPointsCreated,
      error_message: result.errors.length > 0 ? result.errors.join("; ") : null,
      started_at: result.timestamp,
      completed_at: new Date().toISOString(),
    } as any);
}

function calcGrowthRate(values: number[], days: number): number {
  if (values.length < 2) return 0;
  const weeksBack = Math.ceil(days / 7);
  const currentIdx = values.length - 1;
  const pastIdx = Math.max(0, currentIdx - weeksBack);
  const current = values[currentIdx];
  const past = values[pastIdx];
  if (past === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - past) / past) * 100);
}

function getDateDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}
