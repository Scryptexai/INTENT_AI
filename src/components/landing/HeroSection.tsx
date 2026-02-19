/**
 * Hero Section — Redesigned with Cool White + Teal
 * ==================================================
 * Visual Strategy: Professional, Trustworthy, Direct
 * Layout: Centered text with floating blueprint card
 *
 * Photo Requirements:
 * - Subject: Professional, 28-40 tahun
 * - Expression: Focused, composed (bukan smile lebar)
 * - Setting: Clean workspace, natural light
 * - Gaze: Facing left → toward text
 * - Lighting: Natural window light (soft, diffuse)
 * - Color Grading: Warm tint, shallow depth of field
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center section-spacing overflow-hidden">
      {/* ───────────────────────────────────────────────────── */}
      {/* Background Image with Dark Overlay                        */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {/* TODO: Replace with actual professional workspace photo */}
        {/* Recommendation: Unsplash search "focused workspace" */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/images/hero-workspace-bg.jpg)',
          }}
          /* Fallback gradient if image not loaded */
          onContextMenu={(e) => {
            e.preventDefault();
          }}
        />
        {/* Dark gradient overlay for text readability (40-50% opacity) */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/50" />
        {/* Cool tint overlay to match brand */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D9488]/5 via-transparent to-transparent" />
      </div>

      {/* ───────────────────────────────────────────────────── */}
      {/* Content Layer                                              */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 stagger-children">

          {/* System Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-medium text-white uppercase tracking-widest">
              Skill Direction System
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white"
          >
            Your Skills Have a<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-white">
              Direction. We Find It.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-2xl mx-auto"
          >
            No more scrolling through possibilities. Get a personalized
            <span className="text-white font-semibold"> 30-day roadmap </span>
            based on your actual skills and constraints.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center gap-2 text-base font-bold text-white px-8 py-4 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
            >
              Build My Blueprint
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-base font-medium text-gray-300 hover:text-white transition-colors duration-150"
            >
              See how it works
              <span className="text-teal-400">→</span>
            </a>
          </motion.div>

          {/* Trust Signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="flex flex-wrap gap-6 justify-center items-center pt-6 text-sm text-gray-300"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Takes 3 minutes</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-gray-500" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>No credit card required</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-gray-500" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Real results</span>
            </div>
          </motion.div>
        </div>

        {/* ───────────────────────────────────────────────────── */}
        {/* Floating Blueprint Preview Card                           */}
        {/* ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2"
        >
          <div className="bg-white rounded-xl shadow-2xl p-5 max-w-xs backdrop-blur-sm bg-opacity-95">
            {/* Card Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Blueprint Ready</p>
                <p className="text-xs text-gray-500">Week 1 Progress</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Foundation</span>
                <span className="font-bold text-gray-900">100%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full" style={{ width: '100%' }} />
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-gray-600">Skill Audit</span>
                <span className="font-bold text-gray-900">75%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            {/* Bottom Status */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Daily Tasks</span>
              <span className="text-xs font-bold text-teal-600">7/7 Complete</span>
            </div>
          </div>
        </motion.div>

        {/* ───────────────────────────────────────────────────── */}
        {/* Background Decor — Subtle Glow                              */}
        {/* ───────────────────────────────────────────────────── */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -z-10" />
      </div>
    </section>
  );
};

export default HeroSection;
