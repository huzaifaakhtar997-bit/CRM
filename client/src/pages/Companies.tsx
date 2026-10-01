import { useEffect, useState, useCallback } from "react";
import { companiesApi } from "../api/companies.api";
import { Company } from "../types/api.types";
import { CompanyTable } from "../components/companies/CompanyTable";
import { CompanyForm } from "../components/companies/CompanyForm";
import { CompanyDetails } from "../components/companies/CompanyDetails";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Pagination } from "../components/ui/Pagination";
import { Plus, Search, AlertCircle } from "lucide-react";
import { RefreshButton } from "../components/ui/RefreshButton";
import { useRefreshListener } from "../hooks/useRefreshListener";

export default function Companies() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // RBAC checks
  const canCreate = ["ADMIN", "MANAGER", "SALES_REP"].includes(user?.role || "");

  // State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals/Drawers State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formMode, setFormMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companiesApi.getCompanies({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
      });
      setCompanies(data.companies || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Handlers
  const handleCreateNew = () => {
    setSelectedCompany(null);
    setFormMode("CREATE");
    setIsFormOpen(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setFormMode("EDIT");
    setIsFormOpen(true);
  };

  const handleView = (company: Company) => {
    setSelectedCompany(company);
    setIsDetailsOpen(true);
  };

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;
    setDeleting(true);
    try {
      await companiesApi.deleteCompany(companyToDelete.id);
      setIsDetailsOpen(false);
      toast.success(`Company "${companyToDelete.name}" deleted.`);
      setCompanyToDelete(null);
      loadCompanies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete company.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveCompany = async (data: Partial<Company>) => {
    try {
      if (formMode === "CREATE") {
        await companiesApi.createCompany(data);
        toast.success("Company created successfully");
      } else if (selectedCompany) {
        await companiesApi.updateCompany(selectedCompany.id, data);
        toast.success("Company updated successfully");
      }
      loadCompanies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save company.");
      throw err;
    }
  };

  useRefreshListener(loadCompanies);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/60">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground font-display">Companies</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your account directory, corporate hierarchies, and industry sectors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={loadCompanies} />
          {canCreate && (
            <Button onClick={handleCreateNew} className="flex-shrink-0">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Company
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-lg border border-border/80 shadow-2xs">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full flex h-8 rounded-md border border-border/80 bg-background pl-8 pr-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center justify-between border border-destructive/20">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadCompanies} className="border-destructive/30 hover:bg-destructive hover:text-white">
            Retry
          </Button>
        </div>
      )}

      {/* Main Table */}
      <div className="min-h-[400px]">
        <CompanyTable
          companies={companies}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Pagination Controls */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        itemName="companies"
      />

      {/* Modals & Drawers */}
      <CompanyForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={formMode === "EDIT" ? selectedCompany : null}
        onSave={handleSaveCompany}
      />
      
      <CompanyDetails
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        company={selectedCompany}
      />

      <ConfirmDialog
        isOpen={!!companyToDelete}
        title="Delete Company"
        description={`Are you sure you want to delete ${companyToDelete?.name}? This action cannot be undone and may affect associated contacts and deals.`}
        confirmText="Delete Company"
        variant="destructive"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setCompanyToDelete(null)}
      />

    </div>
  );
}
