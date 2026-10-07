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
import { useToast } from "../context/ToastContext";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Pagination } from "../components/ui/Pagination";
import { Link } from "react-router-dom";

export default function Contacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  
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
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      toast.success("Contacts exported successfully");
    } catch (err: any) {
      toast.error("Failed to export contacts. Please try again.");
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

  const handleDelete = (contact: Contact) => {
    setContactToDelete(contact);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;
    setDeleting(true);
    try {
      await contactsApi.deleteContact(contactToDelete.id);
      toast.success(`Contact "${contactToDelete.firstName} ${contactToDelete.lastName}" deleted.`);
      setContactToDelete(null);
      loadContacts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete contact.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveContact = async (data: Partial<Contact>) => {
    if (formMode === "CREATE") {
      await contactsApi.createContact(data);
      toast.success("Contact created successfully");
    } else if (selectedContact) {
      await contactsApi.updateContact(selectedContact.id, data);
      toast.success("Contact updated successfully");
    }
    loadContacts();
  };

  useRefreshListener(loadContacts);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/60">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground font-display">Contacts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your customer database, lifecycle stages, and relationship ownership.
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
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          {canCreate && (
            <Button onClick={handleCreateNew} className="flex-shrink-0">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
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
          <div className="flex flex-wrap gap-1.5">
            {stages.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStageFilter(s.value)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  activeStage === s.value
                    ? "bg-secondary text-foreground font-semibold border-border/80 shadow-2xs"
                    : "bg-card text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        );
      })()}

      {/* Info Banner when viewing Leads in Contacts */}
      {activeStage === "LEAD" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 px-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-lg text-xs text-blue-950 dark:text-blue-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-700 dark:text-blue-300">Lead Stage Contacts:</span>
            <span>Showing contacts currently in the Lead lifecycle stage or converted from prospect leads.</span>
          </div>
          <Link
            to="/leads"
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View Unconverted Inbound Leads</span>
            <span>&rarr;</span>
          </Link>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-lg border border-border/80 shadow-2xs">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full flex h-8 rounded-md border border-border/80 bg-background pl-8 pr-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                className="h-8 pl-2.5 pr-7 text-xs font-medium rounded-md border border-border/80 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring shadow-2xs w-full sm:w-auto"
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
            <div className="flex bg-muted/60 p-0.5 rounded-md text-xs border border-border/50">
              <button
                type="button"
                onClick={() => {
                  setOwnerFilter("mine");
                  setPage(1);
                }}
                className={`py-1 px-2.5 rounded text-[11px] font-medium transition-all ${
                  ownerFilter === "mine"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
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
                className={`py-1 px-2.5 rounded text-[11px] font-medium transition-all ${
                  ownerFilter === "unassigned"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
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
                className={`py-1 px-2.5 rounded text-[11px] font-medium transition-all ${
                  ownerFilter === "all"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
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
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

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

      <ConfirmDialog
        isOpen={!!contactToDelete}
        title="Delete Contact"
        description={`Are you sure you want to delete ${contactToDelete ? `${contactToDelete.firstName} ${contactToDelete.lastName}` : "this contact"}? This action cannot be undone.`}
        confirmText="Delete Contact"
        variant="destructive"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setContactToDelete(null)}
      />

    </div>
  );
}
