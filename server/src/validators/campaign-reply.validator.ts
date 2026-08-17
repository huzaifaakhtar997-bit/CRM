import { z } from "zod";

// POST /api/v1/campaigns/:campaignId/reply
export const campaignIncomingReplySchema = z.object({
  recipientEmail: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Invalid email address format")
    .toLowerCase(),
  subject: z.string().trim().min(1, "Subject is required"),
  content: z.string().trim().min(1, "Content is required"),
});

export type CampaignIncomingReplyInput = z.infer<typeof campaignIncomingReplySchema>;
