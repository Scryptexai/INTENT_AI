import { motion } from "framer-motion";

const problems = [
  "Terlalu banyak peluang. Semua terlihat menjanjikan.",
  "Tidak tahu mana yang benar-benar cocok dengan kondisi Anda.",
  "Takut buang waktu belajar sesuatu yang ternyata salah.",
  "Punya skill, tapi tidak tahu cara mengubahnya jadi penghasilan.",
  "Browsing acak tanpa arah yang jelas.",
];

const StatsSection = () => (
  <section className="py-20 md:py-28 relative">
    {/* Axis continuation */}
    <div className="absolute left-[10%] md:left-[15%] top-0 bottom-0 w-px bg-border/30" />

    <div className="max-w-[1400px] mx-auto px-6 md:px-10">
      <div className="ml-[10%] md:ml-[15%] pl-8 md:pl-12 border-l border-border/30">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-8"
        >
          Masalah yang kami lihat
        </motion.p>

        <div className="space-y-4 max-w-lg">
          {problems.map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-4"
            >
              <div className="w-1 h-1 bg-muted-foreground/40 mt-2 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-10 h-px w-16 bg-border"
        />

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-sm text-foreground/80 max-w-md"
        >
          Fungsi sistem bukan menambah pilihan.
          Fungsi sistem adalah menyaring.
        </motion.p>
      </div>
    </div>
  </section>
);

export default StatsSection;
