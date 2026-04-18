import { z } from "zod";

export const adminCreateSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name wajib diisi")
    .max(50, "First name maksimal 50 karakter")
    .regex(/^[a-zA-Z\s]+$/, "First name hanya boleh berisi huruf"),

  lastName: z
    .string()
    .min(1, "Last name wajib diisi")
    .max(50, "Last name maksimal 50 karakter")
    .regex(/^[a-zA-Z\s]+$/, "Last name hanya boleh berisi huruf"),

  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid (contoh: user@mail.com)"),

  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password maksimal 100 karakter"),

  role: z
    .number({ required_error: "Role wajib dipilih" })
    .int()
    .positive("Role tidak valid"),

  permissions: z.array(z.string()).optional(),
});

export const adminEditSchema = adminCreateSchema
  .omit({ password: true })
  .extend({
    password: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.trim().length === 0 || val.trim().length >= 6,
        { message: "Password minimal 6 karakter" },
      ),
  });

export type AdminCreateInput = z.infer<typeof adminCreateSchema>;
export type AdminEditInput = z.infer<typeof adminEditSchema>;
