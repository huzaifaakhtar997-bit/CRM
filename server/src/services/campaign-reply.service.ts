import { ActivityType } from "@prisma/client";
import { prisma } from "../config/database";
import { campaignReplyRepository, CampaignReplyRepository } from "../repositories/campaign-reply.repository";
import { AppError } from "../types/auth.types";

export interface CampaignReplyOutcome {
  conversationId: string;
  messageId: string;
  contactId: string;
  campaignRecipientStatus: string;
}

export class CampaignReplyService {
  constructor(private replyRepo: CampaignReplyRepository) {}

  async processIncomingReply(
    campaignId: string,
    recipientEmail: string,
    subject: string,
    content: string,
    currentUserId: string
  ): Promise<CampaignReplyOutcome> {
    // 1. Verify Campaign exists
    const campaign = await this.replyRepo.findCampaignById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    // 2. Find CampaignRecipient by email within this campaign
    const recipientWithContact = await this.replyRepo.findRecipientAndContactByEmail(campaignId, recipientEmail);
    if (!recipientWithContact) {
      throw new AppError(`No campaign recipient found with email '${recipientEmail}' in campaign '${campaignId}'.`, 404);
    }

    const contact = recipientWithContact.contact;
    const recipient = recipientWithContact;

    // 3. Find or create conversation for this contact
    const existingConversation = await this.replyRepo.findExistingConversation(contact.id);

    // 4. Execute everything atomically
    const outcome = await prisma.$transaction(async (tx) => {
      let conversationId: string;
      let isNewConversation = false;

      if (existingConversation) {
        // Reuse existing conversation — update its timestamps
        conversationId = existingConversation.id;
        await tx.conversation.update({
          where: { id: conversationId },
          data: {
            updatedAt: new Date(),
            status: "OPEN",
          },
        });
      } else {
        // Create new conversation
        isNewConversation = true;
        const newConversation = await tx.conversation.create({
          data: {
            subject,
            channel: "EMAIL",
            status: "OPEN",
            contactId: contact.id,
          },
        });
        conversationId = newConversation.id;
      }

      // 5. Create CUSTOMER message
      const message = await tx.message.create({
        data: {
          conversationId,
          content,
          senderType: "CUSTOMER",
          isInternalNote: false,
        },
      });

      // 6. Update CampaignRecipient to REPLIED (preserve existing repliedAt)
      await tx.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "REPLIED",
          repliedAt: recipient.repliedAt ?? new Date(),
        },
      });

      // 7. Activity: Campaign Reply Received
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Campaign Reply Received",
          content: `Campaign recipient ${contact.email} replied to campaign "${campaign.name}".`,
          userId: currentUserId,
          metadata: {
            campaignId,
            campaignName: campaign.name,
            contactId: contact.id,
            contactEmail: contact.email,
            conversationId,
            messageId: message.id,
          },
        },
      });

      // 8. Activity: Conversation Created or Reply Added
      if (isNewConversation) {
        await tx.activity.create({
          data: {
            type: ActivityType.NOTE,
            title: "Conversation Created From Campaign",
            content: `Created conversation from campaign reply by ${contact.email}.`,
            userId: currentUserId,
            metadata: {
              campaignId,
              conversationId,
              contactId: contact.id,
            },
          },
        });
      } else {
        await tx.activity.create({
          data: {
            type: ActivityType.NOTE,
            title: "Campaign Reply Added To Existing Conversation",
            content: `Campaign reply from ${contact.email} added to existing conversation.`,
            userId: currentUserId,
            metadata: {
              campaignId,
              conversationId,
              contactId: contact.id,
            },
          },
        });
      }

      return {
        conversationId,
        messageId: message.id,
        contactId: contact.id,
        campaignRecipientStatus: "REPLIED",
      };
    });

    return outcome;
  }
}

export const campaignReplyService = new CampaignReplyService(campaignReplyRepository);
