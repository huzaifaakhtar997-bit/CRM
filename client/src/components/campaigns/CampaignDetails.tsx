import React, { useState, useEffect } from "react";
import { Campaign, CampaignRecipient, CampaignTrackingSummary, CampaignRecipientStatus } from "../../types/api.types";
import { campaignsApi, AudienceFilters } from "../../api/campaigns.api";
import { X, Loader2, Play, Users, Send, CheckCircle2, MailOpen, MousePointerClick, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { getCampaignStatusBadge } from "./CampaignTable";

interface CampaignDetailsProps {
  campaignId: string | null;
  isOpen: boolean;
  onClose: () => void;
  canWrite: boolean;
}

export const CampaignDetails: React.FC<CampaignDetailsProps> = ({ campaignId, isOpen, onClose, canWrite }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "audience" | "recipients">("overview");

  // Overview data
  const [tracking, setTracking] = useState<CampaignTrackingSummary | null>(null);
  const [launching, setLaunching] = useState(false);

  // Audience data
  const [audienceFilters, setAudienceFilters] = useState<AudienceFilters>({});
  const [previewData, setPreviewData] = useState<{ contacts: any[]; total: number } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [applying, setApplying] = useState(false);

  // Recipients data
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  useEffect(() => {
    if (isOpen && campaignId) {
      loadCampaignData();
      setActiveTab("overview");
    } else {
      setCampaign(null);
      setTracking(null);
      setPreviewData(null);
      setRecipients([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, campaignId]);

  useEffect(() => {
    if (isOpen && campaignId) {
      if (activeTab === "recipients") {
        loadRecipients();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadCampaignData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignsApi.getCampaignById(campaignId!);
      setCampaign(data);
      if (data.status !== "DRAFT") {
        const trackingData = await campaignsApi.getTrackingSummary(campaignId!);
        setTracking(trackingData);
      } else {
        setTracking(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load campaign.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const data = await campaignsApi.getRecipients(campaignId!, { limit: 100 });
      setRecipients(data.data.recipients || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleLaunch = async () => {
    if (!window.confirm("Are you sure you want to launch this campaign? This cannot be undone.")) return;
    setLaunching(true);
    try {
      await campaignsApi.launchCampaign(campaignId!);
      await loadCampaignData();
      alert("Campaign launched successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to launch campaign.");
    } finally {
      setLaunching(false);
    }
  };

  const handlePreviewAudience = async () => {
    setPreviewing(true);
    try {
      const res = await campaignsApi.previewAudience(campaignId!, audienceFilters);
      setPreviewData(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to preview audience.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleApplyAudience = async () => {
    if (!window.confirm("This will add all matching contacts to the campaign. Proceed?")) return;
    setApplying(true);
    try {
      const res = await campaignsApi.applyAudience(campaignId!, audienceFilters);
      alert(`Successfully added ${res.data.addedCount} new recipients.`);
      setPreviewData(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to apply audience.");
    } finally {
      setApplying(false);
    }
  };

  const handleRemoveRecipient = async (recipientId: string) => {
    if (!window.confirm("Remove this recipient?")) return;
    try {
      await campaignsApi.removeRecipient(campaignId!, recipientId);
      loadRecipients();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to remove recipient.");
    }
  };

  const handleStatusChange = async (recipientId: string, newStatus: string) => {
    try {
      await campaignsApi.updateRecipientStatus(campaignId!, recipientId, newStatus as CampaignRecipientStatus);
      loadRecipients();
      if (campaign?.status !== "DRAFT") {
        const trackingData = await campaignsApi.getTrackingSummary(campaignId!);
        setTracking(trackingData);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update status.");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-card border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-foreground">Campaign Details</h2>
            {campaign && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getCampaignStatusBadge(campaign.status)}`}>
                {campaign.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {campaign && (campaign.status === "DRAFT" || campaign.status === "SCHEDULED") && canWrite && (
              <Button onClick={handleLaunch} disabled={launching} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Launch Campaign
              </Button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b px-6 pt-2">
          {["overview", "audience", "recipients"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-accent/10">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
                {error}
                <button onClick={loadCampaignData} className="block mt-2 underline hover:no-underline">Retry</button>
              </div>
            </div>
          ) : campaign ? (
            <div className="p-6 space-y-6">
              
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="bg-card p-5 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-bold mb-4">{campaign.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block mb-1">Objective</span>
                        <span className="font-medium">{campaign.objective || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1">Email Subject</span>
                        <span className="font-medium">{campaign.subject || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1">Preview Text</span>
                        <span className="font-medium">{campaign.previewText || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1">Scheduled At</span>
                        <span className="font-medium">{campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString() : "—"}</span>
                      </div>
                    </div>
                  </div>

                  {tracking && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold">Tracking Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-card p-4 rounded-xl border shadow-sm text-center">
                          <Users className="w-5 h-5 mx-auto text-blue-500 mb-2" />
                          <div className="text-2xl font-bold">{tracking.totalRecipients}</div>
                          <div className="text-xs text-muted-foreground mt-1">Total Recipients</div>
                        </div>
                        <div className="bg-card p-4 rounded-xl border shadow-sm text-center">
                          <Send className="w-5 h-5 mx-auto text-indigo-500 mb-2" />
                          <div className="text-2xl font-bold">{tracking.sent}</div>
                          <div className="text-xs text-muted-foreground mt-1">Sent</div>
                        </div>
                        <div className="bg-card p-4 rounded-xl border shadow-sm text-center">
                          <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500 mb-2" />
                          <div className="text-2xl font-bold">{tracking.delivered}</div>
                          <div className="text-xs text-muted-foreground mt-1">Delivered</div>
                        </div>
                        <div className="bg-card p-4 rounded-xl border shadow-sm text-center">
                          <MailOpen className="w-5 h-5 mx-auto text-amber-500 mb-2" />
                          <div className="text-2xl font-bold">{tracking.opened}</div>
                          <div className="text-xs text-muted-foreground mt-1">Opened</div>
                        </div>
                        <div className="bg-card p-4 rounded-xl border shadow-sm text-center">
                          <MousePointerClick className="w-5 h-5 mx-auto text-purple-500 mb-2" />
                          <div className="text-2xl font-bold">{tracking.clicked}</div>
                          <div className="text-xs text-muted-foreground mt-1">Clicked</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!tracking && campaign.status === "DRAFT" && (
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Tracking data is not yet available.</p>
                        <p className="mt-1 opacity-90">Tracking metrics will appear here once the campaign is launched.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AUDIENCE TAB */}
              {activeTab === "audience" && (
                <div className="space-y-6">
                  {campaign.status !== "DRAFT" ? (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm border border-amber-200">
                      Audience cannot be modified because the campaign is no longer in DRAFT state.
                    </div>
                  ) : !canWrite ? (
                    <div className="bg-gray-50 text-gray-800 p-4 rounded-xl text-sm border">
                      You do not have permission to modify the audience.
                    </div>
                  ) : (
                    <div className="bg-card p-5 rounded-xl border shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-foreground">Define Audience</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Lifecycle Stage</label>
                          <select 
                            className="w-full text-sm p-2 border rounded-md bg-background"
                            value={audienceFilters.lifecycleStage || ""}
                            onChange={e => setAudienceFilters({ ...audienceFilters, lifecycleStage: e.target.value })}
                          >
                            <option value="">Any Stage</option>
                            <option value="LEAD">Lead</option>
                            <option value="CUSTOMER">Customer</option>
                            <option value="MARKETING_QUALIFIED">Marketing Qualified</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Search Text</label>
                          <input 
                            type="text" 
                            className="w-full text-sm p-2 border rounded-md bg-background"
                            placeholder="Search contacts..."
                            value={audienceFilters.search || ""}
                            onChange={e => setAudienceFilters({ ...audienceFilters, search: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button onClick={handlePreviewAudience} disabled={previewing} variant="outline" className="gap-2">
                          {previewing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Preview Contacts
                        </Button>
                      </div>
                    </div>
                  )}

                  {previewData && (
                    <div className="bg-card p-5 rounded-xl border shadow-sm space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground">
                          Preview Results <span className="text-muted-foreground font-normal">({previewData.total} matching)</span>
                        </h3>
                        {canWrite && campaign.status === "DRAFT" && (
                          <Button onClick={handleApplyAudience} disabled={applying || previewData.total === 0} size="sm" className="gap-2">
                            {applying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Apply Audience
                          </Button>
                        )}
                      </div>
                      
                      {previewData.contacts.length > 0 ? (
                        <div className="text-sm border rounded-lg overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-accent/50 text-muted-foreground">
                              <tr>
                                <th className="px-4 py-2 font-medium">Name</th>
                                <th className="px-4 py-2 font-medium">Email</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {previewData.contacts.slice(0, 5).map((c: any) => (
                                <tr key={c.id}>
                                  <td className="px-4 py-2">{c.firstName} {c.lastName}</td>
                                  <td className="px-4 py-2">{c.email}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {previewData.total > 5 && (
                            <div className="p-2 text-center text-xs text-muted-foreground bg-accent/10">
                              And {previewData.total - 5} more...
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No contacts match the selected filters.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* RECIPIENTS TAB */}
              {activeTab === "recipients" && (
                <div className="space-y-4">
                  {loadingRecipients ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-accent/50 text-muted-foreground border-b text-xs uppercase">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Contact</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {recipients.map((r) => (
                            <tr key={r.id}>
                              <td className="px-4 py-3 font-medium">
                                {r.contact?.firstName} {r.contact?.lastName}
                                <div className="text-xs text-muted-foreground font-normal">{r.contact?.email}</div>
                              </td>
                              <td className="px-4 py-3">
                                {canWrite ? (
                                  <select 
                                    className="text-xs p-1 border rounded"
                                    value={r.status}
                                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                                  >
                                    <option value="PENDING">PENDING</option>
                                    <option value="SENT">SENT</option>
                                    <option value="DELIVERED">DELIVERED</option>
                                    <option value="OPENED">OPENED</option>
                                    <option value="CLICKED">CLICKED</option>
                                    <option value="REPLIED">REPLIED</option>
                                    <option value="BOUNCED">BOUNCED</option>
                                    <option value="FAILED">FAILED</option>
                                  </select>
                                ) : (
                                  <span className="text-xs font-semibold">{r.status}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {canWrite && campaign.status === "DRAFT" && (
                                  <button
                                    onClick={() => handleRemoveRecipient(r.id)}
                                    className="text-xs text-destructive hover:underline"
                                  >
                                    Remove
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {recipients.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                          No recipients added yet. Go to Audience to add contacts.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};
