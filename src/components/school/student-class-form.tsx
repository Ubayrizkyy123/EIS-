"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  fieldClassName,
  FormField,
  SchoolFormMessage,
} from "@/components/school/form-ui";
import {
  assignStudentClassAction,
  type SchoolActionState,
} from "@/server/actions/school";

const initialState: SchoolActionState = { status: "idle" };

type AcademicYearOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type ClassOption = {
  id: string;
  name: string;
  academicYearId: string;
  academicYear: { name: string; isActive: boolean };
};

export function StudentClassForm({
  studentId,
  academicYearOptions,
  classOptions,
  defaultAcademicYearId,
  defaultClassId,
}: {
  studentId: string;
  academicYearOptions: AcademicYearOption[];
  classOptions: ClassOption[];
  defaultAcademicYearId?: string;
  defaultClassId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    assignStudentClassAction,
    initialState,
  );
  const initialYearId =
    defaultAcademicYearId ??
    academicYearOptions.find((option) => option.isActive)?.id ??
    academicYearOptions[0]?.id ??
    "";
  const [academicYearId, setAcademicYearId] = useState(initialYearId);
  const filteredClasses = classOptions.filter(
    (option) => option.academicYearId === academicYearId,
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="academicYearId" value={academicYearId} />

      <FormField
        label="Tahun ajaran"
        htmlFor={`student-year-${studentId}`}
        error={state.fieldErrors?.academicYearId}
      >
        <select
          id={`student-year-${studentId}`}
          className={fieldClassName}
          value={academicYearId}
          onChange={(event) => setAcademicYearId(event.target.value)}
        >
          <option value="">Pilih tahun ajaran</option>
          {academicYearOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
              {option.isActive ? " (aktif)" : ""}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Kelas"
        htmlFor={`student-class-${studentId}`}
        error={state.fieldErrors?.classId}
      >
        <select
          id={`student-class-${studentId}`}
          name="classId"
          className={fieldClassName}
          defaultValue={defaultClassId}
          required
        >
          <option value="">Pilih kelas</option>
          {filteredClasses.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </FormField>

      <div className="sm:col-span-2">
        <SchoolFormMessage state={state} />
      </div>

      <Button type="submit" size="sm" disabled={pending} className="w-fit">
        {pending ? "Menyimpan..." : "Simpan kelas"}
      </Button>
    </form>
  );
}
