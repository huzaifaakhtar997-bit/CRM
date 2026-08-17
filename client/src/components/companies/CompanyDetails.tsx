import React from "react";
import { Company } from "../../types/api.types";
import { Button } from "../ui/button";
import { X, Mail, Phone, Building2, Globe, DollarSign, Users, FileText, Calendar } from "lucide-react";

interface CompanyDetailsProps {
  company: Company | null;
  onClose: () => void;
  isOpen: boolean;
}

export const CompanyDetails: React.FC<CompanyDetailsProps> = ({
  company,
  onClose,
  isOpen,
}) => {
  if (!isOpen || !company) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md h-full border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Company Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Header Profile */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold border border-primary/20 overflow-hidden shadow-sm">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
              ) : (
                company.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {company.name}
              </h3>
              <div className="text-sm text-muted-foreground mt-1 flex items-center">
                <Building2 className="w-4 h-4 mr-1.5" />
                {company.industry || "No Industry"}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
              Contact Information
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <Globe className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Website</div>
                  <div className="text-sm text-muted-foreground">
                    {company.website ? (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <Mail className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Email</div>
                  <div className="text-sm text-muted-foreground">
                    {company.email ? (
                      <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                        {company.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Phone</div>
                  <div className="text-sm text-muted-foreground">
                    {company.phone ? (
                      <a href={`tel:${company.phone}`} className="text-primary hover:underline">
                        {company.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
              Company Profile
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <Users className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Company Size</div>
                  <div className="text-sm text-muted-foreground">
                    {company.size ? `${company.size} employees` : "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <DollarSign className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Annual Revenue</div>
                  <div className="text-sm text-muted-foreground">
                    {company.annualRevenue ? `$${company.annualRevenue.toLocaleString()}` : "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Created Date</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
              CRM Metrics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-accent/30 p-4 rounded-xl border">
                <div className="text-2xl font-bold text-foreground">
                  {company._count?.deals || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Associated Deals</div>
              </div>
              <div className="bg-accent/30 p-4 rounded-xl border">
                <div className="text-2xl font-bold text-foreground">
                  {company._count?.contacts || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Associated Contacts</div>
              </div>
            </div>
          </div>

          {company.description && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
                Description
              </h4>
              <div className="flex items-start bg-accent/30 p-3 rounded-lg">
                <FileText className="w-4 h-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {company.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
