/**
 * UpgradePrompt — Shown when free users hit a gated feature
 * ===========================================================
 * Beautiful, non-intrusive prompt to upgrade to Pro.
 * Can be used inline (card) or as a modal-style overlay.
 */

import { motion } from "framer-motion";
import { Crown, Sparkles, ArrowRight, X } from "lucide-react";
import { UPGRADE_FEATURES } from "@/services/planGating";

interface UpgradePromptProps {
  feature: string;         // key from UPGRADE_FEATURES
  reason?: string;         // custom reason text
  onDismiss?: () => void;  // optional dismiss handler
  compact?: boolean;       // compact inline mode
}

const UpgradePrompt = ({ feature, reason, onDismiss, compact = false }: UpgradePromptProps) => {
  const featureInfo = UPGRADE_FEATURES[feature] || {
    title: "Fitur Pro",
    description: "Fitur ini hanya tersedia untuk Pro plan.",
    icon: "⭐",
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-primary/5 border border-primary/15"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{featureInfo.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              {featureInfo.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {reason || featureInfo.description}
            </p>
          </div>
          <button
            onClick={() => alert("Upgrade ke Pro — segera hadir!")}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Crown className="w-3 h-3" />
            Upgrade
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative p-6 rounded-2xl bg-card border border-primary/15 max-w-md mx-auto"
    >
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground/40 hover:text-foreground/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <span className="text-3xl">{featureInfo.icon}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-3">
          <Crown className="w-3 h-3" />
          Pro Feature
        </div>

        <h3 className="text-lg font-bold mb-2">{featureInfo.title}</h3>
        <p className="text-sm text-muted-foreground mb-1">
          {reason || featureInfo.description}
        </p>

        {/* Pro benefits mini-list */}
        <div className="mt-4 mb-6 space-y-2 text-left">
          {[
            "AI personalized tasks & niche recommendation",
            "Weekly AI feedback & coaching",
            "Progress adaptation engine",
            "Unlimited re-profiling",
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground/70">
              <Sparkles className="w-3 h-3 text-primary/50 shrink-0" />
              {benefit}
            </div>
          ))}
        </div>

        <button
          onClick={() => alert("Upgrade ke Pro — segera hadir!")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all cursor-pointer"
        >
          <Crown className="w-4 h-4" />
          Upgrade ke Pro
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[10px] text-muted-foreground/40 mt-3">
          7-hari free trial • Bisa cancel kapan saja
        </p>
      </div>
    </motion.div>
  );
};

export default UpgradePrompt;
