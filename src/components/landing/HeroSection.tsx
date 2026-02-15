import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center">
      {/* Vertical axis line */}
      <div className="absolute left-[10%] md:left-[15%] top-0 bottom-0 w-px bg-border/50" />

      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-16 relative z-10">
        <div className="max-w-2xl ml-[10%] md:ml-[15%] pl-8 md:pl-12 border-l border-border/50">
          {/* System status indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 mb-10"
          >
            <div className="w-1.5 h-1.5 bg-foreground/40" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Adaptive Direction System
            </span>
          </motion.div>

          {/* Headline — dunia penuh pilihan, bukan ambisi */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-[1.2] tracking-tight text-foreground mb-6"
          >
            Dunia penuh pilihan.
            <br />
            <span className="text-muted-foreground">Tidak semua cocok untuk Anda.</span>
          </motion.h1>

          {/* Subheadline — arah dari data, bukan janji */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mb-10"
          >
            INTENT membaca profil Anda — skill, kondisi, sumber daya.
            Menyaring peluang yang relevan. Memberikan jalur kerja yang jelas.
            Bukan kursus. Bukan daftar ide. Sistem arah.
          </motion.p>

          {/* Command — not a marketing CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Link
              to="/onboarding"
              className="cmd-primary group"
            >
              Mulai Kalibrasi
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Structural detail */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="mt-16 flex items-center gap-8 text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50"
          >
            <span>7 pertanyaan</span>
            <span className="w-4 h-px bg-border" />
            <span>1 jalur kerja</span>
            <span className="w-4 h-px bg-border" />
            <span>30 hari roadmap</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
