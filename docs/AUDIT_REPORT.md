# LAPORAN AUDIT — EIS Sekolah
## Executive Information System sebagai Pendukung Pengambilan Keputusan Strategis

> **Tanggal Audit:** 31 Oktober 2026
> **Pembaruan:** 2 November 2026 — fondasi backend EIS sudah diimplementasikan
> **Auditor:** Antigravity AI Assistant
> **Versi Project:** 0.1.0
> **Status:** Audit awal + pembaruan implementasi backend; UI modul baru belum dibuat

---

## BAGIAN 1: KONDISI PROJECT SAAT INI

### Ringkasan Eksekutif

Project EIS Sekolah saat ini berada pada **tahap fondasi awal** yang sudah berjalan secara teknis. Infrastruktur autentikasi, koneksi database, dan dashboard multi-role sudah berfungsi penuh dengan data nyata dari PostgreSQL. Per 2 November 2026, **fondasi backend** untuk data master, akademik, keuangan, sarana/prasarana, KPI, alert, activity log, dan manajemen user sudah tersedia sebagai REST API tervalidasi. Namun, **halaman UI untuk input dan manajemen modul tersebut belum dibuat**.

Estimasi progres berikut menitikberatkan kesiapan produk dari sisi UI; backend foundation dihitung terpisah:

| Aspek | Estimasi Progres |
|---|---|
| Infrastruktur & Konfigurasi | 90% |
| Autentikasi & Manajemen User | 90% |
| Schema Database | 95% |
| Backend REST API EIS | 80% |
| Dashboard (tampilan baca data) | 70% |
| Manajemen Data Master (UI) | 0% |
| Input Akademik (UI) | 0% |
| Fitur EIS Eksekutif (KPI/grafik UI) | 0% |
| Keuangan & Sarana Prasarana (UI) | 0% |
| **TOTAL KESELURUHAN (produk UI)** | **~30%** |

### Status Data di Tampilan

TIDAK ADA data dummy atau hardcode pada tampilan dashboard. Seluruh data yang tampil di dashboard (statistik, absensi, nilai, jadwal) diambil langsung dari database PostgreSQL Neon melalui Prisma ORM. Saat database kosong, komponen menampilkan pesan kosong yang sesuai konteks.

---

## BAGIAN 2: TEKNOLOGI YANG DIGUNAKAN

### Stack Utama

| Kategori | Teknologi | Versi | Keterangan |
|---|---|---|---|
| Framework | Next.js | 16.4.3 | App Router, SSR, Server Actions |
| Runtime UI | React | 19.3.0 | Concurrent features aktif |
| Bahasa | TypeScript | ^5 | Strict typing |
| Database | PostgreSQL | — | Di-host di Neon (cloud serverless) |
| ORM | Prisma | ^7.10.1 | Driver Adapter mode (PrismaPg) |
| DB Adapter | @prisma/adapter-pg | ^7.10.1 | Koneksi via pg driver |
| Autentikasi | Auth.js (NextAuth v5) | ^5.0.0-beta.32 | JWT strategy + Prisma adapter |
| Hashing | bcryptjs | ^3.0.3 | Cost factor 12 |
| CSS | Tailwind CSS | v4 | Custom properties, no config file |
| UI Library | shadcn (Base UI) | ^4.23.0 | 15 komponen tersedia |
| UI Primitives | @base-ui/react | ^1.9.0 | Dasar komponen shadcn |
| Ikon | lucide-react | ^1.66.0 | SVG icons |
| Animasi | tw-animate-css | ^1.4.0 | CSS animations |
| Toast/Notif UI | sonner | ^2.0.8 | Toast notification |
| Validasi | Zod | ^4.6.7 | Schema validation |
| Font | Geist Sans + Mono | — | Google Fonts (via next/font) |
| Build Tool | Turbopack | bundled | Next.js dev server |
| Seed Runner | tsx | ^4.23.15 | Jalankan TypeScript langsung |

### Catatan Versi Penting

- **Next.js 16.4.3** — Bukan versi mainstream (14.x/15.x). Versi ini adalah cutting-edge dan AGENTS.md proyek secara eksplisit memperingatkan bahwa API-nya bisa berbeda dari training data AI. Baca dokumentasi di `node_modules/next/dist/docs/` sebelum menulis kode baru.
- **Prisma 7** — Menggunakan arsitektur Driver Adapter, berbeda dari Prisma 5/6. `PrismaClient` diinstansiasi dengan `adapter: new PrismaPg({ connectionString })`.
- **Auth.js v5 beta** — Masih dalam tahap beta, ada perubahan breaking dari NextAuth v4.
- **Tidak ada charting library** — Recharts, Chart.js, Tremor, dll. belum diinstall.

---

## BAGIAN 3: KONDISI KONEKSI DATABASE

### Konfigurasi

| Parameter | Nilai |
|---|---|
| Provider | PostgreSQL |
| Host | Neon Cloud (ap-southeast-1, Singapore) |
| Mode | Pooled connection (untuk aplikasi) |
| SSL | Aktif (sslmode=require + channel_binding=require) |
| Direct URL | Tanpa pooler (untuk migrasi Prisma) |

### File Konfigurasi

**`.env`** (runtime aplikasi):
```
DATABASE_URL = postgresql://[user]:[password]@[host]-pooler.../neondb?sslmode=require&channel_binding=require
AUTH_SECRET  = [secret aktif]
AUTH_URL     = http://localhost:3000
```

**`prisma7.config.ts`** (Prisma CLI):
- Menggunakan `DIRECT_URL` jika tersedia, atau otomatis mengubah URL pooler ke direct (menghapus "-pooler" dari hostname)
- Diperlukan untuk migrasi karena migrasi tidak bisa berjalan via pooled connection

### Status Koneksi

- Koneksi database AKTIF dan berfungsi (dibuktikan oleh adanya data seed dan migration yang sudah dijalankan)
- Endpoint health check tersedia di `GET /api/health` — mengembalikan status DB secara real-time
- Prisma Client sudah di-generate dan tersimpan di `src/generated/prisma/` (24 model)
- `.gitignore` secara benar mengecualikan `src/generated/prisma/` dan `.env*` dari version control

### Keamanan Kredensial

- File `.env` dikecualikan dari git via `.gitignore` baris 34 (`.env*`)
- File `.env.example` tersedia sebagai template tanpa nilai sensitif
- AUTH_SECRET sudah dikonfigurasi dengan nilai acak yang aman

---

## BAGIAN 4: TABEL DATABASE YANG TERSEDIA

Schema database dibuat melalui `20261031121651_init` dan migration additive `20261102085806_add_eis_foundation`. Kedua migration sudah dijalankan di PostgreSQL Neon.

### Tabel Inti Autentikasi (NextAuth/Auth.js)

| Tabel | Kolom Utama | Fungsi |
|---|---|---|
| `User` | id, name, email, passwordHash, role, isActive, createdAt | Akun login pengguna |
| `Account` | userId, provider, providerAccountId | OAuth provider (Google, dll.) |
| `Session` | sessionToken, userId, expires | Session storage |
| `VerificationToken` | identifier, token, expires | Verifikasi email |

### Tabel Profil SDM Sekolah

| Tabel | Kolom Utama | Fungsi |
|---|---|---|
| `Teacher` | id, userId, nip, fullName, gender, phone, address | Profil guru |
| `Student` | id, userId, nis, nisn, fullName, gender, birthDate, status | Profil siswa |
| `Parent` | id, userId, name, phone, occupation | Profil orang tua |
| `StudentParent` | studentId, parentId, relation | Relasi siswa-orang tua (M:M) |

### Tabel Akademik

| Tabel | Kolom Utama | Fungsi |
|---|---|---|
| `AcademicYear` | id, name, startDate, endDate, isActive | Tahun ajaran |
| `SchoolClass` | id, name, gradeLevel, academicYearId, homeroomTeacherId, capacity | Kelas |
| `Subject` | id, code, name, description | Mata pelajaran |
| `SubjectTeacher` | teacherId, subjectId | Penugasan guru-mapel (M:M, dipertahankan) |
| `TeachingAssignment` | teacherId, classId, subjectId, academicYearId | Penugasan guru per kelas-mapel-tahun ajaran |
| `Enrollment` | id, studentId, classId, academicYearId, status | Pendaftaran siswa ke kelas |
| `Schedule` | id, classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room | Jadwal pelajaran |
| `Attendance` | id, studentId, classId, date, status, note, recordedById | Absensi harian |
| `Grade` | id, studentId, subjectId, classId, academicYearId, semester, type, score, weight | Nilai siswa |

### Tabel Keuangan, Sarana, KPI, dan Audit

| Tabel | Kolom Utama | Fungsi |
|---|---|---|
| `FinanceTransaction` | id, academicYearId, type, status, amount, description, createdById | Transaksi keuangan; delete = soft void |
| `Facility` | id, code, name, location, condition | Inventaris fasilitas |
| `FacilityMaintenance` | id, facilityId, status, description, cost, reportedById | Riwayat maintenance fasilitas |
| `KpiIndicator` | id, code, name, unit, target | Definisi indikator KPI |
| `KpiMeasurement` | id, indicatorId, academicYearId, period, value | Pengukuran KPI per periode |
| `Alert` | id, severity, status, message, acknowledgedById | Peringatan sistem |
| `ActivityLog` | id, userId, action, entity, entityId, metadata | Log aktivitas immutable |

### Tipe Data (PostgreSQL Enum)

| Enum | Nilai |
|---|---|
| `Role` | ADMIN, GURU, SISWA, ORANG_TUA |
| `Gender` | LAKI_LAKI, PEREMPUAN |
| `StudentStatus` | AKTIF, LULUS, PINDAH, KELUAR |
| `Semester` | GANJIL, GENAP |
| `AttendanceStatus` | HADIR, SAKIT, IZIN, ALPA, TERLAMBAT |
| `GradeType` | TUGAS, UH, UTS, UAS |
| `DayOfWeek` | SENIN, SELASA, RABU, KAMIS, JUMAT, SABTU |
| `FinanceType` | IN, OUT |
| `FinanceStatus` | PENDING, POSTED, VOID |
| `FacilityCondition` | BAIK, RUSAK_RINGAN, RUSAK_BERAT |
| `MaintenanceStatus` | DILAPORKAN, DIKERJAKAN, SELESAI |
| `AlertSeverity` | INFO, WARNING, CRITICAL |
| `AlertStatus` | OPEN, ACKNOWLEDGED, RESOLVED |

### Indeks dan Constraint

Database sudah dilengkapi indeks yang optimal:
- Composite index pada `Attendance(classId, date)`, `Attendance(date, status)`, `Attendance(studentId, date)`
- Composite index pada `Grade(academicYearId, semester)`, `Grade(classId, subjectId, semester)`
- Unique constraint mencegah duplikasi: absensi per siswa-kelas-tanggal, nilai per siswa-mapel-kelas-semester-tipe, jadwal per kelas-hari-jam

### Data Seed yang Tersedia

Seed script (`prisma/seed.ts`) menyediakan data demo lengkap:
- 4 akun user: `demo@example.com` (Admin), `guru@example.com` (Guru), `siswa@example.com` (Siswa), `orangtua@example.com` (Orang Tua)
- Password demo semua akun: `Password123!`
- 3 guru, 12 siswa, 3 kelas (7A, 8A, 9A), 5 mata pelajaran
- Jadwal pelajaran lengkap (Senin–Jumat, 3 periode per hari)
- Data absensi 14 hari ke belakang
- Nilai UH + UTS untuk semua siswa semua mapel
- 15 teaching assignment, 2 transaksi keuangan, 2 fasilitas, 2 KPI indicator, 1 alert, dan activity log
- Seed idempotent; dijalankan berulang tidak menduplikasi data inti
- Smoke test: `npm run test:eis` (Prisma/CRUD/soft-delete) dan pengujian HTTP manual untuk autentikasi/role API

---

## BAGIAN 5: FITUR YANG SUDAH SELESAI

### 5.1 Halaman Landing Page (/)

- Halaman publik yang dapat diakses tanpa login
- Menampilkan deskripsi sistem, 4 feature card, dan CTA masuk
- Header dengan navigasi ke Login dan Dashboard
- Footer dengan informasi teknologi
- Responsif (mobile/tablet/desktop)
- Tidak ada data dummy — konten statis

### 5.2 Halaman Login (/login)

- Form login dengan email dan password
- Validasi client-side via Zod (format email, password tidak kosong)
- Feedback error yang informatif (email/password salah, validasi field)
- Loading state pada tombol submit
- Redirect otomatis ke `/dashboard` setelah berhasil login
- Redirect otomatis ke `/dashboard` jika sudah login (via middleware)

### 5.3 Dashboard Multi-Role (/dashboard)

Halaman dashboard menampilkan konten berbeda berdasarkan role pengguna:

**Dashboard Administrator (ADMIN):**
- Kartu tahun ajaran aktif beserta jumlah siswa terdaftar
- 4 stat card: Siswa Aktif, Guru, Kelas, Mata Pelajaran (data real dari DB)
- Rekap absensi hari ini (semua kelas) dengan progress bar per status
- Rata-rata nilai per mata pelajaran (semester berjalan)
- Jadwal pelajaran hari ini (maks. 8 jadwal)
- Tabel 5 enrollment terbaru (nama siswa, kelas, tanggal)

**Dashboard Guru (GURU):**
- Kartu identitas guru (nama, NIP, jumlah kelas wali)
- 3 stat card: Kelas Diampu, Mata Pelajaran, Absensi Hari Ini
- Jadwal mengajar hari ini (kelas & mapel diampu)
- Rekap absensi kelas yang diampu
- Rata-rata nilai mapel yang diampu
- Tabel kelas wali (nama, tingkat, tahun ajaran)

**Dashboard Siswa (SISWA):**
- Kartu identitas siswa (nama, NIS, kelas aktif)
- 3 stat card: Mata Pelajaran, Absensi Bulan Ini, Rata-rata Nilai
- Rekap absensi bulan berjalan dengan progress bar
- Nilai per mata pelajaran (semester berjalan)
- Jadwal pelajaran kelas hari ini

**Dashboard Orang Tua (ORANG_TUA):**
- Stat card: Anak Terdaftar, Kelas Aktif
- Kartu ringkasan per anak (nama, NIS, kelas, relasi)
- Rata-rata nilai dan rekap absensi per anak

### 5.4 Manajemen Pengguna (/users) — Admin Only

- Daftar semua pengguna dengan nama, email, role, profil, dan tanggal dibuat
- Tambah pengguna baru (nama, email, password, role) via form inline
- Ubah role pengguna via dropdown + tombol simpan
- Reset password pengguna via form inline
- Indikator "Akun Anda" untuk mencegah admin mengubah akun sendiri
- Proteksi: tidak bisa menurunkan role admin terakhir
- Feedback pesan sukses/error via URL query params

### 5.5 Pengaturan Akun (/settings) — Semua Role

- Tampilan profil akun: nama, email, role, user ID
- Form ganti password (password lama + password baru + konfirmasi)
- Validasi: minimal 8 karakter, konfirmasi harus cocok
- Informasi endpoint health check sistem

### 5.6 Infrastruktur & API

- `GET /api/health` — Menguji koneksi database, mengembalikan status JSON
- `POST /api/auth/[...nextauth]` — Handler Auth.js untuk login/logout/callback
- Middleware route guard (`src/proxy.ts`) — Konvensi Next.js 16, aktif sebagai `ƒ Proxy (Middleware)`
- Server Actions untuk mutasi UI lama
- REST API EIS di `/api/eis/*` untuk academic-years, classes, teachers, students, subjects, enrollments, schedules, attendance, grades, teaching-assignments, finance-transactions (+void), facilities, facility-maintenances, kpi-indicators, kpi-measurements, alerts (+resolve), activity-logs, dan users

---

## BAGIAN 6: FITUR YANG BELUM TERSEDIA

Seluruh fitur berikut belum memiliki halaman, komponen, server action, maupun query.

### 6.1 Manajemen Data Master (0% diimplementasikan)

| Modul | Yang Dibutuhkan |
|---|---|
| Tahun Ajaran | Halaman daftar, form tambah/edit, tombol set aktif, hapus |
| Mata Pelajaran | Halaman daftar, form tambah/edit, hapus |
| Guru | Halaman daftar, form tambah/edit, detail profil, hapus |
| Siswa | Halaman daftar, form tambah/edit, detail profil, hapus, filter status |
| Kelas | Halaman daftar per tahun ajaran, form tambah/edit, assign wali kelas |
| Enrollment | UI pendaftaran siswa ke kelas, pindah kelas, ubah status |
| Linkage User-Profil | Form tautkan akun user ke data guru/siswa/orang tua |

### 6.2 Input dan Manajemen Data Akademik (0% diimplementasikan)

| Modul | Yang Dibutuhkan |
|---|---|
| Input Absensi | Form input absensi harian per kelas (diakses guru) |
| Rekap Absensi | Tabel rekap per siswa/kelas/bulan/semester |
| Input Nilai | Form input nilai per siswa per mapel (TUGAS/UH/UTS/UAS) |
| Rekap Nilai | Tabel nilai per kelas, per siswa |
| Jadwal Pelajaran | CRUD jadwal — saat ini hanya bisa dibuat via seed |
| Penugasan Guru-Mapel | UI untuk assign guru ke mata pelajaran |

### 6.3 Fitur EIS Eksekutif (0% diimplementasikan)

Inilah inti dari konsep EIS yang dirujuk artikel ilmiah — saat ini belum ada:

| Komponen EIS | Yang Dibutuhkan |
|---|---|
| KPI Dashboard | Tingkat kehadiran sekolah, rata-rata nilai keseluruhan, tingkat kelulusan, tren siswa |
| Grafik Tren | Chart absensi bulanan, distribusi nilai, perbandingan semester |
| Drill-down | Dari angka aggregate → per kelas → per siswa |
| Perbandingan Periode | Bandingkan data antar semester/tahun ajaran |
| Indikator Kritis | Alert nilai di bawah KKM, siswa alpa berturut-turut |
| Filter Dinamis | Filter dashboard berdasarkan tahun ajaran, kelas, guru |
| Charting Library | Belum ada library grafik (Recharts, dll.) yang diinstall |

### 6.4 Modul Backend yang Sudah Ada tetapi Belum Ada UI

Model dan REST API berikut sudah tersedia; yang belum ada adalah halaman/form frontend:

| Modul | Status Backend |
|---|---|
| Keuangan Sekolah | `FinanceTransaction` + API + soft void |
| Sarana & Prasarana | `Facility`, `FacilityMaintenance` + API |
| KPI & Alert | `KpiIndicator`, `KpiMeasurement`, `Alert` + API |
| Activity Log | `ActivityLog` immutable + API admin-only |
| Teaching Assignment | `TeachingAssignment` + API |

### 6.5 Modul yang Belum Ada di Schema Database

| Modul | Model yang Dibutuhkan |
|---|---|
| KKM / Ketuntasan | GradeThreshold, PassingGrade |
| Kurikulum | Curriculum, LearningObjective |

### 6.6 Fitur Penunjang yang Belum Ada

| Fitur | Keterangan |
|---|---|
| Pencarian | Tidak ada search bar di halaman manapun |
| Filter & Sorting | Tidak ada filter tabel |
| Pagination | Daftar pengguna tidak memiliki pagination |
| Export Laporan | Tidak ada export PDF/Excel |
| Cetak Rapor | Tidak ada fitur cetak |
| Notifikasi In-App | Tidak ada sistem notifikasi |
| Update Profil | Form edit nama/foto profil belum ada |
| Dark Mode Toggle | CSS dark mode disiapkan tapi tidak ada tombol toggle |

---

## BAGIAN 7: MASALAH DAN RISIKO YANG DITEMUKAN

### KRITIKAL

**[K1] ~~File middleware.ts tidak ada~~ — temuan awal tidak valid**

Pada Next.js 16.4.3, `src/proxy.ts` adalah konvensi yang benar untuk middleware. `next build` mengonfirmasi `ƒ Proxy (Middleware)` aktif. Tidak perlu membuat `middleware.ts` tambahan.

Status: Ditutup — bukan masalah.

**[K2] Tidak ada fallback UI saat database error**

Halaman dashboard menggunakan async Server Components yang langsung query database. Jika query gagal (timeout Neon setelah idle, dsb.), Next.js akan melempar error tanpa fallback. Tidak ada `error.tsx` di route group `(dashboard)`.

Dampak: Pengguna melihat halaman error default Next.js yang tidak informatif.

Solusi: Tambahkan `src/app/(dashboard)/error.tsx` dan `src/app/(dashboard)/loading.tsx`.

### SIGNIFIKAN

**[S1] Tidak ada UI untuk menautkan akun User ke profil Guru/Siswa/Orang Tua**

Setelah admin membuat akun baru untuk guru, siswa, atau orang tua, field `userId` di tabel `Teacher`, `Student`, atau `Parent` tetap NULL. Dashboard guru/siswa/orang tua akan menampilkan "Data belum tersedia" karena query mencari profil berdasarkan `userId`.

Dampak: Sistem tidak dapat digunakan oleh guru dan siswa tanpa intervensi manual via Prisma Studio atau langsung ke database.

**[S2] Tidak ada charting library untuk EIS**

EIS sebagai pendukung keputusan strategis sangat bergantung pada visualisasi data. Saat ini tidak ada library grafik yang terinstall. Data absensi dan nilai hanya ditampilkan sebagai angka/teks. Tidak ada chart tren, distribusi, atau perbandingan.

Dampak: Fungsi utama EIS (membantu pengambilan keputusan berbasis data visual) belum terpenuhi.

**[S3] Logika semester hardcode dan tidak akurat sepenuhnya**

`getCurrentSemester()` di `lib/date.ts` menggunakan `date.getMonth() >= 6 ? "GANJIL" : "GENAP"`. Logika ini tidak fleksibel dan tidak dapat dikonfigurasi per sekolah.

**[S4] Kartu "Akun aktif" belum memakai `User.isActive`**

Field `User.isActive` sekarang sudah ada dan dipakai saat login. Halaman Users masih menghitung `users.length` untuk kartu "Akun aktif", sehingga UI perlu disesuaikan.

Status: Backend selesai; perbaikan UI tersisa.

**[S5] ~~export const instant = false tidak dikenal~~ — temuan awal tidak valid**

`instant` adalah konfigurasi Next.js yang valid ketika `cacheComponents: true`, sesuai panduan migrasi di `node_modules/next/dist/docs/`. Nilai `false` berarti segmen tersebut belum dimigrasikan ke Cache Components.

Status: Ditutup — bukan masalah.

### MINOR

**[M1] Penggunaan HTML native `<select>` dan `<input>` dengan styling manual di halaman Users**

Alih-alih menggunakan komponen shadcn yang sudah tersedia (`Select`, `Input`), halaman `/users` menggunakan elemen HTML native dengan class Tailwind manual yang tidak konsisten.

**[M2] Constraint unik pada Grade yang terlalu ketat**

`@@unique([studentId, subjectId, classId, semester, type])` berarti hanya ada satu nilai per kombinasi. Jika ada kebutuhan memberikan nilai ulang atau remedi, data lama harus dihapus dulu.

**[M3] Tidak ada pagination di tabel daftar pengguna**

Jika pengguna bertambah banyak (ratusan guru + siswa), tabel akan memuat semua data sekaligus tanpa pagination.

---

## BAGIAN 8: REKOMENDASI URUTAN PENGEMBANGAN

Rekomendasi ini disusun berdasarkan prinsip EIS: data harus ada sebelum bisa divisualisasikan untuk mendukung keputusan.

---

### FASE 0 — Perbaikan Bug & Stabilitas (Lakukan Segera)

Estimasi waktu: 1–2 hari

1. **Buat `src/app/(dashboard)/error.tsx`** — Error boundary untuk dashboard
2. **Buat `src/app/(dashboard)/loading.tsx`** — Loading skeleton saat fetch data
3. **Perbaiki kartu "Akun aktif"** — Gunakan `User.isActive`
4. **Mulai integrasi UI ke REST API `/api/eis/*`** — Backend sudah tersedia

---

### FASE 1 — Manajemen Data Master

Estimasi waktu: 2–3 minggu

Tanpa data master yang bisa diinput dari UI, sistem tidak dapat digunakan secara operasional.

**Urutan pengerjaan:**
1. Tahun Ajaran — Fondasi semua data akademik
2. Mata Pelajaran — Independen, bisa dikerjakan paralel
3. Guru + Link User ke Profil — Termasuk form tautkan akun user ke data guru
4. Siswa + Link User ke Profil — Termasuk form tautkan akun user ke data siswa
5. Kelas — Bergantung pada tahun ajaran dan guru (untuk wali kelas)
6. Enrollment — Bergantung pada siswa dan kelas
7. Penugasan Guru-Kelas-Mapel (TeachingAssignment) — Bergantung pada guru, kelas, dan mapel

**Komponen yang perlu dibuat untuk setiap modul:**
- Server query (getXxx, getXxxById)
- Server action (createXxxAction, updateXxxAction, deleteXxxAction)
- Zod validation schema
- Halaman daftar dengan tabel
- Form tambah/edit (bisa menggunakan Dialog/Sheet)
- Form linkage User ke Profil

---

### FASE 2 — Input Data Operasional Akademik

Estimasi waktu: 2–3 minggu

Setelah data master ada, input operasional harian dapat dilakukan.

1. **Jadwal Pelajaran** — CRUD jadwal (CRUD); diperlukan untuk dashboard jadwal yang dinamis
2. **Input Absensi** — Form input absensi harian per kelas (role Guru)
3. **Rekap Absensi** — Tabel rekap absensi per siswa/kelas/bulan/semester
4. **Input Nilai** — Form input nilai per tipe (TUGAS/UH/UTS/UAS)
5. **Rekap Nilai** — Laporan nilai per kelas dan per siswa

---

### FASE 3 — Dashboard EIS Eksekutif (Inti EIS)

Estimasi waktu: 2–3 minggu

Ini adalah fitur utama yang membedakan EIS dari sistem informasi biasa.

1. **Install charting library** (Recharts direkomendasikan — ringan, React-native)
2. **KPI Cards untuk Admin/Kepala Sekolah:**
   - Tingkat kehadiran sekolah (%) bulan ini
   - Rata-rata nilai keseluruhan per semester
   - Distribusi status siswa (Aktif/Lulus/Pindah/Keluar)
   - Jumlah kelas per tingkat
3. **Grafik Tren:**
   - Chart absensi harian/mingguan/bulanan
   - Distribusi nilai (histogram) per kelas
   - Perbandingan rata-rata nilai antar kelas
   - Tren kehadiran per semester
4. **Drill-down Navigation:**
   - Dari angka aggregate → per kelas → per siswa
5. **Perbandingan Antar Periode:**
   - Bandingkan absensi/nilai semester ini vs semester lalu
6. **Filter Dinamis:**
   - Filter dashboard berdasarkan tahun ajaran, kelas, mata pelajaran

---

### FASE 4 — Fitur Tambahan & Peningkatan

Estimasi waktu: 3–4 minggu

1. **Notifikasi & Peringatan:**
   - Alert siswa alpa > N hari berturut-turut
   - Alert nilai di bawah KKM
   - Sistem notifikasi in-app
2. **Pencarian & Filter Global:**
   - Search siswa/guru di semua halaman daftar
   - Filter dan sorting tabel
   - Pagination untuk data besar
3. **Export & Laporan:**
   - Export rekap absensi ke Excel/PDF
   - Cetak laporan nilai/rapor
4. **Data Keuangan Sekolah:**
   - Backend `FinanceTransaction` + API sudah tersedia
   - Halaman input transaksi, void, dan laporan keuangan
5. **Sarana & Prasarana:**
   - Backend `Facility`/`FacilityMaintenance` + API sudah tersedia
   - Halaman inventaris dan maintenance fasilitas
6. **Update Profil Pengguna:**
   - Form edit nama
   - Upload foto profil
7. **Dark Mode Toggle:**
   - Tombol switch tema terang/gelap (CSS sudah disiapkan)

---

## RINGKASAN TEMUAN AUDIT

| No | Temuan | Tingkat | Status |
|---|---|---|---|
| K1 | ~~middleware.ts tidak ada~~ — `proxy.ts` valid di Next.js 16 | Ditutup | Tidak valid |
| K2 | Tidak ada error boundary di dashboard | Kritikal | Perlu diperbaiki segera |
| S1 | Tidak ada UI linkage User ke profil Guru/Siswa/Orang Tua | Signifikan | Fase 1 |
| S2 | Tidak ada charting library untuk visualisasi EIS | Signifikan | Fase 3 |
| S3 | Logika getCurrentSemester() tidak fleksibel | Signifikan | Fase 1 |
| S4 | Kartu "Akun aktif" belum memakai `User.isActive` | Signifikan | Backend selesai; UI tersisa |
| S5 | ~~export const instant = false tidak dikenal~~ | Ditutup | Tidak valid |
| M1 | HTML native <select> tanpa komponen shadcn | Minor | Saat refactor halaman Users |
| M2 | Constraint Grade yang rigid | Minor | Evaluasi sebelum Fase 2 |
| M3 | Tidak ada pagination di tabel pengguna | Minor | Fase 4 |

---

*Audit awal dibuat berdasarkan kode project EIS Sekolah pada 31 Oktober 2026. Pembaruan 2 November 2026 mencakup implementasi fondasi backend: schema/migration additive, seed idempotent, REST API `/api/eis/*`, smoke test, serta koreksi temuan K1/S5 yang tidak valid. UI untuk modul baru masih menjadi pekerjaan berikutnya.*
