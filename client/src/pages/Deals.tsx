import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import { usersApi, CRMUser } from "../api/users.api";

export default function Deals() {
  const { user } = useAuth();
  
  // RBAC checks
  const canWrite = ["ADMIN", "MANAGER", "SALES_REP"].includes(user?.role || "");
  const isAdminOrManager = ["ADMIN", "MANAGER"].includes(user?.role || "");

  // State
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Rep / Ownership filter
  const [repFilter, setRepFilter] = useState<string>(isAdminOrManager ? "all" : "mine");
  const [users, setUsers] = useState<CRMUser[]>([]);

  // Search state & interactive popup
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    usersApi.getAllUsers().then(setUsers).catch(console.error);
  }, []);


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

      let queryAssignedUserId: string | undefined = undefined;
      if (repFilter === "mine") {
        queryAssignedUserId = user?.id;
      } else if (repFilter === "unassigned") {
        queryAssignedUserId = "unassigned";
      } else if (repFilter !== "all") {
        queryAssignedUserId = repFilter;
      }

      const trimmedSearch = debouncedSearch.trim();
      do {
        const response = await dealsApi.getDeals({
          page: currentPage,
          limit,
          search: trimmedSearch || undefined,
          assignedUserId: queryAssignedUserId,
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
  }, [debouncedSearch, repFilter, user?.id]);

  // Instant client-side search and ownership filter over loaded deals
  const isDealAssignedToUser = useCallback((deal: Deal, targetUserId: string) => {
    if (deal.assignedUserId === targetUserId) return true;
    if (deal.contact?.assignedUserId === targetUserId) return true;
    if (deal.contact?.conversations?.some((c) => c.assignedUserId === targetUserId)) return true;
    return false;
  }, []);

  const isDealUnassigned = useCallback((deal: Deal) => {
    if (deal.assignedUserId) return false;
    if (deal.contact?.assignedUserId) return false;
    if (deal.contact?.conversations?.some((c) => c.assignedUserId)) return false;
    return true;
  }, []);

  const displayedDeals = useMemo(() => {
    let filtered = deals;
    if (repFilter === "mine" && user?.id) {
      filtered = filtered.filter((d) => isDealAssignedToUser(d, user.id));
    } else if (repFilter === "unassigned") {
      filtered = filtered.filter(isDealUnassigned);
    } else if (repFilter !== "all") {
      filtered = filtered.filter((d) => isDealAssignedToUser(d, repFilter));
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter((deal) => {
      const matchTitle = deal.title?.toLowerCase().includes(q);
      const matchCompany = deal.company?.name?.toLowerCase().includes(q);
      const contactFullName = `${deal.contact?.firstName || ""} ${deal.contact?.lastName || ""}`.trim().toLowerCase();
      const matchContact = contactFullName.includes(q) || deal.contact?.email?.toLowerCase().includes(q);
      return matchTitle || matchCompany || matchContact;
    });
  }, [deals, searchQuery, repFilter, user?.id, isDealAssignedToUser, isDealUnassigned]);

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
        <div className="flex flex-wrap items-center gap-3">
          <RefreshButton onRefresh={loadData} />
          
          {/* Rep / Ownership Filter */}
          {isAdminOrManager ? (
            <div className="relative">
              <select
                value={repFilter}
                onChange={(e) => setRepFilter(e.target.value)}
                className="h-10 pl-3 pr-8 text-xs font-medium rounded-md border border-input bg-card text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
              >
                <option value="all">All Reps</option>
                <option value="mine">My Deals</option>
                <option value="unassigned">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex bg-muted/60 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setRepFilter("mine")}
                className={`py-1.5 px-3 rounded-md font-medium transition-all ${
                  repFilter === "mine"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Deals
              </button>
              <button
                type="button"
                onClick={() => setRepFilter("unassigned")}
                className={`py-1.5 px-3 rounded-md font-medium transition-all ${
                  repFilter === "unassigned"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Unassigned
              </button>
            </div>
          )}

          <div ref={searchContainerRef} className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search deals, contacts, companies..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchPopup(true);
              }}
              onFocus={() => setShowSearchPopup(true)}
              className="w-full flex h-10 rounded-md border border-input bg-card pl-10 pr-9 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchPopup(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Interactive Search Results Popup */}
            {showSearchPopup && searchQuery.trim() && (
              <div
                className="absolute left-0 top-full mt-2 w-full sm:w-80 md:w-96 bg-card border rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-border animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 bg-muted/40 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Deals Found ({displayedDeals.length})</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Click to open deal</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                  {displayedDeals.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No matching deals found.
                    </div>
                  ) : (
                    displayedDeals.slice(0, 6).map((deal) => (
                      <div
                        key={deal.id}
                        onClick={() => {
                          handleView(deal);
                          setShowSearchPopup(false);
                        }}
                        className="p-3 hover:bg-accent/40 cursor-pointer transition-colors flex flex-col gap-1 text-left group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {deal.title}
                          </span>
                          <span className="text-xs font-bold text-foreground shrink-0">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency || 'USD', maximumFractionDigits: 0 }).format(deal.value)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="truncate max-w-[180px]">
                            {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : deal.company?.name || "No client"}
                          </span>
                          {deal.stage && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shrink-0 shadow-2xs"
                              style={{ backgroundColor: deal.stage.color || '#3b82f6' }}
                            >
                              {deal.stage.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {displayedDeals.length > 6 && (
                  <div className="p-2 text-center text-[11px] text-muted-foreground bg-muted/20">
                    +{displayedDeals.length - 6} more matching deals on board
                  </div>
                )}
              </div>
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
