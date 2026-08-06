import { Request, Response, NextFunction } from "express";
import { contactService, ContactService } from "../services/contact.service";
import { createContactSchema, updateContactSchema, queryContactSchema } from "../validators/contact.validator";
import { AppError } from "../types/auth.types";

export class ContactController {
  constructor(private contactServ: ContactService) {}

  createContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const validationResult = createContactSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const contact = await this.contactServ.createContact(validationResult.data, req.user.userId);

      res.status(201).json({
        success: true,
        message: "Contact created successfully.",
        data: { contact },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = queryContactSchema.safeParse(req.query);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Query validation failed: ${errors}`, 400);
      }

      const result = await this.contactServ.getContacts(validationResult.data);

      res.status(200).json({
        success: true,
        message: "Contacts retrieved successfully.",
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getContactById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const contact = await this.contactServ.getContactById(id);

      res.status(200).json({
        success: true,
        message: "Contact details retrieved successfully.",
        data: { contact },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validationResult = updateContactSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const contact = await this.contactServ.updateContact(id, validationResult.data, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Contact updated successfully.",
        data: { contact },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  deleteContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.contactServ.deleteContact(id);

      res.status(200).json({
        success: true,
        message: "Contact deleted successfully.",
        data: { id },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const contactController = new ContactController(contactService);
