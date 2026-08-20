import { api } from "./axios";

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export const usersApi = {
  getAllUsers: async () => {
    const res = await api.get<{ success: boolean; data: { users: CRMUser[] } }>("/users");
    return res.data.data.users;
  },

  getUserById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: { user: CRMUser } }>(`/users/${id}`);
    return res.data.data.user;
  },

  updateUser: async (id: string, data: { name?: string; phone?: string | null; avatarUrl?: string | null }) => {
    const res = await api.patch<{ success: boolean; data: { user: CRMUser } }>(`/users/${id}`, data);
    return res.data.data.user;
  },

  updateUserStatus: async (id: string, status: "ACTIVE" | "INACTIVE") => {
    const res = await api.patch<{ success: boolean; data: { user: CRMUser } }>(`/users/${id}/status`, { status });
    return res.data.data.user;
  },

  updateUserRole: async (id: string, role: string) => {
    const res = await api.patch<{ success: boolean; data: { user: CRMUser } }>(`/users/${id}/role`, { role });
    return res.data.data.user;
  },

  updateUserPassword: async (id: string, password: string) => {
    const res = await api.patch<{ success: boolean; data: { user: CRMUser } }>(`/users/${id}/password`, { password });
    return res.data.data.user;
  },
};
