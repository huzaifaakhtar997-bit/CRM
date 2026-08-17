import { z } from "zod";

// POST /api/v1/integrations/hubspot/connect
export const connectHubspotSchema = z.object({
  accessToken: z.string().trim().min(1, "Access token / Private App Token is required"),
});

export type ConnectHubspotInput = z.infer<typeof connectHubspotSchema>;
