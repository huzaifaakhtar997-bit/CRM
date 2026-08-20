import { Router } from "express";
import { contactController } from "../controllers/contact.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// All contacts endpoints require authentication
router.use(authenticate);

// GET /api/v1/contacts - Accessible by ADMIN, MANAGER, SALES_REP, MARKETING, SUPPORT
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  contactController.getContacts
);

// GET /api/v1/contacts/export - Accessible by ADMIN, MANAGER, SALES_REP, MARKETING, SUPPORT
router.get(
  "/export",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  contactController.exportContacts
);

// GET /api/v1/contacts/:id - Accessible by ADMIN, MANAGER, SALES_REP, MARKETING, SUPPORT
router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  contactController.getContactById
);

// POST /api/v1/contacts - Accessible by ADMIN, MANAGER, SALES_REP
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  contactController.createContact
);

// PATCH /api/v1/contacts/:id - Accessible by ADMIN, MANAGER, SALES_REP
router.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  contactController.updateContact
);

// DELETE /api/v1/contacts/:id - Accessible by ADMIN, MANAGER, SALES_REP
router.delete(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  contactController.deleteContact
);

export default router;
