import axios, { AxiosError, AxiosInstance } from "axios";
import { AppError } from "../types/auth.types";

export interface HubspotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    jobtitle?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubspotCompany {
  id: string;
  properties: {
    name?: string;
    website?: string;
    industry?: string;
    phone?: string;
    email?: string;
    address?: string;
    size?: string;
    annualrevenue?: string;
    description?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubspotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export class HubspotClient {
  private getClient(accessToken: string): AxiosInstance {
    if (!accessToken || accessToken.trim() === "") {
      throw new AppError("HubSpot API Error: Unauthorized access token.", 401);
    }
    return axios.create({
      baseURL: "https://api.hubapi.com/crm/v3/objects",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      if (status === 401) {
        throw new AppError("HubSpot API Error: Unauthorized access token.", 401);
      }
      if (status === 403) {
        throw new AppError("HubSpot API Error: Insufficient permissions.", 403);
      }
      if (status === 404) {
        throw new AppError("HubSpot API Error: Resource not found.", 404);
      }
      if (status === 409) {
        throw new AppError(`HubSpot API Error: Conflict. ${message}`, 409);
      }
      if (status === 429) {
        throw new AppError("HubSpot API Error: Rate limit exceeded.", 429);
      }
      throw new AppError(`HubSpot API Error: ${message}`, status || 500);
    }
    throw new AppError("HubSpot API Error: An unexpected error occurred.", 500);
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const client = this.getClient(accessToken);
      // Validate by making a lightweight request
      await client.get("/contacts", { params: { limit: 1 } });
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTACTS
  // ─────────────────────────────────────────────────────────────────────────────

  async getContacts(accessToken: string): Promise<HubspotContact[]> {
    try {
      const client = this.getClient(accessToken);
      const response = await client.get("/contacts", {
        params: {
          limit: 100,
          properties: "firstname,lastname,email,phone,jobtitle",
        },
      });
      return response.data.results;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createContact(accessToken: string, properties: any): Promise<HubspotContact> {
    try {
      if (!properties.email) {
        throw new AppError("HubSpot API Error: email field is required.", 400);
      }
      const client = this.getClient(accessToken);
      const response = await client.post("/contacts", { properties });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateContact(accessToken: string, hubspotId: string, properties: any): Promise<HubspotContact> {
    try {
      const client = this.getClient(accessToken);
      const response = await client.patch(`/contacts/${hubspotId}`, { properties });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPANIES
  // ─────────────────────────────────────────────────────────────────────────────

  async getCompanies(accessToken: string): Promise<HubspotCompany[]> {
    try {
      const client = this.getClient(accessToken);
      const response = await client.get("/companies", {
        params: {
          limit: 100,
          properties: "name,website,industry,phone,email,address,size,annualrevenue,description",
        },
      });
      return response.data.results;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createCompany(accessToken: string, properties: any): Promise<HubspotCompany> {
    try {
      if (!properties.name) {
        throw new AppError("HubSpot API Error: name field is required.", 400);
      }
      const client = this.getClient(accessToken);
      const response = await client.post("/companies", { properties });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateCompany(accessToken: string, hubspotId: string, properties: any): Promise<HubspotCompany> {
    try {
      const client = this.getClient(accessToken);
      const response = await client.patch(`/companies/${hubspotId}`, { properties });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DEALS
  // ─────────────────────────────────────────────────────────────────────────────

  async getDeals(accessToken: string): Promise<HubspotDeal[]> {
    try {
      const client = this.getClient(accessToken);
      const response = await client.get("/deals", {
        params: {
          limit: 100,
          properties: "dealname,amount,dealstage,closedate",
        },
      });
      return response.data.results;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createDeal(accessToken: string, properties: any): Promise<HubspotDeal> {
    try {
      if (!properties.dealname) {
        throw new AppError("HubSpot API Error: dealname field is required.", 400);
      }
      const client = this.getClient(accessToken);
      const response = await client.post("/deals", { properties });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateDeal(accessToken: string, hubspotId: string, properties: any): Promise<HubspotDeal> {
    try {
      const client = this.getClient(accessToken);
      const response = await client.patch(`/deals/${hubspotId}`, { properties });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const hubspotClient = new HubspotClient();
