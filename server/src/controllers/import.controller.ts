import { Request, Response, NextFunction } from "express";
import path from "path";
import { importService, ImportService } from "../services/import.service";
import { AppError } from "../types/auth.types";
import {
  importTypeParamSchema,
  importListQuerySchema,
  SUPPORTED_EXTENSIONS,
} from "../validators/import.validator";

export class ImportController {
  constructor(private importSvc: ImportService) {}

  /**
   * POST /api/v1/imports/:type
   *
   * Accepts a multipart/form-data upload.
   * :type must be "contacts" or "companies".
   * The file must be .csv or .xlsx.
   */
  uploadImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      // Validate :type route param
      const paramResult = importTypeParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        const msgs = paramResult.error.issues.map((i) => i.message).join(", ");
        throw new AppError(`Invalid import type: ${msgs}`, 422);
      }

      const importType = paramResult.data.type;

      // multer stores the file on req.file (memory storage)
      if (!req.file) {
        throw new AppError(
          "No file uploaded. Please attach a .csv or .xlsx file using the 'file' field.",
          422
        );
      }

      // Extension validation
      const originalName = req.file.originalname || "";
      const ext = path.extname(originalName).toLowerCase();

      if (!SUPPORTED_EXTENSIONS.includes(ext as typeof SUPPORTED_EXTENSIONS[number])) {
        throw new AppError(
          `Unsupported file type "${ext}". Only .csv and .xlsx files are accepted.`,
          422
        );
      }

      // Dispatch to the appropriate service method
      const summary =
        importType === "contacts"
          ? await this.importSvc.startContactImport(
              req.file.buffer,
              originalName,
              ext,
              req.user.userId
            )
          : await this.importSvc.startCompanyImport(
              req.file.buffer,
              originalName,
              ext,
              req.user.userId
            );

      res.status(201).json({
        success: true,
        message: `${importType} import completed.`,
        data: {
          importJob: summary.importJob,
          summary: {
            totalRows: summary.totalRows,
            successfulRows: summary.successfulRows,
            skippedRows: summary.skippedRows,
            failedRows: summary.failedRows,
          },
          errors: summary.errors.length > 0 ? summary.errors : undefined,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/imports/:jobId
   *
   * Returns the full status and error log for a specific import job.
   */
  getImportJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
      const job = await this.importSvc.getImportStatus(jobId);

      res.status(200).json({
        success: true,
        message: "Import job retrieved successfully.",
        data: { importJob: job },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/imports
   *
   * Returns paginated import job history.
   * ADMIN/MANAGER see all jobs; SALES_REP/SUPPORT see their own.
   */
  listImportJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const queryResult = importListQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        const msgs = queryResult.error.issues.map((i) => i.message).join(", ");
        throw new AppError(`Query validation failed: ${msgs}`, 400);
      }

      const result = await this.importSvc.listImportJobs({
        userId: req.user.userId,
        role: req.user.role,
        page: queryResult.data.page,
        limit: queryResult.data.limit,
      });

      res.status(200).json({
        success: true,
        message: "Import job history retrieved successfully.",
        data: {
          ...result,
          importJobs: result.jobs,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const importController = new ImportController(importService);
