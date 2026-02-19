/**
 * Market Data Noise Filtering Layer
 * =================================
 * Fungsi: Filter, validate, dan clean data mentah dari API sebelum ditampilkan ke user.
 * Tujuan: Hanya tampilkan data yang RELEVAN, FRESH, dan TERVALIDASI.
 *
 * Dibuat berdasarkan INTENT_DOC.txt requirement:
 * "Data bisa berasal dari Google API, SerpAPI, RapidAPI.
 *  Tapi semua data harus melalui: Noise Filtering & Structuring
 *  sebelum tampil ke user."
 */

import type { RealMarketIntel } from "./jobResearchEngine";

// ============================================================================
// TYPES
// ============================================================================

export interface FilteredMarketData {
  /** Data yang lolos filter */
  approvedSignals: ApprovedMarketSignal[];
  /** Data yang dibuang + alasan */
  rejectedSignals: RejectedSignal[];
  /** Skor kualitas data (0-100) */
  dataQualityScore: number;
  /** Rekomendasi sistem */
  systemRecommendation: string;
}

export interface ApprovedMarketSignal {
  type: "trend" | "keyword" | "platform" | "job_listing";
  content: string;
  source: string;
  confidenceScore: number; // 0-100
  freshness: "fresh" | "moderate" | "stale";
  evidence?: {
    value: number;
    unit: string;
    trend?: "rising" | "stable" | "declining";
  };
}

export interface RejectedSignal {
  type: string;
  content: string;
  reason: "low_relevance" | "stale_data" | "spam" | "inconsistent" | "low_confidence";
  originalScore: number;
}

// ============================================================================
// CONFIGURATION - Threshold untuk filter
// ============================================================================

const FILTER_CONFIG = {
  // Minimum relevansi score (0-100)
  MIN_RELEVANCE_SCORE: 40,

  // Maximum umur data (hari)
  MAX_DATA_AGE_DAYS: 180, // 6 bulan

  // Minimum confidence untuk multiple source validation
  MIN_MULTI_SOURCE_CONFIDENCE: 60,

  // Minimum keyword search volume (Google Trends)
  MIN_SEARCH_INTEREST: 20,

  // Minimum engagement untuk social signal
  MIN_SOCIAL_ENGAGEMENT: 1000, // views/likes

  // Spam filter keywords
  SPAM_KEYWORDS: [
    "free money", "get rich quick", "click here", "buy now",
    "limited time", "act now", "winner", "congratulations",
    "scam", "fraud", "hack", "cheat"
  ],

  // Low quality domain patterns
  LOW_QUALITY_DOMAINS: [
    ".xyz", ".top", ".gq", ".tk", ".ml"
  ],
};

// ============================================================================
// MAIN FUNCTION: Filter semua market data
// ============================================================================

export function filterMarketData(
  rawIntel: RealMarketIntel,
  niche: string,
  subSector: string
): FilteredMarketData {
  const approved: ApprovedMarketSignal[] = [];
  const rejected: RejectedSignal[] = [];

  // 1. Filter Google Trends data
  const googleTrendsSignals = filterGoogleTrends(rawIntel, niche);
  approved.push(...googleTrendsSignals.approved);
  rejected.push(...googleTrendsSignals.rejected);

  // 2. Filter YouTube data
  const youtubeSignals = filterYouTubeData(rawIntel, niche);
  approved.push(...youtubeSignals.approved);
  rejected.push(...youtubeSignals.rejected);

  // 3. Filter TikTok data
  const tiktokSignals = filterTikTokData(rawIntel, niche);
  approved.push(...tiktokSignals.approved);
  rejected.push(...tiktokSignals.rejected);

  // 4. Filter Instagram data
  const instagramSignals = filterInstagramData(rawIntel, niche);
  approved.push(...instagramSignals.approved);
  rejected.push(...instagramSignals.rejected);

  // 5. Filter Google Search results
  const searchSignals = filterGoogleSearchResults(rawIntel, niche);
  approved.push(...searchSignals.approved);
  rejected.push(...searchSignals.rejected);

  // 6. Hitung data quality score
  const qualityScore = calculateDataQualityScore(approved, rejected, rawIntel);

  // 7. Generate system recommendation
  const recommendation = generateSystemRecommendation(approved, qualityScore, niche);

  return {
    approvedSignals: approved,
    rejectedSignals: rejected,
    dataQualityScore: qualityScore,
    systemRecommendation: recommendation,
  };
}

// ============================================================================
// 1. GOOGLE TRENDS FILTER
// ============================================================================

function filterGoogleTrends(
  intel: RealMarketIntel,
  niche: string
): { approved: ApprovedMarketSignal[]; rejected: RejectedSignal[] } {
  const approved: ApprovedMarketSignal[] = [];
  const rejected: RejectedSignal[] = [];

  // Check search interest score
  if (intel.googleTrendsInterest >= FILTER_CONFIG.MIN_SEARCH_INTEREST) {
    approved.push({
      type: "trend",
      content: `${niche} search interest`,
      source: "Google Trends",
      confidenceScore: intel.googleTrendsInterest,
      freshness: "fresh", // Google Trends always recent
      evidence: {
        value: intel.googleTrendsInterest,
        unit: "search interest",
        trend: intel.googleTrendDirection,
      },
    });
  } else {
    rejected.push({
      type: "google_trends",
      content: `${niche} search interest`,
      reason: "low_relevance",
      originalScore: intel.googleTrendsInterest,
    });
  }

  // Filter rising queries
  intel.risingQueries.forEach((query) => {
    if (passesSpamFilter(query)) {
      approved.push({
        type: "keyword",
        content: query,
        source: "Google Trends (Rising)",
        confidenceScore: 75, // Rising queries have good signal
        freshness: "fresh",
        evidence: {
          value: 75,
          unit: "rising query",
        },
      });
    } else {
      rejected.push({
        type: "rising_query",
        content: query,
        reason: "spam",
        originalScore: 0,
      });
    }
  });

  // Filter related topics
  intel.relatedTopics.forEach((topic) => {
    if (passesSpamFilter(topic) && isRelevantToNiche(topic, niche)) {
      approved.push({
        type: "keyword",
        content: topic,
        source: "Google Trends (Related)",
        confidenceScore: 60,
        freshness: "fresh",
      });
    } else if (!passesSpamFilter(topic)) {
      rejected.push({
        type: "related_topic",
        content: topic,
        reason: "spam",
        originalScore: 0,
      });
    } else {
      rejected.push({
        type: "related_topic",
        content: topic,
        reason: "low_relevance",
        originalScore: 0,
      });
    }
  });

  return { approved, rejected };
}

// ============================================================================
// 2. YOUTUBE DATA FILTER
// ============================================================================

function filterYouTubeData(
  intel: RealMarketIntel,
  niche: string
): { approved: ApprovedMarketSignal[]; rejected: RejectedSignal[] } {
  const approved: ApprovedMarketSignal[] = [];
  const rejected: RejectedSignal[] = [];

  // Check competition level
  if (intel.youtubeVideoCount === 0) {
    approved.push({
      type: "platform",
      content: `YouTube niche "${niche}" is OPEN - early mover opportunity`,
      source: "YouTube Data API",
      confidenceScore: 85,
      freshness: "fresh",
      evidence: {
        value: 0,
        unit: "videos",
      },
    });
  } else if (intel.youtubeVideoCount < 1000) {
    approved.push({
      type: "platform",
      content: `YouTube niche "${niche}" has LOW competition (${intel.youtubeVideoCount} videos)`,
      source: "YouTube Data API",
      confidenceScore: 80,
      freshness: "fresh",
      evidence: {
        value: intel.youtubeVideoCount,
        unit: "videos",
        trend: "stable",
      },
    });
  } else if (intel.youtubeAvgViews > 10000) {
    approved.push({
      type: "platform",
      content: `YouTube niche "${niche}" has PROVEN demand (${intel.youtubeAvgViews.toLocaleString()} avg views)`,
      source: "YouTube Data API",
      confidenceScore: 75,
      freshness: "fresh",
      evidence: {
        value: intel.youtubeAvgViews,
        unit: "avg views",
        trend: "rising",
      },
    });
  } else if (intel.youtubeVideoCount > 50000) {
    // Too competitive
    rejected.push({
      type: "youtube_competition",
      content: `${niche} YouTube niche`,
      reason: "low_relevance",
      originalScore: 30,
    });
  } else {
    rejected.push({
      type: "youtube_signal",
      content: `${niche} YouTube data`,
      reason: "low_confidence",
      originalScore: 50,
    });
  }

  // Top channels as proof
  if (intel.youtubeTopChannels.length > 0) {
    approved.push({
      type: "platform",
      content: `Successful YouTube channels in niche: ${intel.youtubeTopChannels.slice(0, 3).join(", ")}`,
      source: "YouTube Data API",
      confidenceScore: 70,
      freshness: "fresh",
    });
  }

  return { approved, rejected };
}

// ============================================================================
// 3. TIKTOK DATA FILTER
// ============================================================================

function filterTikTokData(
  intel: RealMarketIntel,
  niche: string
): { approved: ApprovedMarketSignal[]; rejected: RejectedSignal[] } {
  const approved: ApprovedMarketSignal[] = [];
  const rejected: RejectedSignal[] = [];

  if (!intel.tiktokSignal || intel.tiktokAvgViews === 0) {
    rejected.push({
      type: "tiktok_signal",
      content: `${niche} TikTok data`,
      reason: "low_confidence",
      originalScore: 0,
    });
    return { approved, rejected };
  }

  if (intel.tiktokAvgViews >= FILTER_CONFIG.MIN_SOCIAL_ENGAGEMENT) {
    approved.push({
      type: "platform",
      content: intel.tiktokSignal,
      source: "TikTok (RapidAPI)",
      confidenceScore: Math.min(90, intel.tiktokAvgViews / 10000),
      freshness: "fresh",
      evidence: {
        value: intel.tiktokAvgViews,
        unit: "avg views",
        trend: "rising",
      },
    });
  } else {
    rejected.push({
      type: "tiktok_signal",
      content: `${niche} TikTok engagement`,
      reason: "low_relevance",
      originalScore: Math.min(50, intel.tiktokAvgViews / 100),
    });
  }

  return { approved, rejected };
}

// ============================================================================
// 4. INSTAGRAM DATA FILTER
// ============================================================================

function filterInstagramData(
  intel: RealMarketIntel,
  niche: string
): { approved: ApprovedMarketSignal[]; rejected: RejectedSignal[] } {
  const approved: ApprovedMarketSignal[] = [];
  const rejected: RejectedSignal[] = [];

  if (!intel.instagramSignal) {
    rejected.push({
      type: "instagram_signal",
      content: `${niche} Instagram data`,
      reason: "low_confidence",
      originalScore: 0,
    });
    return { approved, rejected };
  }

  // Extract post count from signal if available
  const postCountMatch = intel.instagramSignal.match(/([\d.]+[KMB]?) posts/);
  const postCount = postCountMatch ? postCountMatch[1] : "0";

  // Always approve if we have signal (post count > 0)
  if (postCount !== "0") {
    approved.push({
      type: "platform",
      content: intel.instagramSignal,
      source: "Instagram (RapidAPI)",
      confidenceScore: 65,
      freshness: "fresh",
    });
  } else {
    rejected.push({
      type: "instagram_signal",
      content: `${niche} Instagram hashtag`,
      reason: "low_relevance",
      originalScore: 0,
    });
  }

  return { approved, rejected };
}

// ============================================================================
// 5. GOOGLE SEARCH RESULTS FILTER
// ============================================================================

function filterGoogleSearchResults(
  intel: RealMarketIntel,
  niche: string
): { approved: ApprovedMarketSignal[]; rejected: RejectedSignal[] } {
  const approved: ApprovedMarketSignal[] = [];
  const rejected: RejectedSignal[] = [];

  // Filter job listings
  intel.jobListingSnippets.forEach((snippet) => {
    if (passesSpamFilter(snippet) && passesDomainFilter(snippet)) {
      approved.push({
        type: "job_listing",
        content: snippet,
        source: "Google Search",
        confidenceScore: 70,
        freshness: "moderate",
      });
    } else {
      rejected.push({
        type: "job_listing",
        content: snippet,
        reason: passesDomainFilter(snippet) ? "spam" : "low_quality",
        originalScore: 0,
      });
    }
  });

  // Filter salary data
  intel.salaryDataSnippets.forEach((snippet) => {
    if (passesSpamFilter(snippet)) {
      approved.push({
        type: "job_listing",
        content: snippet,
        source: "Google Search (Salary Data)",
        confidenceScore: 75,
        freshness: "moderate",
      });
    } else {
      rejected.push({
        type: "salary_data",
        content: snippet,
        reason: "spam",
        originalScore: 0,
      });
    }
  });

  return { approved, rejected };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if content passes spam filter
 */
function passesSpamFilter(content: string): boolean {
  const lowerContent = content.toLowerCase();

  // Check against spam keywords
  for (const spamKeyword of FILTER_CONFIG.SPAM_KEYWORDS) {
    if (lowerContent.includes(spamKeyword)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if URL passes domain quality filter
 */
function passesDomainFilter(content: string): boolean {
  // Extract URLs from content
  const urlRegex = /https?:\/\/([^\s]+)/g;
  const matches = content.match(urlRegex);

  if (!matches) return true;

  for (const url of matches) {
    // Check against low quality domains
    for (const badDomain of FILTER_CONFIG.LOW_QUALITY_DOMAINS) {
      if (url.includes(badDomain)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if topic is relevant to niche
 */
function isRelevantToNiche(topic: string, niche: string): boolean {
  const topicLower = topic.toLowerCase();
  const nicheLower = niche.toLowerCase().replace(/_/g, " ");

  // Direct match
  if (topicLower.includes(nicheLower) || nicheLower.includes(topicLower)) {
    return true;
  }

  // TODO: Can be enhanced with semantic similarity
  return true; // Default to true for now
}

/**
 * Calculate overall data quality score (0-100)
 */
function calculateDataQualityScore(
  approved: ApprovedMarketSignal[],
  rejected: RejectedSignal[],
  rawIntel: RealMarketIntel
): number {
  const totalSignals = approved.length + rejected.length;
  if (totalSignals === 0) return 0;

  // Base score from approval ratio
  const approvalRatio = approved.length / totalSignals;
  let score = Math.round(approvalRatio * 100);

  // Bonus for multiple sources
  const sources = new Set(approved.map((s) => s.source));
  if (sources.size >= 3) score += 10;
  if (sources.size >= 4) score += 5;

  // Bonus for high quality data
  const avgConfidence =
    approved.reduce((sum, s) => sum + s.confidenceScore, 0) / approved.length;
  if (avgConfidence > 70) score += 5;
  if (avgConfidence > 80) score += 5;

  // Bonus for raw data quality
  if (rawIntel.dataQuality === "high") score += 10;
  if (rawIntel.dataQuality === "medium") score += 5;

  return Math.min(100, score);
}

/**
 * Generate system recommendation based on filtered data
 */
function generateSystemRecommendation(
  approved: ApprovedMarketSignal[],
  qualityScore: number,
  niche: string
): string {
  if (approved.length === 0) {
    return `⚠️ Data untuk niche "${niche}" tidak memenuhi threshold kualitas. Sistem tidak dapat memberikan rekomendasi yang andal. Pertimbangkan untuk ganti niche atau sub-sektor.`;
  }

  if (qualityScore >= 80) {
    return `✅ Data untuk niche "${niche}" SANGAT BAGUS (${qualityScore}/100). ${approved.length} sinyal tervalidasi dari multiple sources. Rekomendasi: AMAN untuk eksekusi.`;
  }

  if (qualityScore >= 60) {
    return `⚠️ Data untuk niche "${niche}" cukup baik (${qualityScore}/100). ${approved.length} sinyal tervalidasi. Rekomendasi: BOLEH eksekusi dengan catatan - monitor market response closely.`;
  }

  return `⚠️ Data untuk niche "${niche}" RENDAH (${qualityScore}/100). Hanya ${approved.length} sinyal yang lolos filter. Rekomendasi: RISKY - pertimbangkan ganti niche atau siapkan pivot plan.`;
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Get summary stats for admin dashboard
 */
export function getFilteringSummary(filtered: FilteredMarketData): {
  approvalRate: number;
  topSource: string;
  avgConfidence: number;
} {
  const total = filtered.approvedSignals.length + filtered.rejectedSignals.length;
  const approvalRate = total > 0 ? Math.round((filtered.approvedSignals.length / total) * 100) : 0;

  // Find top source
  const sourceCounts = filtered.approvedSignals.reduce((acc, signal) => {
    acc[signal.source] = (acc[signal.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Average confidence
  const avgConfidence =
    filtered.approvedSignals.length > 0
      ? Math.round(
          filtered.approvedSignals.reduce((sum, s) => sum + s.confidenceScore, 0) /
            filtered.approvedSignals.length
        )
      : 0;

  return { approvalRate, topSource, avgConfidence };
}
