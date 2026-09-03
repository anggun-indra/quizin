# 🎯 QuizIn - Platform Kuis Realtime Mahasiswa & Dosen

QuizIn adalah aplikasi kuis interaktif perkuliahan realtime yang menggunakan proyek Firebase yang sama dengan **Kelompokin** (`undhi-lms`), sehingga profil pengguna (Google Auth, Nama Lengkap, dan NIM) otomatis tersinkronisasi antar kedua aplikasi.

---

## ✨ Fitur Utama

### 👨‍🏫 Dosen / Pembuat Kuis (Admin)
1. **Pembuatan Kuis Fleksibel**:
   - Judul, mata kuliah, deskripsi, durasi pengerjaan (menit / tanpa batas waktu), dan standar KKM kelulusan.
   - Opsi pengacakan urutan butir soal & opsi jawaban.
   - Opsi tampilkan nilai langsung & pembahasan jawaban setelah kuis selesai.
2. **Editor Soal Komprehensif**:
   - Tipe soal: **Pilihan Ganda**, **Pilihan Ganda Kompleks (Multi-jawaban)**, **Benar / Salah**, dan **Isian Singkat**.
   - Penentuan bobot nilai (poin) per butir soal.
   - Kunci jawaban dinamis & teks pembahasan/penjelasan.
   - Duplikasi soal cepat & reordering naik/turun.
3. **Ruang Pantau Realtime (Live Monitor)**:
   - Kode unik room kuis (misal `QZ-8821`) dengan fitur salin link & bagikan ke grup WhatsApp.
   - Kontrol status kuis: `WAITING` (Ruang Tunggu/Lobby) $\rightarrow$ `ACTIVE` (Mulai Kuis Serentak) $\rightarrow$ `ENDED` (Kuis Selesai / Kunci Nilai).
   - Indikator kehadiran peserta realtime (Menunggu, Mengerjakan, Selesai).
4. **Papan Skor & Rekap Nilai (Leaderboard)**:
   - Peringkat langsung kelas berdasarkan skor tertinggi dan kecepatan submit.
   - Status kelulusan KKM per mahasiswa.
   - **Inspeksi Lembar Jawaban**: Melihat jawaban yang dipilih mahasiswa versus kunci jawaban resmi dan perolehan poin per nomor.
   - **Ekspor Nilai ke Excel (`.xlsx`)**: Unduh laporan nilai resmi kelas dengan statistik rata-rata, tertinggi, dan tingkat kelulusan.

---

### 👨‍🎓 Mahasiswa / Peserta Kuis (Student)
1. **Google Sign-In & Profil Terpadu**:
   - Terhubung dengan koleksi `users/{userId}` yang sama dengan Kelompokin, sehingga NIM dan nama yang telah diisi tidak perlu diinput ulang.
2. **Bergabung dengan Kode Kuis**:
   - Masukkan kode kuis atau buka melalui tautan langsung (`?code=...`).
3. **Ruang Tunggu (Lobby)**:
   - Tinjauan detail kuis dan daftar teman sekelas yang sudah masuk ruangan kuis.
   - Otomatis berpindah serentak saat pengampu memulai kuis.
4. **Lembar Pengerjaan Soal (Quiz Room)**:
   - Countdown timer hitung mundur dengan peringatan visual saat waktu menipis.
   - Navigasi grid nomor soal (indikator: Terjawab, Ragu-ragu, Belum diisi).
   - **Auto-Save Realtime**: Jawaban disimpan otomatis di penyimpanan lokal dan Firestore sehingga tidak hilang saat koneksi terputus atau halaman ter-refresh.
   - Konfirmasi submit informatif & auto-submit jika waktu habis.
5. **Hasil & Pembahasan Nilai**:
   - Skor akhir (/100) dan status KKM dengan efek selebrasi confetti.
   - Rincian jumlah benar, salah, dilewati, dan durasi pengerjaan.
   - Papan peringkat kelas (Leaderboard).
   - Pembahasan soal dan kunci jawaban.

---

## 🚀 Cara Menjalankan di Lokal

1. Masuk ke direktori:
   ```bash
   cd /Users/nb-mac-fj2n0x/Work/wproject/kuliah/quizin
   ```
2. Jalankan server development:
   ```bash
   npm run dev
   ```
3. Buka di browser: `http://localhost:5175`

---

## 🌐 Deployment ke Firebase Hosting

Target hosting: **`quizin`** pada project **`undhi-lms`** (`https://quizin.web.app`)

1. Build production:
   ```bash
   npm run build
   ```
2. Deploy hosting:
   ```bash
   firebase deploy --only hosting:quizin
   ```
