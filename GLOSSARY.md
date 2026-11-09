# Glossary

Domain language for EIS Sekolah. Use these terms exactly in code, tests, docs, and conversations. This file describes meaning, not implementation.

## Design vocabulary

**Module**
Anything with an interface and an implementation. A module may be a function, class, package, or a slice that spans tiers.

**Interface**
Everything a caller must know to use a module correctly: types, invariants, ordering constraints, error modes, required configuration, and performance characteristics.

**Implementation**
The code inside a module. Distinct from an adapter: an adapter can have a large implementation behind a small interface.

**Depth**
Leverage at the interface. A module is deep when a large amount of behaviour sits behind a small interface. A module is shallow when callers must learn almost as much as the implementation contains.

**Seam**
The place where a module's interface lives and where behaviour can be replaced without editing callers.

**Adapter**
A concrete implementation that satisfies an interface at a seam. An adapter describes a role, not a substance.

**Leverage**
What callers gain from depth: more capability per unit of interface they must learn.

**Locality**
What maintainers gain from depth: change, bugs, knowledge, and verification stay in one place instead of spreading across callers.

## EIS domain vocabulary

**Tahun Ajaran**
Periode akademik dengan tanggal mulai, tanggal selesai, dan status aktif. Hanya satu tahun ajaran yang boleh aktif pada satu waktu.

**Kelas**
Kelompok siswa pada satu tahun ajaran, dengan tingkat, wali kelas, dan kapasitas.

**Siswa**
Peserta didik dengan identitas NIS/NISN dan status akademik. Siswa harus berstatus aktif untuk didaftarkan ke kelas.

**Guru**
Pendidik dengan NIP dan profil yang dapat dihubungkan ke akun pengguna.

**Enrollment**
Pendaftaran seorang siswa ke satu kelas pada satu tahun ajaran. Enrollment membawa status keanggotaan siswa di kelas tersebut.

**Teaching Assignment**
Penugasan seorang guru untuk mengajar satu mata pelajaran di satu kelas pada satu tahun ajaran.

**Kehadiran**
Catatan harian status siswa di kelas: hadir, sakit, izin, alpa, atau terlambat. Kehadiran hanya berlaku untuk siswa yang terdaftar di kelas tersebut.

**Nilai**
Skor siswa untuk satu mata pelajaran, kelas, semester, dan jenis penilaian.

**Transaksi Keuangan**
Pemasukan atau pengeluaran sekolah. Transaksi yang sudah diposting dapat di-void, tetapi tidak dihapus.

**Void**
Pembatalan transaksi keuangan dengan alasan, pelaku, dan waktu pembatalan. Transaksi void tetap tersimpan untuk audit.

**Fasilitas**
Aset sekolah dengan kode, lokasi, dan kondisi: baik, rusak ringan, atau rusak berat.

**Pemeliharaan**
Catatan perbaikan fasilitas dengan status dilaporkan, dikerjakan, atau selesai. Pemeliharaan selesai mengembalikan kondisi fasilitas menjadi baik bila sebelumnya rusak.

**KPI Indicator**
Definisi indikator kinerja sekolah, termasuk kode, nama, unit, dan target.

**KPI Measurement**
Nilai terukur untuk satu indikator pada satu periode dan tahun ajaran.

**Alert**
Peringatan operasional dengan tingkat keparahan dan status. Alert dibuat oleh modul yang memiliki peristiwa pemicunya.

**Activity Log**
Catatan audit tindakan pengguna terhadap entitas. Activity log bersifat tambahan dan tidak diubah oleh alur bisnis biasa.

**Role**
Peran pengguna yang menentukan izin: kepala sekolah, administrator, atau operator. Role historis tetap disimpan untuk data lama tetapi tidak dapat login.
