import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Profiling mendalam",
    desc: "Skill digital & offline, pengalaman nyata, minat, tujuan, waktu, sumber daya. Bukan survei — kalibrasi.",
  },
  {
    num: "02",
    title: "Scoring & filtering",
    desc: "Sistem menilai kekuatan Anda. Eliminasi peluang yang tidak cocok. Prioritaskan berdasarkan skill match, feasibility, dan market viability.",
  },
  {
    num: "03",
    title: "Satu arah, bukan banyak pilihan",
    desc: "Dari ratusan kemungkinan, Anda hanya melihat yang relevan. Output adalah jalur eksekusi, bukan daftar ide.",
  },
  {
    num: "04",
    title: "Blueprint yang bisa dikerjakan",
    desc: "Platform, tool, langkah harian, target mingguan, indikator progres. Anda tinggal mengikuti.",
  },
];

const FeaturesSection = () => (
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
          Cara kerja
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xl md:text-2xl font-semibold text-foreground mb-12 max-w-md"
        >
          Sistem membaca profil Anda.
          <br />
          <span className="text-muted-foreground">Arah muncul dari data.</span>
        </motion.h2>

        {/* Steps — vertical axis, not cards */}
        <div className="space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="grid grid-cols-[3rem_1fr] gap-4 md:gap-6 py-6 border-t border-border/40 first:border-t-0"
            >
              {/* Step number */}
              <span className="text-xs font-mono text-muted-foreground/40 pt-0.5">
                {step.num}
              </span>

              {/* Content */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default FeaturesSection;
