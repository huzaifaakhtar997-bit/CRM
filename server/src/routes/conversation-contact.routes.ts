import { Router } from "express";
import { conversationContactController } from "../controllers/conversation-contact.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticate);

// Link existing contact — ADMIN, MANAGER, SUPPORT only
router.patch(
  "/conversations/:conversationId/contact",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  conversationContactController.linkExistingContact
);

// Create and link new contact — ADMIN, MANAGER, SUPPORT only
router.post(
  "/conversations/:conversationId/contact",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  conversationContactController.createAndLinkContact
);

export default router;
