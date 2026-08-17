import { Router } from "express";
import { campaignReplyController } from "../controllers/campaign-reply.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticate);

// ADMIN, MANAGER, MARKETING, SUPPORT allowed — SALES_REP forbidden
router.post(
  "/campaigns/:campaignId/reply",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING, UserRole.SUPPORT),
  campaignReplyController.processReply
);

export default router;
