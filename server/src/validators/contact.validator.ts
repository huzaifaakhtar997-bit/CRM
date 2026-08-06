import { z } from "zod";
import { LifecycleStage, LeadSource } from "@prisma/client";

export const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").nullable().optional(),
  phone: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
  leadSource: z.nativeEnum(LeadSource).nullable().optional(),
  lifecycleStage: z.nativeEnum(LifecycleStage).optional().default(LifecycleStage.LEAD),
  status: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export const updateContactSchema = createContactSchema.partial();

export const queryContactSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  lifecycleStage: z.nativeEnum(LifecycleStage).optional(),
  assignedUserId: z.string().optional(),
  companyId: z.string().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type QueryContactInput = z.infer<typeof queryContactSchema>;
