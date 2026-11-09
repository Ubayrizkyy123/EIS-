# Dashboard Eksekutif & KPI (Tahap 6)

Dokumen ini merangkum dashboard eksekutif pada Tahap 6 EIS Sekolah: KPI utama, tren akademik dan keuangan, filter akademik, kondisi fasilitas, serta drill-down ke modul operasional.

## Akses & RBAC

- `/executive` hanya dapat diakses oleh `KEPALA_SEKOLAH` melalui `requireRole(...EXECUTIVE_ROLES)`.
- `ADMIN` dan `OPERATOR` diarahkan ke halaman role masing-masing oleh proxy dan tidak dapat membaca halaman ini.
- Dashboard bersifat baca saja. Tidak ada aksi tulis baru pada Tahap 6.
- Tidak ada endpoint API publik baru; seluruh agregasi dijalankan server-side melalui `src/server/queries/executive.ts`.

## Filter Akademik

Filter dikirim melalui query string GET dan tidak memerlukan JavaScript client.

| Parameter | Fungsi |
| --- | --- |
| `academicYearId` | Memilih tahun ajaran. Jika kosong atau tidak valid, sistem memakai tahun ajaran dari kelas terpilih, lalu tahun ajaran aktif, lalu tahun terbaru. |
| `classId` | Membatasi KPI siswa, absensi, komposisi, dan tren kehadiran pada satu kelas. Jika kelas berasal dari tahun ajaran lain, tahun ajaran kelas tersebut yang dipakai. |

Cakupan filter:

- **Mengikuti filter:** jumlah siswa aktif, tingkat kehadiran, komposisi status absensi, dan tren kehadiran bulanan.
- **Skala sekolah:** saldo dan tren keuangan, kondisi fasilitas, tiket pemeliharaan, alert, KPI terbaru, jadwal hari ini, dan rata-rata nilai.
- Filter yang tidak valid tidak menimbulkan error; query kembali ke cakupan tahun aktif dan seluruh kelas.

## KPI Utama

| KPI | Definisi |
| --- | --- |
| Siswa aktif | Jumlah `Enrollment` berstatus `AKTIF` untuk siswa berstatus `AKTIF` pada tahun ajaran/periode terpilih. |
| Tingkat kehadiran | Persentase catatan `HADIR` dibagi seluruh catatan absensi pada periode dan filter terpilih. Target diambil dari indikator KPI `KEHADIRAN`; fallback `95%`. |
| Saldo keuangan | Pemasukan `POSTED` dikurangi pengeluaran `POSTED` pada bulan berjalan. Nilai negatif ditandai sebagai risiko. |
| Kondisi fasilitas | Persentase fasilitas `BAIK` terhadap seluruh fasilitas. KPI juga menampilkan fasilitas rusak berat dan tiket pemeliharaan aktif. |

Periode absensi dimulai dari awal tahun ajaran terpilih sampai akhir tahun ajaran atau waktu sekarang, mana yang lebih awal. Jika tahun ajaran belum berjalan atau sudah berakhir, periode tetap mengikuti batas tahun ajaran.

## Grafik & Visualisasi

- **Tren kehadiran:** grafik SVG per bulan dalam periode akademik, dengan garis target dan tooltip native. Bulan tanpa data ditampilkan sebagai titik kosong.
- **Arus keuangan:** grafik batang berkelompok untuk pemasukan dan pengeluaran `POSTED` selama enam bulan kalender terakhir, termasuk bulan berjalan.
- **Kondisi fasilitas:** stacked bar dan rincian jumlah/persentase untuk `BAIK`, `RUSAK_RINGAN`, dan `RUSAK_BERAT`.
- **Komposisi kehadiran:** distribusi `HADIR`, `SAKIT`, `IZIN`, `ALPA`, dan `TERLAMBAT`.
- Grafik tidak memakai library tambahan; semua visualisasi memakai SVG/CSS dan komponen UI yang sudah ada.
- Empty state ditampilkan jika belum ada absensi, transaksi, atau fasilitas pada cakupan data.

## Drill-down

| KPI/Panel | Tujuan |
| --- | --- |
| Siswa aktif | `/students` atau `/students?classId=...` |
| Tingkat kehadiran | `/attendance` atau `/attendance?classId=...` |
| Saldo keuangan | `/finance?status=POSTED` |
| Kondisi fasilitas | `/facilities` atau `/facilities?condition=RUSAK_BERAT` |
| Status pemeliharaan | `/maintenance?status=DILAPORKAN`, `DIJADWALKAN`, atau `SELESAI` |

Semua halaman tujuan sudah mendukung parameter query tersebut dan tetap menjalankan RBAC masing-masing.

## Komponen & Query

| Berkas | Peran |
| --- | --- |
| `src/server/queries/executive.ts` | Agregasi KPI, tren absensi/keuangan, fasilitas, pemeliharaan, dan opsi filter. |
| `src/server/queries/roles.ts` | Data pendukung lama: KPI terbaru, jadwal, nilai, dan alert. |
| `src/server/queries/operations.ts` | Sumber metrik keuangan, fasilitas, dan pemeliharaan yang dipakai ulang. |
| `src/components/executive/executive-filters.tsx` | Form filter GET tahun ajaran dan kelas. |
| `src/components/executive/executive-kpi-card.tsx` | Kartu KPI dengan aksi drill-down. |
| `src/components/executive/attendance-trend-chart.tsx` | Grafik tren HADIR. |
| `src/components/executive/finance-trend-chart.tsx` | Grafik arus keuangan enam bulan. |
| `src/components/executive/facility-condition-chart.tsx` | Komposisi kondisi fasilitas. |
| `src/app/(dashboard)/executive/page.tsx` | Halaman utama dashboard eksekutif. |

## Aturan Data

- Hanya transaksi keuangan `POSTED` yang dihitung; transaksi `VOID` diabaikan.
- Kehadiran dihitung dari catatan `Attendance`; `HADIR` adalah pembilang, seluruh status adalah penyebut.
- Agregasi memakai `groupBy` dan query terbatas, bukan mengambil seluruh tabel ke memori.
- Tahun ajaran dan kelas divalidasi terhadap database sebelum dipakai; ID asing tidak diteruskan ke query.
- Tidak ada perubahan schema atau migrasi pada Tahap 6.

## Verifikasi

Jalankan:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:eis
npm run test:auth
```

`test:auth` mencakup akses `/executive` untuk Kepala Sekolah, penolakan Admin/Operator, filter akademik valid, dan fallback filter tidak valid.
