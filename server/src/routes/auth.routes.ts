import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { invitationController } from "../controllers/invitation.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public auth routes
router.post("/register", authController.register);
router.post("/register-with-invite", invitationController.registerWithInvite);
router.post("/login", authController.login);

// Protected auth route
router.get("/me", authenticate, authController.me);

export default router;
