import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { campaignsApi, GetCampaignsParams } from "../api/campaigns.api";
import { Campaign, CampaignStatus } from "../types/api.types";
import { CampaignTable } from "../components/campaigns/CampaignTable";
import { CampaignForm } from "../components/campaigns/CampaignForm";
import { CampaignDetails } from "../components/campaigns/CampaignDetails";
import { CampaignFilters } from "../components/campaigns/CampaignFilters";
import { Button } from "../components/ui/button";
import { Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export const Campaigns: React.FC = () => {
  const { user } = useAuth();
  
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
  }, [fetchCampaigns]);

  const handleFilterChange = useCallback(
    (newFilters: { search: string; status: CampaignStatus | "" }) => {
      setFilters(newFilters);
      setPage(1); // Reset to first page on filter change
    },
    []
  );

  const handleCreateOrUpdate = async (data: Partial<Campaign>) => {
    if (editingCampaign) {
      await campaignsApi.updateCampaign(editingCampaign.id, data);
    } else {
      await campaignsApi.createCampaign(data);
    }
    fetchCampaigns();
  };

  const handleDelete = async (id: string) => {
    try {
      await campaignsApi.deleteCampaign(id);
      if (viewingCampaignId === id) setViewingCampaignId(null);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete campaign");
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your marketing campaigns and targeted email blasts.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => { setEditingCampaign(null); setIsFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Campaign
          </Button>
        )}
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
        <div className="flex flex-col items-center justify-center p-24 text-muted-foreground border rounded-xl bg-card">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p>Loading campaigns...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <CampaignTable
            campaigns={campaigns}
            canWrite={canWrite}
            onEdit={(campaign) => {
              setEditingCampaign(campaign);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
            onView={(campaign) => setViewingCampaignId(campaign.id)}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-sm font-medium px-2">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
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
    </div>
  );
};

export default Campaigns;
