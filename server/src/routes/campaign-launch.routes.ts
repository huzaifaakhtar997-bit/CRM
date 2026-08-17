import { Router } from "express";
import { campaignLaunchController } from "../controllers/campaign-launch.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// Launch routes require authentication
router.use(authenticate);

// Write roles only — ADMIN, MANAGER, MARKETING (SUPPORT and SALES_REP forbidden)
router.post(
  "/campaigns/:campaignId/launch",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING),
  campaignLaunchController.launch
);

export default router;
