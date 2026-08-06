import { z } from "zod";
import { UserRole } from "@prisma/client";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.nativeEnum(UserRole).optional().default(UserRole.SALES_REP),
  phone: z.string().optional(),
  avatarUrl: z.string().url("Avatar URL must be a valid URL").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address format"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
