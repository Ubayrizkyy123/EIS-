"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fieldClassName,
  FormField,
  SchoolFormMessage,
} from "@/components/school/form-ui";
import { toDateInputValue } from "@/lib/date";
import {
  saveStudentAction,
  type SchoolActionState,
} from "@/server/actions/school";

const initialState: SchoolActionState = { status: "idle" };

type UserOption = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

type StudentRecord = {
  id: string;
  userId: string | null;
  nis: string;
  nisn: string | null;
  fullName: string;
  gender: "LAKI_LAKI" | "PEREMPUAN";
  birthPlace: string | null;
  birthDate: Date | null;
  address: string | null;
  phone: string | null;
  status: "AKTIF" | "LULUS" | "PINDAH" | "KELUAR";
};

export function StudentForm({
  record,
  userOptions,
}: {
  record?: StudentRecord;
  userOptions: UserOption[];
}) {
  const [state, formAction, pending] = useActionState(
    saveStudentAction,
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

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="NIS"
          htmlFor="student-nis"
          error={state.fieldErrors?.nis}
        >
          <Input
            id="student-nis"
            name="nis"
            defaultValue={record?.nis}
            required
            maxLength={30}
          />
        </FormField>

        <FormField
          label="NISN"
          htmlFor="student-nisn"
          error={state.fieldErrors?.nisn}
        >
          <Input
            id="student-nisn"
            name="nisn"
            defaultValue={record?.nisn ?? undefined}
            maxLength={30}
          />
        </FormField>
      </div>

      <FormField
        label="Nama lengkap"
        htmlFor="student-name"
        error={state.fieldErrors?.fullName}
      >
        <Input
          id="student-name"
          name="fullName"
          defaultValue={record?.fullName}
          required
          maxLength={120}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Jenis kelamin"
          htmlFor="student-gender"
          error={state.fieldErrors?.gender}
        >
          <select
            id="student-gender"
            name="gender"
            className={fieldClassName}
            defaultValue={record?.gender ?? "LAKI_LAKI"}
            required
          >
            <option value="LAKI_LAKI">Laki-laki</option>
            <option value="PEREMPUAN">Perempuan</option>
          </select>
        </FormField>

        <FormField
          label="Status"
          htmlFor="student-status"
          error={state.fieldErrors?.status}
        >
          <select
            id="student-status"
            name="status"
            className={fieldClassName}
            defaultValue={record?.status ?? "AKTIF"}
          >
            <option value="AKTIF">Aktif</option>
            <option value="LULUS">Lulus</option>
            <option value="PINDAH">Pindah</option>
            <option value="KELUAR">Keluar</option>
          </select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Tempat lahir"
          htmlFor="student-birth-place"
          error={state.fieldErrors?.birthPlace}
        >
          <Input
            id="student-birth-place"
            name="birthPlace"
            defaultValue={record?.birthPlace ?? undefined}
            maxLength={100}
          />
        </FormField>

        <FormField
          label="Tanggal lahir"
          htmlFor="student-birth-date"
          error={state.fieldErrors?.birthDate}
        >
          <Input
            id="student-birth-date"
            name="birthDate"
            type="date"
            defaultValue={
              record?.birthDate ? toDateInputValue(record.birthDate) : undefined
            }
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nomor telepon"
          htmlFor="student-phone"
          error={state.fieldErrors?.phone}
        >
          <Input
            id="student-phone"
            name="phone"
            type="tel"
            defaultValue={record?.phone ?? undefined}
            maxLength={30}
          />
        </FormField>

        <FormField
          label="Akun pengguna"
          htmlFor="student-user"
          error={state.fieldErrors?.userId}
        >
          <select
            id="student-user"
            name="userId"
            className={fieldClassName}
            defaultValue={record?.userId ?? ""}
          >
            <option value="">Tidak ditautkan</option>
            {userOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name ?? option.email} ({option.email})
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField
        label="Alamat"
        htmlFor="student-address"
        error={state.fieldErrors?.address}
      >
        <textarea
          id="student-address"
          name="address"
          className={`${fieldClassName} min-h-20 py-2`}
          defaultValue={record?.address ?? undefined}
          maxLength={1000}
        />
      </FormField>

      <SchoolFormMessage state={state} />

      <Button type="submit" disabled={pending} className="w-fit">
        {pending
          ? "Menyimpan..."
          : isEdit
            ? "Simpan perubahan"
            : "Tambah siswa"}
      </Button>
    </form>
  );
}
