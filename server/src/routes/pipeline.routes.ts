import { Router } from "express";
import { pipelineController } from "../controllers/pipeline.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticate);

// GET /api/v1/pipeline/stages - Read pipeline layout
router.get(
  "/stages",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  pipelineController.getPipelineStages
);

export default router;
