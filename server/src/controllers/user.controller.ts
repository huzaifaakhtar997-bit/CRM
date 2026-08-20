import { Request, Response, NextFunction } from "express";
import { userService, UserService } from "../services/user.service";
import { updateUserSchema, updateStatusSchema, updateRoleSchema, updatePasswordSchema } from "../validators/user.validator";
import { AppError } from "../types/auth.types";

export class UserController {
  constructor(private userServ: UserService) {}

  getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userServ.getAllUsers();
      res.status(200).json({
        success: true,
        message: "Users retrieved successfully.",
        data: { users },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await this.userServ.getUserById(id);
      res.status(200).json({
        success: true,
        message: "User details retrieved successfully.",
        data: { user },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validationResult = updateUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const updated = await this.userServ.updateUser(id, validationResult.data);
      res.status(200).json({
        success: true,
        message: "User profile updated successfully.",
        data: { user: updated },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validationResult = updateStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const updated = await this.userServ.updateUserStatus(id, validationResult.data.status);
      res.status(200).json({
        success: true,
        message: "User status updated successfully.",
        data: { user: updated },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validationResult = updateRoleSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const updated = await this.userServ.updateUserRole(id, validationResult.data.role);
      res.status(200).json({
        success: true,
        message: "User role updated successfully.",
        data: { user: updated },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validationResult = updatePasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const updated = await this.userServ.updateUserPassword(id, validationResult.data.password);
      res.status(200).json({
        success: true,
        message: "User password updated successfully.",
        data: { user: updated },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController(userService);
