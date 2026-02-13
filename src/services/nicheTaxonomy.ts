/**
 * Niche Taxonomy — Tree-based Niche Classification
 * ====================================================
 * Maps user economic paths → niche categories → micro-niches
 * Used by Trend Intelligence Engine to know WHICH keywords to track
 * for each user's specific path + interest combination.
 *
 * Architecture:
 *   - Tree depth 0: Root (maps to user path)
 *   - Tree depth 1: Category
 *   - Tree depth 2: Sub-niche / micro-niche
 *   - Each node has aliases (search terms) for trend data matching
 *
 * This is the STATIC taxonomy. Dynamic data lives in Supabase `niche_taxonomy` table.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface NicheNode {
  id: string;
  parentId: string | null;
  label: string;
  pathId: string;
  depth: number;
  aliases: string[];
  children: NicheNode[];
  /** Default keywords to track for this niche */
  trackKeywords: string[];
}

export interface NicheResolverResult {
  nicheId: string;
  label: string;
  pathId: string;
  keywords: string[];     // keywords to track/score
  platforms: string[];    // relevant platforms for this niche
  monetizationSignals: string[]; // what to look for in monetization data
}

// ============================================================================
// STATIC TAXONOMY TREE (in-memory, mirrors Supabase table)
// ============================================================================

const TAXONOMY: NicheNode[] = [
  // ────────────────────────────────────────────────
  // ROOT: Skill & Service → micro_service / freelance_upgrade
  // ────────────────────────────────────────────────
  {
    id: "skill_service",
    parentId: null,
    label: "Skill & Service",
    pathId: "micro_service",
    depth: 0,
    aliases: ["jasa", "service", "freelance"],
    trackKeywords: ["freelance Indonesia", "jasa digital", "remote work"],
    children: [
      {
        id: "skill.copywriting",
        parentId: "skill_service",
        label: "AI Copywriting",
        pathId: "micro_service",
        depth: 1,
        aliases: ["copywriter", "penulisan", "caption"],
        trackKeywords: ["AI copywriting", "jasa copywriting", "copywriter freelance"],
        children: [
          { id: "skill.copywriting.email", parentId: "skill.copywriting", label: "Email Copywriting", pathId: "micro_service", depth: 2, aliases: ["email marketing", "newsletter"], trackKeywords: ["AI email marketing", "cold email AI", "email copywriter"], children: [] },
          { id: "skill.copywriting.ads", parentId: "skill.copywriting", label: "Ads Copywriting", pathId: "micro_service", depth: 2, aliases: ["iklan", "Facebook ads", "Google ads"], trackKeywords: ["jasa iklan Facebook", "Google ads copywriter", "AI ads copy"], children: [] },
          { id: "skill.copywriting.social", parentId: "skill.copywriting", label: "Social Media Copy", pathId: "micro_service", depth: 2, aliases: ["caption", "hook", "social copy"], trackKeywords: ["jasa caption Instagram", "social media copywriter"], children: [] },
        ],
      },
      {
        id: "skill.design",
        parentId: "skill_service",
        label: "AI Design",
        pathId: "micro_service",
        depth: 1,
        aliases: ["desain", "thumbnail", "visual"],
        trackKeywords: ["AI design tool", "jasa desain", "thumbnail designer"],
        children: [],
      },
      {
        id: "skill.video",
        parentId: "skill_service",
        label: "Video Production",
        pathId: "micro_service",
        depth: 1,
        aliases: ["video", "editing", "motion"],
        trackKeywords: ["jasa edit video", "video editor freelance", "AI video editing"],
        children: [],
      },
      {
        id: "skill.data_analysis",
        parentId: "skill_service",
        label: "Data Analysis",
        pathId: "micro_service",
        depth: 1,
        aliases: ["data analyst", "spreadsheet", "dashboard"],
        trackKeywords: ["freelance data analyst", "jasa analisis data", "Google Sheets automation"],
        children: [],
      },
      {
        id: "skill.translation",
        parentId: "skill_service",
        label: "AI Translation",
        pathId: "micro_service",
        depth: 1,
        aliases: ["terjemahan", "localization"],
        trackKeywords: ["jasa terjemahan", "AI translation", "localization service"],
        children: [],
      },
    ],
  },

  // ────────────────────────────────────────────────
  // ROOT: Audience-Based → content_monetization
  // ────────────────────────────────────────────────
  {
    id: "audience_based",
    parentId: null,
    label: "Audience-Based",
    pathId: "content_monetization",
    depth: 0,
    aliases: ["content creator", "audience", "monetisasi konten"],
    trackKeywords: ["content creator Indonesia", "monetisasi konten", "cara dapat uang dari konten"],
    children: [
      {
        id: "audience.finance",
        parentId: "audience_based",
        label: "Personal Finance",
        pathId: "content_monetization",
        depth: 1,
        aliases: ["keuangan", "investasi", "uang"],
        trackKeywords: ["keuangan pribadi", "tips investasi", "financial literacy"],
        children: [
          { id: "audience.finance.milenial", parentId: "audience.finance", label: "Finance Milenial", pathId: "content_monetization", depth: 2, aliases: ["milenial finance", "investasi muda"], trackKeywords: ["investasi untuk pemula", "reksadana milenial", "cara mengatur keuangan", "financial freedom milenial", "side hustle 2026"], children: [] },
          { id: "audience.finance.umkm", parentId: "audience.finance", label: "Finance UMKM", pathId: "content_monetization", depth: 2, aliases: ["keuangan UMKM", "akuntansi usaha"], trackKeywords: ["akuntansi UMKM", "keuangan usaha kecil"], children: [] },
          { id: "audience.finance.crypto", parentId: "audience.finance", label: "Crypto & DeFi", pathId: "content_monetization", depth: 2, aliases: ["cryptocurrency", "bitcoin", "defi"], trackKeywords: ["crypto Indonesia 2026", "bitcoin halving", "DeFi yield farming"], children: [] },
        ],
      },
      {
        id: "audience.health",
        parentId: "audience_based",
        label: "Health & Fitness",
        pathId: "content_monetization",
        depth: 1,
        aliases: ["kesehatan", "fitness", "diet"],
        trackKeywords: ["tips kesehatan", "fitness Indonesia", "diet sehat"],
        children: [
          { id: "audience.health.workout", parentId: "audience.health", label: "Workout & Gym", pathId: "content_monetization", depth: 2, aliases: ["gym", "workout", "bodybuilding"], trackKeywords: ["workout di rumah", "gym pemula", "bodybuilding tips"], children: [] },
          { id: "audience.health.nutrition", parentId: "audience.health", label: "Nutrition & Diet", pathId: "content_monetization", depth: 2, aliases: ["diet", "nutrisi", "meal prep"], trackKeywords: ["meal prep Indonesia", "diet sehat", "nutrisi makanan"], children: [] },
        ],
      },
      {
        id: "audience.tech",
        parentId: "audience_based",
        label: "Tech & AI",
        pathId: "content_monetization",
        depth: 1,
        aliases: ["teknologi", "AI", "software"],
        trackKeywords: ["teknologi terbaru", "AI news", "software review"],
        children: [
          { id: "audience.tech.ai_tools", parentId: "audience.tech", label: "AI Tools Review", pathId: "content_monetization", depth: 2, aliases: ["AI tools", "ChatGPT", "review AI"], trackKeywords: ["ChatGPT tips", "AI automation tools", "Claude AI vs ChatGPT", "AI tools terbaik"], children: [] },
          { id: "audience.tech.programming", parentId: "audience.tech", label: "Programming Tutorial", pathId: "content_monetization", depth: 2, aliases: ["coding", "programming", "web dev"], trackKeywords: ["belajar coding", "tutorial JavaScript", "web development"], children: [] },
        ],
      },
      {
        id: "audience.gaming",
        parentId: "audience_based",
        label: "Gaming",
        pathId: "content_monetization",
        depth: 1,
        aliases: ["game", "esports", "mobile game"],
        trackKeywords: ["gaming Indonesia", "esports", "mobile game terbaru"],
        children: [
          { id: "audience.gaming.mobile", parentId: "audience.gaming", label: "Mobile Gaming", pathId: "content_monetization", depth: 2, aliases: ["game HP", "mobile legends", "PUBG"], trackKeywords: ["Mobile Legends tips", "PUBG Mobile", "game mobile terbaru"], children: [] },
        ],
      },
      {
        id: "audience.education",
        parentId: "audience_based",
        label: "Education",
        pathId: "content_monetization",
        depth: 1,
        aliases: ["pendidikan", "belajar", "tutorial"],
        trackKeywords: ["tips belajar", "edukasi online", "tutorial"],
        children: [],
      },
      {
        id: "audience.parenting",
        parentId: "audience_based",
        label: "Parenting",
        pathId: "content_monetization",
        depth: 1,
        aliases: ["parenting", "anak", "keluarga"],
        trackKeywords: ["parenting tips", "tumbuh kembang anak", "parenting milenial"],
        children: [],
      },
      {
        id: "audience.business",
        parentId: "audience_based",
        label: "Business & Startup",
        pathId: "content_monetization",
        depth: 1,
        aliases: ["bisnis", "startup", "entrepreneurship"],
        trackKeywords: ["bisnis online", "startup Indonesia", "entrepreneurship tips"],
        children: [],
      },
    ],
  },

  // ────────────────────────────────────────────────
  // ROOT: Digital Product → digital_product
  // ────────────────────────────────────────────────
  {
    id: "digital_product",
    parentId: null,
    label: "Digital Product",
    pathId: "digital_product",
    depth: 0,
    aliases: ["produk digital", "info product", "kursus"],
    trackKeywords: ["produk digital", "jualan digital", "passive income digital"],
    children: [
      {
        id: "product.course",
        parentId: "digital_product",
        label: "Online Course",
        pathId: "digital_product",
        depth: 1,
        aliases: ["kursus online", "e-learning", "udemy"],
        trackKeywords: ["kursus online Indonesia", "cara buat kursus", "platform e-learning"],
        children: [],
      },
      {
        id: "product.template",
        parentId: "digital_product",
        label: "Templates & Tools",
        pathId: "digital_product",
        depth: 1,
        aliases: ["template", "notion", "figma"],
        trackKeywords: ["template bisnis", "Notion template", "Figma template"],
        children: [
          { id: "product.template.notion", parentId: "product.template", label: "Notion Templates", pathId: "digital_product", depth: 2, aliases: ["notion template", "productivity"], trackKeywords: ["notion template gratis", "notion AI workspace", "notion productivity"], children: [] },
          { id: "product.template.canva", parentId: "product.template", label: "Canva Templates", pathId: "digital_product", depth: 2, aliases: ["canva", "design template"], trackKeywords: ["canva template premium", "jual template canva"], children: [] },
        ],
      },
      {
        id: "product.ebook",
        parentId: "digital_product",
        label: "E-book & Guide",
        pathId: "digital_product",
        depth: 1,
        aliases: ["ebook", "panduan", "whitepaper"],
        trackKeywords: ["cara buat ebook", "jual ebook online", "ebook Indonesia"],
        children: [],
      },
      {
        id: "product.prompt_pack",
        parentId: "digital_product",
        label: "AI Prompt Packs",
        pathId: "digital_product",
        depth: 1,
        aliases: ["prompt", "ChatGPT", "Midjourney"],
        trackKeywords: ["jual prompt ChatGPT", "Midjourney prompts", "AI prompt marketplace"],
        children: [],
      },
    ],
  },

  // ────────────────────────────────────────────────
  // ROOT: Commerce & Arbitrage → arbitrage_skill
  // ────────────────────────────────────────────────
  {
    id: "commerce_arbitrage",
    parentId: null,
    label: "Commerce & Arbitrage",
    pathId: "arbitrage_skill",
    depth: 0,
    aliases: ["jualan", "dropship", "arbitrase"],
    trackKeywords: ["bisnis online", "dropshipping Indonesia", "arbitrase digital"],
    children: [
      {
        id: "commerce.dropship",
        parentId: "commerce_arbitrage",
        label: "Dropshipping",
        pathId: "arbitrage_skill",
        depth: 1,
        aliases: ["dropship", "supplier", "reseller"],
        trackKeywords: ["dropship murah", "supplier dropship", "cara dropshipping"],
        children: [],
      },
      {
        id: "commerce.print_on_demand",
        parentId: "commerce_arbitrage",
        label: "Print on Demand",
        pathId: "arbitrage_skill",
        depth: 1,
        aliases: ["POD", "kaos", "merchandise"],
        trackKeywords: ["print on demand Indonesia", "jual kaos custom", "POD platform"],
        children: [],
      },
      {
        id: "commerce.digital_resell",
        parentId: "commerce_arbitrage",
        label: "Digital Reselling",
        pathId: "arbitrage_skill",
        depth: 1,
        aliases: ["resell", "lifetime deal", "license"],
        trackKeywords: ["resell software", "lifetime deal", "jual lisensi digital"],
        children: [],
      },
    ],
  },

  // ────────────────────────────────────────────────
  // ROOT: Data & Research → speculative
  // ────────────────────────────────────────────────
  {
    id: "data_research",
    parentId: null,
    label: "Data & Research",
    pathId: "speculative",
    depth: 0,
    aliases: ["riset", "data", "analisis"],
    trackKeywords: ["riset pasar", "data analysis", "market research"],
    children: [],
  },

  // ────────────────────────────────────────────────
  // ROOT: Automation Builder → freelance_upgrade
  // ────────────────────────────────────────────────
  {
    id: "automation_builder",
    parentId: null,
    label: "Automation Builder",
    pathId: "freelance_upgrade",
    depth: 0,
    aliases: ["automasi", "bot", "nocode"],
    trackKeywords: ["no-code automation", "Zapier", "Make.com", "bot Telegram"],
    children: [],
  },
];

// ============================================================================
// QUERY PATH RESOLVER — maps user profile → relevant niche nodes
// ============================================================================

/** Flatten taxonomy tree to a list */
export function flattenTaxonomy(nodes: NicheNode[] = TAXONOMY): NicheNode[] {
  const result: NicheNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children.length > 0) {
      result.push(...flattenTaxonomy(node.children));
    }
  }
  return result;
}

/** Get all niches for a given path_id */
export function getNichesForPath(pathId: string): NicheNode[] {
  const all = flattenTaxonomy();
  // Map legacy path IDs to taxonomy path IDs
  const pathMapping: Record<string, string[]> = {
    micro_service: ["micro_service"],
    freelance_upgrade: ["freelance_upgrade"],
    content_monetization: ["content_monetization"],
    arbitrage_skill: ["arbitrage_skill"],
    digital_product: ["digital_product"],
    speculative: ["speculative"],
  };
  const mapped = pathMapping[pathId] || [pathId];
  return all.filter((n) => mapped.includes(n.pathId));
}

/** Get specific niche node by ID */
export function getNicheById(nicheId: string): NicheNode | null {
  const all = flattenTaxonomy();
  return all.find((n) => n.id === nicheId) || null;
}

/** Resolve user profile to niche IDs + keywords */
export function resolveUserNiche(
  pathId: string,
  interestMarket?: string,
  subSector?: string,
): NicheResolverResult {
  // Map economic model IDs to taxonomy path IDs (for branching system compat)
  const economicToPath: Record<string, string> = {
    skill_service: "micro_service",
    audience_based: "content_monetization",
    digital_product: "digital_product",
    commerce_arbitrage: "arbitrage_skill",
    data_research: "speculative",
    automation_builder: "freelance_upgrade",
  };
  const resolvedPathId = economicToPath[pathId] || pathId;

  const all = flattenTaxonomy();

  // ── Strategy 1: Try exact match on sub-sector ID against taxonomy IDs ──
  let bestMatch: NicheNode | null = null;

  if (subSector) {
    // Exact ID match (e.g., "writing" → "skill.copywriting" via alias)
    bestMatch = all.find((n) => n.id === subSector) || null;

    if (!bestMatch) {
      // Alias/label match against sub-sector string
      const lowerSub = subSector.toLowerCase();
      bestMatch = all.find((n) =>
        n.aliases.some((a) => a.toLowerCase().includes(lowerSub)) ||
        n.id.toLowerCase().includes(lowerSub) ||
        n.label.toLowerCase().includes(lowerSub)
      ) || null;
    }
  }

  // ── Strategy 2: Try interest market matching ──
  if (!bestMatch && interestMarket) {
    const lowerInterest = interestMarket.toLowerCase();
    
    // Try deeper nodes first (more specific)
    const candidates = all
      .filter((n) =>
        n.aliases.some((a) => a.toLowerCase().includes(lowerInterest)) ||
        n.label.toLowerCase().includes(lowerInterest) ||
        n.id.toLowerCase().includes(lowerInterest)
      )
      .sort((a, b) => b.depth - a.depth); // prefer deeper/more specific

    bestMatch = candidates[0] || null;
  }

  // ── Strategy 3: Map sub-sector from branching config to taxonomy ──
  if (!bestMatch && subSector) {
    // Sub-sector IDs from branchingProfileConfig map to taxonomy nodes
    const subSectorToNiche: Record<string, string> = {
      // skill_service sub-sectors
      writing: "skill.copywriting",
      design: "skill.design",
      video: "skill.video",
      development: "skill.data_analysis",
      marketing: "skill.copywriting",
      ai_operator: "skill.data_analysis",
      // audience_based sub-sectors
      content_creator: "audience.education",
      micro_influencer: "audience.business",
      niche_page: "audience.tech",
      community_builder: "audience.business",
      // digital_product sub-sectors
      ebook: "product.ebook",
      template: "product.template",
      prompt_pack: "product.prompt_pack",
      course_mini: "product.course",
      membership: "product.course",
      saas_micro: "product.template",
      // commerce_arbitrage sub-sectors
      dropship: "commerce.dropship",
      print_on_demand: "commerce.print_on_demand",
      affiliate: "commerce.digital_resell",
      amazon_kdp: "product.ebook",
      tiktok_shop: "commerce.dropship",
      digital_resell: "commerce.digital_resell",
      // data_research sub-sectors
      trend_researcher: "data_research",
      market_analyst: "data_research",
      crypto_analyst: "audience.finance.crypto",
      newsletter_writer: "audience.business",
      ai_curator: "audience.tech.ai_tools",
      // automation_builder sub-sectors
      nocode_builder: "automation_builder",
      zapier_automation: "automation_builder",
      crm_setup: "automation_builder",
      ai_workflow: "automation_builder",
      funnel_builder: "automation_builder",
    };

    const mappedId = subSectorToNiche[subSector];
    if (mappedId) {
      bestMatch = all.find((n) => n.id === mappedId) || null;
    }
  }

  // ── Strategy 4: Also try niche-level match from branching niche IDs ──
  if (!bestMatch && interestMarket) {
    const nicheToTaxonomy: Record<string, string> = {
      // writing niches
      copywriting: "skill.copywriting.ads",
      seo_content: "skill.copywriting",
      script_writing: "skill.copywriting.social",
      ghostwriting: "skill.copywriting",
      // design niches
      ui_ux: "skill.design",
      branding: "skill.design",
      social_media_design: "skill.design",
      thumbnail_design: "skill.design",
      // content creator niches
      education: "audience.education",
      gaming_content: "audience.gaming.mobile",
      finance_content: "audience.finance.milenial",
      health_content: "audience.health.workout",
      tech_content: "audience.tech.ai_tools",
      lifestyle: "audience.parenting",
      selfimprovement: "audience.education",
      // template niches
      notion_template: "product.template.notion",
      canva_template: "product.template.canva",
      spreadsheet_template: "product.template",
      figma_template: "product.template",
      // affiliate niches
      software_affiliate: "commerce.digital_resell",
      education_affiliate: "product.course",
      health_affiliate: "audience.health",
      finance_affiliate: "audience.finance",
      gadget_affiliate: "audience.tech",
    };

    const mappedId = nicheToTaxonomy[interestMarket];
    if (mappedId) {
      bestMatch = all.find((n) => n.id === mappedId) || null;
    }
  }

  // ── Fallback: Root path node ──
  if (!bestMatch) {
    const pathNiches = all.filter((n) => n.pathId === resolvedPathId);
    bestMatch = pathNiches.find((n) => n.depth === 0) || pathNiches[0] || all[0];
  }

  if (!bestMatch) {
    return {
      nicheId: pathId,
      label: pathId,
      pathId: resolvedPathId,
      keywords: [],
      platforms: ["google", "youtube"],
      monetizationSignals: [],
    };
  }

  // Collect all keywords from matched node + children
  const allKeywords = collectKeywords(bestMatch);

  // Enrich with user-specific terms for more differentiation
  if (interestMarket && !allKeywords.some(k => k.toLowerCase().includes(interestMarket.toLowerCase()))) {
    allKeywords.push(interestMarket.replace(/_/g, " "));
  }
  if (subSector && !allKeywords.some(k => k.toLowerCase().includes(subSector.toLowerCase()))) {
    allKeywords.push(subSector.replace(/_/g, " "));
  }

  // Determine relevant platforms based on path
  const platforms = getPlatformsForPath(resolvedPathId);

  // Monetization signals
  const monetizationSignals = getMonetizationSignals(resolvedPathId);

  return {
    nicheId: bestMatch.id,
    label: bestMatch.label,
    pathId: bestMatch.pathId,
    keywords: allKeywords,
    platforms,
    monetizationSignals,
  };
}

/** Collect all keywords from a niche node and its children */
function collectKeywords(node: NicheNode): string[] {
  const keywords = [...node.trackKeywords];
  for (const child of node.children) {
    keywords.push(...collectKeywords(child));
  }
  return [...new Set(keywords)]; // deduplicate
}

/** Get relevant platforms for a path */
function getPlatformsForPath(pathId: string): string[] {
  const platformMap: Record<string, string[]> = {
    micro_service: ["google", "fiverr", "upwork", "linkedin"],
    content_monetization: ["google", "youtube", "tiktok", "instagram", "twitter"],
    digital_product: ["google", "gumroad", "udemy", "youtube"],
    arbitrage_skill: ["google", "shopee", "tokopedia", "tiktok"],
    freelance_upgrade: ["google", "linkedin", "upwork"],
    speculative: ["google", "twitter", "reddit"],
  };
  return platformMap[pathId] || ["google", "youtube"];
}

/** Get monetization signals relevant to path */
function getMonetizationSignals(pathId: string): string[] {
  const sigMap: Record<string, string[]> = {
    micro_service: ["project rates", "hourly rates", "client demand", "Fiverr gig competition"],
    content_monetization: ["CPM rates", "sponsorship rates", "affiliate commission", "AdSense RPM"],
    digital_product: ["product pricing", "marketplace fees", "conversion rates", "LTV"],
    arbitrage_skill: ["margin percentage", "supplier pricing", "shipping costs", "platform fees"],
    freelance_upgrade: ["contract value", "retainer rates", "upsell opportunity"],
    speculative: ["market volatility", "entry barriers", "ROI timeline"],
  };
  return sigMap[pathId] || [];
}

// ============================================================================
// TAXONOMY TREE ACCESSOR
// ============================================================================

export function getTaxonomyTree(): NicheNode[] {
  return TAXONOMY;
}

/** Get all micro-niches (depth 2) for a path */
export function getMicroNiches(pathId: string): NicheNode[] {
  return getNichesForPath(pathId).filter((n) => n.depth === 2);
}

/** Get all root categories */
export function getRootCategories(): NicheNode[] {
  return TAXONOMY;
}

/** Search taxonomy by keyword/alias */
export function searchTaxonomy(query: string): NicheNode[] {
  const lower = query.toLowerCase();
  const all = flattenTaxonomy();
  return all.filter((n) =>
    n.label.toLowerCase().includes(lower) ||
    n.aliases.some((a) => a.toLowerCase().includes(lower)) ||
    n.trackKeywords.some((k) => k.toLowerCase().includes(lower))
  );
}
