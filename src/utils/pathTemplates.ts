/**
 * Path Templates — 6 Curated AI Side Income Paths
 * ==================================================
 * Setiap path punya:
 * - Logic ekonomi jelas
 * - Entry barrier rendah-sedang
 * - Time-to-feedback ≤ 30 hari
 * - 4-week structured roadmap
 *
 * AI TIDAK mengarang jalur dari nol.
 * AI hanya meng-customize detail dari template ini.
 */

import type { PathId, SegmentTag } from "./profilingConfig";

// ============================================================================
// TYPES
// ============================================================================

export interface TaskResource {
  label: string;
  url: string;
  type: "tool" | "template" | "guide" | "platform" | "example";
}

export interface TaskDetail {
  text: string;           // Task title (checklist text)
  action_guide: string;   // HOW to do this task — step-by-step micro-guide
  deliverable: string;    // Expected output / proof of completion
  time_estimate: string;  // e.g. "30 min", "1-2 jam"
  difficulty: "mudah" | "sedang" | "menantang";
  resources: TaskResource[];
}

export interface WeekPlan {
  week: number;
  title: string;
  tasks: TaskDetail[];
}

export interface PathTemplate {
  id: PathId;
  title: string;
  emoji: string;
  tagline: string;
  description: string;
  moneySource: string;
  timeToTest: string;
  riskIfFail: string;
  idealFor: string[];
  avoid: string[]; // "Apa yang harus diabaikan"
  examples: string[];
  weeklyPlan: WeekPlan[];
  segments: SegmentTag[]; // which segments this path fits
}

// ============================================================================
// 6 CURATED PATHS
// ============================================================================

export const PATH_TEMPLATES: PathTemplate[] = [
  // ────────────────────────────────
  // 1. MICRO AI SERVICE
  // ────────────────────────────────
  {
    id: "micro_service",
    title: "Micro AI Service",
    emoji: "⚡",
    tagline: "Jual hasil kerja AI sebagai jasa kecil",
    description:
      "Path paling cepat menghasilkan. Kamu menjual output AI sebagai jasa mikro — bukan build produk, bukan build audience. Langsung kerja, langsung dibayar.",
    moneySource: "Bayaran per project/task dari client langsung",
    timeToTest: "7–14 hari untuk income pertama",
    riskIfFail: "Rendah — waktu terbuang tapi tidak ada kerugian finansial",
    idealFor: ["Tanpa modal", "Waktu terbatas", "Butuh income cepat"],
    avoid: [
      "Jangan build agency dulu",
      "Jangan bikin website mewah",
      "Jangan target enterprise",
    ],
    examples: [
      "Rewrite & optimize copy",
      "Thumbnail idea generator",
      "Script shortform video",
      "Resume optimization",
      "Social media hook generator",
    ],
    weeklyPlan: [
      {
        week: 1,
        title: "Setup & Positioning",
        tasks: [
          {
            text: "Pilih 1 jasa spesifik yang bisa kamu deliver dengan AI",
            action_guide: "1. Buka ChatGPT/Claude, tanyakan: 'Jasa apa yang paling sering dicari freelancer pemula di Fiverr?'\n2. Pilih SATU yang kamu yakin bisa deliver (bukan yang paling unik)\n3. Test: minta AI generate 1 contoh output → apakah hasilnya cukup bagus?\n4. Jika ya, itu jasa kamu. Jika tidak, coba jasa berikutnya.",
            deliverable: "1 jenis jasa yang sudah dipilih + 1 test output dari AI",
            time_estimate: "30–60 menit",
            difficulty: "mudah",
            resources: [
              { label: "Fiverr — Lihat jasa yang laku", url: "https://www.fiverr.com/categories", type: "platform" },
              { label: "ChatGPT", url: "https://chat.openai.com", type: "tool" },
              { label: "Claude AI", url: "https://claude.ai", type: "tool" },
              { label: "Gemini (Google AI)", url: "https://gemini.google.com", type: "tool" },
              { label: "Grok AI (X)", url: "https://grok.x.ai", type: "tool" },
              { label: "Jasper AI (Copy)", url: "https://www.jasper.ai", type: "tool" },
              { label: "Copy.ai", url: "https://www.copy.ai", type: "tool" },
              { label: "Pippit AI (Marketplace)", url: "https://pippit.ai", type: "platform" },
              { label: "Dreamina (AI Visual)", url: "https://dreamina.com", type: "tool" },
              { label: "Midjourney (AI Visual)", url: "https://www.midjourney.com", type: "tool" },
              { label: "DALL-E (OpenAI Visual)", url: "https://labs.openai.com", type: "tool" },
              { label: "Notion AI", url: "https://www.notion.so/product/ai", type: "tool" },
            ],
          },
          {
            text: "Buat 3 contoh portfolio output",
            action_guide: "1. Gunakan AI untuk generate 3 sample output dari jasa yang kamu pilih\n2. Polish hasilnya — jangan post raw AI output\n3. Simpan dalam format yang rapi (PDF/image/Google Doc)\n4. Pastikan setiap sample menunjukkan variasi gaya/topik berbeda",
            deliverable: "3 file sample output yang sudah di-polish, siap ditunjukkan ke calon client",
            time_estimate: "1–2 jam",
            difficulty: "mudah",
            resources: [
              { label: "Canva — Polish visual output", url: "https://www.canva.com", type: "tool" },
              { label: "Dreamina (AI Visual)", url: "https://dreamina.com", type: "tool" },
              { label: "Midjourney (AI Visual)", url: "https://www.midjourney.com", type: "tool" },
              { label: "DALL-E (OpenAI Visual)", url: "https://labs.openai.com", type: "tool" },
              { label: "Google Docs — Format portfolio", url: "https://docs.google.com", type: "tool" },
            ],
          },
          {
            text: "Setup 1 halaman sederhana (Notion/Carrd/bio link)",
            action_guide: "1. Pilih platform: Carrd.co (gratis, 1 page) atau Notion (gratis)\n2. Buat halaman dengan struktur: Judul jasa → 3 sample → Harga → Cara order\n3. Tulis copy yang jelas: apa yang kamu kerjakan, berapa lama, berapa harga\n4. Tambahkan link kontak (WhatsApp/email/DM)",
            deliverable: "1 halaman portfolio online yang live dan bisa diakses via link",
            time_estimate: "1–2 jam",
            difficulty: "mudah",
            resources: [
              { label: "Carrd — Landing page gratis", url: "https://carrd.co", type: "platform" },
              { label: "Notion — Buat portfolio", url: "https://www.notion.so", type: "platform" },
              { label: "Notion AI", url: "https://www.notion.so/product/ai", type: "tool" },
              { label: "Bio.link — Bio link gratis", url: "https://bio.link", type: "platform" },
            ],
          },
          {
            text: "Tulis 1 deskripsi jasa yang jelas",
            action_guide: "1. Gunakan formula: [Apa yang kamu kerjakan] + [Untuk siapa] + [Dalam berapa lama] + [Hasil yang dijanjikan]\n2. Contoh: 'Saya menulis ulang copy website kamu agar lebih menjual — dalam 24 jam, kamu dapat 3 versi copy yang siap pakai'\n3. Hindari klaim berlebihan — fokus ke deliverable konkret\n4. Minta AI bantu refine copy-nya",
            deliverable: "1 deskripsi jasa (2-3 kalimat) yang siap dipasang di semua platform",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [
              { label: "Contoh gig description Fiverr", url: "https://www.fiverr.com/resources/guides/selling/creating-a-gig", type: "guide" },
            ],
          },
        ],
      },
      {
        week: 2,
        title: "Market Testing",
        tasks: [
          {
            text: "Outreach ke 10 target potensial (DM/email/forum)",
            action_guide: "1. Identifikasi 10 orang/bisnis yang BUTUH jasa kamu (bukan random)\n2. Kirim pesan personal: 'Hai [nama], saya lihat [konteks spesifik]. Saya bisa bantu [jasa kamu]. Ini contohnya: [link portfolio]'\n3. JANGAN spam — personalisasi setiap pesan\n4. Track semua outreach di spreadsheet: siapa, kapan, respons",
            deliverable: "10 pesan outreach terkirim + spreadsheet tracking",
            time_estimate: "2–3 jam",
            difficulty: "sedang",
            resources: [
              { label: "Google Sheets — Track outreach", url: "https://sheets.google.com", type: "tool" },
              { label: "Template DM outreach", url: "https://docs.google.com/document/d/1example", type: "template" },
            ],
          },
          {
            text: "Post 2x di platform tempat target kamu nongkrong",
            action_guide: "1. Identifikasi 1-2 komunitas target (Facebook group, Reddit, Twitter, forum niche)\n2. Buat post yang VALUE-FIRST: share tips/insight gratis, lalu mention jasa kamu di akhir\n3. Jangan hard sell — 80% value, 20% CTA\n4. Engage di komentar setelah post",
            deliverable: "2 post di platform berbeda + screenshot engagement",
            time_estimate: "1–2 jam",
            difficulty: "sedang",
            resources: [
              { label: "Reddit — Cari subreddit niche", url: "https://www.reddit.com/subreddits", type: "platform" },
              { label: "Facebook Groups", url: "https://www.facebook.com/groups", type: "platform" },
            ],
          },
          {
            text: "Iterasi copy berdasarkan respons",
            action_guide: "1. Review semua respons dari outreach: ada pattern? Ada pertanyaan yang berulang?\n2. Jika banyak yang tanya harga → pricing kurang jelas\n3. Jika banyak yang tanya 'bisa ini?' → tambahkan scope di deskripsi\n4. Update copy portfolio dan deskripsi berdasarkan feedback",
            deliverable: "Deskripsi jasa v2 yang sudah di-update berdasarkan feedback nyata",
            time_estimate: "30–60 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Terima 1 client pertama (bahkan gratis/murah)",
            action_guide: "1. Target: dapatkan 1 client nyata minggu ini — harga boleh sangat murah atau bahkan gratis\n2. Tujuannya: VALIDASI bahwa orang mau pakai jasa kamu, bukan cari untung dulu\n3. Over-deliver: kasih lebih dari yang dijanjikan\n4. Setelah selesai, minta feedback jujur + izin pakai hasilnya sebagai portfolio",
            deliverable: "1 project selesai + feedback dari client",
            time_estimate: "2–4 jam (deliver project)",
            difficulty: "sedang",
            resources: [],
          },
        ],
      },
      {
        week: 3,
        title: "Validation & Pricing",
        tasks: [
          {
            text: "Adjust positioning berdasarkan feedback client",
            action_guide: "1. Review feedback dari client pertama: apa yang mereka suka? Apa yang perlu improve?\n2. Jika feedback positif → positioning sudah oke, polish saja\n3. Jika feedback netral → adjust angle: mungkin target market berbeda\n4. Update portfolio page dengan insight baru",
            deliverable: "Portfolio page v2 yang sudah di-update + catatan adjustment",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Set harga berdasarkan value, bukan waktu",
            action_guide: "1. Jangan hitung per jam — hitung per VALUE yang kamu deliver\n2. Riset: berapa harga kompetitor untuk jasa serupa di Fiverr/Upwork?\n3. Set harga di kisaran 70% dari rata-rata kompetitor (karena masih baru)\n4. Buat 2-3 tier pricing: Basic / Standard / Premium",
            deliverable: "Pricing structure dengan 2-3 tier yang sudah dipasang di portfolio",
            time_estimate: "30–60 menit",
            difficulty: "sedang",
            resources: [
              { label: "Fiverr — Riset harga kompetitor", url: "https://www.fiverr.com", type: "platform" },
              { label: "Upwork — Riset rate", url: "https://www.upwork.com", type: "platform" },
            ],
          },
          {
            text: "Minta 1 testimonial",
            action_guide: "1. Hubungi client pertama, minta testimonial singkat (3-4 kalimat)\n2. Template: 'Boleh minta review singkat tentang pengalaman kerja sama kita? Cukup 2-3 kalimat tentang hasil dan prosesnya'\n3. Jika client tidak mau tulis, minta izin screenshot chat positif\n4. Tampilkan testimonial di portfolio page",
            deliverable: "1 testimonial tertulis yang sudah dipasang di portfolio",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Refinement workflow AI kamu agar lebih cepat",
            action_guide: "1. Review workflow dari project pertama: mana yang paling lambat?\n2. Buat template prompt AI yang bisa di-reuse untuk project serupa\n3. Simpan prompt template di Notion/Notes — ini aset kamu\n4. Target: kurangi waktu delivery 30-50% dari project pertama",
            deliverable: "1 set prompt template yang tersimpan rapi + workflow yang lebih cepat",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [
              { label: "Notion — Simpan prompt library", url: "https://www.notion.so", type: "tool" },
            ],
          },
        ],
      },
      {
        week: 4,
        title: "Scaling Ringan",
        tasks: [
          {
            text: "Naikkan harga 20-30%",
            action_guide: "1. Jika kamu sudah punya 1+ client dan testimonial, kamu punya leverage\n2. Naikkan harga 20-30% untuk client baru — JANGAN diskon balik\n3. Jika client baru masih mau bayar → harga kamu kemarin terlalu murah\n4. Jika conversion turun drastis → rollback sedikit atau tambah value",
            deliverable: "Pricing baru yang sudah di-update di semua platform",
            time_estimate: "15 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Buat template untuk repeat task",
            action_guide: "1. Identifikasi task yang sering muncul dari project-project kamu\n2. Buat SOP sederhana: input → proses AI → output → quality check\n3. Buat template dokumen yang tinggal di-customize per client\n4. Ini kunci scaling: kecepatan naik, kualitas tetap konsisten",
            deliverable: "1 SOP + template yang bisa langsung dipakai untuk project berikutnya",
            time_estimate: "1–2 jam",
            difficulty: "sedang",
            resources: [
              { label: "Notion — SOP Template", url: "https://www.notion.so/templates", type: "template" },
            ],
          },
          {
            text: "Tambah 1 channel outreach baru",
            action_guide: "1. Jika minggu 2 kamu DM → sekarang coba marketplace (Fiverr/Upwork)\n2. Jika minggu 2 kamu marketplace → sekarang coba content marketing (post value di socmed)\n3. Diversifikasi channel = lebih stabil\n4. Alokasi 30 menit/hari untuk channel baru ini",
            deliverable: "1 profil/akun baru di channel berbeda yang sudah aktif",
            time_estimate: "1–2 jam",
            difficulty: "sedang",
            resources: [
              { label: "Fiverr — Buat gig", url: "https://www.fiverr.com/start_selling", type: "platform" },
              { label: "Upwork — Buat profil", url: "https://www.upwork.com/freelancer/create", type: "platform" },
            ],
          },
          {
            text: "Evaluasi: lanjut atau pivot niche?",
            action_guide: "1. Hitung total income 30 hari ini\n2. Hitung waktu yang dihabiskan → berapa per jam?\n3. Jika rate > Rp 50K/jam → LANJUT dan scale\n4. Jika rate < Rp 20K/jam → pertimbangkan pivot niche/jasa\n5. Tulis 3 hal yang learned dan 3 hal yang mau di-improve",
            deliverable: "1 halaman evaluasi tertulis: income, rate/jam, keputusan lanjut/pivot",
            time_estimate: "30–60 menit",
            difficulty: "mudah",
            resources: [],
          },
        ],
      },
    ],
    segments: ["zero_capital_builder", "low_capital_experimenter"],
  },

  // ────────────────────────────────
  // 2. NICHE CONTENT MONETIZATION
  // ────────────────────────────────
  {
    id: "niche_content",
    title: "Niche Content Monetization",
    emoji: "📝",
    tagline: "Bangun audience kecil, monetisasi lewat konten",
    description:
      "Build asset audience di niche sempit. Bukan jadi influencer besar — cukup 1000 orang yang tepat. Monetisasi lewat adsense, affiliate, atau authority.",
    moneySource: "Adsense, affiliate commission, niche authority deals",
    timeToTest: "14–30 hari untuk traction awal",
    riskIfFail: "Rendah — konten tetap jadi asset meski monetisasi lambat",
    idealFor: ["Suka menulis/bikin konten", "Modal minim", "Sabar build audience"],
    avoid: [
      "Jangan target broad audience",
      "Jangan kejar viral",
      "Jangan buat konten tentang 'semua hal'",
    ],
    examples: [
      "Micro niche TikTok (1 topik spesifik)",
      "Pinterest niche automation",
      "AI-curated newsletter",
      "Niche blog dengan SEO",
      "YouTube Shorts topik spesifik",
    ],
    weeklyPlan: [
      {
        week: 1,
        title: "Niche Selection & Setup",
        tasks: [
          {
            text: "Riset 3 micro-niche potensial",
            action_guide: "1. Buka Google Trends → cari 3 topik yang naik trendnya\n2. Cek TikTok/YouTube: ada creator kecil yang growing di topik itu?\n3. Validasi: apakah ada produk affiliate di niche ini? Jika ya, monetisasi jelas\n4. Tulis 3 niche beserta alasan kenapa masing-masing menarik",
            deliverable: "Daftar 3 micro-niche + alasan + bukti demand (screenshot trend/views)",
            time_estimate: "1–2 jam",
            difficulty: "sedang",
            resources: [
              { label: "Google Trends", url: "https://trends.google.com", type: "tool" },
              { label: "Exploding Topics — Trend baru", url: "https://explodingtopics.com", type: "tool" },
              { label: "TikTok Creative Center", url: "https://ads.tiktok.com/business/creativecenter", type: "tool" },
            ],
          },
          {
            text: "Pilih 1 niche berdasarkan demand + kemampuan",
            action_guide: "1. Dari 3 niche, pilih yang: (a) kamu bisa bikin konten tanpa riset berat, (b) ada audience yang cari, (c) ada cara monetisasi jelas\n2. Jangan pilih yang 'paling menarik' — pilih yang paling bisa kamu KONSISTEN 30 hari\n3. Commit: tulis 'Niche saya adalah ___' dan tempel di desktop",
            deliverable: "1 niche terpilih + 1 kalimat positioning",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Setup 1 channel utama (TikTok/Pinterest/Newsletter)",
            action_guide: "1. Pilih 1 channel saja — jangan 3 sekaligus\n2. TikTok: ideal untuk short-form, growth cepat\n3. Pinterest: ideal untuk evergreen visual content\n4. Newsletter: ideal untuk build trust + affiliate\n5. Buat akun, isi bio dengan positioning niche, upload foto profil",
            deliverable: "1 akun channel yang sudah setup lengkap (bio, foto, branding dasar)",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [
              { label: "TikTok — Buat akun creator", url: "https://www.tiktok.com/signup", type: "platform" },
              { label: "Pinterest — Buat business account", url: "https://business.pinterest.com", type: "platform" },
              { label: "Beehiiv — Newsletter gratis", url: "https://www.beehiiv.com", type: "platform" },
              { label: "Substack — Newsletter gratis", url: "https://substack.com", type: "platform" },
            ],
          },
          {
            text: "Buat content calendar 30 hari dengan AI",
            action_guide: "1. Buka ChatGPT/Claude, prompt: 'Buatkan content calendar 30 hari untuk [niche kamu] di [platform]. Format: tanggal, judul, angle, hook'\n2. Review dan adjust — buang yang tidak relevan, tambahkan ide kamu\n3. Simpan di Google Sheets atau Notion\n4. Tandai mana yang bisa batch-produce di weekend",
            deliverable: "1 content calendar 30 hari di spreadsheet/Notion",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [
              { label: "Google Sheets — Content calendar template", url: "https://sheets.google.com", type: "tool" },
              { label: "Notion — Content planner", url: "https://www.notion.so/templates/content-calendar", type: "template" },
            ],
          },
        ],
      },
      {
        week: 2,
        title: "Content Sprint",
        tasks: [
          {
            text: "Publish 5-7 konten menggunakan AI",
            action_guide: "1. Dari content calendar, ambil 5-7 judul untuk minggu ini\n2. Untuk setiap konten: buat draft dengan AI → edit → polish → publish\n3. Jangan perfeksionis — 'done' lebih baik dari 'perfect'\n4. Posting di waktu yang konsisten (pilih 1 slot waktu tetap)",
            deliverable: "5-7 konten yang sudah published + link ke masing-masing",
            time_estimate: "4–6 jam (sepanjang minggu)",
            difficulty: "sedang",
            resources: [
              { label: "CapCut — Edit video gratis", url: "https://www.capcut.com", type: "tool" },
              { label: "Canva — Design konten visual", url: "https://www.canva.com", type: "tool" },
            ],
          },
          {
            text: "Analisa mana yang perform (engagement/views)",
            action_guide: "1. Setelah 3-4 hari, cek analytics: mana yang paling banyak views/engagement?\n2. Catat pattern: topik apa? Format apa? Hook seperti apa?\n3. Ranking konten dari best ke worst\n4. Pertanyaan kunci: konten mana yang bikin orang save/share?",
            deliverable: "1 spreadsheet analisis: judul, views, likes, saves + pattern yang ditemukan",
            time_estimate: "30–60 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Double down di format yang works",
            action_guide: "1. Dari analisis, ambil 2-3 format/topik terbaik\n2. Buat 3 variasi dari konten terbaik (angle berbeda, same format)\n3. Ini bukan copy-paste — ini repurpose pattern yang berhasil\n4. Publish dan bandingkan lagi hasilnya",
            deliverable: "3 konten baru yang mengikuti format winning + published",
            time_estimate: "2–3 jam",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Engage 10 orang di niche yang sama",
            action_guide: "1. Cari 10 creator/akun lain di niche serupa\n2. Comment dengan value (bukan 'nice post!' tapi insight nyata)\n3. DM 3-5 orang: ajak collab, share tips, bangun relasi\n4. Ini membangun network yang akan boost konten kamu",
            deliverable: "10 engagement meaningful + 3 DM terkirim",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [],
          },
        ],
      },
      {
        week: 3,
        title: "Monetization Setup",
        tasks: [
          {
            text: "Daftar affiliate program relevan",
            action_guide: "1. Cari affiliate program yang match dengan niche kamu\n2. Amazon Associates: produk fisik\n3. Impact/ShareASale: banyak pilihan brand\n4. Langsung ke website brand yang sering kamu recommend → cek ada affiliate program?\n5. Daftar minimal 2 program",
            deliverable: "2 affiliate account yang sudah approved + link affiliate siap pakai",
            time_estimate: "1–2 jam",
            difficulty: "sedang",
            resources: [
              { label: "Amazon Associates", url: "https://affiliate-program.amazon.com", type: "platform" },
              { label: "Impact — Affiliate network", url: "https://www.impact.com", type: "platform" },
              { label: "ShareASale", url: "https://www.shareasale.com", type: "platform" },
            ],
          },
          {
            text: "Integrasikan link/CTA di konten",
            action_guide: "1. Tambahkan affiliate link di bio/description\n2. Buat konten yang natural untuk recommend produk (review, tutorial, comparison)\n3. Gunakan CTA soft: 'link di bio' atau 'tools yang saya pakai: [link]'\n4. Jangan oversell — trust > short-term commission",
            deliverable: "3 konten yang sudah punya CTA/affiliate link terintegrasi",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Buat 1 lead magnet sederhana",
            action_guide: "1. Buat 1 resource gratis yang audience kamu mau (checklist, template, guide singkat)\n2. Gunakan AI untuk generate draft → polish\n3. Simpan sebagai PDF atau Notion page\n4. CTA: 'Download gratis — link di bio/komentar'",
            deliverable: "1 lead magnet (PDF/Notion) + link download yang sudah di-share",
            time_estimate: "1–2 jam",
            difficulty: "sedang",
            resources: [
              { label: "Canva — Buat PDF lead magnet", url: "https://www.canva.com", type: "tool" },
              { label: "Gumroad — Host download gratis", url: "https://gumroad.com", type: "platform" },
            ],
          },
          {
            text: "Test 2 angle monetisasi berbeda",
            action_guide: "1. Minggu ini, test 2 cara monetisasi: (a) affiliate link di konten, (b) CTA ke lead magnet\n2. Track mana yang lebih banyak klik/conversion\n3. Jangan test lebih dari 2 — terlalu banyak variabel\n4. Catat data: konten apa → monetisasi apa → hasilnya berapa",
            deliverable: "Data A/B test monetisasi: klik, conversion, revenue (meskipun kecil)",
            time_estimate: "30 menit (tracking) + konten sepanjang minggu",
            difficulty: "sedang",
            resources: [],
          },
        ],
      },
      {
        week: 4,
        title: "Optimize & Scale",
        tasks: [
          {
            text: "Analisa revenue per content piece",
            action_guide: "1. Hitung total revenue dari semua sumber (affiliate, adsense, dll)\n2. Bagi per jumlah konten → revenue per piece\n3. Identifikasi: konten mana yang menghasilkan paling banyak?\n4. Pattern apa yang bikin konten menghasilkan?",
            deliverable: "Spreadsheet: setiap konten + revenue + insight",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Kill konten yang tidak perform",
            action_guide: "1. Hapus atau arsip konten yang 0 engagement setelah 7+ hari\n2. Stop buat konten dengan format/topik yang terbukti tidak work\n3. Ini bukan gagal — ini data. Sekarang kamu tahu apa yang TIDAK work\n4. Fokuskan energi 100% ke format winning",
            deliverable: "Daftar konten yang di-kill + alasan + format yang di-keep",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Scale yang works (batch produce)",
            action_guide: "1. Dari format winning, buat 10-15 konten sekaligus dalam 1 sesi (batch)\n2. Gunakan AI untuk generate semua draft → polish satu per satu\n3. Schedule posting untuk 2 minggu ke depan\n4. Ini cara creator produktif: batch > daily grind",
            deliverable: "10-15 konten yang sudah di-schedule untuk 2 minggu",
            time_estimate: "3–4 jam (1 sesi batch)",
            difficulty: "menantang",
            resources: [
              { label: "Later — Schedule social media", url: "https://later.com", type: "tool" },
              { label: "Buffer — Schedule posts", url: "https://buffer.com", type: "tool" },
            ],
          },
          {
            text: "Evaluasi: tetap niche ini atau adjust?",
            action_guide: "1. Hitung total: followers gained, engagement rate, revenue\n2. Jika growing + revenue > 0 → LANJUT dan scale\n3. Jika growing tapi revenue 0 → adjust monetisasi, bukan niche\n4. Jika tidak growing → pertimbangkan pivot niche atau platform\n5. Tulis keputusan final + rencana 30 hari berikutnya",
            deliverable: "1 halaman evaluasi: metrics, keputusan, rencana next 30 days",
            time_estimate: "30–60 menit",
            difficulty: "mudah",
            resources: [],
          },
        ],
      },
    ],
    segments: ["zero_capital_builder", "low_capital_experimenter", "long_term_builder"],
  },

  // ────────────────────────────────
  // 3. AI-ASSISTED FREELANCE UPGRADE
  // ────────────────────────────────
  {
    id: "freelance_upgrade",
    title: "AI Freelance Upgrade",
    emoji: "🚀",
    tagline: "Naikkan harga jasa 2-3x dengan leverage AI",
    description:
      "Kamu sudah punya skill dasar. Gunakan AI untuk mempercepat delivery, meningkatkan kualitas, dan menaikkan harga. Bukan ganti skill — amplify skill.",
    moneySource: "Freelance project dengan harga premium",
    timeToTest: "7–14 hari (langsung apply ke project existing)",
    riskIfFail: "Sangat rendah — skill asli tetap ada sebagai backup",
    idealFor: ["Sudah punya skill", "Freelancer aktif/pemula", "Mau naikkan income"],
    avoid: [
      "Jangan 100% gantungkan ke AI",
      "Jangan overpromise ke client",
      "Jangan switch niche — upgrade yang ada",
    ],
    examples: [
      "Designer + AI mockup accelerator",
      "Copywriter + AI research assistant",
      "Data analyst + automation scripts",
      "Developer + AI code review",
      "Translator + AI first-draft",
    ],
    weeklyPlan: [
      {
        week: 1,
        title: "AI Workflow Integration",
        tasks: [
          {
            text: "Identifikasi 3 bottleneck di workflow kamu sekarang",
            action_guide: "1. List semua tahapan kerja kamu dari order masuk sampai deliver\n2. Hitung waktu masing-masing tahap\n3. Tandai 3 tahap yang paling makan waktu\n4. Prioritaskan yang bisa di-automate dengan AI",
            deliverable: "Daftar workflow + 3 bottleneck yang ditandai + estimasi waktu masing-masing",
            time_estimate: "30–60 menit",
            difficulty: "mudah",
            resources: [
              { label: "Miro — Buat workflow diagram", url: "https://miro.com", type: "tool" },
            ],
          },
          {
            text: "Setup AI tools untuk automate bottleneck #1",
            action_guide: "1. Pilih bottleneck #1 (yang paling makan waktu)\n2. Cari AI tool yang bisa handle: ChatGPT untuk writing, Midjourney untuk visual, dll\n3. Buat prompt/workflow yang reusable\n4. Test dengan 1 task nyata → bandingkan waktu manual vs AI-assisted",
            deliverable: "1 AI tool ter-setup + 1 reusable prompt + bukti time comparison",
            time_estimate: "1–2 jam",
            difficulty: "sedang",
            resources: [
              { label: "ChatGPT", url: "https://chat.openai.com", type: "tool" },
              { label: "Claude AI", url: "https://claude.ai", type: "tool" },
              { label: "Midjourney", url: "https://www.midjourney.com", type: "tool" },
            ],
          },
          {
            text: "Test: bandingkan waktu kerja sebelum vs sesudah",
            action_guide: "1. Kerjakan 1 task yang sama dengan cara lama → catat waktu\n2. Kerjakan task yang sama dengan AI-assisted → catat waktu\n3. Hitung: berapa % waktu yang dihemat?\n4. Cek kualitas: sama, lebih baik, atau lebih buruk?",
            deliverable: "Data perbandingan: waktu sebelum, waktu sesudah, % hemat, kualitas",
            time_estimate: "1–2 jam",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Dokumentasikan workflow baru",
            action_guide: "1. Tulis SOP baru: step-by-step workflow yang sudah AI-enhanced\n2. Simpan semua prompt yang dipakai\n3. Buat checklist quality control — jangan skip QC meski pakai AI\n4. Ini jadi panduan kamu agar konsisten",
            deliverable: "1 dokumen SOP baru + library prompt yang tersimpan rapi",
            time_estimate: "30–60 menit",
            difficulty: "mudah",
            resources: [
              { label: "Notion — SOP & prompt library", url: "https://www.notion.so", type: "tool" },
            ],
          },
        ],
      },
      {
        week: 2,
        title: "Quality & Speed Upgrade",
        tasks: [
          {
            text: "Apply AI workflow ke 2-3 project nyata",
            action_guide: "1. Ambil 2-3 project baru atau existing\n2. Apply SOP baru dari minggu 1\n3. Track waktu delivery per project — berapa jam total?\n4. Catat feedback client tentang kualitas",
            deliverable: "2-3 project selesai dengan workflow baru + time log",
            time_estimate: "Sepanjang minggu (per project)",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Ukur: berapa jam dihemat per project?",
            action_guide: "1. Bandingkan rata-rata waktu per project sebelum vs sekarang\n2. Hitung: berapa jam/project yang dihemat?\n3. Konversi ke uang: jika rate kamu Rp X/jam, berapa value time saved?\n4. Ini amunisi kamu untuk naikkan harga nanti",
            deliverable: "Spreadsheet: jam per project lama vs baru + total jam yang dihemat",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [
              { label: "Google Sheets — Time tracking", url: "https://sheets.google.com", type: "tool" },
            ],
          },
          {
            text: "Automate bottleneck #2 dan #3",
            action_guide: "1. Terapkan pendekatan yang sama dari bottleneck #1 ke #2 dan #3\n2. Untuk setiap: cari AI tool → buat prompt → test → dokumentasikan\n3. Mungkin tidak semua bisa 100% automated — target 50-80% automation\n4. Update SOP dengan step baru",
            deliverable: "2 bottleneck tambahan yang sudah di-automate + SOP updated",
            time_estimate: "2–3 jam",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Buat before/after portfolio",
            action_guide: "1. Dari project minggu ini, ambil 2-3 contoh terbaik\n2. Buat showcase: 'Sebelum AI (5 jam) → Setelah AI (2 jam), kualitas sama/lebih baik'\n3. Ini proof point untuk client baru bahwa kamu deliver faster\n4. Format: case study singkat atau side-by-side comparison",
            deliverable: "2-3 case study before/after yang siap ditunjukkan ke prospek",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [
              { label: "Canva — Buat case study visual", url: "https://www.canva.com", type: "tool" },
            ],
          },
        ],
      },
      {
        week: 3,
        title: "Pricing Upgrade",
        tasks: [
          {
            text: "Hitung value baru berdasarkan output quality + speed",
            action_guide: "1. Dengan AI, kamu deliver lebih cepat DAN kualitas sama/lebih baik\n2. Hitung: jika kamu bisa deliver 2x lebih cepat, value kamu naik minimal 50%\n3. Riset rate kompetitor yang sudah 'AI-enhanced'\n4. Set target rate baru: minimal 30% di atas rate lama",
            deliverable: "Rate baru yang sudah dihitung + justifikasi tertulis",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Naikkan rate 30-50% untuk client baru",
            action_guide: "1. Update rate di semua platform/proposal\n2. Untuk client lama: JANGAN langsung naikkan — tunggu project berikutnya\n3. Untuk client baru: langsung pakai rate baru\n4. Jangan minta maaf soal harga — deliver value, bukan waktu",
            deliverable: "Rate baru yang sudah live di semua platform + 1 proposal dengan rate baru",
            time_estimate: "30 menit",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Pitch ke 5 prospek dengan rate baru",
            action_guide: "1. Kirim proposal ke 5 prospek baru dengan rate baru\n2. Sertakan: case study before/after + testimonial\n3. Positioning: 'AI-enhanced workflow = faster delivery, same/better quality'\n4. Track response rate — berapa yang accept?",
            deliverable: "5 proposal terkirim + tracking spreadsheet respons",
            time_estimate: "2–3 jam",
            difficulty: "sedang",
            resources: [
              { label: "Upwork — Apply project", url: "https://www.upwork.com", type: "platform" },
            ],
          },
          {
            text: "Collect feedback dari client",
            action_guide: "1. Dari project minggu 1-2, minta feedback tertulis\n2. Template: 'Bagaimana pengalaman kerja dengan saya? Apa yang bisa di-improve?'\n3. Feedback positif → jadikan testimonial\n4. Feedback negatif → perbaiki di project selanjutnya",
            deliverable: "2-3 feedback tertulis + 1-2 testimonial siap pakai",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
        ],
      },
      {
        week: 4,
        title: "Positioning Premium",
        tasks: [
          {
            text: "Update semua profile dengan 'AI-enhanced' positioning",
            action_guide: "1. Update bio/description di semua platform: tekankan speed + quality advantage\n2. Jangan bilang 'saya pakai AI' — bilang 'delivery 2x lebih cepat dengan kualitas premium'\n3. Tambahkan case study dan testimonial baru\n4. Pastikan portfolio page up-to-date",
            deliverable: "Semua profil platform sudah di-update dengan positioning baru",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Buat case study dari project minggu 2-3",
            action_guide: "1. Pilih 1-2 project terbaik dari minggu 2-3\n2. Tulis case study: Problem client → Solusi kamu → Hasil → Testimonial\n3. Format: 1 page, visual, dengan data (waktu delivery, kualitas score)\n4. Gunakan sebagai senjata utama di proposal",
            deliverable: "1-2 case study lengkap yang siap di-attach ke proposal",
            time_estimate: "1–2 jam",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Target market segment yang willing to pay premium",
            action_guide: "1. Analisa: client tipe apa yang paling happy dan paling willing bayar?\n2. Focus ke segment ini — jangan kejar semua orang\n3. Riset: di mana mereka nongkrong? Platform apa? Community apa?\n4. Shift outreach ke segment premium ini",
            deliverable: "1 target market segment + 3 tempat/platform untuk reach mereka",
            time_estimate: "1 jam",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Evaluasi: sustainable atau perlu adjust?",
            action_guide: "1. Hitung: total income minggu 1-4 vs sebelum pakai AI\n2. Hitung: rata-rata rate per jam sekarang vs dulu\n3. Jika income naik 30%+ → sustainable, scale terus\n4. Jika income flat → cari bottleneck di sales, bukan delivery\n5. Tulis rencana 30 hari berikutnya",
            deliverable: "Evaluasi tertulis: income comparison, rate comparison, rencana next",
            time_estimate: "30–60 menit",
            difficulty: "mudah",
            resources: [],
          },
        ],
      },
    ],
    segments: ["skill_leverager"],
  },

  // ────────────────────────────────
  // 4. ARBITRAGE SKILL (SERVICE FLIP)
  // ────────────────────────────────
  {
    id: "arbitrage_skill",
    title: "Arbitrage Skill",
    emoji: "🔄",
    tagline: "Ambil job, eksekusi pakai AI, ambil margin",
    description:
      "Kamu tidak perlu skill teknis. Cukup bisa komunikasi dan manage ekspektasi. Ambil job dari marketplace → eksekusi dengan AI → deliver → margin kamu.",
    moneySource: "Margin antara harga jual dan cost eksekusi (AI tools)",
    timeToTest: "7–14 hari",
    riskIfFail: "Sedang — reputasi bisa rusak jika overpromise",
    idealFor: ["Komunikator baik", "Tidak punya skill teknis", "Siap eksperimen"],
    avoid: [
      "Jangan ambil project yang terlalu kompleks",
      "Jangan janji hasil yang AI tidak bisa deliver",
      "Jangan skip quality check",
    ],
    examples: [
      "Ambil order copywriting → AI generate → polish → deliver",
      "Ambil order desain sederhana → AI create → refine → deliver",
      "Ambil order research → AI compile → verify → deliver",
    ],
    weeklyPlan: [
      {
        week: 1,
        title: "Market & Tool Setup",
        tasks: [
          {
            text: "Pilih 1 jenis service yang AI bisa handle 80%+",
            action_guide: "1. List jasa yang demand-nya tinggi di Fiverr: copywriting, translation, data entry, research\n2. Test: bisa AI handle 80%+ dari deliverable? Kamu cuma perlu polish\n3. Pilih yang margin paling tinggi (harga jual - waktu kamu)\n4. PENTING: pilih yang kamu bisa quality-check hasilnya",
            deliverable: "1 jenis jasa terpilih + proof bahwa AI bisa handle 80%",
            time_estimate: "1 jam",
            difficulty: "sedang",
            resources: [
              { label: "Fiverr — Kategori populer", url: "https://www.fiverr.com/categories", type: "platform" },
              { label: "Upwork — Jasa yang dicari", url: "https://www.upwork.com/freelance-jobs", type: "platform" },
            ],
          },
          {
            text: "Setup account di 2 marketplace (Fiverr/Upwork/dll)",
            action_guide: "1. Buat akun seller di Fiverr DAN Upwork (diversifikasi)\n2. Lengkapi profil: foto, bio, skill tags\n3. Di Fiverr: buat 1-2 gig dengan title yang SEO-friendly\n4. Di Upwork: lengkapi profil + set rate competitive",
            deliverable: "2 akun marketplace yang sudah live dan siap terima order",
            time_estimate: "1–2 jam",
            difficulty: "mudah",
            resources: [
              { label: "Fiverr Seller Guide", url: "https://www.fiverr.com/resources/guides/selling", type: "guide" },
              { label: "Upwork — Buat profil", url: "https://www.upwork.com/freelancer/create", type: "guide" },
            ],
          },
          {
            text: "Buat 3 sample output dengan AI",
            action_guide: "1. Generate 3 sample deliverable menggunakan AI\n2. Polish setiap sample — ini TIDAK boleh terlihat seperti raw AI output\n3. Tambahkan sentuhan personal: formatting rapi, cover page, branding\n4. Upload sebagai portfolio di kedua marketplace",
            deliverable: "3 sample portfolio yang sudah di-polish dan di-upload",
            time_estimate: "1–2 jam",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Set pricing competitive tapi profitable",
            action_guide: "1. Riset 10 seller lain yang jual jasa serupa → catat harga\n2. Set harga 20-30% di bawah rata-rata (untuk start)\n3. Hitung: berapa waktu kamu per order? Minimal Rp 30K/jam\n4. Jika margin terlalu tipis → naikkan harga atau cari jasa lain",
            deliverable: "Pricing yang sudah dipasang + spreadsheet kalkulasi margin",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
        ],
      },
      {
        week: 2,
        title: "First Orders",
        tasks: [
          {
            text: "Bid/offer 10-15 project",
            action_guide: "1. Di Upwork: send 10-15 proposal yang personalized (BUKAN copy-paste)\n2. Di Fiverr: optimize gig title + tags + description untuk SEO\n3. Template proposal: 'Saya bisa [deliverable] dalam [waktu]. Ini contohnya: [link sample]'\n4. Track semua bid di spreadsheet",
            deliverable: "10-15 proposal/bid terkirim + tracking spreadsheet",
            time_estimate: "2–3 jam",
            difficulty: "sedang",
            resources: [
              { label: "Google Sheets — Bid tracker", url: "https://sheets.google.com", type: "tool" },
            ],
          },
          {
            text: "Terima 1-3 order pertama (harga rendah untuk review)",
            action_guide: "1. Target: dapatkan 1-3 order nyata — harga boleh rendah, tujuannya REVIEW\n2. Over-deliver: kasih lebih dari yang dijanjikan\n3. Deliver lebih cepat dari deadline\n4. Di akhir, minta review/rating dengan sopan",
            deliverable: "1-3 order selesai + delivery sebelum deadline",
            time_estimate: "3–6 jam (sepanjang minggu)",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Deliver dengan quality check ketat",
            action_guide: "1. JANGAN langsung kirim output AI mentah\n2. Checklist QC: grammar, formatting, accuracy, brand consistency\n3. Baca ulang minimal 2x sebelum submit\n4. ⚠️ RISIKO UTAMA arbitrage = kualitas jelek → reputasi hancur",
            deliverable: "Deliverable yang sudah lewat QC checklist + delivered ke client",
            time_estimate: "30 menit per order (QC)",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Minta review/rating",
            action_guide: "1. Setelah client konfirmasi puas, minta rating\n2. Template: 'Terima kasih atas projectnya! Saya senang hasilnya sesuai harapan. Boleh minta review-nya?'\n3. Rating awal sangat penting — ini yang bikin order selanjutnya datang\n4. Jika ada feedback negatif, perbaiki SEBELUM minta rating",
            deliverable: "1-3 review/rating positif di marketplace",
            time_estimate: "15 menit",
            difficulty: "mudah",
            resources: [],
          },
        ],
      },
      {
        week: 3,
        title: "Optimization",
        tasks: [
          {
            text: "Analisa margin per order",
            action_guide: "1. Hitung per order: harga jual - (waktu × rate per jam kamu) - tool cost\n2. Jika margin > 50% → sustainable\n3. Jika margin < 30% → harga terlalu rendah atau workflow terlalu lambat\n4. Identifikasi order mana yang paling profitable",
            deliverable: "Spreadsheet margin analysis per order",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Optimize AI workflow untuk speed",
            action_guide: "1. Dari pengalaman minggu 2, mana yang paling lambat?\n2. Buat template prompt yang lebih spesifik → output AI lebih bagus\n3. Buat SOP agar setiap order ikut alur yang sama\n4. Target: kurangi waktu per order 30-50%",
            deliverable: "SOP workflow yang sudah dioptimasi + prompt template",
            time_estimate: "1 jam",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Naikkan harga berdasarkan rating",
            action_guide: "1. Jika sudah punya 3+ review positif, naikkan harga 20-30%\n2. Rating bagus = trust signal → client mau bayar lebih\n3. Update harga di semua gig/profil\n4. Test: apakah conversion rate masih oke?",
            deliverable: "Harga baru yang sudah di-update + 1 minggu data conversion",
            time_estimate: "15 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Identifikasi repeat order potential",
            action_guide: "1. Review semua client: siapa yang mungkin perlu jasa kamu lagi?\n2. Kirim follow-up: 'Hai, kalau ada project lain yang serupa, saya siap bantu'\n3. Offer deal: 'Untuk repeat order, saya kasih prioritas delivery'\n4. Repeat client = income paling stabil",
            deliverable: "List client potensial repeat + follow-up terkirim",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
        ],
      },
      {
        week: 4,
        title: "Scale or Pivot",
        tasks: [
          {
            text: "Evaluasi: profitable dan sustainable?",
            action_guide: "1. Hitung total income 30 hari\n2. Hitung total jam kerja\n3. Rate per jam = income / jam kerja\n4. Jika rate > Rp 50K/jam → profitable, lanjut scale\n5. Jika rate < Rp 20K/jam → perlu pivot atau optimize",
            deliverable: "Laporan evaluasi: income, jam, rate/jam, keputusan",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Jika ya: scale volume atau naikkan harga",
            action_guide: "1. Opsi A: naikkan harga 20-30% lagi → margin lebih tinggi\n2. Opsi B: tambah volume → bidding lebih agresif\n3. Opsi C: buat gig baru di kategori berbeda tapi serupa\n4. Pilih 1 strategi scaling, jangan semua sekaligus",
            deliverable: "1 strategi scaling yang dipilih + action plan implementasi",
            time_estimate: "30 menit",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Jika tidak: pivot ke service type lain",
            action_guide: "1. Analisa: kenapa tidak profitable? Demand rendah? Margin tipis? Waktu terlalu lama?\n2. Berdasarkan penyebab, pilih jasa alternatif\n3. JANGAN buang akun yang sudah punya rating — tambah gig baru saja\n4. Terapkan learnings dari 30 hari ini ke jasa baru",
            deliverable: "Analisis kenapa pivot + jasa baru yang dipilih",
            time_estimate: "1 jam",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Build process documentation untuk consistency",
            action_guide: "1. Dokumentasikan SEMUA yang kamu learned: apa yang work, apa yang tidak\n2. Buat SOP final: dari order masuk → AI generate → QC → deliver\n3. Simpan semua prompt template\n4. Ini aset yang bisa kamu pakai/teach ke orang lain nanti",
            deliverable: "1 dokumen master: SOP + learnings + prompt library",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [
              { label: "Notion — Master documentation", url: "https://www.notion.so", type: "tool" },
            ],
          },
        ],
      },
    ],
    segments: ["low_capital_experimenter", "risk_taker"],
  },

  // ────────────────────────────────
  // 5. AI DIGITAL PRODUCT LITE
  // ────────────────────────────────
  {
    id: "digital_product",
    title: "AI Digital Product",
    emoji: "📦",
    tagline: "Buat asset digital yang bisa dijual berulang",
    description:
      "Lebih lambat dari service, tapi scalable. Buat template, mini tool, Notion pack, atau bundle niche — sekali buat, jual berkali-kali.",
    moneySource: "Penjualan digital product (one-time atau subscription)",
    timeToTest: "14–30 hari untuk launch pertama",
    riskIfFail: "Rendah-sedang — waktu investasi lebih besar tapi produk tetap jadi asset",
    idealFor: ["Mau passive income", "Sabar build", "Punya skill dasar"],
    avoid: [
      "Jangan buat produk terlalu kompleks di awal",
      "Jangan skip market validation",
      "Jangan target market yang terlalu broad",
    ],
    examples: [
      "Notion template pack untuk niche spesifik",
      "AI prompt bundle untuk industri tertentu",
      "Mini automation tool (spreadsheet/Zapier)",
      "E-book/guide niche dengan AI assist",
      "Design template pack",
    ],
    weeklyPlan: [
      {
        week: 1,
        title: "Validation & MVP",
        tasks: [
          {
            text: "Riset 5 digital product yang laku di niche kamu",
            action_guide: "1. Buka Gumroad Discover, Notion template gallery, Creative Market\n2. Cari produk di niche kamu yang punya review/sales\n3. Catat: apa produknya, berapa harganya, berapa review\n4. Identifikasi gap: ada permintaan yang belum ter-cover?",
            deliverable: "Daftar 5 produk + harga + review + gap analysis",
            time_estimate: "1–2 jam",
            difficulty: "sedang",
            resources: [
              { label: "Gumroad Discover", url: "https://gumroad.com/discover", type: "platform" },
              { label: "Notion Template Gallery", url: "https://www.notion.so/templates", type: "platform" },
              { label: "Creative Market", url: "https://creativemarket.com", type: "platform" },
            ],
          },
          {
            text: "Pilih 1 product idea yang paling simple",
            action_guide: "1. Dari 5 riset, pilih 1 yang: (a) paling simple dibuat, (b) demand jelas ada, (c) kamu bisa buat lebih baik\n2. Jangan pilih yang kompleks — MVP harus selesai dalam 3-4 hari\n3. Contoh sederhana: Notion template, checklist PDF, prompt pack, spreadsheet tool\n4. Definisikan: apa deliverable-nya? Siapa target-nya? Berapa harganya?",
            deliverable: "1 product idea + target audience + target harga",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Buat MVP (minimum version) dalam 3-4 hari",
            action_guide: "1. Buat versi paling sederhana dari produk — BUKAN versi sempurna\n2. Gunakan AI untuk generate konten/template dasar\n3. Polish desain agar terlihat profesional (Canva/Figma)\n4. Test sendiri: apakah ini berguna? Apakah kamu mau bayar untuk ini?",
            deliverable: "1 produk digital yang sudah jadi (MVP) dan siap ditunjukkan",
            time_estimate: "4–8 jam (3-4 hari)",
            difficulty: "menantang",
            resources: [
              { label: "Canva — Design produk", url: "https://www.canva.com", type: "tool" },
              { label: "Figma — Design template", url: "https://www.figma.com", type: "tool" },
              { label: "Notion — Buat template", url: "https://www.notion.so", type: "tool" },
            ],
          },
          {
            text: "Minta feedback 3-5 orang target market",
            action_guide: "1. Kirim produk MVP ke 3-5 orang yang match target market\n2. Tanyakan: 'Apakah ini berguna? Berapa kamu mau bayar? Apa yang kurang?'\n3. JANGAN minta feedback dari teman/keluarga — minta dari target market nyata\n4. Catat semua feedback untuk iterasi minggu 2",
            deliverable: "3-5 feedback tertulis + insight yang actionable",
            time_estimate: "1 jam (kirim) + tunggu respons",
            difficulty: "sedang",
            resources: [],
          },
        ],
      },
      {
        week: 2,
        title: "Build & Polish",
        tasks: [
          {
            text: "Iterasi berdasarkan feedback",
            action_guide: "1. Dari feedback minggu 1, identifikasi: apa yang perlu ditambah? Apa yang perlu dibuang?\n2. Prioritaskan perubahan yang paling banyak diminta\n3. Implement perubahan — jangan overthink\n4. Test ulang: kirim versi baru ke 1-2 orang yang sudah kasih feedback",
            deliverable: "Produk v2 yang sudah di-iterasi berdasarkan feedback nyata",
            time_estimate: "2–4 jam",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Buat landing page sederhana",
            action_guide: "1. Gunakan Carrd/Notion/Gumroad page sebagai landing page\n2. Struktur: Headline → Problem → Solution → Preview → Harga → CTA\n3. Tulis copy yang fokus ke benefit, bukan fitur\n4. Tambahkan preview/mockup yang menarik",
            deliverable: "1 landing page yang live + CTA beli/download",
            time_estimate: "1–2 jam",
            difficulty: "sedang",
            resources: [
              { label: "Carrd — Landing page gratis", url: "https://carrd.co", type: "platform" },
            ],
          },
          {
            text: "Setup payment (Gumroad/LemonSqueezy)",
            action_guide: "1. Buat akun Gumroad atau Lemon Squeezy (gratis, no monthly fee)\n2. Upload produk + set harga\n3. Connect payment (Stripe/PayPal)\n4. Test: beli sendiri untuk pastikan flow lancar",
            deliverable: "Payment setup yang sudah tested + product page yang live",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [
              { label: "Gumroad — Jual digital product", url: "https://gumroad.com", type: "platform" },
              { label: "Lemon Squeezy", url: "https://www.lemonsqueezy.com", type: "platform" },
            ],
          },
          {
            text: "Buat 2-3 preview/screenshot menarik",
            action_guide: "1. Buat mockup produk yang eye-catching\n2. Screenshot halaman terbaik/fitur terbaik dari produk\n3. Buat before/after atau 'what you get' visual\n4. Upload ke landing page dan social media",
            deliverable: "2-3 visual preview yang menarik + sudah di-upload",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [
              { label: "Canva — Buat mockup", url: "https://www.canva.com", type: "tool" },
              { label: "Shottr — Screenshot tool", url: "https://shottr.cc", type: "tool" },
            ],
          },
        ],
      },
      {
        week: 3,
        title: "Launch & Distribute",
        tasks: [
          {
            text: "Soft launch ke community relevan",
            action_guide: "1. Post di 1-2 community yang paling relevan dengan niche produk kamu\n2. Format post: share value dulu, mention produk di akhir\n3. Offer diskon launch 20-30% untuk early adopters\n4. Engage di komentar — jawab pertanyaan dengan detail",
            deliverable: "1-2 post launch + link tracking clicks",
            time_estimate: "1 jam",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Post di 3-5 platform (Reddit/Twitter/forum niche)",
            action_guide: "1. Sebarkan ke platform berbeda: Reddit (subreddit relevan), Twitter/X, Facebook groups, forum niche\n2. Customize angle per platform — jangan copy-paste\n3. Reddit: share as helpful resource. Twitter: thread about the problem your product solves\n4. Track: platform mana yang generate paling banyak traffic?",
            deliverable: "3-5 post di platform berbeda + tracking clicks per platform",
            time_estimate: "2–3 jam",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Reach out ke 10 micro-influencer di niche",
            action_guide: "1. Cari 10 creator/influencer kecil (1K-10K followers) di niche kamu\n2. DM: 'Hai, saya buat [produk]. Boleh saya kirim gratis? Kalau suka, mungkin bisa share?'\n3. Jangan expect semua reply — 2-3 yang respond sudah bagus\n4. Siapkan link affiliate jika mereka mau promote",
            deliverable: "10 DM terkirim + tracking respons",
            time_estimate: "1–2 jam",
            difficulty: "menantang",
            resources: [],
          },
          {
            text: "Collect early reviews",
            action_guide: "1. Dari semua buyer, minta review\n2. Template: 'Terima kasih sudah beli! Boleh share pengalaman kamu? Review singkat sangat membantu'\n3. Review positif → taruh di landing page\n4. Review kritis → jadikan insight untuk improve",
            deliverable: "2-5 review yang bisa ditampilkan di landing page",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
        ],
      },
      {
        week: 4,
        title: "Optimize & Next Product",
        tasks: [
          {
            text: "Analisa conversion rate",
            action_guide: "1. Hitung: berapa orang visit landing page? Berapa yang beli?\n2. Conversion rate = buyers / visitors × 100\n3. Benchmark: 2-5% conversion rate sudah bagus untuk digital product\n4. Jika < 1% → problem di landing page atau positioning",
            deliverable: "Data: visitors, buyers, conversion rate, revenue total",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "A/B test harga atau positioning",
            action_guide: "1. Test 1 variabel: HARGA atau POSITIONING (jangan dua-duanya)\n2. Opsi harga: naikkan 20% untuk 1 minggu, lihat efeknya\n3. Opsi positioning: ganti headline/angle, lihat conversion\n4. Keputusan berdasarkan data, bukan feeling",
            deliverable: "Hasil A/B test: variabel, data, keputusan",
            time_estimate: "1 jam setup + 1 minggu data",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Plan product #2 berdasarkan learnings",
            action_guide: "1. Dari 30 hari ini, apa yang kamu learned tentang market?\n2. Ada request dari buyer yang belum ter-cover?\n3. Product #2 harus lebih cepat dibuat karena kamu sudah punya proses\n4. Brainstorm 3 ide → pilih 1 yang paling menjanjikan",
            deliverable: "1 product idea #2 + timeline pembuatan",
            time_estimate: "30–60 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Evaluasi: worth scaling atau pivot?",
            action_guide: "1. Total revenue 30 hari vs waktu yang dihabiskan\n2. Jika revenue > 0 dan growing → scale (more traffic, more products)\n3. Jika revenue = 0 tapi traction ada → adjust pricing/positioning\n4. Jika revenue = 0 dan no traction → pivot niche atau product type\n5. Tulis rencana 30 hari berikutnya",
            deliverable: "Evaluasi tertulis: revenue, traction, keputusan, rencana next 30 days",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
        ],
      },
    ],
    segments: ["low_capital_experimenter", "skill_leverager", "long_term_builder"],
  },

  // ────────────────────────────────
  // 6. HIGH RISK SPECULATIVE
  // ────────────────────────────────
  {
    id: "high_risk_speculative",
    title: "High Risk Speculative",
    emoji: "🎲",
    tagline: "High volatility, high potential — bukan untuk semua orang",
    description:
      "AI-assisted trading, trend flipping, viral content arbitrage. Bisa sangat profitable, bisa juga gagal total. Hanya untuk yang toleransi risikonya tinggi dan punya modal.",
    moneySource: "Trading margin, trend arbitrage, viral content revenue",
    timeToTest: "7–14 hari (tapi hasil sangat volatile)",
    riskIfFail: "Tinggi — bisa kehilangan modal dan waktu signifikan",
    idealFor: ["Risk taker", "Punya modal", "Siap gagal dan coba lagi"],
    avoid: [
      "Jangan pakai uang yang tidak siap hilang",
      "Jangan all-in di satu strategi",
      "Jangan ignore risk management",
    ],
    examples: [
      "AI-assisted crypto/stock signal trading",
      "Trend flipping (beli murah, jual saat hype)",
      "Viral content arbitrage (ride trending topic)",
      "AI tool affiliate saat tool trending",
    ],
    weeklyPlan: [
      {
        week: 1,
        title: "Research & Setup",
        tasks: [
          {
            text: "Pilih 1 arena spesifik (trading/trend flip/content arb)",
            action_guide: "1. Pilih SATU arena saja — jangan semua\n2. Trading: butuh modal + bisa analisis. Trend flip: butuh speed + sense of timing. Content arb: butuh volume + kreativitas\n3. Pilih berdasarkan modal dan skill kamu\n4. PENTING: kalau modal < Rp 1 juta, JANGAN pilih trading — pilih content arb",
            deliverable: "1 arena terpilih + alasan kenapa + risk assessment tertulis",
            time_estimate: "1 jam",
            difficulty: "sedang",
            resources: [
              { label: "TradingView — Market analysis", url: "https://www.tradingview.com", type: "tool" },
              { label: "Google Trends — Trend spotting", url: "https://trends.google.com", type: "tool" },
            ],
          },
          {
            text: "Setup tools dan AI workflow",
            action_guide: "1. Untuk trading: setup TradingView + AI untuk signal analysis\n2. Untuk trend flip: setup Google Trends + social listening tools\n3. Untuk content arb: setup content creation workflow + scheduling\n4. Buat prompt AI yang spesifik untuk arena kamu",
            deliverable: "Tools ter-setup + 1 AI workflow yang reusable",
            time_estimate: "1–2 jam",
            difficulty: "sedang",
            resources: [
              { label: "ChatGPT", url: "https://chat.openai.com", type: "tool" },
              { label: "Perplexity — Research AI", url: "https://www.perplexity.ai", type: "tool" },
            ],
          },
          {
            text: "Alokasi budget yang SIAP hilang (max 20% dana)",
            action_guide: "1. ⚠️ ATURAN #1: JANGAN pakai uang yang tidak siap hilang\n2. Alokasi MAKSIMAL 20% dari dana idle kamu\n3. Tulis angka pasti: 'Budget saya adalah Rp ___. Jika hilang, hidup saya tidak terganggu'\n4. Jika kamu ragu → kurangi budget. JANGAN dipaksakan",
            deliverable: "Budget tertulis + komitmen tertulis bahwa siap hilang",
            time_estimate: "15 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Buat risk management rules SEBELUM mulai",
            action_guide: "1. Tulis aturan SEBELUM mulai (bukan setelah):\n   - Max loss per hari: Rp ___\n   - Max loss total: Rp ___ (= stop completely)\n   - Max % portfolio per bet: ___%\n   - Stop-loss rule: jika loss ___%, cut immediately\n2. Print dan tempel di meja. TIDAK BOLEH dilanggar\n3. Aturan ini yang membedakan spekulan cerdas vs penjudi",
            deliverable: "1 dokumen risk management rules yang sudah di-commit",
            time_estimate: "30 menit",
            difficulty: "sedang",
            resources: [],
          },
        ],
      },
      {
        week: 2,
        title: "Paper Trading / Small Bets",
        tasks: [
          {
            text: "Jalankan strategi dengan stake kecil",
            action_guide: "1. Mulai dengan 10-20% dari budget yang sudah dialokasi\n2. Tujuan minggu ini: BELAJAR, bukan untung besar\n3. Eksekusi 3-5 'bets' kecil — setiap bet harus punya thesis\n4. Catat setiap keputusan: kenapa masuk, kenapa keluar, hasilnya",
            deliverable: "3-5 bets executed + journal lengkap setiap keputusan",
            time_estimate: "2–4 jam (sepanjang minggu)",
            difficulty: "menantang",
            resources: [
              { label: "Google Sheets — Trading journal", url: "https://sheets.google.com", type: "tool" },
            ],
          },
          {
            text: "Track setiap keputusan dan hasilnya",
            action_guide: "1. Buat journal: tanggal, thesis, entry, exit, P&L, lesson\n2. Jujur — jangan sembunyikan loss. Loss = data\n3. Setelah 3-5 bets, review: ada pattern? Apa yang consistently works?\n4. Pattern yang works > 50% win rate = layak dilanjut",
            deliverable: "Tracking journal lengkap + win rate calculation",
            time_estimate: "30 menit per hari (logging)",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Identifikasi pattern yang works",
            action_guide: "1. Dari journal, analisa: bet mana yang profit? Kenapa?\n2. Ada timing pattern? Market condition pattern? Type of bet pattern?\n3. Gunakan AI untuk bantu analisa pattern dari data kamu\n4. Definisikan: 'Strategi saya work ketika ___ dan gagal ketika ___'",
            deliverable: "1 pattern yang teridentifikasi + rule kapan masuk/keluar",
            time_estimate: "1 jam",
            difficulty: "menantang",
            resources: [],
          },
          {
            text: "JANGAN scale dulu — validasi dulu",
            action_guide: "1. ⚠️ RESISTENSI: kamu akan ingin scale setelah 1-2 profit. JANGAN\n2. Minimal 10 bets sebelum menyimpulkan pattern valid\n3. Cek: apakah win rate > 50%? Apakah average win > average loss?\n4. Kalau belum → terus paper trade/small bets hingga data cukup",
            deliverable: "Self-assessment: sudah cukup data untuk scale? (Yes/No + bukti)",
            time_estimate: "15 menit",
            difficulty: "mudah",
            resources: [],
          },
        ],
      },
      {
        week: 3,
        title: "Refinement",
        tasks: [
          {
            text: "Analisa win rate dan risk-reward ratio",
            action_guide: "1. Hitung win rate: berapa % bets yang profit?\n2. Hitung risk-reward: rata-rata profit vs rata-rata loss\n3. Target minimum: win rate 50%+ DAN risk-reward 1.5:1+\n4. Jika di bawah target → strategi perlu adjust",
            deliverable: "Spreadsheet: win rate, risk-reward ratio, total P&L",
            time_estimate: "30 menit",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Cut strategi yang loss",
            action_guide: "1. Jika suatu approach consistently loss → STOP. Bukan 'coba lagi'\n2. Sunk cost fallacy: 'Saya sudah loss, harus recover' → INI TRAP\n3. Cut tanpa emosi. Data yang bicara\n4. Fokus 100% ke approach yang profitable",
            deliverable: "Daftar strategi yang di-cut + alasan data-driven",
            time_estimate: "15 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Double down yang profit",
            action_guide: "1. Dari pattern yang works, alokasi lebih banyak ke sini\n2. TAPI: increase max 50% — bukan 5x\n3. Scaling gradual: 10% → 15% → 20% dari budget\n4. Setiap step up, pastikan hasilnya masih konsisten",
            deliverable: "Strategi scaling tertulis + new allocation per bet",
            time_estimate: "30 menit",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Adjust AI parameters berdasarkan data",
            action_guide: "1. Review prompt AI yang kamu pakai — apakah output-nya akurat?\n2. Berikan AI data historis kamu: 'Ini 10 bets saya, analisa pattern'\n3. Minta AI suggest improvement ke strategi\n4. Test adjustment di 2-3 bets kecil sebelum commit",
            deliverable: "AI prompt yang sudah di-update + 2-3 test bets",
            time_estimate: "1 jam",
            difficulty: "menantang",
            resources: [],
          },
        ],
      },
      {
        week: 4,
        title: "Decision Point",
        tasks: [
          {
            text: "Evaluasi total P&L",
            action_guide: "1. Hitung total: berapa modal awal? Berapa sekarang?\n2. P&L = saldo sekarang - modal awal\n3. Hitung: berapa jam total yang dihabiskan?\n4. ROI = P&L / modal awal × 100%",
            deliverable: "Laporan P&L lengkap: modal, saldo, P&L, jam kerja, ROI",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "Jika profitable: scale 1.5-2x (bukan 10x)",
            action_guide: "1. Jika P&L positif DAN win rate consistent → boleh scale\n2. Scale 1.5-2x dari current allocation — BUKAN 10x\n3. Set new risk management rules untuk allocation baru\n4. Review lagi setelah 2 minggu dengan size baru",
            deliverable: "New allocation plan + updated risk management rules",
            time_estimate: "30 menit",
            difficulty: "sedang",
            resources: [],
          },
          {
            text: "Jika loss: pivot strategi atau stop",
            action_guide: "1. Jika total loss < 15% modal → masih bisa pivot strategi\n2. Jika total loss 15-30% → PAUSE, review seluruh approach\n3. Jika total loss > 30% → STOP. Ambil learnings, jangan chase losses\n4. Pivot ≠ gagal. Pivot = data-driven decision",
            deliverable: "Keputusan tertulis: lanjut/pivot/stop + alasan",
            time_estimate: "30 menit",
            difficulty: "mudah",
            resources: [],
          },
          {
            text: "⚠️ Jika loss >30% modal: STOP dan evaluasi",
            action_guide: "1. Ini bukan saran — ini ATURAN: loss > 30% = mandatory stop\n2. Tulis evaluasi: apa yang salah? Apakah risk management dilanggar?\n3. Cooldown period: minimal 2 minggu sebelum coba lagi\n4. Pertimbangkan: mungkin arena ini bukan untuk kamu → pivot ke path lain yang lebih safe",
            deliverable: "Evaluasi tertulis + keputusan: cooldown / pivot ke path lain",
            time_estimate: "1 jam",
            difficulty: "mudah",
            resources: [],
          },
        ],
      },
    ],
    segments: ["risk_taker"],
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get path template by ID
 */
export function getPathTemplate(pathId: PathId): PathTemplate | undefined {
  return PATH_TEMPLATES.find((p) => p.id === pathId);
}

/**
 * Get all path templates
 */
export function getAllPaths(): PathTemplate[] {
  return PATH_TEMPLATES;
}

/**
 * Get paths by segment
 */
export function getPathsBySegment(segment: SegmentTag): PathTemplate[] {
  return PATH_TEMPLATES.filter((p) => p.segments.includes(segment));
}

/**
 * Build the AI personalization context (structured, not raw text)
 * This is what gets sent to AI — NOT the user's raw answers.
 */
export function buildAIContext(
  scores: { time: number; capital: number; risk: number; skill: number },
  segment: string,
  path: PathTemplate
): string {
  return JSON.stringify({
    segment,
    primary_path: path.id,
    path_title: path.title,
    user_time: scores.time,
    user_capital: scores.capital,
    user_risk: scores.risk,
    user_skill: scores.skill,
    path_description: path.description,
    weekly_plan: path.weeklyPlan,
    examples: path.examples,
  });
}
