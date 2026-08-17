import { Router } from "express";
import { campaignTrackingController } from "../controllers/campaign-tracking.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// All tracking endpoints require authentication
router.use(authenticate);

// ── READ — ADMIN, MANAGER, MARKETING, SUPPORT ─────────────────────────────
router.get(
  "/campaigns/:campaignId/tracking",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING, UserRole.SUPPORT),
  campaignTrackingController.getSummary
);

// ── WRITE — ADMIN, MANAGER, MARKETING only (SUPPORT and SALES_REP forbidden) ──
router.patch(
  "/campaigns/:campaignId/recipients/:recipientId/status",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING),
  campaignTrackingController.updateStatus
);

export default router;
