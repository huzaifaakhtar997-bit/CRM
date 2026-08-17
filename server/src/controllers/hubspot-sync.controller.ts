import { Request, Response, NextFunction } from "express";
import { hubspotSyncService, HubspotSyncService } from "../services/hubspot-sync.service";
import { AppError } from "../types/auth.types";
import { z } from "zod";

const VALID_FIELDS: Record<string, string[]> = {
  contact: ["firstName", "lastName", "email", "phone", "jobTitle"],
  company: ["name", "industry", "website", "domain", "phone", "annualRevenue", "description"],
  deal: ["title", "value", "expectedCloseDate"],
};

const MappingPayloadSchema = z.object({
  fieldMappings: z.array(
    z.object({
      entityType: z.enum(["contact", "company", "deal"]),
      crmField: z.string(),
      hubspotProperty: z.string(),
    })
  ).refine(
    (mappings) => {
      return mappings.every((m) => {
        const allowed = VALID_FIELDS[m.entityType];
        return allowed && allowed.includes(m.crmField);
      });
    },
    { message: "One or more mapped CRM fields are invalid for their entity type." }
  ),
  stageMappings: z.array(
    z.object({
      pipelineStageName: z.string(),
      hubspotStage: z.string(),
    })
  ),
});


export class HubspotSyncController {
  constructor(private syncServ: HubspotSyncService) {}

  importContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const summary = await this.syncServ.importContacts(req.user.userId);

      res.status(200).json({
        success: true,
        message: "HubSpot contact import processed successfully.",
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  exportContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const summary = await this.syncServ.exportContacts(req.user.userId);

      res.status(200).json({
        success: true,
        message: "HubSpot contact export processed successfully.",
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  syncContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const summary = await this.syncServ.syncContacts(req.user.userId);

      res.status(200).json({
        success: true,
        message: "HubSpot bidirectional contact sync processed successfully.",
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getSyncStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await this.syncServ.getSyncStatus();

      res.status(200).json({
        success: true,
        message: "HubSpot contact sync status retrieved.",
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  importCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const summary = await this.syncServ.importCompanies(req.user.userId);

      res.status(200).json({
        success: true,
        message: "HubSpot company import processed successfully.",
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  exportCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const summary = await this.syncServ.exportCompanies(req.user.userId);

      res.status(200).json({
        success: true,
        message: "HubSpot company export processed successfully.",
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  syncCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const summary = await this.syncServ.syncCompanies(req.user.userId);

      res.status(200).json({
        success: true,
        message: "HubSpot bidirectional company sync processed successfully.",
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanySyncStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await this.syncServ.getCompanySyncStatus();

      res.status(200).json({
        success: true,
        message: "HubSpot company sync status retrieved.",
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  importDeals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);
      const summary = await this.syncServ.importDeals(req.user.userId);
      res.status(200).json({
        success: true,
        message: "HubSpot deal import processed successfully.",
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  exportDeals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);
      const summary = await this.syncServ.exportDeals(req.user.userId);
      res.status(200).json({
        success: true,
        message: "HubSpot deal export processed successfully.",
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  syncDeals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);
      const summary = await this.syncServ.syncDeals(req.user.userId);
      res.status(200).json({
        success: true,
        message: "HubSpot bidirectional deal sync processed successfully.",
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getDealSyncStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await this.syncServ.getDealSyncStatus();
      res.status(200).json({
        success: true,
        message: "HubSpot deal sync status retrieved.",
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getMappings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mappings = await this.syncServ.getMappings();
      res.status(200).json({
        success: true,
        message: "HubSpot mappings retrieved successfully.",
        data: mappings,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateMappings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = MappingPayloadSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError(parseResult.error.issues[0]?.message || "Invalid mapping payload", 422);
      }

      const updated = await this.syncServ.updateMappings(parseResult.data);
      res.status(200).json({
        success: true,
        message: "HubSpot mappings updated successfully.",
        data: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const hubspotSyncController = new HubspotSyncController(hubspotSyncService);



