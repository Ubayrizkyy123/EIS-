# EIS Sekolah

Sistem informasi sekolah full-stack dengan Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Prisma 7, PostgreSQL (Neon), dan Auth.js v5.

## Fitur

- Landing page dan login email/password (bcrypt + JWT session)
- Proteksi route dengan `proxy.ts` (pengganti `middleware.ts` di Next.js 16)
- Dashboard berbasis role: Kepala Sekolah, Administrator, dan Operator
- Manajemen pengguna oleh administrator: tambah akun, ubah role, reset password
- Dashboard eksekutif, operasional, dan admin dengan matriks izin terpisah
- Activity log dan pengaturan sistem khusus administrator
- Ganti password mandiri dari halaman pengaturan
- Data akademik: siswa, guru, kelas, mata pelajaran, tahun ajaran, enrollment
- UI CRUD tahun ajaran, kelas, guru, dan siswa; penempatan kelas lewat enrollment
- Absensi harian siswa per kelas dengan penyimpanan massal (bulk upsert)
- Jadwal pelajaran, absensi harian, dan nilai per mata pelajaran
- Modul operasional: keuangan, inventaris fasilitas, dan tiket pemeliharaan
- Dashboard eksekutif dengan KPI, tren kehadiran/keuangan, filter akademik, dan drill-down
- Dashboard membaca agregasi langsung dari database (bukan data hardcode)
- Health check database di `GET /api/health`
- Validasi form dengan Zod
- Seed data demo yang idempotent

Registrasi publik dinonaktifkan. Akun dibuat oleh administrator sekolah.

## Prasyarat

- Node.js 20+ (diuji dengan Node 24)
- Database PostgreSQL (Neon, Supabase, atau lokal)

## Setup

1. Install dependency:

   ```bash
   npm install
   ```

2. Salin environment file dan sesuaikan nilainya:

   ```bash
   cp .env.example .env
   ```

   Isi `DATABASE_URL` dengan connection string PostgreSQL Anda, lalu buat `AUTH_SECRET`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   Untuk Neon, gunakan connection string pooled (`-pooler`) pada `DATABASE_URL`. Migrasi Prisma memakai direct connection: isi `DIRECT_URL`, atau biarkan kosong karena `prisma7.config.ts` otomatis menghapus `-pooler` dari host.

3. Terapkan migrasi database:

   ```bash
   npm run db:migrate
   ```

   Untuk production:

   ```bash
   npm run db:deploy
   ```

4. Isi data demo:

   ```bash
   npm run db:seed
   ```

   Password akun demo mengikuti `SEED_PASSWORD` jika diatur, atau `Password123!` jika tidak. Gunakan password yang kuat dan jangan jalankan seed demo di production.

5. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000).

## Akun Demo

Semua akun aktif memakai password `Password123!` jika `SEED_PASSWORD` tidak diatur.

| Role | Email | Halaman awal |
| --- | --- | --- |
| Kepala Sekolah | `kepala@example.com` | `/executive` |
| Administrator | `demo@example.com` | `/admin` |
| Operator | `operator@example.com` | `/operator` |

Akun legacy `guru@example.com`, `siswa@example.com`, dan `orangtua@example.com` tetap ada untuk data historis, tetapi nonaktif dan tidak dapat login.

## Scripts

| Script | Keterangan |
| --- | --- |
| `npm run dev` | Menjalankan development server |
| `npm run build` | Build production |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript tanpa emit |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Buat & terapkan migrasi baru |
| `npm run db:deploy` | Terapkan migrasi di production |
| `npm run db:push` | Sinkronkan schema tanpa migrasi |
| `npm run db:seed` | Seed data demo |
| `npm run db:studio` | Buka Prisma Studio |
| `npm run test:eis` | Smoke test skema dan data EIS |
| `npm run test:auth` | Smoke test login, redirect, dan RBAC API |

## Struktur Data

- `User`, `Account`, `Session`, `VerificationToken` — autentikasi Auth.js
- `Teacher`, `Student`, `Parent`, `StudentParent` — profil dan relasi wali
- `AcademicYear`, `SchoolClass`, `Subject`, `SubjectTeacher` — data master akademik
- `Enrollment` — siswa terdaftar di kelas per tahun ajaran
- `Schedule` — jadwal pelajaran per kelas, hari, dan jam
- `Attendance` — absensi siswa per kelas dan tanggal
- `Grade` — nilai siswa per mapel, kelas, semester, dan jenis penilaian
- `KpiIndicator`, `KpiMeasurement` — indikator dan hasil pengukuran KPI sekolah
- `FinanceTransaction` — pemasukan/pengeluaran dengan status `POSTED` atau `VOID`
- `Facility`, `FacilityMaintenance` — inventaris fasilitas dan tiket pemeliharaan

## Struktur Folder

```text
.
├─ prisma/
│  ├─ schema.prisma              # Model database
│  ├─ seed.ts                    # Data demo idempotent
│  └─ migrations/                # Migrasi SQL
├─ prisma7.config.ts             # Konfigurasi Prisma 7 (datasource, seed)
├─ src/
│  ├─ app/
│  │  ├─ (auth)/                 # Layout & halaman login
│  │  ├─ (dashboard)/            # Layout & halaman dashboard/users/settings
│  │  ├─ api/auth/[...nextauth]/ # Route handler Auth.js
│  │  ├─ api/health/             # Health check
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                # Landing page
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ dashboard/              # Komponen dashboard
│  │  ├─ executive/              # KPI, filter, dan grafik eksekutif
│  │  ├─ forms/                  # Form login
│  │  ├─ layout/                 # Navbar & sidebar
│  │  └─ ui/                     # Komponen shadcn/ui
│  ├─ lib/
│  │  ├─ auth.ts                 # Konfigurasi Auth.js
│  │  ├─ date.ts                 # Helper tanggal & semester
│  │  ├─ prisma.ts               # Singleton Prisma Client
│  │  ├─ utils.ts
│  │  └─ validations/            # Schema Zod
│  ├─ server/
│  │  ├─ actions/                # Server Actions
│  │  └─ queries/                # Query dashboard
│  ├─ types/                     # Tipe & augmentasi NextAuth
│  ├─ generated/prisma/          # Prisma Client (generated, gitignored)
│  └─ proxy.ts                   # Proteksi route
└─ .env.example
```

## Catatan Teknis

- **Next.js 16** memakai `proxy.ts` sebagai pengganti `middleware.ts`. Proxy berjalan di Node.js runtime.
- **Cache Components** aktif (`cacheComponents: true`). Pembacaan session di `getCurrentUser()` memakai `await connection()` agar Auth.js tidak dijalankan saat prerender, karena setiap pembacaan session melakukan encode JWT yang memakai nilai acak. `export const instant = false` hanya membuat navigasi boleh memblokir render, bukan pengganti `connection()`.
- **Prisma 7** memakai generator `prisma-client` dengan output eksplisit ke `src/generated/prisma`, konfigurasi di `prisma7.config.ts`, dan driver adapter `@prisma/adapter-pg`.
- **Neon** menganjurkan pooled connection untuk runtime dan direct connection untuk migrasi. `prisma7.config.ts` memakai `DIRECT_URL` bila tersedia, atau menurunkan direct URL dari `DATABASE_URL`.
- **Auth.js v5** memakai strategi JWT dengan Credentials provider. Role aktif: `KEPALA_SEKOLAH`, `ADMIN`, `OPERATOR`. Role legacy `GURU`, `SISWA`, dan `ORANG_TUA` dipertahankan untuk data historis tetapi ditolak saat login.
- **PowerShell**: jika `npm` diblokir ExecutionPolicy, gunakan `npm.cmd` / `npx.cmd`.
- **Autentikasi dan RBAC**: lihat [`docs/AUTH.md`](docs/AUTH.md) untuk matriks akses, alur login, dan verifikasi.
- **Data sekolah**: lihat [`docs/STAGE4_SCHOOL_DATA.md`](docs/STAGE4_SCHOOL_DATA.md) untuk endpoint CRUD, bulk absensi, validasi, dan aturan RBAC.
- **Modul operasional**: lihat [`docs/STAGE5_OPERATIONAL_MODULES.md`](docs/STAGE5_OPERATIONAL_MODULES.md) untuk keuangan, fasilitas, dan pemeliharaan.
- **Dashboard eksekutif**: lihat [`docs/STAGE6_EXECUTIVE_DASHBOARD.md`](docs/STAGE6_EXECUTIVE_DASHBOARD.md) untuk KPI, filter, agregasi, dan drill-down.

## Deployment

1. Set `DATABASE_URL`, `DIRECT_URL` (opsional), `AUTH_SECRET`, dan `AUTH_URL` di environment hosting. `SEED_PASSWORD` hanya diperlukan untuk seed demo.
2. Jalankan `npm run build`.
3. Jalankan `npm run db:deploy` saat rilis.
4. Jalankan `npm run db:seed` hanya untuk lingkungan demo.
