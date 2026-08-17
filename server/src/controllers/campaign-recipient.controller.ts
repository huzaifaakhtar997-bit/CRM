import { Request, Response, NextFunction } from "express";
import { campaignRecipientService, CampaignRecipientService } from "../services/campaign-recipient.service";
import {
  addRecipientSchema,
  bulkAddRecipientsSchema,
  queryCampaignRecipientSchema,
} from "../validators/campaign-recipient.validator";
import { AppError } from "../types/auth.types";

export class CampaignRecipientController {
  constructor(private recipientServ: CampaignRecipientService) {}

  addRecipient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;
      const result = addRecipientSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const recipient = await this.recipientServ.addRecipient(campaignId, result.data.contactId, req.user.userId);

      res.status(201).json({
        success: true,
        message: "Recipient added to campaign successfully.",
        data: { recipient },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  bulkAddRecipients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;
      const result = bulkAddRecipientsSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const outcome = await this.recipientServ.bulkAddRecipients(campaignId, result.data.contactIds, req.user.userId);

      res.status(201).json({
        success: true,
        message: "Recipients added in bulk to campaign successfully.",
        data: outcome,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getRecipientDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;
      const recipientId = Array.isArray(req.params.recipientId) ? req.params.recipientId[0] : req.params.recipientId;

      const recipient = await this.recipientServ.getRecipientDetails(campaignId, recipientId);

      res.status(200).json({
        success: true,
        message: "Recipient details retrieved successfully.",
        data: { recipient },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getRecipients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;
      const result = queryCampaignRecipientSchema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Query validation failed: ${errors}`, 400);
      }

      const data = await this.recipientServ.getRecipients(campaignId, result.data);

      res.status(200).json({
        success: true,
        message: "Campaign recipients retrieved successfully.",
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  removeRecipient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;
      const recipientId = Array.isArray(req.params.recipientId) ? req.params.recipientId[0] : req.params.recipientId;

      const outcome = await this.recipientServ.removeRecipient(campaignId, recipientId, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Recipient removed from campaign successfully.",
        data: outcome,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const campaignRecipientController = new CampaignRecipientController(campaignRecipientService);
