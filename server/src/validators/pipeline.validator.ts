import { z } from "zod";

export const moveDealStageSchema = z.object({
  stageId: z.string().min(1, "Target stage ID is required"),
  lostReason: z.string().nullable().optional(),
});

export type MoveDealStageInput = z.infer<typeof moveDealStageSchema>;
