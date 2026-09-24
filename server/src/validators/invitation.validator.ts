import { z } from "zod";
import { UserRole } from "@prisma/client";

export const createInvitationSchema = z.object({
  email: z.string().email("Invalid email address format").transform((val) => val.trim().toLowerCase()),
  role: z.nativeEnum(UserRole).default(UserRole.SALES_REP),
});

export const registerWithInviteSchema = z.object({
  token: z.string().min(16, "Invalid or missing invitation token"),
  name: z.string().min(2, "Name must be at least 2 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  phone: z.string().optional(),
  avatarUrl: z.string().url("Avatar URL must be a valid URL").optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type RegisterWithInviteInput = z.infer<typeof registerWithInviteSchema>;
