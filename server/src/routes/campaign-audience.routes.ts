import { Router } from "express";
import { campaignAudienceController } from "../controllers/campaign-audience.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// All campaign audience routes require authentication
router.use(authenticate);

// ── READ — ADMIN, MANAGER, SALES_REP, MARKETING, SUPPORT ──────────────────
router.get(
  "/campaigns/:campaignId/audience",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  campaignAudienceController.getAudience
);

// ── WRITE — ADMIN, MANAGER, MARKETING only (SALES_REP and SUPPORT forbidden) ──
router.post(
  "/campaigns/:campaignId/audience/preview",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  campaignAudienceController.previewAudience
);

router.post(
  "/campaigns/:campaignId/audience/apply",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING),
  campaignAudienceController.applyAudience
);

router.delete(
  "/campaigns/:campaignId/audience/:recipientId",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING),
  campaignAudienceController.removeRecipient
);

export default router;
