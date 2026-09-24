import { Request, Response, NextFunction } from "express";
import { invitationService, InvitationService } from "../services/invitation.service";
import { createInvitationSchema, registerWithInviteSchema } from "../validators/invitation.validator";
import { AppError } from "../types/auth.types";

export class InvitationController {
  constructor(private invService: InvitationService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = createInvitationSchema.safeParse(req.body);
      if (!validation.success) {
        const errorMessages = validation.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errorMessages}`, 400);
      }

      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const origin = req.get("origin") || req.get("referer");
      const result = await this.invService.createInvitation(validation.data, req.user.userId, origin);

      res.status(201).json({
        success: true,
        message: result.emailSent
          ? "Invitation created and email sent successfully."
          : "Invitation created successfully. You can share the invite link directly.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const invitations = await this.invService.listInvitations();
      res.status(200).json({
        success: true,
        data: invitations,
      });
    } catch (err) {
      next(err);
    }
  };

  revoke = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = typeof req.params.id === "string" ? req.params.id : (Array.isArray(req.params.id) ? req.params.id[0] : "");
      const result = await this.invService.revokeInvitation(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  validate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = typeof req.query.token === "string" ? req.query.token : "";
      const result = await this.invService.validateToken(token);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  registerWithInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = registerWithInviteSchema.safeParse(req.body);
      if (!validation.success) {
        const errorMessages = validation.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errorMessages}`, 400);
      }

      const result = await this.invService.registerWithInvite(validation.data);

      res.status(201).json({
        success: true,
        message: "Account created successfully.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const invitationController = new InvitationController(invitationService);
