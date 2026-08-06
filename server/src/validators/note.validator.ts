import { z } from "zod";

export const noteSchema = z.object({
  content: z.string().min(1, "Internal note content cannot be empty"),
});

export type NoteInput = z.infer<typeof noteSchema>;
