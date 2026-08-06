import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public auth routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected auth route
router.get("/me", authenticate, authController.me);

export default router;
