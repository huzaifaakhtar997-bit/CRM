import { useEffect, useState, useCallback, useMemo } from "react";
import { dealsApi } from "../api/deals.api";
import { Deal, PipelineStage } from "../types/api.types";
import { DealBoard } from "../components/deals/DealBoard";
import { DealForm } from "../components/deals/DealForm";
import { DealDetails } from "../components/deals/DealDetails";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, AlertCircle, X } from "lucide-react";
import { RefreshButton } from "../components/ui/RefreshButton";
import { useRefreshListener } from "../hooks/useRefreshListener";

export default function Deals() {
  const { user } = useAuth();
  
  // RBAC checks
  const canWrite = ["ADMIN", "MANAGER", "SALES_REP"].includes(user?.role || "");

  // State
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals/Drawers State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch stages
      const stagesData = await dealsApi.getPipelineStages();
      setStages(stagesData.sort((a, b) => a.order - b.order));

      // 2. Fetch all deals (looping pagination to get all for Kanban)
      let allDeals: Deal[] = [];
      let currentPage = 1;
      let totalPages = 1;
      const limit = 100; // Fetch large chunks

      const trimmedSearch = debouncedSearch.trim();
      do {
        const response = await dealsApi.getDeals({
          page: currentPage,
          limit,
          search: trimmedSearch || undefined,
        });
        
        allDeals = [...allDeals, ...(response.deals || [])];
        totalPages = response.totalPages || 1;
        currentPage++;
      } while (currentPage <= totalPages);

      setDeals(allDeals);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load pipeline data.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  // Instant client-side search filter over loaded deals
  const displayedDeals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter((deal) => {
      const matchTitle = deal.title?.toLowerCase().includes(q);
      const matchCompany = deal.company?.name?.toLowerCase().includes(q);
      const contactFullName = `${deal.contact?.firstName || ""} ${deal.contact?.lastName || ""}`.trim().toLowerCase();
      const matchContact = contactFullName.includes(q) || deal.contact?.email?.toLowerCase().includes(q);
      return matchTitle || matchCompany || matchContact;
    });
  }, [deals, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleCreateNew = () => {
    setSelectedDeal(null);
    setIsFormOpen(true);
  };

  const handleEdit = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsDetailsOpen(false); // Close details if open
    setIsFormOpen(true);
  };

  const handleView = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsDetailsOpen(true);
  };

  const handleDelete = async (deal: Deal) => {
    if (window.confirm(`Are you sure you want to delete the deal "${deal.title}"?`)) {
      try {
        await dealsApi.deleteDeal(deal.id);
        setIsDetailsOpen(false);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete deal.");
      }
    }
  };

  const handleSaveDeal = async (data: Partial<Deal>) => {
    if (selectedDeal) {
      await dealsApi.updateDeal(selectedDeal.id, data);
    } else {
      await dealsApi.createDeal(data);
    }
    loadData();
  };

  const handleMoveStage = async (dealId: string, newStageId: string) => {
    try {
      await dealsApi.updateDealStage(dealId, newStageId);
      // Fetch fresh data in background to ensure sync
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update deal stage.");
      throw err; // Re-throw for DealBoard optimistic rollback
    }
  };

  useRefreshListener(loadData);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-6 animate-in fade-in slide-in-bottom duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Deals Pipeline</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your sales opportunities and track revenue.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <RefreshButton onRefresh={loadData} />
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search deals, contacts, companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-card pl-10 pr-9 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {canWrite && (
            <Button onClick={handleCreateNew} className="flex-shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </Button>
          )}
        </div>
      </div>

      {/* Search feedback indicator */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1 -mt-2">
          <span>Found {displayedDeals.length} deal{displayedDeals.length === 1 ? "" : "s"} matching "{searchQuery.trim()}"</span>
          <button
            onClick={() => setSearchQuery("")}
            className="text-primary hover:underline font-medium"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center justify-between border border-destructive/20 flex-shrink-0">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="border-destructive/30 hover:bg-destructive hover:text-white">
            Retry
          </Button>
        </div>
      )}

      {/* Main Kanban Board (flex-1 to fill remaining height) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DealBoard
          stages={stages}
          deals={displayedDeals}
          loading={loading}
          onView={handleView}
          onMoveStage={handleMoveStage}
        />
      </div>

      {/* Modals & Drawers */}
      <DealForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedDeal}
        stages={stages}
        onSave={handleSaveDeal}
      />
      
      <DealDetails
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        deal={selectedDeal}
        onEdit={canWrite ? handleEdit : undefined}
        onDelete={canWrite ? handleDelete : undefined}
        canEdit={canWrite}
      />

    </div>
  );
}
