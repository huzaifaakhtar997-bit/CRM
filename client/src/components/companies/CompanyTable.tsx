import React from "react";
import { Company } from "../../types/api.types";
import { Edit, Trash2, Eye, Building2, Globe, Users, DollarSign, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";

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

  if (loading) {
    return (
      <div className="w-full bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-accent/30 flex justify-between">
          <div className="h-5 w-32 bg-accent animate-pulse rounded"></div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="h-10 w-10 bg-accent rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-accent rounded w-1/4"></div>
                <div className="h-3 bg-accent rounded w-1/5"></div>
              </div>
              <div className="h-8 w-8 bg-accent rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="w-full bg-card border rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No companies found</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          There are no companies matching your current search or filters. Create a new company to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-accent/30 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Company Name</th>
              <th className="px-6 py-4 font-medium hidden md:table-cell">Industry & Size</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">Revenue</th>
              <th className="px-6 py-4 font-medium hidden sm:table-cell">Created</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-accent/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold border border-primary/20 flex-shrink-0 overflow-hidden">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
                      ) : (
                        company.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {company.name}
                      </div>
                      {company.website && (
                        <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                          <Globe className="w-3 h-3 mr-1" /> 
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {company.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="text-foreground font-medium flex items-center">
                    <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    {company.industry || "—"}
                  </div>
                  {company.size && (
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      {company.size} employees
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <div className="text-foreground flex items-center">
                    <DollarSign className="w-4 h-4 text-muted-foreground mr-1" />
                    {company.annualRevenue ? company.annualRevenue.toLocaleString() : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {company._count?.deals || 0} deals, {company._count?.contacts || 0} contacts
                  </div>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {new Date(company.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(company)}
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
                          onClick={() => onEdit(company)}
                          title="Edit"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(company)}
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
