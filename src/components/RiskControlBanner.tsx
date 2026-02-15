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
      className="py-5 px-5 border border-foreground/20 relative"
    >
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-foreground/60 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
            ⏰ {daysLeft > 0 ? `${daysLeft} Hari Tersisa` : "Batas 30 Hari Tercapai"}
          </p>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Sudah {daysSinceStart} hari sejak kamu mulai, dan belum ada validasi market.
            {daysLeft > 0
              ? " Ini bukan berarti gagal — tapi ini sinyal untuk evaluasi serius. Gunakan sisa waktu untuk test market yang lebih fokus, atau pertimbangkan pivot."
              : " Saatnya ambil keputusan: pivot ke jalur baru, adjust niche, atau double down dengan strategi berbeda."}
          </p>
          <div className="flex gap-2 mt-3">
            <Link
              to="/onboarding"
              className="cmd-action text-xs"
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
      className="py-5 px-5 border border-border"
    >
      <div className="flex items-start gap-3">
        <TrendingDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
            📉 {noMarketWeeks} Minggu Tanpa Respon Market
          </p>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Market belum merespon selama {noMarketWeeks} minggu berturut-turut. Ini bisa berarti:
            niche terlalu luas, audience belum tepat, atau platform yang dipilih kurang sesuai.
          </p>
          <p className="text-xs text-muted-foreground/60 leading-relaxed mt-1">
            <strong>Opsi kamu:</strong> (1) Tweak niche — ubah sudut pandang atau target audience,
            (2) Ganti platform — coba channel distribusi berbeda,
            (3) Switch jalur — mungkin jalur lain lebih cocok.
          </p>
          <div className="flex gap-2 mt-3">
            {onSwitchPath && (
              <button
                onClick={onSwitchPath}
                className="cmd-action text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                Switch Jalur
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
      className={`py-5 px-5 border relative ${
        isStruggling
          ? "border-foreground/25"
          : isMixed
          ? "border-border"
          : "border-border/50"
      }`}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-start gap-3">
        <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">
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
      className="py-4 px-5 border border-border/50"
    >
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0">{msg.emoji}</span>
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
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
        className="cmd-action text-xs"
      >
        <RefreshCw className="w-3 h-3" />
        Switch Jalur
      </button>
    );
  }

  return (
    <div className="py-5 px-5 border border-border">
      <div className="flex items-start gap-3">
        <Target className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
            🔄 Switch Path
          </p>
          <p className="text-xs text-foreground/60 leading-relaxed mb-3">
            Ganti jalur bukan berarti menyerah. Semua skill yang sudah kamu pelajari
            tetap berlaku. Kamu hanya memilih arah yang lebih cocok berdasarkan data.
            {alternatePath && (
              <span className="block mt-1 text-foreground/50">
                Jalur alternatif yang disarankan saat profiling: <strong>{alternatePath}</strong>
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
                className="cmd-action text-xs"
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
                <p className="text-xs text-muted-foreground/50">Yakin switch? Progressmu akan di-reset.</p>
                <button
                  onClick={onSwitch}
                  className="cmd-primary text-xs"
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
