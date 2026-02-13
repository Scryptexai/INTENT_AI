/**
 * RiskControlBanner — Psychological Safety & Risk Control UI
 * ==============================================================
 * Phase 17: Shows contextual warnings, reality checks,
 * anti-sunk cost messaging, and friction-free switch path flow.
 *
 * Components:
 *   - Day25Warning: 30-day no-validation warning
 *   - PivotSuggestion: market_response = false for 2+ weeks
 *   - RealityCheck: honest progress assessment at week 3-4
 *   - AntiSunkCost: normalize pivoting, remove guilt
 *   - SwitchPathButton: friction-free path switching
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  TrendingDown,
  Lightbulb,
  Shield,
  Clock,
  Target,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { RiskSignals } from "@/services/profileService";
import { getAntiSunkCostMessage } from "@/services/profileService";

// ============================================================================
// DAY 25 WARNING — 30-day deadline approaching, no market validation
// ============================================================================

export function Day25Warning({
  daysSinceStart,
  onDismiss,
}: {
  daysSinceStart: number;
  onDismiss?: () => void;
}) {
  const daysLeft = 30 - daysSinceStart;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 relative"
    >
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-red-400/50 hover:text-red-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-400 mb-1">
            ⏰ {daysLeft > 0 ? `${daysLeft} Hari Tersisa` : "Batas 30 Hari Tercapai"}
          </p>
          <p className="text-xs text-red-300/70 leading-relaxed">
            Sudah {daysSinceStart} hari sejak kamu mulai, dan belum ada validasi market.
            {daysLeft > 0
              ? " Ini bukan berarti gagal — tapi ini sinyal untuk evaluasi serius. Gunakan sisa waktu untuk test market yang lebih fokus, atau pertimbangkan pivot."
              : " Saatnya ambil keputusan: pivot ke jalur baru, adjust niche, atau double down dengan strategi berbeda."}
          </p>
          <div className="flex gap-2 mt-3">
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Evaluasi Ulang
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// PIVOT SUGGESTION — market_response = false for 2+ weeks
// ============================================================================

export function PivotSuggestion({
  noMarketWeeks,
  alternatePath,
  onSwitchPath,
}: {
  noMarketWeeks: number;
  alternatePath?: string | null;
  onSwitchPath?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <TrendingDown className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-400 mb-1">
            📉 {noMarketWeeks} Minggu Tanpa Respon Market
          </p>
          <p className="text-xs text-amber-300/70 leading-relaxed">
            Market belum merespon selama {noMarketWeeks} minggu berturut-turut. Ini bisa berarti:
            niche terlalu luas, audience belum tepat, atau platform yang dipilih kurang sesuai.
          </p>
          <p className="text-xs text-amber-300/70 leading-relaxed mt-1">
            <strong>Opsi kamu:</strong> (1) Tweak niche — ubah sudut pandang atau target audience,
            (2) Ganti platform — coba channel distribusi berbeda,
            (3) Switch jalur — mungkin jalur lain lebih cocok.
          </p>
          <div className="flex gap-2 mt-3">
            {onSwitchPath && (
              <button
                onClick={onSwitchPath}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                Switch Jalur (Tanpa Rasa Bersalah)
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// REALITY CHECK — week 3-4 honest progress assessment
// ============================================================================

export function RealityCheck({
  currentWeek,
  completionRate,
  hasAnyMarketResponse,
  daysSinceStart,
}: {
  currentWeek: number;
  completionRate: number;
  hasAnyMarketResponse: boolean;
  daysSinceStart: number;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  // Determine reality level
  const isStruggling = completionRate < 0.4 && !hasAnyMarketResponse;
  const isMixed = completionRate >= 0.4 && completionRate < 0.7 && !hasAnyMarketResponse;
  const isOnTrack = completionRate >= 0.7 || hasAnyMarketResponse;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-5 rounded-xl border relative ${
        isStruggling
          ? "bg-red-500/5 border-red-500/15"
          : isMixed
          ? "bg-amber-500/5 border-amber-500/15"
          : "bg-emerald-500/5 border-emerald-500/15"
      }`}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isStruggling ? "bg-red-500/20" : isMixed ? "bg-amber-500/20" : "bg-emerald-500/20"
        }`}>
          <Shield className={`w-5 h-5 ${
            isStruggling ? "text-red-400" : isMixed ? "text-amber-400" : "text-emerald-400"
          }`} />
        </div>
        <div>
          <p className={`text-sm font-bold mb-2 ${
            isStruggling ? "text-red-400" : isMixed ? "text-amber-400" : "text-emerald-400"
          }`}>
            🪞 Reality Check — Minggu {currentWeek}
          </p>

          {isStruggling ? (
            <>
              <p className="text-xs text-foreground/70 leading-relaxed mb-2">
                Jujur: completion {Math.round(completionRate * 100)}% dan belum ada respon market setelah {daysSinceStart} hari.
                Ini <strong>bukan berarti kamu gagal</strong> — ini berarti jalur ini mungkin bukan yang paling cocok
                dengan situasimu saat ini.
              </p>
              <p className="text-xs text-foreground/70 leading-relaxed">
                💡 <strong>Fakta:</strong> Orang yang switch path lebih awal rata-rata 2x lebih cepat menemukan
                product-market fit dibanding yang force-continue. Pertimbangkan switch sekarang.
              </p>
            </>
          ) : isMixed ? (
            <>
              <p className="text-xs text-foreground/70 leading-relaxed mb-2">
                Progress {Math.round(completionRate * 100)}% — lumayan, tapi market belum merespon.
                Minggu ini kritis: fokus pada <strong>validasi market</strong>, bukan perfecting produk/konten.
              </p>
              <p className="text-xs text-foreground/70 leading-relaxed">
                💡 <strong>Action:</strong> Kirim/post 1 hal hari ini, ukur reaksi. Lebih baik 70% produk yang di-test
                daripada 100% produk yang tidak pernah diluncurkan.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-foreground/70 leading-relaxed mb-2">
                Bagus! Completion {Math.round(completionRate * 100)}%{hasAnyMarketResponse ? " dan sudah ada respon market" : ""}.
                Kamu di jalur yang benar.
              </p>
              <p className="text-xs text-foreground/70 leading-relaxed">
                💡 <strong>Next level:</strong> Sekarang saatnya scale up. Double down di channel yang sudah kerja,
                dan mulai sistemkan prosesnya supaya bisa repeat.
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// ANTI-SUNK COST MESSAGE — normalize pivoting
// ============================================================================

export function AntiSunkCostCard({
  weekNumber,
}: {
  weekNumber: number;
}) {
  const msg = getAntiSunkCostMessage(weekNumber);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{msg.emoji}</span>
        <div>
          <p className="text-xs font-bold text-indigo-400/80 uppercase tracking-wider mb-1">
            {msg.title}
          </p>
          <p className="text-xs text-foreground/70 leading-relaxed">
            {msg.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SWITCH PATH BUTTON — friction-free path switching
// ============================================================================

export function SwitchPathButton({
  onSwitch,
  alternatePath,
  compact = false,
}: {
  onSwitch: () => void;
  alternatePath?: string | null;
  compact?: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (compact) {
    return (
      <button
        onClick={onSwitch}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
      >
        <RefreshCw className="w-3 h-3" />
        Switch Jalur
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-primary/[0.03] border border-primary/10">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-indigo-400 mb-1">
            🔄 Switch Path — Tanpa Rasa Bersalah
          </p>
          <p className="text-xs text-foreground/60 leading-relaxed mb-3">
            Ganti jalur bukan berarti menyerah. Semua skill yang sudah kamu pelajari
            tetap berlaku. Kamu hanya memilih arah yang lebih cocok berdasarkan data.
            {alternatePath && (
              <span className="block mt-1 text-indigo-400/70">
                💡 Jalur alternatif yang disarankan saat profiling: <strong>{alternatePath}</strong>
              </span>
            )}
          </p>

          <AnimatePresence>
            {!showConfirm ? (
              <motion.button
                key="trigger"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Mulai Profiling Ulang
              </motion.button>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <p className="text-xs text-foreground/50">Yakin switch? Progressmu akan di-reset.</p>
                <button
                  onClick={onSwitch}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition-all"
                >
                  Ya, Switch
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Batal
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
