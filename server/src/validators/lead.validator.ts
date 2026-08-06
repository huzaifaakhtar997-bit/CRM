import { z } from "zod";
import { LeadStatus, LeadSource, LifecycleStage } from "@prisma/client";

export const createLeadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().nullable().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  source: z.nativeEnum(LeadSource).nullable().optional(),
  status: z.nativeEnum(LeadStatus).optional().default(LeadStatus.NEW),
  notes: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const queryLeadSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  assignedUserId: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type QueryLeadInput = z.infer<typeof queryLeadSchema>;
