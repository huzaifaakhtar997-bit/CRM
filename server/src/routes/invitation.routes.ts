import { Router } from "express";
import { invitationController } from "../controllers/invitation.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// Public routes for invite validation and registration
router.get("/validate", invitationController.validate);
router.post("/accept", invitationController.registerWithInvite);

// Protected routes (Admin / Manager only)
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  invitationController.create
);

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  invitationController.list
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  invitationController.revoke
);

export default router;
