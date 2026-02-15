import { motion } from "framer-motion";

const useCases = [
  {
    tag: "Kasus 1",
    context: "Freelancer, skill menulis, tanpa arah",
    scenario: "Punya kemampuan menulis tapi coba 4 hal berbeda — tidak ada yang jalan. Sistem membaca profil: skill writing + zero audience + waktu terbatas → arah langsung ke micro AI copywriting service. Bukan 10 opsi. Satu jalur.",
  },
  {
    tag: "Kasus 2",
    context: "Mahasiswa, modal nol, butuh langkah pertama",
    scenario: "Tidak butuh motivasi. Butuh tahu langkah pertama yang realistis. Sistem memetakan: zero capital + waktu malam + skill dasar → jalur content freelancer dengan blueprint harian yang bisa dikerjakan setelah kuliah.",
  },
  {
    tag: "Kasus 3",
    context: "Karyawan, ingin side income tanpa tampil",
    scenario: "Waktu terbatas, tidak mau tampil di kamera. Sistem filter: gaya kerja diam-diam + skill analisis + 1-2 jam/hari → jalur AI data curation service. Weekly plan realistis, bisa dikerjakan setelah pulang kantor.",
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
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-4"
        >
          Kasus penggunaan
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xl md:text-2xl font-semibold text-foreground mb-12 max-w-md"
        >
          Kondisi berbeda.
          <br />
          <span className="text-muted-foreground">Sistem menyesuaikan.</span>
        </motion.h2>

        {/* No cards. Structured text blocks with thin dividers */}
        <div className="space-y-0 max-w-xl">
          {useCases.map((s, i) => (
            <motion.div
              key={s.tag}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="py-6 border-t border-border/40 first:border-t-0"
            >
              <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                {s.scenario}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-muted-foreground/40">
                  {s.tag}
                </span>
                <span className="w-3 h-px bg-border" />
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
