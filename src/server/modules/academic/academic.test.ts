import assert from "node:assert/strict";
import test from "node:test";

import { ApiError } from "@/lib/api-error";
import type { ServiceContext } from "@/server/modules/shared/context";
import {
  createAcademicServices,
  type AcademicDb,
} from "@/server/modules/academic";

type Row = Record<string, unknown>;

const context: ServiceContext = {
  userId: "admin-1",
  role: "ADMIN",
};

function isNotFilter(value: unknown): value is { not: unknown } {
  return typeof value === "object" && value !== null && "not" in value;
}

function matches(row: Row, where?: Row) {
  if (!where) {
    return true;
  }

  return Object.entries(where).every(([key, expected]) => {
    if (isNotFilter(expected)) {
      return row[key] !== expected.not;
    }

    return row[key] === expected;
  });
}

function countBy(rows: Row[], field: string, id: string) {
  return rows.filter((row) => row[field] === id).length;
}

function createFakeDb() {
  const academicYears: Row[] = [];
  const classes: Row[] = [];
  const subjects: Row[] = [];
  const teachers: Row[] = [];
  const enrollments: Row[] = [];
  const attendances: Row[] = [];
  const grades: Row[] = [];
  const schedules: Row[] = [];
  const teachingAssignments: Row[] = [];
  let sequence = 0;

  function nextId(prefix: string) {
    sequence += 1;
    return `${prefix}-${sequence}`;
  }

  function createDelegate(rows: Row[], prefix: string, counts: (id: string) => Row) {
    return {
      findMany: async () =>
        rows.map((row) => ({ ...row, _count: counts(String(row.id)) })),
      count: async ({ where }: { where?: Row } = {}) =>
        rows.filter((row) => matches(row, where)).length,
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = rows.find((candidate) => candidate.id === where.id);
        return row ? { ...row, _count: counts(String(row.id)) } : null;
      },
      create: async ({ data }: { data: Row }) => {
        const row = { id: nextId(prefix), ...data };
        rows.push(row);
        return { ...row, _count: counts(String(row.id)) };
      },
      update: async ({ where, data }: { where: { id: string }; data: Row }) => {
        const row = rows.find((candidate) => candidate.id === where.id);

        if (!row) {
          throw new Error(`Missing row ${where.id}`);
        }

        Object.assign(row, data);
        return { ...row, _count: counts(String(row.id)) };
      },
      updateMany: async ({ where, data }: { where: Row; data: Row }) => {
        const matched = rows.filter((row) => matches(row, where));
        matched.forEach((row) => Object.assign(row, data));
        return { count: matched.length };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const index = rows.findIndex((row) => row.id === where.id);
        const [row] = rows.splice(index, 1);
        return row;
      },
    };
  }

  const delegates = {
    academicYear: createDelegate(academicYears, "year", (id) => ({
      classes: countBy(classes, "academicYearId", id),
      enrollments: countBy(enrollments, "academicYearId", id),
      grades: countBy(grades, "academicYearId", id),
      teachingAssignments: countBy(teachingAssignments, "academicYearId", id),
    })),
    schoolClass: createDelegate(classes, "class", (id) => ({
      enrollments: countBy(enrollments, "classId", id),
      attendances: countBy(attendances, "classId", id),
      grades: countBy(grades, "classId", id),
      schedules: countBy(schedules, "classId", id),
      teachingAssignments: countBy(teachingAssignments, "classId", id),
    })),
    subject: createDelegate(subjects, "subject", (id) => ({
      schedules: countBy(schedules, "subjectId", id),
      grades: countBy(grades, "subjectId", id),
      teachingAssignments: countBy(teachingAssignments, "subjectId", id),
    })),
    teacher: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        teachers.find((row) => row.id === where.id) ?? null,
    },
  };

  const db = {
    ...delegates,
    $transaction: async <T>(fn: (tx: typeof delegates) => Promise<T>) =>
      fn(delegates),
  };

  return {
    db: db as unknown as AcademicDb,
    state: {
      academicYears,
      classes,
      subjects,
      teachers,
      enrollments,
      attendances,
      grades,
      schedules,
      teachingAssignments,
    },
  };
}

function createServices() {
  const fake = createFakeDb();
  const logs: Row[] = [];
  const services = createAcademicServices({
    db: fake.db,
    log: async (entry) => {
      logs.push(entry as unknown as Row);
    },
  });

  return { ...fake, logs, ...services };
}

function hasCode(code: string, status: number) {
  return (error: unknown) =>
    error instanceof ApiError && error.code === code && error.status === status;
}

test("activating a new academic year deactivates the previous active year", async () => {
  const { academicYearService, state, logs } = createServices();
  state.academicYears.push({
    id: "year-1",
    name: "2025/2026",
    startDate: new Date("2025-07-01"),
    endDate: new Date("2026-06-30"),
    isActive: true,
  });

  const created = await academicYearService.create(context, {
    name: "2026/2027",
    startDate: new Date("2026-07-01"),
    endDate: new Date("2027-06-30"),
    isActive: true,
  });

  assert.equal(created.isActive, true);
  assert.equal(state.academicYears[0].isActive, false);
  assert.equal(logs.at(-1)?.action, "CREATE");
});

test("academic year update rejects a start date after the end date", async () => {
  const { academicYearService, state } = createServices();
  state.academicYears.push({
    id: "year-1",
    startDate: new Date("2025-07-01"),
    endDate: new Date("2026-06-30"),
    isActive: false,
  });

  await assert.rejects(
    () =>
      academicYearService.update(context, "year-1", {
        startDate: new Date("2026-08-01"),
      }),
    hasCode("INVALID_DATE_RANGE", 422),
  );
});

test("academic year deletion rejects the active year and years with relations", async () => {
  const { academicYearService, state } = createServices();
  state.academicYears.push({
    id: "year-active",
    isActive: true,
  });
  state.academicYears.push({
    id: "year-used",
    isActive: false,
  });
  state.classes.push({
    id: "class-1",
    academicYearId: "year-used",
  });

  await assert.rejects(
    () => academicYearService.remove(context, "year-active"),
    hasCode("ACTIVE_YEAR", 409),
  );
  await assert.rejects(
    () => academicYearService.remove(context, "year-used"),
    hasCode("RELATION_CONFLICT", 409),
  );
});

test("class creation validates the academic year and homeroom teacher", async () => {
  const { classService, state } = createServices();

  await assert.rejects(
    () =>
      classService.create(context, {
        name: "7A",
        gradeLevel: 7,
        academicYearId: "missing-year",
      }),
    hasCode("INVALID_ACADEMIC_YEAR", 422),
  );

  state.academicYears.push({ id: "year-1" });
  await assert.rejects(
    () =>
      classService.create(context, {
        name: "7A",
        gradeLevel: 7,
        academicYearId: "year-1",
        homeroomTeacherId: "missing-teacher",
      }),
    hasCode("INVALID_TEACHER", 422),
  );

  state.teachers.push({ id: "teacher-1" });
  const created = await classService.create(context, {
    name: "7A",
    gradeLevel: 7,
    academicYearId: "year-1",
    homeroomTeacherId: "teacher-1",
  });

  assert.equal(created.name, "7A");
  assert.equal(created.capacity, 30);
});

test("class update rejects capacity below enrollment and year changes with enrollments", async () => {
  const { classService, state } = createServices();
  state.academicYears.push({ id: "year-1" });
  state.academicYears.push({ id: "year-2" });
  state.classes.push({
    id: "class-1",
    name: "7A",
    academicYearId: "year-1",
    homeroomTeacherId: null,
    capacity: 30,
  });
  state.enrollments.push({ id: "enrollment-1", classId: "class-1" });
  state.enrollments.push({ id: "enrollment-2", classId: "class-1" });

  await assert.rejects(
    () => classService.update(context, "class-1", { capacity: 1 }),
    hasCode("CAPACITY_TOO_SMALL", 422),
  );
  await assert.rejects(
    () => classService.update(context, "class-1", { academicYearId: "year-2" }),
    hasCode("CLASS_HAS_ENROLLMENTS", 409),
  );
});

test("class deletion rejects classes that still have relations", async () => {
  const { classService, state } = createServices();
  state.classes.push({ id: "class-1", name: "7A" });
  state.schedules.push({ id: "schedule-1", classId: "class-1" });

  await assert.rejects(
    () => classService.remove(context, "class-1"),
    hasCode("RELATION_CONFLICT", 409),
  );
});

test("subject deletion rejects schedules, grades, and teaching assignments", async () => {
  const { subjectService, state } = createServices();
  state.subjects.push({ id: "subject-1", code: "MTK", name: "Matematika" });
  state.schedules.push({ id: "schedule-1", subjectId: "subject-1" });
  state.grades.push({ id: "grade-1", subjectId: "subject-1" });
  state.teachingAssignments.push({
    id: "assignment-1",
    subjectId: "subject-1",
  });

  await assert.rejects(
    () => subjectService.remove(context, "subject-1"),
    hasCode("RELATION_CONFLICT", 409),
  );
});

test("subject deletion removes an unused subject and writes an audit entry", async () => {
  const { subjectService, state, logs } = createServices();
  state.subjects.push({ id: "subject-1", code: "MTK", name: "Matematika" });

  await subjectService.remove(context, "subject-1");

  assert.equal(state.subjects.length, 0);
  assert.equal(logs.at(-1)?.action, "DELETE");
  assert.equal(logs.at(-1)?.entityType, "Subject");
});
