import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import type {
  AttendanceStatus,
  DayOfWeek,
  FacilityCondition,
  FinanceType,
  Gender,
  GradeType,
  MaintenanceStatus,
  Role,
  Semester,
} from "../src/generated/prisma/enums";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const seedPassword = process.env.SEED_PASSWORD ?? "Password123!";

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

async function main() {
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  const upsertUser = async (data: {
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
  }) => {
    return prisma.user.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        role: data.role,
        passwordHash,
        isActive: data.isActive,
      },
      create: {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash,
        isActive: data.isActive,
      },
    });
  };

  const adminUser = await upsertUser({
    name: "Admin Sekolah",
    email: "demo@example.com",
    role: "ADMIN",
    isActive: true,
  });

  await upsertUser({
    name: "Kepala Sekolah",
    email: "kepala@example.com",
    role: "KEPALA_SEKOLAH",
    isActive: true,
  });

  await upsertUser({
    name: "Operator Sekolah",
    email: "operator@example.com",
    role: "OPERATOR",
    isActive: true,
  });

  const teacherUser = await upsertUser({
    name: "Budi Santoso",
    email: "guru@example.com",
    role: "GURU",
    isActive: false,
  });

  const studentUser = await upsertUser({
    name: "Andi Pratama",
    email: "siswa@example.com",
    role: "SISWA",
    isActive: false,
  });

  const parentUser = await upsertUser({
    name: "Rina Pratama",
    email: "orangtua@example.com",
    role: "ORANG_TUA",
    isActive: false,
  });

  const activeYear = await prisma.academicYear.upsert({
    where: { name: "2026/2027" },
    update: {
      startDate: utcDate(2026, 7, 13),
      endDate: utcDate(2027, 6, 30),
      isActive: true,
    },
    create: {
      name: "2026/2027",
      startDate: utcDate(2026, 7, 13),
      endDate: utcDate(2027, 6, 30),
      isActive: true,
    },
  });

  await prisma.academicYear.upsert({
    where: { name: "2025/2026" },
    update: {
      startDate: utcDate(2025, 7, 14),
      endDate: utcDate(2026, 6, 30),
      isActive: false,
    },
    create: {
      name: "2025/2026",
      startDate: utcDate(2025, 7, 14),
      endDate: utcDate(2026, 6, 30),
      isActive: false,
    },
  });

  const teacher1 = await prisma.teacher.upsert({
    where: { nip: "198001012005011001" },
    update: {
      userId: teacherUser.id,
      fullName: "Budi Santoso",
      gender: "LAKI_LAKI",
      phone: "081234567801",
      address: "Jl. Pendidikan No. 1",
    },
    create: {
      userId: teacherUser.id,
      nip: "198001012005011001",
      fullName: "Budi Santoso",
      gender: "LAKI_LAKI",
      phone: "081234567801",
      address: "Jl. Pendidikan No. 1",
    },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: { nip: "198502022010012002" },
    update: {
      fullName: "Siti Aminah",
      gender: "PEREMPUAN",
      phone: "081234567802",
      address: "Jl. Pendidikan No. 2",
    },
    create: {
      nip: "198502022010012002",
      fullName: "Siti Aminah",
      gender: "PEREMPUAN",
      phone: "081234567802",
      address: "Jl. Pendidikan No. 2",
    },
  });

  const teacher3 = await prisma.teacher.upsert({
    where: { nip: "199003032015011003" },
    update: {
      fullName: "Ahmad Fauzi",
      gender: "LAKI_LAKI",
      phone: "081234567803",
      address: "Jl. Pendidikan No. 3",
    },
    create: {
      nip: "199003032015011003",
      fullName: "Ahmad Fauzi",
      gender: "LAKI_LAKI",
      phone: "081234567803",
      address: "Jl. Pendidikan No. 3",
    },
  });

  const subjectDefinitions = [
    { code: "MTK", name: "Matematika", description: "Matematika dasar" },
    {
      code: "BIN",
      name: "Bahasa Indonesia",
      description: "Bahasa dan sastra Indonesia",
    },
    {
      code: "BIG",
      name: "Bahasa Inggris",
      description: "Bahasa Inggris komunikatif",
    },
    {
      code: "IPA",
      name: "Ilmu Pengetahuan Alam",
      description: "Fisika, kimia, dan biologi dasar",
    },
    {
      code: "IPS",
      name: "Ilmu Pengetahuan Sosial",
      description: "Sejarah, geografi, dan ekonomi dasar",
    },
  ];

  const subjects = [];

  for (const definition of subjectDefinitions) {
    subjects.push(
      await prisma.subject.upsert({
        where: { code: definition.code },
        update: {
          name: definition.name,
          description: definition.description,
        },
        create: definition,
      }),
    );
  }

  const subjectByCode = new Map(
    subjects.map((subject) => [subject.code, subject]),
  );

  const subjectTeacherPairs = [
    { teacherId: teacher1.id, subjectId: subjectByCode.get("MTK")!.id },
    { teacherId: teacher1.id, subjectId: subjectByCode.get("IPA")!.id },
    { teacherId: teacher2.id, subjectId: subjectByCode.get("BIN")!.id },
    { teacherId: teacher2.id, subjectId: subjectByCode.get("IPS")!.id },
    { teacherId: teacher3.id, subjectId: subjectByCode.get("BIG")!.id },
  ];

  for (const pair of subjectTeacherPairs) {
    await prisma.subjectTeacher.upsert({
      where: {
        teacherId_subjectId: {
          teacherId: pair.teacherId,
          subjectId: pair.subjectId,
        },
      },
      update: {},
      create: pair,
    });
  }

  const classDefinitions = [
    { name: "7A", gradeLevel: 7, homeroomTeacherId: teacher1.id },
    { name: "8A", gradeLevel: 8, homeroomTeacherId: teacher2.id },
    { name: "9A", gradeLevel: 9, homeroomTeacherId: teacher3.id },
  ];

  const classes = [];

  for (const definition of classDefinitions) {
    classes.push(
      await prisma.schoolClass.upsert({
        where: {
          academicYearId_name: {
            academicYearId: activeYear.id,
            name: definition.name,
          },
        },
        update: {
          gradeLevel: definition.gradeLevel,
          homeroomTeacherId: definition.homeroomTeacherId,
          capacity: 30,
        },
        create: {
          ...definition,
          academicYearId: activeYear.id,
          capacity: 30,
        },
      }),
    );
  }

  const studentDefinitions: {
    nis: string;
    nisn: string;
    fullName: string;
    gender: Gender;
    birthDate: Date;
    userId?: string;
  }[] = [
    {
      nis: "2026001",
      nisn: "0012345671",
      fullName: "Andi Pratama",
      gender: "LAKI_LAKI",
      birthDate: utcDate(2013, 1, 12),
      userId: studentUser.id,
    },
    {
      nis: "2026002",
      nisn: "0012345672",
      fullName: "Bunga Lestari",
      gender: "PEREMPUAN",
      birthDate: utcDate(2013, 3, 8),
    },
    {
      nis: "2026003",
      nisn: "0012345673",
      fullName: "Citra Dewi",
      gender: "PEREMPUAN",
      birthDate: utcDate(2013, 5, 21),
    },
    {
      nis: "2026004",
      nisn: "0012345674",
      fullName: "Dimas Saputra",
      gender: "LAKI_LAKI",
      birthDate: utcDate(2013, 7, 2),
    },
    {
      nis: "2026005",
      nisn: "0012345675",
      fullName: "Eka Putri",
      gender: "PEREMPUAN",
      birthDate: utcDate(2012, 2, 14),
    },
    {
      nis: "2026006",
      nisn: "0012345676",
      fullName: "Fajar Nugroho",
      gender: "LAKI_LAKI",
      birthDate: utcDate(2012, 4, 19),
    },
    {
      nis: "2026007",
      nisn: "0012345677",
      fullName: "Gita Maharani",
      gender: "PEREMPUAN",
      birthDate: utcDate(2012, 6, 25),
    },
    {
      nis: "2026008",
      nisn: "0012345678",
      fullName: "Hendra Wijaya",
      gender: "LAKI_LAKI",
      birthDate: utcDate(2012, 8, 30),
    },
    {
      nis: "2026009",
      nisn: "0012345679",
      fullName: "Indah Sari",
      gender: "PEREMPUAN",
      birthDate: utcDate(2011, 1, 5),
    },
    {
      nis: "2026010",
      nisn: "0012345680",
      fullName: "Joko Susilo",
      gender: "LAKI_LAKI",
      birthDate: utcDate(2011, 3, 17),
    },
    {
      nis: "2026011",
      nisn: "0012345681",
      fullName: "Kartika Sari",
      gender: "PEREMPUAN",
      birthDate: utcDate(2011, 5, 29),
    },
    {
      nis: "2026012",
      nisn: "0012345682",
      fullName: "Lukman Hakim",
      gender: "LAKI_LAKI",
      birthDate: utcDate(2011, 9, 9),
    },
  ];

  const students = [];

  for (const definition of studentDefinitions) {
    students.push(
      await prisma.student.upsert({
        where: { nis: definition.nis },
        update: {
          nisn: definition.nisn,
          fullName: definition.fullName,
          gender: definition.gender,
          birthDate: definition.birthDate,
          status: "AKTIF",
          userId: definition.userId,
        },
        create: {
          ...definition,
          status: "AKTIF",
        },
      }),
    );
  }

  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {
      name: "Rina Pratama",
      phone: "081234567890",
      occupation: "Karyawan swasta",
    },
    create: {
      userId: parentUser.id,
      name: "Rina Pratama",
      phone: "081234567890",
      occupation: "Karyawan swasta",
    },
  });

  const parentLinks = [
    { studentId: students[0].id, relation: "IBU" },
    { studentId: students[1].id, relation: "IBU" },
  ];

  for (const link of parentLinks) {
    await prisma.studentParent.upsert({
      where: {
        studentId_parentId: {
          studentId: link.studentId,
          parentId: parent.id,
        },
      },
      update: { relation: link.relation },
      create: {
        studentId: link.studentId,
        parentId: parent.id,
        relation: link.relation,
      },
    });
  }

  const enrollments: {
    student: (typeof students)[number];
    schoolClass: (typeof classes)[number];
  }[] = [];

  for (const [index, student] of students.entries()) {
    const schoolClass = classes[Math.floor(index / 4)] ?? classes[0];

    await prisma.enrollment.upsert({
      where: {
        studentId_academicYearId: {
          studentId: student.id,
          academicYearId: activeYear.id,
        },
      },
      update: {
        classId: schoolClass.id,
        status: "AKTIF",
      },
      create: {
        studentId: student.id,
        classId: schoolClass.id,
        academicYearId: activeYear.id,
        status: "AKTIF",
        enrolledAt: activeYear.startDate,
      },
    });

    enrollments.push({ student, schoolClass });
  }

  const days: DayOfWeek[] = [
    "SENIN",
    "SELASA",
    "RABU",
    "KAMIS",
    "JUMAT",
  ];
  const periods = [
    { startTime: "07:30", endTime: "08:10" },
    { startTime: "08:15", endTime: "08:55" },
    { startTime: "09:00", endTime: "09:40" },
  ];
  const subjectCodes = ["MTK", "BIN", "BIG", "IPA", "IPS"];
  const teacherBySubjectCode: Record<string, string> = {
    MTK: teacher1.id,
    IPA: teacher1.id,
    BIN: teacher2.id,
    IPS: teacher2.id,
    BIG: teacher3.id,
  };

  for (const [classIndex, schoolClass] of classes.entries()) {
    for (const [dayIndex, day] of days.entries()) {
      for (const [periodIndex, period] of periods.entries()) {
        const code =
          subjectCodes[
            (classIndex + dayIndex + periodIndex) % subjectCodes.length
          ];
        const subject = subjectByCode.get(code)!;
        const teacherId = teacherBySubjectCode[code]!;

        await prisma.schedule.upsert({
          where: {
            classId_dayOfWeek_startTime: {
              classId: schoolClass.id,
              dayOfWeek: day,
              startTime: period.startTime,
            },
          },
          update: {
            subjectId: subject.id,
            teacherId,
            endTime: period.endTime,
            room: `R-${schoolClass.name}`,
          },
          create: {
            classId: schoolClass.id,
            subjectId: subject.id,
            teacherId,
            dayOfWeek: day,
            startTime: period.startTime,
            endTime: period.endTime,
            room: `R-${schoolClass.name}`,
          },
        });
      }
    }
  }

  const attendanceStatuses: AttendanceStatus[] = [
    "HADIR",
    "HADIR",
    "HADIR",
    "HADIR",
    "SAKIT",
    "IZIN",
    "ALPA",
    "TERLAMBAT",
  ];
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );

  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);

    const dayIndex = date.getUTCDay();

    if (dayIndex === 0 || dayIndex === 6) {
      continue;
    }

    for (const [studentIndex, enrollment] of enrollments.entries()) {
      const status =
        attendanceStatuses[
          (studentIndex + offset) % attendanceStatuses.length
        ];

      await prisma.attendance.upsert({
        where: {
          studentId_classId_date: {
            studentId: enrollment.student.id,
            classId: enrollment.schoolClass.id,
            date,
          },
        },
        update: {
          status,
          recordedById: adminUser.id,
        },
        create: {
          studentId: enrollment.student.id,
          classId: enrollment.schoolClass.id,
          date,
          status,
          recordedById: adminUser.id,
        },
      });
    }
  }

  const semester: Semester = "GANJIL";
  const gradeTypes: GradeType[] = ["UH", "UTS"];

  for (const [studentIndex, enrollment] of enrollments.entries()) {
    for (const [subjectIndex, subject] of subjects.entries()) {
      for (const [typeIndex, type] of gradeTypes.entries()) {
        const score =
          70 + ((studentIndex * 3 + subjectIndex * 5 + typeIndex * 7) % 26);

        await prisma.grade.upsert({
          where: {
            studentId_subjectId_classId_semester_type: {
              studentId: enrollment.student.id,
              subjectId: subject.id,
              classId: enrollment.schoolClass.id,
              semester,
              type,
            },
          },
          update: {
            score,
            academicYearId: activeYear.id,
          },
          create: {
            studentId: enrollment.student.id,
            subjectId: subject.id,
            classId: enrollment.schoolClass.id,
            academicYearId: activeYear.id,
            semester,
            type,
            score,
          },
        });
      }
    }
  }

  const teacherBySubjectCodeForAssignment: Record<string, string> = {
    MTK: teacher1.id,
    IPA: teacher1.id,
    BIN: teacher2.id,
    IPS: teacher2.id,
    BIG: teacher3.id,
  };

  for (const schoolClass of classes) {
    for (const subject of subjects) {
      const teacherId = teacherBySubjectCodeForAssignment[subject.code]!;

      await prisma.teachingAssignment.upsert({
        where: {
          teacherId_classId_subjectId_academicYearId: {
            teacherId,
            classId: schoolClass.id,
            subjectId: subject.id,
            academicYearId: activeYear.id,
          },
        },
        update: {},
        create: {
          teacherId,
          classId: schoolClass.id,
          subjectId: subject.id,
          academicYearId: activeYear.id,
        },
      });
    }
  }

  const financeDefinitions: {
    id: string;
    type: FinanceType;
    category: string;
    description: string;
    amount: number;
    transactionDate: Date;
  }[] = [
    {
      id: "seed-finance-income-1",
      type: "INCOME",
      category: "SPP",
      description: "Pembayaran SPP Juli 2026",
      amount: 15000000,
      transactionDate: utcDate(2026, 7, 15),
    },
    {
      id: "seed-finance-expense-1",
      type: "EXPENSE",
      category: "Operasional",
      description: "Pembelian alat tulis sekolah",
      amount: 2500000,
      transactionDate: utcDate(2026, 7, 18),
    },
  ];

  for (const finance of financeDefinitions) {
    await prisma.financeTransaction.upsert({
      where: { id: finance.id },
      update: {
        type: finance.type,
        category: finance.category,
        description: finance.description,
        amount: finance.amount,
        transactionDate: finance.transactionDate,
        status: "POSTED",
        createdById: adminUser.id,
        voidedById: null,
        voidReason: null,
        voidedAt: null,
      },
      create: {
        ...finance,
        status: "POSTED",
        createdById: adminUser.id,
      },
    });
  }

  const facilityDefinitions: {
    code: string;
    name: string;
    location: string;
    condition: FacilityCondition;
    notes: string;
  }[] = [
    {
      code: "LAB-IPA",
      name: "Laboratorium IPA",
      location: "Gedung B Lantai 1",
      condition: "BAIK",
      notes: "Peralatan dasar lengkap",
    },
    {
      code: "PERPUS",
      name: "Perpustakaan",
      location: "Gedung A Lantai 2",
      condition: "RUSAK_RINGAN",
      notes: "Beberapa rak perlu diperbaiki",
    },
  ];

  const facilities = [];

  for (const facility of facilityDefinitions) {
    facilities.push(
      await prisma.facility.upsert({
        where: { code: facility.code },
        update: {
          name: facility.name,
          location: facility.location,
          condition: facility.condition,
          notes: facility.notes,
        },
        create: facility,
      }),
    );
  }

  const maintenanceDefinitions: {
    id: string;
    facilityId: string;
    description: string;
    scheduledDate: Date | null;
    completedDate: Date | null;
    cost: number | null;
    status: MaintenanceStatus;
  }[] = [
    {
      id: "seed-maintenance-1",
      facilityId: facilities[1].id,
      description: "Perbaikan rak buku yang rusak ringan",
      scheduledDate: utcDate(2026, 8, 5),
      completedDate: null,
      cost: null,
      status: "DIJADWALKAN",
    },
  ];

  for (const maintenance of maintenanceDefinitions) {
    await prisma.facilityMaintenance.upsert({
      where: { id: maintenance.id },
      update: {
        facilityId: maintenance.facilityId,
        reportedById: teacherUser.id,
        description: maintenance.description,
        scheduledDate: maintenance.scheduledDate,
        completedDate: maintenance.completedDate,
        cost: maintenance.cost,
        status: maintenance.status,
      },
      create: {
        ...maintenance,
        reportedById: teacherUser.id,
      },
    });
  }

  const kpiDefinitions = [
    {
      code: "KEHADIRAN",
      name: "Tingkat Kehadiran Siswa",
      unit: "%",
      target: 95,
      description: "Persentase kehadiran siswa per periode",
    },
    {
      code: "NILAI_RATA",
      name: "Rata-rata Nilai Siswa",
      unit: "poin",
      target: 80,
      description: "Rata-rata nilai seluruh mata pelajaran",
    },
  ];

  const kpis = [];

  for (const kpi of kpiDefinitions) {
    kpis.push(
      await prisma.kpiIndicator.upsert({
        where: { code: kpi.code },
        update: {
          name: kpi.name,
          unit: kpi.unit,
          target: kpi.target,
          description: kpi.description,
        },
        create: kpi,
      }),
    );
  }

  const kpiMeasurements = [
    {
      indicatorId: kpis[0].id,
      period: "2026-07",
      value: 96.4,
      note: "Data demo bulan Juli",
    },
    {
      indicatorId: kpis[1].id,
      period: "2026-07",
      value: 82.7,
      note: "Data demo bulan Juli",
    },
  ];

  for (const measurement of kpiMeasurements) {
    await prisma.kpiMeasurement.upsert({
      where: {
        indicatorId_period: {
          indicatorId: measurement.indicatorId,
          period: measurement.period,
        },
      },
      update: {
        value: measurement.value,
        measuredById: adminUser.id,
        note: measurement.note,
      },
      create: {
        ...measurement,
        measuredById: adminUser.id,
      },
    });
  }

  await prisma.alert.upsert({
    where: { id: "seed-alert-1" },
    update: {
      title: "Rak perpustakaan perlu diperbaiki",
      message: "Terdapat rak buku yang rusak ringan di perpustakaan.",
      severity: "WARNING",
      status: "OPEN",
      entityType: "Facility",
      entityId: facilities[1].id,
      resolvedById: null,
      resolvedAt: null,
    },
    create: {
      id: "seed-alert-1",
      title: "Rak perpustakaan perlu diperbaiki",
      message: "Terdapat rak buku yang rusak ringan di perpustakaan.",
      severity: "WARNING",
      status: "OPEN",
      entityType: "Facility",
      entityId: facilities[1].id,
    },
  });

  const systemSettings = [
    {
      key: "school_name",
      value: "SMP EIS Sekolah",
      description: "Nama sekolah yang ditampilkan pada aplikasi.",
    },
    {
      key: "school_address",
      value: "Jl. Pendidikan No. 1, Jakarta",
      description: "Alamat sekolah.",
    },
    {
      key: "school_phone",
      value: "021-5550100",
      description: "Nomor telepon sekolah.",
    },
    {
      key: "school_email",
      value: "info@example.sch.id",
      description: "Email kontak sekolah.",
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { description: setting.description },
      create: setting,
    });
  }

  await prisma.activityLog.upsert({
    where: { id: "seed-activity-1" },
    update: {},
    create: {
      id: "seed-activity-1",
      actorId: adminUser.id,
      action: "SEED",
      entityType: "System",
      metadata: {
        source: "prisma/seed.ts",
        description: "Data demo EIS berhasil dimuat",
      },
    },
  });

  console.log(
    process.env.SEED_PASSWORD
      ? "Seed selesai. Password akun mengikuti SEED_PASSWORD."
      : `Seed selesai. Akun demo: demo@example.com / ${seedPassword}`,
  );
  console.log(
    "Akun aktif: kepala@example.com (KEPALA_SEKOLAH), demo@example.com (ADMIN), operator@example.com (OPERATOR).",
  );
  console.log(
    "Akun legacy nonaktif: guru@example.com, siswa@example.com, orangtua@example.com.",
  );
  console.log(
    `${students.length} siswa, ${classes.length} kelas, ${subjects.length} mata pelajaran.`,
  );
  console.log(
    `${classes.length * subjects.length} teaching assignment, ${financeDefinitions.length} transaksi keuangan, ${facilities.length} fasilitas, ${kpis.length} indikator KPI.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
