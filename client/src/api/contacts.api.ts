import { api } from "./axios";
import { Contact, ListResponse } from "../types/api.types";

export interface QueryContactInput {
  page?: number;
  limit?: number;
  search?: string;
  lifecycleStage?: string;
  assignedUserId?: string;
  companyId?: string;
}

export const contactsApi = {
  getContacts: async (params?: QueryContactInput): Promise<ListResponse<Contact>['data']> => {
    const res = await api.get<ListResponse<Contact>>("/contacts", { params });
    return res.data.data;
  },

  getContactById: async (id: string): Promise<Contact> => {
    const res = await api.get<{ success: boolean; data: { contact: Contact } }>(`/contacts/${id}`);
    return res.data.data.contact;
  },

  createContact: async (data: Partial<Contact>): Promise<Contact> => {
    const res = await api.post<{ success: boolean; data: { contact: Contact } }>("/contacts", data);
    return res.data.data.contact;
  },

  updateContact: async (id: string, data: Partial<Contact>): Promise<Contact> => {
    const res = await api.patch<{ success: boolean; data: { contact: Contact } }>(`/contacts/${id}`, data);
    return res.data.data.contact;
  },

  exportContacts: async (params?: QueryContactInput): Promise<Blob> => {
    const res = await api.get("/contacts/export", {
      params,
      responseType: "blob",
    });
    return res.data;
  },

  deleteContact: async (id: string): Promise<void> => {
    await api.delete(`/contacts/${id}`);
  }
};
