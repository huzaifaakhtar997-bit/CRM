import React from "react";
import { Lead, LeadStatus, LeadSource } from "../../types/api.types";
import { Edit, Trash2, Phone, Mail, Building2, UserCircle } from "lucide-react";

interface LeadTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onView: (lead: Lead) => void;
  canWrite: boolean;
}

export const getLeadStatusBadge = (status: LeadStatus) => {
  switch (status) {
    case "NEW":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "CONTACTED":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "QUALIFIED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "LOST":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const getLeadSourceLabel = (source: LeadSource | null) => {
  if (!source) return "—";
  return source.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export const LeadTable: React.FC<LeadTableProps> = ({ leads, onEdit, onDelete, onView, canWrite }) => {
  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-accent/50 text-muted-foreground border-b uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-semibold tracking-wider">Name</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Contact Info</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
              <th className="px-6 py-4 font-semibold tracking-wider hidden md:table-cell">Source</th>
              <th className="px-6 py-4 font-semibold tracking-wider hidden lg:table-cell">Assigned To</th>
              <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leads.map((lead) => (
              <tr 
                key={lead.id} 
                className="hover:bg-accent/20 transition-colors cursor-pointer"
                onClick={() => onView(lead)}
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-foreground">
                    {lead.firstName} {lead.lastName}
                  </div>
                  {lead.jobTitle && lead.company ? (
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {lead.jobTitle} at {lead.company}
                    </div>
                  ) : lead.company ? (
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {lead.company}
                    </div>
                  ) : null}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]" title={lead.email}>
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                    {lead.phone && (
                      <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getLeadStatusBadge(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                  {getLeadSourceLabel(lead.source)}
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  {lead.assignedUser ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {lead.assignedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate text-muted-foreground max-w-[120px]">{lead.assignedUser.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserCircle className="w-5 h-5 opacity-50" />
                      <span className="text-xs">Unassigned</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {canWrite && (
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(lead)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        title="Edit Lead"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this lead?")) {
                            onDelete(lead.id);
                          }
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No leads found.
          </div>
        )}
      </div>
    </div>
  );
};
