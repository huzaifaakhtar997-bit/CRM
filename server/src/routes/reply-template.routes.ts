import { Router } from "express";
import { replyTemplateController } from "../controllers/reply-template.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticate);

// Reply using Saved Template — ADMIN, MANAGER, SUPPORT only
router.post(
  "/conversations/:conversationId/reply/template",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  replyTemplateController.sendReplyWithTemplate
);

export default router;
