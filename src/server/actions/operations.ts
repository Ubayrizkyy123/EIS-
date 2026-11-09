"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z, type ZodType } from "zod";

import { ApiError } from "@/lib/api-error";
import { requireRole } from "@/lib/authorization";
import { OPERATIONAL_WRITE_ROLES } from "@/lib/permissions";
import {
  facilityCreateSchema,
  financeCreateSchema,
  maintenanceCreateSchema,
} from "@/lib/validations/eis";
import {
  facilityService,
  financeService,
  maintenanceService,
} from "@/server/services/eis";

export type OperationActionState = {
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
): { data: T } | { state: OperationActionState } {
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

function actionError(error: unknown): OperationActionState {
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

// ---------------------------------------------------------------------------
// 1. TRANSAKSI KEUANGAN (FINANCE TRANSACTIONS)
// ---------------------------------------------------------------------------

export async function saveFinanceTransactionAction(
  _state: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  const id = text(formData, "id");
  const rawAmount = text(formData, "amount");
  const parsed = parseInput(financeCreateSchema, {
    type: text(formData, "type"),
    category: text(formData, "category"),
    description: text(formData, "description"),
    amount: rawAmount ? Number(rawAmount) : 0,
    transactionDate: text(formData, "transactionDate"),
  });

  if ("state" in parsed) {
    return parsed.state;
  }

  try {
    const context = await writeContext();

    if (id) {
      await financeService.update(context, id, parsed.data);
    } else {
      await financeService.create(context, parsed.data);
    }
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  revalidatePath("/executive");
  revalidatePath("/operator");

  return {
    status: "success",
    message: id
      ? "Transaksi keuangan berhasil diperbarui."
      : "Transaksi keuangan berhasil dicatat.",
  };
}

export async function voidFinanceTransactionAction(formData: FormData) {
  const id = text(formData, "id");
  const reason = text(formData, "reason") || "Dibatalkan oleh operator";

  try {
    const context = await writeContext();
    await financeService.void(context, id, reason);
  } catch (error) {
    redirectWith("/finance", "error", errorMessage(error));
  }

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  revalidatePath("/executive");
  revalidatePath("/operator");
  redirectWith("/finance", "message", "Transaksi berhasil di-void (dibatalkan).");
}

// ---------------------------------------------------------------------------
// 2. FASILITAS (FACILITIES)
// ---------------------------------------------------------------------------

export async function saveFacilityAction(
  _state: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  const id = text(formData, "id");
  const parsed = parseInput(facilityCreateSchema, {
    code: text(formData, "code").toUpperCase(),
    name: text(formData, "name"),
    location: nullableText(formData, "location"),
    condition: optionalFormValue(formData, "condition"),
    notes: nullableText(formData, "notes"),
  });

  if ("state" in parsed) {
    return parsed.state;
  }

  try {
    const context = await writeContext();

    if (id) {
      await facilityService.update(context, id, parsed.data);
    } else {
      await facilityService.create(context, parsed.data);
    }
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/facilities");
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  revalidatePath("/executive");
  revalidatePath("/operator");

  return {
    status: "success",
    message: id
      ? "Data fasilitas berhasil diperbarui."
      : "Data fasilitas berhasil ditambahkan.",
  };
}

export async function deleteFacilityAction(formData: FormData) {
  const id = text(formData, "id");

  try {
    const context = await writeContext();
    await facilityService.remove(context, id);
  } catch (error) {
    redirectWith("/facilities", "error", errorMessage(error));
  }

  revalidatePath("/facilities");
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  redirectWith("/facilities", "message", "Data fasilitas berhasil dihapus.");
}

// ---------------------------------------------------------------------------
// 3. PEMELIHARAAN FASILITAS (FACILITY MAINTENANCE)
// ---------------------------------------------------------------------------

export async function saveFacilityMaintenanceAction(
  _state: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  const id = text(formData, "id");
  const scheduledDate = optionalFormValue(formData, "scheduledDate");
  const completedDate = optionalFormValue(formData, "completedDate");
  const rawCost = text(formData, "cost");

  const parsed = parseInput(maintenanceCreateSchema, {
    facilityId: text(formData, "facilityId"),
    description: text(formData, "description"),
    scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
    completedDate: completedDate ? new Date(completedDate) : null,
    cost: rawCost ? Number(rawCost) : null,
    status: optionalFormValue(formData, "status"),
  });

  if ("state" in parsed) {
    return parsed.state;
  }

  try {
    const context = await writeContext();

    if (id) {
      await maintenanceService.update(context, id, parsed.data);
    } else {
      await maintenanceService.create(context, parsed.data);
    }
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/maintenance");
  revalidatePath("/facilities");
  revalidatePath("/dashboard");
  revalidatePath("/executive");
  revalidatePath("/operator");

  return {
    status: "success",
    message: id
      ? "Catatan pemeliharaan berhasil diperbarui."
      : "Catatan pemeliharaan berhasil ditambahkan.",
  };
}

export async function deleteFacilityMaintenanceAction(formData: FormData) {
  const id = text(formData, "id");

  try {
    const context = await writeContext();
    await maintenanceService.remove(context, id);
  } catch (error) {
    redirectWith("/maintenance", "error", errorMessage(error));
  }

  revalidatePath("/maintenance");
  revalidatePath("/facilities");
  revalidatePath("/dashboard");
  redirectWith("/maintenance", "message", "Catatan pemeliharaan berhasil dihapus.");
}

