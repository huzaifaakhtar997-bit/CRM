import React, { useState } from "react";
import { HubSpotMappings, FieldMapping, StageMapping } from "../../types/api.types";
import { Save, Loader2, AlertCircle, CheckCircle2, Map } from "lucide-react";
import { Button } from "../ui/button";

interface IntegrationMappingsProps {
  mappings: HubSpotMappings | null;
  loading: boolean;
  isConnected: boolean;
  canWrite: boolean;
  onSave: (payload: HubSpotMappings) => Promise<void>;
}

// Valid CRM fields per entity (matches backend VALID_FIELDS)
const VALID_FIELDS: Record<string, string[]> = {
  contact: ["firstName", "lastName", "email", "phone", "jobTitle"],
  company: ["name", "industry", "website", "domain", "phone", "annualRevenue", "description"],
  deal: ["title", "value", "expectedCloseDate"],
};

export const IntegrationMappings: React.FC<IntegrationMappingsProps> = ({
  mappings,
  loading,
  isConnected,
  canWrite,
  onSave,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [localMappings, setLocalMappings] = useState<HubSpotMappings | null>(null);

  // Use local edits if present, otherwise fall back to server data
  const display = localMappings ?? mappings;

  const handleFieldMappingChange = (
    idx: number,
    field: keyof FieldMapping,
    value: string
  ) => {
    if (!display) return;
    const updated = display.fieldMappings.map((m, i) =>
      i === idx ? { ...m, [field]: value } : m
    );
    setLocalMappings({ ...display, fieldMappings: updated });
  };

  const handleStageMappingChange = (
    idx: number,
    field: keyof StageMapping,
    value: string
  ) => {
    if (!display) return;
    const updated = display.stageMappings.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    setLocalMappings({ ...display, stageMappings: updated });
  };

  const handleSave = async () => {
    if (!display) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await onSave(display);
      setSuccess(true);
      setLocalMappings(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save mappings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-bold text-foreground">Field Mappings</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Configure how CRM fields map to HubSpot properties for each entity type.
        </p>
      </div>

      <div className="p-6">
        {!isConnected ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Connect HubSpot to configure field mappings.
          </p>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-accent animate-pulse rounded-md" />
            ))}
          </div>
        ) : !display ? (
          <p className="text-sm text-muted-foreground text-center py-8">No mappings configured.</p>
        ) : (
          <div className="space-y-8">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-md flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Mappings saved successfully.</span>
              </div>
            )}

            {/* Field Mappings */}
            {display.fieldMappings.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Field Mappings</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-accent/30 border-b text-xs text-muted-foreground uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Entity</th>
                        <th className="px-4 py-3 text-left font-medium">CRM Field</th>
                        <th className="px-4 py-3 text-left font-medium">HubSpot Property</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {display.fieldMappings.map((mapping, idx) => (
                        <tr key={idx} className="hover:bg-accent/20">
                          <td className="px-4 py-3">
                            <span className="text-xs uppercase font-semibold text-muted-foreground">
                              {mapping.entityType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {canWrite ? (
                              <select
                                value={mapping.crmField}
                                onChange={(e) => handleFieldMappingChange(idx, "crmField", e.target.value)}
                                className="h-8 rounded border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
                              >
                                {(VALID_FIELDS[mapping.entityType] || []).map((f) => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            ) : (
                              <code className="text-xs bg-accent px-1.5 py-0.5 rounded">{mapping.crmField}</code>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {canWrite ? (
                              <input
                                type="text"
                                value={mapping.hubspotProperty}
                                onChange={(e) => handleFieldMappingChange(idx, "hubspotProperty", e.target.value)}
                                className="h-8 w-full rounded border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 font-mono"
                              />
                            ) : (
                              <code className="text-xs bg-accent px-1.5 py-0.5 rounded">{mapping.hubspotProperty}</code>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Stage Mappings */}
            {display.stageMappings.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Pipeline Stage Mappings</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-accent/30 border-b text-xs text-muted-foreground uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">CRM Stage</th>
                        <th className="px-4 py-3 text-left font-medium">HubSpot Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {display.stageMappings.map((stage, idx) => (
                        <tr key={idx} className="hover:bg-accent/20">
                          <td className="px-4 py-3">
                            {canWrite ? (
                              <input
                                type="text"
                                value={stage.pipelineStageName}
                                onChange={(e) => handleStageMappingChange(idx, "pipelineStageName", e.target.value)}
                                className="h-8 w-full rounded border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
                              />
                            ) : (
                              <code className="text-xs bg-accent px-1.5 py-0.5 rounded">{stage.pipelineStageName}</code>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {canWrite ? (
                              <input
                                type="text"
                                value={stage.hubspotStage}
                                onChange={(e) => handleStageMappingChange(idx, "hubspotStage", e.target.value)}
                                className="h-8 w-full rounded border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 font-mono"
                              />
                            ) : (
                              <code className="text-xs bg-accent px-1.5 py-0.5 rounded">{stage.hubspotStage}</code>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {canWrite && localMappings && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Mappings
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
