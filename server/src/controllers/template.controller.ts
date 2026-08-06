import { Request, Response, NextFunction } from "express";
import { templateService, TemplateService } from "../services/template.service";
import { createTemplateSchema, updateTemplateSchema, queryTemplateSchema } from "../validators/template.validator";
import { AppError } from "../types/auth.types";

export class TemplateController {
  constructor(private templateServ: TemplateService) {}

  createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const result = createTemplateSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const template = await this.templateServ.createTemplate(result.data, req.user.userId);

      res.status(201).json({
        success: true,
        message: "Template created successfully.",
        data: { template },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = queryTemplateSchema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Query validation failed: ${errors}`, 400);
      }

      const data = await this.templateServ.getTemplates(result.data);

      res.status(200).json({
        success: true,
        message: "Templates retrieved successfully.",
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const template = await this.templateServ.getTemplateById(id);

      res.status(200).json({
        success: true,
        message: "Template retrieved successfully.",
        data: { template },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = updateTemplateSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const template = await this.templateServ.updateTemplate(id, result.data, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Template updated successfully.",
        data: { template },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.templateServ.deleteTemplate(id, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Template deleted successfully.",
        data: { id },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const templateController = new TemplateController(templateService);
