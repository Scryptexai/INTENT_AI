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
  education:     { bg: "bg-foreground/5",    text: "text-foreground/60",    border: "border-foreground/15" },
  educational:   { bg: "bg-foreground/5",    text: "text-foreground/60",    border: "border-foreground/15" },
  entertainment: { bg: "bg-foreground/[0.03]", text: "text-foreground/50", border: "border-foreground/10" },
  entertaining:  { bg: "bg-foreground/[0.03]", text: "text-foreground/50", border: "border-foreground/10" },
  inspiration:   { bg: "bg-foreground/[0.04]", text: "text-foreground/55", border: "border-foreground/12" },
  inspiring:     { bg: "bg-foreground/[0.04]", text: "text-foreground/55", border: "border-foreground/12" },
  promotion:     { bg: "bg-foreground/[0.06]", text: "text-foreground/65", border: "border-foreground/18" },
  promotional:   { bg: "bg-foreground/[0.06]", text: "text-foreground/65", border: "border-foreground/18" },
  engagement:    { bg: "bg-foreground/[0.03]", text: "text-foreground/50", border: "border-foreground/10" },
  personal:      { bg: "bg-muted/10",   text: "text-muted-foreground/60",   border: "border-border/30" },
  behind_the_scenes: { bg: "bg-muted/10", text: "text-muted-foreground/60", border: "border-border/30" },
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
        className="border border-border border-dashed py-12 px-8"
      >
        <div className="text-center">
          <Calendar className="w-6 h-6 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-2">Content Calendar</h3>
          <p className="text-xs text-muted-foreground/60 mb-2 max-w-md mx-auto leading-relaxed">
            AI akan buatkan kalender konten 7 hari yang hyper-spesifik untuk niche <strong>{niche}</strong> di <strong>{platform}</strong>.
          </p>
          <p className="text-[10px] text-muted-foreground/40 mb-6 max-w-sm mx-auto leading-relaxed">
            Termasuk: topik, hook, caption siap copy-paste, hashtags, visual direction, action steps, dan execution template.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="cmd-primary text-xs disabled:opacity-40"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating Calendar...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
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
          <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Content Calendar — Minggu {weekNumber}
          </h3>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            {calendar.weekTheme}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Week navigation */}
          <button
            onClick={() => goToWeek(-1)}
            disabled={weekNumber <= 1}
            className="p-2 border border-border hover:border-foreground/20 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-medium px-2 text-muted-foreground">W{weekNumber}</span>
          <button
            onClick={() => goToWeek(1)}
            disabled={weekNumber >= 4}
            className="p-2 border border-border hover:border-foreground/20 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Re-generate week */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="cmd-action text-[10px] disabled:opacity-40"
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
      <div className="py-3 px-5 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40">
            Progress Minggu {weekNumber}
          </span>
          <span className="text-[10px] text-foreground/60">
            {doneCount}/7 ({completionRate}%)
          </span>
        </div>
        <div className="h-px bg-border relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            className="absolute top-0 left-0 h-px bg-foreground/50"
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
              className={`border transition-all overflow-hidden ${
                isToday
                  ? "border-foreground/30"
                  : isDone
                  ? "border-border/50 opacity-60"
                  : isSkipped
                  ? "border-border/20 opacity-40"
                  : "border-border"
              }`}
            >
              {/* ── Day Header (always visible) ── */}
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                className="w-full p-4 text-left flex items-center gap-3"
              >
                {/* Day badge */}
                <div className={`w-10 h-10 border flex flex-col items-center justify-center flex-shrink-0 ${
                  isToday ? "border-foreground/30 bg-foreground/5 text-foreground" : isDone ? "border-border bg-muted/5 text-muted-foreground" : "border-border/30 text-muted-foreground"
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
                      <span className="px-2 py-0.5 border border-foreground/20 text-foreground/60 text-[9px] font-medium uppercase">
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
                  {isDone && <CheckCircle2 className="w-4 h-4 text-foreground/40" />}
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
                      <div className="py-3 px-4 border-l-2 border-foreground/15 bg-foreground/[0.02]">
                        <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Hook</p>
                        <p className="text-sm text-foreground/80">{day.hook}</p>
                      </div>

                      {/* Action Steps */}
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-2 flex items-center gap-1.5">
                          <Target className="w-3 h-3" />
                          Action Steps — {formatInfo.label}
                        </p>
                        <div className="space-y-2">
                          {day.actionSteps.map((step) => (
                            <div
                              key={step.step}
                              className="flex gap-3 py-3 px-3 border border-border/30"
                            >
                              <div className="w-5 h-5 border border-foreground/15 flex items-center justify-center text-[10px] font-medium text-foreground/50 flex-shrink-0 mt-0.5">
                                {step.step}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-foreground/70">{step.action}</p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  {step.tool && (
                                    <span className="text-[10px] px-1.5 py-0.5 border border-border text-foreground/50">
                                      🔧 {step.tool}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground/50">
                                    ⏱️ {step.timeEstimate}
                                  </span>
                                </div>
                                {step.tip && (
                                  <p className="text-[10px] text-muted-foreground/50 mt-1">
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
                          className="w-full text-left py-3 px-4 border border-border hover:border-foreground/20 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-[0.12em] text-foreground/60 flex items-center gap-1.5">
                              <Eye className="w-3 h-3" />
                              Execution Template (Copy-Paste Ready)
                            </span>
                            {showExecutionTemplate === day.day ? (
                              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />
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
                                  className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2.5 py-1.5 border border-foreground/20 bg-background text-foreground/60 text-[10px] font-medium hover:border-foreground/40 transition-colors"
                                >
                                  {copiedKey === `template-${day.day}` ? (
                                    <><Check className="w-3 h-3" /> Copied!</>
                                  ) : (
                                    <><Copy className="w-3 h-3" /> Copy All</>
                                  )}
                                </button>
                                <div className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed bg-muted/5 p-4 border border-border/20 max-h-80 overflow-y-auto font-mono">
                                  {day.executionTemplate}
                                </div>
                              </div>

                              {/* Individual copy buttons */}
                              <div className="mt-2 flex flex-wrap gap-2">
                                {day.caption && (
                                  <button
                                    onClick={() => copyText(day.caption, `caption-${day.day}`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border text-[10px] font-medium hover:border-foreground/20 transition-colors"
                                  >
                                    {copiedKey === `caption-${day.day}` ? <Check className="w-3 h-3 text-foreground/50" /> : <Copy className="w-3 h-3" />}
                                    Caption
                                  </button>
                                )}
                                {day.hashtags && (
                                  <button
                                    onClick={() => copyText(day.hashtags, `hashtags-${day.day}`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border text-[10px] font-medium hover:border-foreground/20 transition-colors"
                                  >
                                    {copiedKey === `hashtags-${day.day}` ? <Check className="w-3 h-3 text-foreground/50" /> : <Copy className="w-3 h-3" />}
                                    Hashtags
                                  </button>
                                )}
                                {day.hook && (
                                  <button
                                    onClick={() => copyText(day.hook, `hook-${day.day}`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border text-[10px] font-medium hover:border-foreground/20 transition-colors"
                                  >
                                    {copiedKey === `hook-${day.day}` ? <Check className="w-3 h-3 text-foreground/50" /> : <Copy className="w-3 h-3" />}
                                    Hook
                                  </button>
                                )}
                                {day.cta && (
                                  <button
                                    onClick={() => copyText(day.cta, `cta-${day.day}`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border text-[10px] font-medium hover:border-foreground/20 transition-colors"
                                  >
                                    {copiedKey === `cta-${day.day}` ? <Check className="w-3 h-3 text-foreground/50" /> : <Copy className="w-3 h-3" />}
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
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border ${
                            isDone
                              ? "border-foreground/20 text-foreground/60"
                              : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground/60"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isDone ? "Done ✓" : "Mark Done"}
                        </button>

                        {/* Skip */}
                        <button
                          onClick={() => handleStatusChange(day.day, isSkipped ? "pending" : "skipped")}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border ${
                            isSkipped
                              ? "border-foreground/15 text-muted-foreground/60"
                              : "border-border text-muted-foreground hover:border-foreground/15"
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {isSkipped ? "Skipped" : "Skip"}
                        </button>

                        {/* Re-generate this day */}
                        <button
                          onClick={() => handleRegenerateDay(day.day)}
                          disabled={regeneratingDay === day.day}
                          className="cmd-ghost text-[10px] ml-auto disabled:opacity-40"
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
      <div className="py-4 px-5 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40">
              Minggu {weekNumber} Summary
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {doneCount === 7
                ? "Semua konten minggu ini selesai. Generate minggu berikutnya?"
                : doneCount > 0
                ? `${doneCount}/7 selesai — keep going.`
                : "Belum ada yang selesai — mulai dari hari ini."}
            </p>
          </div>
          {doneCount >= 5 && weekNumber < 4 && (
            <button
              onClick={() => {
                setWeekNumber(weekNumber + 1);
                setExpandedDay(null);
              }}
              className="cmd-primary text-xs"
            >
              Minggu {weekNumber + 1}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ContentCalendarView;
