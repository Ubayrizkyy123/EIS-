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
  saveTeacherAction,
  type SchoolActionState,
} from "@/server/actions/school";

const initialState: SchoolActionState = { status: "idle" };

type UserOption = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

type TeacherRecord = {
  id: string;
  userId: string | null;
  nip: string;
  fullName: string;
  gender: "LAKI_LAKI" | "PEREMPUAN";
  phone: string | null;
  address: string | null;
};

export function TeacherForm({
  record,
  userOptions,
}: {
  record?: TeacherRecord;
  userOptions: UserOption[];
}) {
  const [state, formAction, pending] = useActionState(
    saveTeacherAction,
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
          label="NIP"
          htmlFor="teacher-nip"
          error={state.fieldErrors?.nip}
        >
          <Input
            id="teacher-nip"
            name="nip"
            defaultValue={record?.nip}
            required
            maxLength={30}
          />
        </FormField>

        <FormField
          label="Nama lengkap"
          htmlFor="teacher-name"
          error={state.fieldErrors?.fullName}
        >
          <Input
            id="teacher-name"
            name="fullName"
            defaultValue={record?.fullName}
            required
            maxLength={120}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Jenis kelamin"
          htmlFor="teacher-gender"
          error={state.fieldErrors?.gender}
        >
          <select
            id="teacher-gender"
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
          label="Nomor telepon"
          htmlFor="teacher-phone"
          error={state.fieldErrors?.phone}
        >
          <Input
            id="teacher-phone"
            name="phone"
            type="tel"
            defaultValue={record?.phone ?? undefined}
            maxLength={30}
          />
        </FormField>
      </div>

      <FormField
        label="Akun pengguna"
        htmlFor="teacher-user"
        error={state.fieldErrors?.userId}
      >
        <select
          id="teacher-user"
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

      <FormField
        label="Alamat"
        htmlFor="teacher-address"
        error={state.fieldErrors?.address}
      >
        <textarea
          id="teacher-address"
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
            : "Tambah guru"}
      </Button>
    </form>
  );
}
