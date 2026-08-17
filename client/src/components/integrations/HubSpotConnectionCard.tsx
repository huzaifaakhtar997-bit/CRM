import React, { useState } from "react";
import { IntegrationStatus } from "../../types/api.types";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Plug,
  Unplug,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "../ui/button";

interface HubSpotConnectionCardProps {
  status: IntegrationStatus | null;
  loading: boolean;
  onConnect: (token: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  canWrite: boolean;
}

export const HubSpotConnectionCard: React.FC<HubSpotConnectionCardProps> = ({
  status,
  loading,
  onConnect,
  onDisconnect,
  canWrite,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = status?.status === "CONNECTED";

  const handleConnect = async () => {
    if (!token.trim()) {
      setError("Access token is required.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await onConnect(token.trim());
      setShowForm(false);
      setToken("");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to connect HubSpot.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect HubSpot? All sync functionality will be unavailable.")) return;
    setDisconnecting(true);
    setError(null);
    try {
      await onDisconnect();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to disconnect HubSpot.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-black text-lg border border-orange-100">
              HS
            </div>
            <div>
              <h3 className="font-bold text-foreground">HubSpot</h3>
              <p className="text-xs text-muted-foreground">CRM Integration</p>
            </div>
          </div>

          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              {isConnected ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isConnected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
                <p className="font-medium text-emerald-600">Active</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Sync</span>
                <p className="font-medium text-foreground">
                  {status?.lastSyncAt
                    ? new Date(status.lastSyncAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                    : "Never"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Connected Since</span>
                <p className="font-medium text-foreground">
                  {status?.createdAt
                    ? new Date(status.createdAt).toLocaleDateString([], { dateStyle: "medium" })
                    : "—"}
                </p>
              </div>
            </div>

            {canWrite && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
              >
                {disconnecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Unplug className="w-4 h-4 mr-2" />
                )}
                Disconnect HubSpot
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your HubSpot account using a Private App access token to enable bidirectional sync of Contacts, Companies, and Deals.
            </p>

            <a
              href="https://developers.hubspot.com/docs/api/private-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              How to create a Private App token
              <ExternalLink className="w-3 h-3" />
            </a>

            {canWrite && (
              <>
                {!showForm ? (
                  <Button onClick={() => setShowForm(true)} size="sm">
                    <Plug className="w-4 h-4 mr-2" />
                    Connect HubSpot
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 bg-accent/30 rounded-lg border">
                    <label className="text-sm font-medium text-foreground">
                      Private App Access Token
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleConnect}
                        disabled={connecting || !token.trim()}
                      >
                        {connecting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plug className="w-4 h-4 mr-2" />
                        )}
                        Connect
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setShowForm(false); setToken(""); setError(null); }}
                        disabled={connecting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {!canWrite && (
              <p className="text-xs text-muted-foreground italic">
                Only Admins and Managers can connect integrations.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
