import { Router } from "express";
import { companyController } from "../controllers/company.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// All company endpoints require authentication
router.use(authenticate);

// GET /api/v1/companies - Accessible by ADMIN, MANAGER, SALES_REP, MARKETING, SUPPORT
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  companyController.getCompanies
);

// GET /api/v1/companies/:id - Accessible by ADMIN, MANAGER, SALES_REP, MARKETING, SUPPORT
router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  companyController.getCompanyById
);

// GET /api/v1/companies/:id/contacts - Accessible by ADMIN, MANAGER, SALES_REP, MARKETING, SUPPORT
router.get(
  "/:id/contacts",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  companyController.getCompanyContacts
);

// POST /api/v1/companies - Accessible by ADMIN, MANAGER, SALES_REP
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  companyController.createCompany
);

// PATCH /api/v1/companies/:id - Accessible by ADMIN, MANAGER, SALES_REP
router.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  companyController.updateCompany
);

// DELETE /api/v1/companies/:id - Accessible by ADMIN, MANAGER, SALES_REP
router.delete(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  companyController.deleteCompany
);

export default router;
