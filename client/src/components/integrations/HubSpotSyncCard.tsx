import React, { useState } from "react";
import { SyncStatusDetails, SyncSummary } from "../../types/api.types";
import { RefreshCw, Upload, Download, ArrowLeftRight, CheckCircle2, XCircle, AlertCircle, Loader2, Clock } from "lucide-react";
import { Button } from "../ui/button";

type SyncEntityType = "contacts" | "companies" | "deals";

interface EntitySyncProps {
  label: string;
  entityType: SyncEntityType;
  syncStatus: SyncStatusDetails | null;
  statusLoading: boolean;
  canWrite: boolean;
  onImport: () => Promise<SyncSummary>;
  onExport: () => Promise<SyncSummary>;
  onSync: () => Promise<SyncSummary>;
}

const SyncResultBadge: React.FC<{ result: SyncSummary | null }> = ({ result }) => {
  if (!result) return null;
  return (
    <div className="mt-3 p-3 bg-accent/40 rounded-lg border text-xs grid grid-cols-4 gap-2 text-center">
      <div>
        <div className="font-bold text-foreground text-base">{result.created}</div>
        <div className="text-muted-foreground mt-0.5">Created</div>
      </div>
      <div>
        <div className="font-bold text-foreground text-base">{result.updated}</div>
        <div className="text-muted-foreground mt-0.5">Updated</div>
      </div>
      <div>
        <div className="font-bold text-amber-600 text-base">{result.skipped}</div>
        <div className="text-muted-foreground mt-0.5">Skipped</div>
      </div>
      <div>
        <div className={`font-bold text-base ${result.failed > 0 ? "text-destructive" : "text-muted-foreground"}`}>{result.failed}</div>
        <div className="text-muted-foreground mt-0.5">Failed</div>
      </div>
    </div>
  );
};

const EntitySyncRow: React.FC<EntitySyncProps> = ({
  label,
  syncStatus,
  statusLoading,
  canWrite,
  onImport,
  onExport,
  onSync,
}) => {
  const [activeOp, setActiveOp] = useState<"import" | "export" | "sync" | null>(null);
  const [lastResult, setLastResult] = useState<SyncSummary | null>(null);
  const [opError, setOpError] = useState<string | null>(null);

  const run = async (op: "import" | "export" | "sync") => {
    setActiveOp(op);
    setLastResult(null);
    setOpError(null);
    try {
      const fn = op === "import" ? onImport : op === "export" ? onExport : onSync;
      const result = await fn();
      setLastResult(result);
    } catch (err: any) {
      setOpError(err.response?.data?.message || err.message || `${op} failed.`);
    } finally {
      setActiveOp(null);
    }
  };

  const latestLog = syncStatus?.latestLog;
  const busy = activeOp !== null;

  return (
    <div className="border rounded-xl p-5 bg-background space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-foreground">{label}</h4>
          {statusLoading ? (
            <div className="h-3 w-24 bg-accent animate-pulse rounded mt-1.5" />
          ) : latestLog ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              {latestLog.status === "SUCCESS" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-destructive" />
              )}
              <span>
                Last: {new Date(latestLog.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </span>
              {latestLog.message && (
                <span className="truncate max-w-[200px]" title={latestLog.message}>
                  — {latestLog.message}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">No sync history</p>
          )}
        </div>

        {!statusLoading && syncStatus?.lastSyncAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(syncStatus.lastSyncAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {opError && (
        <div className="p-2.5 bg-destructive/10 text-destructive text-xs rounded-md flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{opError}</span>
        </div>
      )}

      {canWrite && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => run("import")}
            disabled={busy}
            className="text-xs"
          >
            {activeOp === "import" ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5" />
            )}
            Import from HubSpot
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => run("export")}
            disabled={busy}
            className="text-xs"
          >
            {activeOp === "export" ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 mr-1.5" />
            )}
            Export to HubSpot
          </Button>
          <Button
            size="sm"
            onClick={() => run("sync")}
            disabled={busy}
            className="text-xs"
          >
            {activeOp === "sync" ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" />
            )}
            Bidirectional Sync
          </Button>
        </div>
      )}

      <SyncResultBadge result={lastResult} />
    </div>
  );
};

interface HubSpotSyncCardProps {
  isConnected: boolean;
  contactSyncStatus: SyncStatusDetails | null;
  companySyncStatus: SyncStatusDetails | null;
  dealSyncStatus: SyncStatusDetails | null;
  statusLoading: boolean;
  canWrite: boolean;
  onImportContacts: () => Promise<SyncSummary>;
  onExportContacts: () => Promise<SyncSummary>;
  onSyncContacts: () => Promise<SyncSummary>;
  onImportCompanies: () => Promise<SyncSummary>;
  onExportCompanies: () => Promise<SyncSummary>;
  onSyncCompanies: () => Promise<SyncSummary>;
  onImportDeals: () => Promise<SyncSummary>;
  onExportDeals: () => Promise<SyncSummary>;
  onSyncDeals: () => Promise<SyncSummary>;
}

export const HubSpotSyncCard: React.FC<HubSpotSyncCardProps> = ({
  isConnected,
  contactSyncStatus,
  companySyncStatus,
  dealSyncStatus,
  statusLoading,
  canWrite,
  onImportContacts,
  onExportContacts,
  onSyncContacts,
  onImportCompanies,
  onExportCompanies,
  onSyncCompanies,
  onImportDeals,
  onExportDeals,
  onSyncDeals,
}) => {
  return (
    <div className="bg-card border rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-bold text-foreground">Data Synchronization</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Import from HubSpot, export CRM data to HubSpot, or run a full bidirectional sync.
        </p>
      </div>

      <div className="p-6 space-y-4">
        {!isConnected ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
            Connect HubSpot to enable data synchronization.
          </div>
        ) : (
          <>
            <EntitySyncRow
              label="Contacts"
              entityType="contacts"
              syncStatus={contactSyncStatus}
              statusLoading={statusLoading}
              canWrite={canWrite}
              onImport={onImportContacts}
              onExport={onExportContacts}
              onSync={onSyncContacts}
            />
            <EntitySyncRow
              label="Companies"
              entityType="companies"
              syncStatus={companySyncStatus}
              statusLoading={statusLoading}
              canWrite={canWrite}
              onImport={onImportCompanies}
              onExport={onExportCompanies}
              onSync={onSyncCompanies}
            />
            <EntitySyncRow
              label="Deals"
              entityType="deals"
              syncStatus={dealSyncStatus}
              statusLoading={statusLoading}
              canWrite={canWrite}
              onImport={onImportDeals}
              onExport={onExportDeals}
              onSync={onSyncDeals}
            />
          </>
        )}
      </div>
    </div>
  );
};
