import { Router } from "express";
import { reportController } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

// GET /api/v1/reports - Live sales and leads analytics
router.get("/", reportController.getReports);

export default router;
