"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  fieldClassName,
  FormField,
  SchoolFormMessage,
} from "@/components/school/form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toDateInputValue } from "@/lib/date";
import {
  type OperationActionState,
  saveFacilityMaintenanceAction,
} from "@/server/actions/operations";

const initialState: OperationActionState = { status: "idle" };

type FacilityOption = {
  id: string;
  code: string;
  name: string;
  condition: string;
};

type MaintenanceRecord = {
  id: string;
  facilityId: string;
  description: string;
  scheduledDate: Date | null;
  completedDate: Date | null;
  cost: unknown;
  status: "DILAPORKAN" | "DIJADWALKAN" | "SELESAI";
};

export function MaintenanceForm({
  record,
  facilityOptions,
  defaultFacilityId,
}: {
  record?: MaintenanceRecord;
  facilityOptions: FacilityOption[];
  defaultFacilityId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    saveFacilityMaintenanceAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = Boolean(record);

  useEffect(() => {
    if (state.status === "success" && !isEdit) {
      formRef.current?.reset();
    }
  }, [state.status, isEdit]);

  const defaultScheduled = record?.scheduledDate
    ? toDateInputValue(new Date(record.scheduledDate))
    : undefined;

  const defaultCompleted = record?.completedDate
    ? toDateInputValue(new Date(record.completedDate))
    : undefined;

  const numericCost = record?.cost ? Number(record.cost) : undefined;
  const initialFacilityId = record?.facilityId ?? defaultFacilityId ?? "";

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      {record ? <input type="hidden" name="id" value={record.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Fasilitas"
          htmlFor="maintenance-facility"
          error={state.fieldErrors?.facilityId}
        >
          <select
            id="maintenance-facility"
            name="facilityId"
            className={fieldClassName}
            defaultValue={initialFacilityId}
            required
          >
            <option value="">Pilih Fasilitas</option>
            {facilityOptions.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.code}) - Kondisi: {fac.condition}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Status Pemeliharaan"
          htmlFor="maintenance-status"
          error={state.fieldErrors?.status}
        >
          <select
            id="maintenance-status"
            name="status"
            className={fieldClassName}
            defaultValue={record?.status ?? "DILAPORKAN"}
            required
          >
            <option value="DILAPORKAN">Dilaporkan (Perlu Tindak Lanjut)</option>
            <option value="DIJADWALKAN">Dijadwalkan (Dalam Proses)</option>
            <option value="SELESAI">Selesai (Perbaikan Tuntas)</option>
          </select>
        </FormField>
      </div>

      <FormField
        label="Deskripsi Masalah / Pekerjaan"
        htmlFor="maintenance-description"
        error={state.fieldErrors?.description}
      >
        <textarea
          id="maintenance-description"
          name="description"
          className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Rincian kerusakan atau jenis pemeliharaan yang diperlukan..."
          defaultValue={record?.description}
          required
          maxLength={1000}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          label="Jadwal Perbaikan"
          htmlFor="maintenance-scheduled"
          error={state.fieldErrors?.scheduledDate}
        >
          <Input
            id="maintenance-scheduled"
            name="scheduledDate"
            type="date"
            defaultValue={defaultScheduled}
          />
        </FormField>

        <FormField
          label="Tanggal Selesai"
          htmlFor="maintenance-completed"
          error={state.fieldErrors?.completedDate}
        >
          <Input
            id="maintenance-completed"
            name="completedDate"
            type="date"
            defaultValue={defaultCompleted}
          />
        </FormField>

        <FormField
          label="Biaya Perbaikan (Rp)"
          htmlFor="maintenance-cost"
          error={state.fieldErrors?.cost}
        >
          <Input
            id="maintenance-cost"
            name="cost"
            type="number"
            min={0}
            max={999999999999}
            step="any"
            placeholder="0"
            defaultValue={numericCost}
          />
        </FormField>
      </div>

      <SchoolFormMessage state={state} />

      <Button type="submit" disabled={pending} className="w-fit">
        {pending
          ? "Menyimpan..."
          : isEdit
            ? "Simpan perubahan"
            : "Catat pemeliharaan"}
      </Button>
    </form>
  );
}

