import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { integrationsApi } from "../api/integrations.api";
import {
  IntegrationStatus,
  SyncStatusDetails,
  HubSpotMappings,
  SyncSummary,
} from "../types/api.types";
import { HubSpotConnectionCard } from "../components/integrations/HubSpotConnectionCard";
import { HubSpotSyncCard } from "../components/integrations/HubSpotSyncCard";
import { IntegrationMappings } from "../components/integrations/IntegrationMappings";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Integrations() {
  const { user } = useAuth();

  // RBAC: read = ADMIN, MANAGER, SUPPORT; write = ADMIN, MANAGER
  const canRead = ["ADMIN", "MANAGER", "SUPPORT"].includes(user?.role || "");
  const canWrite = ["ADMIN", "MANAGER"].includes(user?.role || "");

  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [contactSync, setContactSync] = useState<SyncStatusDetails | null>(null);
  const [companySync, setCompanySync] = useState<SyncStatusDetails | null>(null);
  const [dealSync, setDealSync] = useState<SyncStatusDetails | null>(null);
  const [syncStatusLoading, setSyncStatusLoading] = useState(false);

  const [mappings, setMappings] = useState<HubSpotMappings | null>(null);
  const [mappingsLoading, setMappingsLoading] = useState(false);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await integrationsApi.getHubspotStatus();
      setStatus(data);
    } catch (err: any) {
      // 404 means no connection record exists yet — treat as disconnected
      if (err.response?.status === 404) {
        setStatus(null);
      } else {
        setStatusError(err.response?.data?.message || err.message || "Failed to load integration status.");
      }
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadSyncStatuses = useCallback(async () => {
    setSyncStatusLoading(true);
    try {
      const [c, co, d] = await Promise.allSettled([
        integrationsApi.getContactSyncStatus(),
        integrationsApi.getCompanySyncStatus(),
        integrationsApi.getDealSyncStatus(),
      ]);
      if (c.status === "fulfilled") setContactSync(c.value);
      if (co.status === "fulfilled") setCompanySync(co.value);
      if (d.status === "fulfilled") setDealSync(d.value);
    } finally {
      setSyncStatusLoading(false);
    }
  }, []);

  const loadMappings = useCallback(async () => {
    setMappingsLoading(true);
    try {
      const data = await integrationsApi.getMappings();
      setMappings(data);
    } catch {
      // Non-critical — fail silently
    } finally {
      setMappingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const isConnected = status?.status === "CONNECTED";

  useEffect(() => {
    if (isConnected) {
      loadSyncStatuses();
      loadMappings();
    }
  }, [isConnected, loadSyncStatuses, loadMappings]);

  const handleConnect = async (token: string) => {
    const updated = await integrationsApi.connectHubspot(token);
    setStatus(updated);
  };

  const handleDisconnect = async () => {
    const updated = await integrationsApi.disconnectHubspot();
    setStatus(updated);
    setContactSync(null);
    setCompanySync(null);
    setDealSync(null);
    setMappings(null);
  };

  const handleSaveMappings = async (payload: HubSpotMappings) => {
    const updated = await integrationsApi.updateMappings(payload);
    setMappings(updated);
  };

  // Refresh sync status after a sync action completes
  const withRefresh = (fn: () => Promise<SyncSummary>): (() => Promise<SyncSummary>) => async () => {
    const result = await fn();
    // Refresh sync statuses in background
    loadSyncStatuses().catch(() => {});
    return result;
  };

  if (!canRead) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-10 h-10 text-destructive/50 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground mt-2">
          You don't have permission to view Integrations. Contact your Administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Manage external service connections and data synchronization.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { loadStatus(); if (isConnected) { loadSyncStatuses(); loadMappings(); } }}
          disabled={statusLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${statusLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {statusError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Failed to load integration status</p>
            <p className="text-sm mt-1 opacity-80">{statusError}</p>
            <button
              onClick={loadStatus}
              className="text-sm underline mt-2 hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Connection Card */}
      <HubSpotConnectionCard
        status={status}
        loading={statusLoading}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        canWrite={canWrite}
      />

      {/* Sync Card — only shown when connected or syncs have happened */}
      <HubSpotSyncCard
        isConnected={isConnected}
        contactSyncStatus={contactSync}
        companySyncStatus={companySync}
        dealSyncStatus={dealSync}
        statusLoading={syncStatusLoading}
        canWrite={canWrite}
        onImportContacts={withRefresh(integrationsApi.importContacts)}
        onExportContacts={withRefresh(integrationsApi.exportContacts)}
        onSyncContacts={withRefresh(integrationsApi.syncContacts)}
        onImportCompanies={withRefresh(integrationsApi.importCompanies)}
        onExportCompanies={withRefresh(integrationsApi.exportCompanies)}
        onSyncCompanies={withRefresh(integrationsApi.syncCompanies)}
        onImportDeals={withRefresh(integrationsApi.importDeals)}
        onExportDeals={withRefresh(integrationsApi.exportDeals)}
        onSyncDeals={withRefresh(integrationsApi.syncDeals)}
      />

      {/* Mappings — only shown when connected */}
      {isConnected && (
        <IntegrationMappings
          mappings={mappings}
          loading={mappingsLoading}
          isConnected={isConnected}
          canWrite={canWrite}
          onSave={handleSaveMappings}
        />
      )}
    </div>
  );
}
