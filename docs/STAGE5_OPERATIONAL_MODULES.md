# Modul Operasional Sekolah (Tahap 5)

Dokumen ini merangkum modul operasional sekolah pada Tahap 5 EIS Sekolah yang mencakup Keuangan, Fasilitas, dan Pemeliharaan Sarana/Prasarana.

## Akses & RBAC

- `KEPALA_SEKOLAH`, `ADMIN`, dan `OPERATOR` dapat membaca seluruh data operasional sekolah.
- Hanya `OPERATOR` dan `ADMIN` yang memiliki izin membuat, mengubah, atau menghapus/void (CRUD) data operasional.
- `KEPALA_SEKOLAH` memiliki akses baca saja (*read-only*) untuk fungsi monitoring, audit, dan evaluasi eksekutif.

## Halaman UI

| Halaman | Deskripsi | Akses Tulis |
| --- | --- | --- |
| `/finance` | Pencatatan arus kas (pemasukan & pengeluaran), saldo bersih, dan status transaksi | Operator & Admin |
| `/facilities` | Inventaris sarana prasarana sekolah, lokasi, dan pemantauan kondisi fisik | Operator & Admin |
| `/maintenance` | Tiket pemeliharaan fasilitas, jadwal perbaikan, status pengerjaan, dan biaya | Operator & Admin |

## Endpoint API

| Modul | Koleksi | Item | Aksi Khusus |
| --- | --- | --- | --- |
| Keuangan | `GET/POST /api/eis/finance-transactions` | `GET/PATCH/DELETE /api/eis/finance-transactions/[id]` | `POST /api/eis/finance-transactions/[id]/void` |
| Fasilitas | `GET/POST /api/eis/facilities` | `GET/PATCH/DELETE /api/eis/facilities/[id]` | - |
| Pemeliharaan | `GET/POST /api/eis/facility-maintenances` | `GET/PATCH/DELETE /api/eis/facility-maintenances/[id]` | - |

## Aturan Bisnis & Integritas Data

1. **Keuangan (Finance Transactions)**:
   - Integritas akuntansi: Transaksi yang dihapus melalui UI/API diperlakukan sebagai **soft void** (tidak dihapus fisik dari database), disertai pencatatan `voidReason`, `voidedById`, dan `voidedAt`.
   - Transaksi berstatus `VOID` tidak dapat diubah kembali (*immutable*).
   - Metrik keuangan bulan berjalan dan kumulatif otomatis diagregasikan langsung dari transaksi berstatus `POSTED`.

2. **Fasilitas (Facilities)**:
   - Kode fasilitas bersifat unik (*case-insensitive/uppercase*).
   - Kondisi fisik fasilitas diklasifikasikan menjadi: `BAIK`, `RUSAK_RINGAN`, dan `RUSAK_BERAT`.
   - Fasilitas yang dilaporkan dengan kondisi `RUSAK_BERAT` otomatis memicu peringatan (*alert*) berkategori `WARNING` pada sistem untuk tindak lanjut pimpinan.
   - Penghapusan fasilitas dilindungi jika masih memiliki riwayat pemeliharaan aktif.

3. **Pemeliharaan (Facility Maintenance)**:
   - Status pengerjaan: `DILAPORKAN` (laporan awal), `DIJADWALKAN` (proses perbaikan), `SELESAI` (tuntas).
   - Laporan pemeliharaan baru (`DILAPORKAN`) otomatis membuat notifikasi/peringatan (*alert*) bagi pimpinan (Kepala Sekolah & Admin) di dashboard eksekutif.
   - Menandai pemeliharaan sebagai `SELESAI` secara otomatis memperbarui status kondisi fisik fasilitas terkait kembali menjadi `BAIK`.

