import { Request, Response, NextFunction } from "express";
import { leadService, LeadService } from "../services/lead.service";
import { createLeadSchema, updateLeadSchema, queryLeadSchema } from "../validators/lead.validator";
import { AppError } from "../types/auth.types";

export class LeadController {
  constructor(private leadServ: LeadService) {}

  createLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const validationResult = createLeadSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const lead = await this.leadServ.createLead(validationResult.data, req.user.userId);

      res.status(201).json({
        success: true,
        message: "Lead created successfully.",
        data: { lead },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getLeads = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = queryLeadSchema.safeParse(req.query);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Query validation failed: ${errors}`, 400);
      }

      const result = await this.leadServ.getLeads(validationResult.data);

      res.status(200).json({
        success: true,
        message: "Leads retrieved successfully.",
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getLeadById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const lead = await this.leadServ.getLeadById(id);

      res.status(200).json({
        success: true,
        message: "Lead details retrieved successfully.",
        data: { lead },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validationResult = updateLeadSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const lead = await this.leadServ.updateLead(id, validationResult.data, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Lead updated successfully.",
        data: { lead },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  deleteLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.leadServ.deleteLead(id);

      res.status(200).json({
        success: true,
        message: "Lead deleted successfully.",
        data: { id },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const leadController = new LeadController(leadService);
