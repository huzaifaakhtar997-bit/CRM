import { Router } from "express";
import { conversationController } from "../controllers/conversation.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticate);

// View — all roles
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  conversationController.getConversations
);

router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  conversationController.getConversationById
);

// Create/Edit/Delete — ADMIN, MANAGER, SUPPORT
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  conversationController.createConversation
);

router.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  conversationController.updateConversation
);

router.delete(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  conversationController.deleteConversation
);

export default router;
