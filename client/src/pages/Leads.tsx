import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { leadsApi, GetLeadsParams } from "../api/leads.api";
import { Lead, LeadStatus, LeadSource } from "../types/api.types";
import { LeadTable } from "../components/leads/LeadTable";
import { LeadForm } from "../components/leads/LeadForm";
import { LeadDetails } from "../components/leads/LeadDetails";
import { LeadFilters } from "../components/leads/LeadFilters";
import { Button } from "../components/ui/button";
import { Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export const Leads: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  
  const [filters, setFilters] = useState({
    search: "",
    status: "" as LeadStatus | "",
    source: "" as LeadSource | "",
  });

  // UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  
  // RBAC
  const canWrite = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "SALES_REP";

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: GetLeadsParams = {
        page,
        limit,
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.source) params.source = filters.source;

      const response = await leadsApi.getLeads(params);
      setLeads(response.data.leads || []);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleFilterChange = useCallback(
    (newFilters: { search: string; status: LeadStatus | ""; source: LeadSource | "" }) => {
      setFilters(newFilters);
      setPage(1); // Reset to first page on filter change
    },
    []
  );

  const handleCreateOrUpdate = async (data: Partial<Lead>) => {
    if (editingLead) {
      await leadsApi.updateLead(editingLead.id, data);
    } else {
      await leadsApi.createLead(data);
    }
    fetchLeads();
  };

  const handleDelete = async (id: string) => {
    try {
      await leadsApi.deleteLead(id);
      if (viewingLeadId === id) setViewingLeadId(null);
      fetchLeads();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete lead");
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your leads, prospects, and incoming requests.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => { setEditingLead(null); setIsFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        )}
      </div>

      {/* Filters */}
      <LeadFilters onFilterChange={handleFilterChange} />

      {/* Content */}
      {error ? (
        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-center">
          <p className="font-semibold mb-2">Error Loading Leads</p>
          <p className="text-sm opacity-90 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchLeads}>Try Again</Button>
        </div>
      ) : loading && leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 text-muted-foreground border rounded-xl bg-card">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p>Loading leads...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <LeadTable
            leads={leads}
            canWrite={canWrite}
            onEdit={(lead) => {
              setEditingLead(lead);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
            onView={(lead) => setViewingLeadId(lead.id)}
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
      <LeadForm
        isOpen={isFormOpen}
        initialData={editingLead}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLead(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      <LeadDetails
        isOpen={!!viewingLeadId}
        leadId={viewingLeadId}
        onClose={() => setViewingLeadId(null)}
        canWrite={canWrite}
        onEdit={(lead) => {
          setEditingLead(lead);
          setIsFormOpen(true);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Leads;
