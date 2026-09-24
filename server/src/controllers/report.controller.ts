import { Request, Response, NextFunction } from "express";
import { reportService, ReportService } from "../services/report.service";
import { AppError } from "../types/auth.types";

export class ReportController {
  constructor(private reportServ: ReportService) {}

  getReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const timeRange = typeof req.query.timeRange === "string" ? req.query.timeRange : undefined;
      const repId = typeof req.query.repId === "string" ? req.query.repId : undefined;

      const reportData = await this.reportServ.getReportAnalytics(
        { userId: req.user.userId, role: req.user.role },
        { timeRange, repId }
      );

      res.status(200).json({
        success: true,
        message: "Report analytics retrieved successfully.",
        data: reportData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const reportController = new ReportController(reportService);
