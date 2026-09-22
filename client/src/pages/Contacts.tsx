import { useEffect, useState, useCallback } from "react";
import { contactsApi } from "../api/contacts.api";
import { Contact } from "../types/api.types";
import { ContactTable } from "../components/contacts/ContactTable";
import { ContactForm } from "../components/contacts/ContactForm";
import { ContactDetails } from "../components/contacts/ContactDetails";
import { SendEmailModal } from "../components/contacts/SendEmailModal";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, AlertCircle, Download } from "lucide-react";
import { RefreshButton } from "../components/ui/RefreshButton";
import { useRefreshListener } from "../hooks/useRefreshListener";
import { usersApi, CRMUser } from "../api/users.api";

export default function Contacts() {
  const { user } = useAuth();
  
  // RBAC checks
  const canCreate = ["ADMIN", "MANAGER", "SALES_REP"].includes(user?.role || "");
  const isAdminOrManager = ["ADMIN", "MANAGER"].includes(user?.role || "");

  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Owner filter
  const [ownerFilter, setOwnerFilter] = useState<string>(isAdminOrManager ? "all" : "mine");
  const [users, setUsers] = useState<CRMUser[]>([]);

  useEffect(() => {
    usersApi.getAllUsers().then(setUsers).catch(console.error);
  }, []);
  
  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Lifecycle stage filter
  const [activeStage, setActiveStage] = useState<string>("");

  // Modals/Drawers State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [emailTargetContact, setEmailTargetContact] = useState<Contact | null>(null);
  const [formMode, setFormMode] = useState<"CREATE" | "EDIT">("CREATE");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let queryAssignedUserId: string | undefined = undefined;
      if (ownerFilter === "mine") {
        queryAssignedUserId = user?.id;
      } else if (ownerFilter === "unassigned") {
        queryAssignedUserId = "unassigned";
      } else if (ownerFilter !== "all") {
        queryAssignedUserId = ownerFilter;
      }

      const data = await contactsApi.getContacts({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        lifecycleStage: activeStage || undefined,
        assignedUserId: queryAssignedUserId,
      });
      setContacts(data.contacts || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeStage, ownerFilter, user?.id]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Reset to page 1 when lifecycle stage filter changes
  const handleStageFilter = (stage: string) => {
    setActiveStage(stage);
    setPage(1);
  };

  // Handlers
  const handleCreateNew = () => {
    setSelectedContact(null);
    setFormMode("CREATE");
    setIsFormOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await contactsApi.exportContacts({ search: debouncedSearch || undefined });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Failed to export contacts. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setFormMode("EDIT");
    setIsFormOpen(true);
  };

  const handleView = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDetailsOpen(true);
  };

  const handleOpenSendEmail = (contact: Contact) => {
    setEmailTargetContact(contact);
    setIsSendEmailOpen(true);
  };

  const handleDelete = async (contact: Contact) => {
    if (window.confirm(`Are you sure you want to delete ${contact.firstName} ${contact.lastName}?`)) {
      try {
        await contactsApi.deleteContact(contact.id);
        loadContacts();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete contact.");
      }
    }
  };

  const handleSaveContact = async (data: Partial<Contact>) => {
    if (formMode === "CREATE") {
      await contactsApi.createContact(data);
    } else if (selectedContact) {
      await contactsApi.updateContact(selectedContact.id, data);
    }
    loadContacts();
  };

  useRefreshListener(loadContacts);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-bottom duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your CRM contacts, customers, and leads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={loadContacts} />
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-shrink-0"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          {canCreate && (
            <Button onClick={handleCreateNew} className="flex-shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          )}
        </div>
      </div>

      {/* Lifecycle Stage Filter Tabs */}
      {(() => {
        const stages = [
          { label: "All", value: "" },
          { label: "Leads", value: "LEAD" },
          { label: "MQL", value: "MQL" },
          { label: "SQL", value: "SQL" },
          { label: "Opportunities", value: "OPPORTUNITY" },
          { label: "Customers", value: "CUSTOMER" },
        ];
        return (
          <div className="flex flex-wrap gap-2">
            {stages.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStageFilter(s.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeStage === s.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-input hover:border-primary hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        );
      })()}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full flex h-10 rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Owner / Assignee Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isAdminOrManager ? (
            <div className="relative w-full sm:w-auto">
              <select
                value={ownerFilter}
                onChange={(e) => {
                  setOwnerFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 pl-3 pr-8 text-xs font-medium rounded-md border border-input bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs w-full sm:w-auto"
              >
                <option value="all">All Contacts</option>
                <option value="mine">My Contacts</option>
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
                onClick={() => {
                  setOwnerFilter("mine");
                  setPage(1);
                }}
                className={`py-1.5 px-3 rounded-md font-medium transition-all ${
                  ownerFilter === "mine"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Contacts
              </button>
              <button
                type="button"
                onClick={() => {
                  setOwnerFilter("unassigned");
                  setPage(1);
                }}
                className={`py-1.5 px-3 rounded-md font-medium transition-all ${
                  ownerFilter === "unassigned"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Unassigned
              </button>
              <button
                type="button"
                onClick={() => {
                  setOwnerFilter("all");
                  setPage(1);
                }}
                className={`py-1.5 px-3 rounded-md font-medium transition-all ${
                  ownerFilter === "all"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center justify-between border border-destructive/20">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadContacts} className="border-destructive/30 hover:bg-destructive hover:text-white">
            Retry
          </Button>
        </div>
      )}

      {/* Main Table */}
      <div className="min-h-[400px]">
        <ContactTable
          contacts={contacts}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSendEmail={handleOpenSendEmail}
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
      <ContactForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={formMode === "EDIT" ? selectedContact : null}
        onSave={handleSaveContact}
      />
      
      <ContactDetails
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        contact={selectedContact}
        onSendEmail={handleOpenSendEmail}
      />

      <SendEmailModal
        isOpen={isSendEmailOpen}
        onClose={() => setIsSendEmailOpen(false)}
        contact={emailTargetContact}
      />

    </div>
  );
}
