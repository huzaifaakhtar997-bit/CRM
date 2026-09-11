import { Router } from "express";
import { campaignController } from "../controllers/campaign.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// All campaign routes require a valid JWT
router.use(authenticate);

// ── READ — ADMIN, MANAGER, SALES_REP, MARKETING, SUPPORT ──────────────────

router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  campaignController.getCampaigns
);

router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  campaignController.getCampaignById
);

// ── WRITE — ADMIN, MANAGER, MARKETING only (SALES_REP and SUPPORT forbidden) ──

router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING),
  campaignController.createCampaign
);

router.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING),
  campaignController.updateCampaign
);

router.delete(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING),
  campaignController.deleteCampaign
);

export default router;
