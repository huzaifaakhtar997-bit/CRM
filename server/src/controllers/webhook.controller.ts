import { Request, Response } from "express";
import { Webhook } from "svix";
import { config } from "../config/env";
import { prisma } from "../config/database";
import { SenderType, Prisma, LeadSource, LeadStatus, CampaignRecipientStatus } from "@prisma/client";
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
        let matchedCampaignId: string | null = null;
        let matchedCampaignName: string | null = null;

        // MATCHING STRATEGY 1: In-Reply-To matching a direct Message
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
            // Explicit reply to a direct conversation message — NOT a campaign!
          } else {
            // MATCHING STRATEGY 1B: In-Reply-To matching a Campaign dispatch!
            const matchedCampaignRecipient = await prisma.campaignRecipient.findFirst({
              where: {
                OR: [
                  { providerMessageId: cleanInReplyTo },
                  { providerMessageId: idWithoutDomain },
                ],
              },
              include: { campaign: true },
            });

            if (matchedCampaignRecipient) {
              matchedContactId = matchedCampaignRecipient.contactId;
              matchedCampaignId = matchedCampaignRecipient.campaignId;
              matchedCampaignName = matchedCampaignRecipient.campaign.name;

              // Mark CampaignRecipient as REPLIED
              await prisma.campaignRecipient.update({
                where: { id: matchedCampaignRecipient.id },
                data: {
                  status: CampaignRecipientStatus.REPLIED,
                  repliedAt: matchedCampaignRecipient.repliedAt ?? new Date(),
                },
              });
            }
          }
        }

        // MATCHING STRATEGY 1C: Subject-based Campaign Matching (fallback if in_reply_to missing/omitted by mail client)
        if (!matchedConversationId && !matchedCampaignId && senderEmail && subject) {
          const cleanSubject = subject.replace(/^(re|fwd|fw):\s*/i, "").trim().toLowerCase();
          if (cleanSubject) {
            const contact = await prisma.contact.findFirst({
              where: { email: { equals: senderEmail, mode: "insensitive" } },
            });

            if (contact) {
              matchedContactId = contact.id;

              // Only match if the campaign's subject specifically matches the incoming email's subject
              const matchingCampaignRecip: any = await prisma.campaignRecipient.findFirst({
                where: {
                  contactId: contact.id,
                  status: { in: [CampaignRecipientStatus.SENT, CampaignRecipientStatus.DELIVERED, CampaignRecipientStatus.REPLIED] },
                  campaign: {
                    subject: { equals: cleanSubject, mode: "insensitive" },
                  },
                },
                include: { campaign: true },
                orderBy: { sentAt: "desc" },
              });

              if (matchingCampaignRecip) {
                matchedCampaignId = matchingCampaignRecip.campaignId;
                matchedCampaignName = matchingCampaignRecip.campaign?.name || null;
                await prisma.campaignRecipient.update({
                  where: { id: matchingCampaignRecip.id },
                  data: {
                    status: CampaignRecipientStatus.REPLIED,
                    repliedAt: matchingCampaignRecip.repliedAt ?? new Date(),
                  },
                });
              }
            }
          }
        }

        // MATCHING STRATEGY 2: Find Contact -> Latest Direct Conversation
        if (senderEmail) {
          if (!matchedContactId) {
            const contact = await prisma.contact.findFirst({
              where: { email: { equals: senderEmail, mode: "insensitive" } },
            });

            if (contact) {
              matchedContactId = contact.id;
            } else {
              // Check if there is an existing Lead for this email
              const existingLead = await prisma.lead.findFirst({
                where: { email: { equals: senderEmail, mode: "insensitive" } },
              });

              if (existingLead) {
                if (existingLead.convertedContactId) {
                  matchedContactId = existingLead.convertedContactId;
                }
              } else {
                // No Contact and no Lead exists — auto-create an inbound Lead!
                try {
                  const cleanSenderName = (from ? from.replace(/<[^>]+>/, "").trim() : "") || senderEmail.split("@")[0];
                  const parts = cleanSenderName.split(/\s+/).filter(Boolean);
                  const firstName = parts[0] || "Inbound";
                  const lastName = parts.slice(1).join(" ") || undefined;

                  const newLead = await prisma.lead.create({
                    data: {
                      firstName,
                      lastName,
                      email: senderEmail.toLowerCase(),
                      source: LeadSource.OTHER,
                      status: LeadStatus.NEW,
                      notes: `Auto-captured from inbound email in Unified Inbox. Subject: "${subject || 'No Subject'}"`,
                    },
                  });
                  console.log(`[Webhook] Auto-created inbound lead ${newLead.id} (${newLead.email})`);
                } catch (leadErr: any) {
                  console.warn("[Webhook] Auto-create lead skipped:", leadErr?.message || leadErr);
                }
              }
            }
          }

          // If matched to a campaign, check if there's already an existing thread for that campaign
          if (matchedContactId && matchedCampaignId && !matchedConversationId) {
            const existingCampaignConvo = await prisma.conversation.findFirst({
              where: {
                contactId: matchedContactId,
                campaignId: matchedCampaignId,
              },
              orderBy: { updatedAt: "desc" },
            });
            if (existingCampaignConvo) {
              matchedConversationId = existingCampaignConvo.id;
            }
          }

          // If direct email (NOT a campaign reply), route to contact's latest direct conversation
          if (matchedContactId && !matchedConversationId && !matchedCampaignId) {
            const latestConvo = await prisma.conversation.findFirst({
              where: {
                contactId: matchedContactId,
                campaignId: null, // Only append to regular direct conversations
              },
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
                subject: subject || (matchedCampaignName ? `Re: ${matchedCampaignName}` : "No Subject"),
                channel: "EMAIL",
                status: "OPEN",
                contactId: matchedContactId || null,
                campaignId: matchedCampaignId || null,
              },
            });
            finalConversationId = newConvo.id;
          } else if (matchedCampaignId) {
            await tx.conversation.update({
              where: { id: finalConversationId },
              data: { campaignId: matchedCampaignId },
            });
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
              campaign: { select: { id: true, name: true, subject: true } },
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

          const isFromCampaign = Boolean(updatedConversation.campaignId && (updatedConversation.campaign || matchedCampaignName));
          const effectiveCampaignName = updatedConversation.campaign?.name || matchedCampaignName || null;

          const messagePayload = {
            ...newMessage,
            isFromCampaign,
            campaignName: isFromCampaign ? effectiveCampaignName : null,
            campaignId: updatedConversation.campaignId,
          };
          const conversationPayload = {
            ...updatedConversation,
            isFromCampaign,
            campaignName: isFromCampaign ? effectiveCampaignName : null,
            campaignId: updatedConversation.campaignId,
          };

          if (assignedUserId) {
            // Full payload only to assigned user
            socketService.emitToUser(assignedUserId, "message:receive", {
              message: messagePayload,
              conversation: conversationPayload,
            });
            // Lightweight sidebar update to everyone else — no message body
            socketService.emitToAll("conversation:updated", {
              conversation: conversationPayload,
            });
          } else {
            // Unassigned conversation — shared inbox, all users may handle it
            socketService.emitToAll("message:receive", {
              message: messagePayload,
              conversation: conversationPayload,
            });
          }
        });

        res.status(200).json({ success: true, message: "Inbound email processed successfully." });
        return;
      }

      // ---------------------------------------------------------------
      // Campaign Tracking Events: delivered, opened, clicked, bounced
      // Resend fires these for outbound emails we send. Match by the
      // providerMessageId stored when the email was dispatched.
      // ---------------------------------------------------------------
      if (
        event.type === "email.delivered" ||
        event.type === "email.opened" ||
        event.type === "email.clicked" ||
        event.type === "email.bounced" ||
        event.type === "email.complained"
      ) {
        const emailId: string | undefined = event.data?.email_id || event.data?.id;

        if (!emailId) {
          res.status(200).json({ success: true, message: "Tracking event missing email_id, ignored." });
          return;
        }

        // Determine the new status
        let newStatus: string;
        if (event.type === "email.delivered") newStatus = "DELIVERED";
        else if (event.type === "email.opened") newStatus = "OPENED";
        else if (event.type === "email.clicked") newStatus = "CLICKED";
        else newStatus = "BOUNCED"; // bounced or complained

        try {
          // Find campaign recipient whose providerMessageId matches
          const recipient = await prisma.campaignRecipient.findFirst({
            where: { providerMessageId: emailId },
          });

          if (recipient) {
            // Only move forward in the funnel — never go backwards
            const priority: Record<string, number> = {
              PENDING: 0, SENT: 1, DELIVERED: 2, OPENED: 3, CLICKED: 4, REPLIED: 5, BOUNCED: 2, FAILED: 2,
            };
            const currentPriority = priority[recipient.status] ?? 0;
            const newPriority = priority[newStatus] ?? 0;

            if (newPriority > currentPriority || newStatus === "BOUNCED") {
              const now = new Date();
              const updateData: any = { status: newStatus };
              if (newStatus === "DELIVERED" && !recipient.deliveredAt) updateData.deliveredAt = now;
              if (newStatus === "OPENED") {
                if (!recipient.openedAt) updateData.openedAt = now;
                if (!recipient.deliveredAt) updateData.deliveredAt = now;
              }
              if (newStatus === "CLICKED") {
                if (!recipient.clickedAt) updateData.clickedAt = now;
                if (!recipient.openedAt) updateData.openedAt = now;
                if (!recipient.deliveredAt) updateData.deliveredAt = now;
              }

              await prisma.campaignRecipient.update({
                where: { id: recipient.id },
                data: updateData,
              });
              console.log(`[Webhook] Campaign recipient ${recipient.id} updated to ${newStatus}`);
            }
          } else {
            // May be a direct message (not a campaign) — just log and ignore
            console.log(`[Webhook] No campaign recipient found for providerMessageId ${emailId}, tracking event ignored.`);
          }
        } catch (trackErr: any) {
          console.warn(`[Webhook] Error updating campaign tracking for ${emailId}:`, trackErr?.message || trackErr);
        }

        res.status(200).json({ success: true, message: `Tracking event ${event.type} processed.` });
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
