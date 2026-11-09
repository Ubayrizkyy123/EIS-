import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Masukkan email yang valid." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "Password wajib diisi." }),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: "Password saat ini wajib diisi." }),
    newPassword: z
      .string()
      .min(8, { error: "Password baru minimal 8 karakter." })
      .max(72, { error: "Password baru maksimal 72 karakter." }),
    confirmPassword: z
      .string()
      .min(1, { error: "Konfirmasi password wajib diisi." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
