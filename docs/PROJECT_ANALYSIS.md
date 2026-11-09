# PROJECT_ANALYSIS.md — EIS Sekolah

> **Tanggal analisis:** 31 Oktober 2026
> **Pembaruan terakhir:** 2 November 2026 — fondasi backend EIS (schema, migration, seed, REST API, smoke test) sudah diimplementasikan
> **Status:** Backend foundation selesai; UI untuk modul baru belum dibuat

---

## 1. Ringkasan Project

**EIS Sekolah** (Executive Information System) adalah aplikasi web berbasis Next.js yang ditujukan untuk membantu kepala sekolah dan pemangku kepentingan memantau kondisi akademik sekolah secara real-time. Sistem ini menyatukan data siswa, guru, kelas, mata pelajaran, jadwal, absensi, dan nilai dalam satu dashboard yang terhubung langsung ke database PostgreSQL.

Project ini masih dalam tahap pengembangan awal (**v0.1.0**). Pondasi teknis sudah solid, autentikasi berbasis role sudah berfungsi, dan dashboard sudah membaca data dari database. Per 2 November 2026, fondasi backend EIS sudah ditambahkan: model keuangan, sarana/prasarana, KPI, alert, activity log, teaching assignment, serta REST API tervalidasi untuk seluruh modul tersebut. UI/halaman untuk modul baru belum dibuat.

---

## 2. Teknologi yang Digunakan

| Kategori | Teknologi | Versi |
|---|---|---|
| Framework | **Next.js** | 16.4.3 (App Router) |
| Runtime | **React** | 19.3.0 |
| Language | **TypeScript** | ^5 |
| Database | **PostgreSQL** (Neon Cloud) | — |
| ORM | **Prisma** | ^7.10.1 |
| Prisma Adapter | **@prisma/adapter-pg** | ^7.10.1 |
| Autentikasi | **Auth.js (NextAuth v5 beta)** | ^5.0.0-beta.32 |
| Prisma Adapter Auth | **@auth/prisma-adapter** | ^2.11.3 |
| Password Hashing | **bcryptjs** | ^3.0.3 |
| CSS Framework | **Tailwind CSS v4** | ^4 |
| UI Components | **shadcn** (Base UI) | ^4.23.0 |
| UI Primitives | **@base-ui/react** | ^1.9.0 |
| Icons | **lucide-react** | ^1.66.0 |
| Animasi CSS | **tw-animate-css** | ^1.4.0 |
| Notifikasi | **sonner** | ^2.0.8 |
| Validasi | **Zod** | ^4.6.7 |
| Font | **Geist Sans + Geist Mono** (Google Fonts) | — |
| Build Tool | **Turbopack** | bundled di Next.js |
| Seed Runner | **tsx** | ^4.23.15 |

**Catatan penting:**
- Next.js versi **16.4.3** adalah versi cutting-edge dengan API yang mungkin berbeda dari dokumentasi mainstream.
- Prisma v7 menggunakan **Driver Adapter** (`PrismaPg`) alih-alih native connector default.
- Database di-host di **Neon** (PostgreSQL serverless cloud), menggunakan connection pooler.

---

## 3. Struktur Folder dan Fungsi File Penting

```
EIS/
+-- prisma/
|   +-- schema.prisma          # Skema database lengkap (24 model + 13 enum)
|   +-- seed.ts                # Data demo untuk seeding database (idempotent)
|   +-- migrations/            # 2 migration: init + add_eis_foundation
|
+-- src/
|   +-- app/                   # Next.js App Router
|   |   +-- layout.tsx         # Root layout (font, metadata, Toaster)
|   |   +-- page.tsx           # Landing page publik
|   |   +-- globals.css        # Token CSS Tailwind v4 + dark mode
|   |   +-- (auth)/
|   |   |   +-- layout.tsx     # Layout auth (centered card)
|   |   |   +-- login/page.tsx # Halaman login
|   |   +-- (dashboard)/
|   |   |   +-- layout.tsx          # Layout dashboard (Sidebar + Navbar)
|   |   |   +-- dashboard/page.tsx  # Halaman dashboard (4 role view)
|   |   |   +-- users/page.tsx      # Manajemen pengguna (admin only)
|   |   |   +-- settings/page.tsx   # Pengaturan profil & password
|   |   +-- api/
|   |       +-- auth/[...nextauth]/ # Auth.js handler
|   |       +-- health/route.ts     # Health check endpoint
|   |       +-- eis/                # REST API EIS (master, akademik, finance, facility, KPI, alert, log, users)
|   |
|   +-- components/
|   |   +-- dashboard/
|   |   |   +-- stat-card.tsx           # Kartu statistik angka
|   |   |   +-- attendance-summary.tsx  # Bar progress absensi per status
|   |   |   +-- grade-list.tsx          # Daftar rata-rata nilai per mapel
|   |   |   +-- schedule-list.tsx       # Daftar jadwal hari ini
|   |   |   +-- children-overview.tsx   # Ringkasan anak (untuk orang tua)
|   |   +-- forms/
|   |   |   +-- login-form.tsx           # Form login (useActionState)
|   |   |   +-- user-form.tsx            # Form tambah pengguna
|   |   |   +-- change-password-form.tsx # Form ganti password
|   |   +-- layout/
|   |   |   +-- sidebar.tsx  # Sidebar navigasi (role-aware)
|   |   |   +-- navbar.tsx   # Header dengan info user & logout
|   |   +-- ui/              # shadcn UI primitives (15 komponen)
|   |
|   +-- lib/
|   |   +-- auth.ts            # Konfigurasi Auth.js (NextAuth) + cek isActive
|   |   +-- authorization.ts   # Helper requireUser() & requireAdmin()
|   |   +-- api.ts             # ApiContext, requireApiContext(), requireRoles(), pagination
|   |   +-- api-error.ts       # ApiError + mapping error Zod/Prisma
|   |   +-- prisma.ts          # Singleton Prisma client
|   |   +-- date.ts            # Utilitas tanggal & kalender semester
|   |   +-- utils.ts           # Utility cn() (class merger)
|   |   +-- validations/
|   |       +-- auth.ts        # loginSchema, changePasswordSchema
|   |       +-- user.ts        # createUserSchema, dll.
|   |       +-- eis.ts         # Schema Zod seluruh REST API EIS
|   |
|   +-- server/
|   |   +-- actions/
|   |   |   +-- auth.ts     # loginAction, logoutAction
|   |   |   +-- profile.ts  # changePasswordAction
|   |   |   +-- users.ts    # createUserAction, updateUserRoleAction, resetUserPasswordAction
|   |   +-- api/
|   |   |   +-- crud.ts     # Factory route collection/item + error handling
|   |   +-- repositories/
|   |   |   +-- eis.ts      # Query Prisma, scope siswa/kelas, permission guru, activity log
|   |   +-- services/
|   |   |   +-- eis.ts      # Business logic, permission, soft void, deaktivasi user
|   |   +-- queries/
|   |       +-- dashboard.ts  # getAdminDashboard, getTeacherDashboard, getStudentDashboard, getParentDashboard
|   |       +-- users.ts      # getUsers()
|   |
|   +-- types/
|   |   +-- auth.ts          # Role, roleLabels, isRole()
|   |   +-- next-auth.d.ts   # Augmentasi tipe Session & JWT
|   |
|   +-- generated/prisma/    # Prisma client yang di-generate (output ORM)
|   +-- proxy.ts             # Middleware route guard (auth redirect)
|
+-- .env                     # DATABASE_URL, AUTH_SECRET, AUTH_URL
+-- next.config.ts           # Konfigurasi Next.js + Turbopack
+-- prisma7.config.ts        # Konfigurasi Prisma CLI (seed, direct URL)
+-- components.json          # Konfigurasi shadcn
+-- tsconfig.json            # TypeScript config
```

---

## 4. Arsitektur Frontend dan Backend

### Pola Arsitektur: Next.js Full-Stack (Server-Centric)

Project ini sepenuhnya menggunakan **Next.js App Router** dengan pendekatan server-first.

UI yang ada masih menggunakan **Server Components** dan **Server Actions**. Di samping itu, fondasi **REST API** sudah ditambahkan di `/api/eis/*` dengan pola route handler → service → repository, validasi Zod, otorisasi role, dan error mapping. UI belum memakai REST API tersebut.

**Mutasi data UI lama** tetap dilakukan via **Server Actions** (`"use server"`). API baru disiapkan untuk integrasi frontend berikutnya.

### Alur Request Frontend → Backend

| Jenis | Mekanisme | Contoh |
|---|---|---|
| Read data | Server Component + Query function | `dashboard/page.tsx` → `getAdminDashboard()` |
| Form submit | `useActionState` + Server Action | `LoginForm` → `loginAction()` |
| Form tanpa JS | Native `<form action={serverAction}>` | Update role user di `users/page.tsx` |
| Navigation guard | Middleware (`proxy.ts`) | Redirect `/login` jika belum auth |

### Rendering Strategy
- Semua halaman dashboard: **Server-Side Rendering (SSR)**
- Form components: **Client Components** (`"use client"`)
- Dashboard layout: SSR dengan autentikasi di server

---

## 5. Struktur Database dan Relasi Tabel

### Diagram Relasi (ERD Ringkas)

```
User (1) ──── (0..1) Teacher
User (1) ──── (0..1) Student
User (1) ──── (0..1) Parent
User (1) ──── (*)    Account        [OAuth]
User (1) ──── (*)    Session        [JWT session]

AcademicYear (1) ──── (*) SchoolClass
AcademicYear (1) ──── (*) Enrollment
AcademicYear (1) ──── (*) Grade

Teacher (1) ──── (*) SchoolClass   [wali kelas]
Teacher (*) ──── (*) Subject        [via SubjectTeacher]
Teacher (1) ──── (*) Schedule
Teacher (1) ──── (*) TeachingAssignment
Teacher (1) ──── (*) Attendance      [recordedBy]
Teacher (1) ──── (*) ActivityLog

SchoolClass (1) ──── (*) Enrollment
SchoolClass (1) ──── (*) Schedule
SchoolClass (1) ──── (*) Attendance
SchoolClass (1) ──── (*) Grade
SchoolClass (1) ──── (*) TeachingAssignment

Student (1) ──── (*) Enrollment
Student (1) ──── (*) Attendance
Student (1) ──── (*) Grade
Student (*) ──── (*) Parent         [via StudentParent]

Subject (1) ──── (*) Schedule
Subject (1) ──── (*) Grade
Subject (1) ──── (*) TeachingAssignment

AcademicYear (1) ──── (*) TeachingAssignment
AcademicYear (1) ──── (*) FinanceTransaction
AcademicYear (1) ──── (*) KpiMeasurement

User (1) ──── (*) ActivityLog
User (1) ──── (*) FinanceTransaction [createdBy]
User (1) ──── (*) Alert             [acknowledgedBy]

Facility (1) ──── (*) FacilityMaintenance
KpiIndicator (1) ──── (*) KpiMeasurement
```

### Tabel dan Penjelasan

| Tabel | Fungsi |
|---|---|
| `User` | Akun login dengan role (ADMIN/GURU/SISWA/ORANG_TUA) dan status aktif |
| `Account` | OAuth provider accounts (NextAuth) |
| `Session` | JWT session store (NextAuth) |
| `VerificationToken` | Token verifikasi email (NextAuth) |
| `Teacher` | Profil guru (NIP, nama, gender, kontak) |
| `Student` | Profil siswa (NIS, NISN, nama, gender, status) |
| `Parent` | Profil orang tua (nama, telepon, pekerjaan) |
| `StudentParent` | Relasi many-to-many siswa-orang tua |
| `AcademicYear` | Tahun ajaran (nama, tanggal, isActive) |
| `SchoolClass` | Kelas (nama, tingkat, wali kelas, kapasitas) |
| `Subject` | Mata pelajaran (kode, nama, deskripsi) |
| `SubjectTeacher` | Relasi many-to-many guru-mapel (tetap dipertahankan) |
| `TeachingAssignment` | Penugasan guru per kelas-mapel-tahun ajaran (sumber utama penugasan mengajar) |
| `Enrollment` | Pendaftaran siswa ke kelas per tahun ajaran |
| `Schedule` | Jadwal pelajaran (hari, jam, ruangan) |
| `Attendance` | Rekap absensi harian per siswa per kelas |
| `Grade` | Nilai siswa per mapel per semester (TUGAS/UH/UTS/UAS) |
| `FinanceTransaction` | Transaksi keuangan (IN/OUT, PENDING/POSTED/VOID) dengan soft void |
| `Facility` | Inventaris fasilitas sekolah |
| `FacilityMaintenance` | Riwayat perbaikan/maintenance fasilitas |
| `KpiIndicator` | Definisi indikator KPI EIS |
| `KpiMeasurement` | Pengukuran KPI per periode/tahun ajaran |
| `Alert` | Peringatan sistem (severity/status) |
| `ActivityLog` | Log aktivitas (immutable) |

### Enum yang Didefinisikan

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

### Status Migration
- Ada **2 migration**: `20261031121651_init` dan `20261102085806_add_eis_foundation`.
- Migration kedua bersifat additive: model/enum baru, `User.isActive`, relasi baru, dan partial unique index `AcademicYear_single_active_idx`.
- Kedua migration sudah dijalankan di Neon (DATABASE_URL dikonfigurasi dan berfungsi).

---

## 6. Alur Autentikasi dan Hak Akses

### Mekanisme Autentikasi

1. **Provider:** Credentials (email + password) menggunakan **Auth.js v5 beta**
2. **Password:** Di-hash dengan **bcryptjs** (cost factor: 12)
3. **Session:** **JWT strategy** (tidak menggunakan database session)
4. **Adapter:** PrismaAdapter digunakan untuk menyimpan Account/Session (kompatibilitas OAuth ke depan)

### Alur Login

```
User → /login → LoginForm → loginAction() (Server Action)
                                   ↓
                          loginSchema.safeParse() [Zod]
                                   ↓
                          prisma.user.findUnique() [cari by email]
                                   ↓
                          bcrypt.compare() [verifikasi password]
                                   ↓
                          NextAuth signIn() → JWT token dengan {id, role}
                                   ↓
                          redirect("/dashboard")
```

### Middleware Route Guard (proxy.ts)

Route yang diproteksi: `/dashboard/*`, `/settings/*`, `/users/*`, `/login`

- **Belum login + akses protected route** → redirect ke `/login?callbackUrl=...`
- **Sudah login + akses `/login`** → redirect ke `/dashboard`

### Kontrol Hak Akses per Role

| Fungsi | Implementasi |
|---|---|
| `requireUser()` | Cek session ada, redirect ke `/login` jika tidak |
| `requireAdmin()` | Cek `session.user.role === "ADMIN"`, redirect ke `/dashboard` jika bukan admin |
| `isActive` | Login ditolak jika `User.isActive = false` |
| REST API | `requireApiContext()` + `requireRoles()`; GURU dibatasi ke kelas/mapel yang diampu; SISWA/ORANG_TUA hanya data sendiri; finance/activity-log admin-only |

### Visibilitas Menu per Role

| Menu | ADMIN | GURU | SISWA | ORANG_TUA |
|---|---|---|---|---|
| Dashboard | Ya | Ya | Ya | Ya |
| Pengguna | Ya | Tidak | Tidak | Tidak |
| Pengaturan | Ya | Ya | Ya | Ya |

### Dashboard View per Role

| Role | Konten Dashboard |
|---|---|
| ADMIN | Stats sekolah, absensi hari ini, rata-rata nilai mapel, jadwal hari ini, enrollment terbaru |
| GURU | Info guru & kelas wali, jadwal mengajar hari ini, absensi kelas diampu, rata-rata nilai |
| SISWA | Info siswa & kelas, absensi bulan ini, nilai per mapel, jadwal kelas hari ini |
| ORANG_TUA | Daftar anak, ringkasan absensi & nilai per anak |

---

## 7. Fitur yang Sudah Tersedia

### Autentikasi & Sesi
- Login dengan email dan password
- Logout
- JWT session dengan role tersimpan di token
- Middleware proteksi route
- Ganti password (self-service)

### Manajemen Pengguna (Admin only)
- Tampilkan daftar semua pengguna
- Tambah pengguna baru (dengan role)
- Ubah role pengguna
- Reset password pengguna
- Proteksi: tidak bisa hapus role admin terakhir
- Proteksi: tidak bisa ubah role akun sendiri

### Dashboard Multi-Role (terhubung ke database)
- Admin: Statistik (siswa aktif, guru, kelas, mapel), absensi hari ini semua kelas, rata-rata nilai per mapel, jadwal hari ini, 5 enrollment terbaru
- Guru: Statistik kelas diampu, jadwal mengajar hari ini, absensi kelas diampu, rata-rata nilai mapel diampu, daftar kelas wali
- Siswa: Statistik mapel & absensi, absensi bulan ini, nilai per mapel, jadwal kelas hari ini
- Orang Tua: Daftar anak, absensi & rata-rata nilai per anak

### Komponen UI
- StatCard (angka dengan ikon)
- AttendanceSummary (progress bar per status kehadiran)
- GradeList (rata-rata nilai per mapel)
- ScheduleList (daftar jadwal per hari)
- ChildrenOverview (kartu ringkasan per anak)
- 15 UI primitif shadcn: alert, avatar, badge, button, card, dialog, dropdown-menu, field, input, label, separator, sheet, skeleton, sonner, table

### Halaman
- Landing page publik (/)
- Login page (/login)
- Dashboard (/dashboard) — view berbeda per role
- Manajemen pengguna (/users) — admin only
- Pengaturan akun (/settings) — semua role

### API Endpoints
- `POST /api/auth/[...nextauth]` — Auth.js handler
- `GET /api/health` — Health check (status DB)
- `/api/eis/academic-years`, `classes`, `teachers`, `students`, `subjects`, `enrollments`, `schedules`, `attendance`, `grades`, `teaching-assignments`
- `/api/eis/finance-transactions` (+ `POST /[id]/void`)
- `/api/eis/facilities`, `/api/eis/facility-maintenances`
- `/api/eis/kpi-indicators`, `/api/eis/kpi-measurements`
- `/api/eis/alerts` (+ `POST /[id]/resolve`)
- `/api/eis/activity-logs`, `/api/eis/users`

Semua route EIS memakai autentikasi, validasi Zod, pagination untuk collection GET, dan error mapping konsisten (`P2002`/`P2003`→409, `P2025`→404).

### Database & Seed
- Schema lengkap dengan 24 model + 13 enum
- 2 migration sudah dijalankan
- Seed data demo: 4 akun (admin, guru, siswa, orang tua), 3 guru, 12 siswa, 3 kelas (7A/8A/9A), 5 mapel, jadwal lengkap, absensi 14 hari, nilai UH+UTS semua siswa
- Seed baru: 15 teaching assignment, 2 transaksi keuangan, 2 fasilitas, 2 KPI indicator, 1 alert, dan activity log; seed idempotent
- `npm run test:eis` menjalankan smoke test Prisma/CRUD/soft-delete

---

## 8. Fitur yang Belum Tersedia

Semua fitur di bawah ini belum ada halaman, komponen, atau query-nya.

### Manajemen Data Master (CRUD)
- Siswa: Halaman daftar, tambah, edit, hapus, detail profil
- Guru: Halaman daftar, tambah, edit, hapus, detail profil
- Kelas: Halaman daftar kelas per tahun ajaran, tambah, edit, hapus
- Mata Pelajaran: Halaman CRUD mapel
- Tahun Ajaran: Halaman kelola tahun ajaran, set tahun aktif
- Enrollment: UI untuk mendaftarkan siswa ke kelas

### Manajemen Akademik
- Input & kelola nilai (TUGAS, UH, UTS, UAS) per siswa per mapel
- Laporan nilai lengkap per siswa / per kelas
- Penentuan KKM dan status lulus/tidak
- Input absensi harian (form untuk guru)
- Rekap absensi bulanan/semesteran
- Kelola jadwal pelajaran (CRUD schedule)

### Data Keuangan Sekolah
- Model `FinanceTransaction` dan REST API sudah tersedia
- Belum ada halaman, komponen, atau form keuangan; void transaksi sudah tersedia via API

### Sarana dan Prasarana
- Model `Facility` dan `FacilityMaintenance` beserta REST API sudah tersedia
- Belum ada halaman inventaris/maintenance

### Grafik dan Visualisasi
- Tidak ada library charting yang diinstall (Recharts, Chart.js, dll.)
- Nilai dan absensi hanya ditampilkan sebagai teks/angka

### Laporan dan Export
- Tidak ada fitur generate laporan PDF/Excel
- Tidak ada fitur cetak rapor atau rekap nilai

### Notifikasi / Peringatan
- Model `Alert` dan API resolve sudah tersedia
- Belum ada notifikasi in-app/push atau pembuatan alert otomatis berbasis kondisi data

### Visualisasi EIS
- Model `KpiIndicator` dan `KpiMeasurement` beserta REST API sudah tersedia
- Belum ada dashboard KPI, chart, atau drill-down di UI

### Profil Lengkap User
- Settings hanya menampilkan nama, email, role, dan ID (read-only)
- Tidak ada form update nama/foto profil
- Tidak ada UI untuk menautkan akun User ke profil Teacher/Student/Parent

### Fitur EIS Eksekutif (EIS Utama)
- Tidak ada dashboard eksekutif dengan KPI/indikator strategis
- Tidak ada fitur analisis tren antar semester/tahun
- Tidak ada role "Kepala Sekolah" terpisah

### Pencarian, Filter, dan Pagination
- Tidak ada fitur pencarian siswa/guru di UI
- Tidak ada filter tabel berdasarkan kelas, tahun ajaran, dll.
- Tabel pengguna menampilkan semua data tanpa pagination

---

## 9. Kondisi Integrasi Frontend, Backend, dan Database

| Layer | Status |
|---|---|
| Frontend ke Next.js Server | Server Components langsung render dari query (terhubung penuh) |
| Next.js ke Prisma ORM | Berfungsi via singleton PrismaClient + Driver Adapter |
| Prisma ke PostgreSQL Neon | Terhubung, migration sudah jalan |
| Auth ke Database | JWT token dengan data user dari DB |
| Server Actions ke DB | createUser, updateRole, resetPassword semua menulis ke DB |
| REST API ke DB | `/api/eis/*` terhubung ke Prisma dengan autentikasi, role, validasi, dan error mapping |
| Health Check | GET /api/health menguji koneksi DB secara aktif |
| Frontend ke REST API | Belum diintegrasikan; UI masih memakai Server Components/Server Actions |

### Detail Konfigurasi Database
- Connection: Menggunakan pooler Neon (`-pooler.c-3.ap-southeast-1.aws.neon.tech`)
- Direct URL: Dikonfigurasi di `prisma7.config.ts` (tanpa pooler) untuk migration
- SSL: Aktif (`sslmode=require&channel_binding=require`)

---

## 10. Masalah dan Kekurangan yang Ditemukan

### Masalah Kritis

**1. AUTH_SECRET dan DATABASE_URL tersimpan di .env (credential asli)**
- File `.env` berisi credential Neon yang valid dan AUTH_SECRET.
- Jika file ini masuk ke repository publik, ini adalah kebocoran credential serius.
- Tindakan: Pastikan `.env` ada di `.gitignore`. Rotate credential jika pernah push ke repo publik.

**2. ~~Tidak ada file middleware.ts~~ (temuan awal tidak valid)**
- Next.js 16.4.3 menggunakan `src/proxy.ts` sebagai konvensi middleware; build mengonfirmasi `ƒ Proxy (Middleware)` aktif.
- Tidak perlu membuat `middleware.ts` tambahan.

**3. Kartu "Akun aktif" di halaman Users belum memakai `User.isActive`**
- Field `isActive` sekarang sudah ada di model `User` dan dipakai saat login.
- `users/page.tsx` masih menampilkan `users.length` untuk "Akun aktif", sehingga UI perlu disesuaikan agar menghitung user aktif saja.

### Masalah Signifikan

**4. Tidak ada UI untuk menghubungkan User ke Teacher/Student/Parent**
- Setelah membuat akun guru/siswa/orang tua, admin harus secara manual (via Prisma Studio atau seed) menghubungkan userId di tabel Teacher, Student, atau Parent.
- Komentar di `users/page.tsx` line 244 mengakui hal ini secara eksplisit.

**5. getCurrentSemester() menggunakan logika yang bisa tidak akurat**
- `lib/date.ts` line 33: `date.getMonth() >= 6 ? "GANJIL" : "GENAP"`
- Tidak ada cara override per tahun ajaran.

**6. Tidak ada error.tsx atau loading.tsx di route dashboard**
- Jika query gagal (DB timeout), halaman akan error tanpa fallback UI yang baik.
- Tidak ada komponen Suspense boundary.

**7. `export const instant = false` di dashboard layout**
- Diperbolehkan saat `cacheComponents: true` (berdasarkan panduan migrasi Next.js) untuk menunda migrasi Cache Components per segmen.
- Valid untuk konfigurasi saat ini. Tidak wajib dihapus, namun bisa dievaluasi di fase migrasi.

### Catatan Minor

**8. Halaman Users menggunakan select dan input HTML native dengan styling manual**
- Alih-alih menggunakan komponen shadcn yang sudah tersedia.

**9. Schema Grade memiliki constraint unik yang rigid**
- `@@unique([studentId, subjectId, classId, semester, type])` — jika siswa pindah kelas dalam satu semester, constraint ini bisa menjadi masalah.

---

## 11. Rekomendasi Urutan Pengembangan

### Fase 0 — Perbaikan Bug & Keamanan (PRIORITAS UTAMA)
1. Pastikan `.env` ada di `.gitignore` dan rotate credential jika perlu
2. Sesuaikan kartu "Akun aktif" di halaman Users agar memakai `User.isActive`
3. Tambahkan `error.tsx` di route `(dashboard)` untuk error boundary
4. Tambahkan `loading.tsx` di route `(dashboard)` untuk Suspense/loading state
5. Integrasikan UI bertahap ke REST API `/api/eis/*` yang sudah tersedia

### Fase 1 — Manajemen Data Master
Diperlukan sebelum fitur apapun bisa digunakan dengan data nyata:
1. Halaman Tahun Ajaran — CRUD tahun ajaran, set aktif
2. Halaman Mata Pelajaran — CRUD mapel
3. Halaman Guru — CRUD guru, linkage ke akun User
4. Halaman Siswa — CRUD siswa, linkage ke akun User
5. Halaman Kelas — CRUD kelas per tahun ajaran, assign wali kelas
6. Halaman Enrollment — Daftarkan siswa ke kelas
7. UI Link User ke Profil — Form untuk menghubungkan akun ke Teacher/Student/Parent

### Fase 2 — Input Data Akademik
1. Input Absensi — Form input absensi harian per kelas (untuk guru)
2. Rekap Absensi — Tabel rekap per siswa per bulan/semester
3. Input Nilai — Form input nilai per siswa per mapel per tipe
4. Laporan Nilai — Rekap nilai per kelas/siswa
5. Jadwal Pelajaran — CRUD jadwal (saat ini hanya dibuat via seed)

### Fase 3 — Dashboard Eksekutif (EIS Utama)
1. Tampilan khusus ADMIN dengan KPI strategis sekolah menggunakan `KpiIndicator`/`KpiMeasurement`
2. Install charting library (Recharts direkomendasikan), buat chart tren absensi & nilai
3. KPI Cards — Tingkat kelulusan, rata-rata kehadiran, distribusi nilai
4. Perbandingan Antar Periode — Bandingkan data antar semester/tahun

### Fase 4 — Fitur Lanjutan
1. Data Keuangan — Halaman input & laporan menggunakan API `finance-transactions` yang sudah ada
2. Sarana & Prasarana — Halaman inventaris/maintenance menggunakan API `facilities` yang sudah ada
3. Notifikasi — UI alert dan pembuatan alert otomatis untuk siswa alpa/nilai di bawah KKM
4. Export Laporan — PDF/Excel untuk nilai raport, rekap absensi
5. Pencarian & Filter — Fitur search dan filter di semua tabel data

---

*Dokumen ini dibuat berdasarkan analisis statis kode pada 31 Oktober 2026. Tidak ada perubahan kode yang dilakukan.*
