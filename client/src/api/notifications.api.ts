import { api } from "./axios";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
  userId: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export const notificationsApi = {
  getNotifications: async (params?: GetNotificationsParams) => {
    const res = await api.get<{
      success: boolean;
      data: { notifications: Notification[]; total: number; page: number; limit: number };
    }>("/notifications", { params });
    return res.data.data;
  },

  getUnreadCount: async () => {
    const res = await api.get<{ success: boolean; data: { count: number } }>("/notifications/unread-count");
    return res.data.data.count;
  },

  markAsRead: async (id: string) => {
    const res = await api.patch<{ success: boolean; data: { notification: Notification } }>(`/notifications/${id}/read`);
    return res.data.data.notification;
  },

  markAllAsRead: async () => {
    const res = await api.patch<{ success: boolean; data: { updatedCount: number } }>("/notifications/read-all");
    return res.data.data.updatedCount;
  },

  deleteNotification: async (id: string) => {
    await api.delete(`/notifications/${id}`);
  },
};
