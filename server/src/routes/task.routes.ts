import { Router } from "express";
import { taskController } from "../controllers/task.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticate);

// View tasks — all roles
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  taskController.getTasks
);

router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.MARKETING, UserRole.SUPPORT),
  taskController.getTaskById
);

// Create, update, delete — ADMIN, MANAGER, SALES_REP
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  taskController.createTask
);

router.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  taskController.updateTask
);

router.delete(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  taskController.deleteTask
);

export default router;
