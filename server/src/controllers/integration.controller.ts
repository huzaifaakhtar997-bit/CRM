import { Request, Response, NextFunction } from "express";
import { integrationService, IntegrationService } from "../services/integration.service";
import { connectHubspotSchema } from "../validators/integration.validator";
import { AppError } from "../types/auth.types";

export class IntegrationController {
  constructor(private integrationServ: IntegrationService) {}

  connectHubspot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const result = connectHubspotSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const connection = await this.integrationServ.connectHubspot(result.data.accessToken, req.user.userId);

      res.status(201).json({
        success: true,
        message: "HubSpot integrated successfully.",
        data: connection,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getHubspotStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const connection = await this.integrationServ.getHubspotStatus();

      res.status(200).json({
        success: true,
        message: "HubSpot connection details retrieved.",
        data: connection,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  disconnectHubspot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const connection = await this.integrationServ.disconnectHubspot(req.user.userId);

      res.status(200).json({
        success: true,
        message: "HubSpot disconnected successfully.",
        data: connection,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const integrationController = new IntegrationController(integrationService);
