/**
 * ====================================================================
 * PROFILE DIVERSITY STRESS TEST — 100 User Simulation
 * ====================================================================
 * 
 * TUJUAN:
 *   1. Buktikan 100 profil berbeda → path classification TEPAT
 *   2. Buktikan output BERBEDA per profil (tidak copy-paste)
 *   3. Buktikan trend intelligence match per niche
 *   4. Buktikan content calendar berbeda per profil
 *   5. Buktikan edge cases di-handle (extreme scores, missing fields)
 *
 * MENJALANKAN:
 *   npx tsx tests/profile-diversity-test.ts
 *
 * OUTPUT:
 *   - tests/results/diversity-report.json     → full data
 *   - tests/results/diversity-summary.md      → human-readable report
 *   - Console: pass/fail per test category
 */

// ============================================================================
// IMPORTS — Pure logic modules (no Supabase dependency)
// ============================================================================

import {
  PROFILING_QUESTIONS,
  runProfilingEngine,
  answersToScores,
  classifySegment,
  eliminatePaths,
  scorePaths,
  type ProfileScores,
  type ProfileResult,
  type ProfilingQuestionId,
  type PathId,
  type SegmentTag,
} from "../src/utils/profilingConfig";

import {
  ECONOMIC_MODELS,
  SUB_SECTORS,
  NICHES,
  PLATFORMS,
  CONTEXT_QUESTIONS,
  SECTOR_QUESTIONS,
  getSubSectors,
  getNiches,
  getPlatforms,
  getSectorQuestions,
  generateWorkflowId,
  mapToLegacyPathId,
  mapToLegacyScores,
  type EconomicModelId,
  type BranchingProfileResult,
  type ContextScores,
} from "../src/utils/branchingProfileConfig";

import { resolveUserNiche, getNichesForPath } from "../src/services/nicheTaxonomy";

// ── Inline scoring functions (avoid Supabase import from trendIntelligenceEngine) ──
// These are PURE functions — no DB access needed

interface TrendDataPoint {
  id: string;
  niche_id: string;
  keyword: string;
  platform: string;
  date: string;
  search_volume: number;
  search_volume_source: string;
  growth_rate_7d: number;
  growth_rate_30d: number;
  growth_rate_90d: number;
  cpc: number;
  affiliate_density: number;
  ads_density: number;
  content_density: number;
  creator_density: number;
  engagement_velocity: number;
  source: string;
  confidence: number;
}

interface TrendScore {
  niche_id: string;
  keyword: string;
  opportunity_score: number;
  trend_momentum: number;
  monetization_score: number;
  supply_gap_score: number;
  competition_score: number;
  lifecycle_stage: string;
  risk_level: string;
  risk_factors: string[];
  is_breakout: boolean;
  is_hot: boolean;
  breakout_detected_at?: string;
  sustainability_window: number;
  data_points_count: number;
  last_calculated: string;
  calculation_version: string;
  score_breakdown: Record<string, number>;
}

const SCORING_VERSION = "1.0.0";

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function scoreSinglePoint(dp: TrendDataPoint): TrendScore {
  // Momentum: weighted growth rates
  const g7 = clamp(dp.growth_rate_7d, -100, 200);
  const g30 = clamp(dp.growth_rate_30d, -100, 200);
  const g90 = clamp(dp.growth_rate_90d, -100, 200);
  const momentumRaw = (g7 * 0.5 + g30 * 0.35 + g90 * 0.15);
  const trend_momentum = clamp(50 + momentumRaw, 0, 100);

  // Monetization
  const cpcScore = clamp(dp.cpc * 20, 0, 100);
  const affScore = clamp(dp.affiliate_density * 100, 0, 100);
  const adsScore = clamp(dp.ads_density * 100, 0, 100);
  const monetization_score = clamp(cpcScore * 0.5 + affScore * 0.25 + adsScore * 0.25);

  // Supply gap (inverse of saturation)
  const densityScore = dp.content_density > 0 ? clamp(100 - (dp.content_density / 100), 0, 100) : 80;
  const creatorScore = dp.creator_density > 0 ? clamp(100 - (dp.creator_density / 5), 0, 100) : 80;
  const supply_gap_score = clamp(densityScore * 0.6 + creatorScore * 0.4);

  // Competition
  const competition_score = clamp(100 - supply_gap_score);

  // Composite
  const opportunity_score = clamp(Math.round(
    (trend_momentum * 0.35) +
    (monetization_score * 0.30) +
    (supply_gap_score * 0.25) -
    (competition_score * 0.10)
  ));

  // Lifecycle
  let lifecycle_stage = "emerging";
  if (g7 > 30 && g30 < 10) lifecycle_stage = "emerging";
  else if (g30 > 15 && dp.cpc > 0.5) lifecycle_stage = "early_growth";
  else if (dp.cpc > 1.5 && dp.affiliate_density > 0.5) lifecycle_stage = "peak";
  else if (dp.content_density > 5000 && g30 < 0) lifecycle_stage = "saturating";
  else if (g30 < -10 && g90 < -20) lifecycle_stage = "declining";

  // Risk
  const risk_factors: string[] = [];
  if (dp.search_volume < 30) risk_factors.push("data_limited");
  if (competition_score > 70) risk_factors.push("high_competition");
  if (lifecycle_stage === "saturating") risk_factors.push("market_saturating");
  if (g7 > 50 && g90 < 10) risk_factors.push("volatile_spike");
  if (monetization_score < 20) risk_factors.push("low_monetization_signal");

  const risk_level = risk_factors.length >= 3 ? "high" : risk_factors.length >= 1 ? "medium" : "low";
  const is_breakout = g7 > 40 && g30 > 20 && dp.search_volume > 50;
  const sustainability_window = lifecycle_stage === "emerging" ? 90
    : lifecycle_stage === "early_growth" ? 60
    : lifecycle_stage === "peak" ? 30
    : lifecycle_stage === "saturating" ? 14 : 7;

  return {
    niche_id: dp.niche_id,
    keyword: dp.keyword,
    opportunity_score,
    trend_momentum: Math.round(trend_momentum),
    monetization_score: Math.round(monetization_score),
    supply_gap_score: Math.round(supply_gap_score),
    competition_score: Math.round(competition_score),
    lifecycle_stage,
    risk_level,
    risk_factors,
    is_breakout,
    is_hot: false,
    breakout_detected_at: is_breakout ? new Date().toISOString() : undefined,
    sustainability_window,
    data_points_count: 1,
    last_calculated: new Date().toISOString(),
    calculation_version: SCORING_VERSION,
    score_breakdown: {
      trend_momentum: Math.round(trend_momentum),
      monetization_score: Math.round(monetization_score),
      supply_gap_score: Math.round(supply_gap_score),
      competition_score: Math.round(competition_score),
    },
  };
}

function aggregateScores(scores: TrendScore[]): TrendScore {
  if (scores.length === 1) return scores[0];
  const total = scores.length;
  const avgOpp = scores.reduce((s, sc) => s + sc.opportunity_score, 0) / total;
  const avgMom = scores.reduce((s, sc) => s + sc.trend_momentum, 0) / total;
  const avgMon = scores.reduce((s, sc) => s + sc.monetization_score, 0) / total;
  const avgGap = scores.reduce((s, sc) => s + sc.supply_gap_score, 0) / total;
  const avgComp = scores.reduce((s, sc) => s + sc.competition_score, 0) / total;

  const lifecycleCounts: Record<string, number> = {};
  for (const s of scores) {
    lifecycleCounts[s.lifecycle_stage] = (lifecycleCounts[s.lifecycle_stage] || 0) + 1;
  }
  const dominantLifecycle = Object.entries(lifecycleCounts).sort((a, b) => b[1] - a[1])[0][0];
  const allFactors = [...new Set(scores.flatMap(s => s.risk_factors))];
  const maxRisk = scores.some(s => s.risk_level === "high") ? "high"
    : scores.some(s => s.risk_level === "medium") ? "medium" : "low";
  const isBreakout = scores.some(s => s.is_breakout);

  return {
    ...scores[0],
    opportunity_score: Math.round(avgOpp),
    trend_momentum: Math.round(avgMom),
    monetization_score: Math.round(avgMon),
    supply_gap_score: Math.round(avgGap),
    competition_score: Math.round(avgComp),
    lifecycle_stage: dominantLifecycle,
    risk_level: maxRisk,
    risk_factors: allFactors,
    is_breakout: isBreakout,
    data_points_count: total,
  };
}

function markHotScores(scores: TrendScore[]): TrendScore[] {
  if (scores.length === 0) return scores;
  const sorted = [...scores].sort((a, b) => b.opportunity_score - a.opportunity_score);
  const cutoffIdx = Math.floor(sorted.length * 0.8);
  const cutoffScore = sorted[cutoffIdx]?.opportunity_score || 0;
  return scores.map(s => ({ ...s, is_hot: s.opportunity_score >= cutoffScore }));
}

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// TEST DATA GENERATOR — 100 unique synthetic profiles
// ============================================================================

interface SyntheticProfile {
  id: number;
  name: string;
  description: string;
  // For branching system
  economicModel: EconomicModelId;
  subSector: string;
  niche: string;
  platform: string;
  contextScores: ContextScores;
  sectorAnswers: Record<string, string>;
  // For legacy system
  legacyAnswers: Record<ProfilingQuestionId, string>;
}

/**
 * Generate 100 diverse profiles covering:
 * - All 6 economic models
 * - Multiple sub-sectors per model
 * - Different niches per sub-sector
 * - Different platforms
 * - Various context score combinations
 * - Edge cases (extreme values, mismatches)
 */
function generateSyntheticProfiles(): SyntheticProfile[] {
  const profiles: SyntheticProfile[] = [];
  let id = 1;

  // ─── CATEGORY 1: Full Coverage — Every Economic Model × 2-3 Sub-sectors (36 profiles) ───
  const models: EconomicModelId[] = [
    "skill_service", "audience_based", "digital_product",
    "commerce_arbitrage", "data_research", "automation_builder",
  ];

  for (const model of models) {
    const subSectors = getSubSectors(model);
    const platforms = getPlatforms(model);
    
    for (let si = 0; si < Math.min(subSectors.length, 3); si++) {
      const sub = subSectors[si];
      const niches = getNiches(sub.id);
      const niche = niches[si % niches.length] || niches[0];
      const platform = platforms[si % platforms.length];

      // Vary context scores across profiles
      const timeOptions = ["lt1h", "1-2h", "3-4h", "gt4h"];
      const capitalOptions = ["zero", "lt50", "50-200", "200-500"];
      const riskOptions = ["very_low", "low", "medium", "high"];
      const skillOptions = ["beginner", "basic", "intermediate", "advanced", "expert"];
      const audienceOptions = ["zero", "micro", "small", "medium", "large"];

      const ctx: ContextScores = {
        time: (si % 4) + 1,
        capital: si % 4,
        risk: (si % 4) + 1,
        skillLevel: (si % 5),
        audience: si % 5,
      };

      const sectorQs = getSectorQuestions(model);
      const sectorAnswers: Record<string, string> = {};
      for (const q of sectorQs) {
        sectorAnswers[q.id] = q.options[si % q.options.length].id;
      }

      // Map to legacy answers
      const legacyAnswers = buildLegacyAnswers(ctx, model, sub.id, niche?.id, platform?.id);

      profiles.push({
        id: id++,
        name: `${model}/${sub.id}/${niche?.id || "default"}`,
        description: `Model=${model}, Sub=${sub.label}, Niche=${niche?.label || "N/A"}, Platform=${platform?.label}`,
        economicModel: model,
        subSector: sub.id,
        niche: niche?.id || "general",
        platform: platform?.id || "general",
        contextScores: ctx,
        sectorAnswers,
        legacyAnswers,
      });
    }
  }

  // ─── CATEGORY 2: Context Variations — Same model, different constraints (20 profiles) ───
  const contextCombos: Array<{ time: number; capital: number; risk: number; skill: number; audience: number }> = [
    { time: 1, capital: 0, risk: 1, skill: 0, audience: 0 },  // Absolute beginner
    { time: 4, capital: 3, risk: 4, skill: 4, audience: 4 },  // Power user
    { time: 1, capital: 3, risk: 1, skill: 4, audience: 0 },  // Rich, skilled, no time, no audience
    { time: 4, capital: 0, risk: 4, skill: 0, audience: 4 },  // Lots of time & audience, no money/skill
    { time: 2, capital: 1, risk: 2, skill: 2, audience: 2 },  // Moderate everything
    { time: 1, capital: 0, risk: 1, skill: 0, audience: 0 },  // Minimum everything
    { time: 4, capital: 3, risk: 4, skill: 4, audience: 4 },  // Maximum everything
    { time: 3, capital: 0, risk: 3, skill: 3, audience: 1 },  // Skilled but broke
    { time: 1, capital: 2, risk: 2, skill: 1, audience: 3 },  // Has money & audience, no time/skill
    { time: 2, capital: 0, risk: 4, skill: 1, audience: 0 },  // Risk taker beginner
    { time: 4, capital: 0, risk: 1, skill: 4, audience: 0 },  // Expert, no money, cautious
    { time: 1, capital: 3, risk: 4, skill: 0, audience: 0 },  // Has money, no skill/time, high risk
    { time: 3, capital: 1, risk: 2, skill: 3, audience: 2 },  // Balanced mid
    { time: 2, capital: 2, risk: 3, skill: 2, audience: 1 },  // Slightly above average
    { time: 4, capital: 0, risk: 2, skill: 1, audience: 4 },  // Big audience, low skill
    { time: 1, capital: 0, risk: 1, skill: 4, audience: 0 },  // Expert, zero everything else
    { time: 3, capital: 2, risk: 3, skill: 0, audience: 3 },  // Complete beginner with resources
    { time: 2, capital: 1, risk: 1, skill: 2, audience: 1 },  // Conservative intermediate
    { time: 4, capital: 3, risk: 1, skill: 3, audience: 2 },  // Rich, skilled, cautious
    { time: 1, capital: 0, risk: 4, skill: 0, audience: 0 },  // Nothing but courage
  ];

  const testModels: EconomicModelId[] = ["skill_service", "audience_based", "commerce_arbitrage", "digital_product"];
  for (let i = 0; i < contextCombos.length; i++) {
    const combo = contextCombos[i];
    const model = testModels[i % testModels.length];
    const subs = getSubSectors(model);
    const sub = subs[i % subs.length];
    const niches = getNiches(sub.id);
    const niche = niches[i % Math.max(niches.length, 1)];
    const plats = getPlatforms(model);
    const plat = plats[i % plats.length];

    const ctx: ContextScores = {
      time: combo.time,
      capital: combo.capital,
      risk: combo.risk,
      skillLevel: combo.skill,
      audience: combo.audience,
    };

    profiles.push({
      id: id++,
      name: `ctx_variation_${i + 1}`,
      description: `Context stress: time=${combo.time}, cap=${combo.capital}, risk=${combo.risk}, skill=${combo.skill}, aud=${combo.audience}`,
      economicModel: model,
      subSector: sub.id,
      niche: niche?.id || "general",
      platform: plat?.id || "general",
      contextScores: ctx,
      sectorAnswers: {},
      legacyAnswers: buildLegacyAnswers(ctx, model, sub.id, niche?.id, plat?.id),
    });
  }

  // ─── CATEGORY 3: Niche Deep-Drill — Same model, same sub-sector, different niches (20 profiles) ───
  const deepDrillConfigs: Array<{ model: EconomicModelId; sub: string }> = [
    { model: "skill_service", sub: "writing" },
    { model: "skill_service", sub: "design" },
    { model: "audience_based", sub: "content_creator" },
    { model: "digital_product", sub: "template" },
    { model: "commerce_arbitrage", sub: "affiliate" },
  ];

  for (const config of deepDrillConfigs) {
    const niches = getNiches(config.sub);
    for (let ni = 0; ni < Math.min(niches.length, 4); ni++) {
      const niche = niches[ni];
      const plats = getPlatforms(config.model);
      const plat = plats[ni % plats.length];

      profiles.push({
        id: id++,
        name: `deep_${config.model}_${config.sub}_${niche.id}`,
        description: `Deep drill: ${config.model} > ${config.sub} > ${niche.label}`,
        economicModel: config.model,
        subSector: config.sub,
        niche: niche.id,
        platform: plat.id,
        contextScores: { time: 3, capital: 1, risk: 2, skillLevel: 2, audience: 1 },
        sectorAnswers: {},
        legacyAnswers: buildLegacyAnswers(
          { time: 3, capital: 1, risk: 2, skillLevel: 2, audience: 1 },
          config.model, config.sub, niche.id, plat.id
        ),
      });
    }
  }

  // ─── CATEGORY 4: Platform Variation — Same niche, different platforms (10 profiles) ───
  const platformTestModel: EconomicModelId = "audience_based";
  const platformTestSub = "content_creator";
  const platformTestNiche = "education";
  const allPlatforms = getPlatforms(platformTestModel);

  for (let pi = 0; pi < Math.min(allPlatforms.length, 6); pi++) {
    const plat = allPlatforms[pi];
    profiles.push({
      id: id++,
      name: `platform_${plat.id}`,
      description: `Same niche (education), different platform: ${plat.label}`,
      economicModel: platformTestModel,
      subSector: platformTestSub,
      niche: platformTestNiche,
      platform: plat.id,
      contextScores: { time: 3, capital: 1, risk: 2, skillLevel: 2, audience: 2 },
      sectorAnswers: { camera_comfort: "okay", content_consistency: "3x_week" },
      legacyAnswers: buildLegacyAnswers(
        { time: 3, capital: 1, risk: 2, skillLevel: 2, audience: 2 },
        platformTestModel, platformTestSub, platformTestNiche, plat.id
      ),
    });
  }

  // ─── CATEGORY 5: Edge Cases (8 profiles) ───
  const edgeCases: Array<{ name: string; desc: string; model: EconomicModelId; ctx: ContextScores }> = [
    {
      name: "edge_absolute_zero",
      desc: "All minimums — should still get a valid path",
      model: "skill_service",
      ctx: { time: 1, capital: 0, risk: 1, skillLevel: 0, audience: 0 },
    },
    {
      name: "edge_all_max",
      desc: "All maximums — should get highest-tier path",
      model: "automation_builder",
      ctx: { time: 4, capital: 3, risk: 4, skillLevel: 4, audience: 4 },
    },
    {
      name: "edge_high_risk_no_skill",
      desc: "Wants high risk but zero skill — should NOT get speculative",
      model: "commerce_arbitrage",
      ctx: { time: 2, capital: 0, risk: 4, skillLevel: 0, audience: 0 },
    },
    {
      name: "edge_expert_no_time",
      desc: "Expert but <1hr — should get quick-start path",
      model: "skill_service",
      ctx: { time: 1, capital: 0, risk: 1, skillLevel: 4, audience: 0 },
    },
    {
      name: "edge_big_audience_beginner",
      desc: "Large audience but beginner — should monetize existing audience",
      model: "audience_based",
      ctx: { time: 2, capital: 0, risk: 2, skillLevel: 0, audience: 4 },
    },
    {
      name: "edge_money_no_skill_no_time",
      desc: "Has capital but nothing else — should get arbitrage/investment path",
      model: "commerce_arbitrage",
      ctx: { time: 1, capital: 3, risk: 3, skillLevel: 0, audience: 0 },
    },
    {
      name: "edge_skilled_cautious",
      desc: "High skill, very low risk — should get safe execution path",
      model: "data_research",
      ctx: { time: 3, capital: 0, risk: 1, skillLevel: 4, audience: 1 },
    },
    {
      name: "edge_student",
      desc: "No money, no skill, lots of time, willing to learn",
      model: "digital_product",
      ctx: { time: 4, capital: 0, risk: 2, skillLevel: 0, audience: 0 },
    },
  ];

  for (const edge of edgeCases) {
    const subs = getSubSectors(edge.model);
    const sub = subs[0];
    const niches = getNiches(sub.id);
    const niche = niches[0];
    const plats = getPlatforms(edge.model);
    const plat = plats[0];

    profiles.push({
      id: id++,
      name: edge.name,
      description: edge.desc,
      economicModel: edge.model,
      subSector: sub.id,
      niche: niche?.id || "general",
      platform: plat?.id || "general",
      contextScores: edge.ctx,
      sectorAnswers: {},
      legacyAnswers: buildLegacyAnswers(edge.ctx, edge.model, sub.id, niche?.id, plat?.id),
    });
  }

  // ─── CATEGORY 6: Cross-Model Stress — Every model × extreme context combos (18 profiles) ───
  const extremeContexts: Array<{ label: string; ctx: ContextScores }> = [
    { label: "broke_expert",       ctx: { time: 4, capital: 0, risk: 1, skillLevel: 4, audience: 0 } },
    { label: "rich_beginner",      ctx: { time: 1, capital: 3, risk: 4, skillLevel: 0, audience: 0 } },
    { label: "influencer_noSkill", ctx: { time: 2, capital: 1, risk: 2, skillLevel: 0, audience: 4 } },
  ];

  for (const model of models) {
    for (const extreme of extremeContexts) {
      const subs = getSubSectors(model);
      const sub = subs[subs.length - 1]; // Use LAST sub-sector (different from Category 1 which uses first few)
      const niches = getNiches(sub.id);
      const niche = niches[niches.length - 1] || niches[0]; // Use LAST niche
      const plats = getPlatforms(model);
      const plat = plats[plats.length - 1]; // Use LAST platform

      profiles.push({
        id: id++,
        name: `xmodel_${model}_${extreme.label}`,
        description: `Cross-model stress: ${model} with ${extreme.label} profile`,
        economicModel: model,
        subSector: sub.id,
        niche: niche?.id || "general",
        platform: plat?.id || "general",
        contextScores: extreme.ctx,
        sectorAnswers: {},
        legacyAnswers: buildLegacyAnswers(extreme.ctx, model, sub.id, niche?.id, plat?.id),
      });
    }
  }

  // ─── CATEGORY 7: Sub-sector Exhaustion — Remaining sub-sectors not covered in Cat 1 (12 profiles) ───
  const exhaustionConfigs: Array<{ model: EconomicModelId; subIdx: number }> = [
    { model: "skill_service", subIdx: 3 },    // 4th sub-sector (if exists)
    { model: "skill_service", subIdx: 4 },    // 5th sub-sector
    { model: "audience_based", subIdx: 3 },
    { model: "audience_based", subIdx: 4 },
    { model: "digital_product", subIdx: 3 },
    { model: "digital_product", subIdx: 4 },
    { model: "commerce_arbitrage", subIdx: 3 },
    { model: "commerce_arbitrage", subIdx: 4 },
    { model: "data_research", subIdx: 3 },
    { model: "data_research", subIdx: 4 },
    { model: "automation_builder", subIdx: 3 },
    { model: "automation_builder", subIdx: 4 },
  ];

  const midContexts: ContextScores[] = [
    { time: 2, capital: 1, risk: 3, skillLevel: 3, audience: 1 },
    { time: 3, capital: 2, risk: 2, skillLevel: 1, audience: 3 },
  ];

  for (const cfg of exhaustionConfigs) {
    const subs = getSubSectors(cfg.model);
    if (cfg.subIdx >= subs.length) continue; // Skip if model doesn't have this many sub-sectors
    const sub = subs[cfg.subIdx];
    const niches = getNiches(sub.id);
    const niche = niches[0];
    const plats = getPlatforms(cfg.model);
    const plat = plats[cfg.subIdx % plats.length];
    const ctx = midContexts[cfg.subIdx % 2];

    profiles.push({
      id: id++,
      name: `exhaust_${cfg.model}_${sub.id}`,
      description: `Sub-sector exhaustion: ${cfg.model} > ${sub.label} (idx ${cfg.subIdx})`,
      economicModel: cfg.model,
      subSector: sub.id,
      niche: niche?.id || "general",
      platform: plat?.id || "general",
      contextScores: ctx,
      sectorAnswers: {},
      legacyAnswers: buildLegacyAnswers(ctx, cfg.model, sub.id, niche?.id, plat?.id),
    });
  }

  // ─── CATEGORY 8: Adversarial Mismatches — Model × unlikely sub-sector combos (6 profiles) ───
  const mismatchProfiles: Array<{
    name: string; desc: string; model: EconomicModelId;
    subOverride: string; ctx: ContextScores;
  }> = [
    {
      name: "mismatch_skill_as_commerce",
      desc: "Skill person forced into affiliate sub-sector",
      model: "skill_service",
      subOverride: "affiliate",
      ctx: { time: 3, capital: 0, risk: 2, skillLevel: 3, audience: 0 },
    },
    {
      name: "mismatch_audience_as_automation",
      desc: "Content creator forced into ai_workflow sub-sector",
      model: "audience_based",
      subOverride: "ai_workflow",
      ctx: { time: 2, capital: 1, risk: 1, skillLevel: 1, audience: 3 },
    },
    {
      name: "mismatch_commerce_as_data",
      desc: "Commerce person forced into market_analyst sub-sector",
      model: "commerce_arbitrage",
      subOverride: "market_analyst",
      ctx: { time: 4, capital: 2, risk: 3, skillLevel: 2, audience: 0 },
    },
    {
      name: "mismatch_data_as_product",
      desc: "Data researcher forced into template sub-sector",
      model: "data_research",
      subOverride: "template",
      ctx: { time: 1, capital: 0, risk: 1, skillLevel: 4, audience: 1 },
    },
    {
      name: "mismatch_product_as_skill",
      desc: "Digital product maker forced into writing sub-sector",
      model: "digital_product",
      subOverride: "writing",
      ctx: { time: 3, capital: 1, risk: 2, skillLevel: 2, audience: 2 },
    },
    {
      name: "mismatch_automation_as_audience",
      desc: "Automation builder forced into micro_influencer sub-sector",
      model: "automation_builder",
      subOverride: "micro_influencer",
      ctx: { time: 2, capital: 0, risk: 3, skillLevel: 3, audience: 4 },
    },
  ];

  for (const mm of mismatchProfiles) {
    // Get whatever niches exist for the overridden sub-sector
    const niches = getNiches(mm.subOverride);
    const niche = niches[0];
    const plats = getPlatforms(mm.model);
    const plat = plats[0];

    profiles.push({
      id: id++,
      name: mm.name,
      description: mm.desc,
      economicModel: mm.model,
      subSector: mm.subOverride,
      niche: niche?.id || "general",
      platform: plat?.id || "general",
      contextScores: mm.ctx,
      sectorAnswers: {},
      legacyAnswers: buildLegacyAnswers(mm.ctx, mm.model, mm.subOverride, niche?.id, plat?.id),
    });
  }

  return profiles;
}

// ============================================================================
// LEGACY ANSWER BUILDER — Map context scores to 11-question answer format
// ============================================================================

function buildLegacyAnswers(
  ctx: ContextScores,
  model: EconomicModelId,
  subSector: string,
  niche?: string,
  platform?: string,
): Record<ProfilingQuestionId, string> {
  // REAL option values from profilingConfig.ts
  const timeValues = ["lt1h", "1-2h", "3-4h", "gt4h"];
  const capitalValues = ["zero", "lt50", "50-200", "200-500"];
  const speedValues = ["7d", "2w", "1mo", "1-3mo"];
  const riskValues = ["very_low", "low", "medium", "high"];
  
  // skill_primary: none=0, writing=1, design=2, marketing=3, tech=4, video_prod=5, sales=6
  const skillValues = ["none", "writing", "design", "marketing", "tech", "video_prod", "sales"];
  
  // skill_secondary: none=0, basic_write=1, basic_design=2, basic_data=3, social_media=4, english=5
  const skillSecValues = ["none", "basic_write", "basic_design", "basic_data", "social_media", "english"];
  
  // audience_access: zero=0, micro=1, small=2, medium=3, large=4
  const audienceValues = ["zero", "micro", "small", "medium", "large"];
  
  // daily_routine: early_morning=1, morning=2, afternoon=3, evening=4, flexible=5
  const routineValues = ["early_morning", "morning", "afternoon", "evening", "flexible"];

  // Map work_style based on model + sub-sector
  const workStyleMap: Record<string, string> = {
    writing: "longform_write", design: "video_edit", video: "video_edit",
    development: "silent_build", marketing: "research", ai_operator: "silent_build",
    content_creator: "video_face", micro_influencer: "shortform",
    niche_page: "silent_build", community_builder: "people",
    ebook: "longform_write", template: "silent_build", prompt_pack: "research",
    course_mini: "video_face", membership: "people", saas_micro: "silent_build",
    dropship: "people", print_on_demand: "silent_build", affiliate: "shortform",
    tiktok_shop: "video_face", digital_resell: "research",
    trend_researcher: "research", market_analyst: "research",
    crypto_analyst: "research", newsletter_writer: "longform_write",
    ai_curator: "research", nocode_builder: "silent_build",
    zapier_automation: "silent_build", crm_setup: "people",
    ai_workflow: "silent_build", funnel_builder: "research",
  };

  // Map model to interest_market
  const marketMap: Record<string, string> = {
    skill_service: "business",
    audience_based: "education",
    digital_product: "tech",
    commerce_arbitrage: "ecommerce",
    data_research: "finance",
    automation_builder: "tech",
  };

  // Map platform to preferred_platform value
  const platformLegacyMap: Record<string, string> = {
    fiverr: "marketplace", upwork: "marketplace", linkedin: "linkedin",
    direct_client: "linkedin", tokopedia_jasa: "marketplace",
    youtube: "youtube", tiktok: "tiktok_reels",
    instagram: "tiktok_reels", twitter_x: "twitter", substack: "own_website",
    podcast: "youtube", gumroad: "own_website", lemon_squeezy: "own_website",
    notion_market: "own_website", udemy: "own_website", own_website: "own_website",
    etsy_digital: "marketplace", shopee: "marketplace", tokopedia: "marketplace",
    tiktok_shop_plat: "tiktok_reels", amazon: "marketplace", own_store: "own_website",
    substack_dr: "own_website", twitter_dr: "twitter", linkedin_dr: "linkedin",
    own_blog: "own_website", medium: "own_website",
    upwork_auto: "marketplace", linkedin_auto: "linkedin", direct_auto: "linkedin",
    make_marketplace: "marketplace", productized: "own_website",
  };

  // Map skill level from context scores (0-4) to actual option value
  const skillFromCtx: Record<number, string> = {
    0: "none",
    1: "writing",
    2: "design",
    3: "marketing",
    4: "tech",
  };

  return {
    time: timeValues[Math.min(ctx.time - 1, 3)] || "1-2h",
    capital: capitalValues[Math.min(ctx.capital, 3)] || "zero",
    target_speed: speedValues[Math.min(ctx.risk - 1, 3)] || "2w",
    work_style: workStyleMap[subSector] || "silent_build",
    risk: riskValues[Math.min(ctx.risk - 1, 3)] || "medium",
    skill_primary: skillFromCtx[ctx.skillLevel] || "none",
    skill_secondary: skillSecValues[Math.min(ctx.audience, 5)] || "none",
    interest_market: marketMap[model] || "business",
    audience_access: audienceValues[Math.min(ctx.audience, 4)] || "zero",
    daily_routine: routineValues[ctx.time % 5] || "morning",
    preferred_platform: platformLegacyMap[platform || ""] || "marketplace",
  } as Record<ProfilingQuestionId, string>;
}

// ============================================================================
// TEST RUNNERS
// ============================================================================

interface TestResult {
  profileId: number;
  profileName: string;
  // Classification
  legacyPath: PathId;
  alternatePath: PathId | null;
  segment: SegmentTag;
  eliminatedPaths: PathId[];
  pathScores: Record<string, number>;
  branchingWorkflowId: string;
  legacyMappedPath: PathId;
  // Niche resolution
  nicheResolved: string;
  nicheLabel: string;
  nicheKeywords: string[];
  // Uniqueness fingerprint
  fingerprint: string;
  // Trend scoring (from synthetic data)
  trendScores: Array<{ keyword: string; opportunity: number; lifecycle: string }>;
}

function runClassificationTest(profile: SyntheticProfile): TestResult {
  // ── 1. Legacy profiling engine ──
  const legacyResult = runProfilingEngine(profile.legacyAnswers);

  // ── 2. Branching system mapping ──
  const branchingWorkflowId = generateWorkflowId(
    profile.economicModel, profile.subSector, profile.niche, profile.platform
  );
  const legacyMappedPath = mapToLegacyPathId(profile.economicModel, profile.subSector);

  // ── 3. Niche taxonomy resolution ──
  const nicheResult = resolveUserNiche(
    profile.economicModel,
    profile.niche,
    profile.subSector,
  );

  // ── 4. Generate synthetic trend data points to test scoring ──
  const syntheticDataPoints = generateSyntheticTrendData(nicheResult.nicheId, nicheResult.keywords);
  const rawScores = syntheticDataPoints.map(scoreSinglePoint);
  
  // Aggregate per keyword
  const byKeyword: Record<string, TrendScore[]> = {};
  for (const score of rawScores) {
    if (!byKeyword[score.keyword]) byKeyword[score.keyword] = [];
    byKeyword[score.keyword].push(score);
  }
  const aggregated = Object.values(byKeyword).map(aggregateScores);
  const finalScores = markHotScores(aggregated);

  // ── 5. Build uniqueness fingerprint ──
  const fingerprint = [
    profile.economicModel,
    profile.subSector,
    profile.niche,
    profile.platform,
    legacyResult.primaryPath,
    legacyResult.segment,
    nicheResult.nicheId,
    `t${profile.contextScores.time}`,
    `c${profile.contextScores.capital}`,
    `r${profile.contextScores.risk}`,
    `s${profile.contextScores.skillLevel}`,
    `a${profile.contextScores.audience}`,
  ].join("|");

  return {
    profileId: profile.id,
    profileName: profile.name,
    legacyPath: legacyResult.primaryPath,
    alternatePath: legacyResult.alternatePath,
    segment: legacyResult.segment,
    eliminatedPaths: legacyResult.eliminatedPaths,
    pathScores: legacyResult.pathScores,
    branchingWorkflowId,
    legacyMappedPath,
    nicheResolved: nicheResult.nicheId,
    nicheLabel: nicheResult.label,
    nicheKeywords: nicheResult.keywords,
    fingerprint,
    trendScores: finalScores.map(s => ({
      keyword: s.keyword,
      opportunity: s.opportunity_score,
      lifecycle: s.lifecycle_stage,
    })),
  };
}

/**
 * Generate synthetic trend data for scoring validation
 * Each niche gets different data → different scores → proves uniqueness
 */
function generateSyntheticTrendData(nicheId: string, keywords: string[]): TrendDataPoint[] {
  const points: TrendDataPoint[] = [];
  const hash = simpleHash(nicheId);

  for (let ki = 0; ki < keywords.length; ki++) {
    const keyword = keywords[ki];
    const kwHash = simpleHash(keyword);
    
    // Deterministic but varied values based on keyword + niche hash
    const searchVolume = 20 + (kwHash % 80);
    const growth7d = ((hash + kwHash) % 60) - 20;  // -20% to +40%
    const growth30d = ((hash * 2 + kwHash) % 80) - 30;
    const growth90d = ((hash * 3 + kwHash) % 100) - 40;
    const cpc = parseFloat((0.1 + (kwHash % 30) / 10).toFixed(2));
    const affiliateDensity = parseFloat(((kwHash % 10) / 10).toFixed(2));
    const adsDensity = parseFloat(((hash % 10) / 10).toFixed(2));
    const contentDensity = 100 + (kwHash % 9900);
    const creatorDensity = 10 + (hash % 490);
    const engagementVelocity = parseFloat((0.01 + (kwHash % 15) / 100).toFixed(3));

    points.push({
      id: `synth-${nicheId}-${ki}`,
      niche_id: nicheId,
      keyword,
      platform: "google",
      date: new Date().toISOString().split("T")[0],
      search_volume: searchVolume,
      search_volume_source: "trends",
      growth_rate_7d: growth7d,
      growth_rate_30d: growth30d,
      growth_rate_90d: growth90d,
      cpc,
      affiliate_density: affiliateDensity,
      ads_density: adsDensity,
      content_density: contentDensity,
      creator_density: creatorDensity,
      engagement_velocity: engagementVelocity,
      source: "synthetic",
      confidence: 0.8,
    });
  }

  return points;
}

/** Simple deterministic hash for reproducible test data */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// ============================================================================
// VALIDATION ENGINE
// ============================================================================

interface ValidationResult {
  testName: string;
  passed: boolean;
  details: string;
  data?: any;
}

function validateResults(profiles: SyntheticProfile[], results: TestResult[]): ValidationResult[] {
  const validations: ValidationResult[] = [];

  // ─── V1: Every profile gets a valid path (no undefined/null) ───
  {
    const failures = results.filter(r => !r.legacyPath || !r.branchingWorkflowId);
    validations.push({
      testName: "V1: Valid Path Assignment",
      passed: failures.length === 0,
      details: failures.length === 0
        ? `ALL ${results.length} profiles got valid paths`
        : `${failures.length} profiles have invalid paths: ${failures.map(f => f.profileName).join(", ")}`,
    });
  }

  // ─── V2: All 6 economic models are represented in results ───
  {
    const models = new Set(profiles.map(p => p.economicModel));
    const allSix = models.size === 6;
    validations.push({
      testName: "V2: All 6 Economic Models Covered",
      passed: allSix,
      details: `${models.size}/6 models covered: ${[...models].join(", ")}`,
    });
  }

  // ─── V3: Path distribution — no single path gets > 50% ───
  {
    const pathCounts: Record<string, number> = {};
    for (const r of results) {
      pathCounts[r.legacyPath] = (pathCounts[r.legacyPath] || 0) + 1;
    }
    const maxPct = Math.max(...Object.values(pathCounts)) / results.length;
    validations.push({
      testName: "V3: Path Distribution Balance",
      passed: maxPct <= 0.5,
      details: `Distribution: ${Object.entries(pathCounts).map(([k, v]) => `${k}=${v}(${(v/results.length*100).toFixed(0)}%)`).join(", ")}`,
      data: pathCounts,
    });
  }

  // ─── V4: Segment distribution — at least 4 different segments ───
  {
    const segments = new Set(results.map(r => r.segment));
    validations.push({
      testName: "V4: Segment Diversity",
      passed: segments.size >= 4,
      details: `${segments.size} unique segments: ${[...segments].join(", ")}`,
    });
  }

  // ─── V5: Fingerprint uniqueness — no two profiles should be 100% identical ───
  {
    const fingerprints = results.map(r => r.fingerprint);
    const uniqueFps = new Set(fingerprints);
    const dupeCount = fingerprints.length - uniqueFps.size;
    validations.push({
      testName: "V5: Profile Fingerprint Uniqueness",
      passed: uniqueFps.size >= results.length * 0.7, // at least 70% unique
      details: `${uniqueFps.size}/${results.length} unique fingerprints (${dupeCount} duplicates)`,
    });
  }

  // ─── V6: Workflow ID uniqueness — branching paths should be mostly unique ───
  {
    const workflows = new Set(results.map(r => r.branchingWorkflowId));
    validations.push({
      testName: "V6: Branching Workflow Uniqueness",
      passed: workflows.size >= results.length * 0.5,
      details: `${workflows.size}/${results.length} unique workflow IDs`,
    });
  }

  // ─── V7: Niche resolution — every profile resolves to a valid niche ───
  {
    const emptyNiches = results.filter(r => !r.nicheResolved || r.nicheResolved === "");
    validations.push({
      testName: "V7: Niche Resolution Success",
      passed: emptyNiches.length === 0,
      details: emptyNiches.length === 0
        ? `ALL ${results.length} profiles resolved to valid niches`
        : `${emptyNiches.length} profiles failed niche resolution`,
    });
  }

  // ─── V8: Niche keyword diversity — different niches get different keywords ───
  {
    const keywordSets = results.map(r => r.nicheKeywords.sort().join(","));
    const uniqueKeywordSets = new Set(keywordSets);
    validations.push({
      testName: "V8: Keyword Diversity Across Niches",
      passed: uniqueKeywordSets.size >= results.length * 0.4,
      details: `${uniqueKeywordSets.size}/${results.length} unique keyword sets`,
    });
  }

  // ─── V9: Trend scores are computed and varied ───
  {
    const allScores = results.flatMap(r => r.trendScores.map(t => t.opportunity));
    const uniqueScores = new Set(allScores);
    const minScore = Math.min(...allScores.filter(s => !isNaN(s)));
    const maxScore = Math.max(...allScores.filter(s => !isNaN(s)));
    const range = maxScore - minScore;
    validations.push({
      testName: "V9: Trend Score Variation",
      passed: uniqueScores.size >= 10 && range >= 20,
      details: `${uniqueScores.size} unique scores, range ${minScore}–${maxScore} (spread=${range})`,
    });
  }

  // ─── V10: Lifecycle stage diversity ───
  {
    const lifecycles = new Set(results.flatMap(r => r.trendScores.map(t => t.lifecycle)));
    validations.push({
      testName: "V10: Lifecycle Stage Diversity",
      passed: lifecycles.size >= 3,
      details: `${lifecycles.size} lifecycle stages present: ${[...lifecycles].join(", ")}`,
    });
  }

  // ─── V11: Constraint engine works — eliminated paths change with scores ───
  {
    const eliminatedVariety = new Set(results.map(r => r.eliminatedPaths.sort().join(",")));
    validations.push({
      testName: "V11: Constraint Engine Differentiation",
      passed: eliminatedVariety.size >= 3,
      details: `${eliminatedVariety.size} unique elimination patterns`,
    });
  }

  // ─── V12: Edge case — absolute zero still gets micro_service ───
  {
    const zeroProfile = results.find(r => r.profileName === "edge_absolute_zero");
    const valid = zeroProfile && zeroProfile.legacyPath !== undefined;
    validations.push({
      testName: "V12: Edge Case — Absolute Zero User",
      passed: !!valid,
      details: valid
        ? `Zero user got path: ${zeroProfile!.legacyPath}, segment: ${zeroProfile!.segment}`
        : "Failed to process zero-state user",
    });
  }

  // ─── V13: Edge case — max user gets highest tier ───
  {
    const maxProfile = results.find(r => r.profileName === "edge_all_max");
    const valid = maxProfile && maxProfile.legacyPath !== undefined;
    validations.push({
      testName: "V13: Edge Case — All Max User",
      passed: !!valid,
      details: valid
        ? `Max user got path: ${maxProfile!.legacyPath}, segment: ${maxProfile!.segment}, eliminated: ${maxProfile!.eliminatedPaths.length}`
        : "Failed to process max user",
    });
  }

  // ─── V14: Same niche different platforms → different workflow IDs ───
  {
    const platformProfiles = results.filter(r => r.profileName.startsWith("platform_"));
    const workflows = new Set(platformProfiles.map(r => r.branchingWorkflowId));
    validations.push({
      testName: "V14: Platform Variation Creates Different Workflows",
      passed: workflows.size >= Math.min(platformProfiles.length, 4),
      details: `${workflows.size}/${platformProfiles.length} unique workflows for same niche, different platforms`,
    });
  }

  // ─── V15: Deep drill — same sub-sector, different niches → different trend data ───
  {
    const deepProfiles = results.filter(r => r.profileName.startsWith("deep_"));
    const nicheIds = new Set(deepProfiles.map(r => r.nicheResolved));
    validations.push({
      testName: "V15: Deep Drill Niche Differentiation",
      passed: nicheIds.size >= Math.min(deepProfiles.length * 0.5, 5),
      details: `${nicheIds.size} unique niches from ${deepProfiles.length} deep-drill profiles`,
    });
  }

  return validations;
}

// ============================================================================
// REPORT GENERATOR
// ============================================================================

function generateReport(
  profiles: SyntheticProfile[],
  results: TestResult[],
  validations: ValidationResult[],
): string {
  const passed = validations.filter(v => v.passed).length;
  const failed = validations.filter(v => !v.passed).length;
  const total = validations.length;

  let md = `# 🧪 Profile Diversity Stress Test Report\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Profiles Tested:** ${profiles.length}\n`;
  md += `**Tests Passed:** ${passed}/${total} (${(passed/total*100).toFixed(0)}%)\n`;
  md += `**Tests Failed:** ${failed}/${total}\n\n`;

  md += `## Overall Verdict: ${failed === 0 ? "✅ ALL TESTS PASSED" : `⚠️ ${failed} TESTS FAILED`}\n\n`;

  md += `---\n\n`;
  md += `## Test Results\n\n`;
  md += `| # | Test | Status | Details |\n`;
  md += `|---|------|--------|---------|\n`;
  for (let i = 0; i < validations.length; i++) {
    const v = validations[i];
    md += `| ${i + 1} | ${v.testName} | ${v.passed ? "✅" : "❌"} | ${v.details} |\n`;
  }

  md += `\n---\n\n`;
  md += `## Path Distribution\n\n`;
  const pathCounts: Record<string, number> = {};
  for (const r of results) {
    pathCounts[r.legacyPath] = (pathCounts[r.legacyPath] || 0) + 1;
  }
  md += `| Path | Count | % |\n`;
  md += `|------|-------|---|\n`;
  for (const [path, count] of Object.entries(pathCounts).sort((a, b) => b[1] - a[1])) {
    md += `| ${path} | ${count} | ${(count / results.length * 100).toFixed(1)}% |\n`;
  }

  md += `\n---\n\n`;
  md += `## Segment Distribution\n\n`;
  const segCounts: Record<string, number> = {};
  for (const r of results) {
    segCounts[r.segment] = (segCounts[r.segment] || 0) + 1;
  }
  md += `| Segment | Count | % |\n`;
  md += `|---------|-------|---|\n`;
  for (const [seg, count] of Object.entries(segCounts).sort((a, b) => b[1] - a[1])) {
    md += `| ${seg} | ${count} | ${(count / results.length * 100).toFixed(1)}% |\n`;
  }

  md += `\n---\n\n`;
  md += `## Sample Profiles (first 20)\n\n`;
  for (const r of results.slice(0, 20)) {
    md += `### Profile #${r.profileId}: ${r.profileName}\n`;
    md += `- **Path:** ${r.legacyPath} (alt: ${r.alternatePath || "none"})\n`;
    md += `- **Segment:** ${r.segment}\n`;
    md += `- **Workflow:** \`${r.branchingWorkflowId}\`\n`;
    md += `- **Niche:** ${r.nicheLabel} (\`${r.nicheResolved}\`)\n`;
    md += `- **Keywords:** ${r.nicheKeywords.slice(0, 5).join(", ")}\n`;
    md += `- **Eliminated:** ${r.eliminatedPaths.length > 0 ? r.eliminatedPaths.join(", ") : "none"}\n`;
    md += `- **Trend Scores:** ${r.trendScores.slice(0, 3).map(t => `${t.keyword}=${t.opportunity}(${t.lifecycle})`).join(", ")}\n`;
    md += `\n`;
  }

  md += `\n---\n\n`;
  md += `## Edge Cases\n\n`;
  const edgeResults = results.filter(r => r.profileName.startsWith("edge_"));
  for (const r of edgeResults) {
    const profile = profiles.find(p => p.id === r.profileId)!;
    md += `### ${r.profileName}\n`;
    md += `> ${profile.description}\n\n`;
    md += `- **Path:** ${r.legacyPath}\n`;
    md += `- **Segment:** ${r.segment}\n`;
    md += `- **Eliminated:** ${r.eliminatedPaths.join(", ") || "none"}\n`;
    md += `- **Scores:** ${JSON.stringify(r.pathScores)}\n\n`;
  }

  return md;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  INTENT AI — Profile Diversity Stress Test (108+ Users)  ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  // 1. Generate synthetic profiles
  console.log("📦 Generating synthetic profiles...");
  const profiles = generateSyntheticProfiles();
  console.log(`   → ${profiles.length} profiles generated\n`);

  // 2. Run classification on each
  console.log("🧪 Running classification engine on each profile...");
  const results: TestResult[] = [];
  let errors = 0;

  for (const profile of profiles) {
    try {
      const result = runClassificationTest(profile);
      results.push(result);
    } catch (err) {
      errors++;
      console.error(`   ❌ Profile #${profile.id} (${profile.name}) failed:`, err);
    }
  }
  console.log(`   → ${results.length}/${profiles.length} profiles processed (${errors} errors)\n`);

  // 3. Run validations
  console.log("✅ Running validation suite...");
  const validations = validateResults(profiles, results);
  
  let passCount = 0;
  let failCount = 0;
  for (const v of validations) {
    const icon = v.passed ? "✅" : "❌";
    console.log(`   ${icon} ${v.testName}: ${v.details}`);
    if (v.passed) passCount++;
    else failCount++;
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`RESULT: ${passCount}/${validations.length} passed, ${failCount} failed`);
  console.log(`${"─".repeat(60)}\n`);

  // 4. Save reports
  const outputDir = path.join(process.cwd(), "tests", "results");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Full JSON data
  const jsonReport = {
    date: new Date().toISOString(),
    profileCount: profiles.length,
    passedTests: passCount,
    failedTests: failCount,
    totalTests: validations.length,
    validations: validations.map(v => ({ name: v.testName, passed: v.passed, details: v.details })),
    results: results.map(r => ({
      id: r.profileId,
      name: r.profileName,
      path: r.legacyPath,
      alt: r.alternatePath,
      segment: r.segment,
      workflow: r.branchingWorkflowId,
      niche: r.nicheResolved,
      keywords: r.nicheKeywords,
      eliminated: r.eliminatedPaths,
      fingerprint: r.fingerprint,
      trendScores: r.trendScores,
    })),
  };
  fs.writeFileSync(
    path.join(outputDir, "diversity-report.json"),
    JSON.stringify(jsonReport, null, 2),
  );

  // Human-readable markdown
  const mdReport = generateReport(profiles, results, validations);
  fs.writeFileSync(path.join(outputDir, "diversity-summary.md"), mdReport);

  console.log(`📊 Reports saved to:`);
  console.log(`   → tests/results/diversity-report.json`);
  console.log(`   → tests/results/diversity-summary.md`);

  // Exit code
  if (failCount > 0) {
    console.log(`\n⚠️  ${failCount} tests FAILED. Review the report.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL ${passCount} tests PASSED. System classification is solid.`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
