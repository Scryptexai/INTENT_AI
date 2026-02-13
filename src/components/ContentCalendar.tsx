/**
 * ContentCalendar Component — Visual 7-Day Calendar with Execution Templates
 * =============================================================================
 * P1 MAXIMAL: Interactive calendar grid with:
 * - Visual 7-day grid (Senin-Minggu)
 * - "Hari Ini" highlight with daily suggestion
 * - Click day → expand action steps + execution template
 * - Copy-paste ready templates
 * - Mark as done/skipped
 * - Week progression (generate next week)
 * - Save/persist across refresh
 * - Re-generate individual days
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, ChevronLeft, ChevronRight, Copy, Check, RefreshCw,
  Loader2, Sparkles, ChevronDown, ChevronUp, Clock, Target,
  CheckCircle2, XCircle, Star, Zap, Eye, ArrowRight,
} from "lucide-react";
import {
  generateWeeklyCalendar,
  regenerateSingleDay,
  saveCalendar,
  loadCalendar,
  updateDayStatus,
  getTodayDayIndex,
  getWeekCompletionRate,
  FORMAT_LABELS,
  type WeeklyCalendar,
  type DailyPlan,
  type CalendarProfileContext,
  type ContentFormat,
} from "@/services/contentCalendarService";

// ============================================================================
// PROPS
// ============================================================================

interface ContentCalendarProps {
  economicModel: string;
  subSector: string;
  niche: string;
  platform: string;
  contentPillars?: string[];
  trendBrief?: string;
}

// ============================================================================
// PILLAR COLORS
// ============================================================================

const PILLAR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  education:     { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/30" },
  educational:   { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/30" },
  entertainment: { bg: "bg-pink-500/10",    text: "text-pink-400",    border: "border-pink-500/30" },
  entertaining:  { bg: "bg-pink-500/10",    text: "text-pink-400",    border: "border-pink-500/30" },
  inspiration:   { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30" },
  inspiring:     { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30" },
  promotion:     { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  promotional:   { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  engagement:    { bg: "bg-indigo-500/10",  text: "text-indigo-400",  border: "border-indigo-500/30" },
  personal:      { bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/30" },
  behind_the_scenes: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
};

function getPillarColor(pillar: string) {
  const key = pillar.toLowerCase().replace(/[\s-]/g, "_");
  return PILLAR_COLORS[key] || { bg: "bg-muted/10", text: "text-muted-foreground", border: "border-border/30" };
}

// ============================================================================
// COMPONENT
// ============================================================================

const ContentCalendarView = ({
  economicModel,
  subSector,
  niche,
  platform,
  contentPillars,
  trendBrief,
}: ContentCalendarProps) => {
  // State
  const [calendar, setCalendar] = useState<WeeklyCalendar | null>(null);
  const [weekNumber, setWeekNumber] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null);
  const [showExecutionTemplate, setShowExecutionTemplate] = useState<number | null>(null);

  const todayIndex = useMemo(() => getTodayDayIndex(), []);

  const context: CalendarProfileContext = useMemo(() => ({
    economicModel,
    subSector,
    niche,
    platform,
    contentPillars,
  }), [economicModel, subSector, niche, platform, contentPillars]);

  // Load saved calendar on mount
  useEffect(() => {
    const saved = loadCalendar(weekNumber);
    if (saved) setCalendar(saved);
  }, [weekNumber]);

  // Generate full week calendar
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const cal = await generateWeeklyCalendar(context, weekNumber, trendBrief);
      setCalendar(cal);
      saveCalendar(cal);
    } catch (err) {
      console.error("Calendar generation failed:", err);
    }
    setIsGenerating(false);
  }, [context, weekNumber, trendBrief]);

  // Re-generate single day
  const handleRegenerateDay = useCallback(async (dayNumber: number) => {
    if (!calendar) return;
    setRegeneratingDay(dayNumber);
    try {
      const newDay = await regenerateSingleDay(context, dayNumber, calendar.weekTheme);
      if (newDay) {
        const updated = {
          ...calendar,
          days: calendar.days.map(d => d.day === dayNumber ? newDay : d),
        };
        setCalendar(updated);
        saveCalendar(updated);
      }
    } catch (err) {
      console.error("Day regen failed:", err);
    }
    setRegeneratingDay(null);
  }, [calendar, context]);

  // Mark day status
  const handleStatusChange = useCallback((dayNumber: number, status: "pending" | "done" | "skipped") => {
    if (!calendar) return;
    updateDayStatus(weekNumber, dayNumber, status);
    const updated = {
      ...calendar,
      days: calendar.days.map(d =>
        d.day === dayNumber ? { ...d, status } : d
      ),
    };
    setCalendar(updated);
  }, [calendar, weekNumber]);

  // Copy to clipboard
  const copyText = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  // Navigate weeks
  const goToWeek = useCallback((dir: -1 | 1) => {
    const newWeek = Math.max(1, Math.min(4, weekNumber + dir));
    setWeekNumber(newWeek);
    setExpandedDay(null);
  }, [weekNumber]);

  // Completion rate
  const completionRate = calendar ? getWeekCompletionRate(calendar) : 0;
  const doneCount = calendar?.days.filter(d => d.status === "done").length || 0;

  // ============================================================================
  // RENDER — No Calendar Yet
  // ============================================================================

  if (!calendar) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-black mb-2">📅 Content Calendar</h3>
          <p className="text-sm text-muted-foreground/70 mb-2 max-w-md mx-auto">
            AI akan buatkan kalender konten 7 hari yang <strong>hyper-spesifik</strong> untuk niche <strong>{niche}</strong> di <strong>{platform}</strong>.
          </p>
          <p className="text-xs text-muted-foreground/50 mb-6 max-w-sm mx-auto">
            Termasuk: topik, hook, caption siap copy-paste, hashtags, visual direction, action steps, dan execution template.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Calendar...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Minggu {weekNumber}
              </>
            )}
          </button>
        </div>
      </motion.div>
    );
  }

  // ============================================================================
  // RENDER — Calendar View
  // ============================================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Content Calendar — Minggu {weekNumber}
          </h3>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            🎯 {calendar.weekTheme}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Week navigation */}
          <button
            onClick={() => goToWeek(-1)}
            disabled={weekNumber <= 1}
            className="p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold px-2">W{weekNumber}</span>
          <button
            onClick={() => goToWeek(1)}
            disabled={weekNumber >= 4}
            className="p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Re-generate week */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Re-generate
          </button>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="p-3 rounded-xl bg-card/50 border border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground/60">
            Progress Minggu {weekNumber}
          </span>
          <span className="text-xs font-bold text-primary">
            {doneCount}/7 ✅ ({completionRate}%)
          </span>
        </div>
        <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
          />
        </div>
      </div>

      {/* ── 7-Day Grid ── */}
      <div className="grid grid-cols-1 gap-3">
        {calendar.days.map((day) => {
          const isToday = day.day === todayIndex;
          const isExpanded = expandedDay === day.day;
          const formatInfo = FORMAT_LABELS[day.contentType] || { emoji: "📄", label: day.contentType, duration: "" };
          const pillarColor = getPillarColor(day.pillar);
          const isDone = day.status === "done";
          const isSkipped = day.status === "skipped";

          return (
            <motion.div
              key={day.day}
              layout
              className={`rounded-xl border-2 transition-all overflow-hidden ${
                isToday
                  ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/10"
                  : isDone
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : isSkipped
                  ? "border-muted/30 bg-muted/5 opacity-60"
                  : "border-border/30 bg-card/50"
              }`}
            >
              {/* ── Day Header (always visible) ── */}
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                className="w-full p-4 text-left flex items-center gap-3"
              >
                {/* Day badge */}
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                  isToday ? "bg-primary text-white" : isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-muted/10 text-muted-foreground"
                }`}>
                  <span className="text-[10px] font-bold uppercase leading-none">
                    {day.dayName.substring(0, 3)}
                  </span>
                  <span className="text-lg font-black leading-none mt-0.5">
                    {day.day}
                  </span>
                </div>

                {/* Content info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-black uppercase">
                        Hari Ini
                      </span>
                    )}
                    <span className="text-sm font-bold truncate">{day.topic}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs">{formatInfo.emoji} {formatInfo.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${pillarColor.bg} ${pillarColor.text}`}>
                      {day.pillar}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {day.bestTime}
                    </span>
                  </div>
                </div>

                {/* Status + expand */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {isSkipped && <XCircle className="w-5 h-5 text-muted-foreground/40" />}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground/40" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
                  )}
                </div>
              </button>

              {/* ── Expanded Content ── */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-border/20 pt-4">

                      {/* Hook preview */}
                      <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <p className="text-xs font-bold text-yellow-500 mb-1">🪝 HOOK</p>
                        <p className="text-sm font-medium">{day.hook}</p>
                      </div>

                      {/* Action Steps */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground/60 uppercase mb-2 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          Action Steps — {formatInfo.label}
                        </p>
                        <div className="space-y-2">
                          {day.actionSteps.map((step) => (
                            <div
                              key={step.step}
                              className="flex gap-3 p-3 rounded-lg bg-muted/10 border border-border/20"
                            >
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                                {step.step}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{step.action}</p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  {step.tool && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
                                      🔧 {step.tool}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground/50">
                                    ⏱️ {step.timeEstimate}
                                  </span>
                                </div>
                                {step.tip && (
                                  <p className="text-[11px] text-amber-400/70 mt-1">
                                    💡 {step.tip}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Execution Template Toggle */}
                      <div>
                        <button
                          onClick={() => setShowExecutionTemplate(
                            showExecutionTemplate === day.day ? null : day.day
                          )}
                          className="w-full text-left p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" />
                              📋 Lihat Execution Template (Copy-Paste Ready)
                            </span>
                            {showExecutionTemplate === day.day ? (
                              <ChevronUp className="w-4 h-4 text-primary" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence>
                          {showExecutionTemplate === day.day && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 relative">
                                <button
                                  onClick={() => copyText(day.executionTemplate, `template-${day.day}`)}
                                  className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold shadow-md hover:bg-primary/90 transition-colors"
                                >
                                  {copiedKey === `template-${day.day}` ? (
                                    <><Check className="w-3 h-3" /> Copied!</>
                                  ) : (
                                    <><Copy className="w-3 h-3" /> Copy All</>
                                  )}
                                </button>
                                <div className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed bg-muted/10 p-4 rounded-lg border border-border/20 max-h-80 overflow-y-auto font-mono">
                                  {day.executionTemplate}
                                </div>
                              </div>

                              {/* Individual copy buttons */}
                              <div className="mt-2 flex flex-wrap gap-2">
                                {day.caption && (
                                  <button
                                    onClick={() => copyText(day.caption, `caption-${day.day}`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/20 text-[10px] font-bold hover:bg-muted/30 transition-colors"
                                  >
                                    {copiedKey === `caption-${day.day}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    Caption
                                  </button>
                                )}
                                {day.hashtags && (
                                  <button
                                    onClick={() => copyText(day.hashtags, `hashtags-${day.day}`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/20 text-[10px] font-bold hover:bg-muted/30 transition-colors"
                                  >
                                    {copiedKey === `hashtags-${day.day}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    Hashtags
                                  </button>
                                )}
                                {day.hook && (
                                  <button
                                    onClick={() => copyText(day.hook, `hook-${day.day}`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/20 text-[10px] font-bold hover:bg-muted/30 transition-colors"
                                  >
                                    {copiedKey === `hook-${day.day}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    Hook
                                  </button>
                                )}
                                {day.cta && (
                                  <button
                                    onClick={() => copyText(day.cta, `cta-${day.day}`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/20 text-[10px] font-bold hover:bg-muted/30 transition-colors"
                                  >
                                    {copiedKey === `cta-${day.day}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    CTA
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                        {/* Mark done */}
                        <button
                          onClick={() => handleStatusChange(day.day, isDone ? "pending" : "done")}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                            isDone
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-muted/20 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-400"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isDone ? "Done ✅" : "Mark Done"}
                        </button>

                        {/* Skip */}
                        <button
                          onClick={() => handleStatusChange(day.day, isSkipped ? "pending" : "skipped")}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                            isSkipped
                              ? "bg-red-500/20 text-red-400"
                              : "bg-muted/20 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {isSkipped ? "Skipped" : "Skip"}
                        </button>

                        {/* Re-generate this day */}
                        <button
                          onClick={() => handleRegenerateDay(day.day)}
                          disabled={regeneratingDay === day.day}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/20 text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 ml-auto"
                        >
                          {regeneratingDay === day.day ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Ganti Konten
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* ── Weekly Summary ── */}
      <div className="p-4 rounded-xl bg-card/50 border border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground/60 uppercase">
              Minggu {weekNumber} Summary
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {doneCount === 7
                ? "🎉 Semua konten minggu ini selesai! Generate minggu berikutnya?"
                : doneCount > 0
                ? `👊 ${doneCount}/7 selesai — keep going!`
                : "🚀 Belum ada yang selesai — mulai dari hari ini!"}
            </p>
          </div>
          {doneCount >= 5 && weekNumber < 4 && (
            <button
              onClick={() => {
                setWeekNumber(weekNumber + 1);
                setExpandedDay(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold shadow-md"
            >
              Minggu {weekNumber + 1}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ContentCalendarView;
