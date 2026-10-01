import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { leadsApi, GetLeadsParams } from "../api/leads.api";
import { Lead, LeadStatus, LeadSource } from "../types/api.types";
import { LeadTable } from "../components/leads/LeadTable";
import { LeadForm } from "../components/leads/LeadForm";
import { LeadDetails } from "../components/leads/LeadDetails";
import { LeadFilters } from "../components/leads/LeadFilters";
import { SendLeadEmailModal } from "../components/leads/SendLeadEmailModal";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";
import { RefreshButton } from "../components/ui/RefreshButton";
import { useRefreshListener } from "../hooks/useRefreshListener";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Pagination } from "../components/ui/Pagination";

export const Leads: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
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
  const [emailingLead, setEmailingLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);
  
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
    try {
      if (editingLead) {
        await leadsApi.updateLead(editingLead.id, data);
        toast.success("Lead updated successfully");
      } else {
        await leadsApi.createLead(data);
        toast.success("Lead created successfully");
      }
      fetchLeads();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save lead");
      throw err;
    }
  };

  const handleDelete = (lead: Lead) => {
    setLeadToDelete(lead);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setDeleting(true);
    try {
      await leadsApi.deleteLead(leadToDelete.id);
      if (viewingLeadId === leadToDelete.id) setViewingLeadId(null);
      toast.success(`Lead "${leadToDelete.firstName} ${leadToDelete.lastName}" deleted.`);
      setLeadToDelete(null);
      fetchLeads();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete lead");
    } finally {
      setDeleting(false);
    }
  };

  useRefreshListener(fetchLeads);

  return (
    <div className="space-y-6 max-w-full animate-in fade-in slide-in-bottom duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Raw inbound prospects — qualify and convert them into Contacts &amp; Deals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={fetchLeads} />
          {canWrite && (
            <Button onClick={() => { setEditingLead(null); setIsFormOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Lead
            </Button>
          )}
        </div>
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
      ) : (
        <div className="space-y-4">
          <LeadTable
            leads={leads}
            loading={loading}
            canWrite={canWrite}
            onEdit={(lead) => {
              setEditingLead(lead);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
            onView={(lead) => setViewingLeadId(lead.id)}
            onSendEmail={(lead) => setEmailingLead(lead)}
          />

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            itemName="leads"
          />
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
        onConverted={fetchLeads}
      />

      <SendLeadEmailModal
        lead={emailingLead}
        isOpen={!!emailingLead}
        onClose={() => setEmailingLead(null)}
        onSuccess={fetchLeads}
      />

      <ConfirmDialog
        isOpen={!!leadToDelete}
        title="Delete Lead"
        description={`Are you sure you want to delete ${leadToDelete ? `${leadToDelete.firstName} ${leadToDelete.lastName}` : "this lead"}? This action cannot be undone.`}
        confirmText="Delete Lead"
        variant="destructive"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setLeadToDelete(null)}
      />
    </div>
  );
};

export default Leads;
