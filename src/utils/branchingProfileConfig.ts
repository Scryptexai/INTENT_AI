/**
 * Branching Profile Configuration v3 — 5-Level Economic Model Profiling
 * ========================================================================
 * REDESIGN: From flat 11-question system to branching 5-level system.
 *
 * Level 1 → Model Ekonomi (6 categories)
 * Level 2 → Sub-sektor
 * Level 3 → Niche (deep drilling)
 * Level 4 → Platform
 * Level 5 → Workflow spesifik
 *
 * + Contextual questions (time, capital, risk, skill)
 * + Sector-specific profiling questions
 *
 * Architecture: Branching tree — each choice unlocks different sub-questions.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/** 6 Economic Model Categories */
export type EconomicModelId =
  | "skill_service"       // Time → Money
  | "audience_based"      // Attention → Money
  | "digital_product"     // Asset → Money
  | "commerce_arbitrage"  // Traffic → Margin
  | "data_research"       // Knowledge → Money
  | "automation_builder"; // System → Money

/** Sub-sector under each economic model */
export type SubSectorId = string;

/** Niche under each sub-sector */
export type NicheId = string;

/** Platform choices */
export type PlatformId = string;

/** Full user path selection through the branching tree */
export interface BranchingProfile {
  // Level 1
  economicModel: EconomicModelId;
  // Level 2
  subSector: SubSectorId;
  // Level 3
  niche: NicheId;
  // Level 4
  platform: PlatformId;
  // Level 5 (auto-generated based on above)
  workflowId: string;
  // Contextual scores
  contextScores: ContextScores;
  // Sector-specific answers
  sectorAnswers: Record<string, string>;
}

export interface ContextScores {
  time: number;        // 1-4
  capital: number;     // 0-3
  risk: number;        // 1-4
  skillLevel: number;  // 0-4
  audience: number;    // 0-4
}

// ============================================================================
// OPTION TYPES
// ============================================================================

export interface BranchOption {
  id: string;
  emoji: string;
  label: string;
  subtitle: string;
  tag?: string;
}

export interface BranchQuestion {
  id: string;
  level: number;
  title: string;
  subtitle: string;
  options: BranchOption[];
}

export interface SectorQuestion {
  id: string;
  title: string;
  subtitle: string;
  forModels: EconomicModelId[];
  forSubSectors?: string[];
  options: BranchOption[];
}

// ============================================================================
// LEVEL 1 — ECONOMIC MODELS (6 Categories)
// ============================================================================

export const ECONOMIC_MODELS: BranchOption[] = [
  {
    id: "skill_service",
    emoji: "🛠️",
    label: "Jual Skill & Jasa",
    subtitle: "Tukar waktu & keahlian langsung jadi uang. Copywriting, design, dev, marketing, AI operator.",
  },
  {
    id: "audience_based",
    emoji: "📱",
    label: "Bangun Audience & Monetisasi",
    subtitle: "Buat konten, bangun followers, monetisasi via ads/sponsorship/affiliate.",
  },
  {
    id: "digital_product",
    emoji: "📦",
    label: "Jual Produk Digital",
    subtitle: "Buat sekali, jual berkali-kali. Ebook, template, prompt pack, course, SaaS micro.",
  },
  {
    id: "commerce_arbitrage",
    emoji: "🛒",
    label: "E-Commerce & Arbitrage",
    subtitle: "Jualan online tanpa produk sendiri. Dropship, print on demand, affiliate, KDP.",
  },
  {
    id: "data_research",
    emoji: "📊",
    label: "Riset & Operator Data",
    subtitle: "Jual insight & analisis. Trend researcher, analyst, newsletter writer, AI curator.",
  },
  {
    id: "automation_builder",
    emoji: "⚙️",
    label: "Automation & System Builder",
    subtitle: "Bangun sistem otomatis untuk orang lain. No-code, Zapier, CRM, AI workflow, funnel.",
  },
];

// ============================================================================
// LEVEL 2 — SUB-SECTORS (per Economic Model)
// ============================================================================

export const SUB_SECTORS: Record<EconomicModelId, BranchOption[]> = {
  skill_service: [
    { id: "writing", emoji: "✍️", label: "Writing & Copywriting", subtitle: "Copywriting, SEO content, script, technical writing" },
    { id: "design", emoji: "🎨", label: "Design & Visual", subtitle: "UI/UX, branding, social media design, thumbnail" },
    { id: "video", emoji: "🎬", label: "Video Production", subtitle: "Video editing, motion graphic, short-form content" },
    { id: "development", emoji: "💻", label: "Development & Tech", subtitle: "Web dev, app dev, automation, scripting" },
    { id: "marketing", emoji: "📈", label: "Digital Marketing", subtitle: "Ads management, SEO, email marketing, funnel" },
    { id: "ai_operator", emoji: "🤖", label: "AI Operator", subtitle: "Prompt engineering, workflow automation, chatbot builder" },
  ],
  audience_based: [
    { id: "content_creator", emoji: "🎥", label: "Content Creator", subtitle: "YouTube, TikTok, Instagram — bangun audience & monetisasi" },
    { id: "micro_influencer", emoji: "⭐", label: "Micro Influencer", subtitle: "Niche kecil, engagement tinggi, brand deals" },
    { id: "niche_page", emoji: "📄", label: "Niche Page Builder", subtitle: "Bangun page niche di IG/TikTok tanpa tampil muka" },
    { id: "community_builder", emoji: "👥", label: "Community Builder", subtitle: "Discord, Telegram, Facebook Group — monetisasi via membership" },
  ],
  digital_product: [
    { id: "ebook", emoji: "📚", label: "Ebook & Guide", subtitle: "Tulis ebook niche, jual di Gumroad/Lemon Squeezy" },
    { id: "template", emoji: "📋", label: "Template & Toolkit", subtitle: "Notion, Canva, spreadsheet template — jual recurring" },
    { id: "prompt_pack", emoji: "💬", label: "Prompt Pack", subtitle: "Kumpulan prompt AI untuk niche spesifik" },
    { id: "course_mini", emoji: "🎓", label: "Mini Course", subtitle: "Course pendek 1-3 jam, jual di Udemy/Skillshare/sendiri" },
    { id: "membership", emoji: "🔑", label: "Membership / Community", subtitle: "Konten eksklusif + community berbayar bulanan" },
    { id: "saas_micro", emoji: "🚀", label: "Micro SaaS", subtitle: "Tool kecil berbasis subscription, build dengan AI" },
  ],
  commerce_arbitrage: [
    { id: "dropship", emoji: "📦", label: "Dropshipping", subtitle: "Jualan tanpa stok, supplier handle pengiriman" },
    { id: "print_on_demand", emoji: "👕", label: "Print on Demand", subtitle: "Custom design di kaos, mug, case — zero inventory" },
    { id: "affiliate", emoji: "🔗", label: "Affiliate Marketing", subtitle: "Promosikan produk orang, dapat komisi per sale" },
    { id: "amazon_kdp", emoji: "📖", label: "Amazon KDP", subtitle: "Self-publish buku di Amazon, passive income" },
    { id: "tiktok_shop", emoji: "🛍️", label: "TikTok Shop", subtitle: "Live selling & video shopping di TikTok" },
    { id: "digital_resell", emoji: "💿", label: "Digital Reselling", subtitle: "Resell lisensi, PLR content, white-label products" },
  ],
  data_research: [
    { id: "trend_researcher", emoji: "📈", label: "Trend Researcher", subtitle: "Riset trend pasar, jual insight ke brand & startup" },
    { id: "market_analyst", emoji: "📊", label: "Market Analyst", subtitle: "Analisis kompetitor, market size, opportunity mapping" },
    { id: "crypto_analyst", emoji: "🪙", label: "Crypto/Finance Analyst", subtitle: "Analisis crypto, DeFi, trading signals" },
    { id: "newsletter_writer", emoji: "📧", label: "Newsletter Writer", subtitle: "Paid newsletter, curated insights, niche digest" },
    { id: "ai_curator", emoji: "🧠", label: "AI Research Curator", subtitle: "Kurasi riset AI, tools baru, tutorial — monetisasi via audience" },
  ],
  automation_builder: [
    { id: "nocode_builder", emoji: "🧩", label: "No-Code App Builder", subtitle: "Build apps tanpa coding pakai Bubble, Glide, Softr" },
    { id: "zapier_automation", emoji: "⚡", label: "Zapier/Make Automation", subtitle: "Setup workflow automation untuk bisnis" },
    { id: "crm_setup", emoji: "📇", label: "CRM & Sales Setup", subtitle: "Setup HubSpot, Pipedrive, sales pipeline untuk client" },
    { id: "ai_workflow", emoji: "🤖", label: "AI Workflow Builder", subtitle: "Build custom AI workflow pakai API, agents, chatbots" },
    { id: "funnel_builder", emoji: "🔄", label: "Funnel Builder", subtitle: "Landing page, email sequence, sales funnel setup" },
  ],
};

// ============================================================================
// LEVEL 3 — NICHES (per Sub-Sector) — Deep Drilling
// ============================================================================

export const NICHES: Record<string, BranchOption[]> = {
  // ── SKILL SERVICE: Writing ──
  writing: [
    { id: "copywriting", emoji: "✍️", label: "Copywriting & Sales Copy", subtitle: "Landing page, email sales, ads copy" },
    { id: "seo_content", emoji: "🔍", label: "SEO Content Writing", subtitle: "Blog post, artikel SEO, content cluster" },
    { id: "script_writing", emoji: "🎬", label: "Script & Video Copy", subtitle: "YouTube script, TikTok script, podcast script" },
    { id: "technical_writing", emoji: "📝", label: "Technical Writing", subtitle: "Dokumentasi, SOP, manual, API docs" },
    { id: "ghostwriting", emoji: "👻", label: "Ghostwriting", subtitle: "Nulis buat personal brand orang lain" },
  ],
  // ── SKILL SERVICE: Design ──
  design: [
    { id: "ui_ux", emoji: "🖥️", label: "UI/UX Design", subtitle: "Web & app interface design" },
    { id: "branding", emoji: "🎨", label: "Branding & Identity", subtitle: "Logo, brand kit, style guide" },
    { id: "social_media_design", emoji: "📱", label: "Social Media Design", subtitle: "Post, story, carousel, cover design" },
    { id: "thumbnail_design", emoji: "🖼️", label: "Thumbnail & Visual", subtitle: "YouTube thumbnail, banner, infographic" },
  ],
  // ── SKILL SERVICE: Video ──
  video: [
    { id: "video_editing", emoji: "🎬", label: "Video Editing", subtitle: "Long-form & short-form editing" },
    { id: "motion_graphic", emoji: "✨", label: "Motion Graphics", subtitle: "Animasi, intro, lower-third, explainer" },
    { id: "short_form", emoji: "📱", label: "Short-Form Specialist", subtitle: "TikTok, Reels, Shorts editing" },
  ],
  // ── SKILL SERVICE: Development ──
  development: [
    { id: "web_dev", emoji: "🌐", label: "Web Development", subtitle: "Landing page, e-commerce, web app" },
    { id: "app_dev", emoji: "📱", label: "App Development", subtitle: "Mobile & cross-platform apps" },
    { id: "automation_dev", emoji: "⚙️", label: "Automation & Scripts", subtitle: "Bot, scraper, API integration" },
    { id: "wordpress", emoji: "📝", label: "WordPress Specialist", subtitle: "Custom WordPress, theme, plugin" },
  ],
  // ── SKILL SERVICE: Marketing ──
  marketing: [
    { id: "ads_management", emoji: "📢", label: "Ads Management", subtitle: "Meta Ads, Google Ads, TikTok Ads" },
    { id: "seo_service", emoji: "🔍", label: "SEO Service", subtitle: "On-page, off-page, technical SEO" },
    { id: "email_marketing", emoji: "📧", label: "Email Marketing", subtitle: "Sequence, automation, newsletter management" },
    { id: "social_media_mgmt", emoji: "📱", label: "Social Media Management", subtitle: "Content planning, scheduling, engagement" },
  ],
  // ── SKILL SERVICE: AI Operator ──
  ai_operator: [
    { id: "prompt_engineer", emoji: "💬", label: "Prompt Engineer", subtitle: "Craft prompt untuk hasil AI optimal" },
    { id: "ai_workflow_op", emoji: "🔄", label: "AI Workflow Operator", subtitle: "Setup & manage AI pipeline untuk bisnis" },
    { id: "chatbot_builder", emoji: "🤖", label: "Chatbot Builder", subtitle: "Custom chatbot untuk customer service & sales" },
    { id: "ai_content_op", emoji: "✨", label: "AI Content Operator", subtitle: "Produksi konten massal pakai AI" },
  ],

  // ── AUDIENCE BASED: Content Creator — with deep niche drilling ──
  content_creator: [
    { id: "education", emoji: "📚", label: "Education & Tutorial", subtitle: "Edukasi skill, how-to, tips & tricks" },
    { id: "gaming_content", emoji: "🎮", label: "Gaming", subtitle: "Let's play, review, esports, tips" },
    { id: "finance_content", emoji: "💰", label: "Finance & Investing", subtitle: "Personal finance, crypto, investing tips" },
    { id: "health_content", emoji: "🏋️", label: "Health & Fitness", subtitle: "Workout, nutrisi, wellness, mental health" },
    { id: "tech_content", emoji: "💻", label: "Tech & AI", subtitle: "Review gadget, tutorial tools, AI news" },
    { id: "lifestyle", emoji: "🌟", label: "Lifestyle", subtitle: "Daily vlog, travel, food, fashion" },
    { id: "selfimprovement", emoji: "🧠", label: "Self-Improvement", subtitle: "Produktivitas, mindset, habits, motivasi" },
  ],
  micro_influencer: [
    { id: "niche_micro", emoji: "🎯", label: "Hyper-Niche Expert", subtitle: "Expert di 1 topik sangat spesifik" },
    { id: "local_influencer", emoji: "📍", label: "Local Influencer", subtitle: "Fokus audience kota/region tertentu" },
    { id: "b2b_influencer", emoji: "💼", label: "B2B / LinkedIn Influencer", subtitle: "Thought leader di industri profesional" },
  ],
  niche_page: [
    { id: "faceless_ig", emoji: "📸", label: "Faceless Instagram Page", subtitle: "Theme page tanpa tampil muka" },
    { id: "faceless_tiktok", emoji: "🎬", label: "Faceless TikTok", subtitle: "Kompilasi, fakta, AI voiceover" },
    { id: "curated_page", emoji: "📋", label: "Curated Content Page", subtitle: "Agregasi konten best-of niche" },
  ],
  community_builder: [
    { id: "discord_community", emoji: "💬", label: "Discord Community", subtitle: "Bangun & kelola community Discord" },
    { id: "telegram_group", emoji: "📱", label: "Telegram Group", subtitle: "Channel & group Telegram niche" },
    { id: "paid_community", emoji: "🔐", label: "Paid Community", subtitle: "Membership community berbayar" },
  ],

  // ── DIGITAL PRODUCT — Niches ──
  ebook: [
    { id: "how_to_guide", emoji: "📖", label: "How-To Guide", subtitle: "Panduan step-by-step topik spesifik" },
    { id: "industry_report", emoji: "📊", label: "Industry Report", subtitle: "Riset & analisis industri tertentu" },
    { id: "playbook", emoji: "📋", label: "Playbook / Framework", subtitle: "Framework actionable untuk solve problem" },
  ],
  template: [
    { id: "notion_template", emoji: "📝", label: "Notion Template", subtitle: "Productivity, project management, planner" },
    { id: "canva_template", emoji: "🎨", label: "Canva Template", subtitle: "Social media, presentation, poster" },
    { id: "spreadsheet_template", emoji: "📊", label: "Spreadsheet / Dashboard", subtitle: "Finance tracker, business dashboard" },
    { id: "figma_template", emoji: "🖥️", label: "Figma / Design Template", subtitle: "UI kit, wireframe, component library" },
  ],
  prompt_pack: [
    { id: "business_prompts", emoji: "💼", label: "Business & Marketing Prompts", subtitle: "Copy, strategy, analysis prompts" },
    { id: "creative_prompts", emoji: "🎨", label: "Creative & Design Prompts", subtitle: "Image generation, writing prompts" },
    { id: "dev_prompts", emoji: "💻", label: "Dev & Automation Prompts", subtitle: "Coding, debugging, architecture prompts" },
  ],
  course_mini: [
    { id: "skill_course", emoji: "🎓", label: "Skill Course", subtitle: "Ajarkan 1 skill spesifik dalam 1-3 jam" },
    { id: "tool_course", emoji: "🔧", label: "Tool Tutorial Course", subtitle: "Master 1 tool/software tertentu" },
    { id: "career_course", emoji: "💼", label: "Career / Business Course", subtitle: "Career switching, side income, freelance" },
  ],
  membership: [
    { id: "content_membership", emoji: "📚", label: "Content Membership", subtitle: "Newsletter/video premium bulanan" },
    { id: "community_membership", emoji: "👥", label: "Community Membership", subtitle: "Akses group eksklusif + resource" },
  ],
  saas_micro: [
    { id: "ai_tool", emoji: "🤖", label: "AI-Powered Tool", subtitle: "Micro SaaS powered by AI API" },
    { id: "niche_tool", emoji: "🔧", label: "Niche Utility Tool", subtitle: "Tool spesifik untuk 1 problem" },
  ],

  // ── COMMERCE/ARBITRAGE — Niches ──
  dropship: [
    { id: "fashion_dropship", emoji: "👗", label: "Fashion & Accessories", subtitle: "Pakaian, aksesoris, sepatu" },
    { id: "gadget_dropship", emoji: "📱", label: "Gadget & Electronics", subtitle: "Aksesoris HP, smart home, wearable" },
    { id: "home_dropship", emoji: "🏠", label: "Home & Living", subtitle: "Dekorasi, kitchen, organizer" },
  ],
  print_on_demand: [
    { id: "apparel_pod", emoji: "👕", label: "Apparel / Kaos", subtitle: "Custom t-shirt, hoodie, hat" },
    { id: "accessories_pod", emoji: "🎒", label: "Accessories", subtitle: "Case HP, mug, sticker, tote bag" },
    { id: "art_pod", emoji: "🖼️", label: "Art Prints", subtitle: "Wall art, poster, canvas prints" },
  ],
  affiliate: [
    { id: "software_affiliate", emoji: "💻", label: "Software & SaaS", subtitle: "Hosting, tools, AI products — high commission" },
    { id: "education_affiliate", emoji: "📚", label: "Education & Course", subtitle: "Online course, bootcamp, certification" },
    { id: "health_affiliate", emoji: "🏋️", label: "Health & Beauty", subtitle: "Supplement, skincare, fitness equipment" },
    { id: "finance_affiliate", emoji: "💰", label: "Finance & Crypto", subtitle: "Broker, platform, financial tools" },
    { id: "gadget_affiliate", emoji: "📱", label: "Gadget & Tech", subtitle: "Review & recommend tech products" },
  ],
  amazon_kdp: [
    { id: "low_content", emoji: "📓", label: "Low Content Books", subtitle: "Journal, planner, coloring book" },
    { id: "nonfiction_kdp", emoji: "📖", label: "Non-Fiction Books", subtitle: "How-to, self-help, niche guides" },
    { id: "fiction_kdp", emoji: "📚", label: "Fiction / Short Stories", subtitle: "AI-assisted fiction writing" },
  ],
  tiktok_shop: [
    { id: "beauty_tiktok", emoji: "💄", label: "Beauty & Skincare", subtitle: "Live selling beauty products" },
    { id: "fashion_tiktok", emoji: "👗", label: "Fashion", subtitle: "Outfit haul, try-on, fashion tips" },
    { id: "food_tiktok", emoji: "🍜", label: "Food & Snacks", subtitle: "Snack review, food haul" },
  ],
  digital_resell: [
    { id: "plr_resell", emoji: "📄", label: "PLR Content", subtitle: "Resell private label rights content" },
    { id: "license_resell", emoji: "🔑", label: "Software License", subtitle: "Resell lifetime deals & licenses" },
  ],

  // ── DATA/RESEARCH — Niches ──
  trend_researcher: [
    { id: "tech_trends", emoji: "💻", label: "Tech & AI Trends", subtitle: "AI tools, SaaS trends, startup analysis" },
    { id: "market_trends", emoji: "📈", label: "Market & Consumer Trends", subtitle: "Consumer behavior, market shifts" },
    { id: "social_trends", emoji: "📱", label: "Social Media Trends", subtitle: "Viral content, platform updates, algorithm" },
  ],
  market_analyst: [
    { id: "competitive_analysis", emoji: "🏢", label: "Competitive Analysis", subtitle: "Analisis kompetitor & positioning" },
    { id: "opportunity_mapping", emoji: "🗺️", label: "Opportunity Mapping", subtitle: "Find market gaps & opportunities" },
  ],
  crypto_analyst: [
    { id: "defi_analysis", emoji: "🔗", label: "DeFi & Protocol Analysis", subtitle: "Smart contract, yield, risk analysis" },
    { id: "trading_signals", emoji: "📊", label: "Trading Signals & Alpha", subtitle: "Technical analysis, entry/exit signals" },
  ],
  newsletter_writer: [
    { id: "curated_newsletter", emoji: "📋", label: "Curated News Digest", subtitle: "Best-of weekly roundup niche" },
    { id: "analysis_newsletter", emoji: "🔍", label: "Deep Analysis Newsletter", subtitle: "Original research & insight" },
    { id: "trend_newsletter", emoji: "📈", label: "Trend Report Newsletter", subtitle: "What's hot, what's next" },
  ],
  ai_curator: [
    { id: "ai_tools_curator", emoji: "🔧", label: "AI Tools Curator", subtitle: "Review & compare AI tools" },
    { id: "ai_research_curator", emoji: "📄", label: "AI Research Curator", subtitle: "Simplify papers & research for mass audience" },
  ],

  // ── AUTOMATION BUILDER — Niches ──
  nocode_builder: [
    { id: "internal_tools", emoji: "🏢", label: "Internal Business Tools", subtitle: "Dashboard, admin panel, tracker" },
    { id: "mvp_builder", emoji: "🚀", label: "MVP / Prototype Builder", subtitle: "Quick MVP untuk startup validation" },
    { id: "marketplace_builder", emoji: "🛒", label: "Marketplace Builder", subtitle: "2-sided marketplace niche" },
  ],
  zapier_automation: [
    { id: "marketing_automation", emoji: "📢", label: "Marketing Automation", subtitle: "Email, social, lead nurture pipelines" },
    { id: "ops_automation", emoji: "⚙️", label: "Operations Automation", subtitle: "Data sync, reporting, alerts" },
    { id: "sales_automation", emoji: "💰", label: "Sales Automation", subtitle: "CRM updates, follow-ups, pipeline" },
  ],
  crm_setup: [
    { id: "startup_crm", emoji: "🚀", label: "Startup CRM Setup", subtitle: "HubSpot / Pipedrive untuk early-stage" },
    { id: "agency_crm", emoji: "🏢", label: "Agency CRM Setup", subtitle: "Client management, project tracking" },
  ],
  ai_workflow: [
    { id: "content_pipeline", emoji: "📝", label: "Content Pipeline", subtitle: "Automated content creation → scheduling" },
    { id: "data_pipeline", emoji: "📊", label: "Data Processing Pipeline", subtitle: "ETL, analysis, reporting automation" },
    { id: "customer_support_ai", emoji: "🤖", label: "AI Customer Support", subtitle: "Chatbot, auto-reply, ticket routing" },
  ],
  funnel_builder: [
    { id: "lead_gen_funnel", emoji: "🧲", label: "Lead Generation Funnel", subtitle: "Opt-in → nurture → convert" },
    { id: "sales_funnel", emoji: "💰", label: "Sales Funnel", subtitle: "VSL, webinar, checkout optimization" },
    { id: "launch_funnel", emoji: "🚀", label: "Product Launch Funnel", subtitle: "Pre-launch → launch → post-launch" },
  ],
};

// ============================================================================
// LEVEL 4 — PLATFORMS (contextual based on model + sub-sector)
// ============================================================================

export const PLATFORMS: Record<string, BranchOption[]> = {
  // Skill service — where to sell
  skill_service: [
    { id: "fiverr", emoji: "🟢", label: "Fiverr", subtitle: "Marketplace global, gig-based" },
    { id: "upwork", emoji: "🟢", label: "Upwork", subtitle: "Freelance marketplace, project-based" },
    { id: "linkedin", emoji: "💼", label: "LinkedIn", subtitle: "B2B networking, direct outreach" },
    { id: "direct_client", emoji: "🤝", label: "Direct / Cold Outreach", subtitle: "Email, DM, langsung ke client" },
    { id: "tokopedia_jasa", emoji: "🛒", label: "Marketplace Lokal", subtitle: "Sribulancer, Projects.co.id, Fastwork" },
  ],
  // Audience based — where to build
  audience_based: [
    { id: "youtube", emoji: "▶️", label: "YouTube", subtitle: "Long & short form video" },
    { id: "tiktok", emoji: "📱", label: "TikTok", subtitle: "Short-form video, algorithm-driven" },
    { id: "instagram", emoji: "📸", label: "Instagram", subtitle: "Reels, carousel, stories" },
    { id: "twitter_x", emoji: "🐦", label: "Twitter/X", subtitle: "Thread, microblog, engagement" },
    { id: "substack", emoji: "📧", label: "Substack / Newsletter", subtitle: "Written content, email-first" },
    { id: "podcast", emoji: "🎙️", label: "Podcast", subtitle: "Audio content, long-form discussions" },
  ],
  // Digital product — where to sell
  digital_product: [
    { id: "gumroad", emoji: "🛒", label: "Gumroad", subtitle: "Simple digital product sales" },
    { id: "lemon_squeezy", emoji: "🍋", label: "Lemon Squeezy", subtitle: "Modern digital commerce" },
    { id: "notion_market", emoji: "📝", label: "Notion Marketplace", subtitle: "Notion templates & systems" },
    { id: "udemy", emoji: "🎓", label: "Udemy / Skillshare", subtitle: "Online course platforms" },
    { id: "own_website", emoji: "🌐", label: "Website Sendiri", subtitle: "Full control, own domain" },
    { id: "etsy_digital", emoji: "🎨", label: "Etsy (Digital)", subtitle: "Digital downloads marketplace" },
  ],
  // Commerce — where to sell
  commerce_arbitrage: [
    { id: "shopee", emoji: "🛒", label: "Shopee", subtitle: "Marketplace SE Asia terbesar" },
    { id: "tokopedia", emoji: "🛒", label: "Tokopedia", subtitle: "Marketplace Indonesia" },
    { id: "tiktok_shop_plat", emoji: "🛍️", label: "TikTok Shop", subtitle: "Social commerce, live selling" },
    { id: "amazon", emoji: "📦", label: "Amazon", subtitle: "Global marketplace" },
    { id: "own_store", emoji: "🌐", label: "Own Store (Shopify)", subtitle: "Full control e-commerce" },
  ],
  // Data/Research — where to publish
  data_research: [
    { id: "substack_dr", emoji: "📧", label: "Substack", subtitle: "Paid newsletter platform" },
    { id: "twitter_dr", emoji: "🐦", label: "Twitter/X", subtitle: "Build authority via threads" },
    { id: "linkedin_dr", emoji: "💼", label: "LinkedIn", subtitle: "Professional thought leadership" },
    { id: "own_blog", emoji: "🌐", label: "Own Blog / Website", subtitle: "SEO-driven content hub" },
    { id: "medium", emoji: "📝", label: "Medium", subtitle: "Writing platform with partner program" },
  ],
  // Automation — where to find clients
  automation_builder: [
    { id: "upwork_auto", emoji: "🟢", label: "Upwork", subtitle: "Project-based freelancing" },
    { id: "linkedin_auto", emoji: "💼", label: "LinkedIn", subtitle: "B2B networking & lead gen" },
    { id: "direct_auto", emoji: "🤝", label: "Direct Sales", subtitle: "Cold outreach, referrals" },
    { id: "make_marketplace", emoji: "⚡", label: "Make/Zapier Marketplace", subtitle: "Sell pre-built automations" },
    { id: "productized", emoji: "📦", label: "Productized Service", subtitle: "Fixed price, repeatable service" },
  ],
};

// ============================================================================
// CONTEXTUAL QUESTIONS — Asked for ALL models
// ============================================================================

export const CONTEXT_QUESTIONS: BranchQuestion[] = [
  {
    id: "time",
    level: 0,
    title: "Berapa waktu luang kamu per hari?",
    subtitle: "Waktu yang BENAR-BENAR bisa kamu dedikasikan",
    options: [
      { id: "lt1h", emoji: "⏰", label: "< 1 jam (sangat terbatas)", subtitle: "Pagi/malam sebelum tidur" },
      { id: "1-2h", emoji: "🕐", label: "1–2 jam", subtitle: "Sebelum/sesudah kerja" },
      { id: "3-4h", emoji: "🕒", label: "3–4 jam", subtitle: "Punya waktu cukup" },
      { id: "gt4h", emoji: "🕕", label: "> 4 jam (full dedikasi)", subtitle: "Full time available" },
    ],
  },
  {
    id: "capital",
    level: 0,
    title: "Berapa modal yang siap kamu keluarkan?",
    subtitle: "Untuk tools, iklan, domain, atau setup awal",
    options: [
      { id: "zero", emoji: "🚫", label: "$0 — tidak bisa keluar uang", subtitle: "100% gratis" },
      { id: "lt50", emoji: "💵", label: "< $50", subtitle: "Bisa langganan 1-2 tool" },
      { id: "50-200", emoji: "💰", label: "$50–200", subtitle: "Setup & ads kecil" },
      { id: "200-500", emoji: "🏦", label: "$200–500", subtitle: "Investasi tools & ads" },
    ],
  },
  {
    id: "risk",
    level: 0,
    title: "Seberapa besar risiko yang siap kamu tanggung?",
    subtitle: "Kalau hasilnya tidak sesuai harapan dalam 30 hari",
    options: [
      { id: "very_low", emoji: "🛡️", label: "Sangat rendah — hanya yang 100% aman", subtitle: "Proven methods only" },
      { id: "low", emoji: "⚖️", label: "Rendah — proven, sedikit eksperimen", subtitle: "Mostly safe" },
      { id: "medium", emoji: "🎯", label: "Sedang — siap eksperimen terukur", subtitle: "Calculated risks" },
      { id: "high", emoji: "🔥", label: "Tinggi — gagal cepat, pivot cepat", subtitle: "Go big or learn fast" },
    ],
  },
  {
    id: "skill_level",
    level: 0,
    title: "Seberapa skilled kamu di bidang yang dipilih?",
    subtitle: "Jujur saja — ini mempengaruhi starting point kamu",
    options: [
      { id: "beginner", emoji: "🌱", label: "Pemula total — belum pernah", subtitle: "Baru mulai dari nol" },
      { id: "basic", emoji: "📗", label: "Tahu dasar — pernah coba", subtitle: "Sudah pernah tapi belum mahir" },
      { id: "intermediate", emoji: "📘", label: "Intermediate — bisa eksekusi", subtitle: "Bisa kerjain sendiri" },
      { id: "advanced", emoji: "📕", label: "Advanced — sudah mahir", subtitle: "Expert level, butuh monetisasi" },
      { id: "expert", emoji: "🏆", label: "Expert — sudah punya portfolio", subtitle: "Tinggal scale up" },
    ],
  },
  {
    id: "audience",
    level: 0,
    title: "Apakah kamu sudah punya audience atau network?",
    subtitle: "Ini menentukan strategi awal: build dulu atau langsung eksekusi",
    options: [
      { id: "zero", emoji: "🚫", label: "Nol — tidak ada follower / kontak", subtitle: "Start from scratch" },
      { id: "micro", emoji: "🌱", label: "< 200 follower", subtitle: "Baru mulai, belum engage" },
      { id: "small", emoji: "📱", label: "200-1K follower", subtitle: "Mulai ada interaksi" },
      { id: "medium", emoji: "👥", label: "1K-5K follower / email list", subtitle: "Bisa mulai monetisasi" },
      { id: "large", emoji: "🌟", label: "> 5K follower / network aktif", subtitle: "Ready to monetize" },
    ],
  },
];

// ============================================================================
// SECTOR-SPECIFIC QUESTIONS — Different per Economic Model
// ============================================================================

export const SECTOR_QUESTIONS: SectorQuestion[] = [
  // ── AUDIENCE-BASED specific ──
  {
    id: "camera_comfort",
    title: "Apakah kamu nyaman tampil di depan kamera?",
    subtitle: "Ini menentukan format konten yang cocok",
    forModels: ["audience_based"],
    options: [
      { id: "love_it", emoji: "🎥", label: "Suka banget — sering ngomong di kamera", subtitle: "Natural di depan kamera" },
      { id: "okay", emoji: "😊", label: "Oke — bisa tapi belum biasa", subtitle: "Perlu latihan" },
      { id: "prefer_no", emoji: "😶", label: "Prefer tidak — tapi mau coba", subtitle: "Agak awkward" },
      { id: "no_face", emoji: "🙈", label: "Tidak mau tampil muka sama sekali", subtitle: "Faceless content only" },
    ],
  },
  {
    id: "content_consistency",
    title: "Seberapa konsisten kamu bisa posting?",
    subtitle: "Konsistensi > kualitas di awal",
    forModels: ["audience_based"],
    options: [
      { id: "daily", emoji: "📅", label: "Setiap hari", subtitle: "1+ post per hari" },
      { id: "weekdays", emoji: "🗓️", label: "5x seminggu", subtitle: "Senin-Jumat" },
      { id: "3x_week", emoji: "📆", label: "3x seminggu", subtitle: "Selang-seling" },
      { id: "1x_week", emoji: "📋", label: "1x seminggu", subtitle: "Minimal tapi konsisten" },
    ],
  },

  // ── SKILL-SERVICE specific ──
  {
    id: "client_experience",
    title: "Sudah pernah punya client / kerja freelance?",
    subtitle: "Pengalaman client management",
    forModels: ["skill_service"],
    options: [
      { id: "never", emoji: "🆕", label: "Belum pernah sama sekali", subtitle: "First time freelancing" },
      { id: "1-3", emoji: "📋", label: "1-3 client sebelumnya", subtitle: "Sedikit pengalaman" },
      { id: "regular", emoji: "✅", label: "Regular freelancer", subtitle: "5+ client, tahu prosesnya" },
      { id: "agency", emoji: "🏢", label: "Pernah run agency / team", subtitle: "Leadership experience" },
    ],
  },
  {
    id: "portfolio_ready",
    title: "Apakah kamu punya portfolio / sampel kerja?",
    subtitle: "Portfolio = trust builder utama",
    forModels: ["skill_service"],
    options: [
      { id: "none", emoji: "🚫", label: "Belum punya — perlu bikin dulu", subtitle: "Mulai dari nol" },
      { id: "few", emoji: "📁", label: "Punya beberapa — belum rapi", subtitle: "Perlu di-organize" },
      { id: "ready", emoji: "✅", label: "Portfolio sudah siap", subtitle: "Tinggal share ke client" },
    ],
  },

  // ── DATA/RESEARCH specific ──
  {
    id: "analysis_comfort",
    title: "Seberapa nyaman kamu dengan analisis data?",
    subtitle: "Riset & analisis adalah inti dari model ini",
    forModels: ["data_research"],
    options: [
      { id: "love_data", emoji: "📊", label: "Suka banget — data is life", subtitle: "Bisa spreadsheet, chart, analysis" },
      { id: "can_learn", emoji: "📗", label: "Belum mahir tapi mau belajar", subtitle: "Willing to learn tools" },
      { id: "writing_focus", emoji: "✍️", label: "Prefer nulis daripada analisis angka", subtitle: "Narrative > numbers" },
    ],
  },
  {
    id: "exposure_comfort",
    title: "Apakah kamu nyaman tampil sebagai authority?",
    subtitle: "Newsletter/research butuh personal brand",
    forModels: ["data_research"],
    options: [
      { id: "yes_brand", emoji: "🌟", label: "Ya — mau bangun personal brand", subtitle: "Ready to be public" },
      { id: "anonymous", emoji: "🙈", label: "Prefer anonymous / brand name", subtitle: "Behind a brand" },
      { id: "both", emoji: "🤔", label: "Bisa keduanya — tergantung niche", subtitle: "Flexible" },
    ],
  },

  // ── COMMERCE specific ──
  {
    id: "selling_experience",
    title: "Sudah pernah jualan online?",
    subtitle: "Pengalaman jualan apapun — marketplace, social, direct",
    forModels: ["commerce_arbitrage"],
    options: [
      { id: "never", emoji: "🆕", label: "Belum pernah", subtitle: "First timer" },
      { id: "tried", emoji: "📦", label: "Pernah coba tapi stop", subtitle: "Belum konsisten" },
      { id: "active", emoji: "✅", label: "Aktif jualan sekarang", subtitle: "Mau scale up" },
      { id: "experienced", emoji: "🏆", label: "Sudah berpengalaman", subtitle: "Mau diversifikasi" },
    ],
  },

  // ── AUTOMATION specific ──
  {
    id: "tech_comfort",
    title: "Seberapa nyaman kamu dengan tech tools?",
    subtitle: "Automation butuh comfort level dengan teknologi",
    forModels: ["automation_builder"],
    options: [
      { id: "native", emoji: "💻", label: "Tech-native — bisa ngoding / no-code", subtitle: "Tinggal build" },
      { id: "comfortable", emoji: "🔧", label: "Comfortable — pakai tools mudah", subtitle: "Canva, Notion, basic tools" },
      { id: "learning", emoji: "📗", label: "Masih belajar — tapi mau", subtitle: "Need guidance" },
    ],
  },

  // ── DIGITAL PRODUCT specific ──
  {
    id: "creation_style",
    title: "Gaya membuat konten / produk kamu?",
    subtitle: "Ini menentukan jenis produk digital yang cocok",
    forModels: ["digital_product"],
    options: [
      { id: "writer", emoji: "✍️", label: "Prefer menulis (ebook, guide, docs)", subtitle: "Text-first creator" },
      { id: "visual", emoji: "🎨", label: "Prefer visual (template, design)", subtitle: "Visual-first creator" },
      { id: "video", emoji: "🎬", label: "Prefer video (course, tutorial)", subtitle: "Video-first creator" },
      { id: "builder", emoji: "🔧", label: "Prefer building (tool, SaaS)", subtitle: "Builder/developer" },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Get sub-sectors for a given economic model */
export function getSubSectors(modelId: EconomicModelId): BranchOption[] {
  return SUB_SECTORS[modelId] || [];
}

/** Get niches for a given sub-sector */
export function getNiches(subSectorId: string): BranchOption[] {
  return NICHES[subSectorId] || [];
}

/** Get platforms for a given economic model */
export function getPlatforms(modelId: EconomicModelId): BranchOption[] {
  return PLATFORMS[modelId] || [];
}

/** Get sector-specific questions for a given economic model */
export function getSectorQuestions(modelId: EconomicModelId, subSectorId?: string): SectorQuestion[] {
  return SECTOR_QUESTIONS.filter((q) => {
    const modelMatch = q.forModels.includes(modelId);
    if (!modelMatch) return false;
    if (q.forSubSectors && subSectorId) {
      return q.forSubSectors.includes(subSectorId);
    }
    return true;
  });
}

/** Generate workflow ID from selections */
export function generateWorkflowId(
  model: EconomicModelId,
  subSector: string,
  niche: string,
  platform: string
): string {
  return `${model}__${subSector}__${niche}__${platform}`;
}

/** Get the label/display info for an economic model */
export function getModelInfo(modelId: EconomicModelId): BranchOption | undefined {
  return ECONOMIC_MODELS.find((m) => m.id === modelId);
}

/** Get the label/display info for a sub-sector */
export function getSubSectorInfo(modelId: EconomicModelId, subSectorId: string): BranchOption | undefined {
  return SUB_SECTORS[modelId]?.find((s) => s.id === subSectorId);
}

/** Get the label/display info for a niche */
export function getNicheInfo(subSectorId: string, nicheId: string): BranchOption | undefined {
  return NICHES[subSectorId]?.find((n) => n.id === nicheId);
}

/** Count total steps for a given flow (context questions + model + sub-sector + niche + platform + sector questions) */
export function getTotalSteps(modelId?: EconomicModelId): number {
  // base: model(1) + sub-sector(1) + niche(1) + platform(1) + context questions(5)
  let total = 9;
  if (modelId) {
    const sectorQs = getSectorQuestions(modelId);
    total += sectorQs.length;
  }
  return total;
}

// ============================================================================
// BACKWARD COMPAT — Map new model to old PathId for DB compatibility
// ============================================================================

import type { PathId, ProfileScores } from "./profilingConfig";

/** Map EconomicModelId + SubSector to old PathId for DB compatibility */
export function mapToLegacyPathId(model: EconomicModelId, subSector: string): PathId {
  const mapping: Record<string, PathId> = {
    "skill_service": "micro_service",
    "audience_based": "niche_content",
    "digital_product": "digital_product",
    "commerce_arbitrage": "arbitrage_skill",
    "data_research": "freelance_upgrade",
    "automation_builder": "freelance_upgrade",
  };
  return mapping[model] || "micro_service";
}

/** Map context scores to legacy ProfileScores for DB compatibility */
export function mapToLegacyScores(
  ctx: ContextScores,
  sectorAnswers: Record<string, string>,
  model: EconomicModelId,
  subSector: string,
  platform: string
): ProfileScores {
  // Map context scores to the old 11-dimension score system
  const timeMap: Record<string, number> = { "lt1h": 1, "1-2h": 2, "3-4h": 3, "gt4h": 4 };
  const capitalMap: Record<string, number> = { "zero": 0, "lt50": 1, "50-200": 2, "200-500": 3 };
  const riskMap: Record<string, number> = { "very_low": 1, "low": 2, "medium": 3, "high": 4 };
  const skillMap: Record<string, number> = { "beginner": 0, "basic": 1, "intermediate": 2, "advanced": 3, "expert": 4 };
  const audienceMap: Record<string, number> = { "zero": 0, "micro": 1, "small": 2, "medium": 3, "large": 4 };

  // Map work style based on model + sub-sector
  const workStyleMap: Record<string, number> = {
    "writing": 3, "design": 2, "video": 2, "development": 7, "marketing": 5,
    "ai_operator": 7, "content_creator": 1, "micro_influencer": 4,
    "niche_page": 7, "community_builder": 6,
  };

  // Map platform to score
  const platformMap: Record<string, number> = {
    "tiktok": 1, "youtube": 2, "twitter_x": 3, "linkedin": 4,
    "fiverr": 5, "upwork": 5, "own_website": 6, "gumroad": 6,
    "shopee": 5, "substack": 6, "substack_dr": 6,
  };

  return {
    time: ctx.time,
    capital: ctx.capital,
    target_speed: 2, // default moderate
    work_style: workStyleMap[subSector] || 7,
    risk: ctx.risk,
    skill_primary: ctx.skillLevel,
    skill_secondary: 0,
    interest_market: 1,
    audience_access: ctx.audience,
    daily_routine: 1,
    preferred_platform: platformMap[platform] || 1,
  };
}

/** Full branching profile result that maps to both new and legacy systems */
export interface BranchingProfileResult {
  // New system
  economicModel: EconomicModelId;
  subSector: string;
  niche: string;
  platform: string;
  workflowId: string;
  contextScores: ContextScores;
  sectorAnswers: Record<string, string>;
  // Legacy compat
  legacyPathId: PathId;
  legacyScores: ProfileScores;
  legacySegment: string;
  answerTags: Record<string, string>;
}
