import { z } from "zod";

// POST /api/v1/campaigns/:campaignId/test-send
export const campaignTestSendSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Invalid email address format")
    .toLowerCase(),
});

export type CampaignTestSendInput = z.infer<typeof campaignTestSendSchema>;
