"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fieldClassName,
  FormField,
  SchoolFormMessage,
} from "@/components/school/form-ui";
import {
  saveClassAction,
  type SchoolActionState,
} from "@/server/actions/school";

const initialState: SchoolActionState = { status: "idle" };

type Option = {
  id: string;
  name: string;
};

type AcademicYearOption = Option & { isActive: boolean };

type ClassRecord = {
  id: string;
  name: string;
  gradeLevel: number;
  academicYearId: string;
  homeroomTeacherId: string | null;
  capacity: number;
};

export function ClassForm({
  record,
  academicYearOptions,
  teacherOptions,
}: {
  record?: ClassRecord;
  academicYearOptions: AcademicYearOption[];
  teacherOptions: Option[];
}) {
  const [state, formAction, pending] = useActionState(
    saveClassAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = Boolean(record);

  useEffect(() => {
    if (state.status === "success" && !isEdit) {
      formRef.current?.reset();
    }
  }, [state.status, isEdit]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      {record ? <input type="hidden" name="id" value={record.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <FormField
          label="Nama kelas"
          htmlFor="class-name"
          error={state.fieldErrors?.name}
        >
          <Input
            id="class-name"
            name="name"
            placeholder="X IPA 1"
            defaultValue={record?.name}
            required
            maxLength={30}
          />
        </FormField>

        <FormField
          label="Tingkat"
          htmlFor="class-grade"
          error={state.fieldErrors?.gradeLevel}
        >
          <Input
            id="class-grade"
            name="gradeLevel"
            type="number"
            min={1}
            max={12}
            defaultValue={record?.gradeLevel ?? 10}
            required
          />
        </FormField>
      </div>

      <FormField
        label="Tahun ajaran"
        htmlFor="class-academic-year"
        error={state.fieldErrors?.academicYearId}
      >
        <select
          id="class-academic-year"
          name="academicYearId"
          className={fieldClassName}
          defaultValue={record?.academicYearId}
          required
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

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Wali kelas"
          htmlFor="class-homeroom"
          error={state.fieldErrors?.homeroomTeacherId}
        >
          <select
            id="class-homeroom"
            name="homeroomTeacherId"
            className={fieldClassName}
            defaultValue={record?.homeroomTeacherId ?? ""}
          >
            <option value="">Belum ditentukan</option>
            {teacherOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Kapasitas"
          htmlFor="class-capacity"
          error={state.fieldErrors?.capacity}
        >
          <Input
            id="class-capacity"
            name="capacity"
            type="number"
            min={1}
            max={200}
            defaultValue={record?.capacity ?? 30}
          />
        </FormField>
      </div>

      <SchoolFormMessage state={state} />

      <Button type="submit" disabled={pending} className="w-fit">
        {pending
          ? "Menyimpan..."
          : isEdit
            ? "Simpan perubahan"
            : "Tambah kelas"}
      </Button>
    </form>
  );
}
