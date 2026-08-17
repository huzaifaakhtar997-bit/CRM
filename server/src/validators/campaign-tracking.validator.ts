import { z } from "zod";
import { CampaignRecipientStatus } from "@prisma/client";

// PATCH /api/v1/campaigns/:campaignId/recipients/:recipientId/status
export const updateRecipientStatusSchema = z.object({
  status: z.nativeEnum(CampaignRecipientStatus, {
    message: "Invalid recipient status value.",
  }),
});

export type UpdateRecipientStatusInput = z.infer<typeof updateRecipientStatusSchema>;
