# K-Majestigers

> Elite Karate Academy & Championship Arena

Platform interaktif untuk K-Majestigers Karate Academy & Championship Arena.

## Fitur Utama & Pemisahan Hak Akses (Role-Based Access Control)
Platform K-Majestigers menerapkan pemisahan hak akses (RBAC) ketat setelah login menjadi **3 Portal Khusus**:

1. **[Halaman Anggota / Atlet (`member.html`)](file:///d:/website/majestigers/member.html)**:
   - **Dashboard Utama**: Ringkasan profil, status sabuk Kyu/Dan, poin kehadiran (94%), streak latihan, dan event terdekat.
   - **Profil & Kartu Anggota Digital**: Pas foto, biodata, QR Code dinamis untuk absensi dojo, riwayat kenaikan tingkat (*grading history*), dan tombol unduh/cetak ID Card.
   - **Riwayat Kejuaraan Saya**: Catatan event yang pernah diikuti, kelas tanding, perolehan medali, dan unduh sertifikat resmi (*e-Certificate*).
   - **Jadwal & Latihan**: Jadwal kelas reguler dojo, materi/silabus latihan mingguan, dan jadwal partai tanding tatami kejuaraan.

2. **[Halaman Kontingen / Dojo / Pelatih (`dojo.html`)](file:///d:/website/majestigers/dojo.html)**:
   - **Dashboard Dojo**: Statistik 38 atlet aktif, total 35 medali dojo (Peringkat 2 Klasemen), dan status tagihan kontingen.
   - **Manajemen Atlet (Roster Dojo)**: Direktori atlet binaan, tambah atlet baru, ubah kategori berat badan, dan update sabuk massal.
   - **Pendaftaran Event (Bulk Registration)**: Pendaftaran rombongan atlet ke kejuaraan secara kolektif dengan kalkulasi biaya otomatis.
   - **Keuangan & Pembayaran**: Rekap invoice kontingen (#INV-KM-2026-088), upload bukti transfer bank kolektif, dan status verifikasi lunas.
   - **Jadwal Matras Atlet Dojo (Live Tatami Call Tracker)**: Pemantauan real-time 4 tatami dengan status On Mat, Warming Up / On Deck, dan Next Match.

3. **[Halaman Admin / Panitia Kejuaraan (`admin.html`)](file:///d:/website/majestigers/admin.html)**:
   - **Dashboard Utama (Overview)**: Grafik pendaftar real-time, total 42 dojo, 684 atlet, total pendapatan registrasi Rp 184,5 jt & toko Rp 42,8 jt, serta quick action shortcuts.
   - **Manajemen Event & Pertandingan**: Pengaturan jadwal kejuaraan, kelas tanding, **Bracket Generator Otomatis (Bagan 16 Besar s/d Final)**, dan **Panel Live Scoring Tatami (Scoreboard WKF Aka vs Ao)**.
   - **Verifikasi & Validasi Data**: Approval pendaftaran atlet/kontingen, verifikasi bukti transfer bank, dan validasi dokumen batas umur (akta/ijazah).
   - **Manajemen Anggota & Dojo**: Direktori master dojo, atlet, dan pelatih seluruh cabang se-Indonesia dengan kontrol status aktif/nonaktif.
   - **Manajemen Toko & Merchandise**: Katalog seragam Gi, sabuk, pelindung tangan/kaki, body protector, dan input nomor resi ekspedisi.
   - **Laporan & Rekapitulasi**: Export data peserta Excel/CSV, cetak ID Card massal, dan rekapitulasi klasemen Juara Umum Kontingen.

## Quick Role Switcher (Demo Interaktif)
Setiap halaman portal dilengkapi dengan widget **Role Switcher** di bilah navigasi kanan atas, sehingga penguji dapat berpindah antara **🥋 Atlet / Member**, **🏯 Kontingen / Dojo**, dan **⚡ Admin / Panitia** secara instan dengan 1 kali klik.

## Dokumentasi Produk
Spesifikasi lengkap dan arsitektur produk dapat dilihat pada [PRD (Product Requirements Document)](file:///d:/website/majestigers/PRD.md).

## Integrasi Backend & Supabase Database
Platform ini terintegrasi langsung dengan backend INKAI di `D:\website\inkai\inkai-backend` (Port 5001) dan database cloud **Supabase**:
- **Project Supabase**: `majestigers` (`ecmafwuuuviesytcnorv`)
- **Wilayah**: `ap-northeast-2` (PostgreSQL 17)
- **Akun Demo Terverifikasi (RBAC)**:
  - **1. Anggota / Atlet**: `atlet@kmajestigers.com` / `majestigers123` (NIA: `INA-SBY-8821`, Kyu 2 Cokelat)
  - **2. Kontingen / Dojo**: `sensei.budi@kmajestigers.com` / `majestigers123` (Dan 4, Dojo Surabaya)
- **Alur Login Otomatis (Smart Role Routing)**:
  - Pengguna **TIDAK PERLU** memilih peran secara manual saat login.
  - Cukup masukkan Email / NIA INKAI dan kata sandi. Sistem otomatis memeriksa data di database dan langsung mengarahkan ke dashboard yang sesuai:
    - Akun Atlet &rarr; Otomatis masuk ke `/member`
    - Akun Dojo / Pelatih &rarr; Otomatis masuk ke `/dojo`
    - Akun Admin / Panitia &rarr; Otomatis masuk ke `/admin`
- **Fitur Admin Buatkan Akun Dojo**:
  - Super Admin di Portal Admin (`/admin` -> tab *Anggota & Dojo*) dapat menerbitkan akun login resmi untuk Sensei/Dojo baru dengan tombol **"Buat Akun Login Dojo"**. Kredensial langsung aktif dan dapat dibagikan via WhatsApp.
- **Client API & Guard**: [`api.js`](file:///d:/website/majestigers/api.js)

## Menjalankan di Localhost

### Cara 1: Sekali Klik (Otomatis Backend + Frontend)
Jalankan file batch starter yang sudah disediakan di folder `D:\website\majestigers`:
```bash
start-localhost.bat
```
Script ini akan:
1. Menjalankan backend server di `http://localhost:5001`.
2. Menjalankan frontend web server di `http://localhost:3000`.
3. Membuka browser secara otomatis.

---

### Cara 2: Menjalankan Manual (2 Terminal)

#### Terminal 1: Backend Server (Port 5001)
```bash
cd D:\website\inkai\inkai-backend
npm run dev
```
Backend akan aktif di `http://localhost:5001/api` dan terhubung langsung ke database Supabase.

#### Terminal 2: Frontend Web (Port 3000)
```bash
cd D:\website\majestigers
npm start
# atau: npx serve -l 3000 .
# atau: python -m http.server 3000
```

---

### Akses Halaman & Portal di Localhost
- **Landing Page & Public Arena**: [http://localhost:3000/index.html](http://localhost:3000/index.html)
- **Portal Atlet / Member**: [http://localhost:3000/member.html](http://localhost:3000/member.html)
- **Portal Kontingen / Dojo**: [http://localhost:3000/dojo.html](http://localhost:3000/dojo.html)
- **Portal Admin / Panitia**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 🚀 Panduan Deployment: Vercel & Supabase

### 1. File Konfigurasi yang Tersedia
- **[`.env.example`](file:///d:/website/majestigers/.env.example)**: Template lengkap variabel database Supabase, API keys, JWT secret, dan CORS origin.
- **[`env-config.js`](file:///d:/website/majestigers/env-config.js)**: Runtime environment helper yang otomatis mendeteksi apakah aplikasi sedang berjalan di Localhost atau di domain HTTPS Vercel (anti *Mixed Content*).
- **[`vercel.json`](file:///d:/website/majestigers/vercel.json)**: Aturan routing clean URLs, rewrites, dan security headers.

### 2. Konfigurasi di Supabase Dashboard
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) &rarr; Masuk ke project **`majestigers`** (`ecmafwuuuviesytcnorv`).
2. **Project Settings &rarr; Database**:
   - Salin **Connection String (Transaction Pooler - Port 6543)** untuk `DATABASE_URL`.
   - Salin **Direct Connection (Port 5432)** untuk `DIRECT_URL`.
3. **Authentication &rarr; URL Configuration**:
   - Atur **Site URL**: `https://[nama-project-anda].vercel.app`
   - Tambahkan **Redirect URLs**:
     - `https://[nama-project-anda].vercel.app/**`
     - `http://localhost:3000/**`

### 3. Deploy Frontend ke Vercel
Deploy dapat dilakukan langsung via Git (GitHub/GitLab) atau Vercel CLI:
```bash
# Via Vercel CLI di folder root website:
npx vercel
```
Di Vercel Project Settings &rarr; **Environment Variables**, Anda dapat menambahkan (opsional jika menggunakan custom backend domain):
- `API_URL` = `https://api.domain-anda.com/api`

---

## 🏆 Fitur Unggulan: WKF Tournament Engine & Live Scoreboard Bi-Directional Integration

Portal Admin (`admin.html`) dilengkapi dengan mesin turnamen karate berstandar World Karate Federation (WKF) yang terintegrasi secara dua arah (*bi-directional real-time sync*) dengan Live Scoreboard Tatami:

### 1. Bagan Turnamen Adaptif & Multi-Pool (Pool A, Pool B & Grand Final)
- **Multi-Pool Hierarchy**: Mendukung pembagian atlet ke Pool A, Pool B, dsb., hingga babak Grand Final Antar Juara Pool (Perebutan Medali Emas, Perak, dan Perunggu Bersama).
- **Format Gugur Tunggal WKF (Single Elimination)**: Skala peserta dinamis (4 Semifinal, 8 Perempat Final, 12 Besar + 4 BYE, 16 Besar Penuh, hingga kustom).
- **Aturan Babak Lanjutan (Semifinal & Final)**: Slot babak berikutnya dikosongkan secara default, dan baru terisi otomatis saat pemenang babak sebelumnya disahkan.
- **HTML5 Native Drag-and-Drop**: Atlet dapat ditukar posisi antar-slot atau ditarik dari *Bank Peserta (Roster Tray)* langsung ke bagan.

### 2. Garis Penghubung Bagan SVG Dinamis (Dynamic Connecting Lines)
- **SVG Path Orthogonal & Bézier Curvature**: Garis penghubung antar-babak digambar dinamis menggunakan koordinat bounding box kartu pertandingan.
- **Responsif & Cross-Resolution**: Garis otomatis diperbarui saat jendela di-resize atau terjadi perubahan peserta.
- **Jalur Juara Emas**: Jalur konektor emas khusus yang menghubungkan babak final pool ke box piala Juara 1 Pool.

### 3. Cetak Bagan Resmi Standar F4 / Folio Landscape (330mm x 215mm)
- **Format Standar WKF**: Desain cetak horizontal presisi untuk lembar F4/Folio (330mm x 215mm) dengan margin 8mm.
- **Konektor Cetak Presisi**: Dilengkapi engine kalkulasi SVG terpisah khusus mode cetak untuk memastikan garis penghubung tercetak sempurna di atas kertas.
- **Reliable Print Engine**: Dilengkapi mekanisme pembukaan tab baru serta *hidden iframe fallback* jika pop-up browser terblokir.

### 4. Modal Detail Perolehan Poin & Kronologi Menit Pertandingan
- **Akses Langsung**: Mengklik kartu pertandingan di bagan membuka modal rincian statistik WKF.
- **Rincian Nilai WKF**: Perolehan poin Yuko (+1), Waza-ari (+2), Ippon (+3), status Senshu, dan daftar sanksi pelanggaran (1C, 2C, 3C, HC, H / Hansoku).
- **Kronologi Garis Waktu Per Menit**: Catatan peristiwa per menit (Menit 1, Menit 2, Menit 3) dengan rekam waktu *countdown* (03:00 ke 00:00).
- **Status Partai Jelas**: Indikator status tegas (`BELUM DIMULAI`, `SEDANG BERLANGSUNG`, atau `SELESAI`).

### 5. Integrasi Penuh Scoreboard & Penyimpanan Otomatis
- **Tombol Scoreboard di Tiap Partai**: Membuka partai langsung ke panel wasit juri dengan nama atlet, dojo, nomor partai, dan kelas tanding.
- **Banner Sinkronisasi Aktif**: Menampilkan nomor partai, pool, skor real-time, status laga, dan tombol cepat "Kembali ke Bagan".
- **Otomasi Senshu WKF**: Poin pertama tanpa balas otomatis mendapatkan Senshu tanpa perlu klik manual.
- **Pengesahan Pemenang & Auto-Advance**: Mengesahkan pemenang di scoreboard otomatis mengunci skor akhir, memberikan mahkota 👑, dan meloloskan pemenang ke babak berikutnya di bagan.
- **Konsistensi Reset Skor**: Tombol reset di scoreboard membersihkan skor, riwayat, dan membatalkan kelolosan di babak selanjutnya jika pertandingan di-reset.
- **Smart Return Navigation**: Tombol "Kembali ke Bagan" otomatis mengaktifkan pool yang sesuai dan melakukan *smooth scroll* dengan *highlight ring* ke kartu partai yang bersangkutan.



