import { Message, ActivityType } from "@prisma/client";
import { noteRepository, NoteRepository } from "../repositories/note.repository";
import { prisma } from "../config/database";
import { AppError } from "../types/auth.types";
import { NoteInput } from "../validators/note.validator";

export class NoteService {
  constructor(private noteRepo: NoteRepository) {}

  async createInternalNote(conversationId: string, input: NoteInput, currentUserId: string): Promise<Message> {
    // 1. Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new AppError(`Conversation with ID '${conversationId}' not found.`, 404);
    }

    // 2. Fetch user details for sender data
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!user) {
      throw new AppError("Sender user profile not found.", 400);
    }

    const noteMessage = await prisma.$transaction(async (tx) => {
      // Create the internal note message record
      const newNote = await tx.message.create({
        data: {
          content: input.content,
          senderType: "USER",
          isInternalNote: true,
          senderName: user.name,
          senderEmail: user.email,
          conversationId,
        },
      });

      // Update parent Conversation timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
        },
      });

      // Automatically create an Activity log record
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Internal Note Added",
          content: `Internal note added to conversation "${conversation.subject || "Conversation Thread"}"`,
          userId: currentUserId,
          ...(conversation.contactId && { contactId: conversation.contactId }),
          metadata: {
            conversationId,
            messageId: newNote.id,
            senderType: "USER",
            isInternalNote: true,
          },
        },
      });

      return newNote;
    });

    return noteMessage;
  }
}

export const noteService = new NoteService(noteRepository);
