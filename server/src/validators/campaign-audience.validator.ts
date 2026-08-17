import { z } from "zod";
import { LifecycleStage } from "@prisma/client";

// Filter criteria for audience preview and application
export const audienceFilterSchema = z.object({
  lifecycleStage: z.nativeEnum(LifecycleStage).optional(),
  companyId: z.string().optional(),
  assignedUserId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

// POST /api/v1/campaigns/:campaignId/audience/preview
export const previewAudienceSchema = z.object({
  filters: audienceFilterSchema,
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

// POST /api/v1/campaigns/:campaignId/audience/apply
export const applyAudienceSchema = z.object({
  filters: audienceFilterSchema,
});

// GET /api/v1/campaigns/:campaignId/audience query params
export const queryCampaignAudienceSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
});

export type PreviewAudienceInput = z.infer<typeof previewAudienceSchema>;
export type ApplyAudienceInput = z.infer<typeof applyAudienceSchema>;
export type QueryCampaignAudienceInput = z.infer<typeof queryCampaignAudienceSchema>;
