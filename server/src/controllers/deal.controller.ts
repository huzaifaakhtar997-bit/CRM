import { Request, Response, NextFunction } from "express";
import { dealService, DealService } from "../services/deal.service";
import { createDealSchema, updateDealSchema, queryDealSchema } from "../validators/deal.validator";
import { AppError } from "../types/auth.types";

export class DealController {
  constructor(private dealServ: DealService) {}

  createDeal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const result = createDealSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const deal = await this.dealServ.createDeal(result.data, req.user.userId);

      res.status(201).json({
        success: true,
        message: "Deal created successfully.",
        data: { deal },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getDeals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = queryDealSchema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Query validation failed: ${errors}`, 400);
      }

      const data = await this.dealServ.getDeals(result.data);

      res.status(200).json({
        success: true,
        message: "Deals retrieved successfully.",
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getDealById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deal = await this.dealServ.getDealById(id);

      res.status(200).json({
        success: true,
        message: "Deal retrieved successfully.",
        data: { deal },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateDeal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = updateDealSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const deal = await this.dealServ.updateDeal(id, result.data, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Deal updated successfully.",
        data: { deal },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDeal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.dealServ.deleteDeal(id);

      res.status(200).json({
        success: true,
        message: "Deal deleted successfully.",
        data: { id },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const dealController = new DealController(dealService);
