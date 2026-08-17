import { Router } from "express";
import { hubspotSyncController } from "../controllers/hubspot-sync.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// Sync routes require authentication
router.use(authenticate);

// ── READ — ADMIN, MANAGER, SUPPORT allowed — SALES_REP forbidden
router.get(
  "/integrations/hubspot/contacts/sync-status",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  hubspotSyncController.getSyncStatus
);

router.get(
  "/integrations/hubspot/companies/sync-status",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  hubspotSyncController.getCompanySyncStatus
);

// ── WRITE — ADMIN, MANAGER allowed — SUPPORT and SALES_REP forbidden
router.post(
  "/integrations/hubspot/contacts/import",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  hubspotSyncController.importContacts
);

router.post(
  "/integrations/hubspot/contacts/export",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  hubspotSyncController.exportContacts
);

router.post(
  "/integrations/hubspot/contacts/sync",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  hubspotSyncController.syncContacts
);

router.post(
  "/integrations/hubspot/companies/import",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  hubspotSyncController.importCompanies
);

router.post(
  "/integrations/hubspot/companies/export",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  hubspotSyncController.exportCompanies
);

router.post(
  "/integrations/hubspot/companies/sync",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  hubspotSyncController.syncCompanies
);

// ── DEAL SYNC — Phase 9D ──────────────────────────────────────────────────────

router.get(
  "/integrations/hubspot/deals/sync-status",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  hubspotSyncController.getDealSyncStatus
);

router.post(
  "/integrations/hubspot/deals/import",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  hubspotSyncController.importDeals
);

router.post(
  "/integrations/hubspot/deals/export",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  hubspotSyncController.exportDeals
);

router.post(
  "/integrations/hubspot/deals/sync",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  hubspotSyncController.syncDeals
);

// ── CONFIGURABLE MAPPING ROUTES — Phase 9E ────────────────────────────────────

router.get(
  "/integrations/hubspot/mappings",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  hubspotSyncController.getMappings
);

router.put(
  "/integrations/hubspot/mappings",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  hubspotSyncController.updateMappings
);

export default router;

