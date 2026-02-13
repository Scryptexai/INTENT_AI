import { motion } from "framer-motion";

const signals = [
  {
    initials: "AP",
    context: "Freelancer → Micro AI Service",
    quote: "Sebelumnya saya coba 4 hal berbeda. Tidak ada yang jalan. Sistem ini langsung arahkan ke satu jalur yang sesuai kondisi saya.",
  },
  {
    initials: "RS",
    context: "Mahasiswa, modal nol",
    quote: "Yang saya butuhkan bukan motivasi. Saya butuh tahu langkah pertama. INTENT kasih itu.",
  },
  {
    initials: "BS",
    context: "Karyawan → side income",
    quote: "Weekly plan-nya realistis. Bukan 'mulai bisnis', tapi langkah kecil yang bisa dikerjakan setelah pulang kantor.",
  },
];

const TestimonialsSection = () => (
  <section className="py-24 md:py-32 relative">
    {/* Axis */}
    <div className="absolute left-[10%] md:left-[15%] top-0 bottom-0 w-px bg-border/30" />

    <div className="max-w-[1400px] mx-auto px-6 md:px-10">
      <div className="ml-[10%] md:ml-[15%] pl-8 md:pl-12 border-l border-border/30">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-12"
        >
          Signal
        </motion.p>

        {/* No cards. Structured text blocks with thin dividers */}
        <div className="space-y-0 max-w-xl">
          {signals.map((s, i) => (
            <motion.div
              key={s.initials}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="py-6 border-t border-border/40 first:border-t-0"
            >
              <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                "{s.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border border-foreground/15 flex items-center justify-center text-[9px] font-semibold text-muted-foreground">
                  {s.initials}
                </div>
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                  {s.context}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
