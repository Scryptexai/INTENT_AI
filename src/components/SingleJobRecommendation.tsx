/**
 * Single Job Recommendation — "1 Jalur Utama" Component
 * =====================================================
 * Fungsi: Menampilkan SATU rekomendasi job yang tegas, bukan 3 opsi.
 * Filosofi: "Mengurangi pilihan tidak relevan" sesuai INTENT_DOC.txt.
 *
 * UX Pattern:
 * 1. Tampilkan PRIMARY JOB dengan confidence tinggi
 * 2. Berikan alasan kenapa ini PILIHAN TERBAIK
 * 3. Sembunyikan 2 opsi lain di collapsible "Alternatif"
 * 4. Berikan CTA tegas: "Mulai jalur ini"
 */

import { useState } from "react";
import {
  Search, ChevronDown, ChevronUp, ExternalLink, Wrench, Compass,
  CheckCircle2, AlertCircle, TrendingUp, Clock, DollarSign,
  Zap, Info, X,
} from "lucide-react";
import type { JobRecommendation } from "@/services/jobResearchEngine";

// ============================================================================
// TYPES
// ============================================================================

interface SingleJobRecommendationProps {
  primaryJob: JobRecommendation;
  secondaryJob?: JobRecommendation;
  exploratoryJob?: JobRecommendation;
  profileAnalysis: string;
  marketContext: string;
  onAcceptPrimary?: () => void;
  onViewAlternatives?: () => void;
  filteredDataQuality?: number; // 0-100, dari noise filtering layer
  systemRecommendation?: string; // Dari noise filtering layer
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SingleJobRecommendation({
  primaryJob,
  secondaryJob,
  exploratoryJob,
  profileAnalysis,
  marketContext,
  onAcceptPrimary,
  onViewAlternatives,
  filteredDataQuality,
  systemRecommendation,
}: SingleJobRecommendationProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [dismissedSystemRec, setDismissedSystemRec] = useState(false);

  return (
    <div className="border border-border">
      {/* ── HEADER: Strong recommendation message ── */}
      <div className="py-4 px-5 border-b border-border bg-foreground/5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-foreground" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/50 mb-1">
              Jalur Utama Kamu
            </p>
            <p className="text-sm font-semibold text-foreground mb-1">
              {primaryJob.title}
            </p>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              Setelah menganalisis profil kamu + data real dari internet, ini adalah <strong>peluang terbaik</strong> yang sesuai dengan skill, kondisi, dan target kamu.
            </p>
          </div>
        </div>
      </div>

      {/* ── DATA QUALITY BANNER (dari noise filtering) ── */}
      {filteredDataQuality !== undefined && !dismissedSystemRec && (
        <div className={`py-3 px-5 border-b ${
          filteredDataQuality >= 80 ? "bg-green-500/10 border-green-500/20" :
          filteredDataQuality >= 60 ? "bg-yellow-500/10 border-yellow-500/20" :
          "bg-red-500/10 border-red-500/20"
        }`}>
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/50 mb-1">
                Validasi Data Kualitas
              </p>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                {systemRecommendation || `Data quality score: ${filteredDataQuality}/100`}
              </p>
            </div>
            <button onClick={() => setDismissedSystemRec(true)} className="shrink-0">
              <X className="w-3 h-3 text-muted-foreground/40" />
            </button>
          </div>
        </div>
      )}

      {/* ── PROFILE ANALYSIS ── */}
      <div className="py-4 px-5 border-b border-border/50">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-2">
          Kenapa jalur ini cocok untuk kamu
        </p>
        <p className="text-xs text-foreground/70 leading-relaxed">
          {profileAnalysis}
        </p>
      </div>

      {/* ── MARKET CONTEXT ── */}
      {marketContext && (
        <div className="py-3 px-5 border-b border-border/50 bg-muted/5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">
            Konteks market saat ini
          </p>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            {marketContext}
          </p>
        </div>
      )}

      {/* ── PRIMARY JOB CARD (FULL DETAIL) ── */}
      <div className="py-5 px-5">
        {/* Job header with demand badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/30 mb-1">
              Rekomendasi #1 — Paling cocok dengan profil kamu
            </p>
            <h3 className="text-base font-semibold text-foreground mb-2">
              {primaryJob.title}
            </h3>
          </div>
          {primaryJob.demandLevel && (
            <span className={`text-[9px] px-2 py-1 shrink-0 ${
              primaryJob.demandLevel === "tinggi" ? "bg-green-500/20 text-green-600" :
              primaryJob.demandLevel === "sedang" ? "bg-yellow-500/20 text-yellow-600" :
              "bg-muted/20 text-muted-foreground/60"
            }`}>
              Demand: {primaryJob.demandLevel}
            </span>
          )}
        </div>

        {/* WHY — Detailed explanation */}
        <div className="mb-4">
          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-2">
            Kenapa job ini cocok untuk kamu
          </p>
          <p className="text-xs text-foreground/70 leading-relaxed">
            {primaryJob.whyThisJob}
          </p>
        </div>

        {/* EVIDENCE — Data backing */}
        {primaryJob.evidence && (
          <div className="mb-4 py-3 px-4 bg-foreground/5 border-l-2 border-foreground/20">
            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">
              Bukti Data (bukan perkiraan)
            </p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              {primaryJob.evidence}
            </p>
          </div>
        )}

        {/* KEY METRICS GRID */}
        <div className="grid grid-cols-2 gap-px bg-border mb-4">
          <div className="bg-background py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground/40" />
              <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">
                Estimasi Income
              </p>
            </div>
            <p className="text-sm font-medium text-foreground">
              {primaryJob.incomeRange}
            </p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">
              Per bulan (realistis)
            </p>
          </div>

          <div className="bg-background py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />
              <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">
                Waktu ke Income Pertama
              </p>
            </div>
            <p className="text-sm font-medium text-foreground">
              {primaryJob.timeToFirstIncome}
            </p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">
              Estimasi realistis
            </p>
          </div>

          <div className="bg-background py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/40" />
              <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">
                Competitive Advantage
              </p>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">
              {primaryJob.competitiveAdvantage}
            </p>
          </div>

          <div className="bg-background py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground/40" />
              <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">
                Skill Gap & Risiko
              </p>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">
              {primaryJob.skillGap}
            </p>
          </div>
        </div>

        {/* TOOLS & PLATFORM */}
        <div className="mb-4">
          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-2">
            Tools & Platform yang dibutuhkan
          </p>
          <div className="flex flex-wrap gap-2">
            {primaryJob.requiredTools.map((tool, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 border border-border text-foreground/60">
                <Wrench className="w-3 h-3" />
                {tool}
              </span>
            ))}
            {primaryJob.bestPlatform && (
              <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 border border-foreground/20 text-foreground/70">
                <Compass className="w-3 h-3" />
                {primaryJob.bestPlatform}
              </span>
            )}
          </div>
        </div>

        {/* FIRST STEP — Actionable */}
        <div className="mb-4 p-4 bg-foreground/10 border-l-2 border-foreground">
          <p className="text-[10px] uppercase tracking-[0.12em] text-foreground/40 mb-2">
            Langkah pertama — Bisa dilakukan HARI INI
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {primaryJob.firstStep}
          </p>
        </div>

        {/* SUCCESS EXAMPLE */}
        {primaryJob.successExample && (
          <div className="mb-4 py-3 px-4 border border-border/50">
            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">
              Contoh sukses di bidang ini
            </p>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              {primaryJob.successExample}
            </p>
          </div>
        )}

        {/* RISK MITIGATION */}
        {primaryJob.riskMitigation && (
          <div className="py-3 px-4 border border-border/50 bg-muted/5">
            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">
              Risiko & cara mitigasinya
            </p>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              {primaryJob.riskMitigation}
            </p>
          </div>
        )}
      </div>

      {/* ── CTA: Strong action button ── */}
      <div className="py-4 px-5 border-t border-border bg-foreground/5">
        <button
          onClick={onAcceptPrimary}
          className="w-full cmd-primary group"
        >
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Mulai Jalur Ini — Sekarang</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
        <p className="text-[10px] text-center text-muted-foreground/40 mt-2">
          Klik untuk mulai eksekusi dengan roadmap yang sudah disiapkan
        </p>
      </div>

      {/* ── ALTERNATIVES (Collapsible) ── */}
      <div className="border-t border-border">
        <button
          onClick={() => {
            setShowAlternatives(!showAlternatives);
            if (!showAlternatives && onViewAlternatives) {
              onViewAlternatives();
            }
          }}
          className="w-full py-3 px-5 flex items-center justify-between hover:bg-muted/5 transition-colors"
        >
          <div className="flex items-center gap-2 text-left">
            <Search className="w-4 h-4 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground/50">
              {showAlternatives ? "Sembunyikan" : "Lihat"} opsi lain
            </p>
          </div>
          {showAlternatives ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground/30" />
          )}
        </button>

        {showAlternatives && (
          <div className="border-t border-border/50">
            {/* Warning message */}
            <div className="py-3 px-5 bg-yellow-500/5 border-b border-yellow-500/10">
              <p className="text-[10px] text-yellow-600/70 leading-relaxed">
                <strong>Catatan:</strong> Opsi di bawah ini adalah alternatif jika rekomendasi utama tidak cocok. Tapi <strong>rekomendasi utama sudah diuji dengan data paling kuat</strong> untuk profil kamu.
              </p>
            </div>

            {/* Secondary Job */}
            {secondaryJob && (
              <div className="py-4 px-5 border-b border-border/50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">
                      Alternatif #1
                    </p>
                    <h4 className="text-sm font-medium text-foreground/80">
                      {secondaryJob.title}
                    </h4>
                  </div>
                  {secondaryJob.demandLevel && (
                    <span className={`text-[9px] px-2 py-0.5 shrink-0 ${
                      secondaryJob.demandLevel === "tinggi" ? "bg-green-500/10 text-green-600/70" :
                      "bg-muted/10 text-muted-foreground/50"
                    }`}>
                      {secondaryJob.demandLevel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground/60 leading-relaxed mb-2">
                  {secondaryJob.whyThisJob}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] text-muted-foreground/40">Income</p>
                    <p className="text-xs text-foreground/70">{secondaryJob.incomeRange}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground/40">Timeline</p>
                    <p className="text-xs text-foreground/70">{secondaryJob.timeToFirstIncome}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Exploratory Job */}
            {exploratoryJob && (
              <div className="py-4 px-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 mb-1">
                      Opsi Eksploratif
                    </p>
                    <h4 className="text-sm font-medium text-foreground/80">
                      {exploratoryJob.title}
                    </h4>
                  </div>
                  {exploratoryJob.demandLevel && (
                    <span className="text-[9px] px-2 py-0.5 bg-muted/10 text-muted-foreground/50">
                      {exploratoryJob.demandLevel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground/60 leading-relaxed mb-2">
                  {exploratoryJob.whyThisJob}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] text-muted-foreground/40">Income</p>
                    <p className="text-xs text-foreground/70">{exploratoryJob.incomeRange}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground/40">Timeline</p>
                    <p className="text-xs text-foreground/70">{exploratoryJob.timeToFirstIncome}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
