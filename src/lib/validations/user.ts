import { z } from "zod";

import { APP_ROLES } from "@/types/auth";

export const userRoleSchema = z.enum(APP_ROLES);

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Nama minimal 2 karakter." })
    .max(100, { error: "Nama maksimal 100 karakter." }),
  email: z.email({ error: "Masukkan email yang valid." }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: "Password minimal 8 karakter." })
    .max(72, { error: "Password maksimal 72 karakter." }),
  role: userRoleSchema,
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, { error: "Pengguna tidak valid." }),
  role: userRoleSchema,
});

export const toggleUserActiveSchema = z.object({
  userId: z.string().min(1, { error: "Pengguna tidak valid." }),
  isActive: z
    .enum(["true", "false"], { error: "Status akun tidak valid." })
    .transform((value) => value === "true"),
});

export const resetUserPasswordSchema = z.object({
  userId: z.string().min(1, { error: "Pengguna tidak valid." }),
  password: z
    .string()
    .min(8, { error: "Password minimal 8 karakter." })
    .max(72, { error: "Password maksimal 72 karakter." }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
