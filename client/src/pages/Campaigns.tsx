import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { campaignsApi, GetCampaignsParams } from "../api/campaigns.api";
import { Campaign, CampaignStatus } from "../types/api.types";
import { CampaignTable } from "../components/campaigns/CampaignTable";
import { CampaignForm } from "../components/campaigns/CampaignForm";
import { CampaignDetails } from "../components/campaigns/CampaignDetails";
import { CampaignFilters } from "../components/campaigns/CampaignFilters";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";
import { RefreshButton } from "../components/ui/RefreshButton";
import { useRefreshListener } from "../hooks/useRefreshListener";
import { useToast } from "../context/ToastContext";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Pagination } from "../components/ui/Pagination";
import { TableSkeleton } from "../components/ui/TableSkeleton";

export const Campaigns: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  
  const [filters, setFilters] = useState({
    search: "",
    status: "" as CampaignStatus | "",
  });

  // UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [viewingCampaignId, setViewingCampaignId] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // RBAC
  const canWrite = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "MARKETING";

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: GetCampaignsParams = {
        page,
        limit,
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;

      const response = await campaignsApi.getCampaigns(params);
      setCampaigns(response.data.campaigns || []);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(() => {
      campaignsApi.getCampaigns({
        page,
        limit,
        search: filters.search || undefined,
        status: filters.status || undefined,
      }).then((res) => {
        setCampaigns(res.data.campaigns || []);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchCampaigns, page, filters]);

  const handleFilterChange = useCallback(
    (newFilters: { search: string; status: CampaignStatus | "" }) => {
      setFilters(newFilters);
      setPage(1); // Reset to first page on filter change
    },
    []
  );

  const handleCreateOrUpdate = async (data: Partial<Campaign>) => {
    try {
      if (editingCampaign) {
        await campaignsApi.updateCampaign(editingCampaign.id, data);
        toast.success("Campaign updated successfully.");
      } else {
        await campaignsApi.createCampaign(data);
        toast.success("Campaign created successfully.");
      }
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save campaign.");
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return;
    setDeleting(true);
    try {
      await campaignsApi.deleteCampaign(campaignToDelete.id);
      if (viewingCampaignId === campaignToDelete.id) setViewingCampaignId(null);
      toast.success(`Campaign "${campaignToDelete.name}" deleted.`);
      setCampaignToDelete(null);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete campaign");
    } finally {
      setDeleting(false);
    }
  };

  useRefreshListener(fetchCampaigns);

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Campaigns</h1>
            <span className="text-xs font-mono tabular-nums text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/60">
              {total}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage marketing email blasts and targeted customer outreach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={fetchCampaigns} />
          {canWrite && (
            <Button onClick={() => { setEditingCampaign(null); setIsFormOpen(true); }} className="gap-1.5 h-8 px-3 text-xs font-semibold">
              <Plus className="w-3.5 h-3.5" />
              Create Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <CampaignFilters onFilterChange={handleFilterChange} />

      {/* Content */}
      {error ? (
        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-center">
          <p className="font-semibold mb-2">Error Loading Campaigns</p>
          <p className="text-sm opacity-90 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchCampaigns}>Try Again</Button>
        </div>
      ) : loading && campaigns.length === 0 ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <div className="space-y-4">
          <CampaignTable
            campaigns={campaigns}
            canWrite={canWrite}
            onEdit={(campaign) => {
              setEditingCampaign(campaign);
              setIsFormOpen(true);
            }}
            onDelete={(campaign) => setCampaignToDelete(campaign)}
            onView={(campaign) => setViewingCampaignId(campaign.id)}
          />

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            itemName="campaigns"
          />
        </div>
      )}

      {/* Forms & Modals */}
      <CampaignForm
        isOpen={isFormOpen}
        initialData={editingCampaign}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCampaign(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      <CampaignDetails
        isOpen={!!viewingCampaignId}
        campaignId={viewingCampaignId}
        onClose={() => setViewingCampaignId(null)}
        canWrite={canWrite}
      />

      <ConfirmDialog
        isOpen={!!campaignToDelete}
        onClose={() => setCampaignToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${campaignToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
};

export default Campaigns;
