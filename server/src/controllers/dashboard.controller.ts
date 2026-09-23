import { Request, Response, NextFunction } from "express";
import { dashboardService, DashboardService } from "../services/dashboard.service";
import { AppError } from "../types/auth.types";

export class DashboardController {
  constructor(private dashboardServ: DashboardService) {}

  getPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const performance = await this.dashboardServ.getPerformanceData({
        userId: req.user.userId,
        role: req.user.role,
      });

      res.status(200).json({
        success: true,
        message: "Dashboard performance metrics retrieved successfully.",
        data: performance,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController(dashboardService);
