import { api } from "./axios";
import { Conversation, Message, ListResponse, ConversationChannel, ConversationStatus, SenderType } from "../types/api.types";

export interface QueryConversationInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: ConversationStatus;
  channel?: ConversationChannel;
  assignedUserId?: string;
  contactId?: string;
}

export interface QueryMessageInput {
  page?: number;
  limit?: number;
  search?: string;
}

export const conversationsApi = {
  // Conversations
  getConversations: async (params?: QueryConversationInput): Promise<ListResponse<Conversation>['data']> => {
    const res = await api.get<ListResponse<Conversation>>("/conversations", { params });
    return res.data.data;
  },

  getConversationById: async (id: string): Promise<Conversation> => {
    const res = await api.get<{ success: boolean; data: { conversation: Conversation } }>(`/conversations/${id}`);
    return res.data.data.conversation;
  },

  createConversation: async (data: Partial<Conversation>): Promise<Conversation> => {
    const res = await api.post<{ success: boolean; data: { conversation: Conversation } }>("/conversations", data);
    return res.data.data.conversation;
  },

  updateConversation: async (id: string, data: Partial<Conversation>): Promise<Conversation> => {
    const res = await api.patch<{ success: boolean; data: { conversation: Conversation } }>(`/conversations/${id}`, data);
    return res.data.data.conversation;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await api.delete(`/conversations/${id}`);
  },

  // Messages
  getMessages: async (conversationId: string, params?: QueryMessageInput): Promise<ListResponse<Message>['data']> => {
    const res = await api.get<ListResponse<Message>>(`/conversations/${conversationId}/messages`, { params });
    return res.data.data;
  },

  createMessage: async (
    conversationId: string, 
    data: { content: string; senderType: SenderType; isInternalNote?: boolean; senderName?: string; senderEmail?: string }
  ): Promise<Message> => {
    const res = await api.post<{ success: boolean; data: { message: Message } }>(`/conversations/${conversationId}/messages`, data);
    return res.data.data.message;
  },

  updateMessage: async (id: string, data: { content: string }): Promise<Message> => {
    const res = await api.patch<{ success: boolean; data: { message: Message } }>(`/messages/${id}`, data);
    return res.data.data.message;
  },

  deleteMessage: async (id: string): Promise<void> => {
    await api.delete(`/messages/${id}`);
  }
};
