# 🗺️ IntentAI — Full Development Roadmap

> Roadmap ini di-mapping langsung dari **NEW_KONSEP.md** (1453 baris, 20+ section).
> Setiap phase merujuk section spesifik di konsep.
> Status: ✅ Done | 🔨 In Progress | ⏳ Queued | 🔮 Future

---

## PHASE 1 — Platform Foundation ✅
**Konsep Section: I (Posisi Platform)**

- [x] Project setup (React + TypeScript + Vite + Tailwind)
- [x] Supabase integration (auth, database, RLS)
- [x] Google OAuth login
- [x] Base routing (React Router)
- [x] shadcn/ui component library
- [x] Deploy setup (Vite build)

---

## PHASE 2 — Landing Page (Public) ✅
**Konsep Section: II.1 (Landing)**

- [x] HeroSection — "Temukan jalur AI yang cocok untuk kamu" + single CTA
- [x] StatsSection — 6 jalur, 30 hari roadmap, metrics
- [x] FeaturesSection — Profiling Cerdas, Jalur Terkurasi, Roadmap 30 Hari
- [x] HowItWorks (ex-GeneratorDemo) — 4-step proses
- [x] PathPreview (ex-FeaturedPrompts) — 6 path cards preview
- [x] TestimonialsSection — Indonesian testimonials
- [x] NewsletterSection — "Tips Side Income Mingguan"
- [x] Footer — IntentAI branding
- [x] Navbar — brand, responsive, auth-aware
- [x] Meta tags (index.html)

---

## PHASE 3 — Onboarding Profiling (Core UX) ✅
**Konsep Section: II.2 (Onboarding Profiling)**

- [x] Pertanyaan profiling 1 per screen, button click
- [x] Progress bar
- [x] Back button
- [x] Auto-advance after selection
- [x] ProfilingFlow component
- [x] **v1**: 6 pertanyaan (time, capital, target_speed, comfort, risk, skill)
- [x] **v2 UPGRADE**: 10 pertanyaan — market-driven deep profiling
  - [x] work_style (7 opsi: video face, video edit, longform, shortform, research, people, silent)
  - [x] skill_primary (7 opsi: none, writing, design, marketing, programming, video prod, sales)
  - [x] skill_secondary (6 opsi: none, basic write, basic design, basic data, social media, english)
  - [x] interest_market (10 opsi: health, business, education, finance, parenting, gaming, ecommerce, realestate, creative, tech)
  - [x] audience_access (4 opsi: nol, <500, 500-5K, >5K)
  - [x] daily_routine (4 opsi: pagi, siang, malam, fleksibel)
  - [x] Every option has `tag` for AI context enrichment
  - [x] `answerTags` saved to DB for AI use

---

## PHASE 4 — Constraint Engine (Rule-Based) ✅
**Konsep Section: III (Workflow Engine), XII-B (Constraint Engine), XII-C (Path Scoring)**

- [x] `profilingConfig.ts` — answersToScores(), classifySegment()
- [x] 7 segments: zero_capital_builder, low_capital_experimenter, skill_leverager, risk_taker, long_term_builder, audience_builder, service_executor
- [x] CONSTRAINT_MATRIX — hard elimination rules
- [x] eliminatePaths() — constraint-based elimination
- [x] PATH_WEIGHTS — weighted scoring matrix (v2: includes work_style & market bonuses)
- [x] scorePaths() — weighted scoring + work_style bonus + market interest bonus + speed alignment
- [x] runProfilingEngine() — full pipeline, returns `answerTags` for AI
- [x] extractAnswerTags() — rich labels for AI context

---

## PHASE 5 — Curated Path System ✅
**Konsep Section: XIII-XIV (6 Paths Detailed)**

- [x] `pathTemplates.ts` — 6 full PathTemplate objects
- [x] micro_service — Micro Service Seller
- [x] niche_content — Niche Content Monetizer
- [x] freelance_upgrade — Freelance AI Upgrade
- [x] arbitrage_skill — Skill Arbitrage
- [x] digital_product — Digital Product Builder
- [x] high_risk_speculative — High Risk Speculative
- [x] Each path: weeklyPlan (4 weeks × 4 tasks), examples, avoid, moneySource, riskIfFail, timeToTest, idealFor

---

## PHASE 6 — Decision Screen (Path Result) ✅
**Konsep Section: II.3 (Decision Screen), XV (Path Display Strategy)**

- [x] PathResult component — 1 primary + 1 alternative
- [x] "Yang harus kamu abaikan" (eliminated paths)
- [x] Key metrics: money source, waktu test, risiko
- [x] 30-day timeline preview
- [x] CTA "Mulai Jalur Ini"
- [x] Psychological safety warning

---

## PHASE 7 — Auth-Gated Features ✅
**Konsep Section: II (implicit — personalized = requires auth)**

- [x] ProtectedRoute component
- [x] `/onboarding` requires login
- [x] `/path/:pathId` requires login
- [x] `/dashboard` requires login
- [x] Redirect to login with return path

---

## PHASE 8 — Database Schema (User Profiling) ✅
**Konsep Section: VI (Backend Data Architecture), XII-I (Data Structure Expansion)**

- [x] `user_profiles_intent` table — answers, scores, segment, paths, AI content
- [x] `user_path_progress` table — per-task completion tracking
- [x] `weekly_checkpoints` table — weekly self-report + AI feedback
- [x] `ai_personalization_log` table — AI call audit trail
- [x] RLS policies (users CRUD own data only)
- [x] Indexes on user_id, profile_id, active flag
- [x] Migration applied to live Supabase
- [x] Supabase types updated (`types.ts`)

---

## PHASE 9 — Profile Service Layer (Supabase CRUD) ✅
**Konsep Section: VI, XII-I**

- [x] `profileService.ts` — full CRUD service
- [x] saveProfilingResult() — save to Supabase + deactivate old
- [x] initializeTaskProgress() — create task rows from template
- [x] loadActiveProfile() — get user's active profile
- [x] loadTaskProgress() — get per-task completion state
- [x] toggleTaskCompletion() — update task in Supabase
- [x] resetProfile() — deactivate current profile

---

## PHASE 10 — AI Personalization Layer ✅
**Konsep Section: V (AI Layer Design), XII-D (AI Personalization Layer), XII-E (Output Structure)**

- [x] generateAIWhyText() — Claude call with 10-dimension structured context → tajam, spesifik "kenapa jalur ini cocok"
- [x] generateAICustomTasks() — Claude call → AI-personalized weekly tasks with niche/tool/platform specificity
- [x] generateAINicheSuggestion() — Claude call → super-specific niche with 3 langkah pertama + income estimate
- [x] All 3 AI functions receive STRUCTURED state (10 scores + tags + decoded labels)
- [x] All 3 logged to ai_personalization_log
- [x] Processing time tracked
- [x] Fallback to template if AI fails
- [x] **v2 UPGRADE**: AI prompts now include work_style, skill_primary/secondary, interest_market, audience_access, daily_routine for much sharper output

---

## PHASE 11 — Onboarding Integration (Supabase + AI) ✅
**Konsep Section: XI (Full System Flow)**

- [x] Onboarding.tsx refactored: profiling → Supabase save → AI calls → result
- [x] "Processing" phase with animation (AI analyzing profile)
- [x] Parallel AI calls (why text + custom tasks + niche suggestion)
- [x] AI why text displayed in PathResult
- [x] AI niche suggestion displayed in PathResult
- [x] No more localStorage for profile data

---

## PHASE 12 — PathDetail Integration (Supabase) ✅
**Konsep Section: II.4 (Dashboard), VII (Progress Engine)**

- [x] PathDetail reads tasks from Supabase (AI-personalized)
- [x] Fallback to template if no Supabase data
- [x] Task completion saves to Supabase
- [x] Shows AI why text and niche suggestion
- [x] "AI-Personalized" badge on roadmap
- [x] Links to dashboard

---

## PHASE 13 — Dashboard Integration (Supabase + Checkpoint) ✅
**Konsep Section: II.4 (Dashboard), XII-G (Progress Adaptation), XII-H**

- [x] Dashboard reads from Supabase (not localStorage)
- [x] Shows AI insights (why text, niche)
- [x] Current week tasks from Supabase
- [x] Weekly checkpoint UI: status (on_track/stuck/ahead), stuck area, market response
- [x] Submit checkpoint → AI generates feedback
- [x] saveWeeklyCheckpoint() with AI feedback generation

---

## PHASE 14 — Pricing Page (New Tiers) ✅
**Konsep Section: Revenue Model (Freemium 3-tier)**

- [x] Free Explorer (Rp 0) — profiling, 1 jalur, roadmap template, 1x re-profiling
- [x] Pro Builder (Rp 299K/bulan) — AI personalized tasks, AI niche, weekly AI feedback, unlimited re-profiling
- [x] Advanced Accelerator (Rp 599K/bulan) — multi-path, market signals, dynamic adjustment, AI pivoting
- [x] Annual toggle (15% discount)
- [x] Feature comparison table
- [x] FAQ in Indonesian
- [x] Trust signals

---

## PHASE 15 — Progress Adaptation Engine ✅
**Konsep Section: VII (Progress Engine), XII-F (Progress Adaptation), XII-G**

- [x] Auto-advance `current_week` based on task completion
- [x] If completion rate < 50% at checkpoint → suggest simplification
- [x] If completion rate > 90% → suggest acceleration
- [x] If stuck 2 weeks → suggest niche pivot
- [x] `system_adjustment` field in weekly_checkpoints: 'continue', 'simplify', 'accelerate', 'adjust_niche', 'pivot_path'
- [x] AI considers previous checkpoints when generating feedback

---

## PHASE 16 — Freemium Gating ✅
**Konsep Section: Revenue Model**

- [x] Free Explorer: max 1 re-profiling, no AI personalization
- [x] Pro Builder: unlimited re-profiling, full AI
- [x] Check plan before AI calls
- [x] Upgrade prompt when hitting limits
- [x] Track usage in `profiles` table (credits system)

---

## PHASE 17 — Risk Control & Psychological Safety ✅
**Konsep Section: X (Risk Control), XVIII (Psychological Safety)**

- [x] 30-day no-validation warning at day 25
- [x] Pivot suggestion if market_response = false for 2+ weeks
- [x] "Reality check" UI element at week 3-4
- [x] Anti-sunk cost messaging
- [x] "Switch path" friction-free flow

---

## PHASE 18 — Market Signal Layer (Basic) ✅
**Konsep Section: Dynamic Path System (Layers 1-2), Signal Engine**

- [x] Basic market trends data structure
- [x] Trending niches flag per path
- [x] "Hot" indicator on paths with high market demand
- [x] Signal refresh weekly
- [x] Optional: Google Trends API integration

---

## PHASE 19 — Fully Automated Engine ⏳
**Konsep Section: Fully Automated Engine (Signal Collector → Normalization → Weighting → Selector → Guardrails)**

- [ ] Signal normalization pipeline
- [ ] Automated path weighting adjustment based on market data
- [ ] Strategy selector (automated niche-path matching)
- [ ] Guardrails: max 1 pivot per month, no high-risk for low-risk users
- [ ] Admin dashboard for signal management

---

## PHASE 20 — Dynamic Path System ⏳
**Konsep Section: Dynamic Path System**

- [ ] Layer 1: Static curated paths (done)
- [ ] Layer 2: AI-personalized within paths (done)
- [ ] Layer 3: Dynamic path generation based on market signals
- [ ] Auto-suggest new path variations based on trending data
- [ ] User feedback loop → system learns

---

## PHASE 21 — AI Data Enrichment ⏳
**Konsep Section: VIII (AI Data Setup), IX (Differentiator Logic)**

- [ ] Base knowledge for each of 6 paths (tools, platforms, pricing, competition)
- [ ] Weekly update mechanism for path knowledge
- [ ] Competitive analysis data per path
- [ ] Success rate data collection from user outcomes
- [ ] Differentiator: what makes this platform different from generic advice

---

## PHASE 22 — Analytics & Reporting ⏳
**Konsep Section: XVI (Recommendation Flow, metrics)**

- [ ] Per-user funnel: profiling → path selection → week 1 → week 4 → outcome
- [ ] Cohort analysis: which segments succeed most
- [ ] Path effectiveness: which paths have highest completion rate
- [ ] AI quality metrics: was AI feedback helpful?
- [ ] Admin analytics dashboard

---

## PHASE 23 — Payment Integration ⏳
**Konsep Section: Revenue Model**

- [ ] Stripe/Midtrans integration
- [ ] Subscription management (create, cancel, upgrade)
- [ ] Webhook handlers for payment events
- [ ] Pro Builder subscription flow
- [ ] Advanced Accelerator subscription flow
- [ ] Invoice generation

---

## PHASE 24 — Community & Social Features 🔮
**Konsep Section: Advanced Accelerator tier**

- [ ] Path-based community groups
- [ ] Share progress publicly (opt-in)
- [ ] Success stories showcase
- [ ] Mentor matching system
- [ ] Peer accountability groups

---

## PHASE 25 — Mobile Optimization & PWA 🔮
**Konsep Section: II (UI/UX Structure)**

- [ ] Full responsive optimization
- [ ] PWA manifest + service worker
- [ ] Push notifications for weekly reminders
- [ ] Offline task viewing
- [ ] App-like experience on mobile

---

## PHASE 26 — Email & Notification System 🔮
**Konsep Section: VII (Progress Engine), Newsletter**

- [ ] Welcome email after onboarding
- [ ] Weekly progress summary email
- [ ] Weekly checkpoint reminder
- [ ] Monthly progress report
- [ ] Newsletter integration

---

## PHASE 27 — Advanced AI Capabilities 🔮
**Konsep Section: V (AI Layer Design), XIX (Model Strengths)**

- [ ] AI Feedback Interpreter: analyze user progress patterns
- [ ] Multi-model strategy (Claude for analysis, GPT for generation)
- [ ] AI confidence scoring on recommendations
- [ ] Personalized learning resources per task
- [ ] AI-generated case studies per niche

---

## PHASE 28 — Testing & Quality 🔨
**Konsep Section: (infrastructure)**

- [ ] E2E tests updated for Supabase flow
- [ ] Unit tests for constraint engine
- [ ] Unit tests for AI service
- [ ] Integration tests for full profiling flow
- [ ] Error boundary components
- [ ] Sentry error tracking

---

## PHASE 29 — Go-to-Market 🔮
**Konsep Section: (implicit)**

- [ ] Landing page SEO optimization
- [ ] Content marketing strategy
- [ ] Social media presence
- [ ] Referral system
- [ ] Affiliate program

---

## 📊 CURRENT STATUS SUMMARY

| Category | Status |
|----------|--------|
| **Foundation** | ✅ Complete (Phase 1-7) |
| **Database** | ✅ Schema + migration applied (Phase 8) |
| **Service Layer** | ✅ profileService.ts complete (Phase 9) |
| **AI Integration** | ✅ 3 AI functions active (Phase 10) |
| **Onboarding Flow** | ✅ Supabase + AI integrated (Phase 11) |
| **Path Detail** | ✅ Supabase + AI tasks (Phase 12) |
| **Dashboard** | ✅ Supabase + weekly checkpoint (Phase 13) |
| **Pricing** | ✅ 3 new tiers from konsep (Phase 14) |
| **Progress Engine** | ✅ Complete (Phase 15) |
| **Freemium Gating** | ✅ Complete (Phase 16) |
| **Risk Control** | ✅ Complete (Phase 17) |
| **Market Signals** | ✅ Complete (Phase 18) |
| **🆕 Branching Profiling v3** | ✅ Complete (Phase 19) |
| **🆕 Execution Workspace** | ✅ Complete (Phase 19) |
| **Payment** | ⏳ Queued (Phase 23) |
| **Advanced** | 🔮 Future (Phase 24-29) |

---

## PHASE 19 — Branching Profiling + Execution Workspace ✅
**PIVOT: AI-Assisted Workflow Operator**

### 19A — Branching 5-Level Profiling System
- [x] `branchingProfileConfig.ts` — Full branching data structure
  - Level 1: 6 Economic Models (skill_service, audience_based, digital_product, commerce_arbitrage, data_research, automation_builder)
  - Level 2: Sub-sectors per model (6×4-6 = ~30 sub-sectors)
  - Level 3: Niches per sub-sector (~100+ niches with deep drilling)
  - Level 4: Platform choices per model (5-6 per model)
  - Level 5: Auto-generated workflow ID
- [x] Context questions (time, capital, risk, skill_level, audience)
- [x] Sector-specific questions (camera_comfort, content_consistency, client_experience, etc.)
- [x] Backward compatibility mapping (EconomicModelId → legacy PathId, ContextScores → legacy ProfileScores)
- [x] `BranchingOnboarding.tsx` — Full branching UI with:
  - Dynamic step building based on selections
  - Breadcrumb trail showing full path
  - Auto-advance on selection
  - Processing phase with AI personalization
- [x] `BranchingResult.tsx` — Result display with:
  - Visual path map (Model → Sub-sector → Niche → Platform)
  - Context scores summary bars
  - Sub-specialization card
  - AI why-text and niche suggestion
  - Dual CTA: 30-Day Roadmap + Execution Workspace

### 19B — AI Execution Workspace
- [x] `workspaceGenerator.ts` — AI content generation service with 10 generator types:
  - caption, hook, script, visual_prompt, hashtag, cta, bio, content_pillars, content_calendar, first_post
  - System prompts per generator type
  - Day-1 Setup package (bio + pillars + first post in parallel)
  - Model-specific generator availability
- [x] `Workspace.tsx` — Full execution workspace page:
  - Profile context bar (model → sub-sector → niche → platform)
  - Day-1 Setup one-click generation
  - Content generator tool grid
  - Topic input for context-specific generation
  - Copy-to-clipboard for all outputs
  - Re-generate capability
- [x] Route: `/workspace` (protected)
- [x] Dashboard integration: Workspace menu item + CTA button
- [x] `/onboarding` → BranchingOnboarding (new default)
- [x] `/onboarding/legacy` → old Onboarding (preserved)

**Build Status: ✅ 0 TS errors, 2185 modules, clean build**

---

> **Prinsip Arsitektur: 70% rule-based, 30% AI personalization**
> AI TIDAK menentukan jalur. AI mempersonalisasi DALAM jalur yang sudah dipilih constraint engine.
> **NEW: Branching profiling replaces flat 11-question system as default onboarding.**
> **NEW: Execution Workspace enables "AI-Assisted Workflow Operator" — content generation inside platform.**
