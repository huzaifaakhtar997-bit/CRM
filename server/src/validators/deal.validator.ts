import { z } from "zod";
import { Priority } from "@prisma/client";

export const createDealSchema = z.object({
  title: z.string().min(1, "Deal title is required"),
  value: z.number().nonnegative("Deal value must be 0 or greater").optional().default(0),
  currency: z.string().optional().default("USD"),
  probability: z.number().min(0).max(100).optional().default(0),
  expectedCloseDate: z.string().min(1, "Expected close date is required").transform((val) => new Date(val)),
  priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
  notes: z.string().nullable().optional(),
  lostReason: z.string().nullable().optional(),
  stageId: z.string().min(1, "Pipeline stage is required"),
  contactId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
});

export const updateDealSchema = z.object({
  title: z.string().min(1, "Deal title is required").optional(),
  value: z.number().nonnegative("Deal value must be 0 or greater").optional(),
  currency: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().transform((val) => new Date(val)).optional(),
  closedAt: z.string().transform((val) => new Date(val)).nullable().optional(),
  priority: z.nativeEnum(Priority).optional(),
  notes: z.string().nullable().optional(),
  lostReason: z.string().nullable().optional(),
  stageId: z.string().optional(),
  contactId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
});

export const queryDealSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  stageId: z.string().optional(),
  assignedUserId: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type QueryDealInput = z.infer<typeof queryDealSchema>;
