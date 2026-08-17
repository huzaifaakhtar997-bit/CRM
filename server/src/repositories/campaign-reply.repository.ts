import { Campaign, CampaignRecipient, Conversation, Message, Contact } from "@prisma/client";
import { prisma } from "../config/database";

export class CampaignReplyRepository {
  async findCampaignById(id: string): Promise<Campaign | null> {
    return prisma.campaign.findUnique({
      where: { id },
    });
  }

  async findRecipientAndContactByEmail(campaignId: string, email: string): Promise<(CampaignRecipient & { contact: Contact }) | null> {
    return prisma.campaignRecipient.findFirst({
      where: {
        campaignId,
        contact: {
          email: { equals: email, mode: "insensitive" },
        },
      },
      include: {
        contact: true,
      },
    });
  }

  async findExistingConversation(contactId: string): Promise<Conversation | null> {
    return prisma.conversation.findFirst({
      where: {
        contactId,
      },
      orderBy: { updatedAt: "desc" },
    });
  }
}

export const campaignReplyRepository = new CampaignReplyRepository();
