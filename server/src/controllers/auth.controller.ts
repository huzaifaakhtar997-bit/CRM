import { Request, Response, NextFunction } from "express";
import { authService, AuthService } from "../services/auth.service";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { AppError } from "../types/auth.types";

export class AuthController {
  constructor(private authServ: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errorMessages}`, 400);
      }

      const result = await this.authServ.register(validationResult.data);

      res.status(201).json({
        success: true,
        message: "User account registered successfully.",
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errorMessages}`, 400);
      }

      const result = await this.authServ.login(validationResult.data);

      res.status(200).json({
        success: true,
        message: "Login successful.",
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication payload missing.", 401);
      }

      const user = await this.authServ.getCurrentUser(req.user.userId);

      res.status(200).json({
        success: true,
        message: "Authenticated user details retrieved.",
        data: { user },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController(authService);
