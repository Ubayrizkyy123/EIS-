"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  fieldClassName,
  FormField,
  SchoolFormMessage,
} from "@/components/school/form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type OperationActionState,
  saveFacilityAction,
} from "@/server/actions/operations";

const initialState: OperationActionState = { status: "idle" };

type FacilityRecord = {
  id: string;
  code: string;
  name: string;
  location: string | null;
  condition: "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT";
  notes: string | null;
};

export function FacilityForm({ record }: { record?: FacilityRecord }) {
  const [state, formAction, pending] = useActionState(
    saveFacilityAction,
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
          label="Kode Fasilitas"
          htmlFor="facility-code"
          error={state.fieldErrors?.code}
        >
          <Input
            id="facility-code"
            name="code"
            placeholder="Misal: LAB-IPA-1, R-7A"
            defaultValue={record?.code}
            required
            maxLength={30}
            className="uppercase"
          />
        </FormField>

        <FormField
          label="Nama Fasilitas"
          htmlFor="facility-name"
          error={state.fieldErrors?.name}
        >
          <Input
            id="facility-name"
            name="name"
            placeholder="Misal: Ruang Lab Komputer 1"
            defaultValue={record?.name}
            required
            maxLength={120}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Lokasi"
          htmlFor="facility-location"
          error={state.fieldErrors?.location}
        >
          <Input
            id="facility-location"
            name="location"
            placeholder="Misal: Gedung A Lantai 2"
            defaultValue={record?.location ?? undefined}
            maxLength={120}
          />
        </FormField>

        <FormField
          label="Kondisi Fisik"
          htmlFor="facility-condition"
          error={state.fieldErrors?.condition}
        >
          <select
            id="facility-condition"
            name="condition"
            className={fieldClassName}
            defaultValue={record?.condition ?? "BAIK"}
            required
          >
            <option value="BAIK">Baik</option>
            <option value="RUSAK_RINGAN">Rusak Ringan</option>
            <option value="RUSAK_BERAT">Rusak Berat (Memicu Alert Pimpinan)</option>
          </select>
        </FormField>
      </div>

      <FormField
        label="Catatan Tambahan"
        htmlFor="facility-notes"
        error={state.fieldErrors?.notes}
      >
        <textarea
          id="facility-notes"
          name="notes"
          className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Catatan inventaris, kelengkapan alat, atau spesifikasi..."
          defaultValue={record?.notes ?? undefined}
          maxLength={1000}
        />
      </FormField>

      <SchoolFormMessage state={state} />

      <Button type="submit" disabled={pending} className="w-fit">
        {pending
          ? "Menyimpan..."
          : isEdit
            ? "Simpan perubahan"
            : "Tambah fasilitas"}
      </Button>
    </form>
  );
}

