import { Router } from "express";
import { campaignTestController } from "../controllers/campaign-test.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// Test Send endpoints require authentication
router.use(authenticate);

// Write roles only — ADMIN, MANAGER, MARKETING (SUPPORT and SALES_REP forbidden)
router.post(
  "/campaigns/:campaignId/test-send",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING),
  campaignTestController.testSend
);

export default router;
