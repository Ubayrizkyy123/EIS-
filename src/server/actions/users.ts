"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/authorization";
import {
  createUserSchema,
  resetUserPasswordSchema,
  toggleUserActiveSchema,
  updateUserRoleSchema,
} from "@/lib/validations/user";
import { usersService } from "@/server/composition";

export type UserActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function usersUrl(params: { message?: string; error?: string }) {
  const search = new URLSearchParams();

  if (params.message) {
    search.set("message", params.message);
  }

  if (params.error) {
    search.set("error", params.error);
  }

  return `/users${search.size ? `?${search.toString()}` : ""}`;
}

function revalidateUserViews() {
  revalidatePath("/users");
  revalidatePath("/activity-logs");
  revalidatePath("/admin");
}

export async function createUserAction(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const admin = await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data pengguna.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await usersService.create(
      { userId: admin.id, role: admin.role },
      parsed.data,
    );
  } catch (error) {
    if (error instanceof ApiError && error.code === "EMAIL_TAKEN") {
      return {
        error: "Email sudah digunakan.",
        fieldErrors: {
          email: ["Email sudah digunakan."],
        },
      };
    }

    console.error("createUserAction", error);

    return {
      error: "Pengguna gagal dibuat. Silakan coba lagi.",
    };
  }

  revalidateUserViews();

  return {
    success: `Pengguna ${parsed.data.email} berhasil dibuat.`,
  };
}

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = updateUserRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect(usersUrl({ error: "Data role tidak valid." }));
  }

  try {
    await usersService.updateRole(
      { userId: admin.id, role: admin.role },
      parsed.data,
    );
  } catch (error) {
    console.error("updateUserRoleAction", error);

    if (error instanceof ApiError) {
      redirect(usersUrl({ error: error.message }));
    }

    redirect(usersUrl({ error: "Role pengguna gagal diperbarui." }));
  }

  revalidateUserViews();
  redirect(usersUrl({ message: "Role pengguna berhasil diperbarui." }));
}

export async function toggleUserActiveAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = toggleUserActiveSchema.safeParse({
    userId: formData.get("userId"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    redirect(usersUrl({ error: "Status akun tidak valid." }));
  }

  try {
    await usersService.toggleActive(
      { userId: admin.id, role: admin.role },
      parsed.data,
    );
  } catch (error) {
    console.error("toggleUserActiveAction", error);

    if (error instanceof ApiError) {
      redirect(usersUrl({ error: error.message }));
    }

    redirect(usersUrl({ error: "Status pengguna gagal diperbarui." }));
  }

  revalidateUserViews();
  redirect(
    usersUrl({
      message: parsed.data.isActive
        ? "Akun pengguna berhasil diaktifkan."
        : "Akun pengguna berhasil dinonaktifkan.",
    }),
  );
}

export async function resetUserPasswordAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = resetUserPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(
      usersUrl({
        error: parsed.error.issues[0]?.message ?? "Password tidak valid.",
      }),
    );
  }

  try {
    await usersService.resetPassword(
      { userId: admin.id, role: admin.role },
      parsed.data,
    );
  } catch (error) {
    console.error("resetUserPasswordAction", error);
    redirect(usersUrl({ error: "Password pengguna gagal direset." }));
  }

  revalidateUserViews();
  redirect(usersUrl({ message: "Password pengguna berhasil direset." }));
}
