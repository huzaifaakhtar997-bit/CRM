import { Router } from "express";
import { replyController } from "../controllers/reply.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticate);

// Reply sending — ADMIN, MANAGER, SUPPORT only
router.post(
  "/conversations/:conversationId/reply",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  replyController.sendReply
);

export default router;
