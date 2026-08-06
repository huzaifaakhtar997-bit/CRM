import { Request, Response, NextFunction } from "express";
import { noteService, NoteService } from "../services/note.service";
import { noteSchema } from "../validators/note.validator";
import { AppError } from "../types/auth.types";

export class NoteController {
  constructor(private noteServ: NoteService) {}

  createInternalNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const conversationId = Array.isArray(req.params.conversationId)
        ? req.params.conversationId[0]
        : req.params.conversationId;

      const result = noteSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const message = await this.noteServ.createInternalNote(
        conversationId,
        result.data,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        message: "Internal note created successfully.",
        data: { message },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const noteController = new NoteController(noteService);
