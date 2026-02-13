/**
 * PathResult — "Jalur Paling Realistis Untuk Kamu"
 * ===================================================
 * Shows: 1 primary path + 1 alternative (max).
 * Also shows: what to IGNORE (eliminated paths).
 * 30-day timeline ringkas.
 * Single CTA: "Mulai Jalur Ini"
 */

import { motion } from "framer-motion";
import {
  Target,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Ban,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Wrench,
  Users,
  Lightbulb,
  Zap,
} from "lucide-react";
import type { PathTemplate } from "@/utils/pathTemplates";
import type { PathId, ProfileScores } from "@/utils/profilingConfig";
import { getPathTemplate } from "@/utils/pathTemplates";
import type { SubSpecialization } from "@/utils/pathSpecialization";

interface PathResultProps {
  primaryPath: PathTemplate;
  alternatePath: PathTemplate | null;
  eliminatedPaths: PathId[];
  scores: ProfileScores;
  whyText: string;
  nicheSuggestion?: string;
  subSpec?: SubSpecialization | null;
  onStartPath: (pathId: PathId) => void;
  onReset: () => void;
}

const PathResult = ({
  primaryPath,
  alternatePath,
  eliminatedPaths,
  scores,
  whyText,
  nicheSuggestion,
  subSpec,
  onStartPath,
  onReset,
}: PathResultProps) => {
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
          HASIL PROFILING
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-2">
          Jalur Paling Realistis Untuk Kamu
        </h1>
      </motion.div>

      {/* Primary path card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-6 md:p-8 rounded-2xl border border-primary/20 bg-card"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{primaryPath.emoji}</span>
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Jalur Utama
            </span>
            <h2 className="text-2xl font-black">{primaryPath.title}</h2>
          </div>
        </div>

        <p className="text-muted-foreground/80 text-sm leading-relaxed mb-6">
          {primaryPath.tagline}
        </p>

        {/* Why this path */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-primary/80 uppercase tracking-wider mb-1">
                Kenapa ini cocok?
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {whyText}
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Specialization Card — SPESIFIK berdasarkan profil */}
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

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-muted/20 text-center">
            <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground/60 uppercase">
              Uang dari
            </p>
            <p className="text-xs font-semibold mt-0.5">
              {primaryPath.moneySource.split(" ").slice(0, 4).join(" ")}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-muted/20 text-center">
            <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground/60 uppercase">
              Waktu test
            </p>
            <p className="text-xs font-semibold mt-0.5">
              {primaryPath.timeToTest}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-muted/20 text-center">
            <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground/60 uppercase">
              Risiko
            </p>
            <p className="text-xs font-semibold mt-0.5">
              {primaryPath.riskIfFail.split(" — ")[0]}
            </p>
          </div>
        </div>

        {/* 30-day overview */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3">📅 30-Day Timeline</h3>
          <div className="space-y-2">
            {primaryPath.weeklyPlan.map((week) => (
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

        {/* AI Niche Suggestion */}
        {nicheSuggestion && (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-6">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-1">
                  🎯 Niche yang Direkomendasikan AI
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {nicheSuggestion}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => onStartPath(primaryPath.id)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-white font-bold text-base hover:brightness-110 transition-all"
        >
          Mulai Jalur Ini
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>

      {/* What to IGNORE */}
      {eliminatedPaths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-xl bg-red-500/5 border border-red-500/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <Ban className="w-4 h-4 text-red-400/70" />
            <span className="text-xs font-bold text-red-400/80 uppercase tracking-wider">
              Yang harus kamu abaikan sekarang
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {eliminatedPaths.map((pathId) => {
              const p = getPathTemplate(pathId);
              if (!p) return null;
              return (
                <span
                  key={pathId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-red-300/70"
                >
                  {p.emoji} {p.title}
                </span>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Alternative path (compact) */}
      {alternatePath && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-5 rounded-xl border border-border/30 bg-card/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{alternatePath.emoji}</span>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                  Alternatif
                </span>
                <h3 className="text-sm font-bold">{alternatePath.title}</h3>
                <p className="text-xs text-muted-foreground/60">
                  {alternatePath.tagline}
                </p>
              </div>
            </div>
            <button
              onClick={() => onStartPath(alternatePath.id)}
              className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors shrink-0"
            >
              Pilih ini →
            </button>
          </div>
        </motion.div>
      )}

      {/* Psychological safety */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
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

export default PathResult;
