import { z } from "zod";
import { CampaignRecipientStatus } from "@prisma/client";

// POST /api/v1/campaigns/:campaignId/recipients
export const addRecipientSchema = z.object({
  contactId: z.string().min(1, "Contact ID is required"),
});

// POST /api/v1/campaigns/:campaignId/recipients/bulk
export const bulkAddRecipientsSchema = z.object({
  contactIds: z
    .array(z.string().min(1, "Contact ID cannot be empty"))
    .min(1, "At least one contact ID is required")
    .refine((items) => new Set(items).size === items.length, {
      message: "Duplicate contact IDs in the request body are not allowed",
    }),
});

// GET /api/v1/campaigns/:campaignId/recipients query params
export const queryCampaignRecipientSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  status: z.nativeEnum(CampaignRecipientStatus).optional(),
});

export type AddRecipientInput = z.infer<typeof addRecipientSchema>;
export type BulkAddRecipientsInput = z.infer<typeof bulkAddRecipientsSchema>;
export type QueryCampaignRecipientInput = z.infer<typeof queryCampaignRecipientSchema>;
