import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

// GET /api/v1/dashboard/performance - Role-tailored performance command center
router.get("/performance", dashboardController.getPerformance);

export default router;
