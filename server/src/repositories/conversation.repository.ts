import { Conversation, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { QueryConversationInput } from "../validators/conversation.validator";

export interface ConversationListResult {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const conversationInclude = {
  assignedUser: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
  contact: {
    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
  },
};

export class ConversationRepository {
  async findById(id: string): Promise<Conversation | null> {
    return prisma.conversation.findUnique({
      where: { id },
      include: conversationInclude,
    });
  }

  async findAll(query: QueryConversationInput): Promise<ConversationListResult> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ConversationWhereInput = {};

    // Search subject, contact first/last name, or contact email
    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: "insensitive" } },
        {
          contact: {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.channel) {
      where.channel = query.channel;
    }

    if (query.assignedUserId) {
      where.assignedUserId = query.assignedUserId;
    }

    if (query.contactId) {
      where.contactId = query.contactId;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: conversationInclude,
      }),
      prisma.conversation.count({ where }),
    ]);

    return {
      conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(data: Prisma.ConversationCreateInput): Promise<Conversation> {
    return prisma.conversation.create({
      data,
      include: conversationInclude,
    });
  }

  async update(id: string, data: Prisma.ConversationUpdateInput): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id },
      data,
      include: conversationInclude,
    });
  }

  async delete(id: string): Promise<Conversation> {
    return prisma.conversation.delete({
      where: { id },
    });
  }
}

export const conversationRepository = new ConversationRepository();
