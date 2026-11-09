"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z, type ZodType } from "zod";

import { ApiError } from "@/lib/api-error";
import { requireRole } from "@/lib/authorization";
import { OPERATIONAL_WRITE_ROLES } from "@/lib/permissions";
import {
  academicYearCreateSchema,
  attendanceBulkSchema,
  classCreateSchema,
  studentClassAssignmentSchema,
  studentCreateSchema,
  teacherCreateSchema,
} from "@/lib/validations/eis";
import {
  academicYearService,
  attendanceService,
  classService,
  enrollmentService,
  studentService,
  teacherService,
} from "@/server/services/eis";

export type SchoolActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

async function writeContext() {
  const user = await requireRole(...OPERATIONAL_WRITE_ROLES);

  return { userId: user.id, role: user.role };
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

function optionalFormValue(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length > 0 ? value : undefined;
}

function parseInput<T>(
  schema: ZodType<T>,
  input: unknown,
): { data: T } | { state: SchoolActionState } {
  const result = schema.safeParse(input);

  if (!result.success) {
    const flattened = z.flattenError(result.error);
    const fieldErrors: Record<string, string[]> = {};

    for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
      if (Array.isArray(messages) && messages.length > 0) {
        fieldErrors[key] = messages.map(String);
      }
    }

    return {
      state: {
        status: "error",
        message: "Periksa kembali data yang diisi.",
        fieldErrors,
      },
    };
  }

  return { data: result.data };
}

function actionError(error: unknown): SchoolActionState {
  if (error instanceof ApiError) {
    return { status: "error", message: error.message };
  }

  console.error(error);

  return {
    status: "error",
    message: "Terjadi kesalahan saat menyimpan data. Silakan coba lagi.",
  };
}

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Terjadi kesalahan saat memproses data.";
}

function redirectWith(
  path: string,
  key: "message" | "error",
  message: string,
): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function saveAcademicYearAction(
  _state: SchoolActionState,
  formData: FormData,
): Promise<SchoolActionState> {
  const id = text(formData, "id");
  const parsed = parseInput(academicYearCreateSchema, {
    name: text(formData, "name"),
    startDate: text(formData, "startDate"),
    endDate: text(formData, "endDate"),
    isActive: formData.get("isActive") === "on",
  });

  if ("state" in parsed) {
    return parsed.state;
  }

  try {
    const context = await writeContext();

    if (id) {
      await academicYearService.update(context, id, parsed.data);
    } else {
      await academicYearService.create(context, parsed.data);
    }
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/academic-years");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: id
      ? "Tahun ajaran berhasil diperbarui."
      : "Tahun ajaran berhasil ditambahkan.",
  };
}

export async function setActiveAcademicYearAction(formData: FormData) {
  const id = text(formData, "id");

  try {
    const context = await writeContext();
    await academicYearService.update(context, id, { isActive: true });
  } catch (error) {
    redirectWith("/academic-years", "error", errorMessage(error));
  }

  revalidatePath("/academic-years");
  revalidatePath("/dashboard");
  redirectWith("/academic-years", "message", "Tahun ajaran diaktifkan.");
}

export async function deleteAcademicYearAction(formData: FormData) {
  const id = text(formData, "id");

  try {
    const context = await writeContext();
    await academicYearService.remove(context, id);
  } catch (error) {
    redirectWith("/academic-years", "error", errorMessage(error));
  }

  revalidatePath("/academic-years");
  redirectWith("/academic-years", "message", "Tahun ajaran dihapus.");
}

export async function saveClassAction(
  _state: SchoolActionState,
  formData: FormData,
): Promise<SchoolActionState> {
  const id = text(formData, "id");
  const parsed = parseInput(classCreateSchema, {
    name: text(formData, "name"),
    gradeLevel: text(formData, "gradeLevel"),
    academicYearId: text(formData, "academicYearId"),
    homeroomTeacherId: nullableText(formData, "homeroomTeacherId"),
    capacity: optionalFormValue(formData, "capacity"),
  });

  if ("state" in parsed) {
    return parsed.state;
  }

  try {
    const context = await writeContext();

    if (id) {
      await classService.update(context, id, parsed.data);
    } else {
      await classService.create(context, parsed.data);
    }
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/classes");
  revalidatePath("/students");
  revalidatePath("/attendance");

  return {
    status: "success",
    message: id ? "Kelas berhasil diperbarui." : "Kelas berhasil ditambahkan.",
  };
}

export async function deleteClassAction(formData: FormData) {
  const id = text(formData, "id");

  try {
    const context = await writeContext();
    await classService.remove(context, id);
  } catch (error) {
    redirectWith("/classes", "error", errorMessage(error));
  }

  revalidatePath("/classes");
  revalidatePath("/students");
  redirectWith("/classes", "message", "Kelas dihapus.");
}

export async function saveTeacherAction(
  _state: SchoolActionState,
  formData: FormData,
): Promise<SchoolActionState> {
  const id = text(formData, "id");
  const parsed = parseInput(teacherCreateSchema, {
    userId: nullableText(formData, "userId"),
    nip: text(formData, "nip"),
    fullName: text(formData, "fullName"),
    gender: text(formData, "gender"),
    phone: nullableText(formData, "phone"),
    address: nullableText(formData, "address"),
  });

  if ("state" in parsed) {
    return parsed.state;
  }

  try {
    const context = await writeContext();

    if (id) {
      await teacherService.update(context, id, parsed.data);
    } else {
      await teacherService.create(context, parsed.data);
    }
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/teachers");
  revalidatePath("/classes");

  return {
    status: "success",
    message: id
      ? "Data guru berhasil diperbarui."
      : "Data guru berhasil ditambahkan.",
  };
}

export async function deleteTeacherAction(formData: FormData) {
  const id = text(formData, "id");

  try {
    const context = await writeContext();
    await teacherService.remove(context, id);
  } catch (error) {
    redirectWith("/teachers", "error", errorMessage(error));
  }

  revalidatePath("/teachers");
  revalidatePath("/classes");
  redirectWith("/teachers", "message", "Data guru dihapus.");
}

export async function saveStudentAction(
  _state: SchoolActionState,
  formData: FormData,
): Promise<SchoolActionState> {
  const id = text(formData, "id");
  const birthDate = optionalFormValue(formData, "birthDate");
  const parsed = parseInput(studentCreateSchema, {
    userId: nullableText(formData, "userId"),
    nis: text(formData, "nis"),
    nisn: nullableText(formData, "nisn"),
    fullName: text(formData, "fullName"),
    gender: text(formData, "gender"),
    birthPlace: nullableText(formData, "birthPlace"),
    birthDate: birthDate ?? null,
    address: nullableText(formData, "address"),
    phone: nullableText(formData, "phone"),
    status: optionalFormValue(formData, "status"),
  });

  if ("state" in parsed) {
    return parsed.state;
  }

  try {
    const context = await writeContext();

    if (id) {
      await studentService.update(context, id, parsed.data);
    } else {
      await studentService.create(context, parsed.data);
    }
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/students");
  revalidatePath("/attendance");

  return {
    status: "success",
    message: id
      ? "Data siswa berhasil diperbarui."
      : "Data siswa berhasil ditambahkan.",
  };
}

export async function deleteStudentAction(formData: FormData) {
  const id = text(formData, "id");

  try {
    const context = await writeContext();
    await studentService.remove(context, id);
  } catch (error) {
    redirectWith("/students", "error", errorMessage(error));
  }

  revalidatePath("/students");
  revalidatePath("/attendance");
  redirectWith("/students", "message", "Data siswa dihapus.");
}

export async function assignStudentClassAction(
  _state: SchoolActionState,
  formData: FormData,
): Promise<SchoolActionState> {
  const parsed = parseInput(studentClassAssignmentSchema, {
    studentId: text(formData, "studentId"),
    academicYearId: text(formData, "academicYearId"),
    classId: text(formData, "classId"),
  });

  if ("state" in parsed) {
    return parsed.state;
  }

  try {
    const context = await writeContext();
    await enrollmentService.assignClass(context, parsed.data);
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/students");
  revalidatePath("/attendance");

  return {
    status: "success",
    message: "Kelas siswa berhasil disimpan.",
  };
}

export async function saveDailyAttendanceAction(
  _state: SchoolActionState,
  formData: FormData,
): Promise<SchoolActionState> {
  const studentIds = formData
    .getAll("studentId")
    .map((value) => String(value));

  const parsed = parseInput(attendanceBulkSchema, {
    classId: text(formData, "classId"),
    date: text(formData, "date"),
    entries: studentIds.map((studentId) => ({
      studentId,
      status: text(formData, `status_${studentId}`) || "HADIR",
      note: nullableText(formData, `note_${studentId}`),
    })),
  });

  if ("state" in parsed) {
    return parsed.state;
  }

  try {
    const context = await writeContext();
    const result = await attendanceService.saveDaily(context, parsed.data);

    revalidatePath("/attendance");

    return {
      status: "success",
      message: `Absensi ${result.saved} siswa berhasil disimpan.`,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteAttendanceAction(formData: FormData) {
  const id = text(formData, "id");

  try {
    const context = await writeContext();
    await attendanceService.remove(context, id);
  } catch (error) {
    redirectWith("/attendance", "error", errorMessage(error));
  }

  revalidatePath("/attendance");
  redirectWith("/attendance", "message", "Catatan absensi dihapus.");
}
