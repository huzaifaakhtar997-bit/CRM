import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// All user management routes require authentication first
router.use(authenticate);

// GET /api/v1/users - Accessible by ADMIN and MANAGER
router.get("/", authorize(UserRole.ADMIN, UserRole.MANAGER), userController.getAllUsers);

// GET /api/v1/users/:id - Accessible by ADMIN and MANAGER
router.get("/:id", authorize(UserRole.ADMIN, UserRole.MANAGER), userController.getUserById);

// PATCH /api/v1/users/:id - Accessible by ADMIN and MANAGER
router.patch("/:id", authorize(UserRole.ADMIN, UserRole.MANAGER), userController.updateUser);

// PATCH /api/v1/users/:id/status - Admin only
router.patch("/:id/status", authorize(UserRole.ADMIN), userController.updateStatus);

// PATCH /api/v1/users/:id/role - Admin only
router.patch("/:id/role", authorize(UserRole.ADMIN), userController.updateRole);

export default router;
