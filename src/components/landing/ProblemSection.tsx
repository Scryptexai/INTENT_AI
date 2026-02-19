/**
 * Problem Section — "Analysis Paralysis is Expensive"
 * =======================================================
 * Visual Strategy: Agitate pain points + build empathy
 * Layout: 40/60 split (Visual Left : Text Right)
 *
 * Photo Requirements:
 * - Subject: Person overwhelmed dengan banyak catatan
 * - Expression: Serius berpikir (bukan frustrated)
 * - Setting: Cluttered workspace (notes, tabs, papers)
 * - Lighting: Netral, slightly cool untuk contrast
 */

import { motion } from "framer-motion";
import { AlertCircle, Scissors, TrendingDown } from "lucide-react";

const ProblemSection = () => {
  const problems = [
    {
      icon: AlertCircle,
      title: "Overchoice",
      description: "47 tabs open, zero decisions made. Every option looks promising, but none fit.",
    },
    {
      icon: TrendingDown,
      title: "Skill Stagnation",
      description: "You're capable, but not optimized. Skills exist without clear direction.",
    },
    {
      icon: Scissors,
      title: "Trial & Error",
      description: "Wrong lessons cost months. Learning the wrong things is expensive.",
    },
  ];

  return (
    <section className="section-spacing section-alt relative overflow-hidden" id="problem">
      {/* ───────────────────────────────────────────────────── */}
      {/* Background Pattern (Subtle Grid)                            */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto px-6 md:px-10 relative z-10">
        {/* ───────────────────────────────────────────────────── */}
        {/* 40/60 Split Layout: Visual (Left) : Text (Right)        */}
        {/* ───────────────────────────────────────────────────── */}
        <div className="grid-split-40-60">

          {/* ───────────── LEFT: VISUAL (40%) ────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/*
              ───────────────────────────────────────────────────
              PHOTO GUIDELINES:

              Subject: Person overwhelmed dengan banyak catatan
              - Gender: Any, age 25-40
              - Expression: Serius berpikir,眉头微皱
              - Pose: Duduk di meja, tangan di kepala atau memegang notes
              - Setting: Workspace dengan:
                * Banyak catatan/post-it tersebar
                * Laptop dengan banyak tabs terbuka
                * Kertas-kertas, dokumentasi
              - Lighting: Netral, tidak dramatic
              - Mood: "Information overload", bukan "total breakdown"
              - Color: Slightly cool tone untuk contrast

              Stock Photo Search:
              - "overwhelmed with notes"
              - "too many tabs"
              - "studying working desk"
              - "information overload"

              ───────────────────────────────────────────────────
            */}

            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* TODO: Replace with actual photo */}
              <div
                className="relative aspect-square bg-cover bg-center"
                style={{
                  backgroundImage: 'url(/images/problem-overwhelmed.jpg)',
                  /* Fallback gradient */
                  background: 'linear-gradient(145deg, #F5F5F5 0%, #E5E5E5 100%)',
                }}
              >
                {/* Placeholder if no photo */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-amber-500/40" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium mb-2">Overwhelmed Workspace</p>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto">
                      Subject: Person with many notes<br />
                      Expression: Thinking seriously<br />
                      Setting: Cluttered workspace
                    </p>
                  </div>
                </div>
              </div>

              {/* Cool overlay untuk contrast */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating Badges - Visual Clutter */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 max-w-[120px] border border-gray-200"
            >
              <div className="text-[10px] font-bold text-red-500">
                47 tabs open
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-3 max-w-[140px] border border-gray-200"
            >
              <div className="text-[10px] font-bold text-amber-500">
                15+ bookmarked
              </div>
            </motion.div>
          </motion.div>

          {/* ───────────── RIGHT: TEXT (60%) ─────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Section Label */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-px bg-teal-500" />
              <span className="text-xs font-semibold uppercase tracking-widest section-label">
                THE PROBLEM
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
              Analysis Paralysis<br />
              <span className="text-teal-600">is Expensive.</span>
            </h2>

            {/* Subheadline */}
            <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
              Every hour spent searching is an hour not executing.
            </p>

            {/* Problem Points */}
            <div className="space-y-4 pt-2">
              {problems.map((problem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + (index * 0.1) }}
                  viewport={{ once: true }}
                  className="card group"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                        <problem.icon className="w-5 h-5 text-teal-600" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {problem.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Transition Statement */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-base font-semibold text-gray-900 leading-relaxed">
                We don't add options. <span className="text-teal-600">We filter them.</span>
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
