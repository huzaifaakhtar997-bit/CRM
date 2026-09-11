import { Request, Response } from "express";
import { Webhook } from "svix";
import { config } from "../config/env";
import { prisma } from "../config/database";
import { SenderType, Prisma } from "@prisma/client";
import { socketService } from "../services/socket.service";
import { emailService } from "../services/email.service";

// Inline HTML sanitizer — zero dependencies, no ESM issues in serverless
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

export class WebhookController {
  async handleResendWebhook(req: Request, res: Response): Promise<void> {
    if (!config.resendWebhookSecret) {
      console.warn("[Webhook] Received webhook but RESEND_WEBHOOK_SECRET is not configured.");
      res.status(503).json({ success: false, message: "Webhook secret not configured." });
      return;
    }

    // Express with express.json() might have parsed req.body, but Svix needs the raw string.
    // If rawBody middleware isn't present, we must stringify (though this can break signatures if formatting changes).
    // The safest approach for webhooks is passing raw body. Since we might not have rawBody, we do our best.
    // Resend's svix verification ideally expects the raw string payload.
    const payload = (req as any).rawBody || (Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body));
    const headers = req.headers as Record<string, string>;

    const wh = new Webhook(config.resendWebhookSecret);

    let event: any;
    try {
      event = wh.verify(payload, headers);
    } catch (err: any) {
      console.error("[Webhook] Invalid signature:", err.message);
      res.status(400).json({ success: false, message: "Invalid webhook signature." });
      return;
    }

    const rawEventId = headers["svix-id"];
    const providerEventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;
    if (!providerEventId) {
      res.status(400).json({ success: false, message: "Missing svix-id header." });
      return;
    }

    try {
      // 1. Check Idempotency (Provider Event ID)
      const existingMessage = await prisma.message.findUnique({
        where: { providerEventId },
      });

      if (existingMessage) {
        console.log(`[Webhook] Duplicate event ${providerEventId} ignored.`);
        res.status(200).json({ success: true, message: "Event already processed." });
        return;
      }

      // Process "email.received"
      if (event.type === "email.received") {
        let { from, subject, html, text, in_reply_to } = event.data || {};
        const emailId = event.data?.email_id || event.data?.id;

        // If body content is not directly in webhook payload, fetch it via Resend Receiving API
        if ((!html && !text) && emailId) {
          try {
            const receivedData = await emailService.getReceivedEmail(emailId);
            if (receivedData) {
              if (receivedData.html) html = receivedData.html;
              if (receivedData.text) text = receivedData.text;
              if (receivedData.from && !from) from = receivedData.from;
              if (receivedData.subject && !subject) subject = receivedData.subject;
              if (!in_reply_to && receivedData.headers) {
                in_reply_to = receivedData.headers["in-reply-to"] || receivedData.headers["In-Reply-To"];
              }
            }
          } catch (fetchErr: any) {
            console.warn(`[Webhook] Could not fetch received email ${emailId}:`, fetchErr?.message || fetchErr);
          }
        }

        // Parse sender email (extract from "Name <email@domain.com>" format if present)
        let senderEmail = from || "";
        if (from) {
          const emailMatch = from.match(/<([^>]+)>/);
          if (emailMatch && emailMatch[1]) {
            senderEmail = emailMatch[1].trim().toLowerCase();
          } else {
            senderEmail = senderEmail.trim().toLowerCase();
          }
        }

        // Sanitize HTML
        const safeHtml = html ? sanitizeHtml(html) : text || "No content provided.";

        let matchedConversationId: string | null = null;
        let matchedContactId: string | null = null;

        // MATCHING STRATEGY 1: In-Reply-To
        if (in_reply_to) {
          // Some providers wrap in_reply_to in angle brackets or include domain
          const cleanInReplyTo = in_reply_to.replace(/^<|>$/g, "").trim();
          const idWithoutDomain = cleanInReplyTo.split("@")[0];
          const originalMessage = await prisma.message.findFirst({
            where: {
              OR: [
                { providerMessageId: cleanInReplyTo },
                { providerMessageId: idWithoutDomain },
              ],
            },
            include: { conversation: true },
          });

          if (originalMessage) {
            matchedConversationId = originalMessage.conversationId;
            matchedContactId = originalMessage.conversation.contactId;
          }
        }

        // MATCHING STRATEGY 2: Find Contact -> Latest Conversation
        if (!matchedConversationId && senderEmail) {
          const contact = await prisma.contact.findFirst({
            where: { email: { equals: senderEmail, mode: "insensitive" } },
          });

          if (contact) {
            matchedContactId = contact.id;
            // Find their latest conversation
            const latestConvo = await prisma.conversation.findFirst({
              where: { contactId: contact.id },
              orderBy: { updatedAt: "desc" },
            });
            if (latestConvo) {
              matchedConversationId = latestConvo.id;
            }
          }
        }

        // If no conversation found, create a new one
        await prisma.$transaction(async (tx) => {
          let finalConversationId = matchedConversationId;

          if (!finalConversationId) {
            const newConvo = await tx.conversation.create({
              data: {
                subject: subject || "No Subject",
                channel: "EMAIL",
                status: "OPEN",
                contactId: matchedContactId || null,
              },
            });
            finalConversationId = newConvo.id;
          }

          // Create Inbound Message
          const newMessage = await tx.message.create({
            data: {
              content: safeHtml,
              senderType: SenderType.CUSTOMER,
              senderName: (from ? from.replace(/<[^>]+>/, "").trim() : "") || senderEmail || "Customer",
              senderEmail,
              isInternalNote: false,
              providerEventId,
              conversationId: finalConversationId,
            },
          });

          // Update Conversation
          const updatedConversation = await tx.conversation.update({
            where: { id: finalConversationId },
            data: {
              lastMessageAt: new Date(),
              updatedAt: new Date(),
            },
            include: {
              assignedUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
              contact: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
            },
          });

          // ---------------------------------------------------------------
          // Socket.IO Emission Strategy
          //
          // The CRM schema has a single assignedUserId per conversation.
          // The HTTP API already allows ALL authenticated users to read ALL
          // conversations (no row-level ownership filter exists).
          //
          // Therefore:
          //  - If the conversation has an assignedUser: deliver the full
          //    message:receive payload only to that user, so they get the
          //    real-time notification with message content. All other users
          //    receive a lightweight conversation:updated event (no message
          //    body) so their sidebar lastMessageAt can refresh.
          //  - If unassigned: emitToAll with full payload, consistent with
          //    the existing HTTP model where all users share the inbox.
          // ---------------------------------------------------------------
          const assignedUserId = updatedConversation.assignedUserId;

          if (assignedUserId) {
            // Full payload only to assigned user
            socketService.emitToUser(assignedUserId, "message:receive", {
              message: newMessage,
              conversation: updatedConversation,
            });
            // Lightweight sidebar update to everyone else — no message body
            socketService.emitToAll("conversation:updated", {
              conversation: updatedConversation,
            });
          } else {
            // Unassigned conversation — shared inbox, all users may handle it
            socketService.emitToAll("message:receive", {
              message: newMessage,
              conversation: updatedConversation,
            });
          }
        });

        res.status(200).json({ success: true, message: "Inbound email processed successfully." });
        return;
      }

      // Ignore unsupported events
      res.status(200).json({ success: true, message: "Event type not supported." });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        console.log(`[Webhook] Duplicate event caught by Prisma constraint ${providerEventId}.`);
        res.status(200).json({ success: true, message: "Event already processed." });
        return;
      }
      
      console.error("[Webhook] Error processing event:", err);
      res.status(500).json({ success: false, message: "Internal server error during webhook processing." });
    }
  }
}
