import { Router } from "express";
import { messageController } from "../controllers/message.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticate);

// View — ADMIN, MANAGER, SALES_REP, MARKETING, SUPPORT
router.get(
  "/conversations/:conversationId/messages",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  messageController.getMessagesByConversation
);

router.get(
  "/messages/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  messageController.getMessageById
);

// Create, Edit, Delete — ADMIN, MANAGER, SUPPORT (Matching Conversation creation access scope)
router.post(
  "/conversations/:conversationId/messages",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  messageController.createMessage
);

router.patch(
  "/messages/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  messageController.updateMessage
);

router.delete(
  "/messages/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  messageController.deleteMessage
);

export default router;
