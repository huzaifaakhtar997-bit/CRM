import { z } from "zod";

// Validate query params for GET /notifications
export const getNotificationsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
    unreadOnly: z.string().optional().transform((v) => v === "true"),
  }),
});

// Used for route parameters like /notifications/:id
export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Notification ID is required"),
  }),
});
