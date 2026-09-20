import React from "react";
import { Contact, LifecycleStage } from "../../types/api.types";
import { Edit, Trash2, Eye, Building2, Mail, Phone, Clock, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";

interface ContactTableProps {
  contacts: Contact[];
  loading: boolean;
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onSendEmail?: (contact: Contact) => void;
}

export const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  loading,
  onView,
  onEdit,
  onDelete,
  onSendEmail,
}) => {
  const { user } = useAuth();
  
  // RBAC checks
  const canEdit = ["ADMIN", "MANAGER", "SALES_REP"].includes(user?.role || "");

  if (loading && contacts.length === 0) {
    return (
      <div className="w-full bg-card border rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground">Loading contacts...</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="w-full bg-card border rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No contacts found</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          There are no contacts matching your current search or filters. Create a new contact to get started.
        </p>
      </div>
    );
  }

  const getStageColor = (stage: LifecycleStage | string) => {
    const colors: Record<string, string> = {
      LEAD: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
      MQL: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
      SQL: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
      OPPORTUNITY: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
      CUSTOMER: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
      CHURNED: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200";
  };

  return (
    <div className="w-full bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-accent/30 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Contact Details</th>
              <th className="px-6 py-4 font-medium hidden md:table-cell">Company & Title</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">Lifecycle Stage</th>
              <th className="px-6 py-4 font-medium hidden sm:table-cell">Created</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-accent/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold border border-primary/20 flex-shrink-0">
                      {contact.firstName[0]}
                      {contact.lastName[0]}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {contact.firstName} {contact.lastName}
                      </div>
                      {contact.email && (
                        <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                          <Mail className="w-3 h-3 mr-1" /> {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="text-xs text-muted-foreground flex items-center mt-0.5 sm:hidden">
                          <Phone className="w-3 h-3 mr-1" /> {contact.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="text-foreground font-medium">
                    {contact.company?.name || contact.companyName || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {contact.jobTitle || "—"}
                  </div>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStageColor(contact.lifecycleStage)}`}>
                      {contact.lifecycleStage === "CUSTOMER" && Boolean(contact.hasWonDeal || contact.deals?.length) && (
                        <Lock className="w-2.5 h-2.5 shrink-0 opacity-80" />
                      )}
                      {contact.lifecycleStage.replace("_", " ")}
                    </span>
                    {contact.status && (
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {contact.status}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSendEmail?.(contact)}
                      title={contact.email ? `Send Email to ${contact.email}` : "No email address"}
                      disabled={!contact.email}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary disabled:opacity-30"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(contact)}
                      title="View Details"
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {canEdit && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(contact)}
                          title="Edit"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(contact)}
                          title="Delete"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
