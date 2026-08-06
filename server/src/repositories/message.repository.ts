import { Message, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { QueryMessageInput } from "../validators/message.validator";

export interface MessageListResult {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class MessageRepository {
  async findById(id: string): Promise<Message | null> {
    return prisma.message.findUnique({
      where: { id },
      include: {
        conversation: {
          select: { id: true, subject: true },
        },
      },
    });
  }

  async findByConversation(
    conversationId: string,
    query: QueryMessageInput
  ): Promise<MessageListResult> {
    const page = query.page || 1;
    const limit = query.limit || 15;
    const skip = (page - 1) * limit;

    const where: Prisma.MessageWhereInput = {
      conversationId,
    };

    if (query.search) {
      where.content = { contains: query.search, mode: "insensitive" };
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" }, // Thread view usually ordered oldest first
      }),
      prisma.message.count({ where }),
    ]);

    return {
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(data: Prisma.MessageUncheckedCreateInput): Promise<Message> {
    return prisma.message.create({
      data,
    });
  }

  async update(id: string, data: Prisma.MessageUpdateInput): Promise<Message> {
    return prisma.message.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Message> {
    return prisma.message.delete({
      where: { id },
    });
  }
}

export const messageRepository = new MessageRepository();
