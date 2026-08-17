import { Router } from "express";
import { campaignRecipientController } from "../controllers/campaign-recipient.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// All campaign recipient routes require authentication
router.use(authenticate);

// ── READ — ADMIN, MANAGER, MARKETING, SUPPORT ─────────────────────────────
router.get(
  "/campaigns/:campaignId/recipients",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING, UserRole.SUPPORT),
  campaignRecipientController.getRecipients
);

router.get(
  "/campaigns/:campaignId/recipients/:recipientId",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING, UserRole.SUPPORT),
  campaignRecipientController.getRecipientDetails
);

// ── WRITE — ADMIN, MANAGER, MARKETING only (SALES_REP and SUPPORT forbidden) ──
router.post(
  "/campaigns/:campaignId/recipients",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING),
  campaignRecipientController.addRecipient
);

router.post(
  "/campaigns/:campaignId/recipients/bulk",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING),
  campaignRecipientController.bulkAddRecipients
);

router.delete(
  "/campaigns/:campaignId/recipients/:recipientId",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.MARKETING),
  campaignRecipientController.removeRecipient
);

export default router;
