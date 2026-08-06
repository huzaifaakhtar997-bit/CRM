import { z } from "zod";
import { CampaignStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------
export const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(255, "Name must be 255 characters or fewer"),
  objective: z.string().max(1000, "Objective must be 1000 characters or fewer").nullable().optional(),
  subject: z.string().max(500, "Subject must be 500 characters or fewer").nullable().optional(),
  previewText: z.string().max(500, "Preview text must be 500 characters or fewer").nullable().optional(),
  content: z.string().nullable().optional(),
  scheduledAt: z
    .string()
    .datetime({ message: "scheduledAt must be a valid ISO 8601 datetime string" })
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
});

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------
export const updateCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name cannot be empty").max(255, "Name must be 255 characters or fewer").optional(),
  objective: z.string().max(1000, "Objective must be 1000 characters or fewer").nullable().optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  subject: z.string().max(500, "Subject must be 500 characters or fewer").nullable().optional(),
  previewText: z.string().max(500, "Preview text must be 500 characters or fewer").nullable().optional(),
  content: z.string().nullable().optional(),
  scheduledAt: z
    .string()
    .datetime({ message: "scheduledAt must be a valid ISO 8601 datetime string" })
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
});

// ---------------------------------------------------------------------------
// QUERY PARAMS
// ---------------------------------------------------------------------------
export const queryCampaignSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
});

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type QueryCampaignInput = z.infer<typeof queryCampaignSchema>;
