import { api } from "./axios";
import {
  IntegrationStatus,
  SyncStatusDetails,
  SyncSummary,
  HubSpotMappings,
} from "../types/api.types";

export const integrationsApi = {
  // GET /api/v1/integrations/hubspot
  // Returns connection meta. 404 if no record exists yet.
  getHubspotStatus: async (): Promise<IntegrationStatus> => {
    const res = await api.get("/integrations/hubspot");
    return res.data.data;
  },

  // POST /api/v1/integrations/hubspot/connect
  // Body: { accessToken: string } — HubSpot Private App token
  connectHubspot: async (accessToken: string): Promise<IntegrationStatus> => {
    const res = await api.post("/integrations/hubspot/connect", { accessToken });
    return res.data.data;
  },

  // DELETE /api/v1/integrations/hubspot
  disconnectHubspot: async (): Promise<IntegrationStatus> => {
    const res = await api.delete("/integrations/hubspot");
    return res.data.data;
  },

  // ── Sync Status endpoints ────────────────────────────────────────────────────

  getContactSyncStatus: async (): Promise<SyncStatusDetails> => {
    const res = await api.get("/integrations/hubspot/contacts/sync-status");
    return res.data.data;
  },

  getCompanySyncStatus: async (): Promise<SyncStatusDetails> => {
    const res = await api.get("/integrations/hubspot/companies/sync-status");
    return res.data.data;
  },

  getDealSyncStatus: async (): Promise<SyncStatusDetails> => {
    const res = await api.get("/integrations/hubspot/deals/sync-status");
    return res.data.data;
  },

  // ── Contact Sync Actions ─────────────────────────────────────────────────────

  importContacts: async (): Promise<SyncSummary> => {
    const res = await api.post("/integrations/hubspot/contacts/import");
    return res.data.data;
  },

  exportContacts: async (): Promise<SyncSummary> => {
    const res = await api.post("/integrations/hubspot/contacts/export");
    return res.data.data;
  },

  syncContacts: async (): Promise<SyncSummary> => {
    const res = await api.post("/integrations/hubspot/contacts/sync");
    return res.data.data;
  },

  // ── Company Sync Actions ─────────────────────────────────────────────────────

  importCompanies: async (): Promise<SyncSummary> => {
    const res = await api.post("/integrations/hubspot/companies/import");
    return res.data.data;
  },

  exportCompanies: async (): Promise<SyncSummary> => {
    const res = await api.post("/integrations/hubspot/companies/export");
    return res.data.data;
  },

  syncCompanies: async (): Promise<SyncSummary> => {
    const res = await api.post("/integrations/hubspot/companies/sync");
    return res.data.data;
  },

  // ── Deal Sync Actions ────────────────────────────────────────────────────────

  importDeals: async (): Promise<SyncSummary> => {
    const res = await api.post("/integrations/hubspot/deals/import");
    return res.data.data;
  },

  exportDeals: async (): Promise<SyncSummary> => {
    const res = await api.post("/integrations/hubspot/deals/export");
    return res.data.data;
  },

  syncDeals: async (): Promise<SyncSummary> => {
    const res = await api.post("/integrations/hubspot/deals/sync");
    return res.data.data;
  },

  // ── Field / Stage Mappings ───────────────────────────────────────────────────

  getMappings: async (): Promise<HubSpotMappings> => {
    const res = await api.get("/integrations/hubspot/mappings");
    return res.data.data;
  },

  updateMappings: async (payload: HubSpotMappings): Promise<HubSpotMappings> => {
    const res = await api.put("/integrations/hubspot/mappings", payload);
    return res.data.data;
  },
};
