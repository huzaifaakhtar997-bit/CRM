import { z } from "zod";
import { UserRole, UserStatus } from "@prisma/client";

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().url("Must be a valid URL").nullable().optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(UserStatus, {
    message: "Invalid user status. Valid values: ACTIVE, INACTIVE",
  }),
});

export const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole, {
    message: "Invalid user role. Valid values: ADMIN, MANAGER, SALES_REP, MARKETING, SUPPORT",
  }),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
