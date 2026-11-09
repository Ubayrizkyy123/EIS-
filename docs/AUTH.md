# Autentikasi dan Otorisasi EIS Sekolah

Dokumen ini menjelaskan model autentikasi, matriks akses, lapisan proteksi, dan cara memverifikasi RBAC pada aplikasi EIS Sekolah.

## Ringkasan

- Auth.js v5 dengan Credentials provider (email dan password).
- Password disimpan sebagai hash bcrypt.
- Session memakai strategi JWT selama 8 jam dan diperbarui setiap 15 menit.
- Role dan status aktif selalu dibaca ulang dari database pada setiap request.
- Registrasi publik dinonaktifkan. Akun dibuat oleh administrator.
- Otorisasi ditegakkan di proxy, halaman/server action, route API, dan service.

## Role Aktif

| Role | Halaman awal | Cakupan utama |
| --- | --- | --- |
| `KEPALA_SEKOLAH` | `/executive` | Ringkasan eksekutif, KPI, alert, dan data operasional read-only |
| `ADMIN` | `/admin` | Pengguna, role, activity log, pengaturan sistem, KPI, alert, dan data operasional (kelola/read-write) |
| `OPERATOR` | `/operator` | Data akademik, keuangan, fasilitas, absensi, nilai, dan jadwal |

Role legacy `GURU`, `SISWA`, dan `ORANG_TUA` tetap ada di enum untuk menjaga data historis. Akun legacy dinonaktifkan dan ditolak saat login.

## Matriks Akses

| Area | KEPALA_SEKOLAH | ADMIN | OPERATOR |
| --- | --- | --- | --- |
| `/dashboard` | Read | Read | Read |
| `/executive` | Read | - | - |
| `/admin` | - | Read | - |
| `/operator` | - | - | Read |
| `/users` | - | Read/write | - |
| `/activity-logs` | - | Read | - |
| `/settings` | Read | Read | Read |
| `/settings/system` | - | Read/write | - |
| Profil dan password sendiri | Read/write | Read/write | Read/write |
| Data operasional | Read | Read/write | Read/write |
| KPI dan pengukuran | Read | Read/write | - |
| Alert | Read | Read/write | - |

Catatan:

- `OPERATOR` dan `ADMIN` memiliki izin membuat, mengubah, dan menghapus (CRUD) data master operasional.
- `KEPALA_SEKOLAH` tidak memiliki akses write ke data operasional, KPI, atau alert (hanya baca).
- `OPERATOR` tidak memiliki akses ke pengguna, activity log, pengaturan sistem, KPI, atau alert.

## Akun Seed

Password mengikuti `SEED_PASSWORD`. Jika tidak diatur, password default adalah `Password123!`.

| Role | Email | Status |
| --- | --- | --- |
| `KEPALA_SEKOLAH` | `kepala@example.com` | Aktif |
| `ADMIN` | `demo@example.com` | Aktif |
| `OPERATOR` | `operator@example.com` | Aktif |
| `GURU` | `guru@example.com` | Nonaktif |
| `SISWA` | `siswa@example.com` | Nonaktif |
| `ORANG_TUA` | `orangtua@example.com` | Nonaktif |

Jangan memakai password default atau menjalankan seed demo di production.

## Alur Login dan Logout

### Login

1. Form login mengirim email dan password melalui `loginAction`.
2. Input divalidasi dengan Zod.
3. Auth.js memanggil Credentials provider.
4. Provider menolak akun jika:
   - password hash tidak ada;
   - akun tidak aktif;
   - role bukan role aplikasi yang aktif;
   - password tidak cocok.
5. Setelah berhasil, event `signIn` menulis `AUTH_LOGIN` ke activity log.
6. Pengguna diarahkan ke `/dashboard`, lalu `/dashboard` mengarahkan ke halaman awal sesuai role.

### Logout

1. Tombol keluar memanggil `logoutAction`.
2. Auth.js menghapus session.
3. Event `signOut` menulis `AUTH_LOGOUT` ke activity log jika token masih tersedia.
4. Pengguna diarahkan ke `/login`.

## Lapisan Proteksi

### 1. Proxy

`src/proxy.ts` melakukan pemeriksaan optimistis berdasarkan session:

- `/dashboard`, `/executive`, `/admin`, `/operator`, `/academic-years`, `/classes`, `/teachers`, `/students`, `/attendance`, `/finance`, `/facilities`, `/maintenance`, `/users`, `/activity-logs`, `/settings`, dan `/forbidden` memerlukan session.
- Pengguna tanpa session diarahkan ke `/login?reason=session`.

Proxy bukan sumber otorisasi final karena tidak membaca role dan status aktif terbaru dari database.

### 2. Halaman dan Server Action

`src/lib/authorization.ts` menyediakan:

- `getCurrentUser()`: membaca session, lalu mengambil user terbaru dari database.
- `requireUser()`: mengarahkan ke login jika session tidak valid atau akun tidak aktif.
- `requireRole(...)`: mengarahkan ke `/forbidden` jika role tidak sesuai.
- `requireAdmin()`: alias `requireRole("ADMIN")`.

Server action juga wajib memanggil guard sendiri:

- `profile.ts` memakai `requireUser()`.
- `users.ts` dan `settings.ts` memakai `requireAdmin()`.

### 3. Route API

Semua route API EIS memakai `requireApiContext()` melalui `makeCollectionRoutes` atau `makeItemRoutes`.

`requireApiContext()`:

- memanggil `await connection()`;
- membaca session;
- mengambil role dan `isActive` terbaru dari database;
- mengembalikan `401` jika belum login atau akun tidak aktif.

Role kemudian diperiksa dengan `requireRoles()` dan helper service:

- `assertAdminOnly`
- `assertKpiRead`
- `assertOperationalRead`
- `assertOperationalWrite`

### 4. Service

Service tetap memeriksa role walaupun route sudah memeriksa. Ini menjaga otorisasi jika service dipanggil dari jalur lain di masa depan.

## Semantik API

| Kondisi | Status |
| --- | --- |
| Belum login atau session tidak valid | `401` |
| Role tidak memiliki izin | `403` |
| Body JSON tidak valid | `400` |
| Validasi Zod gagal | `422` |
| Resource tidak ditemukan | `404` |
| Konflik data | `409` |

Aturan khusus:

- Delete user adalah deaktivasi, bukan penghapusan permanen.
- Delete transaksi keuangan adalah void, bukan penghapusan permanen.
- `ActivityLog` bersifat immutable.
- Minimal harus ada satu administrator aktif.
- Pengguna tidak dapat menonaktifkan atau mengubah role akun sendiri dari alur admin.

## Cache Components dan Auth.js

`next.config.ts` mengaktifkan `cacheComponents` dan `partialPrefetching`.

Auth.js v5 melakukan encode ulang JWT setiap kali session dibaca. Jalur encode memakai nilai acak seperti `crypto.randomUUID()`. Nilai acak tidak boleh dievaluasi saat prerender.

Karena itu `getCurrentUser()` memanggil:

```ts
await connection();
```

sebelum `auth()`. Ini memastikan session hanya dibaca pada request nyata.

Penting:

- `export const instant = false` hanya membuat navigasi boleh memblokir render. Ini bukan pengganti `connection()`.
- Jangan membungkus pembacaan session dengan `use cache` atau `use cache: private` jika role dan status aktif harus selalu segar.
- `connection()` tidak boleh dipakai di dalam `use cache` atau `use cache: private`.
- Pola Suspense dan cache privat dapat ditambahkan nanti untuk optimasi navigasi, tetapi bukan syarat keamanan saat ini.

## Verifikasi

Jalankan build terlebih dahulu karena `test:auth` memakai `next start`, bukan `next dev`.

```bash
npm run typecheck
npm run lint
npm run build
npm run test:eis
npm run test:auth
```

`test:auth` memverifikasi:

- halaman protected mengarah ke login saat belum login;
- API protected mengembalikan `401` saat belum login;
- akun legacy nonaktif tidak dapat login;
- setiap role dapat membuka halaman awalnya;
- halaman yang tidak diizinkan mengarah ke `/forbidden` tanpa membocorkan konten halaman terlarang;
- matriks API read dan write sesuai role.

Redirect dari Server Component dalam streaming context dapat berupa HTTP `200` dengan meta tag `id="__next-page-redirect"` atau payload RSC yang memuat digest `NEXT_REDIRECT;...;/forbidden;...`, bukan HTTP `3xx`. Test harus menerima bentuk-bentuk tersebut.

## Environment

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | Ya | Connection string aplikasi |
| `DIRECT_URL` | Tidak | Connection string langsung untuk migrasi |
| `AUTH_SECRET` | Ya | Secret Auth.js |
| `AUTH_URL` | Ya | URL aplikasi |
| `SEED_PASSWORD` | Tidak | Password akun seed demo |

## Troubleshooting

### Error `crypto.getRandomValues()` saat prerender

Pastikan `connection()` dipanggil sebelum `auth()` di `getCurrentUser()`. Hapus `.next`, lalu build ulang.

### Error `Value 'KEPALA_SEKOLAH' not found in enum 'Role'`

Periksa:

1. Enum `Role` di database.
2. `src/generated/prisma/internal/class.ts` memuat role terbaru.
3. Tidak ada dev server lama yang masih berjalan.
4. `.next` sudah dibersihkan dan Prisma Client sudah di-generate ulang.

Jika database sudah benar dan generated client sudah benar, hentikan proses lama lalu build ulang.
