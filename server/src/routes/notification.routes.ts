import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get("/notifications", notificationController.getNotifications);
router.get("/notifications/unread-count", notificationController.getUnreadCount);
router.patch("/notifications/read-all", notificationController.markAllAsRead);
router.patch("/notifications/:id/read", notificationController.markAsRead);
router.delete("/notifications/:id", notificationController.deleteNotification);

export default router;
