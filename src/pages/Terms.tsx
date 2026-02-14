/**
 * Terms of Service — Required for Google OAuth verification
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="relative">
        <div className="absolute left-[10%] md:left-[8%] top-0 bottom-0 w-px bg-border/20" />

        <main className="max-w-[800px] mx-auto px-6 md:px-10 pt-24 pb-16">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-3 h-3" /> Kembali
            </Link>

            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">Legal</p>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Ketentuan Layanan</h1>
            <p className="text-xs text-muted-foreground/40 mb-8">Terakhir diperbarui: 14 Februari 2026</p>

            <div className="space-y-8 text-sm text-foreground/70 leading-relaxed">
              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">1. Tentang Layanan</h2>
                <p>INTENT adalah sistem kalibrasi personal berbasis AI yang membantu pengguna menemukan jalur income digital yang realistis berdasarkan profil unik mereka. Layanan ini mencakup profiling, riset pekerjaan dari data internet, roadmap eksekusi, content generator, trend intelligence, dan evaluasi mingguan.</p>
              </section>

              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">2. Akun & Akses</h2>
                <ul className="space-y-1.5 ml-4">
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Anda harus login menggunakan akun Google yang valid.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Akun dibuat secara otomatis saat pertama kali login.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Anda bertanggung jawab atas keamanan akun Google Anda.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Satu akun Google = satu profil INTENT aktif pada satu waktu.</span></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">3. Penggunaan Layanan</h2>
                <p className="mb-2">Anda setuju untuk:</p>
                <ul className="space-y-1.5 ml-4">
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Memberikan informasi yang jujur saat profiling — akurasi rekomendasi bergantung pada kejujuran data.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Tidak menggunakan layanan untuk aktivitas ilegal atau melanggar hukum.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Tidak menyalahgunakan fitur AI generator untuk menghasilkan konten berbahaya.</span></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">4. Batasan Layanan</h2>
                <ul className="space-y-1.5 ml-4">
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>INTENT adalah <strong>alat bantu</strong>, bukan jaminan penghasilan. Hasil bergantung pada eksekusi Anda.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Rekomendasi job dan income range bersifat estimasi berdasarkan data yang tersedia saat analisis.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Data market dari sumber eksternal (Google Trends, YouTube, dll) mungkin berubah sewaktu-waktu.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>AI-generated content mungkin memerlukan pengeditan sebelum dipublikasikan.</span></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">5. Paket & Harga</h2>
                <p>Layanan tersedia dalam beberapa paket (Free, Pro, Agency). Fitur yang tersedia bervariasi per paket. Kami berhak mengubah harga dan fitur dengan pemberitahuan sebelumnya kepada pengguna aktif.</p>
              </section>

              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">6. Hak Kekayaan Intelektual</h2>
                <ul className="space-y-1.5 ml-4">
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Konten yang di-generate menggunakan INTENT menjadi milik Anda sepenuhnya.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Sistem INTENT, termasuk algoritma profiling dan arsitektur, adalah milik Scryptex AI.</span></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">7. Penghentian</h2>
                <p>Kami berhak menangguhkan atau menghentikan akun yang melanggar ketentuan layanan ini. Anda dapat menghentikan penggunaan kapan saja dengan berhenti login. Data Anda akan tetap tersimpan kecuali Anda meminta penghapusan.</p>
              </section>

              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">8. Kontak</h2>
                <p>Pertanyaan tentang ketentuan layanan ini dapat dikirim ke <a href="mailto:legal@intent.sbs" className="text-foreground/80 underline underline-offset-2 hover:text-foreground">legal@intent.sbs</a>.</p>
              </section>
            </div>
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
