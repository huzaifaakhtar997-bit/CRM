import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Contact } from "../../types/api.types";
import { ArrowRight, AlertCircle, Users } from "lucide-react";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";

interface RecentContactsProps {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const RecentContacts: React.FC<RecentContactsProps> = ({
  contacts,
  loading,
  error,
  onRetry,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border/80 rounded-lg shadow-2xs flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/70">
        <div>
          <h3 className="font-semibold text-sm text-foreground tracking-tight">Recent Contacts</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Latest leads and customers</p>
        </div>
        <Link
          to="/contacts"
          className="text-xs font-semibold text-foreground hover:text-muted-foreground inline-flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-0 flex-1 overflow-x-auto">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-9 w-9 bg-muted rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-3.5 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <AlertCircle className="w-7 h-7 text-destructive/60 mb-2" />
            <p className="text-sm font-medium text-foreground">Unable to load recent contacts</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">{error}</p>
            <button
              onClick={onRetry}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts yet"
            description="Create your first contact to start building relationships."
            actionLabel="Add Contact"
            onAction={() => navigate("/contacts")}
            className="border-0 shadow-none py-8"
          />
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border/70">
              <tr>
                <th className="px-4 py-2 font-medium">Contact</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Company</th>
                <th className="px-4 py-2 font-medium text-right">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  onClick={() => navigate("/contacts")}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-secondary text-foreground flex items-center justify-center text-[11px] font-bold shrink-0 border border-border/70">
                        {contact.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-foreground truncate group-hover:text-foreground transition-colors">
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                          {contact.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-muted-foreground truncate max-w-[120px]">
                    {contact.company?.name || contact.companyName || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Badge variant={contact.lifecycleStage === "CUSTOMER" ? "success" : "neutral"}>
                      {contact.lifecycleStage?.replace("_", " ") || "LEAD"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
