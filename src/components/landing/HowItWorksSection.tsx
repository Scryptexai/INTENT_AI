/**
 * How It Works Section — "Transparent System. No Black Boxes"
 * ==============================================================
 * Visual Strategy: Build trust through transparency
 * Layout: 60/40 split (Text Left : Visual Right)
 *
 * Visual Requirements:
 * - Option A: Close-up layar dengan dashboard analitik
 * - Option B: Mockup dashboard dengan progress bars
 * - Tone: Data-driven, professional, clear
 * - No: Futuristic UI hologram
 */

import { motion } from "framer-motion";
import { CheckCircle2, Target, Brain, FileText } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      icon: Target,
      title: "Profile Your Capacity",
      duration: "3 minutes",
      description: "Skills, time, resources, and constraints. Takes 3 minutes.",
    },
    {
      number: "02",
      icon: Brain,
      title: "AI Analysis Layer",
      duration: "Seconds",
      description: "Cross-reference your profile with real market data.",
    },
    {
      number: "03",
      icon: Target,
      title: "Match & Score",
      duration: "Instant",
      description: "Ranked by fit, feasibility, and viability.",
    },
    {
      number: "04",
      icon: FileText,
      title: "Get Your Blueprint",
      duration: "Ready",
      description: "30-day plan with daily tasks and clear metrics.",
    },
  ];

  return (
    <section className="section-spacing relative overflow-hidden" id="how-it-works">
      {/* ───────────────────────────────────────────────────── */}
      {/* Background Pattern (Subtle Grid)                            */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto px-6 md:px-10 relative z-10">
        {/* ───────────────────────────────────────────────────── */}
        {/* 60/40 Split Layout: Text (Left) : Visual (Right)        */}
        {/* ───────────────────────────────────────────────────── */}
        <div className="grid-split-60-40">

          {/* ─────────────── LEFT: TEXT (60%) ──────────────── */}
          <div className="space-y-8">
            {/* Section Label */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-px bg-teal-500" />
              <span className="text-xs font-semibold uppercase tracking-widest section-label">
                HOW IT WORKS
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold leading-tight text-gray-900"
            >
              Transparent System.<br />
              <span className="text-gray-600">No Black Boxes.</span>
            </motion.h2>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg text-gray-600 leading-relaxed max-w-lg"
            >
              See exactly how we analyze your profile and match opportunities.
            </motion.p>

            {/* Steps - Card Style */}
            <div className="space-y-3 pt-2">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + (index * 0.1) }}
                  viewport={{ once: true }}
                  className="card group"
                >
                  <div className="flex items-start gap-4">
                    {/* Step Number & Icon */}
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 font-semibold text-sm group-hover:bg-teal-500/20 transition-colors">
                        <step.icon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="font-bold text-gray-900">{step.title}</h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{step.duration}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                    </div>

                    {/* Check indicator - shown on hover */}
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom Note */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              viewport={{ once: true }}
              className="pt-4 flex items-center gap-3 text-sm text-gray-600"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>No prior digital experience needed</span>
            </motion.div>
          </div>

          {/* ────────────── RIGHT: VISUAL (40%) ─────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/*
              ───────────────────────────────────────────────────
              DASHBOARD MOCKUP GUIDELINES:

              Subject: Clean dashboard analytics
              - Progress bars showing completion
              - Task list with checkmarks
              - Stats/metrics display
              - Clean, organized UI
              - Professional, data-driven feel
              - Teal accent colors

              Keep it simple. Not futuristic. Just clean data viz.

              ───────────────────────────────────────────────────
            */}

            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white border border-gray-200">
              {/* Dashboard Mockup */}
              <div className="aspect-[4/3] p-6">
                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">PROGRESS</p>
                      <p className="text-xl font-bold text-gray-900">Week 2</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-gray-600 font-medium">Task Completion</span>
                        <span className="font-bold text-gray-900">75%</span>
                      </div>
                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-gray-600 font-medium">Skill Growth</span>
                        <span className="font-bold text-gray-900">+40%</span>
                      </div>
                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
                    <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-2xl font-bold text-gray-900">8</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Tasks Done</p>
                    </div>
                    <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-2xl font-bold text-gray-900">3</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Days Active</p>
                    </div>
                    <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-2xl font-bold text-gray-900">92%</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Match Score</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating Badge - AI Validated */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 max-w-[200px] border border-gray-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="text-xs font-bold text-gray-900">AI Validated</span>
              </div>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Blueprint personalized based on your unique profile
              </p>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
