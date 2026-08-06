import { Router } from "express";
import { templateController } from "../controllers/template.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticate);

// Read Templates — ADMIN, MANAGER, SUPPORT
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  templateController.getTemplates
);

router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  templateController.getTemplateById
);

// Create / Update / Delete — ADMIN, MANAGER only (SUPPORT rejected)
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  templateController.createTemplate
);

router.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  templateController.updateTemplate
);

router.delete(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  templateController.deleteTemplate
);

export default router;
