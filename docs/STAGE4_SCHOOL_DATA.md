# Data Sekolah dan Absensi

Dokumen ini merangkum modul data sekolah pada Tahap 4 EIS Sekolah.

## Akses

- `KEPALA_SEKOLAH`, `ADMIN`, dan `OPERATOR` dapat membaca seluruh data operasional.
- Hanya `OPERATOR` dan `ADMIN` yang memiliki izin membuat, mengubah, atau menghapus (CRUD) data master operasional.
- `KEPALA_SEKOLAH` memiliki akses baca saja (read-only) untuk mendukung fungsi monitoring dan evaluasi eksekutif.
- Absensi hanya tersedia untuk siswa. Tidak ada absensi guru pada tahap ini.
- Halaman UI:
  - `/academic-years`
  - `/classes`
  - `/teachers`
  - `/students`
  - `/attendance`

## Endpoint CRUD

| Resource | Collection | Item |
| --- | --- | --- |
| Tahun ajaran | `GET/POST /api/eis/academic-years` | `GET/PATCH/DELETE /api/eis/academic-years/[id]` |
| Kelas | `GET/POST /api/eis/classes` | `GET/PATCH/DELETE /api/eis/classes/[id]` |
| Guru | `GET/POST /api/eis/teachers` | `GET/PATCH/DELETE /api/eis/teachers/[id]` |
| Siswa | `GET/POST /api/eis/students` | `GET/PATCH/DELETE /api/eis/students/[id]` |
| Absensi | `GET/POST /api/eis/attendance` | `GET/PATCH/DELETE /api/eis/attendance/[id]` |

Query list mendukung `page`, `limit`, dan filter berikut:

- Tahun ajaran: `search`
- Kelas: `search`, `academicYearId`
- Guru: `search`
- Siswa: `search`, `status`, `classId`
- Absensi: `classId`, `date` (`YYYY-MM-DD`), `status`

Respons list:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 0,
    "totalPages": 0
  }
}
```

## Absensi Massal

`POST /api/eis/attendance/bulk`

```json
{
  "classId": "class_id",
  "date": "2026-11-03",
  "entries": [
    {
      "studentId": "student_id",
      "status": "HADIR",
      "note": null
    }
  ]
}
```

Aturan:

- Maksimal 200 siswa per pengiriman.
- `studentId` tidak boleh duplikat dalam satu payload.
- Tanggal harus berada dalam rentang tahun ajaran kelas.
- Semua siswa harus memiliki enrollment `AKTIF` pada kelas dan tahun ajaran tersebut.
- Penyimpanan memakai upsert berdasarkan `(studentId, classId, date)`.

Respons:

```json
{
  "data": {
    "classId": "class_id",
    "date": "2026-11-03T00:00:00.000Z",
    "saved": 30
  }
}
```

Status absensi: `HADIR`, `SAKIT`, `IZIN`, `ALPA`, `TERLAMBAT`.

## Aturan Validasi dan Konflik

- Tahun ajaran:
  - Tanggal mulai tidak boleh melewati tanggal selesai.
  - Tahun ajaran aktif tidak dapat dihapus (`409 ACTIVE_YEAR`).
  - Tahun ajaran yang masih memiliki kelas, enrollment, nilai, atau penugasan mengajar tidak dapat dihapus.
- Kelas:
  - Tahun ajaran dan wali kelas harus valid.
  - Tahun ajaran tidak dapat diubah jika kelas sudah memiliki enrollment (`409 CLASS_HAS_ENROLLMENTS`).
  - Kapasitas tidak boleh lebih kecil dari jumlah enrollment aktif (`422 CAPACITY_TOO_SMALL`).
  - Kelas yang masih memiliki enrollment, absensi, nilai, jadwal, atau penugasan mengajar tidak dapat dihapus.
- Guru:
  - Akun pengguna yang ditautkan harus aktif dan belum terhubung ke profil guru/siswa/orang tua lain.
  - Guru yang masih memiliki jadwal atau penugasan mengajar tidak dapat dihapus.
- Siswa:
  - Tanggal lahir tidak boleh di masa depan.
  - Akun pengguna mengikuti aturan tautan yang sama seperti guru.
  - Siswa yang masih memiliki enrollment, absensi, atau nilai tidak dapat dihapus.
- Enrollment:
  - Kelas harus berasal dari tahun ajaran yang sama.
  - Status `AKTIF` hanya boleh untuk siswa berstatus `AKTIF`.
  - Kapasitas kelas tidak boleh terlampaui.

Format error API:

```json
{
  "error": {
    "code": "INVALID_ENROLLMENT",
    "message": "Beberapa siswa tidak terdaftar aktif pada kelas tersebut.",
    "details": {
      "studentIds": ["student_id"]
    }
  }
}
```

## Penempatan Kelas Siswa

UI siswa memakai enrollment yang sudah ada:

- Jika siswa belum memiliki enrollment pada tahun ajaran terpilih, sistem membuat enrollment `AKTIF`.
- Jika sudah ada, sistem memindahkan siswa ke kelas baru dan memastikan status tetap `AKTIF`.
- Perpindahan tetap divalidasi terhadap tahun ajaran, status siswa, dan kapasitas kelas.

## Verifikasi

```bash
npm run typecheck
npm run lint
npm run build
npm run test:eis
npm run test:auth
```
