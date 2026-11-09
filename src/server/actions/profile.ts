"use server";

import { ApiError } from "@/lib/api-error";
import { requireUser } from "@/lib/authorization";
import { changePasswordSchema } from "@/lib/validations/auth";
import { profileService } from "@/server/composition";

export type PasswordActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function changePasswordAction(
  _prevState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const currentUser = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali password yang dimasukkan.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await profileService.changePassword(
      { userId: currentUser.id, role: currentUser.role },
      parsed.data,
    );
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === "INVALID_CURRENT_PASSWORD") {
        return {
          error: error.message,
          fieldErrors: {
            currentPassword: [error.message],
          },
        };
      }

      return { error: error.message };
    }

    console.error("changePasswordAction", error);

    return {
      error: "Password gagal diubah. Silakan coba lagi.",
    };
  }

  return {
    success: "Password berhasil diubah.",
  };
}
