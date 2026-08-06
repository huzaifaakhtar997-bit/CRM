import { Router } from "express";
import { noteController } from "../controllers/note.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticate);

// Create Internal Note — ADMIN, MANAGER, SUPPORT only
router.post(
  "/conversations/:conversationId/notes",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT),
  noteController.createInternalNote
);

export default router;
