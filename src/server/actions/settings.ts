"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ApiError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/authorization";
import { settingsService } from "@/server/composition";

export type SettingsActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const systemSettingsSchema = z.object({
  school_name: z
    .string()
    .trim()
    .min(2, { error: "Nama sekolah minimal 2 karakter." })
    .max(120, { error: "Nama sekolah maksimal 120 karakter." }),
  school_address: z
    .string()
    .trim()
    .max(255, { error: "Alamat maksimal 255 karakter." }),
  school_phone: z
    .string()
    .trim()
    .max(30, { error: "Telepon maksimal 30 karakter." }),
  school_email: z
    .email({ error: "Masukkan email sekolah yang valid." })
    .trim()
    .toLowerCase()
    .or(z.literal("")),
});

export async function updateSystemSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const admin = await requireAdmin();

  const parsed = systemSettingsSchema.safeParse({
    school_name: formData.get("school_name"),
    school_address: formData.get("school_address"),
    school_phone: formData.get("school_phone"),
    school_email: formData.get("school_email"),
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali pengaturan sistem.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await settingsService.update(
      { userId: admin.id, role: admin.role },
      parsed.data,
    );
  } catch (error) {
    console.error("updateSystemSettingsAction", error);

    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Pengaturan sistem gagal disimpan. Silakan coba lagi.",
    };
  }

  revalidatePath("/settings/system");
  revalidatePath("/settings");
  revalidatePath("/activity-logs");

  return { success: "Pengaturan sistem berhasil disimpan." };
}
