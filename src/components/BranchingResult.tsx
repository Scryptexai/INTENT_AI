/**
 * BranchingResult — Result display for branching profiling
 * ===========================================================
 * Shows the full path: Model → Sub-sector → Niche → Platform → Workflow
 * + AI personalization + next actions
 */

import { motion } from "framer-motion";
import {
  Target,
  Clock,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Wrench,
  Users,
  Lightbulb,
  Zap,
  ArrowRight,
  MapPin,
  Layers,
} from "lucide-react";
import type { PathId } from "@/utils/profilingConfig";
import { getPathTemplate } from "@/utils/pathTemplates";
import type { SubSpecialization } from "@/utils/pathSpecialization";
import {
  ECONOMIC_MODELS,
  getSubSectors,
  getNiches,
  getPlatforms,
  type BranchingProfileResult,
} from "@/utils/branchingProfileConfig";

interface BranchingResultProps {
  profile: BranchingProfileResult;
  whyText: string;
  nicheSuggestion?: string;
  subSpec?: SubSpecialization | null;
  onStartPath: (pathId: PathId) => void;
  onReset: () => void;
}

const BranchingResult = ({
  profile,
  whyText,
  nicheSuggestion,
  subSpec,
  onStartPath,
  onReset,
}: BranchingResultProps) => {
  const modelInfo = ECONOMIC_MODELS.find((m) => m.id === profile.economicModel);
  const subSectorInfo = getSubSectors(profile.economicModel).find((s) => s.id === profile.subSector);
  const nicheInfo = getNiches(profile.subSector).find((n) => n.id === profile.niche);
  const platformInfo = getPlatforms(profile.economicModel).find((p) => p.id === profile.platform);
  const pathTemplate = getPathTemplate(profile.legacyPathId);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 mb-4">
          <Target className="w-3.5 h-3.5" />
          JALUR KAMU SUDAH DITENTUKAN
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-2">
          {subSpec?.title || pathTemplate?.title || modelInfo?.label || "Your Path"}
        </h1>
        <p className="text-sm text-muted-foreground/70">
          Berdasarkan profil branching kamu, ini adalah jalur paling realistis
        </p>
      </motion.div>

      {/* Path Breadcrumb — Visual Flow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl border border-primary/20 bg-primary/[0.03]"
      >
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Path Map
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Model */}
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-lg">{modelInfo?.emoji}</span>
            <span className="text-sm font-bold text-primary">{modelInfo?.label}</span>
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />

          {/* Sub-sector */}
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-500/10 border border-slate-500/20">
            <span className="text-lg">{subSectorInfo?.emoji}</span>
            <span className="text-sm font-bold text-slate-300">{subSectorInfo?.label}</span>
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />

          {/* Niche */}
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-500/10 border border-slate-500/20">
            <span className="text-lg">{nicheInfo?.emoji || "🎯"}</span>
            <span className="text-sm font-bold text-slate-300">{nicheInfo?.label || profile.niche}</span>
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />

          {/* Platform */}
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-lg">{platformInfo?.emoji || "🌐"}</span>
            <span className="text-sm font-bold text-emerald-400">{platformInfo?.label || profile.platform}</span>
          </div>
        </div>
      </motion.div>

      {/* Why This Path — AI Personalized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 md:p-8 rounded-2xl border border-primary/20 bg-card"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{modelInfo?.emoji || "🚀"}</span>
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Model: {modelInfo?.label}
            </span>
            <h2 className="text-2xl font-black">
              {subSectorInfo?.label} → {nicheInfo?.label || profile.niche}
            </h2>
          </div>
        </div>

        <p className="text-muted-foreground/80 text-sm leading-relaxed mb-6">
          {modelInfo?.subtitle}
        </p>

        {/* Why text */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-primary/80 uppercase tracking-wider mb-1">
                Kenapa ini cocok untuk kamu?
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {whyText}
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Specialization */}
        {subSpec && (
          <div className="p-5 rounded-xl bg-primary/[0.03] border border-primary/10 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{subSpec.emoji}</span>
              <div>
                <p className="text-[10px] font-bold text-primary/80 uppercase tracking-wider">
                  SPESIALISASI KAMU
                </p>
                <h3 className="text-lg font-black text-foreground">
                  {subSpec.title}
                </h3>
              </div>
            </div>

            <p className="text-sm text-foreground/70 leading-relaxed mb-4">
              {subSpec.description}
            </p>

            {/* Examples */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Yang bisa kamu kerjakan:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {subSpec.examples.map((ex, i) => (
                  <span
                    key={i}
                    className="inline-block px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/10 text-xs text-foreground/70"
                  >
                    {ex}
                  </span>
                ))}
              </div>
            </div>

            {/* Tools & Platform */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> Tools
                </p>
                <div className="space-y-1">
                  {subSpec.tools.map((tool, i) => (
                    <p key={i} className="text-xs text-foreground/60">• {tool}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Target
                </p>
                <p className="text-xs text-foreground/60">{subSpec.targetAudience}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  Platform: {subSpec.primaryPlatform}
                </p>
              </div>
            </div>

            {/* Income & Why */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-[10px] font-bold text-emerald-400/80 uppercase mb-0.5 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Estimasi Income
                </p>
                <p className="text-xs font-semibold text-foreground/80">{subSpec.incomeEstimate}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <p className="text-[10px] font-bold text-amber-400/80 uppercase mb-0.5 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Kenapa Works
                </p>
                <p className="text-xs text-foreground/70">{subSpec.whyThisWorks}</p>
              </div>
            </div>
          </div>
        )}

        {/* Context Scores Summary */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[
            { label: "Waktu", value: profile.contextScores.time, max: 4, emoji: "⏰" },
            { label: "Modal", value: profile.contextScores.capital, max: 3, emoji: "💰" },
            { label: "Risiko", value: profile.contextScores.risk, max: 4, emoji: "🎯" },
            { label: "Skill", value: profile.contextScores.skillLevel, max: 4, emoji: "⚡" },
            { label: "Audience", value: profile.contextScores.audience, max: 4, emoji: "👥" },
          ].map((metric) => (
            <div key={metric.label} className="p-2 rounded-xl bg-muted/20 text-center">
              <span className="text-sm">{metric.emoji}</span>
              <p className="text-[10px] text-muted-foreground/60 uppercase mt-1">
                {metric.label}
              </p>
              <div className="mt-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(metric.value / metric.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 30-day overview */}
        {pathTemplate && (
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-3">📅 30-Day Roadmap</h3>
            <div className="space-y-2">
              {pathTemplate.weeklyPlan.map((week) => (
                <div
                  key={week.week}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/10"
                >
                  <span className="text-xs font-bold text-primary/60 bg-primary/5 px-2 py-1 rounded-md shrink-0">
                    W{week.week}
                  </span>
                  <span className="text-sm font-medium">{week.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Niche Suggestion */}
        {nicheSuggestion && (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-6">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-1">
                  🎯 Rekomendasi AI
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {nicheSuggestion}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="space-y-3">
          <button
            onClick={() => onStartPath(profile.legacyPathId)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-white font-bold text-base hover:brightness-110 transition-all"
          >
            Mulai 30-Day Roadmap
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              // Navigate to workspace after starting path
              onStartPath(profile.legacyPathId);
              window.location.href = "/workspace";
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-primary/30 text-primary font-bold text-sm hover:bg-primary/5 transition-all"
          >
            <Zap className="w-4 h-4" />
            Langsung ke Execution Workspace
          </button>
        </div>
      </motion.div>

      {/* Psychological safety */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center"
      >
        <p className="text-xs text-amber-400/70">
          ⚠️ Jika dalam 30 hari tidak ada validasi, pertimbangkan pivot. Sistem
          ini akan bantu kamu evaluasi.
        </p>
      </motion.div>

      {/* Reset */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Ulangi profiling
        </button>
      </div>
    </div>
  );
};

export default BranchingResult;
