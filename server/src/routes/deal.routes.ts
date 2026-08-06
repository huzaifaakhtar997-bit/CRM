import { Router } from "express";
import { dealController } from "../controllers/deal.controller";
import { pipelineController } from "../controllers/pipeline.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticate);

// Read — all roles
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  dealController.getDeals
);

router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  dealController.getDealById
);

// Write — ADMIN, MANAGER, SALES_REP only
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  dealController.createDeal
);

router.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  dealController.updateDeal
);

// PATCH /api/v1/deals/:id/stage - Update stage
router.patch(
  "/:id/stage",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  pipelineController.moveDealStage
);

router.delete(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  dealController.deleteDeal
);

export default router;
