import { Request, Response, NextFunction } from "express";
import { companyService, CompanyService } from "../services/company.service";
import { createCompanySchema, updateCompanySchema, queryCompanySchema } from "../validators/company.validator";
import { AppError } from "../types/auth.types";

export class CompanyController {
  constructor(private companyServ: CompanyService) {}

  createCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const validationResult = createCompanySchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const company = await this.companyServ.createCompany(validationResult.data, req.user.userId);

      res.status(201).json({
        success: true,
        message: "Company created successfully.",
        data: { company },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = queryCompanySchema.safeParse(req.query);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Query validation failed: ${errors}`, 400);
      }

      const result = await this.companyServ.getCompanies(validationResult.data);

      res.status(200).json({
        success: true,
        message: "Companies retrieved successfully.",
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const company = await this.companyServ.getCompanyById(id);

      res.status(200).json({
        success: true,
        message: "Company details retrieved successfully.",
        data: { company },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanyContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const contacts = await this.companyServ.getCompanyContacts(id);

      res.status(200).json({
        success: true,
        message: "Company contacts retrieved successfully.",
        data: { contacts },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validationResult = updateCompanySchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const company = await this.companyServ.updateCompany(id, validationResult.data, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Company updated successfully.",
        data: { company },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.companyServ.deleteCompany(id);

      res.status(200).json({
        success: true,
        message: "Company deleted successfully.",
        data: { id },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const companyController = new CompanyController(companyService);
