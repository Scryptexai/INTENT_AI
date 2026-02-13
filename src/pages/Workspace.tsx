/**
 * Workspace Page — AI Execution Workspace
 * ==========================================
 * This is where users EXECUTE, not just plan.
 * 
 * Features:
 * - Day-1 Setup (bio, pillars, first post) — auto-generated
 * - Content generators (caption, hook, script, visual prompt, hashtag, CTA)
 * - Content calendar
 * - Copy-to-clipboard for all generated content
 * - Generator history
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Loader2, Copy, Check, ChevronRight, ArrowLeft,
  Zap, Brain, RefreshCw, LayoutDashboard, Wand2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentCalendarView from "@/components/ContentCalendar";
import TrendIntelligenceDashboard from "@/components/TrendIntelligenceDashboard";
import { useAuth } from "@/contexts/AuthContext";
import {
  generateContent,
  generateDay1Setup,
  getAvailableGenerators,
  GENERATOR_LABELS,
  type GeneratorType,
  type GeneratorInput,
} from "@/services/workspaceGenerator";
import { loadActiveProfile, type SavedProfile } from "@/services/profileService";

const Workspace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SavedProfile | null>(null);
  const [activeGenerator, setActiveGenerator] = useState<GeneratorType | null>(null);
  const [generatorInput, setGeneratorInput] = useState("");
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [day1Generated, setDay1Generated] = useState(false);
  const [day1Loading, setDay1Loading] = useState(false);
  const [trendBrief, setTrendBrief] = useState<string>("");

  // Extract profile data for generators
  const answerTags = (profile as any)?.answer_tags as Record<string, string> || {};
  const niche = answerTags.niche || answerTags.interest_market || "general";
  const subSector = answerTags.sub_sector || "general";
  const platform = answerTags.platform || answerTags.preferred_platform || "instagram";
  const economicModel = answerTags.economic_model || "skill_service";
  const availableGenerators = getAvailableGenerators(economicModel);

  // Load profile
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const profileData = await loadActiveProfile(user.id);
      setProfile(profileData);
      setLoading(false);
    };
    loadData();
  }, [user]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  // Generate Day-1 Setup
  const handleDay1Setup = useCallback(async () => {
    setDay1Loading(true);
    try {
      const results = await generateDay1Setup(niche, subSector, platform, economicModel);
      setGeneratedContent((prev) => ({ ...prev, ...results }));
      setDay1Generated(true);
    } catch (err) {
      console.error("Day-1 setup failed:", err);
    }
    setDay1Loading(false);
  }, [niche, subSector, platform, economicModel]);

  // Generate content for a specific type
  const handleGenerate = useCallback(async (type: GeneratorType) => {
    setIsGenerating(true);
    try {
      const input: GeneratorInput = {
        type,
        niche,
        subSector,
        platform,
        economicModel,
        topic: generatorInput || undefined,
      };
      const output = await generateContent(input);
      setGeneratedContent((prev) => ({ ...prev, [type]: output.content }));
    } catch (err) {
      console.error("Generation failed:", err);
    }
    setIsGenerating(false);
  }, [niche, subSector, platform, economicModel, generatorInput]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="pt-24 pb-16 px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-md mx-auto text-center py-20">
            <Brain className="w-12 h-12 text-primary/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Belum ada profil aktif</h2>
            <p className="text-sm text-muted-foreground/70 mb-6">
              Selesaikan profiling dulu untuk mengakses Execution Workspace
            </p>
            <button
              onClick={() => navigate("/onboarding")}
              className="px-6 py-3 rounded-xl bg-primary text-white font-bold"
            >
              Mulai Profiling
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-3">
                  <Zap className="w-3.5 h-3.5" />
                  EXECUTION WORKSPACE
                </div>
                <h1 className="text-3xl font-black">
                  AI Workspace
                </h1>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Generate konten, setup akun, dan eksekusi semuanya di sini
                </p>
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted/20 text-sm font-medium hover:bg-muted/30 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
            </div>

            {/* Profile context bar */}
            <div className="mt-4 p-3 rounded-xl bg-card/50 border border-border/30 flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-muted-foreground/60 uppercase">Profil:</span>
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                {economicModel}
              </span>
              <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
              <span className="px-2 py-0.5 rounded-md bg-slate-500/10 text-[10px] font-bold text-slate-400">
                {subSector}
              </span>
              <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                {niche}
              </span>
              <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                {platform}
              </span>
            </div>
          </motion.div>

          {/* Day-1 Setup Section */}
          {!day1Generated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 p-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Wand2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-black mb-2">🚀 Day-1 Setup</h2>
                <p className="text-sm text-muted-foreground/70 mb-6 max-w-md mx-auto">
                  AI akan generate bio, content pillars, dan first post kamu secara otomatis.
                  Tinggal copy-paste ke platform!
                </p>
                <button
                  onClick={handleDay1Setup}
                  disabled={day1Loading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {day1Loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Day-1 Setup
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Day-1 Results */}
          {day1Generated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 space-y-4"
            >
              <h2 className="text-lg font-black flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                Day-1 Setup Complete
              </h2>

              {["bio", "content_pillars", "first_post"].map((key) => {
                const label = GENERATOR_LABELS[key as GeneratorType];
                const content = generatedContent[key];
                if (!content) return null;

                return (
                  <div
                    key={key}
                    className="p-5 rounded-xl border border-border/30 bg-card/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{label.emoji}</span>
                        <span className="text-sm font-bold">{label.label}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(content, key)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                      >
                        {copiedKey === key ? (
                          <>
                            <Check className="w-3 h-3" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed bg-muted/10 p-4 rounded-lg border border-border/20 max-h-60 overflow-y-auto">
                      {content}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ── P2: Trend Intelligence Engine (loads first → feeds calendar) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <TrendIntelligenceDashboard
              pathId={economicModel}
              interestMarket={niche}
              subSector={subSector}
              onTrendBriefReady={setTrendBrief}
            />
          </motion.div>

          {/* ── P1 MAXIMAL: Content Calendar (uses trendBrief from above) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <ContentCalendarView
              economicModel={economicModel}
              subSector={subSector}
              niche={niche}
              platform={platform}
              trendBrief={trendBrief}
            />
          </motion.div>

          {/* Generator Tools Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Content Generators
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {availableGenerators.filter(g => g !== "content_calendar").map((genType) => {
                const label = GENERATOR_LABELS[genType];
                const isActive = activeGenerator === genType;
                const hasContent = !!generatedContent[genType];

                return (
                  <motion.button
                    key={genType}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveGenerator(isActive ? null : genType)}
                    className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                      isActive
                        ? "border-primary/50 bg-primary/10 shadow-md shadow-primary/10"
                        : "border-border/30 bg-card/50 hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl sm:text-2xl">{label.emoji}</span>
                      {hasContent && (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-bold">{label.label}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-0.5">
                      {label.description}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            {/* Active Generator Panel */}
            <AnimatePresence mode="wait">
              {activeGenerator && (
                <motion.div
                  key={activeGenerator}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 rounded-2xl border border-primary/20 bg-card/60">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">{GENERATOR_LABELS[activeGenerator].emoji}</span>
                      <h3 className="text-lg font-bold">{GENERATOR_LABELS[activeGenerator].label}</h3>
                    </div>

                    {/* Topic input */}
                    <div className="mb-4">
                      <label className="text-xs font-bold text-muted-foreground/60 uppercase mb-1.5 block">
                        Topik / Context (optional)
                      </label>
                      <input
                        type="text"
                        value={generatorInput}
                        onChange={(e) => setGeneratorInput(e.target.value)}
                        placeholder={`Contoh: "tips produktivitas WFH" atau "review AI tool terbaru"`}
                        className="w-full px-4 py-3 rounded-xl border border-border/30 bg-background/50 text-sm focus:border-primary/50 focus:outline-none"
                      />
                    </div>

                    {/* Generate button */}
                    <button
                      onClick={() => handleGenerate(activeGenerator)}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate
                        </>
                      )}
                    </button>

                    {/* Re-generate button */}
                    {generatedContent[activeGenerator] && (
                      <button
                        onClick={() => handleGenerate(activeGenerator)}
                        disabled={isGenerating}
                        className="inline-flex items-center gap-1.5 ml-3 px-4 py-2.5 rounded-xl bg-muted/20 text-sm font-medium hover:bg-muted/30 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Re-generate
                      </button>
                    )}

                    {/* Generated content display */}
                    {generatedContent[activeGenerator] && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-muted-foreground/60 uppercase">
                            Result
                          </span>
                          <button
                            onClick={() => copyToClipboard(generatedContent[activeGenerator], activeGenerator)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                          >
                            {copiedKey === activeGenerator ? (
                              <>
                                <Check className="w-3 h-3" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy All
                              </>
                            )}
                          </button>
                        </div>
                        <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed bg-muted/10 p-4 rounded-lg border border-border/20 max-h-80 overflow-y-auto">
                          {generatedContent[activeGenerator]}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Workspace;
