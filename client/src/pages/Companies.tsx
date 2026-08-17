import { useEffect, useState, useCallback } from "react";
import { companiesApi } from "../api/companies.api";
import { Company } from "../types/api.types";
import { CompanyTable } from "../components/companies/CompanyTable";
import { CompanyForm } from "../components/companies/CompanyForm";
import { CompanyDetails } from "../components/companies/CompanyDetails";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, AlertCircle } from "lucide-react";

export default function Companies() {
  const { user } = useAuth();
  
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

  const handleDelete = async (company: Company) => {
    if (window.confirm(`Are you sure you want to delete ${company.name}? This might affect associated contacts and deals.`)) {
      try {
        await companiesApi.deleteCompany(company.id);
        loadCompanies();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete company.");
      }
    }
  };

  const handleSaveCompany = async (data: Partial<Company>) => {
    if (formMode === "CREATE") {
      await companiesApi.createCompany(data);
    } else if (selectedCompany) {
      await companiesApi.updateCompany(selectedCompany.id, data);
    }
    loadCompanies();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-bottom duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Companies</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your client organizations and accounts.
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreateNew} className="flex-shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full flex h-10 rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

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

    </div>
  );
}
