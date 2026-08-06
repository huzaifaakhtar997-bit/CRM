import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../types/auth.types";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError(
          `Forbidden: Role '${req.user.role}' does not have permission to access this resource. Required role(s): [${allowedRoles.join(", ")}]`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
