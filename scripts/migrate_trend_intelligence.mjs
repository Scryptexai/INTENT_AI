/**
 * Trend Intelligence Migration Runner
 * Applies SQL migration to Supabase via REST API
 */

const SUPABASE_URL = "https://ieqmsrrasdimpkdnvkfg.supabase.co";
const SUPABASE_KEY = "SUPABASE_KEY_REMOVED";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=minimal"
};

// ────────────────────────────────────────────────
// Step 1: Create niche_taxonomy table + seed
// ────────────────────────────────────────────────

async function createNicheTaxonomy() {
  console.log("=== Step 1: Create niche_taxonomy table ===");
  
  // Check if table already has data
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/niche_taxonomy?select=id&limit=1`, { headers });
  
  if (checkRes.ok) {
    const data = await checkRes.json();
    if (data.length > 0) {
      console.log("niche_taxonomy already has data, skipping seed");
      return true;
    }
    // Table exists but empty, seed it
    return await seedNicheTaxonomy();
  }
  
  // Table doesn't exist — we need to create it via SQL editor or Supabase dashboard
  console.log("niche_taxonomy table does NOT exist yet");
  console.log("Please run the SQL migration in Supabase Dashboard SQL Editor:");
  console.log("File: supabase/migrations/20260212_trend_intelligence.sql");
  return false;
}

async function seedNicheTaxonomy() {
  console.log("Seeding niche_taxonomy...");
  
  const rows = [
    { id: "skill_service", parent_id: null, label: "Skill & Service", path_id: "micro_service", depth: 0, aliases: ["jasa", "service", "freelance"] },
    { id: "audience_based", parent_id: null, label: "Audience-Based", path_id: "content_monetization", depth: 0, aliases: ["content creator", "audience"] },
    { id: "digital_product", parent_id: null, label: "Digital Product", path_id: "digital_product", depth: 0, aliases: ["produk digital", "kursus"] },
    { id: "commerce_arbitrage", parent_id: null, label: "Commerce & Arbitrage", path_id: "arbitrage_skill", depth: 0, aliases: ["jualan", "dropship"] },
    { id: "data_research", parent_id: null, label: "Data & Research", path_id: "speculative", depth: 0, aliases: ["riset", "data"] },
    { id: "automation_builder", parent_id: null, label: "Automation Builder", path_id: "freelance_upgrade", depth: 0, aliases: ["automasi", "bot"] },
    
    // Level 1
    { id: "skill.copywriting", parent_id: "skill_service", label: "AI Copywriting", path_id: "micro_service", depth: 1, aliases: ["copywriter", "penulisan"] },
    { id: "skill.design", parent_id: "skill_service", label: "AI Design", path_id: "micro_service", depth: 1, aliases: ["desain", "thumbnail"] },
    { id: "skill.video", parent_id: "skill_service", label: "Video Production", path_id: "micro_service", depth: 1, aliases: ["video", "editing"] },
    { id: "skill.data_analysis", parent_id: "skill_service", label: "Data Analysis", path_id: "micro_service", depth: 1, aliases: ["data analyst"] },
    { id: "skill.translation", parent_id: "skill_service", label: "AI Translation", path_id: "micro_service", depth: 1, aliases: ["terjemahan"] },
    
    { id: "audience.finance", parent_id: "audience_based", label: "Personal Finance", path_id: "content_monetization", depth: 1, aliases: ["keuangan", "investasi"] },
    { id: "audience.health", parent_id: "audience_based", label: "Health & Fitness", path_id: "content_monetization", depth: 1, aliases: ["kesehatan", "fitness"] },
    { id: "audience.tech", parent_id: "audience_based", label: "Tech & AI", path_id: "content_monetization", depth: 1, aliases: ["teknologi", "AI"] },
    { id: "audience.gaming", parent_id: "audience_based", label: "Gaming", path_id: "content_monetization", depth: 1, aliases: ["game", "esports"] },
    { id: "audience.education", parent_id: "audience_based", label: "Education", path_id: "content_monetization", depth: 1, aliases: ["pendidikan"] },
    { id: "audience.parenting", parent_id: "audience_based", label: "Parenting", path_id: "content_monetization", depth: 1, aliases: ["parenting"] },
    { id: "audience.business", parent_id: "audience_based", label: "Business & Startup", path_id: "content_monetization", depth: 1, aliases: ["bisnis", "startup"] },
    
    { id: "product.course", parent_id: "digital_product", label: "Online Course", path_id: "digital_product", depth: 1, aliases: ["kursus online"] },
    { id: "product.template", parent_id: "digital_product", label: "Templates & Tools", path_id: "digital_product", depth: 1, aliases: ["template"] },
    { id: "product.ebook", parent_id: "digital_product", label: "E-book & Guide", path_id: "digital_product", depth: 1, aliases: ["ebook"] },
    { id: "product.prompt_pack", parent_id: "digital_product", label: "AI Prompt Packs", path_id: "digital_product", depth: 1, aliases: ["prompt"] },
    
    { id: "commerce.dropship", parent_id: "commerce_arbitrage", label: "Dropshipping", path_id: "arbitrage_skill", depth: 1, aliases: ["dropship"] },
    { id: "commerce.print_on_demand", parent_id: "commerce_arbitrage", label: "Print on Demand", path_id: "arbitrage_skill", depth: 1, aliases: ["POD", "kaos"] },
    { id: "commerce.digital_resell", parent_id: "commerce_arbitrage", label: "Digital Reselling", path_id: "arbitrage_skill", depth: 1, aliases: ["resell"] },
  ];
  
  // Insert root + level 1 first (no FK issues)
  const rootRows = rows.filter(r => r.depth === 0);
  const level1Rows = rows.filter(r => r.depth === 1);
  
  for (const batch of [rootRows, level1Rows]) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/niche_taxonomy`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=minimal,resolution=ignore-duplicates" },
      body: JSON.stringify(batch),
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.log(`niche_taxonomy insert batch error: ${err}`);
    }
  }
  
  // Level 2
  const level2 = [
    { id: "audience.finance.milenial", parent_id: "audience.finance", label: "Finance Milenial", path_id: "content_monetization", depth: 2, aliases: ["milenial finance"] },
    { id: "audience.finance.umkm", parent_id: "audience.finance", label: "Finance UMKM", path_id: "content_monetization", depth: 2, aliases: ["keuangan UMKM"] },
    { id: "audience.finance.crypto", parent_id: "audience.finance", label: "Crypto & DeFi", path_id: "content_monetization", depth: 2, aliases: ["cryptocurrency"] },
    { id: "audience.tech.ai_tools", parent_id: "audience.tech", label: "AI Tools Review", path_id: "content_monetization", depth: 2, aliases: ["AI tools"] },
    { id: "audience.tech.programming", parent_id: "audience.tech", label: "Programming Tutorial", path_id: "content_monetization", depth: 2, aliases: ["coding"] },
    { id: "audience.gaming.mobile", parent_id: "audience.gaming", label: "Mobile Gaming", path_id: "content_monetization", depth: 2, aliases: ["game HP"] },
    { id: "audience.health.workout", parent_id: "audience.health", label: "Workout & Gym", path_id: "content_monetization", depth: 2, aliases: ["gym"] },
    { id: "audience.health.nutrition", parent_id: "audience.health", label: "Nutrition & Diet", path_id: "content_monetization", depth: 2, aliases: ["diet"] },
    { id: "skill.copywriting.email", parent_id: "skill.copywriting", label: "Email Copywriting", path_id: "micro_service", depth: 2, aliases: ["email marketing"] },
    { id: "skill.copywriting.ads", parent_id: "skill.copywriting", label: "Ads Copywriting", path_id: "micro_service", depth: 2, aliases: ["iklan"] },
    { id: "skill.copywriting.social", parent_id: "skill.copywriting", label: "Social Media Copy", path_id: "micro_service", depth: 2, aliases: ["caption"] },
    { id: "product.template.notion", parent_id: "product.template", label: "Notion Templates", path_id: "digital_product", depth: 2, aliases: ["notion template"] },
    { id: "product.template.canva", parent_id: "product.template", label: "Canva Templates", path_id: "digital_product", depth: 2, aliases: ["canva"] },
  ];
  
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/niche_taxonomy`, {
    method: "POST",
    headers: { ...headers, "Prefer": "return=minimal,resolution=ignore-duplicates" },
    body: JSON.stringify(level2),
  });
  
  if (!res2.ok) {
    const err = await res2.text();
    console.log(`level2 insert error: ${err}`);
  }
  
  console.log(`Seeded ${rows.length + level2.length} niche taxonomy nodes`);
  return true;
}

// ────────────────────────────────────────────────
// Step 2: Seed trend_data_points
// ────────────────────────────────────────────────

async function seedTrendDataPoints() {
  console.log("\n=== Step 2: Seed trend_data_points ===");
  
  // Check if table exists and has data
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/trend_data_points?select=id&limit=1`, { headers });
  
  if (!checkRes.ok) {
    console.log("trend_data_points table does NOT exist yet");
    return false;
  }
  
  const existing = await checkRes.json();
  if (existing.length > 0) {
    console.log("trend_data_points already has data");
    return true;
  }
  
  const dataPoints = [
    { niche_id: "audience.finance.milenial", keyword: "investasi untuk pemula", platform: "google", date: "2026-02-12", search_volume: 74, growth_rate_7d: 12.5, growth_rate_30d: 28.3, growth_rate_90d: 45.0, cpc: 1.20, affiliate_density: 0.65, ads_density: 0.55, content_density: 8500, creator_density: 320, engagement_velocity: 4.2, source: "google_trends", confidence: 0.85 },
    { niche_id: "audience.finance.milenial", keyword: "reksadana milenial", platform: "google", date: "2026-02-12", search_volume: 58, growth_rate_7d: 18.0, growth_rate_30d: 35.0, growth_rate_90d: 62.0, cpc: 0.95, affiliate_density: 0.50, ads_density: 0.40, content_density: 3200, creator_density: 95, engagement_velocity: 5.1, source: "google_trends", confidence: 0.80 },
    { niche_id: "audience.finance.milenial", keyword: "cara mengatur keuangan", platform: "google", date: "2026-02-12", search_volume: 82, growth_rate_7d: 5.2, growth_rate_30d: 12.0, growth_rate_90d: 18.0, cpc: 0.85, affiliate_density: 0.70, ads_density: 0.60, content_density: 12000, creator_density: 450, engagement_velocity: 3.8, source: "google_trends", confidence: 0.90 },
    { niche_id: "audience.finance.milenial", keyword: "financial freedom milenial", platform: "google", date: "2026-02-12", search_volume: 45, growth_rate_7d: 25.0, growth_rate_30d: 48.0, growth_rate_90d: 85.0, cpc: 1.50, affiliate_density: 0.45, ads_density: 0.35, content_density: 2100, creator_density: 78, engagement_velocity: 6.3, source: "google_trends", confidence: 0.75 },
    { niche_id: "audience.finance.milenial", keyword: "side hustle 2026", platform: "google", date: "2026-02-12", search_volume: 63, growth_rate_7d: 32.0, growth_rate_30d: 55.0, growth_rate_90d: 120.0, cpc: 1.80, affiliate_density: 0.60, ads_density: 0.50, content_density: 4500, creator_density: 210, engagement_velocity: 5.8, source: "google_trends", confidence: 0.80 },
    { niche_id: "audience.finance.milenial", keyword: "budgeting app terbaik", platform: "google", date: "2026-02-12", search_volume: 51, growth_rate_7d: 8.0, growth_rate_30d: 15.0, growth_rate_90d: 22.0, cpc: 2.10, affiliate_density: 0.80, ads_density: 0.70, content_density: 6800, creator_density: 180, engagement_velocity: 3.5, source: "google_trends", confidence: 0.85 },
    { niche_id: "audience.finance.milenial", keyword: "tips keuangan", platform: "tiktok", date: "2026-02-12", search_volume: 89, growth_rate_7d: 15.0, growth_rate_30d: 30.0, growth_rate_90d: 50.0, cpc: 0.0, affiliate_density: 0.30, ads_density: 0.20, content_density: 25000, creator_density: 800, engagement_velocity: 7.2, source: "tiktok_scrape", confidence: 0.70 },
    { niche_id: "audience.finance.milenial", keyword: "investasi saham pemula", platform: "tiktok", date: "2026-02-12", search_volume: 72, growth_rate_7d: 22.0, growth_rate_30d: 42.0, growth_rate_90d: 68.0, cpc: 0.0, affiliate_density: 0.25, ads_density: 0.15, content_density: 18000, creator_density: 520, engagement_velocity: 6.5, source: "tiktok_scrape", confidence: 0.70 },
    { niche_id: "audience.finance.milenial", keyword: "investasi untuk pemula", platform: "youtube", date: "2026-02-12", search_volume: 65, growth_rate_7d: 10.0, growth_rate_30d: 20.0, growth_rate_90d: 35.0, cpc: 0.0, affiliate_density: 0.55, ads_density: 0.45, content_density: 9500, creator_density: 280, engagement_velocity: 4.8, source: "youtube_api", confidence: 0.80 },
    { niche_id: "audience.finance.milenial", keyword: "passive income 2026", platform: "youtube", date: "2026-02-12", search_volume: 78, growth_rate_7d: 28.0, growth_rate_30d: 52.0, growth_rate_90d: 95.0, cpc: 0.0, affiliate_density: 0.50, ads_density: 0.40, content_density: 5200, creator_density: 150, engagement_velocity: 5.5, source: "youtube_api", confidence: 0.80 },
    
    // AI Tools
    { niche_id: "audience.tech.ai_tools", keyword: "ChatGPT tips", platform: "google", date: "2026-02-12", search_volume: 88, growth_rate_7d: 8.0, growth_rate_30d: 15.0, growth_rate_90d: 25.0, cpc: 2.50, affiliate_density: 0.75, ads_density: 0.65, content_density: 35000, creator_density: 1200, engagement_velocity: 4.0, source: "google_trends", confidence: 0.90 },
    { niche_id: "audience.tech.ai_tools", keyword: "AI automation tools", platform: "google", date: "2026-02-12", search_volume: 72, growth_rate_7d: 35.0, growth_rate_30d: 65.0, growth_rate_90d: 150.0, cpc: 3.20, affiliate_density: 0.60, ads_density: 0.55, content_density: 8000, creator_density: 350, engagement_velocity: 5.2, source: "google_trends", confidence: 0.85 },
    { niche_id: "audience.tech.ai_tools", keyword: "Claude AI vs ChatGPT", platform: "google", date: "2026-02-12", search_volume: 55, growth_rate_7d: 45.0, growth_rate_30d: 80.0, growth_rate_90d: 200.0, cpc: 1.80, affiliate_density: 0.40, ads_density: 0.30, content_density: 3500, creator_density: 120, engagement_velocity: 6.8, source: "google_trends", confidence: 0.80 },
    
    // Email Copywriting
    { niche_id: "skill.copywriting.email", keyword: "AI email marketing", platform: "google", date: "2026-02-12", search_volume: 62, growth_rate_7d: 20.0, growth_rate_30d: 38.0, growth_rate_90d: 70.0, cpc: 2.80, affiliate_density: 0.70, ads_density: 0.60, content_density: 5500, creator_density: 200, engagement_velocity: 4.5, source: "google_trends", confidence: 0.85 },
    { niche_id: "skill.copywriting.email", keyword: "cold email AI", platform: "google", date: "2026-02-12", search_volume: 48, growth_rate_7d: 30.0, growth_rate_30d: 55.0, growth_rate_90d: 110.0, cpc: 3.50, affiliate_density: 0.55, ads_density: 0.50, content_density: 2800, creator_density: 90, engagement_velocity: 5.8, source: "google_trends", confidence: 0.80 },
    
    // Notion Templates
    { niche_id: "product.template.notion", keyword: "notion template gratis", platform: "google", date: "2026-02-12", search_volume: 70, growth_rate_7d: 5.0, growth_rate_30d: 10.0, growth_rate_90d: 15.0, cpc: 0.60, affiliate_density: 0.85, ads_density: 0.40, content_density: 15000, creator_density: 600, engagement_velocity: 3.2, source: "google_trends", confidence: 0.85 },
    { niche_id: "product.template.notion", keyword: "notion AI workspace", platform: "google", date: "2026-02-12", search_volume: 42, growth_rate_7d: 40.0, growth_rate_30d: 75.0, growth_rate_90d: 180.0, cpc: 1.20, affiliate_density: 0.50, ads_density: 0.35, content_density: 2000, creator_density: 80, engagement_velocity: 7.0, source: "google_trends", confidence: 0.75 },
  ];
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/trend_data_points`, {
    method: "POST",
    headers: { ...headers, "Prefer": "return=minimal,resolution=ignore-duplicates" },
    body: JSON.stringify(dataPoints),
  });
  
  if (!res.ok) {
    const err = await res.text();
    console.log(`trend_data_points seed error: ${err}`);
    return false;
  }
  
  console.log(`Seeded ${dataPoints.length} trend data points ✅`);
  return true;
}

// ────────────────────────────────────────────────
// Step 3: Verify
// ────────────────────────────────────────────────

async function verify() {
  console.log("\n=== Step 3: Verify ===");
  
  const tables = ["niche_taxonomy", "trend_data_points", "trend_scores", "trend_refresh_log"];
  
  for (const table of tables) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
      headers: { ...headers, "Prefer": "count=exact" },
    });
    
    if (res.ok) {
      const count = res.headers.get("content-range");
      console.log(`  ${table}: ${count || "exists"}`);
    } else {
      console.log(`  ${table}: ❌ NOT FOUND (needs SQL migration)`);
    }
  }
}

// ────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────

async function main() {
  console.log("🔧 Trend Intelligence Migration Runner\n");
  
  await createNicheTaxonomy();
  await seedTrendDataPoints();
  await verify();
  
  console.log("\n✅ Migration complete!");
  console.log("If tables are missing, run the SQL in Supabase Dashboard SQL Editor:");
  console.log("File: supabase/migrations/20260212_trend_intelligence.sql");
}

main().catch(console.error);
