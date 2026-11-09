import { z } from "zod";

import { APP_ROLES } from "@/types/auth";

export const genderValues = ["LAKI_LAKI", "PEREMPUAN"] as const;
export const studentStatusValues = [
  "AKTIF",
  "LULUS",
  "PINDAH",
  "KELUAR",
] as const;
export const semesterValues = ["GANJIL", "GENAP"] as const;
export const attendanceStatusValues = [
  "HADIR",
  "SAKIT",
  "IZIN",
  "ALPA",
  "TERLAMBAT",
] as const;
export const gradeTypeValues = ["TUGAS", "UH", "UTS", "UAS"] as const;
export const dayOfWeekValues = [
  "SENIN",
  "SELASA",
  "RABU",
  "KAMIS",
  "JUMAT",
  "SABTU",
] as const;
export const financeTypeValues = ["INCOME", "EXPENSE"] as const;
export const facilityConditionValues = [
  "BAIK",
  "RUSAK_RINGAN",
  "RUSAK_BERAT",
] as const;
export const maintenanceStatusValues = [
  "DILAPORKAN",
  "DIJADWALKAN",
  "SELESAI",
] as const;
export const alertSeverityValues = ["INFO", "WARNING", "CRITICAL"] as const;

const optionalText = z.string().trim().max(1000).nullable().optional();
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const academicYearCreateSchema = z
  .object({
    name: z.string().trim().min(4).max(20),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "Tanggal mulai harus sebelum atau sama dengan tanggal selesai.",
    path: ["endDate"],
  });

export const academicYearUpdateSchema = z
  .object({
    name: z.string().trim().min(4).max(20).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      !value.startDate ||
      !value.endDate ||
      value.startDate <= value.endDate,
    {
      message: "Tanggal mulai harus sebelum atau sama dengan tanggal selesai.",
      path: ["endDate"],
    },
  );

export const classCreateSchema = z.object({
  name: z.string().trim().min(1).max(30),
  gradeLevel: z.coerce.number().int().min(1).max(12),
  academicYearId: z.string().min(1),
  homeroomTeacherId: z.string().min(1).nullable().optional(),
  capacity: z.coerce.number().int().positive().max(200).optional(),
});
export const classUpdateSchema = classCreateSchema.partial();

export const subjectCreateSchema = z.object({
  code: z.string().trim().min(1).max(20).toUpperCase(),
  name: z.string().trim().min(1).max(120),
  description: optionalText,
});
export const subjectUpdateSchema = subjectCreateSchema.partial();

export const teacherCreateSchema = z.object({
  userId: z.string().min(1).nullable().optional(),
  nip: z.string().trim().min(1).max(30),
  fullName: z.string().trim().min(1).max(120),
  gender: z.enum(genderValues),
  phone: z.string().trim().max(30).nullable().optional(),
  address: optionalText,
});
export const teacherUpdateSchema = teacherCreateSchema.partial();

export const studentCreateSchema = z.object({
  userId: z.string().min(1).nullable().optional(),
  nis: z.string().trim().min(1).max(30),
  nisn: z.string().trim().max(30).nullable().optional(),
  fullName: z.string().trim().min(1).max(120),
  gender: z.enum(genderValues),
  birthPlace: z.string().trim().max(100).nullable().optional(),
  birthDate: z.coerce.date().nullable().optional(),
  address: optionalText,
  phone: z.string().trim().max(30).nullable().optional(),
  status: z.enum(studentStatusValues).optional(),
});
export const studentUpdateSchema = studentCreateSchema.partial();

export const enrollmentCreateSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
  academicYearId: z.string().min(1),
  status: z.enum(studentStatusValues).optional(),
  enrolledAt: z.coerce.date().optional(),
});
export const enrollmentUpdateSchema = enrollmentCreateSchema.partial();
export const studentClassAssignmentSchema = z.object({
  studentId: z.string().min(1),
  academicYearId: z.string().min(1),
  classId: z.string().min(1),
});

export const scheduleCreateSchema = z
  .object({
    classId: z.string().min(1),
    subjectId: z.string().min(1),
    teacherId: z.string().min(1),
    dayOfWeek: z.enum(dayOfWeekValues),
    startTime: z.string().regex(timePattern, "Format jam harus HH:mm."),
    endTime: z.string().regex(timePattern, "Format jam harus HH:mm."),
    room: z.string().trim().max(50).nullable().optional(),
  })
  .refine((value) => value.startTime < value.endTime, {
    message: "Jam mulai harus sebelum jam selesai.",
    path: ["endTime"],
  });
export const scheduleUpdateSchema = z
  .object({
    classId: z.string().min(1).optional(),
    subjectId: z.string().min(1).optional(),
    teacherId: z.string().min(1).optional(),
    dayOfWeek: z.enum(dayOfWeekValues).optional(),
    startTime: z.string().regex(timePattern).optional(),
    endTime: z.string().regex(timePattern).optional(),
    room: z.string().trim().max(50).nullable().optional(),
  })
  .refine(
    (value) =>
      !value.startTime || !value.endTime || value.startTime < value.endTime,
    {
      message: "Jam mulai harus sebelum jam selesai.",
      path: ["endTime"],
    },
  );

export const attendanceCreateSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
  date: z.coerce.date(),
  status: z.enum(attendanceStatusValues).optional(),
  note: z.string().trim().max(500).nullable().optional(),
});
export const attendanceUpdateSchema = z.object({
  status: z.enum(attendanceStatusValues).optional(),
  note: z.string().trim().max(500).nullable().optional(),
});
export const attendanceBulkSchema = z.object({
  classId: z.string().min(1),
  date: z.coerce.date(),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(attendanceStatusValues).optional(),
        note: z.string().trim().max(500).nullable().optional(),
      }),
    )
    .min(1)
    .max(200),
});

export const gradeCreateSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  academicYearId: z.string().min(1),
  semester: z.enum(semesterValues),
  type: z.enum(gradeTypeValues),
  score: z.coerce.number().min(0).max(100),
  weight: z.coerce.number().positive().max(100).optional(),
  note: z.string().trim().max(500).nullable().optional(),
});
export const gradeUpdateSchema = gradeCreateSchema.partial();

export const teachingAssignmentCreateSchema = z.object({
  teacherId: z.string().min(1),
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  academicYearId: z.string().min(1),
});
export const teachingAssignmentUpdateSchema =
  teachingAssignmentCreateSchema.partial();

export const financeCreateSchema = z.object({
  type: z.enum(financeTypeValues),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(500),
  amount: z.coerce.number().positive().max(999999999999),
  transactionDate: z.coerce.date(),
  status: z.literal("POSTED").optional(),
});
export const financeUpdateSchema = z.object({
  type: z.enum(financeTypeValues).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().min(1).max(500).optional(),
  amount: z.coerce.number().positive().max(999999999999).optional(),
  transactionDate: z.coerce.date().optional(),
});
export const financeVoidSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const facilityCreateSchema = z.object({
  code: z.string().trim().min(1).max(30).toUpperCase(),
  name: z.string().trim().min(1).max(120),
  location: z.string().trim().max(120).nullable().optional(),
  condition: z.enum(facilityConditionValues).optional(),
  notes: optionalText,
});
export const facilityUpdateSchema = facilityCreateSchema.partial();

export const maintenanceCreateSchema = z.object({
  facilityId: z.string().min(1),
  description: z.string().trim().min(1).max(1000),
  scheduledDate: z.coerce.date().nullable().optional(),
  completedDate: z.coerce.date().nullable().optional(),
  cost: z.coerce.number().min(0).max(999999999999).nullable().optional(),
  status: z.enum(maintenanceStatusValues).optional(),
});
export const maintenanceUpdateSchema = maintenanceCreateSchema.partial();

export const kpiIndicatorCreateSchema = z.object({
  code: z.string().trim().min(1).max(30).toUpperCase(),
  name: z.string().trim().min(1).max(120),
  unit: z.string().trim().min(1).max(30),
  target: z.coerce.number().nullable().optional(),
  description: optionalText,
});
export const kpiIndicatorUpdateSchema = kpiIndicatorCreateSchema.partial();

export const kpiMeasurementCreateSchema = z.object({
  indicatorId: z.string().min(1),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM."),
  value: z.coerce.number(),
  measuredAt: z.coerce.date().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});
export const kpiMeasurementUpdateSchema = kpiMeasurementCreateSchema.partial();

export const alertCreateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(1000),
  severity: z.enum(alertSeverityValues).optional(),
  entityType: z.string().trim().max(50).nullable().optional(),
  entityId: z.string().trim().max(100).nullable().optional(),
});
export const alertUpdateSchema = alertCreateSchema.partial();

export const userRoleValues = APP_ROLES;

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).nullable().optional(),
  role: z.enum(userRoleValues).optional(),
  isActive: z.boolean().optional(),
});
