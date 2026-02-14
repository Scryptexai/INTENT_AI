/**
 * Privacy Policy — Required for Google OAuth verification
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
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
            <h1 className="text-2xl font-semibold text-foreground mb-2">Kebijakan Privasi</h1>
            <p className="text-xs text-muted-foreground/40 mb-8">Terakhir diperbarui: 14 Februari 2026</p>

            <div className="space-y-8 text-sm text-foreground/70 leading-relaxed">
              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">1. Informasi yang Kami Kumpulkan</h2>
                <p className="mb-2">INTENT ("kami", "layanan") mengumpulkan informasi berikut saat Anda menggunakan layanan kami:</p>
                <ul className="space-y-1.5 ml-4">
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span><strong>Data akun Google:</strong> Nama, alamat email, dan foto profil yang Anda berikan melalui Google OAuth 2.0 saat login.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span><strong>Data profiling:</strong> Jawaban yang Anda berikan selama proses kalibrasi (model ekonomi, skill, kondisi, target, hambatan, dll).</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span><strong>Data aktivitas:</strong> Progress task, checkpoint mingguan, dan konten yang di-generate melalui layanan.</span></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">2. Bagaimana Kami Menggunakan Data</h2>
                <p className="mb-2">Data Anda digunakan secara eksklusif untuk:</p>
                <ul className="space-y-1.5 ml-4">
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Menyusun rekomendasi jalur income yang personal berdasarkan profil Anda.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Melakukan riset pekerjaan dari sumber data internet (Google Trends, YouTube, dll) yang relevan dengan profil Anda.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Menghasilkan konten, roadmap, dan analisis yang dipersonalisasi.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Memberikan feedback AI pada checkpoint mingguan.</span></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">3. Penyimpanan Data</h2>
                <p>Data Anda disimpan secara aman di Supabase (PostgreSQL) dengan enkripsi. Kami menggunakan Row Level Security (RLS) sehingga setiap user hanya bisa mengakses data milik mereka sendiri. Data tidak dibagikan kepada pihak ketiga kecuali untuk keperluan pemrosesan AI (Anthropic Claude) yang digunakan untuk menganalisis profil dan menghasilkan rekomendasi.</p>
              </section>

              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">4. Google OAuth & Data Access</h2>
                <p className="mb-2">Kami menggunakan Google OAuth 2.0 hanya untuk otentikasi. Kami:</p>
                <ul className="space-y-1.5 ml-4">
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span><strong>Hanya</strong> mengakses informasi profil dasar (nama, email, foto profil).</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span><strong>Tidak</strong> mengakses kontak, Google Drive, Gmail, atau data Google lainnya.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span><strong>Tidak</strong> menyimpan password Google Anda — autentikasi sepenuhnya ditangani oleh Google.</span></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">5. Hak Anda</h2>
                <p className="mb-2">Anda memiliki hak untuk:</p>
                <ul className="space-y-1.5 ml-4">
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Mengakses semua data profil Anda melalui dashboard.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Mereset profil dan memulai ulang kapan saja ("Ubah Jalur").</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Menghapus akun Anda dengan menghubungi kami.</span></li>
                  <li className="flex items-start gap-2"><span className="text-muted-foreground/30 mt-0.5">•</span> <span>Mencabut akses Google OAuth kapan saja melalui pengaturan akun Google Anda.</span></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xs uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-3">6. Kontak</h2>
                <p>Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini, hubungi kami di <a href="mailto:privacy@intent.sbs" className="text-foreground/80 underline underline-offset-2 hover:text-foreground">privacy@intent.sbs</a>.</p>
              </section>
            </div>
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
