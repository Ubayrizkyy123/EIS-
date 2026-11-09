"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, SchoolFormMessage } from "@/components/school/form-ui";
import { toDateInputValue } from "@/lib/date";
import {
  saveAcademicYearAction,
  type SchoolActionState,
} from "@/server/actions/school";

const initialState: SchoolActionState = { status: "idle" };

type AcademicYearRecord = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
};

export function AcademicYearForm({
  record,
}: {
  record?: AcademicYearRecord;
}) {
  const [state, formAction, pending] = useActionState(
    saveAcademicYearAction,
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

      <FormField
        label="Nama tahun ajaran"
        htmlFor="academic-year-name"
        error={state.fieldErrors?.name}
      >
        <Input
          id="academic-year-name"
          name="name"
          placeholder="2026/2027"
          defaultValue={record?.name}
          required
          maxLength={20}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Tanggal mulai"
          htmlFor="academic-year-start"
          error={state.fieldErrors?.startDate}
        >
          <Input
            id="academic-year-start"
            name="startDate"
            type="date"
            defaultValue={
              record ? toDateInputValue(record.startDate) : undefined
            }
            required
          />
        </FormField>

        <FormField
          label="Tanggal selesai"
          htmlFor="academic-year-end"
          error={state.fieldErrors?.endDate}
        >
          <Input
            id="academic-year-end"
            name="endDate"
            type="date"
            defaultValue={record ? toDateInputValue(record.endDate) : undefined}
            required
          />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={record?.isActive}
          className="size-4 rounded border-input"
        />
        Jadikan tahun ajaran aktif
      </label>

      <SchoolFormMessage state={state} />

      <Button type="submit" disabled={pending} className="w-fit">
        {pending
          ? "Menyimpan..."
          : isEdit
            ? "Simpan perubahan"
            : "Tambah tahun ajaran"}
      </Button>
    </form>
  );
}
