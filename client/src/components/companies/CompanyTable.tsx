import React from "react";
import { Company } from "../../types/api.types";
import { Edit, Trash2, Eye, Building2, Globe, Users, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { TableSkeleton } from "../ui/TableSkeleton";
import { EmptyState } from "../ui/EmptyState";

interface CompanyTableProps {
  companies: Company[];
  loading: boolean;
  onView: (company: Company) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

export const CompanyTable: React.FC<CompanyTableProps> = ({
  companies,
  loading,
  onView,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  
  // RBAC checks
  const canEdit = ["ADMIN", "MANAGER", "SALES_REP"].includes(user?.role || "");

  return (
    <div className="w-full bg-card border border-border/80 rounded-lg overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border/70">
            <tr>
              <th className="px-4 py-2 font-medium">Company Name</th>
              <th className="px-4 py-2 font-medium hidden md:table-cell">Industry & Size</th>
              <th className="px-4 py-2 font-medium hidden lg:table-cell text-right">Revenue</th>
              <th className="px-4 py-2 font-medium hidden sm:table-cell">Created</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <TableSkeleton columns={5} rows={5} />
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState
                    icon={Building2}
                    title="No companies found"
                    description="There are no companies matching your current search. Create a new company to get started."
                  />
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr
                  key={company.id}
                  onClick={() => onView(company)}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center text-foreground font-semibold border border-border/70 flex-shrink-0 overflow-hidden text-xs">
                        {company.logoUrl ? (
                          <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
                        ) : (
                          company.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-foreground group-hover:text-foreground transition-colors">
                          {company.name}
                        </div>
                        {company.website && (
                          <div className="text-[11px] text-muted-foreground flex items-center mt-0.5" onClick={(e) => e.stopPropagation()}>
                            <Globe className="w-3 h-3 mr-1 text-muted-foreground/70" /> 
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-foreground">
                              {company.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <div className="text-foreground font-medium flex items-center text-xs">
                      <Building2 className="w-3 h-3 mr-1.5 text-muted-foreground/70" />
                      {company.industry || "—"}
                    </div>
                    {company.size && (
                      <div className="text-[11px] text-muted-foreground flex items-center mt-0.5">
                        <Users className="w-3 h-3 mr-1.5 text-muted-foreground/70" />
                        {company.size} employees
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell text-right">
                    <div className="text-foreground font-semibold font-mono tabular-nums text-xs">
                      {company.annualRevenue ? `$${company.annualRevenue.toLocaleString()}` : "—"}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {company._count?.deals || 0} deals, {company._count?.contacts || 0} contacts
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground text-[11px] font-mono tabular-nums">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-muted-foreground/70" />
                      {new Date(company.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(company)}
                        title="View Details"
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(company)}
                            title="Edit Company"
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(company)}
                            title="Delete Company"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
