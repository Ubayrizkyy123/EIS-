"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Email atau password tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          error.type === "CredentialsSignin"
            ? "Email atau password salah, atau akun tidak aktif."
            : "Gagal masuk. Silakan coba lagi.",
      };
    }

    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
