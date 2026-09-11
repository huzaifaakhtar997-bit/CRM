import { Router } from "express";
import { leadController } from "../controllers/lead.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// All leads endpoints require authentication
router.use(authenticate);

// GET /api/v1/leads - Accessible by ADMIN, MANAGER, SALES_REP, MARKETING, SUPPORT
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  leadController.getLeads
);

// GET /api/v1/leads/:id - Accessible by ADMIN, MANAGER, SALES_REP, MARKETING, SUPPORT
router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  leadController.getLeadById
);

// POST /api/v1/leads - Accessible by ADMIN, MANAGER, SALES_REP
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  leadController.createLead
);

// PATCH /api/v1/leads/:id - Accessible by ADMIN, MANAGER, SALES_REP
router.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  leadController.updateLead
);

// POST /api/v1/leads/:id/convert - Accessible by ADMIN, MANAGER, SALES_REP
router.post(
  "/:id/convert",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  leadController.convertLead
);

// DELETE /api/v1/leads/:id - Accessible by ADMIN, MANAGER, SALES_REP
router.delete(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  leadController.deleteLead
);


export default router;
