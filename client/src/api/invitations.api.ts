import { api } from "./axios";

export interface UserInvitation {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  isAccepted: boolean;
  acceptedAt: string | null;
  createdAt: string;
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateInvitationResponse {
  invitation: UserInvitation;
  inviteUrl: string;
  emailSent: boolean;
}

export interface ValidateTokenResponse {
  valid: boolean;
  message?: string;
  email?: string;
  role?: string;
  invitedBy?: string;
  expiresAt?: string;
}

export const invitationsApi = {
  createInvitation: async (data: { email: string; role: string }) => {
    const res = await api.post<{ success: boolean; message: string; data: CreateInvitationResponse }>("/invitations", data);
    return res.data.data;
  },

  getInvitations: async () => {
    const res = await api.get<{ success: boolean; data: UserInvitation[] }>("/invitations");
    return res.data.data;
  },

  revokeInvitation: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/invitations/${id}`);
    return res.data;
  },

  validateToken: async (token: string) => {
    const res = await api.get<{ success: boolean; data: ValidateTokenResponse }>(`/invitations/validate?token=${encodeURIComponent(token)}`);
    return res.data.data;
  },

  registerWithInvite: async (data: {
    token: string;
    name: string;
    password: string;
    phone?: string;
    avatarUrl?: string;
  }) => {
    const res = await api.post<{
      success: boolean;
      message: string;
      data: {
        user: any;
        token: string;
      };
    }>("/invitations/accept", data);
    return res.data.data;
  },
};
