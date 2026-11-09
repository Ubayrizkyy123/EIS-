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
  saveFinanceTransactionAction,
} from "@/server/actions/operations";

const initialState: OperationActionState = { status: "idle" };

type FinanceRecord = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  amount: unknown;
  transactionDate: Date;
};

export function FinanceForm({ record }: { record?: FinanceRecord }) {
  const [state, formAction, pending] = useActionState(
    saveFinanceTransactionAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = Boolean(record);

  useEffect(() => {
    if (state.status === "success" && !isEdit) {
      formRef.current?.reset();
    }
  }, [state.status, isEdit]);

  const defaultDate = record
    ? toDateInputValue(new Date(record.transactionDate))
    : toDateInputValue(new Date());

  const numericAmount = record ? Number(record.amount) : undefined;

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      {record ? <input type="hidden" name="id" value={record.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Tipe Transaksi"
          htmlFor="finance-type"
          error={state.fieldErrors?.type}
        >
          <select
            id="finance-type"
            name="type"
            className={fieldClassName}
            defaultValue={record?.type ?? "INCOME"}
            required
          >
            <option value="INCOME">Pemasukan (Income)</option>
            <option value="EXPENSE">Pengeluaran (Expense)</option>
          </select>
        </FormField>

        <FormField
          label="Kategori"
          htmlFor="finance-category"
          error={state.fieldErrors?.category}
        >
          <Input
            id="finance-category"
            name="category"
            placeholder="Misal: SPP, Donasi, Listrik, ATK"
            defaultValue={record?.category}
            required
            maxLength={80}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Jumlah (Rp)"
          htmlFor="finance-amount"
          error={state.fieldErrors?.amount}
        >
          <Input
            id="finance-amount"
            name="amount"
            type="number"
            min={1}
            max={999999999999}
            step="any"
            placeholder="1000000"
            defaultValue={numericAmount}
            required
          />
        </FormField>

        <FormField
          label="Tanggal Transaksi"
          htmlFor="finance-date"
          error={state.fieldErrors?.transactionDate}
        >
          <Input
            id="finance-date"
            name="transactionDate"
            type="date"
            defaultValue={defaultDate}
            required
          />
        </FormField>
      </div>

      <FormField
        label="Deskripsi / Keterangan"
        htmlFor="finance-description"
        error={state.fieldErrors?.description}
      >
        <textarea
          id="finance-description"
          name="description"
          className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Rincian keterangan transaksi..."
          defaultValue={record?.description}
          required
          maxLength={500}
        />
      </FormField>

      <SchoolFormMessage state={state} />

      <Button type="submit" disabled={pending} className="w-fit">
        {pending
          ? "Menyimpan..."
          : isEdit
            ? "Simpan perubahan"
            : "Catat transaksi"}
      </Button>
    </form>
  );
}

