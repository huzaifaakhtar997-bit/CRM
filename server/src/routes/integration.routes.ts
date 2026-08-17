import { Router } from "express";
import { integrationController } from "../controllers/integration.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// Connection setup requires authentication
router.use(authenticate);

// ── READ — ADMIN, MANAGER, SUPPORT allowed — SALES_REP forbidden
router.get(
  "/integrations/hubspot",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  integrationController.getHubspotStatus
);

// ── WRITE — ADMIN, MANAGER allowed — SUPPORT and SALES_REP forbidden
router.post(
  "/integrations/hubspot/connect",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  integrationController.connectHubspot
);

router.delete(
  "/integrations/hubspot",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  integrationController.disconnectHubspot
);

export default router;
