import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const outcomes = [
  {
    label: "Jalur kerja utama",
    text: "Bukan 10 opsi. Satu arah yang sesuai profil Anda.",
  },
  {
    label: "Platform & tool",
    text: "Di mana bekerja. Dengan apa. Tanpa riset tambahan.",
  },
  {
    label: "Langkah harian & target mingguan",
    text: "Blueprint 30 hari yang executable. Anda tinggal mengikuti.",
  },
  {
    label: "Adaptif",
    text: "Sistem belajar dari interaksi Anda. Arah semakin presisi dari waktu ke waktu.",
  },
];

const GeneratorDemo = () => {
  return (
    <section className="py-24 md:py-32 relative">
      {/* Axis */}
      <div className="absolute left-[10%] md:left-[15%] top-0 bottom-0 w-px bg-border/30" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="ml-[10%] md:ml-[15%] pl-8 md:pl-12 border-l border-border/30">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-4"
          >
            Output
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl font-semibold text-foreground mb-12 max-w-md"
          >
            Anda mendapat jalur kerja yang jelas.
            <br />
            <span className="text-muted-foreground">Bukan saran. Blueprint.</span>
          </motion.h2>

          {/* Outcomes — structured columns, not cards */}
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 max-w-2xl">
            {outcomes.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">
                  {item.label}
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px w-16 bg-border my-12" />

          {/* Command CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-muted-foreground mb-4">
              2 menit. 7 pertanyaan. 1 jalur kerja.
            </p>
            <Link
              to="/onboarding"
              className="cmd-primary group"
            >
              Mulai Sekarang
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default GeneratorDemo;
