/**
 * Path Sub-Specialization Engine
 * ================================
 * Combines: PathId + interest_market + work_style + skill + platform
 * to generate a SPECIFIC sub-path with:
 *   - Niche title (e.g., "AI Copywriter untuk Fitness Brands")
 *   - Specific description
 *   - Concrete examples
 *   - Recommended tools
 *   - Target audience
 *   - Income estimate
 *
 * This makes the output SHARP and PERSONAL instead of generic "Micro Service".
 */

import type { PathId, ProfileScores, ProfilingQuestionId } from "./profilingConfig";

// ============================================================================
// TYPES
// ============================================================================

export interface SubSpecialization {
  /** Judul spesifik, e.g. "AI Fitness Content Writer" */
  title: string;
  /** Emoji untuk visual identity */
  emoji: string;
  /** Deskripsi 2-3 kalimat yang tajam */
  description: string;
  /** 3-4 contoh deliverable KONKRET */
  examples: string[];
  /** Tools spesifik yang dipakai */
  tools: string[];
  /** Target audience spesifik */
  targetAudience: string;
  /** Platform utama yang dipakai */
  primaryPlatform: string;
  /** Estimasi income bulan pertama */
  incomeEstimate: string;
  /** Kenapa kombinasi ini powerful */
  whyThisWorks: string;
}

// ============================================================================
// MARKET LABELS (for readable output)
// ============================================================================

const MARKET_LABELS: Record<string, string> = {
  health: "Health & Fitness",
  business: "Business & Entrepreneurship",
  education: "Education & Learning",
  finance: "Personal Finance & Investing",
  parenting: "Parenting & Family",
  gaming: "Gaming & Entertainment",
  ecommerce: "E-commerce & Produk",
  realestate: "Real Estate & Properti",
  creative: "Creative Arts & Design",
  tech: "Tech, SaaS & Software",
};

const WORK_STYLE_LABELS: Record<number, string> = {
  1: "tampil di kamera",
  2: "edit video tanpa muka",
  3: "menulis panjang & mendalam",
  4: "konten pendek & catchy",
  5: "riset & analisa data",
  6: "komunikasi & negosiasi",
  7: "kerja sendiri diam-diam",
};

const SKILL_LABELS: Record<number, string> = {
  0: "pemula",
  1: "writing/copywriting",
  2: "design/visual",
  3: "marketing/ads",
  4: "programming/tech",
  5: "video production",
  6: "sales/komunikasi",
};

const PLATFORM_LABELS: Record<string, string> = {
  tiktok_reels: "TikTok / Instagram Reels",
  youtube: "YouTube",
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
  marketplace: "Marketplace (Fiverr/Upwork)",
  own_website: "Website/Blog sendiri",
};

// ============================================================================
// SUB-SPECIALIZATION MATRIX
// ============================================================================

/**
 * Key: `${pathId}__${market}__${workStyleBucket}`
 * workStyleBucket: "visual" (1,2), "writer" (3), "short" (4), "analyst" (5), "people" (6), "solo" (7)
 */

function getWorkStyleBucket(workStyle: number): string {
  if (workStyle <= 2) return "visual";
  if (workStyle === 3) return "writer";
  if (workStyle === 4) return "short";
  if (workStyle === 5) return "analyst";
  if (workStyle === 6) return "people";
  return "solo";
}

// ────────────────────────────────────────────────────────────
// SPECIALIZATION DATABASE
// ────────────────────────────────────────────────────────────

const SPECIALIZATION_DB: Record<string, Partial<SubSpecialization>> = {
  // ── MICRO SERVICE × HEALTH ──
  "micro_service__health__writer": {
    title: "AI Health Copywriter",
    emoji: "💪✍️",
    description: "Jual jasa AI-powered copywriting khusus niche health & wellness. Tulis landing page supplement, email sequence untuk gym, dan sales copy produk fitness.",
    examples: ["Copywriting landing page supplement", "Email sequence gym membership", "Product description wellness brand", "Instagram caption untuk fitness coach"],
    tools: ["ChatGPT/Claude untuk drafting", "Grammarly untuk polish", "Hemingway App untuk readability"],
    targetAudience: "Gym owners, supplement brands, fitness coaches, wellness startups",
    incomeEstimate: "$100-400/bulan (3-5 client × $30-80/project)",
    whyThisWorks: "Health market selalu butuh copy yang menjual tapi tidak melanggar klaim kesehatan — skill ini rare dan dicari.",
  },
  "micro_service__health__visual": {
    title: "AI Fitness Visual Content Creator",
    emoji: "💪🎥",
    description: "Buat konten visual (thumbnail, cover, social media post) untuk brand fitness & wellness menggunakan AI tools.",
    examples: ["Thumbnail YouTube fitness", "Social media carousel workout", "Before/after graphic template", "Infographic nutrisi"],
    tools: ["Canva Pro", "Midjourney/DALL-E untuk visual", "CapCut untuk video edit"],
    targetAudience: "Fitness influencer, gym chains, supplement e-commerce",
    incomeEstimate: "$150-500/bulan (5-10 client × $20-50/deliverable)",
    whyThisWorks: "Fitness content butuh visual yang menarik dan konsisten — kebanyakan coach tidak punya waktu untuk ini.",
  },
  "micro_service__health__solo": {
    title: "AI Health Content Backend Operator",
    emoji: "💪🔧",
    description: "Jadi 'ghost operator' untuk brand wellness — handle SEO, email automation, dan content pipeline menggunakan AI tanpa perlu tampil.",
    examples: ["SEO blog post untuk wellness brand", "Email automation setup", "Content repurposing pipeline", "Keyword research report"],
    tools: ["ChatGPT/Claude", "Ahrefs/Ubersuggest gratis", "Mailchimp free tier", "Google Search Console"],
    targetAudience: "Wellness startup founders, health coaches yang sibuk, clinic marketing managers",
    incomeEstimate: "$200-600/bulan (2-3 retainer client × $100-200/bulan)",
    whyThisWorks: "Brand health butuh consistent backend content tapi jarang punya in-house team — kamu jadi invisible engine mereka.",
  },
  "micro_service__health__analyst": {
    title: "AI Health Market Research Analyst",
    emoji: "💪📊",
    description: "Jual jasa riset market & competitive analysis untuk brand kesehatan. AI bantu proses data, kamu deliver insight yang actionable.",
    examples: ["Competitor analysis report", "Market trend brief bulanan", "Customer persona research", "Pricing strategy analysis"],
    tools: ["ChatGPT/Claude untuk analisis", "Google Trends", "SimilarWeb free", "Google Sheets"],
    targetAudience: "Health startup founders, supplement brands, wellness franchise",
    incomeEstimate: "$200-500/bulan (2-4 report × $75-150/report)",
    whyThisWorks: "Startup health perlu data-driven decisions tapi tidak mampu hire full-time analyst — kamu jadi fractional analyst mereka.",
  },

  // ── MICRO SERVICE × BUSINESS ──
  "micro_service__business__writer": {
    title: "AI Business Proposal & Pitch Writer",
    emoji: "💼✍️",
    description: "Spesialis menulis proposal bisnis, pitch deck copy, dan presentasi yang menjual menggunakan AI sebagai backbone.",
    examples: ["Business proposal writing", "Pitch deck copy", "Company profile creation", "Executive summary report"],
    tools: ["ChatGPT/Claude", "Beautiful.ai untuk presentasi", "Google Docs"],
    targetAudience: "Startup founders, SME owners, freelance consultants",
    incomeEstimate: "$200-600/bulan (3-5 proposal × $50-120/proposal)",
    whyThisWorks: "Banyak entrepreneur yang punya ide bagus tapi tidak bisa menuangkannya ke dokumen yang meyakinkan.",
  },
  "micro_service__business__people": {
    title: "AI-Assisted Business Development Rep",
    emoji: "💼🤝",
    description: "Jadi BD freelance — gunakan AI untuk riset leads, draft outreach, dan prep sales meeting. Kamu fokus ke komunikasi & closing.",
    examples: ["Lead research & profiling", "Cold email sequence writing", "Meeting prep brief", "Follow-up message crafting"],
    tools: ["ChatGPT/Claude untuk riset & drafting", "LinkedIn Sales Navigator (free trial)", "Hunter.io"],
    targetAudience: "B2B startups, agency kecil, SaaS companies yang butuh pipeline",
    incomeEstimate: "$300-800/bulan (retainer + commission model)",
    whyThisWorks: "BD butuh skill komunikasi (kamu punya) + research yang cepat (AI handle). Kombinasi langka.",
  },
  "micro_service__business__solo": {
    title: "AI Backend Operations Specialist",
    emoji: "💼🔧",
    description: "Handle operasional bisnis behind-the-scene: data entry otomatis, report generation, workflow automation — semua di-power AI.",
    examples: ["Automated reporting", "Data cleanup & organization", "SOP documentation", "Process automation setup"],
    tools: ["ChatGPT/Claude", "Google Sheets + Apps Script", "Zapier free tier", "Notion"],
    targetAudience: "Small business owners, startup ops managers, solopreneurs",
    incomeEstimate: "$200-500/bulan (2-3 retainer × $80-180/bulan)",
    whyThisWorks: "Setiap bisnis punya operational debt — kamu solve it silently dengan AI tanpa perlu meeting banyak.",
  },

  // ── MICRO SERVICE × TECH ──
  "micro_service__tech__solo": {
    title: "AI Code Assistant & Automation Builder",
    emoji: "💻🔧",
    description: "Build micro-automations, scripts, dan simple apps menggunakan AI coding assistants. Jual per project tanpa perlu jadi full developer.",
    examples: ["Google Sheets automation script", "Discord/Telegram bot", "Web scraping tool", "API integration script"],
    tools: ["Claude/ChatGPT Artifacts", "GitHub Copilot", "Replit", "Vercel"],
    targetAudience: "Non-tech founders, small business owners, marketing teams",
    incomeEstimate: "$300-800/bulan (3-5 projects × $100-200/project)",
    whyThisWorks: "Banyak bisnis butuh automation kecil tapi tidak mau hire developer full — sweet spot untuk AI-assisted work.",
  },
  "micro_service__tech__analyst": {
    title: "AI Data Analytics Freelancer",
    emoji: "💻📊",
    description: "Jual jasa data analysis untuk startup & SME. AI bantu process data, kamu deliver dashboard dan insight yang actionable.",
    examples: ["Monthly analytics dashboard", "Customer behavior analysis", "A/B test report", "KPI tracking setup"],
    tools: ["ChatGPT/Claude untuk analysis", "Google Sheets/Looker Studio", "Python + pandas (AI-assisted)"],
    targetAudience: "SaaS startups, e-commerce brands, marketing agencies",
    incomeEstimate: "$400-1000/bulan (2-4 retainer clients)",
    whyThisWorks: "Data is abundant tapi insight is scarce. Kamu jembatani gap itu dengan AI-powered analysis yang cepat.",
  },

  // ── MICRO SERVICE × ECOMMERCE ──
  "micro_service__ecommerce__writer": {
    title: "AI E-commerce Copywriter",
    emoji: "🛍️✍️",
    description: "Spesialis copy produk e-commerce: deskripsi Shopee/Tokopedia, email marketing toko online, dan landing page product launch.",
    examples: ["Bulk product description writing", "Email campaign untuk toko online", "Product launch copy", "Review response templates"],
    tools: ["ChatGPT/Claude", "Shopee/Tokopedia seller center", "Canva untuk visual copy"],
    targetAudience: "Online shop owners, dropshippers, brand D2C",
    incomeEstimate: "$100-400/bulan (bisa per bulk: 50 deskripsi produk = $50-100)",
    whyThisWorks: "Ratusan ribu seller butuh copy yang bagus tapi tidak mau nulis sendiri — volume market-nya besar.",
  },
  "micro_service__ecommerce__visual": {
    title: "AI Product Visual Creator",
    emoji: "🛍️🎥",
    description: "Buat product photo edit, video demo produk, dan visual content untuk e-commerce brands menggunakan AI tools.",
    examples: ["Product photo enhancement", "Short video demo produk", "Carousel produk Instagram", "A+ content Amazon/Tokopedia"],
    tools: ["Canva", "CapCut", "Remove.bg", "Midjourney untuk lifestyle mockup"],
    targetAudience: "E-commerce sellers, dropshippers, brand owners",
    incomeEstimate: "$200-600/bulan (5-10 client × $30-60/deliverable set)",
    whyThisWorks: "Visual quality = conversion rate. Seller tahu ini tapi tidak punya skill visual — kamu solve pakai AI tools.",
  },

  // ── NICHE CONTENT × HEALTH ──
  "niche_content__health__visual": {
    title: "Fitness Short-Form Video Creator",
    emoji: "🏋️🎥",
    description: "Build micro-audience di TikTok/Reels dengan konten fitness pendek. Monetisasi via affiliate supplement, coaching referral, atau brand deals.",
    examples: ["30-detik workout tips", "Nutrisi myth-busting shorts", "Supplement review reels", "Transformation storytelling"],
    tools: ["CapCut", "Canva", "ChatGPT untuk scripting", "TikTok Creator Studio"],
    targetAudience: "Audience 18-35 yang interest fitness & wellness",
    incomeEstimate: "$50-300/bulan (affiliate + micro brand deals)",
    whyThisWorks: "Health content di short-form punya engagement tinggi dan lifetime value panjang — evergreen niche.",
  },
  "niche_content__health__writer": {
    title: "Health & Wellness Newsletter Writer",
    emoji: "🏋️📝",
    description: "Bangun niche newsletter di topik kesehatan spesifik (misal: sleep optimization, meal prep). Monetisasi via sponsor & affiliate.",
    examples: ["Weekly wellness digest", "Meal prep guide newsletter", "Sleep science tips", "Mental health micro-education"],
    tools: ["Beehiiv/Substack", "ChatGPT/Claude untuk drafting", "Canva untuk visual"],
    targetAudience: "Health-conscious professionals 25-45",
    incomeEstimate: "$50-200/bulan (setelah 500+ subscriber)",
    whyThisWorks: "Newsletter health punya open rate tinggi karena orang genuinely peduli kesehatannya — bukan sekadar scroll.",
  },

  // ── NICHE CONTENT × FINANCE ──
  "niche_content__finance__writer": {
    title: "Personal Finance Micro-Educator",
    emoji: "💰📝",
    description: "Buat konten edukasi keuangan di newsletter/blog/Twitter. Niche sempit: misal 'keuangan untuk pekerja remote' atau 'investing for Gen Z'.",
    examples: ["Twitter thread budgeting tips", "Newsletter keuangan mingguan", "Blog post investing 101", "Infographic financial literacy"],
    tools: ["Substack/Beehiiv", "ChatGPT/Claude", "Canva", "Twitter/X"],
    targetAudience: "Young professionals 22-35 yang baru mulai manage keuangan",
    incomeEstimate: "$100-400/bulan (affiliate fintech + sponsor)",
    whyThisWorks: "Financial literacy content punya monetisasi kuat lewat affiliate fintech (Bibit, Bareksa, dll) dengan commission tinggi.",
  },
  "niche_content__finance__short": {
    title: "Finance TikTok Micro-Creator",
    emoji: "💰📱",
    description: "Konten pendek tentang uang, investasi, dan financial tips di TikTok/Reels. Bukan financial advisor — tapi relatable money content.",
    examples: ["'Gaji 5 juta tapi bisa nabung' series", "Reels perbandingan produk finansial", "Story time financial mistakes", "Budget challenge content"],
    tools: ["CapCut", "TikTok", "ChatGPT untuk script", "Canva"],
    targetAudience: "Gen Z & young millennials curious about money",
    incomeEstimate: "$50-300/bulan (affiliate fintech + creator fund)",
    whyThisWorks: "Finance content di TikTok masih growing pesat, dan affiliate commission produk finansial tinggi.",
  },

  // ── NICHE CONTENT × EDUCATION ──
  "niche_content__education__writer": {
    title: "AI-Powered Edu Newsletter Creator",
    emoji: "📚📝",
    description: "Newsletter niche pendidikan: tips belajar, study hacks, atau edukasi skill spesifik. Monetisasi via course affiliate & sponsor.",
    examples: ["Weekly study tips digest", "AI tools untuk belajar", "Career skill roadmap", "Productivity for students"],
    tools: ["Substack/Beehiiv", "ChatGPT/Claude", "Notion", "Canva"],
    targetAudience: "Pelajar, mahasiswa, lifelong learners 17-30",
    incomeEstimate: "$50-250/bulan (affiliate course platforms + sponsor)",
    whyThisWorks: "Education niche punya trust tinggi dan audience yang loyal — plus affiliate commission dari platform kursus lumayan.",
  },
  "niche_content__education__visual": {
    title: "Educational Short Video Creator",
    emoji: "📚🎥",
    description: "Bikin video edukasi pendek yang viral di TikTok/YouTube Shorts. 'Did you know' + 'How to' format.",
    examples: ["Fun fact educational reels", "Explainer 60-detik", "Study with me content", "Tool/app tutorial shorts"],
    tools: ["CapCut", "Canva", "TikTok/YouTube Shorts", "ChatGPT untuk riset"],
    targetAudience: "Students & curious minds 15-30",
    incomeEstimate: "$100-400/bulan (AdSense + course affiliate)",
    whyThisWorks: "Educational short-form punya retention rate tinggi dan algorithm-friendly — gampang viral di niche ini.",
  },

  // ── NICHE CONTENT × GAMING ──
  "niche_content__gaming__visual": {
    title: "Gaming Shorts & Clips Creator",
    emoji: "🎮🎥",
    description: "Create gaming highlights, tips, dan reaction content di YouTube Shorts/TikTok. Niche di 1 game atau genre spesifik.",
    examples: ["Game highlights compilation", "Tips & tricks shorts", "Patch update reactions", "Ranking/tier list content"],
    tools: ["OBS Studio", "CapCut", "Canva untuk thumbnail", "ChatGPT untuk script"],
    targetAudience: "Gamers 15-30 di platform specific game community",
    incomeEstimate: "$50-300/bulan (AdSense + affiliate gaming gear)",
    whyThisWorks: "Gaming audience sangat engaged dan loyal ke creator yang konsisten di niche game tertentu.",
  },
  "niche_content__gaming__short": {
    title: "Gaming Meme & Viral Content Creator",
    emoji: "🎮📱",
    description: "Bikin meme gaming, viral clips, dan relatable gamer content. Fokus entertainment + community building.",
    examples: ["Gaming meme compilations", "Relatable gamer situations", "Game comparison content", "Hot take / unpopular opinion"],
    tools: ["CapCut", "Meme generators", "TikTok", "ChatGPT untuk ide"],
    targetAudience: "Casual & hardcore gamers di social media",
    incomeEstimate: "$50-200/bulan (creator fund + gaming affiliate)",
    whyThisWorks: "Gaming meme content punya virality tinggi dan low production effort — perfect untuk waktu terbatas.",
  },

  // ── FREELANCE UPGRADE × TECH ──
  "freelance_upgrade__tech__solo": {
    title: "AI-Boosted Full-Stack Developer",
    emoji: "🚀💻",
    description: "Upgrade skill dev kamu dengan AI coding assistants. Deliver project 2x lebih cepat, charge 2x lebih mahal. Focus ke web apps & automations.",
    examples: ["Full-stack web app (2x faster)", "API integration project", "SaaS MVP development", "Legacy code refactoring"],
    tools: ["Claude/ChatGPT + Cursor IDE", "GitHub Copilot", "Vercel/Railway", "Supabase"],
    targetAudience: "Startup founders, SME digital transformation, SaaS companies",
    incomeEstimate: "$500-2000/bulan (1-3 projects)",
    whyThisWorks: "AI coding assistants membuat kamu 2-3x lebih produktif — artinya margin naik drastis tanpa kerja lebih lama.",
  },
  "freelance_upgrade__tech__analyst": {
    title: "AI Data & Analytics Consultant",
    emoji: "🚀📊",
    description: "Upgrade dari data analyst biasa jadi AI-augmented consultant. Deliver insight lebih cepat, visualisasi lebih bagus, rekomendasi lebih tajam.",
    examples: ["AI-powered market analysis", "Automated dashboard building", "Predictive analytics report", "Data strategy consulting"],
    tools: ["Python + AI assistants", "Looker Studio", "ChatGPT/Claude untuk analysis", "Tableau Public"],
    targetAudience: "Startups, marketing agencies, e-commerce brands",
    incomeEstimate: "$600-1500/bulan (consulting retainer model)",
    whyThisWorks: "Data consultant yang pakai AI bisa deliver 5x lebih cepat dari yang manual — client bayar premium untuk kecepatan.",
  },

  // ── FREELANCE UPGRADE × CREATIVE ──
  "freelance_upgrade__creative__visual": {
    title: "AI-Augmented Visual Designer",
    emoji: "🚀🎨",
    description: "Level up design skill dengan AI generative tools. Dari designer biasa jadi designer yang bisa deliver branding package dalam hitungan jam.",
    examples: ["Brand identity package (AI-assisted)", "Social media template set", "UI/UX prototype rapid", "Marketing collateral suite"],
    tools: ["Midjourney/DALL-E", "Figma", "Canva Pro", "Adobe Firefly"],
    targetAudience: "Startups, personal brands, small agencies",
    incomeEstimate: "$400-1200/bulan (3-5 projects)",
    whyThisWorks: "AI generative tools membuat exploration fase jadi instan — client dapat lebih banyak opsi, kamu kerja lebih cepat.",
  },
  "freelance_upgrade__creative__writer": {
    title: "AI Content Strategy Consultant",
    emoji: "🚀✍️",
    description: "Bukan sekadar penulis — jadi content strategist yang pakai AI untuk riset, planning, dan production. Deliver content system, bukan content piece.",
    examples: ["Content strategy roadmap", "Brand voice guidelines", "Content calendar 3 bulan", "Content audit & recommendation"],
    tools: ["ChatGPT/Claude", "Notion", "Ahrefs/SEMrush", "Google Analytics"],
    targetAudience: "Brand managers, startup CMOs, agency creative directors",
    incomeEstimate: "$500-1500/bulan (strategy retainer model)",
    whyThisWorks: "Naik dari penulis jadi strategist = 3-5x rate increase. AI handle production, kamu fokus ke thinking.",
  },

  // ── FREELANCE UPGRADE × BUSINESS ──
  "freelance_upgrade__business__people": {
    title: "AI-Powered Sales & BD Consultant",
    emoji: "🚀🤝",
    description: "Upgrade dari salesperson biasa jadi AI-enhanced BD consultant. AI handle research & prep, kamu fokus ke relationship & closing.",
    examples: ["Sales funnel optimization", "Lead gen system setup", "Pitch deck + strategy", "Client onboarding automation"],
    tools: ["ChatGPT/Claude", "HubSpot CRM free", "LinkedIn Sales Navigator", "Loom"],
    targetAudience: "B2B companies, SaaS startups, consulting firms",
    incomeEstimate: "$500-2000/bulan (retainer + performance bonus)",
    whyThisWorks: "BD + AI = super power. Kamu bisa prep 10 meetings in time yang biasanya cuma buat 2. Closing rate naik.",
  },

  // ── DIGITAL PRODUCT × EDUCATION ──
  "digital_product__education__writer": {
    title: "AI-Crafted Online Course Creator",
    emoji: "📦📚",
    description: "Buat dan jual online course di niche edukasi kamu. AI bantu bikin curriculum, script, dan material — kamu fokus ke expertise & packaging.",
    examples: ["Mini course (5 video × 10 menit)", "E-book/workbook digital", "Template pack + tutorial", "Membership community"],
    tools: ["Gumroad/Skillshare", "ChatGPT/Claude", "Canva", "Loom/OBS untuk recording"],
    targetAudience: "Lifelong learners, career switchers, skill builders",
    incomeEstimate: "$200-800/bulan (setelah launch + marketing)",
    whyThisWorks: "Digital product = passive income setelah creation. AI mempercepat creation 5x, jadi ROI waktu sangat tinggi.",
  },
  "digital_product__education__solo": {
    title: "AI Template & Tool Kit Builder",
    emoji: "📦🔧",
    description: "Buat dan jual template, toolkit, dan resource digital untuk niche edukasi. Notion template, spreadsheet, checklist — all AI-assisted.",
    examples: ["Notion study system template", "Career planning spreadsheet", "Learning roadmap template pack", "Productivity toolkit bundle"],
    tools: ["Notion", "Google Sheets", "Canva", "Gumroad/Payhip"],
    targetAudience: "Students, professionals, productivity enthusiasts",
    incomeEstimate: "$100-500/bulan (template sales, priced $5-30)",
    whyThisWorks: "Template bisnis punya cost production sangat rendah + bisa dijual infinite copies. AI bantu bikin variasi cepat.",
  },

  // ── DIGITAL PRODUCT × FINANCE ──
  "digital_product__finance__analyst": {
    title: "Financial Planning Tool Creator",
    emoji: "📦💰",
    description: "Buat dan jual spreadsheet/tool perencanaan keuangan. Budget planner, investment tracker, tax calculator — all AI-designed.",
    examples: ["Personal budget spreadsheet", "Investment portfolio tracker", "Side income calculator", "Tax planning workbook"],
    tools: ["Google Sheets + Apps Script", "ChatGPT/Claude", "Gumroad", "Canva untuk mockup"],
    targetAudience: "Young professionals managing their first finances",
    incomeEstimate: "$100-400/bulan (tool sales at $5-20 each)",
    whyThisWorks: "Finance tools punya high perceived value dan repeat purchases. Audience aktif mencari solusi ini.",
  },

  // ── DIGITAL PRODUCT × BUSINESS ──
  "digital_product__business__writer": {
    title: "Business Template & SOP Creator",
    emoji: "📦💼",
    description: "Buat dan jual template bisnis: SOP, proposal template, business plan framework — semua AI-accelerated.",
    examples: ["Business plan template pack", "SOP library for startups", "Proposal template collection", "Meeting agenda & minutes templates"],
    tools: ["Notion/Google Docs", "ChatGPT/Claude", "Gumroad/Payhip", "Canva"],
    targetAudience: "Startup founders, small business owners, managers",
    incomeEstimate: "$200-600/bulan (B2B pricing = higher ticket)",
    whyThisWorks: "B2B templates bisa di-price premium ($20-50+) karena business value jelas — dan AI bikin creation super cepat.",
  },

  // ── ARBITRAGE × ECOMMERCE ──
  "arbitrage_skill__ecommerce__people": {
    title: "AI-Powered E-commerce Reseller",
    emoji: "⚡🛍️",
    description: "Gunakan AI untuk riset trending products, optimize listing, dan manage customer service. Arbitrase antara supplier & marketplace.",
    examples: ["Trending product research", "Optimized marketplace listing", "AI customer service template", "Pricing strategy automation"],
    tools: ["ChatGPT/Claude", "Shopee/Tokopedia seller tools", "Google Trends", "Canva untuk visual"],
    targetAudience: "Supplier products → marketplace buyers",
    incomeEstimate: "$200-800/bulan (margin per product × volume)",
    whyThisWorks: "AI membuat riset produk & listing optimization 10x lebih cepat — kamu bisa test lebih banyak produk.",
  },

  // ── ARBITRAGE × BUSINESS ──
  "arbitrage_skill__business__short": {
    title: "Lead Generation Arbitrage Specialist",
    emoji: "⚡💼",
    description: "Generate leads lewat konten pendek/ads, jual ke bisnis lokal. Kamu jadi middle-man antara attention & businesses.",
    examples: ["Facebook/IG ads untuk bisnis lokal", "Lead gen landing page", "Appointment setting service", "Google My Business optimization"],
    tools: ["Meta Ads Manager", "ChatGPT/Claude", "Carrd/Leadpages", "Google Sheets"],
    targetAudience: "Local businesses: restaurant, salon, clinic, gym",
    incomeEstimate: "$300-1000/bulan (per lead fee or monthly retainer)",
    whyThisWorks: "Bisnis lokal desperately need leads tapi tidak mengerti digital — kamu jembatani gap itu.",
  },

  // ── HIGH RISK × FINANCE ──
  "high_risk_speculative__finance__analyst": {
    title: "AI Trading Signal & Analysis Service",
    emoji: "🎰📊",
    description: "Buat analisis market & trading signals menggunakan AI. Jual sebagai subscription atau community membership. HIGH RISK tapi HIGH REWARD.",
    examples: ["Daily market analysis brief", "Trading signal subscription", "Portfolio review service", "Market sentiment report"],
    tools: ["ChatGPT/Claude untuk analysis", "TradingView", "Notion/Telegram untuk delivery"],
    targetAudience: "Retail traders & crypto enthusiasts",
    incomeEstimate: "$200-1000/bulan (subscription model, high risk)",
    whyThisWorks: "Trading community membayar premium untuk analysis yang cepat & actionable. Tapi risk tinggi — perlu disclaimer.",
  },
  "high_risk_speculative__finance__short": {
    title: "Finance Content Speculator",
    emoji: "🎰📱",
    description: "Bikin konten finance viral di TikTok/YouTube → monetize lewat courses & affiliate aggressively. Go big or go home.",
    examples: ["Viral money hacks content", "Investment comparison reels", "Financial hot takes", "Wealth building series"],
    tools: ["CapCut", "TikTok/YouTube", "ChatGPT untuk script", "Gumroad untuk course"],
    targetAudience: "Young adults interested in wealth building",
    incomeEstimate: "$100-1000/bulan (highly variable)",
    whyThisWorks: "Finance content di social media punya monetization path yang kuat tapi competitive — butuh bold approach.",
  },

  // ── HIGH RISK × TECH ──
  "high_risk_speculative__tech__solo": {
    title: "AI Micro-SaaS Builder",
    emoji: "🎰💻",
    description: "Build micro-SaaS tools pakai AI coding assistants. Launch fast, validate fast, pivot fast. 1 dari 5 mungkin berhasil.",
    examples: ["Simple Chrome extension", "API wrapper tool", "Niche calculator/generator", "Workflow automation tool"],
    tools: ["Claude/ChatGPT + Cursor IDE", "Vercel", "Stripe", "Product Hunt"],
    targetAudience: "Specific niche users with a repeating pain point",
    incomeEstimate: "$0-500/bulan (per tool, highly speculative)",
    whyThisWorks: "AI membuat building MVP jadi 10x lebih cepat. Dengan iteration cepat, 1 dari 5 tools bisa jadi revenue generator.",
  },
};

// ============================================================================
// SPECIALIZATION ENGINE
// ============================================================================

/**
 * Generate sub-specialization based on profile combination.
 * Falls back to a dynamically generated spec if no exact match.
 */
export function generateSubSpecialization(
  pathId: PathId,
  scores: ProfileScores,
  answers: Record<ProfilingQuestionId, string>
): SubSpecialization {
  const market = answers.interest_market || "business";
  const workBucket = getWorkStyleBucket(scores.work_style);
  const platform = answers.preferred_platform || "marketplace";

  // Try exact match first
  const exactKey = `${pathId}__${market}__${workBucket}`;
  const exact = SPECIALIZATION_DB[exactKey];

  if (exact) {
    return {
      title: exact.title || generateTitle(pathId, market, workBucket),
      emoji: exact.emoji || "🎯",
      description: exact.description || "",
      examples: exact.examples || [],
      tools: exact.tools || [],
      targetAudience: exact.targetAudience || "",
      primaryPlatform: PLATFORM_LABELS[platform] || platform,
      incomeEstimate: exact.incomeEstimate || "$50-300/bulan",
      whyThisWorks: exact.whyThisWorks || "",
    };
  }

  // Fallback: generate a reasonable spec from components
  return generateFallbackSpec(pathId, market, workBucket, scores, platform);
}

/**
 * Generate a dynamic title when no exact match exists
 */
function generateTitle(pathId: PathId, market: string, workBucket: string): string {
  const pathTitles: Record<string, string> = {
    micro_service: "AI Micro Service",
    niche_content: "Niche Content Creator",
    freelance_upgrade: "AI-Boosted Freelancer",
    arbitrage_skill: "Skill Arbitrage",
    digital_product: "Digital Product Builder",
    high_risk_speculative: "Speculative Builder",
  };

  const bucketSuffix: Record<string, string> = {
    visual: "Visual",
    writer: "Writer",
    short: "Short-Form",
    analyst: "Analyst",
    people: "Connector",
    solo: "Operator",
  };

  const marketLabel = MARKET_LABELS[market] || market;
  return `${pathTitles[pathId] || "AI"} ${bucketSuffix[workBucket] || ""} — ${marketLabel}`;
}

/**
 * Generate fallback spec when no exact match in DB
 */
function generateFallbackSpec(
  pathId: PathId,
  market: string,
  workBucket: string,
  scores: ProfileScores,
  platform: string
): SubSpecialization {
  const marketLabel = MARKET_LABELS[market] || market;
  const workLabel = WORK_STYLE_LABELS[scores.work_style] || "general";
  const skillLabel = SKILL_LABELS[scores.skill_primary] || "pemula";
  const platformLabel = PLATFORM_LABELS[platform] || platform;

  const title = generateTitle(pathId, market, workBucket);

  // Dynamic description based on path type
  const pathDescriptions: Record<string, string> = {
    micro_service: `Jual jasa AI-powered di niche ${marketLabel} dengan gaya kerja ${workLabel}. Fokus ke deliverable kecil tapi bernilai tinggi — langsung dibayar per project.`,
    niche_content: `Build micro-audience di ${marketLabel} lewat konten ${workBucket === "visual" ? "visual" : workBucket === "writer" ? "tulisan" : "pendek"} di ${platformLabel}. Monetisasi via affiliate, sponsor, atau authority.`,
    freelance_upgrade: `Level up skill ${skillLabel} kamu dengan AI tools. Deliver project di niche ${marketLabel} 2-3x lebih cepat, charge 2-3x lebih mahal.`,
    arbitrage_skill: `Jadi middle-man di market ${marketLabel}. Gunakan AI untuk riset, content, dan outreach — kamu fokus ke eksekusi dan koneksi.`,
    digital_product: `Buat dan jual produk digital di niche ${marketLabel}: template, course, atau toolkit. AI accelerate creation, kamu fokus ke packaging dan marketing.`,
    high_risk_speculative: `Go big di ${marketLabel} — build something ambitious dengan AI tools. High risk, tapi kalau berhasil, high reward.`,
  };

  // Dynamic examples
  const examplesByBucket: Record<string, string[]> = {
    visual: [`Video content untuk ${marketLabel}`, `Visual design package`, `Thumbnail/banner creation`, `Social media visual kit`],
    writer: [`Copywriting untuk ${marketLabel} brands`, `Newsletter/blog content`, `Proposal/pitch writing`, `Content strategy document`],
    short: [`Short-form content ${marketLabel}`, `TikTok/Reels series`, `Viral hook creation`, `Trend-jacking content`],
    analyst: [`Market analysis ${marketLabel}`, `Data-driven report`, `Competitor research`, `Strategy recommendation`],
    people: [`Outreach & BD untuk ${marketLabel}`, `Partnership brokering`, `Client acquisition`, `Community management`],
    solo: [`Backend operations ${marketLabel}`, `Automation setup`, `System optimization`, `Silent execution service`],
  };

  return {
    title,
    emoji: "🎯",
    description: pathDescriptions[pathId] || `AI-powered service di ${marketLabel}`,
    examples: examplesByBucket[workBucket] || [`Service untuk ${marketLabel}`],
    tools: ["ChatGPT/Claude", "Canva", "Google Workspace"],
    targetAudience: `Bisnis dan individu di market ${marketLabel}`,
    primaryPlatform: platformLabel,
    incomeEstimate: scores.time >= 3 ? "$200-600/bulan" : "$50-300/bulan",
    whyThisWorks: `Kombinasi skill ${skillLabel} + gaya kerja ${workLabel} + market ${marketLabel} memberikan unique positioning yang jarang ada di market.`,
  };
}

/**
 * Get readable market label
 */
export function getMarketLabel(market: string): string {
  return MARKET_LABELS[market] || market;
}

/**
 * Get readable work style label
 */
export function getWorkStyleLabel(workStyle: number): string {
  return WORK_STYLE_LABELS[workStyle] || "general";
}

/**
 * Get readable platform label
 */
export function getPlatformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] || platform;
}
